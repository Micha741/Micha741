package com.micha741.skener.data

import android.graphics.Rect

/**
 * One object detected in a photo/frame: its bounding box and, when the
 * source detector was confident enough to venture a guess, a coarse
 * category label ("Food", "Home good", ...) - null when it couldn't tell,
 * which is common for ML Kit's base (non-custom) classifier and *always*
 * true for FastSAM, which is class-agnostic and never labels anything.
 * Both the static-photo counter ([ObjectCounter], FastSAM-based) and the
 * live camera counter ([LiveFrameAnalyzer], ML-Kit-based) produce this.
 *
 * [avgColor] is the mean pixel color sampled from within [box] on the
 * source photo - only [ObjectCounter] fills this in (it still has the
 * bitmap in hand right after detecting; the live camera doesn't bother,
 * since matching there already has ML Kit's category labels to lean on).
 * It exists purely so [matchesReference] can tell apart same-sized objects
 * of different kinds that FastSAM's box-only, label-less output otherwise
 * can't distinguish - e.g. a plum from a leaf of a similar size.
 */
data class DetectedBlob(
    val box: Rect,
    val label: String? = null,
    val avgColor: Int? = null,
)
