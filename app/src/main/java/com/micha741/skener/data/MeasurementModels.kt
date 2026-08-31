package com.micha741.skener.data

import android.graphics.PointF
import kotlin.math.hypot

/**
 * The two points the user tapped on a known real-world distance (a ruler,
 * the edge of a sheet of paper, ...) and how long that distance actually is
 * - the scale every other measurement on this photo is derived from.
 * Fractional (0f..1f on each axis, relative to the photo), same convention
 * as [com.micha741.skener.data.suggestRoi]'s region of interest, so a point
 * tapped on the photo as displayed means the same place regardless of the
 * screen's own preview size.
 */
data class CalibrationPoints(
    val a: PointF,
    val b: PointF,
    val realLengthCm: Float,
)

/** One measured distance: the two tapped points (fractional, see [CalibrationPoints]) and the real-world length [MeasureViewModel] computed for them from the active calibration. */
data class MeasuredSegment(
    val a: PointF,
    val b: PointF,
    val lengthCm: Float,
)

/**
 * Converts the fractional distance between [a] and [b] to real-world
 * centimeters, using [calibration] as the scale reference. [photoWidth]/
 * [photoHeight] (the photo's *true* pixel dimensions) are needed, not just
 * the fractions themselves, because a non-square photo doesn't scale x and
 * y by the same factor - a diagonal line's Euclidean length would come out
 * wrong without them.
 */
fun distanceCm(a: PointF, b: PointF, photoWidth: Int, photoHeight: Int, calibration: CalibrationPoints): Float {
    val pxDistance = hypot((b.x - a.x) * photoWidth, (b.y - a.y) * photoHeight)
    val calibPxDistance = hypot(
        (calibration.b.x - calibration.a.x) * photoWidth,
        (calibration.b.y - calibration.a.y) * photoHeight,
    )
    if (calibPxDistance <= 0f) return 0f
    val cmPerPx = calibration.realLengthCm / calibPxDistance
    return pxDistance * cmPerPx
}

/** Formats [cm] as "12,3 cm", switching to "1,23 m" past a meter or "3 mm" under a centimeter, matching how a person would actually read the number back. */
fun formatCm(cm: Float): String = when {
    cm >= 100f -> String.format("%.2f m", cm / 100f)
    cm >= 1f -> String.format("%.1f cm", cm)
    else -> String.format("%.0f mm", cm * 10f)
}
