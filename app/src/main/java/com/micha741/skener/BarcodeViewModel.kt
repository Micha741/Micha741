package com.micha741.skener

import android.content.Context
import android.graphics.Rect
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.BarcodeFrameResult
import com.micha741.skener.data.StaticBarcodeScanner
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ScannedCode(val value: String, val format: String, val timestamp: Long)

data class BarcodeUiState(
    val liveBoxes: List<Rect> = emptyList(),
    val frameWidth: Int = 0,
    val frameHeight: Int = 0,
    val history: List<ScannedCode> = emptyList(),
    val isScanningPhoto: Boolean = false,
    val photoScanMessage: String? = null,
)

class BarcodeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(BarcodeUiState())
    val uiState: StateFlow<BarcodeUiState> = _uiState.asStateFlow()

    /** Called from the analyzer's background executor on every processed live-camera frame. */
    fun onDetected(result: BarcodeFrameResult) {
        _uiState.update { state ->
            val lastValue = state.history.firstOrNull()?.value
            val newEntries = result.barcodes
                .filter { it.value != lastValue }
                .distinctBy { it.value }
                .map { ScannedCode(it.value, it.format, System.currentTimeMillis()) }

            state.copy(
                liveBoxes = result.barcodes.mapNotNull { it.boundingBox },
                frameWidth = result.frameWidth,
                frameHeight = result.frameHeight,
                history = (newEntries + state.history).take(MAX_HISTORY),
            )
        }
    }

    /** Runs a one-shot scan over a picked photo (no live camera) and adds any found codes to the history. */
    fun onPhotoPicked(context: Context, uri: Uri) {
        _uiState.update { it.copy(isScanningPhoto = true) }
        viewModelScope.launch {
            val found = StaticBarcodeScanner.scan(context.applicationContext, uri)
            _uiState.update { state ->
                if (found.isEmpty()) {
                    state.copy(
                        isScanningPhoto = false,
                        photoScanMessage = context.getString(R.string.barcode_no_code_found),
                    )
                } else {
                    val newEntries = found.distinctBy { it.value }
                        .map { ScannedCode(it.value, it.format, System.currentTimeMillis()) }
                    state.copy(
                        isScanningPhoto = false,
                        history = (newEntries + state.history).take(MAX_HISTORY),
                    )
                }
            }
        }
    }

    fun consumePhotoScanMessage() {
        _uiState.update { it.copy(photoScanMessage = null) }
    }

    private companion object {
        const val MAX_HISTORY = 50
    }
}
