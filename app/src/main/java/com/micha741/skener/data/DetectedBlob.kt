package com.micha741.skener.data

import android.graphics.Rect

/**
 * One object FastSAM found in a photo/frame: its bounding box, and (when
 * sampled - only [ObjectCounter] and [LiveFrameAnalyzer] bother, since it's
 * only needed for reference-piece matching) the mean pixel color inside
 * that box. FastSAM is class-agnostic - it never says *what* something is,
 * just that it's a distinct object - so there's no category label here;
 * color plus box size is what [matchesReference] has to work with instead.
 * Both the static-photo counter ([ObjectCounter]) and the live camera
 * counter ([LiveFrameAnalyzer]) produce this.
 */
data class DetectedBlob(
    val box: Rect,
    val avgColor: Int? = null,
)
