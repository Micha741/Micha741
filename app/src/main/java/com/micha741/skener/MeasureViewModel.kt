package com.micha741.skener

import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.PointF
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.AutoCalibrationSuggestion
import com.micha741.skener.data.CalibrationPoints
import com.micha741.skener.data.MeasureAutoCalibrator
import com.micha741.skener.data.MeasuredSegment
import com.micha741.skener.data.distanceCm
import com.micha741.skener.data.isLikelyUnreliable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MeasureUiState(
    val photoUri: Uri? = null,
    val photoWidth: Int = 0,
    val photoHeight: Int = 0,
    /** Set once the user has tapped two points on a known real-world distance and confirmed its length. Null means every tap still picks calibration points, not measurements. */
    val calibration: CalibrationPoints? = null,
    val segments: List<MeasuredSegment> = emptyList(),
    /** The first of the current pair of taps, waiting on a second one to complete a calibration or measurement segment. */
    val pendingPoint: PointF? = null,
    /** Set the instant a *calibration* pair's second point lands - the UI shows a dialog asking for its real length while this is non-null, rather than computing anything yet. */
    val pendingCalibrationSegment: Pair<PointF, PointF>? = null,
    /** True while [MeasureAutoCalibrator] is running on the current photo. */
    val isDetectingAutoCalibration: Boolean = false,
    /** [MeasureAutoCalibrator]'s proposed calibration, waiting on the user to confirm or reject it - see [confirmAutoCalibration]/[dismissAutoCalibrationSuggestion]. */
    val autoCalibrationSuggestion: AutoCalibrationSuggestion? = null,
    val errorMessage: String? = null,
) {
    val isCalibrated: Boolean get() = calibration != null
}

/**
 * Backs the "Měřit" screen: tap two points on a known real-world distance
 * (a ruler, the edge of a sheet of paper) to calibrate a photo's scale,
 * then tap further pairs to measure other distances on it - the same
 * "anchor everything to one thing the user tells it" idea as
 * [CountingViewModel]'s reference piece, applied to distance instead of
 * count. [photoWidth]/[photoHeight] come from a bounds-only decode (see
 * [onPhotoSelected]) since [com.micha741.skener.data.distanceCm] needs the
 * photo's *true* pixel dimensions, not just the tapped fractions, to get a
 * diagonal line's length right on a non-square photo.
 */
class MeasureViewModel(
    private val appContext: Context,
    private val autoCalibrator: MeasureAutoCalibrator,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MeasureUiState())
    val uiState: StateFlow<MeasureUiState> = _uiState.asStateFlow()

    fun onPhotoSelected(uri: Uri) {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        appContext.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            _uiState.update { it.copy(errorMessage = appContext.getString(R.string.measure_failed)) }
            return
        }
        _uiState.value = MeasureUiState(photoUri = uri, photoWidth = bounds.outWidth, photoHeight = bounds.outHeight)
    }

    /** User tapped [point] (fractional, 0f..1f on the photo) - the first tap of a pair just gets remembered; the second either opens the calibration dialog (not calibrated yet) or immediately measures a new segment (already calibrated). */
    fun onTap(point: PointF) {
        val state = _uiState.value
        val first = state.pendingPoint
        if (first == null) {
            _uiState.update { it.copy(pendingPoint = point) }
            return
        }

        val calibration = state.calibration
        if (calibration == null) {
            _uiState.update { it.copy(pendingPoint = null, pendingCalibrationSegment = first to point) }
        } else {
            val lengthCm = distanceCm(first, point, state.photoWidth, state.photoHeight, calibration)
            val unreliable = isLikelyUnreliable(first, point, calibration)
            _uiState.update {
                it.copy(pendingPoint = null, segments = it.segments + MeasuredSegment(first, point, lengthCm, unreliable))
            }
        }
    }

    /** User confirmed the real length of the pending calibration segment (see [MeasureUiState.pendingCalibrationSegment]). No-op if there's nothing pending, or the length isn't a plausible positive number. */
    fun confirmCalibration(realLengthCm: Float) {
        val pending = _uiState.value.pendingCalibrationSegment ?: return
        if (realLengthCm <= 0f) return
        _uiState.update {
            it.copy(
                calibration = CalibrationPoints(pending.first, pending.second, realLengthCm),
                pendingCalibrationSegment = null,
            )
        }
    }

    /** User dismissed the calibration dialog without entering a length - drops the pending pair, back to tapping a fresh calibration pair. */
    fun cancelCalibration() {
        _uiState.update { it.copy(pendingCalibrationSegment = null) }
    }

    /**
     * Runs [MeasureAutoCalibrator] on the current photo looking for a common
     * object of known size (a sheet of A4 paper, a payment/ID card) to
     * propose calibrating from, instead of the user tapping two points and
     * typing a length by hand. Sets [MeasureUiState.autoCalibrationSuggestion]
     * for the UI to show a confirm/reject prompt, or an error message if
     * nothing was found confidently.
     */
    fun detectAutoCalibration() {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isDetectingAutoCalibration = true) }
        viewModelScope.launch {
            autoCalibrator.detect(uri)
                .onSuccess { suggestion ->
                    _uiState.update {
                        it.copy(
                            isDetectingAutoCalibration = false,
                            autoCalibrationSuggestion = suggestion,
                            errorMessage = if (suggestion == null) {
                                appContext.getString(R.string.measure_auto_calibration_not_found)
                            } else {
                                it.errorMessage
                            },
                        )
                    }
                }
                .onFailure { exception ->
                    val message = exception.message ?: appContext.getString(R.string.measure_failed)
                    _uiState.update { it.copy(isDetectingAutoCalibration = false, errorMessage = message) }
                }
        }
    }

    /** User accepted [MeasureUiState.autoCalibrationSuggestion] - applies it as the active calibration, same as confirming a manual one. */
    fun confirmAutoCalibration() {
        val suggestion = _uiState.value.autoCalibrationSuggestion ?: return
        _uiState.update {
            it.copy(
                calibration = CalibrationPoints(suggestion.a, suggestion.b, suggestion.realLengthCm),
                autoCalibrationSuggestion = null,
            )
        }
    }

    /** User rejected [MeasureUiState.autoCalibrationSuggestion] - drops it, back to tapping a calibration pair by hand. */
    fun dismissAutoCalibrationSuggestion() {
        _uiState.update { it.copy(autoCalibrationSuggestion = null) }
    }

    /** Drops the current scale and every measurement made with it, back to tapping a fresh calibration pair - for when the reference distance itself needs to change. */
    fun recalibrate() {
        _uiState.update { it.copy(calibration = null, segments = emptyList(), pendingPoint = null) }
    }

    /** User long-pressed a measured segment's label to remove it. */
    fun removeSegment(segment: MeasuredSegment) {
        _uiState.update { it.copy(segments = it.segments - segment) }
    }

    fun reset() {
        _uiState.value = MeasureUiState()
    }

    fun consumeError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    override fun onCleared() {
        autoCalibrator.close()
    }
}
