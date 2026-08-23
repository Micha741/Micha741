package com.micha741.skener.data.cv

import android.graphics.Bitmap
import android.graphics.Point
import android.graphics.Rect
import com.micha741.skener.data.DetectedBlob
import com.micha741.skener.data.ShapeType
import org.opencv.android.Utils
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.roundToLong
import kotlin.math.sqrt

/** One OpenCV contour with its bounding box, area and shape. Caller owns [contour] and must release() it. */
data class CvBlob(
    val box: Rect,
    val area: Double,
    val contour: MatOfPoint,
    val shapeType: ShapeType,
    /** Approximated outline (polygon corners), for drawing the real edge instead of just the bounding box. */
    val polygon: List<Point>,
)

data class CvAnalysisResult(val blobs: List<CvBlob>, val count: Int)

/** Converts a native [CvBlob] to the plain UI-facing [DetectedBlob], optionally scaling box/polygon (e.g. back to full photo resolution). */
fun CvBlob.toDetectedBlob(scale: Float = 1f): DetectedBlob {
    val scaledBox = if (scale == 1f) {
        box
    } else {
        Rect(
            (box.left * scale).roundToInt(),
            (box.top * scale).roundToInt(),
            (box.right * scale).roundToInt(),
            (box.bottom * scale).roundToInt(),
        )
    }
    val width = box.width()
    val height = box.height()
    val bboxArea = max(1, width * height)
    val fillRatio = (area / bboxArea).toFloat().coerceIn(0f, 1f)
    val aspectRatio = if (width > 0 && height > 0) max(width, height).toFloat() / min(width, height) else 1f
    val scaledPolygon = if (scale == 1f) {
        polygon
    } else {
        polygon.map { Point((it.x * scale).roundToInt(), (it.y * scale).roundToInt()) }
    }
    return DetectedBlob(scaledBox, area.roundToInt(), fillRatio, aspectRatio, shapeType, scaledPolygon)
}

/**
 * OpenCV-based object segmentation, shared by the static-photo counter and
 * the live camera preview: grayscale -> Gaussian blur -> adaptive mean
 * threshold (robust to uneven lighting/shadows, unlike one global
 * threshold; polarity - dark piece on light background or the reverse -
 * is detected per frame, see [isDarkOnLight]), OR'd together with a
 * color-distance mask (pixels whose hue/saturation/value differ enough
 * from the estimated background color - lets it separate e.g. a colored
 * piece from a similarly-lit but differently colored background, which a
 * brightness-only threshold can miss) -> morphological close+open (fills
 * small holes, drops speckle noise) -> external contours ->
 * [Imgproc.approxPolyDP] polygon classification (triangle / rectangle /
 * trapezoid / circle, by vertex count + circularity).
 *
 * With no [reference], every contour above the minimum area counts,
 * splitting statistically-oversized blobs that likely contain several
 * touching pieces. With a [reference] (a piece the user tapped on), only
 * contours of the *same shape type* whose outline also resembles it via
 * [Imgproc.matchShapes]'s Hu-moment comparison (scale/rotation invariant)
 * are kept, each counted once.
 *
 * Every [MatOfPoint] contour in the result is native-backed and must be
 * released by the caller once its bounding box/area/shape have been read out.
 */
object CvBlobAnalyzer {

    fun analyze(bitmap: Bitmap, reference: CvBlob? = null): CvAnalysisResult {
        val rgba = Mat()
        Utils.bitmapToMat(bitmap, rgba)

        val gray = Mat()
        Imgproc.cvtColor(rgba, gray, Imgproc.COLOR_RGBA2GRAY)
        Imgproc.GaussianBlur(gray, gray, Size(5.0, 5.0), 0.0)

        val darkOnLight = isDarkOnLight(gray)
        val luminanceMask = Mat()
        if (darkOnLight) {
            Imgproc.adaptiveThreshold(
                gray, luminanceMask, 255.0,
                Imgproc.ADAPTIVE_THRESH_MEAN_C, Imgproc.THRESH_BINARY_INV,
                blockSize(gray.width(), gray.height()), ADAPTIVE_C,
            )
        } else {
            Imgproc.adaptiveThreshold(
                gray, luminanceMask, 255.0,
                Imgproc.ADAPTIVE_THRESH_MEAN_C, Imgproc.THRESH_BINARY,
                blockSize(gray.width(), gray.height()), -ADAPTIVE_C,
            )
        }
        gray.release()

        val colorMask = colorDistanceMask(rgba)
        rgba.release()

        val binary = Mat()
        Core.bitwise_or(luminanceMask, colorMask, binary)
        luminanceMask.release()
        colorMask.release()

        val kernelSize = morphKernelSize(binary.width(), binary.height())
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(kernelSize, kernelSize))
        Imgproc.morphologyEx(binary, binary, Imgproc.MORPH_CLOSE, kernel)
        Imgproc.morphologyEx(binary, binary, Imgproc.MORPH_OPEN, kernel)
        kernel.release()

        val contours = mutableListOf<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(binary, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
        hierarchy.release()
        binary.release()

        val minArea = max(MIN_AREA_PX, bitmap.width * bitmap.height * MIN_AREA_FRACTION)
        val blobs = mutableListOf<CvBlob>()
        for (contour in contours) {
            val area = Imgproc.contourArea(contour)
            if (area >= minArea && isPlausiblePieceShape(contour, area)) {
                blobs += contour.toCvBlob(area)
            } else {
                contour.release()
            }
        }

        if (blobs.isEmpty()) return CvAnalysisResult(emptyList(), 0)

        if (reference != null) {
            val referenceContour2f = MatOfPoint2f(*reference.contour.toArray())
            val matched = mutableListOf<CvBlob>()
            for (blob in blobs) {
                if (matchesReference(blob, reference, referenceContour2f)) {
                    matched += blob
                } else {
                    blob.contour.release()
                }
            }
            referenceContour2f.release()
            return CvAnalysisResult(matched, matched.size)
        }

        val medianArea = blobs.map { it.area }.sorted()[blobs.size / 2]
        var totalCount = 0
        for (blob in blobs) {
            val estimated = if (blobs.size >= MIN_SAMPLES_FOR_SPLIT && blob.area > medianArea * SPLIT_AREA_RATIO) {
                // Capped: a handful of tiny leftover noise blobs could otherwise drag the median
                // area down so far that one real (possibly merged) blob "splits" into hundreds.
                max(1L, (blob.area / medianArea).roundToLong()).toInt().coerceAtMost(MAX_SPLIT_PIECES)
            } else {
                1
            }
            totalCount += estimated
        }
        return CvAnalysisResult(blobs, totalCount)
    }

    /** Finds the segmented blob under (or, failing that, nearest to) a user-tapped point. */
    fun findBlobNear(blobs: List<CvBlob>, x: Int, y: Int): CvBlob? {
        blobs.firstOrNull { it.box.contains(x, y) }?.let { return it }
        if (blobs.isEmpty()) return null
        return blobs.minByOrNull { blob ->
            val dx = (blob.box.centerX() - x).toLong()
            val dy = (blob.box.centerY() - y).toLong()
            dx * dx + dy * dy
        }
    }

    /** Same shape category (when the reference's shape is known) plus a Hu-moment outline comparison. */
    private fun matchesReference(blob: CvBlob, reference: CvBlob, referenceContour2f: MatOfPoint2f): Boolean {
        if (reference.shapeType != ShapeType.OTHER && blob.shapeType != reference.shapeType) return false
        val candidate = MatOfPoint2f(*blob.contour.toArray())
        val shapeDistance = Imgproc.matchShapes(referenceContour2f, candidate, Imgproc.CONTOURS_MATCH_I1, 0.0)
        candidate.release()
        return shapeDistance <= SHAPE_MATCH_MAX_DISTANCE
    }

    private fun MatOfPoint.toCvBlob(area: Double): CvBlob {
        val rect = Imgproc.boundingRect(this)
        val (shape, polygon) = classifyShape(this, area)
        return CvBlob(
            box = Rect(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height),
            area = area,
            contour = this,
            shapeType = shape,
            polygon = polygon,
        )
    }

    /** Classifies a contour's outline by vertex count (after polygon simplification) and circularity. */
    private fun classifyShape(contour: MatOfPoint, area: Double): Pair<ShapeType, List<Point>> {
        val contour2f = MatOfPoint2f(*contour.toArray())
        val perimeter = Imgproc.arcLength(contour2f, true)
        val approx2f = MatOfPoint2f()
        Imgproc.approxPolyDP(contour2f, approx2f, POLY_EPSILON_FACTOR * perimeter, true)
        contour2f.release()

        val points = approx2f.toArray()
        approx2f.release()
        val polygon = points.map { Point(it.x.roundToInt(), it.y.roundToInt()) }

        val circularity = if (perimeter > 0) 4 * Math.PI * area / (perimeter * perimeter) else 0.0
        val shape = when {
            circularity > CIRCLE_CIRCULARITY_THRESHOLD -> ShapeType.CIRCLE
            points.size == 3 -> ShapeType.TRIANGLE
            points.size == 4 -> if (isRectangleLike(points)) ShapeType.RECTANGLE else ShapeType.TRAPEZOID
            else -> ShapeType.OTHER
        }
        return shape to polygon
    }

    /**
     * Rejects contours that can't plausibly be a real piece, on two
     * independent measures - a thin winding line can occasionally sneak
     * past one of them alone, but rarely both:
     *  - solidity (area / convex-hull area): a real piece stays solid even
     *    if irregular; a winding line's hull sprawls far past its own area.
     *  - circularity (4*pi*area / perimeter^2): a winding line packs a lot
     *    of extra perimeter into a small area from doubling back on itself,
     *    which a straight elongated piece (even a thin one) does not.
     */
    private fun isPlausiblePieceShape(contour: MatOfPoint, area: Double): Boolean {
        if (solidityOf(contour, area) < MIN_SOLIDITY) return false

        val contour2f = MatOfPoint2f(*contour.toArray())
        val perimeter = Imgproc.arcLength(contour2f, true)
        contour2f.release()
        if (perimeter <= 0) return false

        val circularity = 4 * Math.PI * area / (perimeter * perimeter)
        return circularity >= MIN_CIRCULARITY
    }

    /**
     * area / convex-hull-area: how much of its own "envelope" a shape
     * actually fills. A solid piece (fruit, coin, screw...) has a high
     * solidity even if irregular. A thin winding line - like a crack or
     * grain line in a wood table, which a purely local threshold happily
     * flags as "foreground" since it's darker than its immediate
     * surroundings - has a convex hull far bigger than its own area, so a
     * low solidity is exactly what tells them apart from a real piece.
     */
    private fun solidityOf(contour: MatOfPoint, area: Double): Double {
        val hullIndices = MatOfInt()
        Imgproc.convexHull(contour, hullIndices)
        val points = contour.toArray()
        val indices = hullIndices.toArray()
        hullIndices.release()
        if (indices.size < 3) return 0.0

        val hullPoints = Array(indices.size) { i -> points[indices[i]] }
        val hullMat = MatOfPoint(*hullPoints)
        val hullArea = Imgproc.contourArea(hullMat)
        hullMat.release()
        return if (hullArea > 0.0) area / hullArea else 0.0
    }

    /** A quadrilateral whose opposite sides are roughly equal length looks like a rectangle rather than a trapezoid. */
    private fun isRectangleLike(points: Array<org.opencv.core.Point>): Boolean {
        if (points.size != 4) return false
        val sideLengths = (0 until 4).map { i ->
            val p1 = points[i]
            val p2 = points[(i + 1) % 4]
            val dx = p1.x - p2.x
            val dy = p1.y - p2.y
            sqrt(dx * dx + dy * dy)
        }
        val ratio1 = sideLengths[0] / max(sideLengths[2], MIN_SIDE_LENGTH)
        val ratio2 = sideLengths[1] / max(sideLengths[3], MIN_SIDE_LENGTH)
        return abs(ratio1 - 1.0) < RECT_SIDE_TOLERANCE && abs(ratio2 - 1.0) < RECT_SIDE_TOLERANCE
    }

    /**
     * Foreground mask from color alone: converts to HSV, estimates the
     * background color as the per-channel *median* across the whole frame
     * (not just its border - a piece filling much of the frame, e.g. when
     * zoomed in, would otherwise contaminate a border-only sample and make
     * the estimate worse the closer you get), then flags pixels whose hue/
     * saturation/value differ enough from that estimate. This is what lets
     * e.g. a red piece on a similarly-bright gray table get segmented
     * correctly even when a brightness-only threshold can't tell them
     * apart. The median only holds up while the background is still the
     * majority of the frame (piece under ~50% of the frame area).
     */
    private fun colorDistanceMask(rgba: Mat): Mat {
        val bgr = Mat()
        Imgproc.cvtColor(rgba, bgr, Imgproc.COLOR_RGBA2BGR)
        val hsv = Mat()
        Imgproc.cvtColor(bgr, hsv, Imgproc.COLOR_BGR2HSV)
        bgr.release()

        val hsvChannels = ArrayList<Mat>()
        Core.split(hsv, hsvChannels)
        val background = Scalar(
            medianOf(hsvChannels[0]),
            medianOf(hsvChannels[1]),
            medianOf(hsvChannels[2]),
        )
        hsvChannels.forEach { it.release() }

        val backgroundMat = Mat(hsv.size(), hsv.type(), background)
        val diff = Mat()
        Core.absdiff(hsv, backgroundMat, diff)
        backgroundMat.release()
        hsv.release()

        val channels = ArrayList<Mat>()
        Core.split(diff, channels)
        diff.release()
        val (hueDiff, satDiff, valDiff) = Triple(channels[0], channels[1], channels[2])

        val brightnessDiff = Mat()
        Core.addWeighted(satDiff, 0.5, valDiff, 0.5, 0.0, brightnessDiff)
        satDiff.release()
        valDiff.release()

        val combinedDiff = Mat()
        Core.addWeighted(brightnessDiff, 0.7, hueDiff, 0.3, 0.0, combinedDiff)
        brightnessDiff.release()
        hueDiff.release()

        val mask = Mat()
        Imgproc.threshold(combinedDiff, mask, COLOR_DISTANCE_THRESHOLD, 255.0, Imgproc.THRESH_BINARY)
        combinedDiff.release()
        return mask
    }

    /** Median value of a single-channel 8-bit Mat, via a native sort (fast even for a full photo). */
    private fun medianOf(channel: Mat): Double {
        val flat = channel.reshape(1, 1)
        val sorted = Mat()
        Core.sort(flat, sorted, Core.SORT_ASCENDING)
        val value = sorted.get(0, sorted.cols() / 2)[0]
        sorted.release()
        return value
    }

    /**
     * True if the frame's outer margin (assumed background) is lighter than
     * the frame's overall mean - i.e. the piece is likely darker than its
     * background, not the other way round. Fixed polarity (always assuming
     * dark-on-light) made adaptiveThreshold flag the *background* as
     * foreground on a dark background, instead of the actual piece.
     */
    private fun isDarkOnLight(gray: Mat): Boolean {
        val margin = max(2, min(gray.width(), gray.height()) / 20)
        val borderMask = Mat.zeros(gray.size(), CvType.CV_8UC1)
        val w = gray.width().toDouble()
        val h = gray.height().toDouble()
        Imgproc.rectangle(borderMask, org.opencv.core.Point(0.0, 0.0), org.opencv.core.Point(w - 1, margin - 1.0), Scalar(255.0), -1)
        Imgproc.rectangle(borderMask, org.opencv.core.Point(0.0, h - margin), org.opencv.core.Point(w - 1, h - 1), Scalar(255.0), -1)
        Imgproc.rectangle(borderMask, org.opencv.core.Point(0.0, 0.0), org.opencv.core.Point(margin - 1.0, h - 1), Scalar(255.0), -1)
        Imgproc.rectangle(borderMask, org.opencv.core.Point(w - margin, 0.0), org.opencv.core.Point(w - 1, h - 1), Scalar(255.0), -1)

        val borderMean = Core.mean(gray, borderMask).`val`[0]
        borderMask.release()
        val overallMean = Core.mean(gray).`val`[0]
        return borderMean >= overallMean
    }

    /** Odd window size for adaptive thresholding, scaled to the photo so it covers roughly one item. */
    private fun blockSize(width: Int, height: Int): Int {
        val size = max(15, min(width, height) / 6)
        return if (size % 2 == 0) size + 1 else size
    }

    /**
     * Morphological open/close kernel size, scaled to the frame instead of
     * a fixed pixel size - a fixed 5x5 kernel is fine on a downscaled ~300px
     * live frame but far too small relative to a ~900px static photo to
     * erode away thin noise (wood grain, cracks) before it reaches contours.
     */
    private fun morphKernelSize(width: Int, height: Int): Double =
        max(3, min(width, height) / 100).toDouble()

    private const val MIN_AREA_PX = 40.0
    private const val MIN_AREA_FRACTION = 0.0004
    private const val MIN_SOLIDITY = 0.65
    private const val MIN_CIRCULARITY = 0.15
    private const val ADAPTIVE_C = 10.0
    private const val COLOR_DISTANCE_THRESHOLD = 40.0
    private const val MIN_SAMPLES_FOR_SPLIT = 3
    private const val SPLIT_AREA_RATIO = 1.6
    private const val MAX_SPLIT_PIECES = 20
    private const val SHAPE_MATCH_MAX_DISTANCE = 0.3
    private const val POLY_EPSILON_FACTOR = 0.02
    private const val CIRCLE_CIRCULARITY_THRESHOLD = 0.85
    private const val RECT_SIDE_TOLERANCE = 0.25
    private const val MIN_SIDE_LENGTH = 0.001
}
