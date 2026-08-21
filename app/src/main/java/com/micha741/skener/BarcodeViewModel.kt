package com.micha741.skener

import android.graphics.Rect
import androidx.lifecycle.ViewModel
import com.micha741.skener.data.BarcodeFrameResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class ScannedCode(val value: String, val format: String, val timestamp: Long)

data class BarcodeUiState(
    val liveBoxes: List<Rect> = emptyList(),
    val frameWidth: Int = 0,
    val frameHeight: Int = 0,
    val history: List<ScannedCode> = emptyList(),
)

class BarcodeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(BarcodeUiState())
    val uiState: StateFlow<BarcodeUiState> = _uiState.asStateFlow()

    /** Called from the analyzer's background executor on every processed frame. */
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

    private companion object {
        const val MAX_HISTORY = 50
    }
}
