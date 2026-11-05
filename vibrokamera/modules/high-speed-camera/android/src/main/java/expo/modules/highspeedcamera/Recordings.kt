package expo.modules.highspeedcamera

import android.content.ContentValues
import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.exception.CodedException
import java.io.File

/** Správa nahraných videí v úložišti aplikace. */
object Recordings {
  fun directory(context: Context): File {
    val base = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: File(context.filesDir, "movies")
    return File(base, "recordings").apply { mkdirs() }
  }

  fun list(context: Context): List<Map<String, Any?>> {
    val files = directory(context).listFiles { f -> f.isFile && f.name.endsWith(".mp4") } ?: emptyArray()
    return files.sortedByDescending { it.lastModified() }.map { describe(it) }
  }

  fun describe(file: File): Map<String, Any?> {
    var durationMs: Double? = null
    var frameCount: Int? = null
    var width: Int? = null
    var height: Int? = null
    var rotation: Int? = null
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(file.absolutePath)
      durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toDoubleOrNull()
      width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()
      height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()
      rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        frameCount = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_FRAME_COUNT)?.toIntOrNull()
      }
    } catch (_: Exception) {
      // Poškozený nebo nedokončený soubor – vrátíme aspoň základní údaje.
    } finally {
      try {
        retriever.release()
      } catch (_: Exception) {
      }
    }
    return mapOf(
      "path" to file.absolutePath,
      "uri" to Uri.fromFile(file).toString(),
      "name" to file.name,
      "sizeBytes" to file.length().toDouble(),
      "modified" to file.lastModified().toDouble(),
      "durationMs" to durationMs,
      "frameCount" to frameCount,
      "width" to width,
      "height" to height,
      "rotation" to rotation
    )
  }

  fun delete(context: Context, path: String): Boolean {
    val file = requireOwnFile(context, path)
    return file.delete()
  }

  /** Zkopíruje video do galerie (Movies/VibroKamera). Vyžaduje Android 10+. */
  fun saveToGallery(context: Context, path: String): String {
    val file = requireOwnFile(context, path)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      throw CodedException("E_UNSUPPORTED", "Uložení do galerie vyžaduje Android 10 nebo novější", null)
    }
    val resolver = context.contentResolver
    val values = ContentValues().apply {
      put(MediaStore.Video.Media.DISPLAY_NAME, file.name)
      put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
      put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/VibroKamera")
      put(MediaStore.Video.Media.IS_PENDING, 1)
    }
    val collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val uri = resolver.insert(collection, values)
      ?: throw CodedException("E_GALLERY", "Nepodařilo se vytvořit položku v galerii", null)
    try {
      resolver.openOutputStream(uri)?.use { out ->
        file.inputStream().use { input -> input.copyTo(out) }
      } ?: throw CodedException("E_GALLERY", "Nepodařilo se zapsat do galerie", null)
      values.clear()
      values.put(MediaStore.Video.Media.IS_PENDING, 0)
      resolver.update(uri, values, null, null)
    } catch (e: Exception) {
      resolver.delete(uri, null, null)
      throw e
    }
    return uri.toString()
  }

  /** Kde a kolik místa zabírají záznamy. */
  fun storageInfo(context: Context): Map<String, Any?> {
    val dir = directory(context)
    val files = dir.listFiles { f -> f.isFile && f.name.endsWith(".mp4") } ?: emptyArray()
    return mapOf(
      "recordingsDir" to dir.absolutePath,
      "recordingsCount" to files.size,
      "recordingsBytes" to files.sumOf { it.length() }.toDouble(),
      "freeBytes" to dir.usableSpace.toDouble()
    )
  }

  /** Uloží textový soubor (např. CSV s výsledky) do Stažené/VibroKamera. Vyžaduje Android 10+. */
  fun exportText(context: Context, fileName: String, content: String, mimeType: String): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      throw CodedException("E_UNSUPPORTED", "Export vyžaduje Android 10 nebo novější", null)
    }
    val safeName = fileName.replace(Regex("[^A-Za-z0-9._-]"), "_")
    val resolver = context.contentResolver
    val values = ContentValues().apply {
      put(MediaStore.Downloads.DISPLAY_NAME, safeName)
      put(MediaStore.Downloads.MIME_TYPE, mimeType)
      put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/VibroKamera")
    }
    val uri = resolver.insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values)
      ?: throw CodedException("E_EXPORT", "Nepodařilo se vytvořit soubor ve Stažených", null)
    try {
      resolver.openOutputStream(uri)?.use { out ->
        // BOM, aby Excel správně zobrazil češtinu.
        out.write(byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte()))
        out.write(content.toByteArray(Charsets.UTF_8))
      } ?: throw CodedException("E_EXPORT", "Nepodařilo se zapsat soubor", null)
    } catch (e: Exception) {
      resolver.delete(uri, null, null)
      throw e
    }
    return "${Environment.DIRECTORY_DOWNLOADS}/VibroKamera/$safeName"
  }

  fun requireOwnFile(context: Context, path: String): File {
    val dir = directory(context).canonicalFile
    val file = File(path).canonicalFile
    if (file.parentFile != dir) {
      throw CodedException("E_PATH", "Soubor není záznamem aplikace", null)
    }
    return file
  }
}
