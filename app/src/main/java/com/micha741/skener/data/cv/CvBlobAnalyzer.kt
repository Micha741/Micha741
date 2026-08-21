package com.micha741.skener.data.cv

import android.graphics.Bitmap
import android.graphics.Rect
import org.opencv.android.Utils
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToLong

/** One OpenCV contour with its bounding box and area. Caller owns [contour] and must release() it. */
data class CvBlob(val box: Rect, val area: Double, val contour: MatOfPoint)

data class CvAnalysisResult(val blobs: List<CvBlob>, val count: Int)

/**
 * OpenCV-based object segmentation for the static-photo piece counter:
 * grayscale -> Gaussian blur -> adaptive mean threshold (robust to uneven
 * lighting/shadows across the photo, unlike one global threshold) ->
 * morphological close+open (fills small holes, drops speckle noise) ->
 * external contours.
 *
 * With no [referenceContour], every contour above the minimum area counts,
 * splitting statistically-oversized blobs that likely contain several
 * touching pieces. With a [referenceContour] (a piece the user tapped on),
 * only contours whose *shape* resembles it - via [Imgproc.matchShapes]'s
 * Hu-moment comparison, which is scale- and rotation-invariant - are kept,
 * each counted once.
 *
 * Every [MatOfPoint] contour in the result is native-backed and must be
 * released by the caller once its bounding box/area have been read out.
 */
object CvBlobAnalyzer {

    fun analyze(bitmap: Bitmap, referenceContour: MatOfPoint2f? = null): CvAnalysisResult {
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

        if (referenceContour != null) {
            val matched = mutableListOf<CvBlob>()
            for (blob in blobs) {
                if (matchesReference(blob, referenceContour)) {
                    matched += blob
                } else {
                    blob.contour.release()
                }
            }
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

    /** Hu-moment shape comparison (scale/rotation invariant): low distance = similar outline. */
    private fun matchesReference(blob: CvBlob, referenceContour: MatOfPoint2f): Boolean {
        val candidate = MatOfPoint2f(*blob.contour.toArray())
        val shapeDistance = Imgproc.matchShapes(referenceContour, candidate, Imgproc.CONTOURS_MATCH_I1, 0.0)
        candidate.release()
        return shapeDistance <= SHAPE_MATCH_MAX_DISTANCE
    }

    private fun MatOfPoint.toCvBlob(area: Double): CvBlob {
        val rect = Imgproc.boundingRect(this)
        return CvBlob(Rect(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height), area, this)
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
}
