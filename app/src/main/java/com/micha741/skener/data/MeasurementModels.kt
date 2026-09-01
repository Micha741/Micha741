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

/** One measured distance: the two tapped points (fractional, see [CalibrationPoints]) and the real-world length [MeasureViewModel] computed for them from the active calibration. See the [isLikelyUnreliable] function for what its [isLikelyUnreliable] field means. */
data class MeasuredSegment(
    val a: PointF,
    val b: PointF,
    val lengthCm: Float,
    val isLikelyUnreliable: Boolean = false,
)

/**
 * A common object of known real-world size (a sheet of A4 paper, a
 * payment/ID card) [MeasureAutoCalibrator] recognizes purely by a detected
 * box's aspect ratio, to calibrate a photo automatically instead of the
 * user tapping a known distance and typing its length by hand.
 */
enum class KnownReferenceObject(val longCm: Float, val shortCm: Float) {
    A4_PAPER(29.7f, 21.0f),
    PAYMENT_CARD(8.56f, 5.398f),
}

/**
 * [MeasureAutoCalibrator]'s proposed calibration - [a]/[b] are the two ends
 * of the matched object's longer edge (fractional, see [CalibrationPoints]),
 * [realLengthCm] the real length of that edge for [objectType]. Always shown
 * to the user to confirm or reject, never applied on its own: FastSAM has no
 * idea what kind of object a box actually is, only that it's a distinct one
 * whose shape happens to match.
 */
data class AutoCalibrationSuggestion(
    val a: PointF,
    val b: PointF,
    val realLengthCm: Float,
    val objectType: KnownReferenceObject,
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

/**
 * A crude proxy for whether [a]-[b] sits at a noticeably different distance
 * from the camera than [calibration]'s own two points did - [distanceCm]
 * applies one flat cm-per-pixel ratio to the whole photo, which only holds
 * up when the measured segment is roughly as close to the camera as the
 * calibration one was. There's no real depth information to check that
 * against (no LiDAR, no stereo, just one flat photo), so this only looks at
 * how far apart the two segments' midpoints are *in the frame* - a rough
 * stand-in for "probably not the same distance away", not a real depth
 * check. It can be wrong in both directions: two points far apart on a
 * photo shot straight down at a flat table are still both close to the
 * camera and just as reliable as ones right next to the calibration
 * segment, while a photo with strong perspective (a long hallway) can put a
 * *screen-adjacent* point at a very different real depth. Purely a hint
 * shown alongside the measurement - it never blocks or changes the number
 * itself.
 */
fun isLikelyUnreliable(a: PointF, b: PointF, calibration: CalibrationPoints): Boolean {
    val midX = (a.x + b.x) / 2f
    val midY = (a.y + b.y) / 2f
    val calibMidX = (calibration.a.x + calibration.b.x) / 2f
    val calibMidY = (calibration.a.y + calibration.b.y) / 2f
    return hypot(midX - calibMidX, midY - calibMidY) > UNRELIABLE_DISTANCE_THRESHOLD
}

private const val UNRELIABLE_DISTANCE_THRESHOLD = 0.3f
