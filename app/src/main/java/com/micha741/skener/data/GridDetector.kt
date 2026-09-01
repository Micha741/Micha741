package com.micha741.skener.data

import android.graphics.Bitmap
import android.graphics.Rect
import kotlin.math.max
import kotlin.math.min

/** Replaces any blob in [blobs] that [GridDetector.subdivide] finds to be a grid with its subdivided cells, leaving the rest as-is. Shared by [ObjectCounter] and [LiveFrameAnalyzer] so both apply the same grid-splitting to a photo/frame's raw detections. */
fun subdivideGrids(blobs: List<DetectedBlob>, bitmap: Bitmap): List<DetectedBlob> =
    blobs.flatMap { blob ->
        GridDetector.subdivide(bitmap, blob.box)?.map { DetectedBlob(box = it) } ?: listOf(blob)
    }

/**
 * Detects when a single detected blob is actually a regular grid of many
 * smaller pieces sitting flush against each other - keyboard keys, floor
 * or wall tiles, a pegboard. FastSAM correctly finds the whole thing as
 * one object (there's no strong shadow/gap boundary between individual
 * keys for it to split on the way it does for genuinely separate pieces),
 * but a universal counter needs "1 key", not "1 keyboard".
 *
 * Works on brightness alone, independent of FastSAM: sums how dark each
 * row/column of the blob's own crop is (grout lines/gaps between grid
 * cells are reliably darker than the cells themselves), then looks for a
 * period that darkness profile repeats at via autocorrelation. Rejects
 * merely-smooth/textured regions (wood grain, cloth) that aren't a real
 * grid by requiring the candidate period to *also* correlate strongly two
 * and three repeats out, not just be the smallest-lag local maximum -
 * every slowly-varying signal has one of those regardless of whether it's
 * actually periodic. Verified against a synthetic keyboard image (found
 * its 15 real column boundaries almost exactly) and against organic/
 * textured scenes that must NOT trigger this - a synthetic fruit-bowl
 * photo with a wood-grain-textured background produced a false positive
 * before the two/three-repeat check was added, and a clean rejection
 * after.
 */
object GridDetector {

    /**
     * If [box] on [bitmap] looks like a regular grid, returns its
     * subdivision as smaller boxes; otherwise null (nothing confident
     * enough was found - the caller should keep the original single box).
     * Splits only the axis (or axes) that actually show grid periodicity -
     * a keyboard's columns can come back confidently split while its rows
     * don't, if the row signal is too weak to confirm, and the result is
     * a row of full-height column slices rather than a full 2D grid.
     */
    fun subdivide(bitmap: Bitmap, box: Rect): List<Rect>? {
        val left = box.left.coerceIn(0, bitmap.width - 1)
        val top = box.top.coerceIn(0, bitmap.height - 1)
        val right = box.right.coerceIn(left + 1, bitmap.width)
        val bottom = box.bottom.coerceIn(top + 1, bitmap.height)
        val width = right - left
        val height = bottom - top
        if (width < MIN_REGION_SIZE || height < MIN_REGION_SIZE) return null

        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, left, top, width, height)

        val colProfile = FloatArray(width)
        val rowProfile = FloatArray(height)
        for (y in 0 until height) {
            for (x in 0 until width) {
                val pixel = pixels[y * width + x]
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                val darkness = 255f - (r + g + b) / 3f
                colProfile[x] += darkness
                rowProfile[y] += darkness
            }
        }

        val smoothWindow = max(5, min(width, height) / 60)
        val colLines = findGridLines(colProfile, smoothWindow)
        val rowLines = findGridLines(rowProfile, smoothWindow)
        if (colLines == null && rowLines == null) return null

        val effectiveColLines = colLines ?: listOf(0, width)
        val effectiveRowLines = rowLines ?: listOf(0, height)
        val cellCount = (effectiveColLines.size - 1) * (effectiveRowLines.size - 1)
        if (cellCount < MIN_CELLS || cellCount > MAX_CELLS) return null

        val boxes = mutableListOf<Rect>()
        for (rowIndex in 0 until effectiveRowLines.size - 1) {
            for (colIndex in 0 until effectiveColLines.size - 1) {
                boxes += Rect(
                    left + effectiveColLines[colIndex],
                    top + effectiveRowLines[rowIndex],
                    left + effectiveColLines[colIndex + 1],
                    top + effectiveRowLines[rowIndex + 1],
                )
            }
        }
        return boxes
    }

    /** Finds regularly-spaced line positions (grid cell boundaries) in [profile], or null if nothing periodic enough was found - see class doc for the confidence check. */
    private fun findGridLines(profile: FloatArray, smoothWindow: Int): List<Int>? {
        val n = profile.size
        val smoothed = smooth(profile, smoothWindow)

        val minPeriod = max(MIN_PERIOD_PX, n / MAX_CELLS_PER_AXIS)
        val maxPeriod = n / MIN_CELLS_PER_AXIS
        if (minPeriod >= maxPeriod) return null

        val mean = smoothed.average().toFloat()
        val centered = FloatArray(n) { smoothed[it] - mean }
        val energy = centered.sumOf { (it * it).toDouble() } / n
        if (energy < MIN_ENERGY) return null

        fun autocorrAt(lag: Int): Double {
            if (lag >= n) return -1.0
            var sum = 0.0
            for (i in 0 until n - lag) sum += centered[i] * centered[i + lag]
            return sum / (n - lag) / energy
        }

        var bestPeriod = -1
        var bestScore = Double.NEGATIVE_INFINITY
        for (period in minPeriod..maxPeriod) {
            val score = autocorrAt(period)
            if (score > bestScore) {
                bestScore = score
                bestPeriod = period
            }
        }
        if (bestPeriod <= 0 || bestPeriod * 3 >= n) return null

        val confidence = min(bestScore, min(autocorrAt(bestPeriod * 2), autocorrAt(bestPeriod * 3)))
        if (confidence < MIN_CONFIDENCE) return null

        return snapLines(smoothed, bestPeriod)
    }

    private fun smooth(profile: FloatArray, window: Int): FloatArray {
        val half = window / 2
        return FloatArray(profile.size) { i ->
            var sum = 0f
            var count = 0
            for (j in max(0, i - half)..min(profile.size - 1, i + half)) {
                sum += profile[j]
                count++
            }
            sum / count
        }
    }

    /** Places candidate lines at multiples of [period] (best phase offset), then snaps each to the strongest nearby point in [profile]. */
    private fun snapLines(profile: FloatArray, period: Int): List<Int> {
        val n = profile.size
        var bestPhase = 0
        var bestScore = Double.NEGATIVE_INFINITY
        for (phase in 0 until period) {
            var score = 0.0
            var x = phase
            while (x < n) {
                score += profile[x]
                x += period
            }
            if (score > bestScore) {
                bestScore = score
                bestPhase = phase
            }
        }

        val radius = max(1, period / 4)
        val lines = mutableListOf<Int>()
        var x = bestPhase
        while (x < n) {
            val lo = max(0, x - radius)
            val hi = min(n - 1, x + radius)
            var bestX = lo
            var bestVal = profile[lo]
            for (candidate in lo..hi) {
                if (profile[candidate] > bestVal) {
                    bestVal = profile[candidate]
                    bestX = candidate
                }
            }
            lines += bestX
            x += period
        }
        return lines
    }

    private const val MIN_REGION_SIZE = 40
    private const val MIN_PERIOD_PX = 12
    private const val MIN_CELLS_PER_AXIS = 6
    private const val MAX_CELLS_PER_AXIS = 30
    private const val MIN_ENERGY = 1f
    private const val MIN_CONFIDENCE = 0.15
    private const val MIN_CELLS = 2
    private const val MAX_CELLS = 400
}
