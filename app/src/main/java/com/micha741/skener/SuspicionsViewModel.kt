package com.micha741.skener

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.micha741.skener.data.SuspicionRecord
import com.micha741.skener.data.SuspicionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SuspicionsUiState(
    val records: List<SuspicionRecord> = emptyList(),
)

/** Backs the "Podezření" list screen - browsing and deleting results the user flagged via [CountingViewModel.reportSuspicion]. */
class SuspicionsViewModel(private val repository: SuspicionRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(SuspicionsUiState())
    val uiState: StateFlow<SuspicionsUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        _uiState.update { it.copy(records = repository.list()) }
    }

    fun delete(record: SuspicionRecord) {
        viewModelScope.launch {
            repository.delete(record)
            refresh()
        }
    }
}
