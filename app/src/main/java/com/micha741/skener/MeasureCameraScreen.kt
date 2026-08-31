@file:OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)

package com.micha741.skener

import android.hardware.camera2.CameraCharacteristics
import android.net.Uri
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.delay

/**
 * Full-screen live camera viewfinder for the "Měřit" tab's "Vyfotit" button -
 * plain CameraX preview + shutter, no live analysis overlay (unlike
 * [LiveCameraScreen]'s piece-counting one): a calibration pair and every
 * measurement pair are tapped on the *captured* photo in [MeasureScreen]
 * itself, not picked live. Exists at all only because this app first tried
 * a plain [android.provider.MediaStore.ACTION_IMAGE_CAPTURE] intent (the
 * system camera app) for this button, and hit a real device where that
 * stock camera app refuses to even launch unless the *calling* app already
 * holds runtime CAMERA permission - not the norm for that intent, which
 * usually delegates the permission entirely to the camera app itself, but
 * real on that device. Going through the app's own camera - the same
 * permission flow [LiveCameraScreen] already uses - sidesteps that outright.
 */
@Composable
fun MeasureCameraScreen(
    onPhotoCaptured: (Uri) -> Unit,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val permission = rememberCameraPermissionState()
    if (!permission.granted) {
        CameraPermissionRationale(onRequestPermission = permission.requestPermission, onClose = onClose)
        return
    }

    var captureError by remember { mutableStateOf<String?>(null) }
    var isCapturing by remember { mutableStateOf(false) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var zoom by remember { mutableFloatStateOf(0f) }

    val previewView = remember {
        PreviewView(context).apply { scaleType = PreviewView.ScaleType.FILL_CENTER }
    }
    val imageCapture = remember { ImageCapture.Builder().build() }

    DisposableEffect(lifecycleOwner) {
        var cameraProvider: ProcessCameraProvider? = null
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val provider = future.get()
            cameraProvider = provider

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(
                    lifecycleOwner,
                    widestBackCameraSelector(provider),
                    preview,
                    imageCapture,
                )
            } catch (e: Exception) {
                captureError = e.message
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose { cameraProvider?.unbindAll() }
    }

    LaunchedEffect(captureError) {
        if (captureError != null) {
            delay(3000)
            captureError = null
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

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

        captureError?.let { message ->
            Surface(
                color = Color.Black.copy(alpha = 0.6f),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 180.dp, start = 16.dp, end = 16.dp),
            ) {
                Text(text = message, color = Color.White, modifier = Modifier.padding(12.dp))
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
                            filePrefix = "measure",
                            fallbackErrorMessage = context.getString(R.string.measure_failed),
                            onSuccess = { uri ->
                                isCapturing = false
                                onPhotoCaptured(uri)
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

/**
 * Picks the widest-angle back camera the device exposes (e.g. the ultra-wide lens on phones
 * that expose it as its own camera ID), instead of always [CameraSelector.DEFAULT_BACK_CAMERA]
 * (the main lens). Wider field of view means less need to step back from what's being measured
 * to fit the whole thing in frame - useful for measuring larger objects/distances up close.
 *
 * Heuristic: among the back-facing cameras CameraX enumerates, pick the one with the smallest
 * reported minimum focal length - a much shorter focal length than the phone's main camera is
 * how an ultra-wide module identifies itself; a telephoto module has a much longer one instead.
 * Not every phone exposes its extra lenses as separate CameraX camera IDs (some only expose a
 * single logical camera that switches internally), in which case this just falls back to the
 * single available back camera - same as [CameraSelector.DEFAULT_BACK_CAMERA].
 */
private fun widestBackCameraSelector(cameraProvider: ProcessCameraProvider): CameraSelector {
    val backCameras = try {
        cameraProvider.availableCameraInfos.filter { CameraSelector.LENS_FACING_BACK == it.lensFacing }
    } catch (e: Exception) {
        emptyList()
    }
    if (backCameras.size <= 1) return CameraSelector.DEFAULT_BACK_CAMERA

    val widest = backCameras.minByOrNull { info -> minFocalLengthOrMax(info) }
        ?: return CameraSelector.DEFAULT_BACK_CAMERA

    return CameraSelector.Builder()
        .requireLensFacing(CameraSelector.LENS_FACING_BACK)
        .addCameraFilter { infos -> infos.filter { it == widest }.toMutableList() }
        .build()
}

private fun minFocalLengthOrMax(info: CameraInfo): Float = try {
    Camera2CameraInfo.from(info)
        .getCameraCharacteristic(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
        ?.minOrNull() ?: Float.MAX_VALUE
} catch (e: Exception) {
    Float.MAX_VALUE
}
