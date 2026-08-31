package com.micha741.skener.data

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

/**
 * True when at least [minFraction] of [box]'s own area falls inside [roi] -
 * stricter than just checking whether its center point lands inside, which
 * let a box mostly (or even almost entirely) outside a selected region of
 * interest still count as long as its center happened to fall inside it -
 * reported directly: a dense pile where several touching pieces get merged
 * by FastSAM into one oversized blob, sitting mostly outside the region the
 * user actually dragged out, still showed up "bigger than the selection".
 */
fun overlapsRoiEnough(box: Rect, roi: Rect, minFraction: Double = ROI_MIN_OVERLAP_FRACTION): Boolean {
    val left = max(box.left, roi.left)
    val top = max(box.top, roi.top)
    val right = min(box.right, roi.right)
    val bottom = min(box.bottom, roi.bottom)
    if (right <= left || bottom <= top) return false

    val boxArea = box.width().toLong() * box.height().toLong()
    if (boxArea <= 0) return false
    val interArea = (right - left).toLong() * (bottom - top).toLong()
    return interArea.toDouble() / boxArea >= minFraction
}

/**
 * Auto mode only (no reference piece - same scope as [rejectSizeOutliers],
 * whose own median-based size check already covers reference mode): true
 * when at least one kept blob's box is a lot bigger than the rest. Real
 * pieces of "the same kind of thing" (the whole premise of counting them)
 * should be roughly consistent in size, so an outsized box is a good proxy
 * for the failure this app is most exposed to - FastSAM merging several
 * touching/overlapping pieces into one blob instead of finding them
 * separately (the original reason a region of interest exists at all: see
 * [com.micha741.skener.CountingScreen]). Surfaced as a hint to spread the
 * pieces out and recount, not auto-corrected - there's no reliable way to
 * tell *how many* real pieces one oversized blob actually is.
 */
fun hasSuspiciouslyLargeBlob(blobs: List<DetectedBlob>): Boolean {
    if (blobs.size < MIN_SAMPLES_FOR_SIZE_FILTER) return false
    val areas = blobs.map { it.box.width().toLong() * it.box.height().toLong() }.sorted()
    val medianArea = areas[areas.size / 2]
    if (medianArea <= 0) return false
    return areas.last() >= medianArea * MAX_SIZE_RATIO_TO_MEDIAN
}

private const val MIN_EDGE_ASPECT_RATIO = 3.0
private const val EDGE_PHOTO_SPAN_FRACTION = 0.6
private const val MIN_SAMPLES_FOR_SIZE_FILTER = 3
private const val MIN_SIZE_RATIO_TO_MEDIAN = 0.25
private const val MAX_SIZE_RATIO_TO_MEDIAN = 3.0
private const val ROI_MIN_OVERLAP_FRACTION = 0.5
