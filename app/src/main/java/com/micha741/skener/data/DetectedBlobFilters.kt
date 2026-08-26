package com.micha741.skener.data

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import kotlin.math.max
import kotlin.math.min

/**
 * Filters shared by both counting paths that run FastSAM
 * ([com.micha741.skener.data.ObjectCounter] for a still photo,
 * [com.micha741.skener.data.LiveFrameAnalyzer] for the live camera) -
 * FastSAM's own output is just boxes and a confidence score, so telling a
 * real piece apart from a straight background line, a stray artifact, or
 * a same-sized/same-colored bit of background elsewhere in frame is all
 * done here, after detection.
 */

/**
 * True for a box that looks like a straight architectural edge (a door
 * frame, a wall/floor seam) rather than a real piece: earlier testing
 * against ML Kit's detector showed exactly this failure. The giveaway
 * is being *both* strongly elongated *and* running across most of the
 * photo/frame - a real piece, even a thin one (a screw, a pen), only
 * rarely spans most of the width or height.
 */
fun looksLikeStraightEdge(box: Rect, width: Int, height: Int): Boolean {
    val longSide = max(box.width(), box.height())
    val shortSide = max(1, min(box.width(), box.height()))
    val aspectRatio = longSide.toDouble() / shortSide
    if (aspectRatio < MIN_EDGE_ASPECT_RATIO) return false

    val spans = box.height() >= height * EDGE_PHOTO_SPAN_FRACTION ||
        box.width() >= width * EDGE_PHOTO_SPAN_FRACTION
    return spans
}

/**
 * Auto mode only (no reference piece): a stray false detection (a
 * reflection, a sliver of background) sitting apart from the real
 * pieces isn't caught by the detector's own NMS, since it doesn't
 * overlap a real piece - there's nothing to merge it into. When
 * counting several instances of "the same kind of thing" (the app's
 * whole premise), real pieces should be roughly consistent in size, so
 * a box much smaller than the *median* of everything else found is
 * more likely such a stray artifact than a genuinely distinct extra
 * piece. Needs a handful of samples to make a meaningful median, and
 * only applies here - reference mode already has its own, more
 * reliable, user-anchored size check in [matchesReference].
 */
fun rejectSizeOutliers(blobs: List<DetectedBlob>): List<DetectedBlob> {
    if (blobs.size < MIN_SAMPLES_FOR_SIZE_FILTER) return blobs
    val areas = blobs.map { it.box.width().toLong() * it.box.height().toLong() }.sorted()
    val medianArea = areas[areas.size / 2]
    if (medianArea <= 0) return blobs
    return blobs.filter { it.box.width().toLong() * it.box.height().toLong() >= medianArea * MIN_SIZE_RATIO_TO_MEDIAN }
}

/** Mean pixel color inside [box] on [bitmap], used by [matchesReference] to tell same-sized but differently-colored things apart (a plum from a leaf). */
fun averageColor(bitmap: Bitmap, box: Rect): Int {
    val left = box.left.coerceIn(0, bitmap.width - 1)
    val top = box.top.coerceIn(0, bitmap.height - 1)
    val right = box.right.coerceIn(left + 1, bitmap.width)
    val bottom = box.bottom.coerceIn(top + 1, bitmap.height)
    val width = right - left
    val height = bottom - top

    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, left, top, width, height)
    var r = 0L
    var g = 0L
    var b = 0L
    for (pixel in pixels) {
        r += (pixel shr 16) and 0xFF
        g += (pixel shr 8) and 0xFF
        b += pixel and 0xFF
    }
    val count = pixels.size
    return Color.rgb((r / count).toInt(), (g / count).toInt(), (b / count).toInt())
}

private const val MIN_EDGE_ASPECT_RATIO = 3.0
private const val EDGE_PHOTO_SPAN_FRACTION = 0.6
private const val MIN_SAMPLES_FOR_SIZE_FILTER = 3
private const val MIN_SIZE_RATIO_TO_MEDIAN = 0.25
