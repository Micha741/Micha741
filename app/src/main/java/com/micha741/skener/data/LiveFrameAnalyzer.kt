package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Rect
import android.graphics.RectF
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.micha741.skener.data.fastsam.FastSamDetector
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
 * runs it through the same bundled FastSAM-s model the static-photo counter
 * uses (see [com.micha741.skener.data.ObjectCounter]).
 *
 * This used to run ML Kit's base Object Detection instead - cheaper, but
 * this codebase's own earlier notes on why FastSAM replaced it for the
 * static photo apply here too: the base (non-custom) ML Kit model has
 * trouble telling apart unfamiliar, small, or tightly-clustered pieces,
 * and device testing bore that out directly - a photo of several touching
 * garlic bulbs counted correctly (FastSAM, static path) but the *same*
 * bulbs in the live preview (ML Kit) always came back as one merged blob.
 * Live frames here are downsampled to [MAX_DIMENSION] - already close to
 * FastSAM's own fixed 320x320 input and comfortably under
 * [FastSamDetector]'s tiling threshold, so this only ever runs one
 * inference pass per analyzed frame, not the five a large static photo
 * can trigger.
 *
 * Unlike ML Kit's client, which turned out to crash under reuse (this
 * file used to build a fresh one per frame to work around it - see the
 * git history and [ObjectCounter]/[FastSamDetector]), a single TFLite
 * `Interpreter` is fine to call repeatedly from the same background thread,
 * which is exactly how [analyze] is invoked (CameraX calls it serially on
 * one dedicated executor) - so one [FastSamDetector] is built lazily on
 * first use and kept for the life of this analyzer, closed in [release].
 *
 * [requestReferenceAt] lets the UI pick a reference piece by tapping a spot
 * in frame coordinates; the analyzer resolves it against the *next*
 * analyzed frame's detections and retains that blob until [clearReference].
 *
 * [setRoi] lets the UI drag out a region of interest, fractional (0f..1f on
 * each edge, converted to this frame's own pixel dimensions fresh on every
 * [analyze] call rather than once up front): detections whose center falls
 * outside it are discarded before reference matching runs, same order and
 * same purpose as [com.micha741.skener.data.ObjectCounter]'s roi parameter -
 * a same-sized, same-colored false detection sitting elsewhere in the frame
 * (a background pattern) never gets a chance to be counted, regardless of
 * how well size/color matching would or wouldn't have caught it. Fractional
 * rather than pixel coordinates so the same region also means the same
 * place if it's carried over to a captured photo of a different resolution
 * (see [com.micha741.skener.LiveCameraScreen]'s capture button).
 */
class LiveFrameAnalyzer(
    context: Context,
    private val onResult: (LiveFrameResult) -> Unit,
) : ImageAnalysis.Analyzer {

    private val appContext = context.applicationContext
    private val detectorLazy = lazy { FastSamDetector(appContext) }
    private val detector by detectorLazy

    @Volatile
    private var referenceBlob: DetectedBlob? = null

    @Volatile
    private var pendingReferenceTap: IntArray? = null

    @Volatile
    private var roiBox: RectF? = null

    @Volatile
    private var lastAnalyzedAtMs = 0L

    @Volatile
    private var lastRawBlobs: List<DetectedBlob> = emptyList()

    @Volatile
    private var lastFrameSize: IntArray? = null

    /** Call from the UI thread: the blob nearest ([x], [y]) in *frame* coordinates becomes the reference on the next frame. */
    fun requestReferenceAt(x: Int, y: Int) {
        pendingReferenceTap = intArrayOf(x, y)
    }

    /** Drops the retained reference, if any, going back to counting every detected piece. */
    fun clearReference() {
        referenceBlob = null
    }

    /** Call from the UI thread: only detections whose center falls within [rect] (fractional, 0f..1f) count from now on. Drops any retained reference, since it may fall outside the new region. */
    fun setRoi(rect: RectF) {
        roiBox = rect
        referenceBlob = null
    }

    /** Drops the region of interest, going back to counting the whole frame. */
    fun clearRoi() {
        roiBox = null
    }

    /** Suggests a region of interest from the most recently analyzed frame's raw detections (before any current ROI/reference narrowed them) - see [com.micha741.skener.data.suggestRoi]. Null if no frame has been analyzed yet, or no confident cluster was found. */
    fun suggestRoiFromLastFrame(): RectF? {
        val size = lastFrameSize ?: return null
        return suggestRoi(lastRawBlobs, size[0], size[1])
    }

    /** Call when the camera screen is torn down: releases the TFLite interpreter's native resources, if it was ever used. */
    fun release() {
        referenceBlob = null
        roiBox = null
        lastRawBlobs = emptyList()
        lastFrameSize = null
        if (detectorLazy.isInitialized()) detector.close()
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

            var allBlobs = subdivideGrids(detector.detect(bitmap), bitmap)
            allBlobs = allBlobs.filterNot { looksLikeStraightEdge(it.box, width, height) }
            allBlobs = allBlobs.map { it.copy(avgColor = averageColor(bitmap, it.box)) }
            lastRawBlobs = allBlobs
            lastFrameSize = intArrayOf(width, height)

            val roi = roiBox
            if (roi != null) {
                val pixelRoi = Rect(
                    (roi.left * width).roundToInt(),
                    (roi.top * height).roundToInt(),
                    (roi.right * width).roundToInt(),
                    (roi.bottom * height).roundToInt(),
                )
                allBlobs = allBlobs.filter { pixelRoi.contains(it.box.centerX(), it.box.centerY()) }
            }
            bitmap.recycle()

            val tap = pendingReferenceTap
            if (tap != null) {
                pendingReferenceTap = null
                referenceBlob = findBlobNear(allBlobs, tap[0], tap[1])
            }

            val reference = referenceBlob
            val blobs = if (reference != null) {
                allBlobs.filter { matchesReference(it, reference) }
            } else {
                rejectSizeOutliers(allBlobs)
            }

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
