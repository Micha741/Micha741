package com.micha741.skener.data

import android.graphics.Bitmap
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.micha741.skener.data.cv.CvBlob
import com.micha741.skener.data.cv.CvBlobAnalyzer
import com.micha741.skener.data.cv.toDetectedBlob
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class LiveFrameResult(
    val blobs: List<DetectedBlob>,
    val count: Int,
    val frameWidth: Int,
    val frameHeight: Int,
    val referenceActive: Boolean,
)

/**
 * CameraX [ImageAnalysis.Analyzer] that throttles incoming preview frames,
 * decodes the YUV_420_888 frame into a small *color* [Bitmap] (downsampled
 * while reading straight from the Y/U/V planes - no JPEG round-trip), and
 * runs it through the same OpenCV pipeline as the static-photo counter
 * ([CvBlobAnalyzer]): adaptive threshold + color-distance segmentation,
 * real contours and shape classification, instead of the cruder luma-only
 * pipeline this used to run for the sake of frame rate.
 *
 * [requestReferenceAt] lets the UI pick a reference piece by tapping a spot
 * in frame coordinates; the analyzer resolves it against the *next*
 * analyzed frame and retains that blob's native contour across frames
 * until [clearReference] or [release] - both are safe to call from any
 * thread, synchronized against the analysis thread so the retained
 * contour is never read after being released.
 */
class LiveFrameAnalyzer(
    private val onResult: (LiveFrameResult) -> Unit,
) : ImageAnalysis.Analyzer {

    private val referenceLock = Any()
    private var referenceBlob: CvBlob? = null

    @Volatile
    private var pendingReferenceTap: IntArray? = null

    @Volatile
    private var lastAnalyzedAtMs = 0L

    /** Call from the UI thread: the blob nearest ([x], [y]) in *frame* coordinates becomes the reference on the next frame. */
    fun requestReferenceAt(x: Int, y: Int) {
        pendingReferenceTap = intArrayOf(x, y)
    }

    /** Drops the retained reference, if any, going back to counting every detected piece. */
    fun clearReference() = setReference(null)

    /** Releases the retained reference contour, if any - call when the camera screen is torn down. */
    fun release() = setReference(null)

    override fun analyze(imageProxy: ImageProxy) {
        val now = System.currentTimeMillis()
        if (now - lastAnalyzedAtMs < THROTTLE_MS) {
            imageProxy.close()
            return
        }
        lastAnalyzedAtMs = now

        try {
            val bitmap = extractRotatedBitmap(imageProxy, MAX_DIMENSION)

            val tap = pendingReferenceTap
            if (tap != null) {
                pendingReferenceTap = null
                resolveReferenceTap(bitmap, tap[0], tap[1])
            }

            val reference = currentReference()
            val result = CvBlobAnalyzer.analyze(bitmap, reference)
            val width = bitmap.width
            val height = bitmap.height
            val blobs = result.blobs.map { it.toDetectedBlob() }
            result.blobs.forEach { it.contour.release() }
            bitmap.recycle()

            onResult(LiveFrameResult(blobs, result.count, width, height, reference != null))
        } finally {
            imageProxy.close()
        }
    }

    /** Runs one auto-mode pass to find the blob under the tapped point, then retains just that one as the reference. */
    private fun resolveReferenceTap(bitmap: Bitmap, x: Int, y: Int) {
        val auto = CvBlobAnalyzer.analyze(bitmap)
        val picked = CvBlobAnalyzer.findBlobNear(auto.blobs, x, y)
        if (picked != null) {
            setReference(picked)
            auto.blobs.forEach { if (it !== picked) it.contour.release() }
        } else {
            auto.blobs.forEach { it.contour.release() }
        }
    }

    private fun setReference(blob: CvBlob?) {
        synchronized(referenceLock) {
            if (referenceBlob !== blob) referenceBlob?.contour?.release()
            referenceBlob = blob
        }
    }

    private fun currentReference(): CvBlob? = synchronized(referenceLock) { referenceBlob }

    /** Converts the YUV_420_888 frame to a small upright ARGB [Bitmap], downsampling while reading (no JPEG round-trip). */
    private fun extractRotatedBitmap(imageProxy: ImageProxy, maxDimension: Int): Bitmap {
        val yPlane = imageProxy.planes[0]
        val uPlane = imageProxy.planes[1]
        val vPlane = imageProxy.planes[2]

        val yData = yPlane.buffer.let { it.rewind(); ByteArray(it.remaining()).also(it::get) }
        val uData = uPlane.buffer.let { it.rewind(); ByteArray(it.remaining()).also(it::get) }
        val vData = vPlane.buffer.let { it.rewind(); ByteArray(it.remaining()).also(it::get) }

        val srcWidth = imageProxy.width
        val srcHeight = imageProxy.height
        val scale = min(1f, maxDimension.toFloat() / max(srcWidth, srcHeight))
        val dstWidth = max(1, (srcWidth * scale).roundToInt())
        val dstHeight = max(1, (srcHeight * scale).roundToInt())

        val pixels = IntArray(dstWidth * dstHeight)
        for (dy in 0 until dstHeight) {
            val sy = min(srcHeight - 1, (dy / scale).roundToInt())
            val yRowStart = sy * yPlane.rowStride
            val uvRow = sy / 2
            val uRowStart = uvRow * uPlane.rowStride
            val vRowStart = uvRow * vPlane.rowStride
            for (dx in 0 until dstWidth) {
                val sx = min(srcWidth - 1, (dx / scale).roundToInt())
                val yValue = yData[yRowStart + sx * yPlane.pixelStride].toInt() and 0xFF
                val uvCol = sx / 2
                val uValue = (uData[uRowStart + uvCol * uPlane.pixelStride].toInt() and 0xFF) - 128
                val vValue = (vData[vRowStart + uvCol * vPlane.pixelStride].toInt() and 0xFF) - 128

                val r = (yValue + 1.402f * vValue).roundToInt().coerceIn(0, 255)
                val g = (yValue - 0.344136f * uValue - 0.714136f * vValue).roundToInt().coerceIn(0, 255)
                val b = (yValue + 1.772f * uValue).roundToInt().coerceIn(0, 255)

                pixels[dy * dstWidth + dx] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
            }
        }

        val (rotated, rotatedWidth, rotatedHeight) = rotate(pixels, dstWidth, dstHeight, imageProxy.imageInfo.rotationDegrees)
        return Bitmap.createBitmap(rotated, rotatedWidth, rotatedHeight, Bitmap.Config.ARGB_8888)
    }

    /** Rotates an ARGB pixel buffer so it matches the orientation the user sees in the preview. */
    private fun rotate(pixels: IntArray, width: Int, height: Int, degrees: Int): Triple<IntArray, Int, Int> {
        return when (((degrees % 360) + 360) % 360) {
            90 -> {
                val out = IntArray(width * height)
                for (y in 0 until height) {
                    for (x in 0 until width) {
                        val nx = height - 1 - y
                        val ny = x
                        out[ny * height + nx] = pixels[y * width + x]
                    }
                }
                Triple(out, height, width)
            }
            180 -> {
                val out = IntArray(width * height)
                for (i in pixels.indices) out[pixels.size - 1 - i] = pixels[i]
                Triple(out, width, height)
            }
            270 -> {
                val out = IntArray(width * height)
                for (y in 0 until height) {
                    for (x in 0 until width) {
                        val nx = y
                        val ny = width - 1 - x
                        out[ny * height + nx] = pixels[y * width + x]
                    }
                }
                Triple(out, height, width)
            }
            else -> Triple(pixels, width, height)
        }
    }

    private companion object {
        const val THROTTLE_MS = 250L
        const val MAX_DIMENSION = 300
    }
}
