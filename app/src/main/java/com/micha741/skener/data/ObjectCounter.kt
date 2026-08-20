package com.micha741.skener.data

import android.content.Context
import android.graphics.Rect
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

data class CountResult(val boxes: List<Rect>)

/**
 * Counts distinct objects found in a photo using ML Kit's on-device object
 * detector. Works best with well-separated, well-lit items (e.g. parts laid
 * out on a table) rather than a tightly packed pile.
 */
class ObjectCounter(private val context: Context) {

    private val detector by lazy {
        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
            .enableMultipleObjects()
            .build()
        ObjectDetection.getClient(options)
    }

    suspend fun count(uri: Uri): Result<CountResult> = suspendCancellableCoroutine { continuation ->
        val image = try {
            InputImage.fromFilePath(context, uri)
        } catch (e: Exception) {
            continuation.resume(Result.failure(e))
            return@suspendCancellableCoroutine
        }

        detector.process(image)
            .addOnSuccessListener { objects ->
                continuation.resume(Result.success(CountResult(objects.map { it.boundingBox })))
            }
            .addOnFailureListener { exception ->
                continuation.resume(Result.failure(exception))
            }
    }
}
