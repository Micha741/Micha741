package expo.modules.highspeedcamera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraConstrainedHighSpeedCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.media.MediaCodec
import android.media.MediaCodecList
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.util.Range
import android.view.OrientationEventListener
import android.view.Surface
import android.view.TextureView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Collections
import java.util.Date
import java.util.Locale
import java.util.WeakHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Parametry, jejichž změna vyžaduje znovuotevření kamery. */
private data class CameraConfig(
  val cameraId: String,
  val width: Int,
  val height: Int,
  val fps: Int,
  val highSpeed: Boolean,
  val bitRate: Int
)

/** Parametry, které stačí změnit v opakovaném požadavku (bez restartu session). */
private data class CaptureSettings(
  val torch: Boolean,
  val exposureCompensation: Int,
  val aeLock: Boolean
)

/**
 * Náhled + záznam videa přes Camera2. V režimu `highSpeed` používá
 * CameraConstrainedHighSpeedCaptureSession (120/240/480 fps podle telefonu),
 * jinak běžnou session s nejvyšší podporovanou snímkovou frekvencí.
 *
 * Veškerá práce s kamerou běží na vlastním vlákně (cameraHandler).
 */
@SuppressLint("ViewConstructor")
class HighSpeedCameraView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext), TextureView.SurfaceTextureListener {

  private val onCameraReady by EventDispatcher()
  private val onCameraError by EventDispatcher()
  private val onRecordingFinished by EventDispatcher()

  // --- props (nastavované z UI vlákna) ---
  var cameraId: String? = null
  var videoWidth: Int = 1280
  var videoHeight: Int = 720
  var fps: Int = 30
  var highSpeed: Boolean = false
  var torch: Boolean = false
  var exposureCompensation: Int = 0
  var aeLock: Boolean = false
  var bitRate: Int = 0
  /** Max. délka záznamu (ochrana proti přehřátí a zaplnění úložiště). */
  var maxDurationMs: Int = 60_000

  private val textureView = TextureView(context)
  private var cameraThread: HandlerThread? = null
  private var cameraHandler: Handler? = null

  // --- stav kamery (jen na vlákně kamery) ---
  private var desiredConfig: CameraConfig? = null
  private var desiredSettings = CaptureSettings(false, 0, false)
  private var appliedConfig: CameraConfig? = null
  private var characteristics: CameraCharacteristics? = null
  private var device: CameraDevice? = null
  private var session: CameraCaptureSession? = null
  private var previewSurface: Surface? = null
  private var recorderSurface: Surface? = null
  private var recorder: MediaRecorder? = null
  private var recordingFile: File? = null
  private var recordingConfig: CameraConfig? = null
  private var recordingStartedAt = 0L
  private var hostPaused = false
  private var generation = 0

  @Volatile
  private var deviceOrientation = 0

  private val orientationListener = object : OrientationEventListener(context) {
    override fun onOrientationChanged(orientation: Int) {
      if (orientation != ORIENTATION_UNKNOWN) {
        deviceOrientation = ((orientation + 45) / 90 * 90) % 360
      }
    }
  }

  init {
    textureView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    textureView.surfaceTextureListener = this
    addView(textureView)
    liveViews.add(this)
  }

  // ---------------------------------------------------------------------------
  // Životní cyklus
  // ---------------------------------------------------------------------------

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (orientationListener.canDetectOrientation()) {
      orientationListener.enable()
    }
  }

  override fun onDetachedFromWindow() {
    orientationListener.disable()
    super.onDetachedFromWindow()
  }

  fun applyProps() {
    val id = cameraId
    val config = if (id == null) null else CameraConfig(id, videoWidth, videoHeight, fps, highSpeed, bitRate)
    val settings = CaptureSettings(torch, exposureCompensation, aeLock)
    onCamera {
      desiredSettings = settings
      if (recorder != null) {
        // Během nahrávání neměníme konfiguraci, jen expozici/svítilnu.
        updateRepeatingRequest()
        return@onCamera
      }
      if (config != desiredConfig || device == null) {
        desiredConfig = config
        reopenCamera()
      } else {
        updateRepeatingRequest()
      }
    }
  }

  fun onHostPause() {
    onCamera {
      hostPaused = true
      closeCamera()
    }
  }

  fun onHostResume() {
    onCamera {
      if (hostPaused) {
        hostPaused = false
        reopenCamera()
      }
    }
  }

  fun release() {
    liveViews.remove(this)
    orientationListener.disable()
    val handler = cameraHandler ?: return
    handler.post { closeCamera() }
    cameraThread?.quitSafely()
    cameraThread = null
    cameraHandler = null
  }

  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    onCamera { reopenCamera() }
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) = Unit

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    // Kameru musíme zavřít dřív, než TextureView uvolní svůj buffer.
    val handler = cameraHandler
    if (handler != null) {
      val latch = CountDownLatch(1)
      handler.post {
        closeCamera()
        latch.countDown()
      }
      latch.await(1, TimeUnit.SECONDS)
    }
    return true
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit

  // ---------------------------------------------------------------------------
  // Záznam
  // ---------------------------------------------------------------------------

  fun startRecording(promise: Promise) {
    onCamera {
      val config = appliedConfig
      val surface = recorderSurface
      if (session == null || config == null || surface == null) {
        promise.reject("E_NOT_READY", "Kamera není připravená", null)
        return@onCamera
      }
      if (recorder != null) {
        promise.reject("E_ALREADY_RECORDING", "Záznam už běží", null)
        return@onCamera
      }
      var newRecorder: MediaRecorder? = null
      try {
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val file = File(
          Recordings.directory(context),
          "VIB_${stamp}_${config.fps}fps_${config.width}x${config.height}.mp4"
        )
        newRecorder = buildRecorder(surface, config, file, orientationHint())
        applyLimits(newRecorder, file)
        newRecorder.prepare()
        newRecorder.start()
        recorder = newRecorder
        recordingFile = file
        recordingConfig = config
        recordingStartedAt = SystemClock.elapsedRealtime()
        promise.resolve(file.absolutePath)
      } catch (e: Exception) {
        newRecorder?.release()
        promise.reject("E_RECORD_START", "Záznam se nepodařilo spustit: ${e.message}", e)
      }
    }
  }

  fun stopRecording(promise: Promise) {
    onCamera {
      if (recorder == null) {
        promise.reject("E_NOT_RECORDING", "Záznam neběží", null)
        return@onCamera
      }
      val result = finishRecording()
      if (result == null) {
        promise.reject("E_RECORD_STOP", "Záznam se nepodařilo uložit (byl příliš krátký?)", null)
      } else {
        promise.resolve(result)
      }
    }
  }

  /** Limity délky a velikosti + reakce na chyby enkodéru. */
  private fun applyLimits(r: MediaRecorder, file: File) {
    if (maxDurationMs > 0) r.setMaxDuration(maxDurationMs)
    val free = file.parentFile?.usableSpace ?: 0L
    val maxBytes = (free - 300L * 1024 * 1024).coerceAtMost(3_900_000_000L)
    if (maxBytes < 50L * 1024 * 1024) throw IOException("Málo volného místa v úložišti")
    r.setMaxFileSize(maxBytes)
    r.setOnInfoListener { _, what, _ ->
      val reason = when (what) {
        MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED -> "maxDuration"
        MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED -> "maxFileSize"
        else -> null
      }
      if (reason != null) onCamera { if (recorder === r) finishRecording(reason) }
    }
    r.setOnErrorListener { _, what, extra ->
      onCamera {
        if (recorder === r) {
          finishRecording("error")
          emitError("Chyba enkodéru při záznamu ($what/$extra)", "RECORDER")
        }
      }
    }
  }

  private fun finishRecording(reason: String? = null): Map<String, Any>? {
    val r = recorder ?: return null
    val file = recordingFile
    val config = recordingConfig
    recorder = null
    recordingFile = null
    recordingConfig = null

    var ok = true
    try {
      r.stop()
    } catch (e: RuntimeException) {
      // stop() hází, pokud nebyl zapsán žádný snímek – nebo když se záznam
      // už sám ukončil po dosažení limitu (pak je soubor v pořádku).
      ok = reason != null && file != null && file.length() > 64 * 1024
    }
    r.release()

    if (!ok || file == null || config == null) {
      file?.delete()
      emitError("Záznam se nepodařilo uložit (byl příliš krátký?)", "RECORDER")
      return null
    }

    // Základní údaje + metadata ze souboru (skutečný počet snímků, délka, rotace).
    val result = buildMap<String, Any> {
      put("path", file.absolutePath)
      put("uri", Uri.fromFile(file).toString())
      put("name", file.name)
      put("durationMs", (SystemClock.elapsedRealtime() - recordingStartedAt).toDouble())
      put("width", config.width)
      put("height", config.height)
      put("sizeBytes", file.length().toDouble())
      put("modified", file.lastModified().toDouble())
      Recordings.describe(file).forEach { (key, value) -> if (value != null) put(key, value) }
      put("fps", config.fps)
      put("highSpeed", config.highSpeed)
      put("stoppedReason", reason ?: "user")
    }
    post { onRecordingFinished(result) }
    return result
  }

  // ---------------------------------------------------------------------------
  // Kamera
  // ---------------------------------------------------------------------------

  private fun onCamera(block: () -> Unit) {
    if (cameraHandler == null) {
      val thread = HandlerThread("HighSpeedCamera").also { it.start() }
      cameraThread = thread
      cameraHandler = Handler(thread.looper)
    }
    cameraHandler?.post(block)
  }

  @SuppressLint("MissingPermission")
  private fun reopenCamera() {
    closeCamera()
    val config = desiredConfig ?: return
    if (hostPaused || !textureView.isAvailable) return
    val surfaceTexture = textureView.surfaceTexture ?: return
    val handler = cameraHandler ?: return
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

    try {
      characteristics = manager.getCameraCharacteristics(config.cameraId)
      surfaceTexture.setDefaultBufferSize(config.width, config.height)
      previewSurface = Surface(surfaceTexture)
      recorderSurface = try {
        createRecorderSurface(config)
      } catch (e: Exception) {
        // Enkodér nezvládá toto rozlišení/fps – režim na tomto telefonu nefunguje.
        previewSurface?.release()
        previewSurface = null
        appliedConfig = null
        emitError("Enkodér nepodporuje ${config.width}×${config.height} @ ${config.fps} fps", "CONFIG")
        return
      }
      appliedConfig = config

      val gen = ++generation
      manager.openCamera(config.cameraId, object : CameraDevice.StateCallback() {
        override fun onOpened(camera: CameraDevice) {
          if (gen != generation) {
            camera.close()
            return
          }
          device = camera
          createSession(camera, config, gen)
        }

        override fun onDisconnected(camera: CameraDevice) {
          camera.close()
          if (gen == generation) {
            device = null
            if (!hostPaused) emitError("Kamera byla odpojena – používá ji jiná aplikace?", "DISCONNECTED")
          }
        }

        override fun onError(camera: CameraDevice, error: Int) {
          camera.close()
          if (gen == generation) {
            device = null
            emitError("Chyba kamery (kód $error)", "DEVICE")
          }
        }
      }, handler)
    } catch (e: SecurityException) {
      emitError("Aplikace nemá oprávnění ke kameře", "PERMISSION")
    } catch (e: Exception) {
      emitError("Kameru se nepodařilo otevřít: ${e.message}", "OPEN")
    }
  }

  @Suppress("DEPRECATION")
  private fun createSession(camera: CameraDevice, config: CameraConfig, gen: Int) {
    val preview = previewSurface ?: return
    val recording = recorderSurface ?: return
    val targets = listOf(preview, recording)
    val callback = object : CameraCaptureSession.StateCallback() {
      override fun onConfigured(s: CameraCaptureSession) {
        if (gen != generation) {
          s.close()
          return
        }
        session = s
        updateRepeatingRequest()
        val event = mapOf(
          "cameraId" to config.cameraId,
          "width" to config.width,
          "height" to config.height,
          "fps" to config.fps,
          "highSpeed" to config.highSpeed
        )
        post { onCameraReady(event) }
      }

      override fun onConfigureFailed(s: CameraCaptureSession) {
        if (gen == generation) {
          emitError("Kamera odmítla režim ${config.width}×${config.height} @ ${config.fps} fps", "CONFIG")
        }
      }
    }
    val handler = cameraHandler ?: return
    try {
      if (config.highSpeed) {
        camera.createConstrainedHighSpeedCaptureSession(targets, callback, handler)
      } else {
        camera.createCaptureSession(targets, callback, handler)
      }
    } catch (e: Exception) {
      emitError("Nepodařilo se vytvořit session kamery: ${e.message}", "CONFIG")
    }
  }

  private fun updateRepeatingRequest() {
    val camera = device ?: return
    val s = session ?: return
    val config = appliedConfig ?: return
    val preview = previewSurface ?: return
    val recording = recorderSurface ?: return
    val settings = desiredSettings
    val chars = characteristics

    try {
      val builder = camera.createCaptureRequest(CameraDevice.TEMPLATE_RECORD)
      builder.addTarget(preview)
      builder.addTarget(recording)
      builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
      builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
      builder.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, fpsRangeFor(config))

      val afModes = chars?.get(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES)
      if (afModes?.contains(CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO) == true) {
        builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)
      }

      val evRange = chars?.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE)
      val ev = evRange?.clamp(settings.exposureCompensation) ?: 0
      builder.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, ev)
      builder.set(CaptureRequest.CONTROL_AE_LOCK, settings.aeLock)

      val hasFlash = chars?.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
      if (hasFlash) {
        builder.set(
          CaptureRequest.FLASH_MODE,
          if (settings.torch) CaptureRequest.FLASH_MODE_TORCH else CaptureRequest.FLASH_MODE_OFF
        )
      }

      if (s is CameraConstrainedHighSpeedCaptureSession) {
        s.setRepeatingBurst(s.createHighSpeedRequestList(builder.build()), null, cameraHandler)
      } else {
        s.setRepeatingRequest(builder.build(), null, cameraHandler)
      }
    } catch (e: Exception) {
      emitError("Nepodařilo se nastavit kameru: ${e.message}", "CONFIG")
    }
  }

  private fun fpsRangeFor(config: CameraConfig): Range<Int> {
    if (config.highSpeed) return Range(config.fps, config.fps)
    val ranges = characteristics?.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)
      ?: return Range(config.fps, config.fps)
    // Preferujeme pevnou frekvenci (např. [60, 60]), jinak rozsah s nejvyšším minimem.
    return ranges.filter { it.upper == config.fps }.maxByOrNull { it.lower }
      ?: Range(config.fps, config.fps)
  }

  private fun closeCamera() {
    if (recorder != null) finishRecording()
    generation++
    try {
      session?.close()
    } catch (_: Exception) {
    }
    session = null
    try {
      device?.close()
    } catch (_: Exception) {
    }
    device = null
    previewSurface?.release()
    previewSurface = null
    recorderSurface?.release()
    recorderSurface = null
    appliedConfig = null
  }

  /**
   * Persistentní vstupní surface pro MediaRecorder: session kamery ji může mít
   * jako cíl od začátku, takže záznam startuje okamžitě bez rekonfigurace.
   * Jednorázové prepare() s dočasným souborem nastaví velikost bufferů.
   */
  private fun createRecorderSurface(config: CameraConfig): Surface {
    val surface = MediaCodec.createPersistentInputSurface()
    val dummy = File(context.cacheDir, "hs_dummy.mp4")
    val r = buildRecorder(surface, config, dummy, 0)
    try {
      r.prepare()
    } finally {
      r.release()
      dummy.delete()
    }
    return surface
  }

  private fun buildRecorder(surface: Surface, config: CameraConfig, file: File, orientation: Int): MediaRecorder {
    val r = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaRecorder(context)
    } else {
      @Suppress("DEPRECATION")
      MediaRecorder()
    }
    r.setVideoSource(MediaRecorder.VideoSource.SURFACE)
    r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    r.setOutputFile(file.absolutePath)
    val wanted = if (config.bitRate > 0) config.bitRate else defaultBitRate(config)
    r.setVideoEncodingBitRate(maxEncoderBitRate?.let { wanted.coerceAtMost(it) } ?: wanted)
    r.setVideoFrameRate(config.fps)
    r.setVideoSize(config.width, config.height)
    r.setVideoEncoder(MediaRecorder.VideoEncoder.H264)
    r.setInputSurface(surface)
    r.setOrientationHint(orientation)
    return r
  }

  private fun defaultBitRate(config: CameraConfig): Int {
    // ~0,1 bitu na pixel a snímek, omezeno na 10–100 Mbit/s.
    val bits = config.width.toLong() * config.height * config.fps / 10
    return bits.coerceIn(10_000_000L, 100_000_000L).toInt()
  }

  private fun orientationHint(): Int {
    val chars = characteristics ?: return 0
    val sensor = chars.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
    val front = chars.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT
    val device = if (front) -deviceOrientation else deviceOrientation
    return (sensor + device + 360) % 360
  }

  private fun emitError(message: String, code: String = "OTHER") {
    post { onCameraError(mapOf("message" to message, "code" to code)) }
  }

  companion object {
    /** Nejvyšší datový tok H.264 enkodéru (některé telefony odmítnou vyšší a záznam selže). */
    private val maxEncoderBitRate: Int? by lazy {
      try {
        MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos
          .filter { it.isEncoder && it.supportedTypes.any { t -> t.equals("video/avc", ignoreCase = true) } }
          .mapNotNull { it.getCapabilitiesForType("video/avc").videoCapabilities?.bitrateRange?.upper }
          .maxOrNull()
      } catch (_: Exception) {
        null
      }
    }

    private val liveViews: MutableSet<HighSpeedCameraView> =
      Collections.synchronizedSet(Collections.newSetFromMap(WeakHashMap()))

    fun forEachLive(action: (HighSpeedCameraView) -> Unit) {
      val snapshot = synchronized(liveViews) { liveViews.toList() }
      snapshot.forEach(action)
    }
  }
}
