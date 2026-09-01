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
import kotlin.math.exp
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
 * Decodes the model's box + confidence head (a standard YOLOv8-seg-style
 * single-class output: 37 channels per anchor = 4 box + 1 score + 32 mask
 * coefficients, 2100 anchors) and runs NMS on it - boxes, not precise
 * outlines, are still what this returns and what the rest of the app
 * draws, same as the ML Kit path did. The 32 mask coefficients and the
 * [1,32,80,80] prototype output *are* used for one thing, though: each
 * kept detection's own segmentation mask (`coeffs · proto`, sigmoid,
 * mapped from the model's 80x80 mask grid back through the same letterbox
 * transform as its box) picks out which pixels *inside* that box are
 * actually the piece rather than background creeping into its corners -
 * [maskAverageColor] averages only those for [DetectedBlob.avgColor],
 * instead of every pixel in the box like a plain rectangle scan would.
 * Matters most for round/diagonal pieces, where a snug box still has a
 * lot of background in its four corners.
 *
 * The box coordinates in the model's output are normalized to [0,1]
 * relative to the model's fixed 320x320 input (confirmed by running the
 * exported model directly against a synthetic test image and inspecting
 * the raw output, not assumed) - not absolute pixels, which is a
 * different convention than the classic YOLO TF export.
 *
 * [detect] runs more than one inference pass ([tileRegions]: the full
 * photo, plus four overlapping crops covering it) rather than one - the
 * model's input is a fixed 320x320 grid no matter how large the source
 * photo is, so on a busy scene with many small objects (leaves on a
 * branch, screws in a pile) a lot of them are too small in a single
 * whole-photo pass to ever cross the confidence threshold. Detecting on
 * crops gives each region more effective resolution. Duplicate boxes this
 * creates near tile seams (or between a tile's find and the full-photo
 * pass finding the same larger object) are collapsed by a second,
 * cross-tile [mergeOverlapping] pass, reusing the same containment-based
 * overlap test as the per-tile NMS below.
 */
class FastSamDetector(context: Context) {

    private val interpreter: Interpreter = Interpreter(loadModelFile(context))

    /** Runs detection on [bitmap] and returns bounding boxes in [bitmap]'s own pixel coordinates. */
    fun detect(bitmap: Bitmap): List<DetectedBlob> {
        val allBoxes = mutableListOf<ScoredBox>()
        for (region in tileRegions(bitmap.width, bitmap.height)) {
            val tile = Bitmap.createBitmap(bitmap, region.left, region.top, region.width(), region.height())
            allBoxes += detectSingle(tile).map { it.offsetBy(region.left, region.top) }
            // The full-photo region's crop bounds exactly match bitmap's own -
            // Bitmap.createBitmap() special-cases that and returns bitmap
            // itself rather than a copy, so recycling tile here would
            // recycle the caller's bitmap out from under it (and crash every
            // tile after this one, since they crop from the now-recycled
            // bitmap): only recycle when createBitmap actually made a copy.
            if (tile !== bitmap) tile.recycle()
        }
        return mergeOverlapping(allBoxes).map { DetectedBlob(box = it.box, avgColor = it.avgColor) }
    }

    fun close() {
        interpreter.close()
    }

    /**
     * The regions [detect] runs one inference pass over: the whole photo
     * (so nothing larger than a single tile is missed), plus four
     * overlapping [TILE_FRACTION]-sized crops covering the four corners of
     * the photo, giving small/dense clusters of objects more effective
     * resolution than the single 320x320 whole-photo pass allows. Skipped
     * for a photo already smaller than [MIN_DIMENSION_FOR_TILING] on
     * either side, where a single pass already sees it at close to full
     * detail.
     *
     * A piece whose own extent straddles the boundary between two tiles -
     * not fully inside either one - only ever gets seen as two disjoint
     * fragments (whatever portion of it falls in each tile), which
     * [mergeOverlapping] can't collapse back into one box since fragments
     * of the same piece from different tiles don't overlap each other at
     * all. Reported directly: an elongated piece (a bolt) lying so its
     * long axis crosses that boundary got counted twice, and rotating the
     * same piece to lie along a different axis moved which tile boundary
     * it crossed but not the underlying problem. [TILE_FRACTION] needs to
     * stay well above 0.5 so the two tiles along an axis overlap enough
     * that only a piece wider than roughly (2 * TILE_FRACTION - 1) times
     * the photo's own width/height could straddle both boundaries at
     * once - comfortably larger than a single counted piece is ever going
     * to be, while still leaving tiles zoomed in enough to help find
     * genuinely small/dense clusters (a pile of screws, cloves of garlic),
     * which is what tiling exists for in the first place.
     */
    private fun tileRegions(width: Int, height: Int): List<Rect> {
        if (width < MIN_DIMENSION_FOR_TILING || height < MIN_DIMENSION_FOR_TILING) {
            return listOf(Rect(0, 0, width, height))
        }
        val tileWidth = (width * TILE_FRACTION).roundToInt().coerceIn(1, width)
        val tileHeight = (height * TILE_FRACTION).roundToInt().coerceIn(1, height)
        val xStarts = if (tileWidth >= width) setOf(0) else setOf(0, width - tileWidth)
        val yStarts = if (tileHeight >= height) setOf(0) else setOf(0, height - tileHeight)

        val regions = mutableListOf(Rect(0, 0, width, height))
        for (y in yStarts) {
            for (x in xStarts) {
                regions += Rect(x, y, x + tileWidth, y + tileHeight)
            }
        }
        return regions
    }

    /** Runs one inference pass over [bitmap] and returns boxes in [bitmap]'s own pixel coordinates. */
    private fun detectSingle(bitmap: Bitmap): List<ScoredBox> {
        val letterbox = letterbox(bitmap, INPUT_SIZE)
        val inputBuffer = buildInputBuffer(letterbox.bitmap)
        letterbox.bitmap.recycle()

        val output0 = Array(1) { Array(NUM_CHANNELS) { FloatArray(NUM_ANCHORS) } }
        val output1 = Array(1) { Array(MASK_DIM) { Array(PROTO_SIZE) { FloatArray(PROTO_SIZE) } } }
        interpreter.runForMultipleInputsOutputs(arrayOf<Any>(inputBuffer), mapOf(0 to output0, 1 to output1))

        val candidates = decodeCandidates(output0[0])
        val kept = nonMaxSuppression(candidates)
        return kept.map { it.toScoredBox(bitmap, letterbox, output1[0]) }
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

    /** One anchor's decoded box (in the letterboxed 320x320 space), confidence, and its 32 mask coefficients (see the class doc). */
    private data class Candidate(
        val left: Float,
        val top: Float,
        val right: Float,
        val bottom: Float,
        val score: Float,
        val maskCoeffs: FloatArray,
    ) {
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
            // Channels 5..36 (after the 4 box + 1 score channels) are the 32 mask coefficients.
            val maskCoeffs = FloatArray(MASK_DIM) { c -> output[5 + c][anchor] }
            candidates += Candidate(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f, score, maskCoeffs)
        }
        return candidates
    }

    /**
     * Greedy NMS over one tile's raw candidates, in that tile's own
     * letterboxed 320x320 space. Uses containment (intersection relative
     * to the *smaller* box) rather than classic IoU (relative to their
     * combined area) - a curved/elongated cluster (a bunch of bananas) can
     * produce one candidate box around just one banana and another around
     * several, and those two have low classic IoU (the bigger box's own
     * area dominates the union) even though they clearly describe the same
     * object.
     */
    private fun nonMaxSuppression(candidates: List<Candidate>): List<Candidate> {
        val sorted = candidates.sortedByDescending { it.score }.toMutableList()
        val kept = mutableListOf<Candidate>()
        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept += best
            sorted.removeAll { overlapRatio(it.left, it.top, it.right, it.bottom, it.area, best.left, best.top, best.right, best.bottom, best.area) > NMS_OVERLAP_THRESHOLD }
        }
        return kept
    }

    /** One kept detection in some bitmap's own pixel coordinates (a whole tile, or the full photo), with its confidence and mask-sampled average color (see the class doc; null if its mask came out empty). */
    private data class ScoredBox(val box: Rect, val score: Float, val avgColor: Int?) {
        val area: Float get() = max(0, box.width()).toFloat() * max(0, box.height())
    }

    private fun ScoredBox.offsetBy(dx: Int, dy: Int): ScoredBox =
        ScoredBox(Rect(box.left + dx, box.top + dy, box.right + dx, box.bottom + dy), score, avgColor)

    /**
     * Second, cross-tile NMS pass over every tile's already-deduplicated
     * boxes, now all mapped into the original photo's shared pixel space -
     * collapses the same real object being found by more than one
     * overlapping tile (or by both a tile and the whole-photo pass) into
     * one box, same containment-based test as [nonMaxSuppression].
     */
    private fun mergeOverlapping(boxes: List<ScoredBox>): List<ScoredBox> {
        val sorted = boxes.sortedByDescending { it.score }.toMutableList()
        val kept = mutableListOf<ScoredBox>()
        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept += best
            sorted.removeAll {
                overlapRatio(
                    it.box.left.toFloat(), it.box.top.toFloat(), it.box.right.toFloat(), it.box.bottom.toFloat(), it.area,
                    best.box.left.toFloat(), best.box.top.toFloat(), best.box.right.toFloat(), best.box.bottom.toFloat(), best.area,
                ) > NMS_OVERLAP_THRESHOLD
            }
        }
        return kept
    }

    /** Intersection area relative to the *smaller* of the two boxes - see [nonMaxSuppression]. */
    private fun overlapRatio(
        aLeft: Float, aTop: Float, aRight: Float, aBottom: Float, aArea: Float,
        bLeft: Float, bTop: Float, bRight: Float, bBottom: Float, bArea: Float,
    ): Float {
        val interLeft = max(aLeft, bLeft)
        val interTop = max(aTop, bTop)
        val interRight = min(aRight, bRight)
        val interBottom = min(aBottom, bBottom)
        if (interRight <= interLeft || interBottom <= interTop) return 0f

        val interArea = (interRight - interLeft) * (interBottom - interTop)
        val smallerArea = min(aArea, bArea)
        return if (smallerArea <= 0f) 0f else interArea / smallerArea
    }

    private data class Letterbox(val bitmap: Bitmap, val scale: Float, val padX: Float, val padY: Float)

    /** Maps this candidate's box from the letterboxed 320x320 space back to [bitmap]'s own pixel coordinates, and samples its mask-average color from [bitmap] the same way (see [maskAverageColor]). */
    private fun Candidate.toScoredBox(bitmap: Bitmap, letterbox: Letterbox, proto: Array<Array<FloatArray>>): ScoredBox {
        val box = Rect(
            ((left - letterbox.padX) / letterbox.scale).roundToInt(),
            ((top - letterbox.padY) / letterbox.scale).roundToInt(),
            ((right - letterbox.padX) / letterbox.scale).roundToInt(),
            ((bottom - letterbox.padY) / letterbox.scale).roundToInt(),
        )
        return ScoredBox(box, score, maskAverageColor(bitmap, maskCoeffs, proto, letterbox))
    }

    /**
     * Averages [bitmap]'s pixel colors under this detection's own segmentation
     * mask instead of its whole box - a mask pixel's value is
     * `sigmoid(coeffs · proto[:, y, x])` (the standard YOLOv8-seg decode,
     * confirmed against this exact model: running it on a synthetic test
     * image and rendering the resulting masks lined up with the actual
     * objects, not their boxes). [proto]'s 80x80 grid covers the same
     * letterboxed 320x320 space as [Candidate]'s own box coordinates, at a
     * fixed 4px-per-cell scale ([INPUT_SIZE] / [PROTO_SIZE]) - each mask
     * cell center is mapped back through the same letterbox transform as
     * the box above to land on [bitmap]'s own pixel grid. Null (falls back
     * to no color, same as [DetectedBlob.avgColor]'s default) if the mask
     * came out empty - every cell below [MASK_THRESHOLD], or landing
     * entirely outside [bitmap] - rather than risk a color averaged from
     * zero real samples.
     */
    private fun maskAverageColor(bitmap: Bitmap, maskCoeffs: FloatArray, proto: Array<Array<FloatArray>>, letterbox: Letterbox): Int? {
        var sumR = 0L
        var sumG = 0L
        var sumB = 0L
        var count = 0
        val cellSize = INPUT_SIZE.toFloat() / PROTO_SIZE

        for (cellY in 0 until PROTO_SIZE) {
            for (cellX in 0 until PROTO_SIZE) {
                var raw = 0f
                for (c in 0 until MASK_DIM) raw += maskCoeffs[c] * proto[c][cellY][cellX]
                if (sigmoid(raw) <= MASK_THRESHOLD) continue

                val bitmapX = (((cellX + 0.5f) * cellSize - letterbox.padX) / letterbox.scale).roundToInt()
                val bitmapY = (((cellY + 0.5f) * cellSize - letterbox.padY) / letterbox.scale).roundToInt()
                if (bitmapX !in 0 until bitmap.width || bitmapY !in 0 until bitmap.height) continue

                val pixel = bitmap.getPixel(bitmapX, bitmapY)
                sumR += (pixel shr 16) and 0xFF
                sumG += (pixel shr 8) and 0xFF
                sumB += pixel and 0xFF
                count++
            }
        }
        if (count == 0) return null
        return Color.rgb((sumR / count).toInt(), (sumG / count).toInt(), (sumB / count).toInt())
    }

    private fun sigmoid(x: Float): Float = 1f / (1f + exp(-x))

    private companion object {
        const val MODEL_ASSET_NAME = "fastsam_s.tflite"
        const val INPUT_SIZE = 320
        const val NUM_CHANNELS = 37
        const val NUM_ANCHORS = 2100
        const val MASK_DIM = 32
        const val PROTO_SIZE = 80
        const val CONFIDENCE_THRESHOLD = 0.4f
        const val NMS_OVERLAP_THRESHOLD = 0.45f
        const val MASK_THRESHOLD = 0.5f
        const val TILE_FRACTION = 0.75f
        const val MIN_DIMENSION_FOR_TILING = 400
    }
}
