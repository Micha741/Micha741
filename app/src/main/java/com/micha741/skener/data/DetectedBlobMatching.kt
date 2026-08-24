package com.micha741.skener.data

import android.graphics.Rect
import com.google.mlkit.vision.objects.DetectedObject
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/** Converts one ML Kit [DetectedObject] to our plain [DetectedBlob], keeping its most confident category label, if any. */
fun DetectedObject.toDetectedBlob(): DetectedBlob =
    DetectedBlob(box = boundingBox, label = labels.maxByOrNull { it.confidence }?.text)

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
 * both have a confident category label, that label agrees too. Confident
 * labels are rare with the base (non-custom) classifier - it only knows five
 * coarse categories and often returns none - so in practice most matching
 * comes down to size, which is exactly what tells e.g. one real piece apart
 * from a much bigger or smaller stray detection.
 */
fun matchesReference(blob: DetectedBlob, reference: DetectedBlob): Boolean {
    if (reference.label != null && blob.label != null && reference.label != blob.label) return false

    val blobArea = blob.box.width().toLong() * blob.box.height().toLong()
    val referenceArea = reference.box.width().toLong() * reference.box.height().toLong()
    if (blobArea <= 0 || referenceArea <= 0) return false

    val ratio = max(blobArea, referenceArea).toDouble() / min(blobArea, referenceArea).toDouble()
    return ratio <= MAX_REFERENCE_AREA_RATIO
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
