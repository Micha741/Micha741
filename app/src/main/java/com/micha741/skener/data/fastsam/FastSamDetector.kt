package com.micha741.skener.data.fastsam

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import com.micha741.skener.data.DetectedBlob
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * On-device object detection via a bundled FastSAM-s model
 * (`assets/fastsam_s.tflite`, exported from the Ultralytics/CASIA-IVA-Lab
 * FastSAM checkpoint - AGPL-3.0, see
 * `/third_party_licenses/FastSAM_AGPL-3.0_LICENSE.txt`).
 *
 * Unlike ML Kit's base Object Detection ([com.micha741.skener.data.ObjectCounter]'s
 * previous engine, still used for the live camera), FastSAM is a
 * *class-agnostic* "segment everything" model: it doesn't ask "is this a
 * fashion good/food/plant/...", it just finds every distinct object-like
 * region in the frame - which is what a genuinely universal piece counter
 * needs, rather than one tuned to recognize a handful of common categories.
 *
 * This only decodes the model's box + confidence head (a standard
 * YOLOv8-seg-style single-class output: 37 channels per anchor = 4 box +
 * 1 score + 32 mask coefficients, 2100 anchors) and runs NMS on it - the
 * 32 mask coefficients and the [1,32,80,80] prototype output are present
 * in the model but not used yet, so this draws bounding boxes, not precise
 * outlines, same as the ML Kit path did.
 *
 * The box coordinates in the model's output are normalized to [0,1]
 * relative to the model's fixed 320x320 input (confirmed by running the
 * exported model directly against a synthetic test image and inspecting
 * the raw output, not assumed) - not absolute pixels, which is a
 * different convention than the classic YOLO TF export.
 */
class FastSamDetector(context: Context) {

    private val interpreter: Interpreter = Interpreter(loadModelFile(context))

    /** Runs detection on [bitmap] and returns bounding boxes in [bitmap]'s own pixel coordinates. */
    fun detect(bitmap: Bitmap): List<DetectedBlob> {
        val letterbox = letterbox(bitmap, INPUT_SIZE)
        val inputBuffer = buildInputBuffer(letterbox.bitmap)
        letterbox.bitmap.recycle()

        val output0 = Array(1) { Array(NUM_CHANNELS) { FloatArray(NUM_ANCHORS) } }
        val output1 = Array(1) { Array(MASK_DIM) { Array(PROTO_SIZE) { FloatArray(PROTO_SIZE) } } }
        interpreter.runForMultipleInputsOutputs(arrayOf<Any>(inputBuffer), mapOf(0 to output0, 1 to output1))

        val candidates = decodeCandidates(output0[0])
        val kept = nonMaxSuppression(candidates)
        return kept.map { it.toDetectedBlob(letterbox) }
    }

    fun close() {
        interpreter.close()
    }

    private fun loadModelFile(context: Context): MappedByteBuffer {
        val assetFileDescriptor = context.assets.openFd(MODEL_ASSET_NAME)
        assetFileDescriptor.use { afd ->
            java.io.FileInputStream(afd.fileDescriptor).channel.use { channel ->
                return channel.map(FileChannel.MapMode.READ_ONLY, afd.startOffset, afd.declaredLength)
            }
        }
    }

    /** Resize [bitmap] to fit within [size]x[size] preserving aspect ratio, then pad to a square with mid-gray (the YOLO letterbox convention). */
    private fun letterbox(bitmap: Bitmap, size: Int): Letterbox {
        val scale = min(size.toFloat() / bitmap.width, size.toFloat() / bitmap.height)
        val scaledWidth = max(1, (bitmap.width * scale).roundToInt())
        val scaledHeight = max(1, (bitmap.height * scale).roundToInt())
        val padX = (size - scaledWidth) / 2f
        val padY = (size - scaledHeight) / 2f

        val canvas = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        Canvas(canvas).apply {
            drawColor(Color.rgb(114, 114, 114))
            val scaled = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)
            drawBitmap(scaled, padX, padY, Paint(Paint.FILTER_BITMAP_FLAG))
            if (scaled !== bitmap) scaled.recycle()
        }
        return Letterbox(canvas, scale, padX, padY)
    }

    /** Packs [bitmap] (must already be [INPUT_SIZE]x[INPUT_SIZE]) into an NCHW float32 buffer normalized to [0,1]. */
    private fun buildInputBuffer(bitmap: Bitmap): ByteBuffer {
        val pixelCount = INPUT_SIZE * INPUT_SIZE
        val buffer = ByteBuffer.allocateDirect(4 * 3 * pixelCount).order(ByteOrder.nativeOrder())
        val pixels = IntArray(pixelCount)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        for (channelShift in intArrayOf(16, 8, 0)) {
            for (pixel in pixels) {
                val value = (pixel shr channelShift) and 0xFF
                buffer.putFloat(value / 255f)
            }
        }
        buffer.rewind()
        return buffer
    }

    /** One anchor's decoded box (in the letterboxed 320x320 space) and confidence. */
    private data class Candidate(val left: Float, val top: Float, val right: Float, val bottom: Float, val score: Float) {
        val area: Float get() = max(0f, right - left) * max(0f, bottom - top)
    }

    private fun decodeCandidates(output: Array<FloatArray>): List<Candidate> {
        val candidates = mutableListOf<Candidate>()
        for (anchor in 0 until NUM_ANCHORS) {
            val score = output[4][anchor]
            if (score < CONFIDENCE_THRESHOLD) continue

            // Box channels are normalized [0,1] relative to the model's INPUT_SIZE x INPUT_SIZE input.
            val cx = output[0][anchor] * INPUT_SIZE
            val cy = output[1][anchor] * INPUT_SIZE
            val w = output[2][anchor] * INPUT_SIZE
            val h = output[3][anchor] * INPUT_SIZE
            candidates += Candidate(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f, score)
        }
        return candidates
    }

    /**
     * Greedy NMS: highest-confidence box wins each cluster of overlapping
     * candidates. Uses containment (intersection relative to the *smaller*
     * box) rather than classic IoU (relative to their combined area) - a
     * curved/elongated cluster (a bunch of bananas) can produce one
     * candidate box around just one banana and another around several,
     * and those two have low classic IoU (the bigger box's own area
     * dominates the union) even though they clearly describe the same
     * object - exactly the failure mode device testing showed as several
     * overlapping boxes stacked on one real cluster.
     */
    private fun nonMaxSuppression(candidates: List<Candidate>): List<Candidate> {
        val sorted = candidates.sortedByDescending { it.score }.toMutableList()
        val kept = mutableListOf<Candidate>()
        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept += best
            sorted.removeAll { overlapRatio(it, best) > NMS_OVERLAP_THRESHOLD }
        }
        return kept
    }

    /** Intersection area relative to the *smaller* of the two boxes - see [nonMaxSuppression]. */
    private fun overlapRatio(a: Candidate, b: Candidate): Float {
        val interLeft = max(a.left, b.left)
        val interTop = max(a.top, b.top)
        val interRight = min(a.right, b.right)
        val interBottom = min(a.bottom, b.bottom)
        if (interRight <= interLeft || interBottom <= interTop) return 0f

        val interArea = (interRight - interLeft) * (interBottom - interTop)
        val smallerArea = min(a.area, b.area)
        return if (smallerArea <= 0f) 0f else interArea / smallerArea
    }

    private data class Letterbox(val bitmap: Bitmap, val scale: Float, val padX: Float, val padY: Float)

    /** Maps this candidate's box from the letterboxed 320x320 space back to the original photo's pixel coordinates. */
    private fun Candidate.toDetectedBlob(letterbox: Letterbox): DetectedBlob {
        val box = Rect(
            ((left - letterbox.padX) / letterbox.scale).roundToInt(),
            ((top - letterbox.padY) / letterbox.scale).roundToInt(),
            ((right - letterbox.padX) / letterbox.scale).roundToInt(),
            ((bottom - letterbox.padY) / letterbox.scale).roundToInt(),
        )
        return DetectedBlob(box = box, label = null)
    }

    private companion object {
        const val MODEL_ASSET_NAME = "fastsam_s.tflite"
        const val INPUT_SIZE = 320
        const val NUM_CHANNELS = 37
        const val NUM_ANCHORS = 2100
        const val MASK_DIM = 32
        const val PROTO_SIZE = 80
        const val CONFIDENCE_THRESHOLD = 0.4f
        const val NMS_OVERLAP_THRESHOLD = 0.45f
    }
}
