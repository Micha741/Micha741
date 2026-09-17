package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Rect
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.math.abs
import kotlin.math.max

/** One recognized line of text plus everything [TextPdfWriter] needs to render it close to how it looked on the page. */
data class FormattedLine(
    val text: String,
    val box: Rect,
    val bold: Boolean,
    val italic: Boolean,
    val color: Int,
)

data class RecognizedPage(val lines: List<FormattedLine>, val imageWidth: Int, val imageHeight: Int)

/**
 * Runs on-device OCR (ML Kit, Latin script) over a scanned page image and
 * estimates per-line formatting. ML Kit only returns plain text and
 * geometry (no font metadata), so:
 *  - size & line spacing come straight from each line's bounding box (real
 *    geometry, not a heuristic) - [TextPdfWriter] draws each line at its
 *    own position/size, so spacing is preserved automatically
 *  - italic is read from the horizontal shear of the line's corner quad
 *    (also real geometry - ML Kit gives a possibly-slanted quadrilateral,
 *    not just an axis-aligned box)
 *  - bold is a heuristic: the ratio of dark ("ink") pixels inside the
 *    line's box vs. the page's median line - thicker strokes cover more
 *    of their box for the same text size
 *  - color is a heuristic: the average color of the darkest pixels inside
 *    the box (the "ink"), sampled from the original photo
 */
class DocumentTextExtractor(private val context: Context) {

    private val recognizer by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

    suspend fun recognize(imageUri: Uri): Result<RecognizedPage> {
        val bitmap = decodeBitmap(imageUri)
            ?: return Result.failure(IllegalArgumentException("Nepodařilo se načíst fotku"))
        return try {
            runRecognition(bitmap).map { visionText -> buildPage(visionText, bitmap) }
        } finally {
            bitmap.recycle()
        }
    }

    private fun decodeBitmap(uri: Uri): Bitmap? =
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }

    private suspend fun runRecognition(bitmap: Bitmap): Result<Text> = suspendCancellableCoroutine { continuation ->
        val image = InputImage.fromBitmap(bitmap, 0)
        recognizer.process(image)
            .addOnSuccessListener { text -> continuation.resume(Result.success(text)) }
            .addOnFailureListener { exception -> continuation.resume(Result.failure(exception)) }
    }

    private fun buildPage(visionText: Text, bitmap: Bitmap): RecognizedPage {
        val rawLines = visionText.textBlocks.flatMap { it.lines }
        if (rawLines.isEmpty()) return RecognizedPage(emptyList(), bitmap.width, bitmap.height)

        val inkRatios = rawLines.map { line -> line.boundingBox?.let { inkRatio(bitmap, it) } ?: 0f }
        val medianInkRatio = inkRatios.sorted()[inkRatios.size / 2].coerceAtLeast(0.01f)

        val lines = rawLines.mapIndexed { index, line ->
            val box = line.boundingBox ?: Rect(0, 0, 0, 0)
            FormattedLine(
                text = line.text,
                box = box,
                bold = inkRatios[index] > medianInkRatio * BOLD_INK_RATIO_FACTOR,
                italic = isItalic(line),
                color = sampleInkColor(bitmap, box),
            )
        }
        return RecognizedPage(lines, bitmap.width, bitmap.height)
    }

    /** Fraction of pixels inside [box] darker than the crop's own light/dark midpoint. */
    private fun inkRatio(bitmap: Bitmap, box: Rect): Float {
        val rect = clampToBitmap(box, bitmap)
        if (rect.width() <= 0 || rect.height() <= 0) return 0f

        val pixels = IntArray(rect.width() * rect.height())
        bitmap.getPixels(pixels, 0, rect.width(), rect.left, rect.top, rect.width(), rect.height())

        var minLum = 255
        var maxLum = 0
        val luminances = IntArray(pixels.size) { i ->
            val lum = luminance(pixels[i])
            if (lum < minLum) minLum = lum
            if (lum > maxLum) maxLum = lum
            lum
        }
        if (maxLum - minLum < MIN_CONTRAST) return 0f

        val threshold = minLum + (maxLum - minLum) / 2
        val inkCount = luminances.count { it <= threshold }
        return inkCount.toFloat() / luminances.size
    }

    /** Average color of the darkest ~20% of pixels inside [box] (the "ink"), from the original color photo. */
    private fun sampleInkColor(bitmap: Bitmap, box: Rect): Int {
        val rect = clampToBitmap(box, bitmap)
        if (rect.width() <= 0 || rect.height() <= 0) return Color.BLACK

        val pixels = IntArray(rect.width() * rect.height())
        bitmap.getPixels(pixels, 0, rect.width(), rect.left, rect.top, rect.width(), rect.height())
        val darkest = pixels.sortedBy { luminance(it) }
        val sampleCount = max(1, darkest.size / 5)

        var r = 0L
        var g = 0L
        var b = 0L
        for (i in 0 until sampleCount) {
            val pixel = darkest[i]
            r += (pixel shr 16) and 0xFF
            g += (pixel shr 8) and 0xFF
            b += pixel and 0xFF
        }
        return Color.rgb((r / sampleCount).toInt(), (g / sampleCount).toInt(), (b / sampleCount).toInt())
    }

    /** Horizontal shear of the line's corner quad: slanted text (italic) has its top edge offset from its bottom edge. */
    private fun isItalic(line: Text.Line): Boolean {
        val corners = line.cornerPoints ?: return false
        if (corners.size < 4) return false

        val topLeft = corners[0]
        val bottomLeft = corners[3]
        val height = (bottomLeft.y - topLeft.y).toFloat()
        if (height < MIN_HEIGHT_FOR_SHEAR) return false

        val shear = (topLeft.x - bottomLeft.x).toFloat() / height
        return abs(shear) > ITALIC_SHEAR_THRESHOLD
    }

    private fun luminance(pixel: Int): Int {
        val r = (pixel shr 16) and 0xFF
        val g = (pixel shr 8) and 0xFF
        val b = pixel and 0xFF
        return (r * 299 + g * 587 + b * 114) / 1000
    }

    private fun clampToBitmap(box: Rect, bitmap: Bitmap): Rect = Rect(
        box.left.coerceIn(0, bitmap.width),
        box.top.coerceIn(0, bitmap.height),
        box.right.coerceIn(0, bitmap.width),
        box.bottom.coerceIn(0, bitmap.height),
    )

    private companion object {
        const val BOLD_INK_RATIO_FACTOR = 1.25f
        const val ITALIC_SHEAR_THRESHOLD = 0.12f
        const val MIN_HEIGHT_FOR_SHEAR = 4f
        const val MIN_CONTRAST = 10
    }
}
