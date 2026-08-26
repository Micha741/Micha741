package com.micha741.skener.data

import android.graphics.Color
import android.graphics.Rect
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/** Finds the detected blob under (or, failing that, nearest to) a tapped point, in the same coordinate space as the blobs' boxes. */
fun findBlobNear(blobs: List<DetectedBlob>, x: Int, y: Int): DetectedBlob? {
    blobs.firstOrNull { it.box.contains(x, y) }?.let { return it }
    if (blobs.isEmpty()) return null
    return blobs.minByOrNull { blob ->
        val dx = (blob.box.centerX() - x).toLong()
        val dy = (blob.box.centerY() - y).toLong()
        dx * dx + dy * dy
    }
}

/**
 * A candidate counts as "similar" to [reference] when its box is a
 * plausible size match (within [MAX_REFERENCE_AREA_RATIO]) and, whenever
 * both have a sampled [DetectedBlob.avgColor], their hues are close (within
 * [MAX_REFERENCE_HUE_DIFFERENCE_DEGREES], see [matchesHue]). FastSAM never
 * gives a category label, so this is all there is to go on: size is what
 * tells e.g. one real piece apart from a much bigger or smaller stray
 * detection, color is what tells apart same-sized but differently-colored
 * things a box-only detector otherwise conflates (a plum from a leaf on
 * the same tree).
 */
fun matchesReference(blob: DetectedBlob, reference: DetectedBlob): Boolean {
    val blobArea = blob.box.width().toLong() * blob.box.height().toLong()
    val referenceArea = reference.box.width().toLong() * reference.box.height().toLong()
    if (blobArea <= 0 || referenceArea <= 0) return false

    val ratio = max(blobArea, referenceArea).toDouble() / min(blobArea, referenceArea).toDouble()
    if (ratio > MAX_REFERENCE_AREA_RATIO) return false

    return matchesHue(blob.avgColor, reference.avgColor)
}

/**
 * True when [blobColor] and [referenceColor] are close enough in hue to be
 * "the same kind of color" - or when either is missing/too washed-out
 * (low saturation) to have a meaningful hue at all, in which case color
 * simply isn't used as a signal. Hue, not raw RGB distance, is what
 * actually separates e.g. a purple plum from a green leaf regardless of
 * how bright or shaded each one is in the photo - verified against the
 * real bundled model on a synthetic scene: raw RGB distance let plenty of
 * leaves slip through a plum reference, hue distance correctly kept only
 * the plums.
 */
private fun matchesHue(blobColor: Int?, referenceColor: Int?): Boolean {
    if (blobColor == null || referenceColor == null) return true

    val blobHsv = FloatArray(3).also { Color.colorToHSV(blobColor, it) }
    val referenceHsv = FloatArray(3).also { Color.colorToHSV(referenceColor, it) }
    if (blobHsv[1] < MIN_SATURATION_FOR_HUE_CHECK || referenceHsv[1] < MIN_SATURATION_FOR_HUE_CHECK) return true

    val rawDifference = abs(blobHsv[0] - referenceHsv[0]) % 360f
    val circularDifference = min(rawDifference, 360f - rawDifference)
    return circularDifference <= MAX_REFERENCE_HUE_DIFFERENCE_DEGREES
}

/** Scales a blob's box, e.g. from a downscaled working bitmap back to the original photo's pixel coordinates. */
fun DetectedBlob.scaledBy(scale: Float): DetectedBlob {
    if (scale == 1f) return this
    return copy(
        box = Rect(
            (box.left * scale).roundToInt(),
            (box.top * scale).roundToInt(),
            (box.right * scale).roundToInt(),
            (box.bottom * scale).roundToInt(),
        ),
    )
}

private const val MAX_REFERENCE_AREA_RATIO = 3.0
private const val MIN_SATURATION_FOR_HUE_CHECK = 0.15f
private const val MAX_REFERENCE_HUE_DIFFERENCE_DEGREES = 45f
