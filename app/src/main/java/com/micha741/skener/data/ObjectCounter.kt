package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Point
import android.graphics.Rect
import android.net.Uri
import com.micha741.skener.data.fastsam.FastSamDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class CountResult(
    val blobs: List<DetectedBlob>,
    val count: Int,
    val referenceBlob: DetectedBlob? = null,
)

/**
 * Counts discrete objects in a still photo via a bundled FastSAM-s model
 * (see [FastSamDetector]) - a class-agnostic "segment everything" detector,
 * not one tuned to recognize a handful of common categories the way ML
 * Kit's base Object Detection (still used for the live camera, see
 * [LiveFrameAnalyzer]) is. That's what a genuinely universal piece counter
 * needs: it doesn't have to know *what* something is to find it.
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
 * detector a leaf and a plum are just two similarly-sized blobs.
 * Otherwise every detected object counts, minus anything
 * [rejectSizeOutliers] throws out as an implausibly small stray detection,
 * and anything [looksLikeStraightEdge] throws out as a straight
 * architectural line (a door frame, a wall seam) rather than a piece.
 */
class ObjectCounter(context: Context) {

    private val appContext = context.applicationContext
    private val detectorLazy = lazy { FastSamDetector(appContext) }
    private val detector by detectorLazy

    suspend fun count(uri: Uri, referenceTap: Point? = null): Result<CountResult> = withContext(Dispatchers.Default) {
        runCatching {
            val photo = decodePhoto(uri)
                ?: throw IllegalArgumentException("Nepodařilo se načíst fotku")
            analyze(photo, referenceTap)
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

    private fun analyze(photo: DecodedPhoto, referenceTap: Point?): CountResult {
        val bitmap = photo.bitmap
        // Same ratio on both axes: inSampleSize preserves aspect ratio.
        val inverseScale = photo.trueWidth.toFloat() / bitmap.width

        var allBlobs = detector.detect(bitmap)
        allBlobs = allBlobs.filterNot { looksLikeStraightEdge(it.box, bitmap.width, bitmap.height) }
        allBlobs = allBlobs.map { it.copy(avgColor = averageColor(bitmap, it.box)) }
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

    /** Mean pixel color inside [box] on [bitmap], used by [matchesReference] to tell same-sized but differently-colored things apart (a plum from a leaf). */
    private fun averageColor(bitmap: Bitmap, box: Rect): Int {
        val left = box.left.coerceIn(0, bitmap.width - 1)
        val top = box.top.coerceIn(0, bitmap.height - 1)
        val right = box.right.coerceIn(left + 1, bitmap.width)
        val bottom = box.bottom.coerceIn(top + 1, bitmap.height)
        val width = right - left
        val height = bottom - top

        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, left, top, width, height)
        var r = 0L
        var g = 0L
        var b = 0L
        for (pixel in pixels) {
            r += (pixel shr 16) and 0xFF
            g += (pixel shr 8) and 0xFF
            b += pixel and 0xFF
        }
        val count = pixels.size
        return Color.rgb((r / count).toInt(), (g / count).toInt(), (b / count).toInt())
    }

    /**
     * True for a box that looks like a straight architectural edge (a door
     * frame, a wall/floor seam) rather than a real piece: earlier testing
     * against ML Kit's detector showed exactly this failure. The giveaway
     * is being *both* strongly elongated *and* running across most of the
     * photo - a real piece, even a thin one (a screw, a pen), only rarely
     * spans most of the frame's width or height.
     */
    private fun looksLikeStraightEdge(box: Rect, photoWidth: Int, photoHeight: Int): Boolean {
        val longSide = max(box.width(), box.height())
        val shortSide = max(1, min(box.width(), box.height()))
        val aspectRatio = longSide.toDouble() / shortSide
        if (aspectRatio < MIN_EDGE_ASPECT_RATIO) return false

        val spansPhoto = box.height() >= photoHeight * EDGE_PHOTO_SPAN_FRACTION ||
            box.width() >= photoWidth * EDGE_PHOTO_SPAN_FRACTION
        return spansPhoto
    }

    /**
     * Auto mode only (no reference piece): a stray false detection (a
     * reflection, a sliver of background) sitting apart from the real
     * pieces isn't caught by the detector's own NMS, since it doesn't
     * overlap a real piece - there's nothing to merge it into. When
     * counting several instances of "the same kind of thing" (the app's
     * whole premise), real pieces should be roughly consistent in size, so
     * a box much smaller than the *median* of everything else found is
     * more likely such a stray artifact than a genuinely distinct extra
     * piece. Needs a handful of samples to make a meaningful median, and
     * only applies here - reference mode already has its own, more
     * reliable, user-anchored size check in [matchesReference].
     */
    private fun rejectSizeOutliers(blobs: List<DetectedBlob>): List<DetectedBlob> {
        if (blobs.size < MIN_SAMPLES_FOR_SIZE_FILTER) return blobs
        val areas = blobs.map { it.box.width().toLong() * it.box.height().toLong() }.sorted()
        val medianArea = areas[areas.size / 2]
        if (medianArea <= 0) return blobs
        return blobs.filter { it.box.width().toLong() * it.box.height().toLong() >= medianArea * MIN_SIZE_RATIO_TO_MEDIAN }
    }

    private companion object {
        const val PHOTO_MAX_DIMENSION = 1600
        const val MIN_EDGE_ASPECT_RATIO = 3.0
        const val EDGE_PHOTO_SPAN_FRACTION = 0.6
        const val MIN_SAMPLES_FOR_SIZE_FILTER = 3
        const val MIN_SIZE_RATIO_TO_MEDIAN = 0.25
    }
}
