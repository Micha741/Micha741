package com.micha741.skener.data

import android.content.Context
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/** Runs on-device OCR (ML Kit, Latin script) over a scanned page image. */
class DocumentTextExtractor(private val context: Context) {

    private val recognizer by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

    suspend fun recognize(imageUri: Uri): Result<String> = suspendCancellableCoroutine { continuation ->
        val image = try {
            InputImage.fromFilePath(context, imageUri)
        } catch (e: Exception) {
            continuation.resume(Result.failure(e))
            return@suspendCancellableCoroutine
        }

        recognizer.process(image)
            .addOnSuccessListener { text -> continuation.resume(Result.success(text.text)) }
            .addOnFailureListener { exception -> continuation.resume(Result.failure(exception)) }
    }
}
