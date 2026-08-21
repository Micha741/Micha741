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
import kotlin.math.sqrt

data class CountResult(val boxes: List<Rect>, val count: Int)

/**
 * Counts discrete objects in a photo using a classic image-processing
 * pipeline instead of a generic ML object detector (which is tuned for
 * categories like "fashion goods" or "food", not for tallying identical
 * small parts on a table):
 *
 * grayscale -> Gaussian blur -> Otsu threshold (foreground/background) ->
 * Sobel edge magnitude (also Otsu-thresholded, used to cut necks between
 * touching items) -> morphological opening -> connected-component labeling
 * -> statistical area-based splitting of merged blobs.
 *
 * Works best for well-lit items on a reasonably uniform, contrasting
 * background (parts on a table, coins, tablets, etc.).
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
        val blurred = gaussianBlur(gray, width, height)

        val threshold = otsuThreshold(histogramOf(blurred))
        val darkOnLight = isDarkOnLight(blurred, width, height, threshold)

        val edgeMagnitude = sobelMagnitude(blurred, width, height)
        val edgeThreshold = otsuThreshold(histogramOf(edgeMagnitude))

        val foreground = BooleanArray(width * height) { i ->
            val isForegroundPixel = if (darkOnLight) blurred[i] < threshold else blurred[i] > threshold
            val isEdgePixel = edgeMagnitude[i] >= edgeThreshold
            isForegroundPixel && !isEdgePixel
        }

        val opened = morphologicalOpen(foreground, width, height)
        val components = labelComponents(opened, width, height)
        val filtered = components.filter { it.area >= MIN_AREA_PX }

        if (filtered.isEmpty()) return CountResult(emptyList(), 0)

        val medianArea = filtered.map { it.area }.sorted()[filtered.size / 2]
        val minKeepArea = max(MIN_AREA_PX, (medianArea * MIN_AREA_RATIO).roundToInt())
        val kept = filtered.filter { it.area >= minKeepArea }

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val boxes = mutableListOf<Rect>()
        var totalCount = 0

        for (component in kept) {
            val estimatedPieces = if (
                filtered.size >= MIN_SAMPLES_FOR_SPLIT &&
                component.area > medianArea * SPLIT_AREA_RATIO
            ) {
                max(1, (component.area.toFloat() / medianArea).roundToInt())
            } else {
                1
            }
            totalCount += estimatedPieces
            boxes += scaleRect(component.boundingBox(), inverseScale)
        }

        return CountResult(boxes, totalCount)
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

    /** Separable 5x5 binomial approximation of a Gaussian blur (sigma ~= 1). */
    private fun gaussianBlur(src: IntArray, width: Int, height: Int): IntArray {
        val kernel = intArrayOf(1, 4, 6, 4, 1)
        val kernelSum = 16
        val radius = 2

        val horizontal = IntArray(src.size)
        for (y in 0 until height) {
            val rowOffset = y * width
            for (x in 0 until width) {
                var sum = 0
                for (k in -radius..radius) {
                    val sx = (x + k).coerceIn(0, width - 1)
                    sum += src[rowOffset + sx] * kernel[k + radius]
                }
                horizontal[rowOffset + x] = sum / kernelSum
            }
        }

        val vertical = IntArray(src.size)
        for (y in 0 until height) {
            for (x in 0 until width) {
                var sum = 0
                for (k in -radius..radius) {
                    val sy = (y + k).coerceIn(0, height - 1)
                    sum += horizontal[sy * width + x] * kernel[k + radius]
                }
                vertical[y * width + x] = sum / kernelSum
            }
        }
        return vertical
    }

    private fun histogramOf(values: IntArray): IntArray {
        val hist = IntArray(256)
        for (v in values) hist[v.coerceIn(0, 255)]++
        return hist
    }

    /** Otsu's method: picks the threshold that maximizes between-class variance. */
    private fun otsuThreshold(histogram: IntArray): Int {
        val total = histogram.sum()
        if (total == 0) return 128

        var sum = 0L
        for (i in 0..255) sum += i.toLong() * histogram[i]

        var sumB = 0L
        var weightB = 0L
        var maxVariance = -1.0
        var threshold = 128

        for (t in 0..255) {
            weightB += histogram[t]
            if (weightB == 0L) continue
            val weightF = total - weightB
            if (weightF == 0L) break

            sumB += t.toLong() * histogram[t]
            val meanB = sumB.toDouble() / weightB
            val meanF = (sum - sumB).toDouble() / weightF
            val diff = meanB - meanF
            val variance = weightB.toDouble() * weightF.toDouble() * diff * diff

            if (variance > maxVariance) {
                maxVariance = variance
                threshold = t
            }
        }
        return threshold
    }

    /** Samples the outer margin of the frame (assumed background) to auto-detect polarity. */
    private fun isDarkOnLight(gray: IntArray, width: Int, height: Int, threshold: Int): Boolean {
        val margin = max(2, min(width, height) / 20)
        var sum = 0L
        var count = 0L
        for (y in 0 until height) {
            val onBorderRow = y < margin || y >= height - margin
            for (x in 0 until width) {
                val onBorder = onBorderRow || x < margin || x >= width - margin
                if (onBorder) {
                    sum += gray[y * width + x]
                    count++
                }
            }
        }
        val borderMean = if (count > 0) sum.toDouble() / count else 255.0
        return borderMean >= threshold
    }

    private fun sobelMagnitude(src: IntArray, width: Int, height: Int): IntArray {
        val magnitudes = IntArray(src.size)
        var maxMagnitude = 1

        for (y in 0 until height) {
            for (x in 0 until width) {
                val x0 = (x - 1).coerceIn(0, width - 1)
                val x2 = (x + 1).coerceIn(0, width - 1)
                val y0 = (y - 1).coerceIn(0, height - 1)
                val y2 = (y + 1).coerceIn(0, height - 1)

                val tl = src[y0 * width + x0]; val tc = src[y0 * width + x]; val tr = src[y0 * width + x2]
                val ml = src[y * width + x0]; val mr = src[y * width + x2]
                val bl = src[y2 * width + x0]; val bc = src[y2 * width + x]; val br = src[y2 * width + x2]

                val gx = (tr + 2 * mr + br) - (tl + 2 * ml + bl)
                val gy = (bl + 2 * bc + br) - (tl + 2 * tc + tr)
                val mag = sqrt((gx * gx + gy * gy).toDouble()).roundToInt()
                magnitudes[y * width + x] = mag
                if (mag > maxMagnitude) maxMagnitude = mag
            }
        }

        return IntArray(magnitudes.size) { i -> (magnitudes[i] * 255 / maxMagnitude).coerceIn(0, 255) }
    }

    private fun morphologicalOpen(mask: BooleanArray, width: Int, height: Int): BooleanArray =
        dilate(erode(mask, width, height), width, height)

    private fun erode(mask: BooleanArray, width: Int, height: Int): BooleanArray {
        val result = BooleanArray(mask.size)
        for (y in 0 until height) {
            for (x in 0 until width) {
                var allSet = true
                for (dy in -1..1) {
                    for (dx in -1..1) {
                        val nx = x + dx
                        val ny = y + dy
                        val value = nx in 0 until width && ny in 0 until height && mask[ny * width + nx]
                        if (!value) allSet = false
                    }
                }
                result[y * width + x] = allSet
            }
        }
        return result
    }

    private fun dilate(mask: BooleanArray, width: Int, height: Int): BooleanArray {
        val result = BooleanArray(mask.size)
        for (y in 0 until height) {
            for (x in 0 until width) {
                var anySet = false
                for (dy in -1..1) {
                    for (dx in -1..1) {
                        val nx = x + dx
                        val ny = y + dy
                        if (nx in 0 until width && ny in 0 until height && mask[ny * width + nx]) {
                            anySet = true
                        }
                    }
                }
                result[y * width + x] = anySet
            }
        }
        return result
    }

    private class Component {
        var area = 0
        var minX = Int.MAX_VALUE
        var minY = Int.MAX_VALUE
        var maxX = Int.MIN_VALUE
        var maxY = Int.MIN_VALUE

        fun boundingBox(): Rect = Rect(minX, minY, maxX + 1, maxY + 1)
    }

    private fun labelComponents(mask: BooleanArray, width: Int, height: Int): List<Component> {
        val visited = BooleanArray(mask.size)
        val components = mutableListOf<Component>()
        val queue = ArrayDeque<Int>()

        for (start in mask.indices) {
            if (!mask[start] || visited[start]) continue

            val component = Component()
            queue.add(start)
            visited[start] = true

            while (queue.isNotEmpty()) {
                val index = queue.removeFirst()
                val x = index % width
                val y = index / width

                component.area++
                if (x < component.minX) component.minX = x
                if (x > component.maxX) component.maxX = x
                if (y < component.minY) component.minY = y
                if (y > component.maxY) component.maxY = y

                if (x > 0) tryVisit(index - 1, mask, visited, queue)
                if (x < width - 1) tryVisit(index + 1, mask, visited, queue)
                if (y > 0) tryVisit(index - width, mask, visited, queue)
                if (y < height - 1) tryVisit(index + width, mask, visited, queue)
            }
            components += component
        }
        return components
    }

    private fun tryVisit(index: Int, mask: BooleanArray, visited: BooleanArray, queue: ArrayDeque<Int>) {
        if (mask[index] && !visited[index]) {
            visited[index] = true
            queue.add(index)
        }
    }

    private companion object {
        const val WORKING_MAX_DIMENSION = 900
        const val MIN_AREA_PX = 30
        const val MIN_AREA_RATIO = 0.15
        const val MIN_SAMPLES_FOR_SPLIT = 3
        const val SPLIT_AREA_RATIO = 1.6
    }
}
