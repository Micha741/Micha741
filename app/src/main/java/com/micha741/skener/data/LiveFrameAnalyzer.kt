package com.micha741.skener.data

import android.graphics.Rect
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class LiveFrameResult(val boxes: List<Rect>, val count: Int, val frameWidth: Int, val frameHeight: Int)

/**
 * CameraX [ImageAnalysis.Analyzer] that throttles incoming preview frames,
 * extracts the luma (Y) plane directly as a grayscale buffer (it already
 * *is* a grayscale image, no RGB conversion needed), normalizes it to the
 * display's upright orientation, and runs it through [BlobAnalyzer] for a
 * live running count while the user aims the camera.
 */
class LiveFrameAnalyzer(
    private val onResult: (LiveFrameResult) -> Unit,
) : ImageAnalysis.Analyzer {

    @Volatile
    private var lastAnalyzedAtMs = 0L

    override fun analyze(imageProxy: ImageProxy) {
        val now = System.currentTimeMillis()
        if (now - lastAnalyzedAtMs < THROTTLE_MS) {
            imageProxy.close()
            return
        }
        lastAnalyzedAtMs = now

        try {
            val frame = extractGrayscale(imageProxy, MAX_DIMENSION)
            val (rotated, rotatedWidth, rotatedHeight) = rotate(
                frame.pixels,
                frame.width,
                frame.height,
                imageProxy.imageInfo.rotationDegrees,
            )
            val result = BlobAnalyzer.analyze(rotated, rotatedWidth, rotatedHeight)
            onResult(LiveFrameResult(result.boxes, result.count, rotatedWidth, rotatedHeight))
        } finally {
            imageProxy.close()
        }
    }

    private class GrayscaleFrame(val pixels: IntArray, val width: Int, val height: Int)

    /** Reads the Y (luma) plane directly, downsampling to [maxDimension] with nearest-neighbor. */
    private fun extractGrayscale(imageProxy: ImageProxy, maxDimension: Int): GrayscaleFrame {
        val plane = imageProxy.planes[0]
        val buffer = plane.buffer
        buffer.rewind()
        val data = ByteArray(buffer.remaining())
        buffer.get(data)

        val rowStride = plane.rowStride
        val pixelStride = plane.pixelStride
        val srcWidth = imageProxy.width
        val srcHeight = imageProxy.height

        val scale = min(1f, maxDimension.toFloat() / max(srcWidth, srcHeight))
        val dstWidth = max(1, (srcWidth * scale).roundToInt())
        val dstHeight = max(1, (srcHeight * scale).roundToInt())

        val gray = IntArray(dstWidth * dstHeight)
        for (dy in 0 until dstHeight) {
            val sy = min(srcHeight - 1, (dy / scale).roundToInt())
            val rowStart = sy * rowStride
            for (dx in 0 until dstWidth) {
                val sx = min(srcWidth - 1, (dx / scale).roundToInt())
                gray[dy * dstWidth + dx] = data[rowStart + sx * pixelStride].toInt() and 0xFF
            }
        }
        return GrayscaleFrame(gray, dstWidth, dstHeight)
    }

    /** Rotates the buffer so it matches the orientation the user sees in the preview. */
    private fun rotate(gray: IntArray, width: Int, height: Int, degrees: Int): Triple<IntArray, Int, Int> {
        return when (((degrees % 360) + 360) % 360) {
            90 -> {
                val out = IntArray(width * height)
                for (y in 0 until height) {
                    for (x in 0 until width) {
                        val nx = height - 1 - y
                        val ny = x
                        out[ny * height + nx] = gray[y * width + x]
                    }
                }
                Triple(out, height, width)
            }
            180 -> {
                val out = IntArray(width * height)
                for (i in gray.indices) out[gray.size - 1 - i] = gray[i]
                Triple(out, width, height)
            }
            270 -> {
                val out = IntArray(width * height)
                for (y in 0 until height) {
                    for (x in 0 until width) {
                        val nx = y
                        val ny = width - 1 - x
                        out[ny * height + nx] = gray[y * width + x]
                    }
                }
                Triple(out, height, width)
            }
            else -> Triple(gray, width, height)
        }
    }

    private companion object {
        const val THROTTLE_MS = 200L
        const val MAX_DIMENSION = 260
    }
}
