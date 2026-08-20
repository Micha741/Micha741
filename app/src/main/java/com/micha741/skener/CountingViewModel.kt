package com.micha741.skener

import android.content.Context
import android.graphics.Rect
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.ObjectCounter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CountingUiState(
    val photoUri: Uri? = null,
    val boxes: List<Rect> = emptyList(),
    val count: Int? = null,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
)

class CountingViewModel(
    private val appContext: Context,
    private val counter: ObjectCounter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CountingUiState())
    val uiState: StateFlow<CountingUiState> = _uiState.asStateFlow()

    fun onPhotoSelected(uri: Uri) {
        _uiState.value = CountingUiState(photoUri = uri, isProcessing = true)
        viewModelScope.launch {
            counter.count(uri)
                .onSuccess { result ->
                    _uiState.update {
                        it.copy(isProcessing = false, boxes = result.boxes, count = result.boxes.size)
                    }
                }
                .onFailure { exception ->
                    val message = exception.message ?: appContext.getString(R.string.count_failed)
                    _uiState.update { it.copy(isProcessing = false, errorMessage = message) }
                }
        }
    }

    fun reset() {
        _uiState.value = CountingUiState()
    }

    fun consumeError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
