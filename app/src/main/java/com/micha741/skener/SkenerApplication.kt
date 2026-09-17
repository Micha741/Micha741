package com.micha741.skener

import android.app.Application
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter

/**
 * Installs a global uncaught-exception handler that writes the crash's
 * stack trace to a cache file before letting the crash proceed normally -
 * the system's own crash dialog still shows, this only leaves a copy the
 * user can retrieve afterwards (offered on the next launch, see
 * [MainActivity.offerCrashLogShare]). Needed because this app is normally
 * installed from a downloaded APK rather than run from Android Studio over
 * USB, so there's no live Logcat session to read a crash from.
 *
 * This only catches JVM-level uncaught exceptions, not a native crash
 * (e.g. inside ML Kit's underlying model) - those bypass this handler
 * entirely and would need a proper USB-connected Logcat session to see.
 */
class SkenerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            runCatching {
                val writer = StringWriter()
                throwable.printStackTrace(PrintWriter(writer))
                File(cacheDir, CRASH_LOG_FILE_NAME).writeText(writer.toString())
            }
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    companion object {
        const val CRASH_LOG_FILE_NAME = "last_crash.txt"
    }
}
