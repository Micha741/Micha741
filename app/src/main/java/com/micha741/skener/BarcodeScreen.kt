package com.micha741.skener

import android.content.Intent
import android.net.Uri
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.micha741.skener.data.BarcodeAnalyzer
import kotlinx.coroutines.delay
import java.util.concurrent.Executors
import kotlin.math.min

/**
 * Bottom-nav tab that continuously reads barcodes/QR codes from a full-
 * screen live camera feed via ML Kit (with zoom, torch and a centered
 * scan-frame guide), can also scan a picked photo one-off, and lists every
 * distinct code scanned this session in a bottom sheet with quick actions
 * (copy / open link / share).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BarcodeScreen(viewModel: BarcodeViewModel, onPickPhoto: () -> Unit) {
    val permission = rememberCameraPermissionState()
    if (!permission.granted) {
        CameraPermissionRationale(onRequestPermission = permission.requestPermission)
        return
    }

    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsState()

    val previewView = remember {
        PreviewView(context).apply { scaleType = PreviewView.ScaleType.FILL_CENTER }
    }
    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var torchOn by remember { mutableStateOf(false) }
    var zoom by remember { mutableFloatStateOf(0f) }
    var showHistory by remember { mutableStateOf(false) }

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
                .also {
                    it.setAnalyzer(analysisExecutor, BarcodeAnalyzer { result -> viewModel.onDetected(result) })
                }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    analysis,
                )
            } catch (_: Exception) {
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            cameraProvider?.unbindAll()
            analysisExecutor.shutdown()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

        ScanFrameOverlay(uiState = uiState)

        Row(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp),
        ) {
            val hasFlash = camera?.cameraInfo?.hasFlashUnit() == true
            if (hasFlash) {
                CircleIconButton(
                    onClick = {
                        torchOn = !torchOn
                        camera?.cameraControl?.enableTorch(torchOn)
                    },
                ) {
                    Icon(
                        if (torchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
                        contentDescription = stringResource(R.string.barcode_torch),
                        tint = Color.White,
                    )
                }
            }
            BadgedBox(
                badge = {
                    if (uiState.history.isNotEmpty()) {
                        Badge { Text(uiState.history.size.toString()) }
                    }
                },
                modifier = Modifier.padding(start = if (hasFlash) 8.dp else 0.dp),
            ) {
                CircleIconButton(onClick = { showHistory = true }) {
                    Icon(
                        Icons.Default.History,
                        contentDescription = stringResource(R.string.barcode_history_title),
                        tint = Color.White,
                    )
                }
            }
        }

        CircleIconButton(
            onClick = onPickPhoto,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp),
        ) {
            if (uiState.isScanningPhoto) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            } else {
                Icon(
                    Icons.Default.PhotoLibrary,
                    contentDescription = stringResource(R.string.barcode_scan_from_photo),
                    tint = Color.White,
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp, start = 24.dp, end = 24.dp),
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

        var lastBannerCode by remember { mutableStateOf<ScannedCode?>(null) }
        LaunchedEffect(uiState.history.firstOrNull()?.timestamp) {
            val latest = uiState.history.firstOrNull() ?: return@LaunchedEffect
            lastBannerCode = latest
            delay(2500)
            if (lastBannerCode == latest) lastBannerCode = null
        }
        lastBannerCode?.let { code ->
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 24.dp, start = 64.dp, end = 64.dp),
            ) {
                Text(
                    text = code.value,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }

        uiState.photoScanMessage?.let { message ->
            LaunchedEffect(message) {
                delay(2500)
                viewModel.consumePhotoScanMessage()
            }
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 24.dp, start = 32.dp, end = 32.dp),
            ) {
                Text(
                    text = message,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }
    }

    if (showHistory) {
        val sheetState = rememberModalBottomSheetState()
        ModalBottomSheet(onDismissRequest = { showHistory = false }, sheetState = sheetState) {
            BarcodeHistorySheetContent(history = uiState.history)
        }
    }
}

@Composable
private fun ScanFrameOverlay(uiState: BarcodeUiState) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val frameSize = min(size.width, size.height) * 0.65f
        val frameLeft = (size.width - frameSize) / 2f
        val frameTop = (size.height - frameSize) / 2f

        val fullArea = Path().apply {
            addRect(androidx.compose.ui.geometry.Rect(Offset.Zero, size))
        }
        val hole = Path().apply {
            addRect(
                androidx.compose.ui.geometry.Rect(
                    frameLeft,
                    frameTop,
                    frameLeft + frameSize,
                    frameTop + frameSize,
                ),
            )
        }
        val dimmed = Path().apply { op(fullArea, hole, PathOperation.Difference) }
        drawPath(dimmed, color = Color.Black.copy(alpha = 0.5f))

        val bracket = frameSize * 0.08f
        val strokeWidth = 4.dp.toPx()
        val corners = listOf(
            Offset(frameLeft, frameTop) to Pair(Offset(bracket, 0f), Offset(0f, bracket)),
            Offset(frameLeft + frameSize, frameTop) to Pair(Offset(-bracket, 0f), Offset(0f, bracket)),
            Offset(frameLeft, frameTop + frameSize) to Pair(Offset(bracket, 0f), Offset(0f, -bracket)),
            Offset(frameLeft + frameSize, frameTop + frameSize) to Pair(Offset(-bracket, 0f), Offset(0f, -bracket)),
        )
        corners.forEach { (corner, arms) ->
            drawLine(Color.White, corner, corner + arms.first, strokeWidth)
            drawLine(Color.White, corner, corner + arms.second, strokeWidth)
        }

        if (uiState.frameWidth != 0 && uiState.frameHeight != 0) {
            val scale = kotlin.math.max(size.width / uiState.frameWidth, size.height / uiState.frameHeight)
            val offsetX = (size.width - uiState.frameWidth * scale) / 2f
            val offsetY = (size.height - uiState.frameHeight * scale) / 2f
            uiState.liveBoxes.forEach { box ->
                drawRect(
                    color = Color(0xFF62B6CB),
                    topLeft = Offset(offsetX + box.left * scale, offsetY + box.top * scale),
                    size = Size(box.width() * scale, box.height() * scale),
                    style = Stroke(width = 4f),
                )
            }
        }
    }
}

@Composable
private fun CircleIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    IconButton(onClick = onClick, modifier = modifier) {
        Surface(color = Color.Black.copy(alpha = 0.4f), shape = CircleShape) {
            Box(modifier = Modifier.padding(8.dp)) { content() }
        }
    }
}

@Composable
private fun BarcodeHistorySheetContent(history: List<ScannedCode>) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Text(
            text = stringResource(R.string.barcode_history_title),
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        if (history.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(
                    Icons.Default.QrCodeScanner,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
                Text(
                    text = stringResource(R.string.barcode_empty_hint),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
            ) {
                items(history, key = { it.timestamp }) { code ->
                    BarcodeHistoryItem(code)
                }
            }
        }
    }
}

@Composable
private fun BarcodeHistoryItem(code: ScannedCode) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val isUrl = code.value.startsWith("http://", ignoreCase = true) ||
        code.value.startsWith("https://", ignoreCase = true)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = code.format,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = code.value,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 2.dp),
            )
            Row(modifier = Modifier.padding(top = 4.dp)) {
                IconButton(onClick = { clipboardManager.setText(AnnotatedString(code.value)) }) {
                    Icon(Icons.Default.ContentCopy, contentDescription = stringResource(R.string.barcode_copy))
                }
                if (isUrl) {
                    IconButton(onClick = {
                        runCatching {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(code.value)))
                        }
                    }) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = stringResource(R.string.barcode_open))
                    }
                }
                IconButton(onClick = {
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, code.value)
                    }
                    context.startActivity(Intent.createChooser(intent, context.getString(R.string.share)))
                }) {
                    Icon(Icons.Default.Share, contentDescription = stringResource(R.string.share))
                }
            }
        }
    }
}
