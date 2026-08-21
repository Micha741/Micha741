package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class CountResult(val blobs: List<DetectedBlob>, val count: Int, val referenceBlob: DetectedBlob? = null)

/**
 * Counts discrete objects in a still photo by decoding it, downscaling to a
 * manageable working resolution, converting to grayscale and running it
 * through [BlobAnalyzer]. Works best for well-lit items on a reasonably
 * uniform, contrasting background (parts on a table, coins, tablets, etc.).
 *
 * If [referenceTap] is given (a point in the *original* photo's pixel
 * coordinates that the user tapped on one piece), only blobs whose
 * size/shape resemble that piece are kept and counted 1:1. Otherwise every
 * plausible blob is counted, splitting statistically-oversized merged blobs.
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

        val width = working.width
        val height = working.height
        val pixels = IntArray(width * height)
        working.getPixels(pixels, 0, width, 0, 0, width, height)

        if (working !== original) working.recycle()
        original.recycle()

        val gray = toGrayscale(pixels)
        val auto = BlobAnalyzer.analyze(gray, width, height)

        var referenceBlob: DetectedBlob? = null
        val result = if (referenceTap != null) {
            val workX = (referenceTap.x * downscale).roundToInt().coerceIn(0, width - 1)
            val workY = (referenceTap.y * downscale).roundToInt().coerceIn(0, height - 1)
            val reference = BlobAnalyzer.findBlobNear(auto.blobs, workX, workY)
            if (reference != null) {
                referenceBlob = reference
                val matched = auto.blobs.filter { BlobAnalyzer.matchesReference(it, reference) }
                BlobAnalysisResult(matched, matched.size)
            } else {
                auto
            }
        } else {
            auto
        }

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val blobs = result.blobs.map { scaleBlob(it, inverseScale) }
        return CountResult(blobs, result.count, referenceBlob?.let { scaleBlob(it, inverseScale) })
    }

    private fun scaleBlob(blob: DetectedBlob, scale: Float): DetectedBlob = blob.copy(
        box = Rect(
            (blob.box.left * scale).roundToInt(),
            (blob.box.top * scale).roundToInt(),
            (blob.box.right * scale).roundToInt(),
            (blob.box.bottom * scale).roundToInt(),
        ),
    )

    private fun toGrayscale(pixels: IntArray): IntArray = IntArray(pixels.size) { i ->
        val p = pixels[i]
        val r = (p shr 16) and 0xFF
        val g = (p shr 8) and 0xFF
        val b = p and 0xFF
        (r * 299 + g * 587 + b * 114) / 1000
    }

    private companion object {
        const val WORKING_MAX_DIMENSION = 900
    }
}
