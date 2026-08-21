package com.micha741.skener

import android.content.Context
import android.graphics.Point
import android.graphics.Rect
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.DetectedBlob
import com.micha741.skener.data.ObjectCounter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CountingUiState(
    val photoUri: Uri? = null,
    val blobs: List<DetectedBlob> = emptyList(),
    val count: Int? = null,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
    /** True once a reference piece was successfully picked - the count above is "similar to that piece" only. */
    val referenceActive: Boolean = false,
    val referenceBox: Rect? = null,
)

class CountingViewModel(
    private val appContext: Context,
    private val counter: ObjectCounter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CountingUiState())
    val uiState: StateFlow<CountingUiState> = _uiState.asStateFlow()

    fun onPhotoSelected(uri: Uri) {
        _uiState.value = CountingUiState(photoUri = uri, isProcessing = true)
        runCount(uri, referenceTap = null)
    }

    /** User tapped a piece in the result photo (in original photo pixel coordinates): count only similar pieces. */
    fun onReferenceTap(point: Point) {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isProcessing = true) }
        runCount(uri, referenceTap = point)
    }

    /** Drops the reference piece and goes back to counting every detected piece. */
    fun clearReference() {
        val uri = _uiState.value.photoUri ?: return
        _uiState.update { it.copy(isProcessing = true, referenceActive = false, referenceBox = null) }
        runCount(uri, referenceTap = null)
    }

    fun reset() {
        _uiState.value = CountingUiState()
    }

    fun consumeError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    private fun runCount(uri: Uri, referenceTap: Point?) {
        viewModelScope.launch {
            counter.count(uri, referenceTap)
                .onSuccess { result ->
                    _uiState.update {
                        it.copy(
                            isProcessing = false,
                            blobs = result.blobs,
                            count = result.count,
                            referenceActive = referenceTap != null && result.referenceBlob != null,
                            referenceBox = if (referenceTap != null) result.referenceBlob?.box else it.referenceBox,
                            errorMessage = if (referenceTap != null && result.referenceBlob == null) {
                                appContext.getString(R.string.count_reference_not_found)
                            } else {
                                it.errorMessage
                            },
                        )
                    }
                }
                .onFailure { exception ->
                    val message = exception.message ?: appContext.getString(R.string.count_failed)
                    _uiState.update { it.copy(isProcessing = false, errorMessage = message) }
                }
        }
    }
}
