package com.micha741.skener.data

import android.graphics.Rect

/**
 * One object FastSAM found in a photo/frame: its bounding box, and the mean
 * pixel color under its own segmentation mask (null if that mask came out
 * empty - see [com.micha741.skener.data.fastsam.FastSamDetector.maskAverageColor]),
 * used only for reference-piece matching. FastSAM is class-agnostic - it
 * never says *what* something is, just that it's a distinct object - so
 * there's no category label here; color plus box size is what
 * [matchesReference] has to work with instead. Both the static-photo
 * counter ([ObjectCounter]) and the live camera counter
 * ([LiveFrameAnalyzer]) get this straight from [com.micha741.skener.data.fastsam.FastSamDetector.detect].
 */
data class DetectedBlob(
    val box: Rect,
    val avgColor: Int? = null,
)
