package com.micha741.skener

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.ScanDocument
import com.micha741.skener.data.ScanRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ScanUiState(
    val documents: List<ScanDocument> = emptyList(),
    val errorMessage: String? = null,
)

class ScanViewModel(private val repository: ScanRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        _uiState.update { it.copy(documents = repository.listScans()) }
    }

    fun onScanSucceeded(pdfUri: Uri, pageCount: Int) {
        viewModelScope.launch {
            repository.savePdf(pdfUri, pageCount)
            refresh()
        }
    }

    fun onScanFailed(message: String) {
        _uiState.update { it.copy(errorMessage = message) }
    }

    fun consumeError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun delete(document: ScanDocument) {
        repository.delete(document)
        refresh()
    }
}
