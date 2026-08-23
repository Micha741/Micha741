package com.micha741.skener.data

import android.graphics.Point
import android.graphics.Rect

/** Coarse geometric classification of a blob's outline - only the OpenCV pipeline ([com.micha741.skener.data.cv.CvBlobAnalyzer]) fills this in accurately. */
enum class ShapeType { TRIANGLE, RECTANGLE, TRAPEZOID, CIRCLE, OTHER }

/**
 * One detected blob (piece), as shown in the UI: its bounding box, shape
 * descriptors, an optional real outline, and how many pixels make it up.
 * Both the static-photo counter ([ObjectCounter]) and the live camera
 * counter ([LiveFrameAnalyzer]) produce this from the shared OpenCV
 * pipeline ([com.micha741.skener.data.cv.CvBlobAnalyzer]).
 */
data class DetectedBlob(
    val box: Rect,
    val area: Int,
    /** area / bounding-box area - how "solid" the shape is (1.0 = fills its box, e.g. a square/rectangle). */
    val fillRatio: Float,
    /** longer side / shorter side of the bounding box, always >= 1 (1.0 = square-ish). */
    val aspectRatio: Float,
    val shapeType: ShapeType = ShapeType.OTHER,
    /** Approximated outline (image pixel coords) for drawing the real edge instead of just the bounding box; empty if unknown. */
    val polygon: List<Point> = emptyList(),
)
