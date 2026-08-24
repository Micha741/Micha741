package com.micha741.skener.data

import android.graphics.Rect

/**
 * One object ML Kit's on-device Object Detection & Tracking found in a
 * photo/frame: its bounding box and, when the classifier was confident
 * enough to venture a guess, a coarse category label ("Food", "Home good",
 * ...) - null when it couldn't tell, which is common for the base
 * (non-custom) model. Both the static-photo counter ([ObjectCounter]) and
 * the live camera counter ([LiveFrameAnalyzer]) produce this.
 */
data class DetectedBlob(
    val box: Rect,
    val label: String? = null,
)
