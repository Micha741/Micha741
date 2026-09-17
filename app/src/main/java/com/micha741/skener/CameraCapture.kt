package com.micha741.skener

import android.content.Context
import android.net.Uri
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File

/**
 * Captures a photo via [imageCapture] into a fresh cache file
 * (`"<filePrefix>_<timestamp>.jpg"`) and hands back a [FileProvider] Uri -
 * shared by every screen with its own CameraX shutter button
 * ([LiveCameraScreen], [MeasureCameraScreen]).
 */
fun capturePhoto(
    context: Context,
    imageCapture: ImageCapture,
    filePrefix: String,
    fallbackErrorMessage: String,
    onSuccess: (Uri) -> Unit,
    onError: (String) -> Unit,
) {
    val file = File(context.cacheDir, "${filePrefix}_${System.currentTimeMillis()}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
    imageCapture.takePicture(
        outputOptions,
        ContextCompat.getMainExecutor(context),
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                onSuccess(uri)
            }

            override fun onError(exception: ImageCaptureException) {
                onError(exception.message ?: fallbackErrorMessage)
            }
        },
    )
}
