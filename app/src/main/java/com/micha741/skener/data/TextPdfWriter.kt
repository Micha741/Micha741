package com.micha741.skener.data

import android.graphics.Color
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.io.File
import java.io.FileOutputStream

/**
 * Renders OCR-recognized text into a plain multi-page PDF - no source
 * images are embedded, only the extracted text (word-wrapped, paginated).
 */
object TextPdfWriter {

    private const val PAGE_WIDTH = 595 // A4 at 72dpi
    private const val PAGE_HEIGHT = 842
    private const val MARGIN = 48f
    private const val FONT_SIZE = 12f

    /** Writes the PDF and returns the number of pages actually rendered (may exceed [pagesText].size if a page's text overflows). */
    fun write(pagesText: List<String>, outputFile: File): Int {
        val document = PdfDocument()
        val paint = TextPaint().apply {
            isAntiAlias = true
            textSize = FONT_SIZE
            color = Color.BLACK
        }
        val contentWidth = (PAGE_WIDTH - 2 * MARGIN).toInt()
        val bottomBound = PAGE_HEIGHT - MARGIN
        val lineHeight = paint.fontSpacing

        var pageNumber = 1
        var page: PdfDocument.Page? = null
        var y = 0f

        fun startNewPage() {
            page?.let { document.finishPage(it) }
            page = document.startPage(PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, pageNumber).create())
            pageNumber++
            y = MARGIN - paint.ascent()
        }

        startNewPage()

        pagesText.forEachIndexed { index, rawText ->
            val text = rawText.ifBlank { "(žádný text nerozpoznán)" }
            val layout = StaticLayout.Builder
                .obtain(text, 0, text.length, paint, contentWidth)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .build()

            for (line in 0 until layout.lineCount) {
                if (y + paint.descent() > bottomBound) {
                    startNewPage()
                }
                val start = layout.getLineStart(line)
                val end = layout.getLineEnd(line)
                page!!.canvas.drawText(text, start, end, MARGIN, y, paint)
                y += lineHeight
            }

            if (index != pagesText.lastIndex) {
                startNewPage()
            }
        }

        page?.let { document.finishPage(it) }
        FileOutputStream(outputFile).use { document.writeTo(it) }
        document.close()
        return pageNumber - 1
    }
}
