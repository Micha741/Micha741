package com.micha741.skener

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.micha741.skener.data.ScanRepository

class ScanViewModelFactory(context: Context) : ViewModelProvider.Factory {
    private val appContext = context.applicationContext
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return ScanViewModel(ScanRepository(appContext)) as T
    }
}
