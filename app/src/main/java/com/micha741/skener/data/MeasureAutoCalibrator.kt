package com.micha741.skener.data

import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.PointF
import android.net.Uri
import com.micha741.skener.data.fastsam.FastSamDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Tries to find a [KnownReferenceObject] on a photo automatically, via the
 * same FastSAM detector [ObjectCounter] uses for piece counting, so
 * [MeasureViewModel] can propose calibrating from it instead of the user
 * tapping two points and typing a length by hand. FastSAM itself has no
 * idea what kind of object something is, just that it's a distinct one - so
 * matching is purely by a detected box's aspect ratio against each
 * [KnownReferenceObject]'s real long:short ratio (verified against the
 * actual bundled model with synthetic A4-sheet/payment-card test photos:
 * both came back with the right box and the right ratio, well within
 * [RATIO_TOLERANCE]). A suggestion this finds is always shown to the user to
 * confirm or reject before it's used - never applied silently, since a
 * plausible-ratio box is still just a guess at what the object actually is.
 */
class MeasureAutoCalibrator(context: Context) {

    private val appContext = context.applicationContext
    private val detectorLazy = lazy { FastSamDetector(appContext) }
    private val detector by detectorLazy

    /** Null means nothing matched confidently: no blob close enough to a known ratio, or more than one candidate close enough that picking one would be a coin flip. */
    suspend fun detect(uri: Uri): Result<AutoCalibrationSuggestion?> = withContext(Dispatchers.Default) {
        runCatching {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            appContext.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return@runCatching null

            val options = BitmapFactory.Options().apply { inSampleSize = sampleSizeFor(bounds.outWidth, bounds.outHeight) }
            val bitmap = appContext.contentResolver.openInputStream(uri)
                ?.use { BitmapFactory.decodeStream(it, null, options) }
                ?: return@runCatching null

            val blobs = detector.detect(bitmap)
            val width = bitmap.width
            val height = bitmap.height
            bitmap.recycle()

            findBestMatch(blobs, width, height)
        }
    }

    /** Releases the detector's native TFLite resources - call when the owning ViewModel is cleared. No-op if [detect] was never run. */
    fun close() {
        if (detectorLazy.isInitialized()) detector.close()
    }

    private fun findBestMatch(blobs: List<DetectedBlob>, width: Int, height: Int): AutoCalibrationSuggestion? {
        val photoArea = width.toLong() * height.toLong()

        data class Candidate(val blob: DetectedBlob, val type: KnownReferenceObject, val ratioError: Float)

        val candidates = blobs.mapNotNull { blob ->
            val boxWidth = blob.box.width()
            val boxHeight = blob.box.height()
            if (boxWidth <= 0 || boxHeight <= 0) return@mapNotNull null
            val boxArea = boxWidth.toLong() * boxHeight.toLong()
            // A real reference object held up for calibration is a modest fraction of the
            // frame - ignore blobs implausibly tiny (noise) or huge (probably the whole scene).
            if (boxArea < photoArea / 200 || boxArea > photoArea * 6 / 10) return@mapNotNull null

            val ratio = max(boxWidth, boxHeight).toFloat() / min(boxWidth, boxHeight).toFloat()
            val closestType = KnownReferenceObject.entries.minByOrNull { type ->
                abs(ratio - type.longCm / type.shortCm)
            } ?: return@mapNotNull null
            val targetRatio = closestType.longCm / closestType.shortCm
            val error = abs(ratio - targetRatio) / targetRatio
            if (error <= RATIO_TOLERANCE) Candidate(blob, closestType, error) else null
        }

        val best = candidates.minByOrNull { it.ratioError } ?: return null
        val secondBest = candidates.filter { it.blob.box != best.blob.box }.minByOrNull { it.ratioError }
        if (secondBest != null && secondBest.ratioError - best.ratioError < AMBIGUITY_MARGIN) return null

        val box = best.blob.box
        val a: PointF
        val b: PointF
        if (box.width() >= box.height()) {
            a = PointF(box.left.toFloat() / width, box.top.toFloat() / height)
            b = PointF(box.right.toFloat() / width, box.top.toFloat() / height)
        } else {
            a = PointF(box.left.toFloat() / width, box.top.toFloat() / height)
            b = PointF(box.left.toFloat() / width, box.bottom.toFloat() / height)
        }
        return AutoCalibrationSuggestion(a, b, best.type.longCm, best.type)
    }

    /** Power-of-two downsample factor (BitmapFactory only honors powers of two) that gets the decoded bitmap's long side down close to [PHOTO_MAX_DIMENSION], same as [ObjectCounter] does - FastSAM resizes to its own fixed input regardless, this is purely to save memory decoding a full-resolution phone photo. */
    private fun sampleSizeFor(width: Int, height: Int): Int {
        if (width <= 0 || height <= 0) return 1
        var sampleSize = 1
        while (max(width, height) / (sampleSize * 2) >= PHOTO_MAX_DIMENSION) {
            sampleSize *= 2
        }
        return sampleSize
    }

    private companion object {
        const val PHOTO_MAX_DIMENSION = 1600
        const val RATIO_TOLERANCE = 0.05f
        const val AMBIGUITY_MARGIN = 0.02f
    }
}
