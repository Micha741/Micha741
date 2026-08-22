package com.micha741.skener.data

import android.graphics.Point
import android.graphics.Rect
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

/** Coarse geometric classification of a blob's outline - only the static-photo (OpenCV) pipeline fills this in accurately. */
enum class ShapeType { TRIANGLE, RECTANGLE, TRAPEZOID, CIRCLE, OTHER }

/** One detected blob: its bounding box plus shape descriptors used for reference matching. */
data class DetectedBlob(
    val box: Rect,
    val area: Int,
    /** area / bounding-box area - how "solid" the shape is (1.0 = fills its box, e.g. a square/rectangle). */
    val fillRatio: Float,
    /** longer side / shorter side of the bounding box, always >= 1 (1.0 = square-ish). */
    val aspectRatio: Float,
    /** Real polygon classification only from the OpenCV static-photo pipeline; the live pipeline leaves this OTHER. */
    val shapeType: ShapeType = ShapeType.OTHER,
    /** Approximated outline (image pixel coords) for drawing the real edge instead of just the bounding box; empty if unknown. */
    val polygon: List<Point> = emptyList(),
)

data class BlobAnalysisResult(val blobs: List<DetectedBlob>, val count: Int)

/**
 * Resolution-agnostic blob-segmentation pipeline shared by the static-photo
 * counter ([ObjectCounter]) and the live camera preview ([LiveFrameAnalyzer]):
 *
 * Gaussian blur -> adaptive local-mean threshold (foreground/background,
 * robust to uneven lighting/shadows across the frame, unlike a single
 * global threshold) -> Sobel edge magnitude (Otsu-thresholded, used to cut
 * necks between touching items) -> morphological opening -> connected-
 * component labeling -> either a statistical area-based split of merged
 * blobs ("auto" mode), or a match against a user-picked reference piece's
 * size/shape ("reference" mode, see [matchesReference]).
 *
 * Takes a plain 0-255 grayscale buffer so callers can feed it either an
 * RGB-derived grayscale bitmap or a camera frame's raw luma (Y) plane
 * directly, without an intermediate Bitmap.
 */
object BlobAnalyzer {

    fun analyze(gray: IntArray, width: Int, height: Int, reference: DetectedBlob? = null): BlobAnalysisResult {
        val blurred = gaussianBlur(gray, width, height)
        val darkOnLight = isDarkOnLight(blurred, width, height)
        val localMean = boxMean(blurred, width, height, windowSize(width, height))

        val edgeMagnitude = sobelMagnitude(blurred, width, height)
        val edgeThreshold = otsuThreshold(histogramOf(edgeMagnitude))

        val foreground = BooleanArray(width * height) { i ->
            val isForegroundPixel = if (darkOnLight) {
                blurred[i] < localMean[i] - ADAPTIVE_C
            } else {
                blurred[i] > localMean[i] + ADAPTIVE_C
            }
            val isEdgePixel = edgeMagnitude[i] >= edgeThreshold
            isForegroundPixel && !isEdgePixel
        }

        val opened = morphologicalOpen(foreground, width, height)
        val components = labelComponents(opened, width, height)
        val minAreaPx = max(MIN_AREA_PX_FLOOR, (width * height * MIN_AREA_FRACTION_OF_FRAME).roundToInt())
        val filtered = components.filter { it.area >= minAreaPx }.map { it.toBlob() }

        if (filtered.isEmpty()) return BlobAnalysisResult(emptyList(), 0)

        if (reference != null) {
            val matched = filtered.filter { matchesReference(it, reference) }
            return BlobAnalysisResult(matched, matched.size)
        }

        val medianArea = filtered.map { it.area }.sorted()[filtered.size / 2]
        val minKeepArea = max(minAreaPx, (medianArea * MIN_AREA_RATIO).roundToInt())
        val kept = filtered.filter { it.area >= minKeepArea }

        var totalCount = 0
        for (blob in kept) {
            val estimatedPieces = if (
                filtered.size >= MIN_SAMPLES_FOR_SPLIT &&
                blob.area > medianArea * SPLIT_AREA_RATIO
            ) {
                max(1, (blob.area.toFloat() / medianArea).roundToInt())
            } else {
                1
            }
            totalCount += estimatedPieces
        }

        return BlobAnalysisResult(kept, totalCount)
    }

    /** True if [candidate]'s size/shape plausibly matches the user-picked [reference] piece. */
    fun matchesReference(candidate: DetectedBlob, reference: DetectedBlob): Boolean {
        val areaRatio = candidate.area.toFloat() / reference.area
        if (areaRatio < REF_AREA_MIN_RATIO || areaRatio > REF_AREA_MAX_RATIO) return false
        if (abs(candidate.aspectRatio - reference.aspectRatio) > REF_ASPECT_TOLERANCE) return false
        if (abs(candidate.fillRatio - reference.fillRatio) > REF_FILL_TOLERANCE) return false
        return true
    }

    /** Finds the segmented blob under (or, failing that, nearest to) a user-tapped point. */
    fun findBlobNear(blobs: List<DetectedBlob>, x: Int, y: Int): DetectedBlob? {
        blobs.firstOrNull { it.box.contains(x, y) }?.let { return it }
        if (blobs.isEmpty()) return null
        return blobs.minByOrNull { blob ->
            val dx = (blob.box.centerX() - x).toLong()
            val dy = (blob.box.centerY() - y).toLong()
            dx * dx + dy * dy
        }
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

    /** Odd window size for local-mean thresholding, scaled to the frame so it covers roughly one item. */
    private fun windowSize(width: Int, height: Int): Int {
        val size = max(15, min(width, height) / 6)
        return if (size % 2 == 0) size + 1 else size
    }

    /** Local mean of each pixel over a windowSize x windowSize box, via an integral image (O(1) per pixel). */
    private fun boxMean(src: IntArray, width: Int, height: Int, windowSize: Int): IntArray {
        val stride = width + 1
        val integral = LongArray(stride * (height + 1))
        for (y in 0 until height) {
            var rowSum = 0L
            for (x in 0 until width) {
                rowSum += src[y * width + x]
                integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum
            }
        }

        val radius = windowSize / 2
        val result = IntArray(width * height)
        for (y in 0 until height) {
            val y0 = max(0, y - radius)
            val y1 = min(height - 1, y + radius)
            for (x in 0 until width) {
                val x0 = max(0, x - radius)
                val x1 = min(width - 1, x + radius)
                val sum = integral[(y1 + 1) * stride + (x1 + 1)] -
                    integral[y0 * stride + (x1 + 1)] -
                    integral[(y1 + 1) * stride + x0] +
                    integral[y0 * stride + x0]
                val count = (x1 - x0 + 1) * (y1 - y0 + 1)
                result[y * width + x] = (sum / count).toInt()
            }
        }
        return result
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

    /** Samples the outer margin of the frame (assumed background) against the overall mean to auto-detect polarity. */
    private fun isDarkOnLight(gray: IntArray, width: Int, height: Int): Boolean {
        val margin = max(2, min(width, height) / 20)
        var borderSum = 0L
        var borderCount = 0L
        var totalSum = 0L
        for (y in 0 until height) {
            val onBorderRow = y < margin || y >= height - margin
            for (x in 0 until width) {
                val value = gray[y * width + x]
                totalSum += value
                val onBorder = onBorderRow || x < margin || x >= width - margin
                if (onBorder) {
                    borderSum += value
                    borderCount++
                }
            }
        }
        val borderMean = if (borderCount > 0) borderSum.toDouble() / borderCount else 255.0
        val overallMean = totalSum.toDouble() / (width * height)
        return borderMean >= overallMean
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

        fun toBlob(): DetectedBlob {
            val w = maxX - minX + 1
            val h = maxY - minY + 1
            val bboxArea = w * h
            val fillRatio = if (bboxArea > 0) area.toFloat() / bboxArea else 0f
            val aspectRatio = if (w > 0 && h > 0) max(w, h).toFloat() / min(w, h) else 1f
            return DetectedBlob(Rect(minX, minY, maxX + 1, maxY + 1), area, fillRatio, aspectRatio)
        }
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

    private const val MIN_AREA_PX_FLOOR = 30
    private const val MIN_AREA_FRACTION_OF_FRAME = 0.0004
    private const val MIN_AREA_RATIO = 0.15
    private const val MIN_SAMPLES_FOR_SPLIT = 3
    private const val SPLIT_AREA_RATIO = 1.6

    /** Adaptive threshold offset from the local mean (0-255 scale). */
    private const val ADAPTIVE_C = 10

    private const val REF_AREA_MIN_RATIO = 0.45f
    private const val REF_AREA_MAX_RATIO = 2.2f
    private const val REF_ASPECT_TOLERANCE = 0.5f
    private const val REF_FILL_TOLERANCE = 0.3f
}
