package com.micha741.skener

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.DocumentTextExtractor
import com.micha741.skener.data.ScanDocument
import com.micha741.skener.data.ScanRepository
import com.micha741.skener.data.TextPdfWriter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

enum class ScanMode { IMAGE, TEXT }

data class ScanUiState(
    val documents: List<ScanDocument> = emptyList(),
    val scanMode: ScanMode = ScanMode.IMAGE,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null,
)

class ScanViewModel(
    private val repository: ScanRepository,
    private val textExtractor: DocumentTextExtractor,
    private val appContext: Context,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        _uiState.update { it.copy(documents = repository.listScans()) }
    }

    fun setScanMode(mode: ScanMode) {
        _uiState.update { it.copy(scanMode = mode) }
    }

    /** Image mode: the scanner's own cropped/enhanced pages, saved as-is. */
    fun onScanSucceeded(pdfUri: Uri, pageCount: Int) {
        viewModelScope.launch {
            repository.savePdf(pdfUri, pageCount)
            refresh()
        }
    }

    /** Text mode: OCR each page image, then render a plain text-only PDF - no photo is kept. */
    fun onScanSucceededWithText(pageImageUris: List<Uri>) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true) }

            val pagesText = mutableListOf<String>()
            var failure: Throwable? = null
            for (uri in pageImageUris) {
                textExtractor.recognize(uri)
                    .onSuccess { pagesText += it }
                    .onFailure { failure = it }
                if (failure != null) break
            }

            if (failure != null) {
                _uiState.update {
                    it.copy(
                        isProcessing = false,
                        errorMessage = failure?.message ?: appContext.getString(R.string.ocr_failed),
                    )
                }
                return@launch
            }

            val (pdfFile, renderedPageCount) = withContext(Dispatchers.Default) {
                val file = File(appContext.cacheDir, "ocr_${System.currentTimeMillis()}.pdf")
                val pageCount = TextPdfWriter.write(pagesText, file)
                file to pageCount
            }

            repository.savePdf(Uri.fromFile(pdfFile), renderedPageCount)
            pdfFile.delete()
            _uiState.update { it.copy(isProcessing = false) }
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
