package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Point
import android.net.Uri
import com.micha741.skener.data.cv.CvBlob
import com.micha741.skener.data.cv.CvBlobAnalyzer
import com.micha741.skener.data.cv.toDetectedBlob
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class CountResult(
    val blobs: List<DetectedBlob>,
    val count: Int,
    val referenceBlob: DetectedBlob? = null,
    /** Auto mode only: how many blobs of each shape were found, so "find identical pieces" works without a manual tap. */
    val shapeBreakdown: Map<ShapeType, Int> = emptyMap(),
)

/**
 * Counts discrete objects in a still photo via [CvBlobAnalyzer] (OpenCV:
 * adaptive threshold + contours + polygon shape classification). Works
 * best for well-lit items on a reasonably uniform, contrasting background
 * (parts on a table, coins, tablets, etc.).
 *
 * If [referenceTap] is given (a point in the *original* photo's pixel
 * coordinates that the user tapped on one piece), only blobs of the same
 * shape category whose outline also resembles that piece (Hu-moment
 * matching) are kept and counted 1:1. Otherwise every plausible blob is
 * counted, splitting statistically-oversized merged blobs, and grouped by
 * shape in [CountResult.shapeBreakdown].
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
        val scaledDown = if (downscale < 1f) {
            Bitmap.createScaledBitmap(original, workWidth, workHeight, true)
        } else {
            original
        }
        // Utils.bitmapToMat requires a software ARGB_8888/RGBA_F16 bitmap.
        val working = if (scaledDown.config != Bitmap.Config.ARGB_8888) {
            scaledDown.copy(Bitmap.Config.ARGB_8888, false)
        } else {
            scaledDown
        }
        if (scaledDown !== original && scaledDown !== working) scaledDown.recycle()
        if (original !== working) original.recycle()

        val auto = CvBlobAnalyzer.analyze(working)

        var referenceCvBlob: CvBlob? = null
        if (referenceTap != null) {
            val workX = (referenceTap.x * downscale).roundToInt().coerceIn(0, working.width - 1)
            val workY = (referenceTap.y * downscale).roundToInt().coerceIn(0, working.height - 1)
            referenceCvBlob = CvBlobAnalyzer.findBlobNear(auto.blobs, workX, workY)
        }

        val result = if (referenceCvBlob != null) {
            CvBlobAnalyzer.analyze(working, referenceCvBlob)
        } else {
            auto
        }

        val inverseScale = if (downscale < 1f) 1f / downscale else 1f
        val blobs = result.blobs.map { it.toDetectedBlob(inverseScale) }
        val scaledReference = referenceCvBlob?.toDetectedBlob(inverseScale)
        val shapeBreakdown = if (referenceCvBlob == null) {
            result.blobs.groupingBy { it.shapeType }.eachCount()
        } else {
            emptyMap()
        }

        auto.blobs.forEach { it.contour.release() }
        if (result !== auto) result.blobs.forEach { it.contour.release() }
        working.recycle()

        return CountResult(blobs, result.count, scaledReference, shapeBreakdown)
    }

    private companion object {
        const val WORKING_MAX_DIMENSION = 900
    }
}
