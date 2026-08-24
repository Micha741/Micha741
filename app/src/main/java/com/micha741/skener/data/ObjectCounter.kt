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

    private fun decodeBitmap(uri: Uri): Bitmap? =
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }

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
                scaledTile.recycle()

                detected.forEach { obj ->
                    val blob = obj.toDetectedBlob()
                    val box = blob.box
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
     * Greedy non-max suppression: an object that straddles two tiles'
     * overlap margin gets detected once per tile, so keep only the
     * biggest box in each cluster of heavily overlapping detections
     * (bigger usually means a fuller, less tile-edge-clipped view of it).
     */
    private fun deduplicate(blobs: List<DetectedBlob>): List<DetectedBlob> {
        val kept = mutableListOf<DetectedBlob>()
        for (blob in blobs.sortedByDescending { it.box.width().toLong() * it.box.height().toLong() }) {
            val overlapsExisting = kept.any { iou(it.box, blob.box) > DEDUPE_IOU_THRESHOLD }
            if (!overlapsExisting) kept += blob
        }
        return kept
    }

    private fun iou(a: Rect, b: Rect): Double {
        val interLeft = max(a.left, b.left)
        val interTop = max(a.top, b.top)
        val interRight = min(a.right, b.right)
        val interBottom = min(a.bottom, b.bottom)
        if (interRight <= interLeft || interBottom <= interTop) return 0.0

        val interArea = (interRight - interLeft).toLong() * (interBottom - interTop).toLong()
        val areaA = a.width().toLong() * a.height().toLong()
        val areaB = b.width().toLong() * b.height().toLong()
        val unionArea = areaA + areaB - interArea
        return if (unionArea <= 0) 0.0 else interArea.toDouble() / unionArea.toDouble()
    }

    private companion object {
        const val PHOTO_MAX_DIMENSION = 1600
        const val TILE_GRID = 3
        const val TILE_OVERLAP_FRACTION = 0.15f
        const val TILE_WORKING_DIMENSION = 640
        const val MAX_TILE_UPSCALE = 4f
        const val DEDUPE_IOU_THRESHOLD = 0.35
    }
}
