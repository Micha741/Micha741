package com.micha741.skener.data

import android.graphics.Rect
import kotlin.math.floor
import kotlin.math.max

/**
 * A rough single-*layer* capacity estimate: how many pieces the size of [referenceBox] could
 * plausibly lie side by side within [containerAreaFraction] of the photo (the region of
 * interest, or the whole photo if none is set), given [referenceRealLengthCm] as the real
 * length of that reference piece's longer side.
 *
 * Meant purely as a *starting point* for [com.micha741.skener.CountingViewModel.setPieceCountCap] -
 * this grew directly out of a real conversation estimating how many M8x50 bolts a small bucket
 * could hold, where the photo alone could only give the bucket's *diameter* (same plane as a
 * calibration object), never its depth (that needs real depth data - LiDAR, stereo - a flat
 * photo just can't say how many loose layers deep a container is). So this function only ever
 * answers "one layer's worth" - a user who knows the container is several pieces deep (weighed
 * it, like that conversation did) is expected to override the suggested number with their own
 * before it's used as a hard cap.
 *
 * Returns null if the inputs can't produce a meaningful estimate (no real length given, a
 * degenerate reference box, or an invalid photo size).
 */
fun suggestSingleLayerCap(
    referenceBox: Rect,
    referenceRealLengthCm: Float,
    containerAreaFraction: Float,
    photoWidth: Int,
    photoHeight: Int,
): Int? {
    if (referenceRealLengthCm <= 0f || photoWidth <= 0 || photoHeight <= 0) return null
    val referenceLongPx = max(referenceBox.width(), referenceBox.height())
    if (referenceLongPx <= 0) return null
    val cmPerPx = referenceRealLengthCm.toDouble() / referenceLongPx

    val referenceAreaPx = referenceBox.width().toDouble() * referenceBox.height()
    val pieceAreaCm2 = referenceAreaPx * cmPerPx * cmPerPx
    if (pieceAreaCm2 <= 0.0) return null

    val photoAreaPx = photoWidth.toDouble() * photoHeight
    val containerAreaCm2 = containerAreaFraction * photoAreaPx * cmPerPx * cmPerPx

    // Elongated pieces (bolts, pins) leave more empty space between them when poured/laid out
    // loosely than compact ones (nuts, washers) do - two different, doc-stated approximations,
    // not measured, same spirit as isLikelyUnreliable()'s own admittedly-rough proxy.
    val packingFactor = if (classifyShape(referenceBox) == PieceShape.ELONGATED) 0.55 else 0.75

    return floor(containerAreaCm2 * packingFactor / pieceAreaCm2).toInt().coerceAtLeast(0)
}
