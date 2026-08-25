package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.DetectedObject
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.ObjectDetector
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
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
 * Counts discrete objects in a still photo via ML Kit's on-device Object
 * Detection & Tracking - a trained detector, not a hand-tuned OpenCV
 * threshold/color/contour pipeline, so background texture (wood grain,
 * fabric prints) doesn't get mistaken for pieces the way local contrast
 * heuristics did.
 *
 * The base (non-custom) model is tuned to find a handful of prominent
 * objects filling a meaningful part of the frame. Fed the whole photo at
 * once, several small pieces scattered over a mostly-empty background (a
 * few seeds on a big floor) get merged into a single "region of interest"
 * instead of being found individually - the model never gets a good look
 * at any *one* piece. [detectTiled] works around this by splitting the
 * photo into a grid of overlapping tiles and running detection on each
 * tile *upscaled to the same working resolution* - so a tiny piece becomes
 * a much bigger fraction of what the detector actually sees - then mapping
 * every tile's detections back to the original photo and merging
 * duplicates found in more than one tile's overlap margin (see
 * [deduplicate]). Only the static-photo counter tiles like this; the live
 * camera stays on one full-frame pass per throttled frame, since 9 ML Kit
 * calls per frame would make the live overlay lag too much to be usable.
 *
 * If [referenceTap] is given (a point in the *original* photo's pixel
 * coordinates the user tapped on one piece), only objects that are a
 * plausible size match (and, when both have one, share the same coarse
 * category) are kept and counted 1:1 - see [matchesReference]. Otherwise
 * every detected object counts.
 */
class ObjectCounter(private val context: Context) {

    suspend fun count(uri: Uri, referenceTap: Point? = null): Result<CountResult> = withContext(Dispatchers.Default) {
        runCatching {
            val original = decodeBitmap(uri)
                ?: throw IllegalArgumentException("Nepodařilo se načíst fotku")
            analyze(original, referenceTap)
        }
    }

    /**
     * Decodes [uri] downsampled close to [PHOTO_MAX_DIMENSION] instead of at
     * full resolution - a phone camera photo can easily be 4000px+ on a
     * side, and decoding that in full just to immediately shrink it in
     * [analyze] wastes memory that tiled detection (up to 9 extra bitmaps
     * per photo) can't afford to spare.
     */
    private fun decodeBitmap(uri: Uri): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        val boundsStream = context.contentResolver.openInputStream(uri) ?: return null
        boundsStream.use { BitmapFactory.decodeStream(it, null, bounds) }

        val options = BitmapFactory.Options().apply { inSampleSize = sampleSizeFor(bounds.outWidth, bounds.outHeight) }
        return context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
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

    private fun analyze(original: Bitmap, referenceTap: Point?): CountResult {
        val downscale = min(1f, PHOTO_MAX_DIMENSION.toFloat() / max(original.width, original.height))
        val photoWidth = max(1, (original.width * downscale).roundToInt())
        val photoHeight = max(1, (original.height * downscale).roundToInt())
        val photo = if (downscale < 1f) {
            Bitmap.createScaledBitmap(original, photoWidth, photoHeight, true)
        } else {
            original
        }
        if (photo !== original) original.recycle()

        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
            .enableMultipleObjects()
            .enableClassification()
            .build()
        val detector = ObjectDetection.getClient(options)
        val allBlobs = try {
            deduplicate(detectTiled(detector, photo))
        } finally {
            detector.close()
        }
        photo.recycle()

        var referenceBlob: DetectedBlob? = null
        if (referenceTap != null) {
            val photoX = (referenceTap.x * downscale).roundToInt().coerceIn(0, photoWidth - 1)
            val photoY = (referenceTap.y * downscale).roundToInt().coerceIn(0, photoHeight - 1)
            referenceBlob = findBlobNear(allBlobs, photoX, photoY)
        }

        val kept = if (referenceBlob != null) {
            allBlobs.filter { matchesReference(it, referenceBlob) }
        } else {
            allBlobs
        }

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val scaledBlobs = kept.map { it.scaledBy(inverseScale) }
        val scaledReference = referenceBlob?.scaledBy(inverseScale)

        return CountResult(scaledBlobs, scaledBlobs.size, scaledReference)
    }

    /** Runs [detector] on an overlapping [TILE_GRID]x[TILE_GRID] grid over [photo], each tile upscaled to [TILE_WORKING_DIMENSION]. */
    private fun detectTiled(detector: ObjectDetector, photo: Bitmap): List<DetectedBlob> {
        val tileWidth = photo.width / TILE_GRID
        val tileHeight = photo.height / TILE_GRID
        if (tileWidth < 1 || tileHeight < 1) {
            return runDetection(detector, photo).map { it.toDetectedBlob() }
        }

        val overlapX = (tileWidth * TILE_OVERLAP_FRACTION).roundToInt()
        val overlapY = (tileHeight * TILE_OVERLAP_FRACTION).roundToInt()
        val blobs = mutableListOf<DetectedBlob>()

        for (row in 0 until TILE_GRID) {
            for (col in 0 until TILE_GRID) {
                val left = max(0, col * tileWidth - overlapX)
                val top = max(0, row * tileHeight - overlapY)
                val right = min(photo.width, (col + 1) * tileWidth + overlapX)
                val bottom = min(photo.height, (row + 1) * tileHeight + overlapY)
                val tileW = right - left
                val tileH = bottom - top
                if (tileW < 1 || tileH < 1) continue

                val tile = Bitmap.createBitmap(photo, left, top, tileW, tileH)
                val tileScale = min(MAX_TILE_UPSCALE, TILE_WORKING_DIMENSION.toFloat() / max(tileW, tileH))
                val scaledTile = if (tileScale != 1f) {
                    Bitmap.createScaledBitmap(
                        tile,
                        max(1, (tileW * tileScale).roundToInt()),
                        max(1, (tileH * tileScale).roundToInt()),
                        true,
                    )
                } else {
                    tile
                }
                if (scaledTile !== tile) tile.recycle()

                val detected = runDetection(detector, scaledTile)
                val scaledTileWidth = scaledTile.width
                val scaledTileHeight = scaledTile.height
                scaledTile.recycle()

                detected.forEach { obj ->
                    val blob = obj.toDetectedBlob()
                    val box = blob.box
                    if (looksLikeStraightEdge(box, scaledTileWidth, scaledTileHeight)) return@forEach

                    val mappedBox = Rect(
                        left + (box.left / tileScale).roundToInt(),
                        top + (box.top / tileScale).roundToInt(),
                        left + (box.right / tileScale).roundToInt(),
                        top + (box.bottom / tileScale).roundToInt(),
                    )
                    blobs += blob.copy(box = mappedBox)
                }
            }
        }
        return blobs
    }

    private fun runDetection(detector: ObjectDetector, bitmap: Bitmap): List<DetectedObject> =
        Tasks.await(detector.process(InputImage.fromBitmap(bitmap, 0)))

    /**
     * True for a box that looks like a straight architectural edge (a door
     * frame, a wall/floor seam) rather than a real piece: device testing
     * showed the detector flagging these as "objects" in their own right.
     * The giveaway is being *both* strongly elongated *and* running across
     * most of its own tile - a real piece, even a thin one (a screw, a
     * pen), only rarely spans most of an entire tile's width or height,
     * while a straight line crossing the frame naturally does. Checked
     * against the tile's own dimensions, not the whole photo's - a seam
     * spanning most of one ~1/3-of-the-photo tile would only cover a small
     * fraction of the full photo, so that comparison would miss it.
     */
    private fun looksLikeStraightEdge(box: Rect, tileWidth: Int, tileHeight: Int): Boolean {
        val longSide = max(box.width(), box.height())
        val shortSide = max(1, min(box.width(), box.height()))
        val aspectRatio = longSide.toDouble() / shortSide
        if (aspectRatio < MIN_EDGE_ASPECT_RATIO) return false

        val spansTile = box.height() >= tileHeight * EDGE_TILE_SPAN_FRACTION ||
            box.width() >= tileWidth * EDGE_TILE_SPAN_FRACTION
        return spansTile
    }

    /**
     * An object that straddles two tiles' overlap margin gets detected once
     * per tile, so the same physical object can show up as several
     * overlapping candidate boxes. Which box is the "right" one to keep
     * depends on *why* they overlap:
     *  - Several boxes that all mostly overlap *each other* too (not just
     *    the biggest one) are redundant views of the same single object
     *    (e.g. "whole shoe" and "just its toe" from two different tiles) -
     *    keep only the biggest, drop the rest.
     *  - A big box that turns out to just be an amalgam of two or more
     *    *mutually distinct* smaller boxes (e.g. one tile saw "the whole
     *    cluster of seeds" as one blob while other tiles individually
     *    found each seed) is a false merge, not a real piece - drop the
     *    big box and keep the smaller, independent ones instead.
     */
    private fun deduplicate(blobs: List<DetectedBlob>): List<DetectedBlob> {
        // A zero-width/zero-height box (possible after tile-coordinate rounding) has zero overlap
        // even with itself, so it would never get picked up by overlapRatio() below and the loop
        // would keep re-selecting it forever without ever removing it from `remaining`.
        val remaining = blobs.filterTo(mutableListOf()) { it.box.area() > 0 }
        val kept = mutableListOf<DetectedBlob>()

        while (remaining.isNotEmpty()) {
            val biggest = remaining.maxBy { it.box.area() }
            val overlappingBiggest = remaining.filter { overlapRatio(it.box, biggest.box) > DEDUPE_OVERLAP_THRESHOLD }
            val independentSubPieces = independentSubset(overlappingBiggest - biggest)

            if (independentSubPieces.size >= 2) {
                kept += independentSubPieces
            } else {
                kept += biggest
            }
            remaining.removeAll(overlappingBiggest)
        }
        return kept
    }

    /** Greedily picks the biggest-first subset of [candidates] whose boxes don't significantly overlap each other. */
    private fun independentSubset(candidates: List<DetectedBlob>): List<DetectedBlob> {
        val picked = mutableListOf<DetectedBlob>()
        for (candidate in candidates.sortedByDescending { it.box.area() }) {
            if (picked.none { overlapRatio(it.box, candidate.box) > DEDUPE_OVERLAP_THRESHOLD }) {
                picked += candidate
            }
        }
        return picked
    }

    /** Intersection area relative to the *smaller* of the two boxes - catches "one box is basically inside the other" even when their sizes differ a lot, which plain intersection-over-union (relative to their combined area) can miss. */
    private fun overlapRatio(a: Rect, b: Rect): Double {
        val interLeft = max(a.left, b.left)
        val interTop = max(a.top, b.top)
        val interRight = min(a.right, b.right)
        val interBottom = min(a.bottom, b.bottom)
        if (interRight <= interLeft || interBottom <= interTop) return 0.0

        val interArea = (interRight - interLeft).toLong() * (interBottom - interTop).toLong()
        val smallerArea = min(a.area(), b.area())
        return if (smallerArea <= 0) 0.0 else interArea.toDouble() / smallerArea.toDouble()
    }

    private fun Rect.area(): Long = width().toLong() * height().toLong()

    private companion object {
        const val PHOTO_MAX_DIMENSION = 1600
        const val TILE_GRID = 3
        const val TILE_OVERLAP_FRACTION = 0.15f
        const val TILE_WORKING_DIMENSION = 640
        const val MAX_TILE_UPSCALE = 4f
        const val DEDUPE_OVERLAP_THRESHOLD = 0.4
        const val MIN_EDGE_ASPECT_RATIO = 3.0
        const val EDGE_TILE_SPAN_FRACTION = 0.6
    }
}
