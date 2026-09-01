package com.micha741.skener

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.micha741.skener.data.ObjectCounter
import com.micha741.skener.data.SuspicionRepository

class CountingViewModelFactory(context: Context) : ViewModelProvider.Factory {
    private val appContext = context.applicationContext
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return CountingViewModel(appContext, ObjectCounter(appContext), SuspicionRepository(appContext)) as T
    }
}
