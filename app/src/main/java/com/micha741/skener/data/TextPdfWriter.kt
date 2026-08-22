package com.micha741.skener.data

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.text.TextPaint
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max

/**
 * Renders OCR-recognized text into a PDF - no source images are embedded,
 * but each line is drawn back at roughly its original position, size,
 * color and bold/italic style (see [DocumentTextExtractor]/[FormattedLine]),
 * one PDF page per source photo, sized to that photo's aspect ratio so the
 * positions map with a single scale factor.
 */
object TextPdfWriter {

    /** Writes the PDF; returns the number of pages (always [pages].size - one PDF page per photo). */
    fun write(pages: List<RecognizedPage>, outputFile: File): Int {
        val document = PdfDocument()
        val paint = TextPaint().apply { isAntiAlias = true }

        pages.forEachIndexed { index, page ->
            val scale = if (page.imageWidth > 0) PAGE_WIDTH / page.imageWidth else 1f
            val pageHeight = max(1, (page.imageHeight * scale).toInt())
            val pdfPage = document.startPage(
                PdfDocument.PageInfo.Builder(PAGE_WIDTH.toInt(), pageHeight, index + 1).create(),
            )
            val canvas = pdfPage.canvas

            if (page.lines.isEmpty()) {
                paint.textSize = EMPTY_PAGE_FONT_SIZE
                paint.color = Color.DKGRAY
                paint.typeface = Typeface.DEFAULT
                canvas.drawText("(žádný text nerozpoznán)", MARGIN, MARGIN - paint.ascent(), paint)
            } else {
                for (line in page.lines) {
                    if (line.text.isBlank()) continue
                    val boxHeight = line.box.height() * scale
                    if (boxHeight <= 1f) continue

                    paint.textSize = (boxHeight * FONT_SIZE_FACTOR).coerceIn(MIN_FONT_SIZE, MAX_FONT_SIZE)
                    paint.color = line.color
                    paint.typeface = Typeface.create(Typeface.DEFAULT, typefaceStyle(line))

                    val x = line.box.left * scale
                    val y = line.box.top * scale - paint.ascent()
                    canvas.drawText(line.text, x, y, paint)
                }
            }

            document.finishPage(pdfPage)
        }

        FileOutputStream(outputFile).use { document.writeTo(it) }
        document.close()
        return pages.size
    }

    private fun typefaceStyle(line: FormattedLine): Int = when {
        line.bold && line.italic -> Typeface.BOLD_ITALIC
        line.bold -> Typeface.BOLD
        line.italic -> Typeface.ITALIC
        else -> Typeface.NORMAL
    }

    private const val PAGE_WIDTH = 595f // A4 width at 72dpi
    private const val MARGIN = 24f
    private const val FONT_SIZE_FACTOR = 0.8f
    private const val MIN_FONT_SIZE = 6f
    private const val MAX_FONT_SIZE = 96f
    private const val EMPTY_PAGE_FONT_SIZE = 12f
}
