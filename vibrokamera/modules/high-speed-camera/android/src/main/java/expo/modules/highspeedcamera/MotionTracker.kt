package expo.modules.highspeedcamera

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Sleduje posun zvolené oblasti (značky na stroji) ve videu snímek po snímku.
 *
 * Video se dekóduje přes MediaCodec do YUV a pracuje se jen s jasovou složkou (Y).
 * Vzor (template) je oblast z prvního snímku; v každém dalším snímku se hledá
 * nejlepší shoda v okolí předchozí polohy (SAD s odečtením průměrného jasu –
 * odolné vůči blikání osvětlení). Subpixelová přesnost parabolickou interpolací.
 *
 * Posuny jsou vždy vůči prvnímu snímku a v souřadnicích zobrazeného (otočeného)
 * videa, v pixelech.
 */
class MotionTracker(
  private val path: String,
  /** Střed oblasti, normalizovaně 0..1 v zobrazeném videu. */
  private val centerX: Double,
  private val centerY: Double,
  /** Velikost oblasti jako podíl kratší strany zobrazeného videa. */
  private val roiSize: Double,
  /** Max. hledaný posun mezi dvěma snímky v px. */
  private val searchRadius: Int,
  private val startMs: Double,
  private val durationMs: Double,
  private val cancelled: AtomicBoolean,
  private val onProgress: (Double) -> Unit
) {
  data class Result(
    val timesMs: List<Double>,
    val dx: List<Double>,
    val dy: List<Double>,
    val score: List<Double>,
    val displayWidth: Int,
    val displayHeight: Int,
    val roiPx: Int
  )

  fun run(): Result {
    val rotation = readRotation()
    val extractor = MediaExtractor()
    extractor.setDataSource(path)
    val trackIndex = (0 until extractor.trackCount).firstOrNull {
      extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("video/") == true
    } ?: throw IllegalStateException("Video neobsahuje obrazovou stopu")
    extractor.selectTrack(trackIndex)
    val format = extractor.getTrackFormat(trackIndex)
    val mime = format.getString(MediaFormat.KEY_MIME)!!
    format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible)

    val codec = MediaCodec.createDecoderByType(mime)
    codec.configure(format, null, null, 0)
    codec.start()

    val startUs = (startMs * 1000).toLong()
    val endUs = if (durationMs > 0) startUs + (durationMs * 1000).toLong() else Long.MAX_VALUE
    if (startUs > 0) extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

    val times = ArrayList<Double>()
    val dxs = ArrayList<Double>()
    val dys = ArrayList<Double>()
    val scores = ArrayList<Double>()

    var template: IntArray? = null
    var templateMean = 0.0
    var roi = 0
    var originX = 0 // levý horní roh vzoru v kódovaném snímku (první snímek)
    var originY = 0
    var posX = 0.0 // aktuální posun vůči originX/Y (kódované souřadnice)
    var posY = 0.0
    var displayW = 0
    var displayH = 0

    val info = MediaCodec.BufferInfo()
    var inputDone = false
    var outputDone = false
    try {
      while (!outputDone) {
        if (cancelled.get()) throw InterruptedException("Analýza zrušena")
        if (!inputDone) {
          val inIndex = codec.dequeueInputBuffer(10_000)
          if (inIndex >= 0) {
            val buffer = codec.getInputBuffer(inIndex)!!
            val size = extractor.readSampleData(buffer, 0)
            val sampleTime = extractor.sampleTime
            if (size < 0 || sampleTime > endUs) {
              codec.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              inputDone = true
            } else {
              codec.queueInputBuffer(inIndex, 0, size, sampleTime, 0)
              extractor.advance()
            }
          }
        }

        val outIndex = codec.dequeueOutputBuffer(info, 10_000)
        if (outIndex < 0) continue
        val pts = info.presentationTimeUs
        if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true

        if (pts in startUs..endUs) {
          val image = codec.getOutputImage(outIndex)
          if (image != null) {
            val crop = image.cropRect
            val frameW = crop.width()
            val frameH = crop.height()
            val plane = image.planes[0]
            val buf = plane.buffer
            val rowStride = plane.rowStride
            val pixelStride = plane.pixelStride
            val offX = crop.left
            val offY = crop.top
            fun luma(x: Int, y: Int): Int =
              buf.get((y + offY) * rowStride + (x + offX) * pixelStride).toInt() and 0xFF

            if (template == null) {
              // První snímek: připravit vzor.
              val rotated = rotation == 90 || rotation == 270
              displayW = if (rotated) frameH else frameW
              displayH = if (rotated) frameW else frameH
              val (ex, ey) = displayToEncoded(centerX, centerY, rotation)
              roi = max(12, (min(displayW, displayH) * roiSize).roundToInt())
              roi = min(roi, min(frameW, frameH) - 2 * searchRadius - 4)
              originX = (ex * frameW - roi / 2.0).roundToInt().coerceIn(searchRadius + 1, frameW - roi - searchRadius - 2)
              originY = (ey * frameH - roi / 2.0).roundToInt().coerceIn(searchRadius + 1, frameH - roi - searchRadius - 2)
              val t = IntArray(roi * roi)
              var sum = 0L
              for (j in 0 until roi) for (i in 0 until roi) {
                val v = luma(originX + i, originY + j)
                t[j * roi + i] = v
                sum += v
              }
              template = t
              templateMean = sum.toDouble() / t.size
              times.add(pts / 1000.0)
              dxs.add(0.0)
              dys.add(0.0)
              scores.add(0.0)
            } else {
              val (mx, my, score) = match(template, templateMean, roi, originX, originY, posX, posY, frameW, frameH) { x, y -> luma(x, y) }
              posX = mx
              posY = my
              val (ddx, ddy) = encodedDeltaToDisplay(mx, my, rotation)
              times.add(pts / 1000.0)
              dxs.add(ddx)
              dys.add(ddy)
              scores.add(score)
            }
            image.close()

            if (times.size % 30 == 0) {
              val total = if (durationMs > 0) durationMs else 1.0
              onProgress(((pts / 1000.0 - startMs) / total).coerceIn(0.0, 1.0))
            }
          }
        }
        codec.releaseOutputBuffer(outIndex, false)
      }
    } finally {
      try {
        codec.stop()
      } catch (_: Exception) {
      }
      codec.release()
      extractor.release()
    }

    if (times.size < 4) throw IllegalStateException("Ve zvoleném úseku je příliš málo snímků")
    // Čas od začátku úseku.
    val t0 = times.first()
    return Result(times.map { it - t0 }, dxs, dys, scores, displayW, displayH, roi)
  }

  /** Nejlepší shoda vzoru v okolí (prevX, prevY). Vrací posun vůči originX/Y a průměrnou chybu. */
  private fun match(
    template: IntArray,
    templateMean: Double,
    roi: Int,
    originX: Int,
    originY: Int,
    prevX: Double,
    prevY: Double,
    frameW: Int,
    frameH: Int,
    luma: (Int, Int) -> Int
  ): Triple<Double, Double, Double> {
    val r = searchRadius
    val cx = prevX.roundToInt()
    val cy = prevY.roundToInt()
    // Oblast hledání v pixelech (s okrajem pro vzor).
    val x0 = (originX + cx - r).coerceIn(0, frameW - roi - 1)
    val y0 = (originY + cy - r).coerceIn(0, frameH - roi - 1)
    val x1 = (originX + cx + r).coerceIn(0, frameW - roi - 1)
    val y1 = (originY + cy + r).coerceIn(0, frameH - roi - 1)
    val areaW = x1 - x0 + roi
    val areaH = y1 - y0 + roi
    val area = IntArray(areaW * areaH)
    for (j in 0 until areaH) for (i in 0 until areaW) area[j * areaW + i] = luma(x0 + i, y0 + j)

    // Integrální obraz pro rychlý průměr každé kandidátní oblasti.
    val integral = LongArray((areaW + 1) * (areaH + 1))
    for (j in 0 until areaH) {
      var rowSum = 0L
      for (i in 0 until areaW) {
        rowSum += area[j * areaW + i]
        integral[(j + 1) * (areaW + 1) + (i + 1)] = integral[j * (areaW + 1) + (i + 1)] + rowSum
      }
    }
    val n = (roi * roi).toDouble()

    val candW = x1 - x0 + 1
    val candH = y1 - y0 + 1
    var best = Double.MAX_VALUE
    var bestI = 0
    var bestJ = 0
    for (cj in 0 until candH) for (ci in 0 until candW) {
      val s = integral[(cj + roi) * (areaW + 1) + (ci + roi)] - integral[cj * (areaW + 1) + (ci + roi)] -
        integral[(cj + roi) * (areaW + 1) + ci] + integral[cj * (areaW + 1) + ci]
      val offset = s / n - templateMean
      var cost = 0.0
      for (j in 0 until roi) {
        val rowA = (cj + j) * areaW + ci
        val rowT = j * roi
        for (i in 0 until roi) cost += abs(area[rowA + i] - template[rowT + i] - offset)
        if (cost >= best) break
      }
      if (cost < best) {
        best = cost
        bestI = ci
        bestJ = cj
      }
    }

    // Subpixelové zpřesnění (parabola přes sousedy), jen pokud sousedé existují a byli spočteni celí.
    fun refine(c: Double, minus: Double, plus: Double): Double {
      val denom = minus - 2 * c + plus
      return if (denom > 1e-9) ((minus - plus) / (2 * denom)).coerceIn(-0.5, 0.5) else 0.0
    }
    fun fullCost(ci: Int, cj: Int): Double {
      val s = integral[(cj + roi) * (areaW + 1) + (ci + roi)] - integral[cj * (areaW + 1) + (ci + roi)] -
        integral[(cj + roi) * (areaW + 1) + ci] + integral[cj * (areaW + 1) + ci]
      val offset = s / n - templateMean
      var cost = 0.0
      for (j in 0 until roi) {
        val rowA = (cj + j) * areaW + ci
        val rowT = j * roi
        for (i in 0 until roi) cost += abs(area[rowA + i] - template[rowT + i] - offset)
      }
      return cost
    }
    var subX = 0.0
    var subY = 0.0
    if (bestI in 1 until candW - 1) subX = refine(best, fullCost(bestI - 1, bestJ), fullCost(bestI + 1, bestJ))
    if (bestJ in 1 until candH - 1) subY = refine(best, fullCost(bestI, bestJ - 1), fullCost(bestI, bestJ + 1))

    val mx = (x0 + bestI - originX) + subX
    val my = (y0 + bestJ - originY) + subY
    return Triple(mx, my, best / n)
  }

  private fun readRotation(): Int {
    val retriever = MediaMetadataRetriever()
    return try {
      retriever.setDataSource(path)
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
    } catch (_: Exception) {
      0
    } finally {
      try {
        retriever.release()
      } catch (_: Exception) {
      }
    }
  }

  companion object {
    /** Normalizované souřadnice zobrazeného videa → kódovaný snímek (otočení po směru hodin). */
    fun displayToEncoded(xd: Double, yd: Double, rotation: Int): Pair<Double, Double> = when (rotation) {
      90 -> yd to 1 - xd
      180 -> 1 - xd to 1 - yd
      270 -> 1 - yd to xd
      else -> xd to yd
    }

    /** Posun v kódovaném snímku → posun v zobrazeném videu. */
    fun encodedDeltaToDisplay(dxe: Double, dye: Double, rotation: Int): Pair<Double, Double> = when (rotation) {
      90 -> -dye to dxe
      180 -> -dxe to -dye
      270 -> dye to -dxe
      else -> dxe to dye
    }
  }
}
