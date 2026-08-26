package com.micha741.skener.data

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Point
import android.graphics.Rect
import kotlin.math.max
import kotlin.math.min

/**
 * Flattens a counting result (the photo, the detected/manual boxes, the
 * count) into a single bitmap the user can save - the on-screen result in
 * [com.micha741.skener.CountingScreen] only exists as a live Compose
 * overlay over the photo, nothing durable to point a share sheet or a
 * Storage Access Framework save at. Draws the exact same marks (box
 * colors, manual-addition circles, the bottom count bar) the screen does,
 * just with `android.graphics.Canvas` onto a copy of the full-resolution
 * photo instead of a Compose `Canvas` scaled to the on-screen preview size -
 * so stroke widths and marker radii are computed relative to the *photo's*
 * own resolution here, not hardcoded pixel constants that would look
 * hairline-thin on a multi-megapixel saved image.
 */
object CountingResultEncoder {

    fun encode(
        bitmap: Bitmap,
        blobs: List<DetectedBlob>,
        excludedBoxes: Set<Rect>,
        manualAdditions: List<Point>,
        referenceActive: Boolean,
        referenceBox: Rect?,
        countLabel: String,
    ): Bitmap {
        val result = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(result)
        val shortSide = min(result.width, result.height)
        val normalStroke = max(2f, shortSide / 200f)
        val referenceStroke = normalStroke * 1.5f

        val boxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
        blobs.forEach { blob ->
            val isExcluded = blob.box in excludedBoxes
            val isReference = referenceActive && referenceBox != null && blob.box == referenceBox
            boxPaint.color = when {
                isExcluded -> COLOR_EXCLUDED
                isReference -> COLOR_REFERENCE
                else -> COLOR_NORMAL
            }
            boxPaint.strokeWidth = if (isReference) referenceStroke else normalStroke
            canvas.drawRect(blob.box, boxPaint)
        }

        val manualRadius = max(20, shortSide / 40).toFloat()
        val manualPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            color = COLOR_MANUAL
            strokeWidth = normalStroke
        }
        manualAdditions.forEach { point ->
            canvas.drawCircle(point.x.toFloat(), point.y.toFloat(), manualRadius, manualPaint)
        }

        val textSize = shortSide / 18f
        val barPadding = shortSide / 40f
        val barHeight = textSize + barPadding * 2
        val barPaint = Paint().apply { color = COLOR_BAR }
        canvas.drawRect(0f, result.height - barHeight, result.width.toFloat(), result.height.toFloat(), barPaint)

        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            this.textSize = textSize
        }
        canvas.drawText(countLabel, barPadding, result.height - barHeight + textSize + barPadding / 2f, textPaint)

        return result
    }

    private const val COLOR_EXCLUDED = 0x889E9E9E.toInt()
    private const val COLOR_REFERENCE = 0xFFFFB300.toInt()
    private const val COLOR_NORMAL = 0xFF62B6CB.toInt()
    private const val COLOR_MANUAL = 0xFF4CAF50.toInt()
    private const val COLOR_BAR = 0x8C000000.toInt()
}
