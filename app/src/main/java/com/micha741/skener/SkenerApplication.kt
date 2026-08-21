package com.micha741.skener

import android.app.Application
import android.util.Log
import org.opencv.android.OpenCVLoader

class SkenerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val loaded = OpenCVLoader.initLocal()
        Log.i("SkenerApplication", if (loaded) "OpenCV loaded" else "OpenCV failed to load")
    }
}
