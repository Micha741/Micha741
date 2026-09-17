package com.micha741.skener.data

import android.content.Context
import android.net.Uri
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Persists scanned PDFs under the app's files/scans directory. Page count is
 * encoded in the filename so it can be listed without opening every PDF.
 */
class ScanRepository(private val context: Context) {

    private val scansDir: File
        get() = File(context.filesDir, "scans").apply { mkdirs() }

    fun savePdf(sourceUri: Uri, pageCount: Int): ScanDocument {
        val timestamp = System.currentTimeMillis()
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(timestamp)
        val destFile = File(scansDir, "scan_${stamp}_${pageCount}p.pdf")

        context.contentResolver.openInputStream(sourceUri)?.use { input ->
            destFile.outputStream().use { output -> input.copyTo(output) }
        }

        return ScanDocument(destFile, pageCount, timestamp)
    }

    fun listScans(): List<ScanDocument> {
        val files = scansDir.listFiles { f -> f.extension == "pdf" } ?: emptyArray()
        return files
            .map { file -> ScanDocument(file, pageCountFromName(file.name), file.lastModified()) }
            .sortedByDescending { it.createdAtMillis }
    }

    fun delete(document: ScanDocument): Boolean = document.pdfFile.delete()

    private fun pageCountFromName(name: String): Int {
        val match = Regex("_(\\d+)p\\.pdf$").find(name) ?: return 1
        return match.groupValues[1].toIntOrNull() ?: 1
    }
}
