package com.micha741.skener

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.graphics.RectF
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.CountingResultEncoder
import com.micha741.skener.data.DetectedBlob
import com.micha741.skener.data.ObjectCounter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class CountingUiState(
    val photoUri: Uri? = null,
    val blobs: List<DetectedBlob> = emptyList(),
    val count: Int? = null,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
    /** True once a reference piece was successfully picked - the count above is "similar to that piece" only. */
    val referenceActive: Boolean = false,
    val referenceBox: Rect? = null,
    /** Detected blobs the user manually excluded (long-press on a wrongly-detected piece). */
    val excludedBoxes: Set<Rect> = emptySet(),
    /** Pieces the user manually marked (long-press on empty space the detector missed), each worth one piece. */
    val manualAdditions: List<Point> = emptyList(),
    /** Region of interest the user dragged out, fractional (0f..1f on each edge, relative to the photo) - detections outside it are discarded entirely, before reference/outlier filtering. Fractional rather than pixel coordinates so a region picked in the live camera can carry over to a captured photo of a completely different resolution. Null means the whole photo counts. */
    val roiBox: RectF? = null,
    /** See [com.micha741.skener.data.hasSuspiciouslyLargeBlob] - a hint (not auto-corrected) that some pieces may be touching/merged. */
    val hasSuspiciousBlob: Boolean = false,
) {
    /** [count] adjusted for manual corrections: excluded blobs subtracted, manual additions added. */
    val adjustedCount: Int
        get() {
            val base = count ?: return manualAdditions.size
            val excludedCount = blobs.count { it.box in excludedBoxes }
            return (base - excludedCount + manualAdditions.size).coerceAtLeast(0)
        }
}

class CountingViewModel(
    private val appContext: Context,
    private val counter: ObjectCounter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CountingUiState())
    val uiState: StateFlow<CountingUiState> = _uiState.asStateFlow()

    /** [roi] carries over a region of interest already selected elsewhere (the live camera's capture button passes along whatever ROI was active there) - see [CountingUiState.roiBox] on why it's fractional. */
    fun onPhotoSelected(uri: Uri, roi: RectF? = null) {
        _uiState.value = CountingUiState(photoUri = uri, isProcessing = true, roiBox = roi)
        runCount(uri, referenceTap = null, roi = roi)
    }

    /** User tapped a piece in the result photo (in original photo pixel coordinates): count only similar pieces. */
    fun onReferenceTap(point: Point) {
        val uri = _uiState.value.photoUri ?: return
        val roi = _uiState.value.roiBox
        _uiState.update { it.copy(isProcessing = true) }
        runCount(uri, referenceTap = point, roi = roi)
    }

    /** Drops the reference piece and goes back to counting every detected piece (within the ROI, if one is set). */
    fun clearReference() {
        val uri = _uiState.value.photoUri ?: return
        val roi = _uiState.value.roiBox
        _uiState.update { it.copy(isProcessing = true, referenceActive = false, referenceBox = null) }
        runCount(uri, referenceTap = null, roi = roi)
    }

    /** User dragged out a rectangle (fractional, see [CountingUiState.roiBox]): only detections inside it count from now on. Drops any reference piece, since it may no longer be in view. */
    fun setRoi(rect: RectF) {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isProcessing = true, roiBox = rect, referenceActive = false, referenceBox = null) }
        runCount(uri, referenceTap = null, roi = rect)
    }

    /** Drops the region of interest and goes back to counting the whole photo. */
    fun clearRoi() {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isProcessing = true, roiBox = null, referenceActive = false, referenceBox = null) }
        runCount(uri, referenceTap = null, roi = null)
    }

    /** Detects every object on the whole photo, finds the largest cluster of them sitting close together, and applies its bounding box as the region of interest (see [ObjectCounter.suggestRoi]) - an automatic alternative to dragging one out by hand. */
    fun findRoiAutomatically() {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isProcessing = true) }
        viewModelScope.launch {
            counter.suggestRoi(uri)
                .onSuccess { roi ->
                    if (roi != null) {
                        setRoi(roi)
                    } else {
                        _uiState.update {
                            it.copy(isProcessing = false, errorMessage = appContext.getString(R.string.count_roi_not_found))
                        }
                    }
                }
                .onFailure { exception ->
                    val message = exception.message ?: appContext.getString(R.string.count_failed)
                    _uiState.update { it.copy(isProcessing = false, errorMessage = message) }
                }
        }
    }

    /** User long-pressed a detected piece: toggle it out of (or back into) the count. */
    fun toggleExcluded(box: Rect) {
        _uiState.update { state ->
            val excluded = state.excludedBoxes
            state.copy(excludedBoxes = if (box in excluded) excluded - box else excluded + box)
        }
    }

    /** User long-pressed empty space where the detector missed a piece: count it manually. */
    fun addManualPiece(point: Point) {
        _uiState.update { it.copy(manualAdditions = it.manualAdditions + point) }
    }

    /** Removes the manual marker nearest [point] (long-press on a manual marker to undo it). */
    fun removeManualPiece(point: Point) {
        _uiState.update { state ->
            val nearest = state.manualAdditions.minByOrNull { marker ->
                val dx = (marker.x - point.x).toLong()
                val dy = (marker.y - point.y).toLong()
                dx * dx + dy * dy
            } ?: return@update state
            state.copy(manualAdditions = state.manualAdditions - nearest)
        }
    }

    /**
     * Flattens the current photo, boxes and count into one image and writes
     * it to [destUri] (from a Storage Access Framework picker, same pattern
     * as [com.micha741.skener.MainActivity]'s PDF/barcode-image saves) - the
     * on-screen result only exists as a live overlay, nothing durable to
     * point a save at otherwise. No-op if there's no result yet.
     */
    fun saveResult(destUri: Uri) {
        val state = _uiState.value
        val photoUri = state.photoUri ?: return
        if (state.count == null) return

        viewModelScope.launch {
            val result = withContext(Dispatchers.Default) {
                runCatching {
                    val bitmap = appContext.contentResolver.openInputStream(photoUri)
                        ?.use { BitmapFactory.decodeStream(it) }
                        ?: throw IllegalStateException(appContext.getString(R.string.count_failed))
                    val countLabel = if (state.referenceActive) {
                        appContext.getString(R.string.count_reference_active, state.adjustedCount)
                    } else {
                        appContext.getString(R.string.count_result, state.adjustedCount)
                    }
                    val encoded = CountingResultEncoder.encode(
                        bitmap = bitmap,
                        blobs = state.blobs,
                        excludedBoxes = state.excludedBoxes,
                        manualAdditions = state.manualAdditions,
                        referenceActive = state.referenceActive,
                        referenceBox = state.referenceBox,
                        countLabel = countLabel,
                    )
                    val written = appContext.contentResolver.openOutputStream(destUri)?.use { output ->
                        encoded.compress(Bitmap.CompressFormat.PNG, 100, output)
                    }
                    if (written != true) throw IllegalStateException(appContext.getString(R.string.save_failed))
                }
            }
            _uiState.update {
                it.copy(
                    errorMessage = if (result.isSuccess) {
                        appContext.getString(R.string.count_save_success)
                    } else {
                        result.exceptionOrNull()?.message ?: appContext.getString(R.string.save_failed)
                    },
                )
            }
        }
    }

    fun reset() {
        _uiState.value = CountingUiState()
    }

    fun consumeError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    override fun onCleared() {
        counter.close()
    }

    private fun runCount(uri: Uri, referenceTap: Point?, roi: RectF?) {
        viewModelScope.launch {
            counter.count(uri, referenceTap, roi)
                .onSuccess { result ->
                    _uiState.update {
                        it.copy(
                            isProcessing = false,
                            blobs = result.blobs,
                            count = result.count,
                            referenceActive = referenceTap != null && result.referenceBlob != null,
                            referenceBox = if (referenceTap != null) result.referenceBlob?.box else it.referenceBox,
                            excludedBoxes = emptySet(),
                            manualAdditions = emptyList(),
                            hasSuspiciousBlob = result.hasSuspiciousBlob,
                            errorMessage = if (referenceTap != null && result.referenceBlob == null) {
                                appContext.getString(R.string.count_reference_not_found)
                            } else {
                                it.errorMessage
                            },
                        )
                    }
                }
                .onFailure { exception ->
                    // Includes the exception's own type/message rather than just the generic
                    // fallback string - an unexpected exception here (anything other than the
                    // couldn't-read-the-photo case ObjectCounter throws deliberately) is a bug,
                    // and a vague "counting failed" toast makes that unreportable.
                    val detail = exception.message?.let { "${exception::class.simpleName}: $it" }
                        ?: exception::class.simpleName
                    val message = detail ?: appContext.getString(R.string.count_failed)
                    _uiState.update { it.copy(isProcessing = false, errorMessage = message) }
                }
        }
    }
}
