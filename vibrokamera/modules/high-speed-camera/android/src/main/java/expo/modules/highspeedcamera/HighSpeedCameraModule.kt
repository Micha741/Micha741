package expo.modules.highspeedcamera

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.concurrent.atomic.AtomicBoolean

class TrackOptions : Record {
  @Field val path: String = ""
  @Field val centerX: Double = 0.5
  @Field val centerY: Double = 0.5
  @Field val roiSize: Double = 0.08
  @Field val searchRadius: Int = 8
  @Field val startMs: Double = 0.0
  @Field val durationMs: Double = 2000.0
}

class HighSpeedCameraModule : Module() {
  private var trackingCancel: AtomicBoolean? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("HighSpeedCamera")

    Events("onTrackingProgress")

    AsyncFunction("trackMotionAsync") { options: TrackOptions, promise: Promise ->
      Recordings.requireOwnFile(context, options.path)
      trackingCancel?.set(true)
      val cancel = AtomicBoolean(false)
      trackingCancel = cancel
      Thread {
        try {
          val result = MotionTracker(
            path = options.path,
            centerX = options.centerX,
            centerY = options.centerY,
            roiSize = options.roiSize,
            searchRadius = options.searchRadius,
            startMs = options.startMs,
            durationMs = options.durationMs,
            cancelled = cancel
          ) { progress -> sendEvent("onTrackingProgress", mapOf("progress" to progress)) }.run()
          promise.resolve(
            mapOf(
              "timesMs" to result.timesMs,
              "dx" to result.dx,
              "dy" to result.dy,
              "score" to result.score,
              "displayWidth" to result.displayWidth,
              "displayHeight" to result.displayHeight,
              "roiPx" to result.roiPx
            )
          )
        } catch (e: Throwable) {
          promise.reject("E_TRACKING", e.message ?: "Analýza selhala", e)
        }
      }.apply { name = "MotionTracker" }.start()
    }

    Function("cancelTracking") {
      trackingCancel?.set(true)
      true
    }

    AsyncFunction("getCamerasAsync") {
      CameraCapabilities.query(context)
    }

    AsyncFunction("listRecordingsAsync") {
      Recordings.list(context)
    }

    AsyncFunction("deleteRecordingAsync") { path: String ->
      Recordings.delete(context, path)
    }

    AsyncFunction("saveToGalleryAsync") { path: String ->
      Recordings.saveToGallery(context, path)
    }

    AsyncFunction("getDeviceInfoAsync") {
      mapOf(
        "manufacturer" to android.os.Build.MANUFACTURER,
        "brand" to android.os.Build.BRAND,
        "model" to android.os.Build.MODEL,
        "device" to android.os.Build.DEVICE,
        "androidVersion" to android.os.Build.VERSION.RELEASE,
        "sdk" to android.os.Build.VERSION.SDK_INT
      )
    }

    AsyncFunction("getStorageInfoAsync") {
      Recordings.storageInfo(context)
    }

    AsyncFunction("exportTextAsync") { fileName: String, content: String, mimeType: String ->
      Recordings.exportText(context, fileName, content, mimeType)
    }

    OnActivityEntersBackground {
      HighSpeedCameraView.forEachLive { it.onHostPause() }
    }

    OnActivityEntersForeground {
      HighSpeedCameraView.forEachLive { it.onHostResume() }
    }

    View(HighSpeedCameraView::class) {
      Events("onCameraReady", "onCameraError", "onRecordingFinished")

      Prop("cameraId") { view: HighSpeedCameraView, value: String? -> view.cameraId = value }
      Prop("videoWidth") { view: HighSpeedCameraView, value: Int -> view.videoWidth = value }
      Prop("videoHeight") { view: HighSpeedCameraView, value: Int -> view.videoHeight = value }
      Prop("fps") { view: HighSpeedCameraView, value: Int -> view.fps = value }
      Prop("highSpeed") { view: HighSpeedCameraView, value: Boolean -> view.highSpeed = value }
      Prop("torch") { view: HighSpeedCameraView, value: Boolean -> view.torch = value }
      Prop("exposureCompensation") { view: HighSpeedCameraView, value: Int -> view.exposureCompensation = value }
      Prop("aeLock") { view: HighSpeedCameraView, value: Boolean -> view.aeLock = value }
      Prop("bitRate") { view: HighSpeedCameraView, value: Int -> view.bitRate = value }
      Prop("maxDurationMs") { view: HighSpeedCameraView, value: Int -> view.maxDurationMs = value }

      OnViewDidUpdateProps { view -> view.applyProps() }
      OnViewDestroys { view -> view.release() }

      AsyncFunction("startRecording") { view: HighSpeedCameraView, promise: Promise ->
        view.startRecording(promise)
      }

      AsyncFunction("stopRecording") { view: HighSpeedCameraView, promise: Promise ->
        view.stopRecording(promise)
      }
    }
  }
}
