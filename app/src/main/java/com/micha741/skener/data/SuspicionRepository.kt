package com.micha741.skener.data

import android.content.Context
import android.graphics.Bitmap
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Persists user-flagged counting results under the app's files/suspicions
 * directory - a personal log of results the user has manually marked as
 * wrong ("this padlock isn't 2 pieces"), for later review. Purely a record
 * of what to look into: saving one here doesn't feed back into
 * [ObjectCounter]/[com.micha741.skener.data.fastsam.FastSamDetector] in any
 * way, since there's no per-object recognition to apply a remembered note
 * to on a future, different photo.
 *
 * Each entry is a PNG (the same flattened result image
 * [CountingResultEncoder] produces for a regular save) plus a plain-text
 * sidecar file holding the note, sharing a timestamp-based base name -
 * simplest way to pair the two without a database, matching
 * [ScanRepository]'s own file-based approach.
 */
class SuspicionRepository(private val context: Context) {

    private val suspicionsDir: File
        get() = File(context.filesDir, "suspicions").apply { mkdirs() }

    fun save(bitmap: Bitmap, note: String): SuspicionRecord {
        val timestamp = System.currentTimeMillis()
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(timestamp)
        val imageFile = File(suspicionsDir, "suspicion_$stamp.png")
        val noteFile = File(suspicionsDir, "suspicion_$stamp.txt")

        imageFile.outputStream().use { output -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, output) }
        noteFile.writeText(note)

        return SuspicionRecord(imageFile, note, timestamp)
    }

    fun list(): List<SuspicionRecord> {
        val files = suspicionsDir.listFiles { f -> f.extension == "png" } ?: emptyArray()
        return files
            .map { imageFile ->
                val noteFile = File(imageFile.parentFile, "${imageFile.nameWithoutExtension}.txt")
                val note = if (noteFile.exists()) noteFile.readText() else ""
                SuspicionRecord(imageFile, note, imageFile.lastModified())
            }
            .sortedByDescending { it.createdAtMillis }
    }

    fun delete(record: SuspicionRecord): Boolean {
        val noteFile = File(record.imageFile.parentFile, "${record.imageFile.nameWithoutExtension}.txt")
        noteFile.delete()
        return record.imageFile.delete()
    }
}
