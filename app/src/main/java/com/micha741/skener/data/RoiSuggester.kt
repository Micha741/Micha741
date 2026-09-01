package com.micha741.skener.data

import android.graphics.RectF
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

/**
 * Suggests a region of interest by finding the largest spatially-dense
 * cluster of blobs and returning its bounding box (fractional, padded a
 * little) - an automatic alternative to dragging one out by hand, for the
 * common case of "a bunch of pieces sitting together, plus some scattered
 * false detections elsewhere in the frame" (a wood floor's grain pattern,
 * say). Blobs are connected into the same cluster when the distance
 * between their centers is within [CLUSTER_DISTANCE_FACTOR] times their
 * average diagonal - real pieces sitting close together (the whole point
 * of counting them as a group) end up connected, while a stray detection
 * far off elsewhere in the frame stays its own tiny cluster and gets left
 * out of the suggestion.
 *
 * Simple union-find clustering rather than anything fancier - pairwise
 * distance is O(n^2), fine for the tens (occasionally low hundreds) of
 * blobs a photo/frame actually produces.
 */
fun suggestRoi(blobs: List<DetectedBlob>, width: Int, height: Int): RectF? {
    if (blobs.size < MIN_BLOBS_FOR_SUGGESTION || width <= 0 || height <= 0) return null

    val parent = IntArray(blobs.size) { it }
    fun find(x: Int): Int {
        var root = x
        while (parent[root] != root) root = parent[root]
        var current = x
        while (parent[current] != root) {
            val next = parent[current]
            parent[current] = root
            current = next
        }
        return root
    }

    val diagonals = blobs.map { hypot(it.box.width().toDouble(), it.box.height().toDouble()) }
    for (i in blobs.indices) {
        for (j in i + 1 until blobs.size) {
            val dx = (blobs[i].box.centerX() - blobs[j].box.centerX()).toDouble()
            val dy = (blobs[i].box.centerY() - blobs[j].box.centerY()).toDouble()
            val distance = hypot(dx, dy)
            val threshold = (diagonals[i] + diagonals[j]) / 2.0 * CLUSTER_DISTANCE_FACTOR
            if (distance <= threshold) {
                val rootI = find(i)
                val rootJ = find(j)
                if (rootI != rootJ) parent[rootI] = rootJ
            }
        }
    }

    val largestCluster = blobs.indices.groupBy { find(it) }.values.maxByOrNull { it.size } ?: return null
    if (largestCluster.size < MIN_BLOBS_FOR_SUGGESTION) return null

    var left = Int.MAX_VALUE
    var top = Int.MAX_VALUE
    var right = Int.MIN_VALUE
    var bottom = Int.MIN_VALUE
    for (index in largestCluster) {
        val box = blobs[index].box
        left = min(left, box.left)
        top = min(top, box.top)
        right = max(right, box.right)
        bottom = max(bottom, box.bottom)
    }

    val padX = (right - left) * PADDING_FRACTION
    val padY = (bottom - top) * PADDING_FRACTION
    return RectF(
        ((left - padX) / width).coerceIn(0f, 1f),
        ((top - padY) / height).coerceIn(0f, 1f),
        ((right + padX) / width).coerceIn(0f, 1f),
        ((bottom + padY) / height).coerceIn(0f, 1f),
    )
}

private const val MIN_BLOBS_FOR_SUGGESTION = 3
private const val CLUSTER_DISTANCE_FACTOR = 1.5
private const val PADDING_FRACTION = 0.08f
