package com.micha741.skener.data

import android.graphics.Bitmap
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.ObjectDetector
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
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
 * decodes the YUV_420_888 frame into a small upright [Bitmap] (downsampled
 * while reading straight from the Y/U/V planes - no JPEG round-trip), and
 * runs it through ML Kit's on-device Object Detection & Tracking
 * (STREAM_MODE) - the same trained detector the static-photo counter uses
 * in SINGLE_IMAGE_MODE (see [com.micha741.skener.data.ObjectCounter]),
 * instead of a hand-tuned OpenCV threshold pipeline that kept mistaking
 * background texture for pieces.
 *
 * [requestReferenceAt] lets the UI pick a reference piece by tapping a spot
 * in frame coordinates; the analyzer resolves it against the *next*
 * analyzed frame's detections and retains that blob until [clearReference]
 * or [release].
 */
class LiveFrameAnalyzer(
    private val onResult: (LiveFrameResult) -> Unit,
) : ImageAnalysis.Analyzer {

    private val detector: ObjectDetector = ObjectDetection.getClient(
        ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)
            .enableMultipleObjects()
            .enableClassification()
            .build(),
    )

    @Volatile
    private var referenceBlob: DetectedBlob? = null

    @Volatile
    private var pendingReferenceTap: IntArray? = null

    @Volatile
    private var lastAnalyzedAtMs = 0L

    /** Call from the UI thread: the blob nearest ([x], [y]) in *frame* coordinates becomes the reference on the next frame. */
    fun requestReferenceAt(x: Int, y: Int) {
        pendingReferenceTap = intArrayOf(x, y)
    }

    /** Drops the retained reference, if any, going back to counting every detected piece. */
    fun clearReference() {
        referenceBlob = null
    }

    /** Releases the detector - call when the camera screen is torn down. */
    fun release() {
        referenceBlob = null
        detector.close()
    }

    override fun analyze(imageProxy: ImageProxy) {
        val now = System.currentTimeMillis()
        if (now - lastAnalyzedAtMs < THROTTLE_MS) {
            imageProxy.close()
            return
        }
        lastAnalyzedAtMs = now

        try {
            val bitmap = extractRotatedBitmap(imageProxy, MAX_DIMENSION)
            val width = bitmap.width
            val height = bitmap.height

            val detected = Tasks.await(detector.process(InputImage.fromBitmap(bitmap, 0)))
            bitmap.recycle()
            val allBlobs = detected.map { it.toDetectedBlob() }

            val tap = pendingReferenceTap
            if (tap != null) {
                pendingReferenceTap = null
                referenceBlob = findBlobNear(allBlobs, tap[0], tap[1])
            }

            val reference = referenceBlob
            val blobs = if (reference != null) allBlobs.filter { matchesReference(it, reference) } else allBlobs

            onResult(LiveFrameResult(blobs, blobs.size, width, height, reference != null))
        } finally {
            imageProxy.close()
        }
    }

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
