package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.graphics.RectF
import android.net.Uri
import com.micha741.skener.data.fastsam.FastSamDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.roundToInt

data class CountResult(
    val blobs: List<DetectedBlob>,
    val count: Int,
    val referenceBlob: DetectedBlob? = null,
)

/**
 * Counts discrete objects in a still photo via a bundled FastSAM-s model
 * (see [FastSamDetector]) - a class-agnostic "segment everything" detector,
 * not one tuned to recognize a handful of common categories. That's what a
 * genuinely universal piece counter needs: it doesn't have to know *what*
 * something is to find it. [LiveFrameAnalyzer] runs the same model for the
 * live camera; the filters below ([looksLikeStraightEdge], [rejectSizeOutliers],
 * [averageColor]) are shared between both in `DetectedBlobFilters.kt`.
 *
 * Every detected blob also runs through [subdivideGrids] first: FastSAM
 * finds a keyboard, a tiled floor, a pegboard as *one* object (individual
 * keys/tiles sit flush against each other with no shadow/gap boundary for
 * it to split on), which [GridDetector] fixes by looking for regular
 * periodic gaps in brightness across that one blob and slicing it into a
 * grid of smaller boxes when it finds them.
 *
 * The photo is decoded downsampled close to [PHOTO_MAX_DIMENSION] (a
 * phone photo can easily be 4000px+ on a side) rather than at full
 * resolution, purely to save memory - [FastSamDetector] does its own
 * further internal resize to its fixed model input size regardless. Every
 * returned box is scaled back up to the photo's *true* original
 * resolution (tracked separately from the decoded bitmap's own, possibly
 * downsampled, size), since that's the resolution the UI displays the
 * photo at.
 *
 * If [referenceTap] is given (a point in the *original* photo's pixel
 * coordinates the user tapped on one piece), only objects that are a
 * plausible size *and color* match are kept and counted 1:1 - see
 * [matchesReference]. Color comes from [averageColor], sampled from the
 * photo while it's still decoded here (FastSAM's own output is just boxes,
 * no color or category) - without it, tapping one plum on a tree photo
 * would also count every same-sized leaf, since to a class-agnostic
 * detector a leaf and a plum are just two similarly-sized blobs. Color
 * matching is no help when the piece and the clutter around it are close
 * to the same color too (cream garlic on a light wood floor, say) - that's
 * what [roi] is for: a rectangle the user dragged out over just the pieces,
 * that throws out every detection outside it *before* reference/outlier
 * filtering even runs, so a same-colored, similar-sized false detection
 * sitting elsewhere in the frame never gets a chance to be counted in the
 * first place. [roi] is fractional (0f..1f on each edge, relative to
 * whatever photo it's applied to) rather than pixel coordinates - a region
 * picked in the live camera's small preview frame and one picked on this
 * full-resolution photo need to mean "the same place" despite the two
 * having entirely different pixel dimensions (see
 * [com.micha741.skener.LiveCameraScreen]'s capture button, which carries
 * the live ROI over to the captured photo this way).
 * Otherwise every detected object counts, minus anything
 * [rejectSizeOutliers] throws out as an implausibly small stray detection,
 * and anything [looksLikeStraightEdge] throws out as a straight
 * architectural line (a door frame, a wall seam) rather than a piece.
 */
class ObjectCounter(context: Context) {

    private val appContext = context.applicationContext
    private val detectorLazy = lazy { FastSamDetector(appContext) }
    private val detector by detectorLazy

    suspend fun count(uri: Uri, referenceTap: Point? = null, roi: RectF? = null): Result<CountResult> = withContext(Dispatchers.Default) {
        runCatching {
            val photo = decodePhoto(uri)
                ?: throw IllegalArgumentException("Nepodařilo se načíst fotku")
            analyze(photo, referenceTap, roi)
        }
    }

    /**
     * Suggests a region of interest by detecting every object on the whole
     * photo and finding the largest cluster of them sitting close together
     * (see [suggestRoi]) - an automatic alternative to dragging one out by
     * hand, for the common case of a bunch of pieces together plus some
     * scattered false detections elsewhere in the frame. Null means no
     * confident cluster was found (too few objects, or nothing clustered).
     */
    suspend fun suggestRoi(uri: Uri): Result<RectF?> = withContext(Dispatchers.Default) {
        runCatching {
            val photo = decodePhoto(uri)
                ?: throw IllegalArgumentException("Nepodařilo se načíst fotku")
            val bitmap = photo.bitmap
            val width = bitmap.width
            val height = bitmap.height
            var allBlobs = subdivideGrids(detector.detect(bitmap), bitmap)
            allBlobs = allBlobs.filterNot { looksLikeStraightEdge(it.box, width, height) }
            bitmap.recycle()
            suggestRoi(allBlobs, width, height)
        }
    }

    /** Releases the detector's native TFLite resources - call when the owning ViewModel is cleared. No-op if a count() was never run, since that's the only thing that initializes the detector. */
    fun close() {
        if (detectorLazy.isInitialized()) detector.close()
    }

    private class DecodedPhoto(val bitmap: Bitmap, val trueWidth: Int, val trueHeight: Int)

    /**
     * Decodes [uri] downsampled close to [PHOTO_MAX_DIMENSION] instead of at
     * full resolution, to save memory - but keeps the *true* original
     * dimensions (from a bounds-only pre-pass) alongside the decoded
     * bitmap, so callers can scale results back up to match what the UI
     * actually displays (a full-resolution decode of the same photo).
     */
    private fun decodePhoto(uri: Uri): DecodedPhoto? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        val boundsStream = appContext.contentResolver.openInputStream(uri) ?: return null
        boundsStream.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        val options = BitmapFactory.Options().apply { inSampleSize = sampleSizeFor(bounds.outWidth, bounds.outHeight) }
        val bitmap = appContext.contentResolver.openInputStream(uri)
            ?.use { BitmapFactory.decodeStream(it, null, options) }
            ?: return null
        return DecodedPhoto(bitmap, bounds.outWidth, bounds.outHeight)
    }

    /** Power-of-two downsample factor (BitmapFactory only honors powers of two) that gets the decoded bitmap's long side down close to [PHOTO_MAX_DIMENSION]. */
    private fun sampleSizeFor(width: Int, height: Int): Int {
        if (width <= 0 || height <= 0) return 1
        var sampleSize = 1
        while (max(width, height) / (sampleSize * 2) >= PHOTO_MAX_DIMENSION) {
            sampleSize *= 2
        }
        return sampleSize
    }

    private fun analyze(photo: DecodedPhoto, referenceTap: Point?, roi: RectF?): CountResult {
        val bitmap = photo.bitmap
        // Same ratio on both axes: inSampleSize preserves aspect ratio.
        val inverseScale = photo.trueWidth.toFloat() / bitmap.width

        var allBlobs = subdivideGrids(detector.detect(bitmap), bitmap)
        allBlobs = allBlobs.filterNot { looksLikeStraightEdge(it.box, bitmap.width, bitmap.height) }
        allBlobs = allBlobs.map { it.copy(avgColor = averageColor(bitmap, it.box)) }
        if (roi != null) {
            val bitmapRoi = Rect(
                (roi.left * bitmap.width).roundToInt(),
                (roi.top * bitmap.height).roundToInt(),
                (roi.right * bitmap.width).roundToInt(),
                (roi.bottom * bitmap.height).roundToInt(),
            )
            allBlobs = allBlobs.filter { bitmapRoi.contains(it.box.centerX(), it.box.centerY()) }
        }
        bitmap.recycle()

        var referenceBlob: DetectedBlob? = null
        if (referenceTap != null) {
            val bitmapX = (referenceTap.x / inverseScale).roundToInt().coerceIn(0, photo.trueWidth - 1)
            val bitmapY = (referenceTap.y / inverseScale).roundToInt().coerceIn(0, photo.trueHeight - 1)
            referenceBlob = findBlobNear(allBlobs, bitmapX, bitmapY)
        }

        val kept = if (referenceBlob != null) {
            allBlobs.filter { matchesReference(it, referenceBlob) }
        } else {
            rejectSizeOutliers(allBlobs)
        }

        val scaledBlobs = kept.map { it.scaledBy(inverseScale) }
        val scaledReference = referenceBlob?.scaledBy(inverseScale)

        return CountResult(scaledBlobs, scaledBlobs.size, scaledReference)
    }

    private companion object {
        const val PHOTO_MAX_DIMENSION = 1600
    }
}
