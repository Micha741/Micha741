package expo.modules.highspeedcamera

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.media.MediaRecorder

/** Zjistí, jaké kamery a snímkové frekvence telefon zpřístupňuje aplikacím. */
object CameraCapabilities {
  /** Rozlišení, která nabízíme v běžném (ne-high-speed) režimu. */
  private val NORMAL_SIZES = listOf(1920 to 1080, 1280 to 720, 3840 to 2160, 640 to 480)

  fun query(context: Context): List<Map<String, Any?>> {
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    return manager.cameraIdList.mapNotNull { id ->
      try {
        describe(id, manager.getCameraCharacteristics(id))
      } catch (_: Exception) {
        null
      }
    }
  }

  private fun describe(id: String, ch: CameraCharacteristics): Map<String, Any?> {
    val facing = when (ch.get(CameraCharacteristics.LENS_FACING)) {
      CameraMetadata.LENS_FACING_FRONT -> "front"
      CameraMetadata.LENS_FACING_BACK -> "back"
      else -> "external"
    }
    val capabilities = ch.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0)
    val highSpeedSupported =
      capabilities.contains(CameraMetadata.REQUEST_AVAILABLE_CAPABILITIES_CONSTRAINED_HIGH_SPEED_VIDEO)
    val map = ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)

    // High-speed: pro záznam je potřeba pevný rozsah [fps, fps].
    val highSpeedModes = mutableListOf<Map<String, Any?>>()
    if (highSpeedSupported && map != null) {
      for (size in map.highSpeedVideoSizes) {
        val ranges = map.getHighSpeedVideoFpsRangesFor(size)
        val fixed = ranges.filter { it.lower == it.upper }.map { it.upper }
        val fpsValues = (fixed.ifEmpty { ranges.map { it.upper } }).distinct()
        for (fps in fpsValues) {
          if (fps > 30) {
            highSpeedModes.add(mapOf("width" to size.width, "height" to size.height, "fps" to fps))
          }
        }
      }
    }

    // Běžný režim: frekvence z AE rozsahů omezené maximem enkodéru pro dané rozlišení.
    val aeRanges = ch.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES) ?: emptyArray()
    val aeFps = aeRanges.map { it.upper }.distinct().sortedDescending()
    val normalModes = mutableListOf<Map<String, Any?>>()
    if (map != null) {
      val recorderSizes = map.getOutputSizes(MediaRecorder::class.java)?.toList() ?: emptyList()
      for ((w, h) in NORMAL_SIZES) {
        val size = recorderSizes.firstOrNull { it.width == w && it.height == h } ?: continue
        val minFrameNs = map.getOutputMinFrameDuration(MediaRecorder::class.java, size)
        val sizeMaxFps = if (minFrameNs > 0) (1_000_000_000L / minFrameNs).toInt() else Int.MAX_VALUE
        for (fps in aeFps) {
          if (fps <= sizeMaxFps + 1) {
            normalModes.add(mapOf("width" to w, "height" to h, "fps" to fps))
          }
        }
      }
    }

    val evRange = ch.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE)
    val evStep = ch.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_STEP)
    val hardwareLevel = when (ch.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)) {
      CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY -> "legacy"
      CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED -> "limited"
      CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_FULL -> "full"
      CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_3 -> "level3"
      CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_EXTERNAL -> "external"
      else -> "unknown"
    }

    return mapOf(
      "id" to id,
      "facing" to facing,
      "hardwareLevel" to hardwareLevel,
      "highSpeedSupported" to highSpeedSupported,
      "highSpeedModes" to highSpeedModes,
      "normalModes" to normalModes,
      "focalLengths" to (ch.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
        ?.map { it.toDouble() } ?: emptyList<Double>()),
      "flashAvailable" to (ch.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true),
      "sensorOrientation" to (ch.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0),
      "evMin" to (evRange?.lower ?: 0),
      "evMax" to (evRange?.upper ?: 0),
      "evStep" to (evStep?.toDouble() ?: 0.0)
    )
  }
}
