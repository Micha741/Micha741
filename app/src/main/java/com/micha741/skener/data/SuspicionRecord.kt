package com.micha741.skener.data

import java.io.File

/** One user-flagged counting result: the flattened result image (see [SuspicionRepository]) plus the note explaining what's wrong with it. */
data class SuspicionRecord(
    val imageFile: File,
    val note: String,
    val createdAtMillis: Long,
)
