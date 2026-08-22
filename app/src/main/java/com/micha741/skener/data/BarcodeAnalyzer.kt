package com.micha741.skener.data

import android.content.Context
import android.graphics.Rect
import android.net.Uri
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

data class DetectedBarcode(val value: String, val format: String, val boundingBox: Rect?)
data class BarcodeFrameResult(val barcodes: List<DetectedBarcode>, val frameWidth: Int, val frameHeight: Int)

/**
 * CameraX [ImageAnalysis.Analyzer] that feeds live preview frames straight
 * into ML Kit's barcode/QR scanner (a much better fit here than a custom
 * pipeline - decoding a 1D/2D barcode is exactly what it's built for) and
 * reports results together with the frame's rotation-corrected dimensions,
 * so the caller can map bounding boxes onto the preview overlay.
 */
class BarcodeAnalyzer(
    private val onResult: (BarcodeFrameResult) -> Unit,
) : ImageAnalysis.Analyzer {

    private val scanner = BarcodeScanning.getClient()

    @ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(inputImage)
            .addOnSuccessListener { barcodes ->
                val detected = barcodes.mapNotNull { it.toDetectedBarcode() }
                onResult(BarcodeFrameResult(detected, inputImage.width, inputImage.height))
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }
}

/** One-shot barcode/QR scan over a still photo (e.g. picked from the gallery), for when there's no live camera. */
object StaticBarcodeScanner {

    private val scanner by lazy { BarcodeScanning.getClient() }

    suspend fun scan(context: Context, uri: Uri): List<DetectedBarcode> = suspendCancellableCoroutine { continuation ->
        val image = try {
            InputImage.fromFilePath(context, uri)
        } catch (e: Exception) {
            continuation.resume(emptyList())
            return@suspendCancellableCoroutine
        }

        scanner.process(image)
            .addOnSuccessListener { barcodes -> continuation.resume(barcodes.mapNotNull { it.toDetectedBarcode() }) }
            .addOnFailureListener { continuation.resume(emptyList()) }
    }
}

private fun Barcode.toDetectedBarcode(): DetectedBarcode? {
    val value = rawValue ?: displayValue ?: return null
    return DetectedBarcode(value, formatName(format), boundingBox)
}

private fun formatName(format: Int): String = when (format) {
    Barcode.FORMAT_QR_CODE -> "QR"
    Barcode.FORMAT_EAN_13 -> "EAN-13"
    Barcode.FORMAT_EAN_8 -> "EAN-8"
    Barcode.FORMAT_CODE_128 -> "Code 128"
    Barcode.FORMAT_CODE_39 -> "Code 39"
    Barcode.FORMAT_CODE_93 -> "Code 93"
    Barcode.FORMAT_UPC_A -> "UPC-A"
    Barcode.FORMAT_UPC_E -> "UPC-E"
    Barcode.FORMAT_ITF -> "ITF"
    Barcode.FORMAT_CODABAR -> "Codabar"
    Barcode.FORMAT_DATA_MATRIX -> "Data Matrix"
    Barcode.FORMAT_PDF417 -> "PDF417"
    Barcode.FORMAT_AZTEC -> "Aztec"
    else -> "Kód"
}
