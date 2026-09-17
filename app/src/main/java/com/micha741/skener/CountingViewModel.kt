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
import com.micha741.skener.data.ShapeCountGroup
import com.micha741.skener.data.SuspicionRepository
import com.micha741.skener.data.suggestSingleLayerCap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min

data class CountingUiState(
    val photoUri: Uri? = null,
    /** True original photo dimensions (from a bounds-only decode, see [CountingViewModel.onPhotoSelected]) - needed alongside [referenceRealLengthCm] to turn [roiBox]'s fractional area into real cm² for [suggestedPieceCountCap]. */
    val photoWidth: Int = 0,
    val photoHeight: Int = 0,
    val blobs: List<DetectedBlob> = emptyList(),
    val count: Int? = null,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
    /** True once a reference piece was successfully picked - the count above is "similar to that piece" only. */
    val referenceActive: Boolean = false,
    val referenceBox: Rect? = null,
    /** [blobs] split by shape (see [com.micha741.skener.data.classifyShape]) - only populated in auto mode (no reference piece), empty otherwise. */
    val shapeGroups: List<ShapeCountGroup> = emptyList(),
    /** Detected blobs the user manually excluded (long-press on a wrongly-detected piece). */
    val excludedBoxes: Set<Rect> = emptySet(),
    /** Pieces the user manually marked (long-press on empty space the detector missed), each worth one piece. */
    val manualAdditions: List<Point> = emptyList(),
    /** Region of interest the user dragged out, fractional (0f..1f on each edge, relative to the photo) - detections outside it are discarded entirely, before reference/outlier filtering. Fractional rather than pixel coordinates so a region picked in the live camera can carry over to a captured photo of a completely different resolution. Null means the whole photo counts. */
    val roiBox: RectF? = null,
    /** See [com.micha741.skener.data.hasSuspiciouslyLargeBlob] - a hint (not auto-corrected) that some pieces may be touching/merged. */
    val hasSuspiciousBlob: Boolean = false,
    /** Real length (cm) of the current reference piece's longer side, entered by the user - see [CountingViewModel.setReferenceRealLength]. Needed for [suggestedPieceCountCap]; null until set, and reset whenever the reference/ROI it was measured against changes. */
    val referenceRealLengthCm: Float? = null,
    /** User-confirmed ceiling on the reported count - see [CountingViewModel.setPieceCountCap]. The displayed count never exceeds this (see [cappedCount]); null means no cap. */
    val pieceCountCap: Int? = null,
    /**
     * User-confirmed floor on the reported count - the symmetric counterpart to [pieceCountCap],
     * see [CountingViewModel.setPieceCountMin]. Where the cap catches an implausibly *high*
     * count (more than could physically fit), this catches an implausibly *low* one: detection
     * under-counting - two touching pieces FastSAM merged into one blob, or one it missed
     * outright - is a much more common failure than over-counting throughout this app's own
     * history, so a user who already knows roughly how many pieces should be there (they filled
     * the container themselves, say) can tell the app not to report fewer. Purely a floor on the
     * displayed number (see [cappedCount]), same as the cap: nothing about the underlying
     * detection changes. Null means no floor.
     */
    val pieceCountMin: Int? = null,
) {
    /** [count] adjusted for manual corrections: excluded blobs subtracted, manual additions added. */
    val adjustedCount: Int
        get() {
            val base = count ?: return manualAdditions.size
            val excludedCount = blobs.count { it.box in excludedBoxes }
            return (base - excludedCount + manualAdditions.size).coerceAtLeast(0)
        }

    /** [adjustedCount], clipped to [pieceCountCap] and/or raised to [pieceCountMin] - whichever apply. */
    val cappedCount: Int
        get() {
            var value = adjustedCount
            pieceCountCap?.let { value = min(value, it) }
            pieceCountMin?.let { value = max(value, it) }
            return value
        }

    /** True when [pieceCountCap] is actually cutting the reported number down - the UI uses this to say so. */
    val isCapped: Boolean
        get() = pieceCountCap != null && adjustedCount > pieceCountCap

    /** True when [pieceCountMin] is actually raising the reported number - the UI uses this to say so. */
    val isFloored: Boolean
        get() = pieceCountMin != null && adjustedCount < pieceCountMin

    /**
     * A single-loose-layer capacity estimate from [referenceBox]/[referenceRealLengthCm] and
     * [roiBox] (or the whole photo, if no region of interest is set) - see
     * [suggestSingleLayerCap]'s own doc for why it's only ever a *starting point* for
     * [pieceCountCap], never computed automatically into it. Null until a reference piece's
     * real length has been entered.
     */
    val suggestedPieceCountCap: Int?
        get() {
            val box = referenceBox ?: return null
            val realLength = referenceRealLengthCm ?: return null
            val containerFraction = roiBox?.let { it.width() * it.height() } ?: 1f
            return suggestSingleLayerCap(box, realLength, containerFraction, photoWidth, photoHeight)
        }
}

class CountingViewModel(
    private val appContext: Context,
    private val counter: ObjectCounter,
    private val suspicions: SuspicionRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CountingUiState())
    val uiState: StateFlow<CountingUiState> = _uiState.asStateFlow()

    /** [roi] carries over a region of interest already selected elsewhere (the live camera's capture button passes along whatever ROI was active there) - see [CountingUiState.roiBox] on why it's fractional. */
    fun onPhotoSelected(uri: Uri, roi: RectF? = null) {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        appContext.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        _uiState.value = CountingUiState(
            photoUri = uri,
            photoWidth = bounds.outWidth.coerceAtLeast(0),
            photoHeight = bounds.outHeight.coerceAtLeast(0),
            isProcessing = true,
            roiBox = roi,
        )
        runCount(uri, referenceTap = null, roi = roi)
    }

    /** User tapped a piece in the result photo (in original photo pixel coordinates): count only similar pieces. Drops any calibration/cap/floor made against a previous reference piece - a new tap may well be a different, differently-sized piece. */
    fun onReferenceTap(point: Point) {
        val uri = _uiState.value.photoUri ?: return
        val roi = _uiState.value.roiBox
        _uiState.update {
            it.copy(isProcessing = true, referenceRealLengthCm = null, pieceCountCap = null, pieceCountMin = null)
        }
        runCount(uri, referenceTap = point, roi = roi)
    }

    /** Drops the reference piece and goes back to counting every detected piece (within the ROI, if one is set). Also drops any calibration/cap/floor made against that reference - see [CountingUiState.referenceRealLengthCm]. */
    fun clearReference() {
        val uri = _uiState.value.photoUri ?: return
        val roi = _uiState.value.roiBox
        _uiState.update {
            it.copy(
                isProcessing = true,
                referenceActive = false,
                referenceBox = null,
                referenceRealLengthCm = null,
                pieceCountCap = null,
                pieceCountMin = null,
            )
        }
        runCount(uri, referenceTap = null, roi = roi)
    }

    /** User dragged out a rectangle (fractional, see [CountingUiState.roiBox]): only detections inside it count from now on. Drops any reference piece (it may no longer be in view) and any calibration/cap/floor made against it or the old region. */
    fun setRoi(rect: RectF) {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update {
            it.copy(
                isProcessing = true,
                roiBox = rect,
                referenceActive = false,
                referenceBox = null,
                referenceRealLengthCm = null,
                pieceCountCap = null,
                pieceCountMin = null,
            )
        }
        runCount(uri, referenceTap = null, roi = rect)
    }

    /** Drops the region of interest and goes back to counting the whole photo. Also drops any reference piece and any calibration/cap/floor made against it or the old region. */
    fun clearRoi() {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update {
            it.copy(
                isProcessing = true,
                roiBox = null,
                referenceActive = false,
                referenceBox = null,
                referenceRealLengthCm = null,
                pieceCountCap = null,
                pieceCountMin = null,
            )
        }
        runCount(uri, referenceTap = null, roi = null)
    }

    /**
     * User entered the current reference piece's real length (its longer side, cm) - enables
     * [CountingUiState.suggestedPieceCountCap] as a starting point for [setPieceCountCap]. No-op
     * without an active reference piece, or for a non-positive length.
     */
    fun setReferenceRealLength(cm: Float) {
        if (cm <= 0f) return
        _uiState.update { state ->
            if (!state.referenceActive || state.referenceBox == null) return@update state
            state.copy(referenceRealLengthCm = cm)
        }
    }

    /** User confirmed a ceiling on the reported count (typically starting from [CountingUiState.suggestedPieceCountCap], then adjusted by hand) - see [CountingUiState.cappedCount]. Pass null to remove the cap. */
    fun setPieceCountCap(cap: Int?) {
        _uiState.update { it.copy(pieceCountCap = cap?.coerceAtLeast(0)) }
    }

    /** User confirmed a floor on the reported count - see [CountingUiState.pieceCountMin]/[CountingUiState.cappedCount]. Pass null to remove it. */
    fun setPieceCountMin(min: Int?) {
        _uiState.update { it.copy(pieceCountMin = min?.coerceAtLeast(0)) }
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
        if (state.photoUri == null || state.count == null) return

        viewModelScope.launch {
            val result = withContext(Dispatchers.Default) {
                runCatching {
                    val encoded = encodeResult(state)
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

    /**
     * Flattens the current result the same way [saveResult] does and files
     * it away in [SuspicionRepository] with [note] attached - a personal log
     * of results the user thinks are wrong ("this padlock isn't 2 pieces"),
     * to look back on. Purely a record: it doesn't change how any future
     * photo gets counted, since there's no per-object recognition to apply
     * a remembered note to. No-op if there's no result yet.
     */
    fun reportSuspicion(note: String) {
        val state = _uiState.value
        if (state.photoUri == null || state.count == null) return

        viewModelScope.launch {
            val result = withContext(Dispatchers.Default) {
                runCatching { suspicions.save(encodeResult(state), note) }
            }
            _uiState.update {
                it.copy(
                    errorMessage = if (result.isSuccess) {
                        appContext.getString(R.string.count_suspicion_saved)
                    } else {
                        result.exceptionOrNull()?.message ?: appContext.getString(R.string.save_failed)
                    },
                )
            }
        }
    }

    /** Decodes the current photo and draws the same boxes/count bar onto it that the screen overlays live - shared by [saveResult] and [reportSuspicion]. Must run off the main thread. */
    private fun encodeResult(state: CountingUiState): Bitmap {
        val photoUri = state.photoUri ?: throw IllegalStateException(appContext.getString(R.string.count_failed))
        val bitmap = appContext.contentResolver.openInputStream(photoUri)
            ?.use { BitmapFactory.decodeStream(it) }
            ?: throw IllegalStateException(appContext.getString(R.string.count_failed))
        val countLabel = if (state.referenceActive) {
            appContext.getString(R.string.count_reference_active, state.cappedCount)
        } else {
            appContext.getString(R.string.count_result, state.cappedCount)
        }
        return CountingResultEncoder.encode(
            bitmap = bitmap,
            blobs = state.blobs,
            excludedBoxes = state.excludedBoxes,
            manualAdditions = state.manualAdditions,
            referenceActive = state.referenceActive,
            referenceBox = state.referenceBox,
            countLabel = countLabel,
        )
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
                            shapeGroups = result.shapeGroups,
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
