package com.micha741.skener.data.cv

import android.graphics.Bitmap
import android.graphics.Point
import android.graphics.Rect
import com.micha741.skener.data.ShapeType
import org.opencv.android.Utils
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
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

/**
 * OpenCV-based object segmentation for the static-photo piece counter:
 * grayscale -> Gaussian blur -> adaptive mean threshold (robust to uneven
 * lighting/shadows across the photo, unlike one global threshold) ->
 * morphological close+open (fills small holes, drops speckle noise) ->
 * external contours -> [Imgproc.approxPolyDP] polygon classification
 * (triangle / rectangle / trapezoid / circle, by vertex count + circularity).
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
        rgba.release()

        Imgproc.GaussianBlur(gray, gray, Size(5.0, 5.0), 0.0)

        val binary = Mat()
        Imgproc.adaptiveThreshold(
            gray, binary, 255.0,
            Imgproc.ADAPTIVE_THRESH_MEAN_C, Imgproc.THRESH_BINARY_INV,
            blockSize(gray.width(), gray.height()), ADAPTIVE_C,
        )
        gray.release()

        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(5.0, 5.0))
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
            if (area >= minArea) {
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
                max(1L, (blob.area / medianArea).roundToLong()).toInt()
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

    /** Odd window size for adaptive thresholding, scaled to the photo so it covers roughly one item. */
    private fun blockSize(width: Int, height: Int): Int {
        val size = max(15, min(width, height) / 6)
        return if (size % 2 == 0) size + 1 else size
    }

    private const val MIN_AREA_PX = 40.0
    private const val MIN_AREA_FRACTION = 0.0004
    private const val ADAPTIVE_C = 10.0
    private const val MIN_SAMPLES_FOR_SPLIT = 3
    private const val SPLIT_AREA_RATIO = 1.6
    private const val SHAPE_MATCH_MAX_DISTANCE = 0.3
    private const val POLY_EPSILON_FACTOR = 0.02
    private const val CIRCLE_CIRCULARITY_THRESHOLD = 0.85
    private const val RECT_SIDE_TOLERANCE = 0.25
    private const val MIN_SIDE_LENGTH = 0.001
}
