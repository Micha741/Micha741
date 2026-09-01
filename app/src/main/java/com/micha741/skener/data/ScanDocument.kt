package com.micha741.skener.data

import java.io.File

data class ScanDocument(
    val pdfFile: File,
    val pageCount: Int,
    val createdAtMillis: Long,
)
