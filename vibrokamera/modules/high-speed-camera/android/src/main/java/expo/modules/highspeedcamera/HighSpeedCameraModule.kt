package expo.modules.highspeedcamera

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HighSpeedCameraModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("HighSpeedCamera")

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
