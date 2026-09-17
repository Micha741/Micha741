package com.micha741.skener.data

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix

/** Re-encodes a scanned code's value back into a scannable bitmap, so it can be saved/shared as a picture. */
object BarcodeImageEncoder {

    fun encode(value: String, formatLabel: String, size: Int = 512): Bitmap? = runCatching {
        val matrix = MultiFormatWriter().encode(value, formatFor(formatLabel), size, size)
        matrixToBitmap(matrix)
    }.getOrNull()

    private fun matrixToBitmap(matrix: BitMatrix): Bitmap {
        val width = matrix.width
        val height = matrix.height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        for (y in 0 until height) {
            for (x in 0 until width) {
                bitmap.setPixel(x, y, if (matrix.get(x, y)) Color.BLACK else Color.WHITE)
            }
        }
        return bitmap
    }

    /** Falls back to QR for any format ZXing can't/we don't map for encoding. */
    private fun formatFor(label: String): BarcodeFormat = when (label) {
        "QR" -> BarcodeFormat.QR_CODE
        "EAN-13" -> BarcodeFormat.EAN_13
        "EAN-8" -> BarcodeFormat.EAN_8
        "Code 128" -> BarcodeFormat.CODE_128
        "Code 39" -> BarcodeFormat.CODE_39
        "Code 93" -> BarcodeFormat.CODE_93
        "UPC-A" -> BarcodeFormat.UPC_A
        "UPC-E" -> BarcodeFormat.UPC_E
        "ITF" -> BarcodeFormat.ITF
        "Codabar" -> BarcodeFormat.CODABAR
        "Data Matrix" -> BarcodeFormat.DATA_MATRIX
        "PDF417" -> BarcodeFormat.PDF_417
        "Aztec" -> BarcodeFormat.AZTEC
        else -> BarcodeFormat.QR_CODE
    }
}
