package com.micha741.skener

import android.content.Context
import android.graphics.RectF
import android.net.Uri
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.micha741.skener.data.LiveFrameAnalyzer
import com.micha741.skener.data.LiveFrameResult
import kotlinx.coroutines.delay
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Full-screen live camera viewfinder for piece counting. Shows the phone's
 * built-in camera preview with a real-time overlay (the same bundled
 * FastSAM-s model the static-photo counter uses - see [LiveFrameAnalyzer])
 * and a continuously updating count, zoom, an optional reference piece
 * (tap a box to count only similar ones), and an optional region of
 * interest (drag a rectangle to discard everything outside it - see
 * [LiveFrameAnalyzer.setRoi]). The two compose in either order: selecting
 * a region first and then tapping a reference within it works exactly
 * like it does the other way around, since [LiveFrameAnalyzer] resolves a
 * reference tap against the already-ROI-filtered detections, not the raw
 * ones. Also takes a full-resolution photo on demand for the precise
 * final count - the shutter button passes the currently-active region of
 * interest, if any, along to [onPhotoCaptured] (fractional, see
 * [LiveFrameAnalyzer.setRoi]) so a region already dialed in here carries
 * over to the captured photo instead of forcing it to be redrawn.
 */
@Composable
fun LiveCameraScreen(
    onPhotoCaptured: (Uri, RectF?) -> Unit,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val permission = rememberCameraPermissionState()
    if (!permission.granted) {
        CameraPermissionRationale(onRequestPermission = permission.requestPermission, onClose = onClose)
        return
    }

    var liveResult by remember { mutableStateOf<LiveFrameResult?>(null) }
    var captureError by remember { mutableStateOf<String?>(null) }
    var isCapturing by remember { mutableStateOf(false) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var zoom by remember { mutableFloatStateOf(0f) }
    var isSelectingRoi by remember { mutableStateOf(false) }
    var roiBox by remember { mutableStateOf<RectF?>(null) }
    var dragStart by remember(isSelectingRoi) { mutableStateOf<Offset?>(null) }
    var dragCurrent by remember(isSelectingRoi) { mutableStateOf<Offset?>(null) }

    val previewView = remember {
        PreviewView(context).apply { scaleType = PreviewView.ScaleType.FILL_CENTER }
    }
    val imageCapture = remember { ImageCapture.Builder().build() }
    val analyzer = remember { LiveFrameAnalyzer(context) { result -> liveResult = result } }
    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }

    DisposableEffect(lifecycleOwner) {
        var cameraProvider: ProcessCameraProvider? = null
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val provider = future.get()
            cameraProvider = provider

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }
            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { it.setAnalyzer(analysisExecutor, analyzer) }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    analysis,
                    imageCapture,
                )
            } catch (e: Exception) {
                captureError = e.message
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            cameraProvider?.unbindAll()
            analysisExecutor.shutdown()
            // release() now closes the TFLite interpreter, unlike the old ML-Kit-based
            // analyzer's release() (which only cleared a field) - awaitTermination first
            // so a still-in-flight analyze() call on the executor's thread can't be mid
            // inference when the interpreter it's using gets closed out from under it.
            analysisExecutor.awaitTermination(1, TimeUnit.SECONDS)
            analyzer.release()
        }
    }

    LaunchedEffect(captureError) {
        if (captureError != null) {
            delay(3000)
            captureError = null
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(isSelectingRoi) {
                    if (isSelectingRoi) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                dragStart = offset
                                dragCurrent = offset
                            },
                            onDrag = { change, _ -> dragCurrent = change.position },
                            onDragEnd = {
                                val result = liveResult
                                val start = dragStart
                                val end = dragCurrent
                                if (result != null && result.frameWidth > 0 && result.frameHeight > 0 && start != null && end != null) {
                                    val boundsWidth = size.width.toFloat()
                                    val boundsHeight = size.height.toFloat()
                                    val scale = max(boundsWidth / result.frameWidth, boundsHeight / result.frameHeight)
                                    val offsetX = (boundsWidth - result.frameWidth * scale) / 2f
                                    val offsetY = (boundsHeight - result.frameHeight * scale) / 2f
                                    val left = (((min(start.x, end.x) - offsetX) / scale) / result.frameWidth).coerceIn(0f, 1f)
                                    val top = (((min(start.y, end.y) - offsetY) / scale) / result.frameHeight).coerceIn(0f, 1f)
                                    val right = (((max(start.x, end.x) - offsetX) / scale) / result.frameWidth).coerceIn(left, 1f)
                                    val bottom = (((max(start.y, end.y) - offsetY) / scale) / result.frameHeight).coerceIn(top, 1f)
                                    val rect = RectF(left, top, right, bottom)
                                    roiBox = rect
                                    analyzer.setRoi(rect)
                                }
                                dragStart = null
                                dragCurrent = null
                                isSelectingRoi = false
                            },
                        )
                    } else {
                        detectTapGestures { offset ->
                            val result = liveResult ?: return@detectTapGestures
                            if (result.frameWidth == 0 || result.frameHeight == 0) return@detectTapGestures

                            val boundsWidth = size.width.toFloat()
                            val boundsHeight = size.height.toFloat()
                            val scale = max(boundsWidth / result.frameWidth, boundsHeight / result.frameHeight)
                            val offsetX = (boundsWidth - result.frameWidth * scale) / 2f
                            val offsetY = (boundsHeight - result.frameHeight * scale) / 2f
                            val frameX = ((offset.x - offsetX) / scale).roundToInt().coerceIn(0, result.frameWidth - 1)
                            val frameY = ((offset.y - offsetY) / scale).roundToInt().coerceIn(0, result.frameHeight - 1)

                            analyzer.requestReferenceAt(frameX, frameY)
                        }
                    }
                },
        ) {
            val roiStroke = Stroke(width = 4f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 12f)))
            val dragStartNow = dragStart
            val dragCurrentNow = dragCurrent
            if (isSelectingRoi && dragStartNow != null && dragCurrentNow != null) {
                drawRect(
                    color = Color.White,
                    topLeft = Offset(min(dragStartNow.x, dragCurrentNow.x), min(dragStartNow.y, dragCurrentNow.y)),
                    size = Size(abs(dragCurrentNow.x - dragStartNow.x), abs(dragCurrentNow.y - dragStartNow.y)),
                    style = roiStroke,
                )
            }

            val result = liveResult ?: return@Canvas
            if (result.frameWidth == 0 || result.frameHeight == 0) return@Canvas

            val scale = max(size.width / result.frameWidth, size.height / result.frameHeight)
            val offsetX = (size.width - result.frameWidth * scale) / 2f
            val offsetY = (size.height - result.frameHeight * scale) / 2f

            val color = if (result.referenceActive) Color(0xFFFFB300) else Color(0xFF62B6CB)
            val strokeWidth = if (result.referenceActive) 6f else 4f
            result.blobs.forEach { blob ->
                val box = blob.box
                drawRect(
                    color = color,
                    topLeft = Offset(offsetX + box.left * scale, offsetY + box.top * scale),
                    size = Size(box.width() * scale, box.height() * scale),
                    style = Stroke(width = strokeWidth),
                )
            }

            roiBox?.let { roi ->
                drawRect(
                    color = Color.White,
                    topLeft = Offset(
                        offsetX + roi.left * result.frameWidth * scale,
                        offsetY + roi.top * result.frameHeight * scale,
                    ),
                    size = Size(
                        roi.width() * result.frameWidth * scale,
                        roi.height() * result.frameHeight * scale,
                    ),
                    style = roiStroke,
                )
            }
        }

        IconButton(
            onClick = onClose,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp),
        ) {
            Surface(color = Color.Black.copy(alpha = 0.4f), shape = CircleShape) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = stringResource(R.string.back),
                    tint = Color.White,
                    modifier = Modifier.padding(8.dp),
                )
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 24.dp),
        ) {
            val referenceActive = liveResult?.referenceActive == true
            Surface(color = Color.Black.copy(alpha = 0.5f)) {
                Text(
                    text = if (referenceActive) {
                        stringResource(R.string.live_reference_active_badge, liveResult?.count ?: 0)
                    } else {
                        stringResource(R.string.live_count_badge, liveResult?.count ?: 0)
                    },
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
            Surface(
                color = Color.Black.copy(alpha = 0.5f),
                modifier = Modifier
                    .padding(top = 8.dp)
                    .let { if (referenceActive) it.clickable { analyzer.clearReference() } else it },
            ) {
                Text(
                    text = if (referenceActive) {
                        stringResource(R.string.live_clear_reference)
                    } else {
                        stringResource(R.string.live_tap_hint)
                    },
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
            Surface(
                color = Color.Black.copy(alpha = 0.5f),
                modifier = Modifier
                    .padding(top = 8.dp)
                    .clickable {
                        if (roiBox != null) {
                            roiBox = null
                            analyzer.clearRoi()
                        } else {
                            isSelectingRoi = !isSelectingRoi
                        }
                    },
            ) {
                Text(
                    text = when {
                        roiBox != null -> stringResource(R.string.count_clear_roi)
                        isSelectingRoi -> stringResource(R.string.count_roi_selecting)
                        else -> stringResource(R.string.count_select_roi)
                    },
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }

        captureError?.let { message ->
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 180.dp, start = 16.dp, end = 16.dp),
            ) {
                Text(
                    text = message,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(12.dp),
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 120.dp, start = 24.dp, end = 24.dp),
        ) {
            Icon(Icons.Default.ZoomOut, contentDescription = null, tint = Color.White)
            Slider(
                value = zoom,
                onValueChange = { value ->
                    zoom = value
                    camera?.cameraControl?.setLinearZoom(value)
                },
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 8.dp),
            )
            Icon(Icons.Default.ZoomIn, contentDescription = null, tint = Color.White)
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            contentAlignment = Alignment.Center,
        ) {
            if (isCapturing) {
                CircularProgressIndicator(color = Color.White)
            } else {
                IconButton(
                    onClick = {
                        isCapturing = true
                        capturePhoto(
                            context = context,
                            imageCapture = imageCapture,
                            onSuccess = { uri ->
                                isCapturing = false
                                onPhotoCaptured(uri, roiBox)
                            },
                            onError = { message ->
                                isCapturing = false
                                captureError = message
                            },
                        )
                    },
                    modifier = Modifier.size(72.dp),
                ) {
                    Surface(color = Color.White, shape = CircleShape, modifier = Modifier.size(64.dp)) {}
                }
            }
        }
    }
}

private fun capturePhoto(
    context: Context,
    imageCapture: ImageCapture,
    onSuccess: (Uri) -> Unit,
    onError: (String) -> Unit,
) {
    val file = File(context.cacheDir, "counting_${System.currentTimeMillis()}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
    imageCapture.takePicture(
        outputOptions,
        ContextCompat.getMainExecutor(context),
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                onSuccess(uri)
            }

            override fun onError(exception: ImageCaptureException) {
                onError(exception.message ?: context.getString(R.string.count_failed))
            }
        },
    )
}
