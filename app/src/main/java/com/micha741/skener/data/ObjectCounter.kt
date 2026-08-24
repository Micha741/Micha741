package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.ObjectDetection
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
 * Detection & Tracking (SINGLE_IMAGE_MODE, multiple objects + coarse
 * classification enabled) - a trained detector, not a hand-tuned OpenCV
 * threshold/color/contour pipeline, so background texture (wood grain,
 * fabric prints) doesn't get mistaken for pieces the way local contrast
 * heuristics did.
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
        val downscale = min(1f, WORKING_MAX_DIMENSION.toFloat() / max(original.width, original.height))
        val workWidth = max(1, (original.width * downscale).roundToInt())
        val workHeight = max(1, (original.height * downscale).roundToInt())
        val working = if (downscale < 1f) {
            Bitmap.createScaledBitmap(original, workWidth, workHeight, true)
        } else {
            original
        }
        if (working !== original) original.recycle()

        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
            .enableMultipleObjects()
            .enableClassification()
            .build()
        val detector = ObjectDetection.getClient(options)
        val detected = Tasks.await(detector.process(InputImage.fromBitmap(working, 0)))
        detector.close()
        val allBlobs = detected.map { it.toDetectedBlob() }

        var referenceBlob: DetectedBlob? = null
        if (referenceTap != null) {
            val workX = (referenceTap.x * downscale).roundToInt().coerceIn(0, working.width - 1)
            val workY = (referenceTap.y * downscale).roundToInt().coerceIn(0, working.height - 1)
            referenceBlob = findBlobNear(allBlobs, workX, workY)
        }

        val kept = if (referenceBlob != null) {
            allBlobs.filter { matchesReference(it, referenceBlob) }
        } else {
            allBlobs
        }

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val scaledBlobs = kept.map { it.scaledBy(inverseScale) }
        val scaledReference = referenceBlob?.scaledBy(inverseScale)
        working.recycle()

        return CountResult(scaledBlobs, scaledBlobs.size, scaledReference)
    }

    private companion object {
        const val WORKING_MAX_DIMENSION = 900
    }
}
