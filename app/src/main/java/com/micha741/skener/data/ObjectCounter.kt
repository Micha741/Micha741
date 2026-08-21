package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class CountResult(val boxes: List<Rect>, val count: Int)

/**
 * Counts discrete objects in a still photo by decoding it, downscaling to a
 * manageable working resolution, converting to grayscale and running it
 * through [BlobAnalyzer]. Works best for well-lit items on a reasonably
 * uniform, contrasting background (parts on a table, coins, tablets, etc.).
 */
class ObjectCounter(private val context: Context) {

    suspend fun count(uri: Uri): Result<CountResult> = withContext(Dispatchers.Default) {
        runCatching {
            val original = decodeBitmap(uri)
                ?: throw IllegalArgumentException("Nepodařilo se načíst fotku")
            analyze(original)
        }
    }

    private fun decodeBitmap(uri: Uri): Bitmap? =
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }

    private fun analyze(original: Bitmap): CountResult {
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
        val result = BlobAnalyzer.analyze(gray, width, height)

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val boxes = result.boxes.map { scaleRect(it, inverseScale) }
        return CountResult(boxes, result.count)
    }

    private fun scaleRect(rect: Rect, scale: Float): Rect = Rect(
        (rect.left * scale).roundToInt(),
        (rect.top * scale).roundToInt(),
        (rect.right * scale).roundToInt(),
        (rect.bottom * scale).roundToInt(),
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
