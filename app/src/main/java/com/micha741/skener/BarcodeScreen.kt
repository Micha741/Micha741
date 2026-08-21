package com.micha741.skener

import android.content.Intent
import android.net.Uri
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
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
import java.util.concurrent.Executors
import kotlin.math.max

/**
 * Bottom-nav tab that continuously reads barcodes/QR codes from the live
 * camera feed via ML Kit and lists every distinct code scanned this session
 * with quick actions (copy / open link / share).
 */
@Composable
fun BarcodeScreen(viewModel: BarcodeViewModel) {
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
                provider.bindToLifecycle(
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

    Column(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.5f),
        ) {
            AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

            Canvas(modifier = Modifier.fillMaxSize()) {
                if (uiState.frameWidth == 0 || uiState.frameHeight == 0) return@Canvas
                val scale = max(size.width / uiState.frameWidth, size.height / uiState.frameHeight)
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

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(16.dp),
        ) {
            Text(
                text = stringResource(R.string.barcode_history_title),
                style = MaterialTheme.typography.titleMedium,
            )
            if (uiState.history.isEmpty()) {
                EmptyHistoryHint()
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(top = 8.dp),
                ) {
                    items(uiState.history, key = { it.timestamp }) { code ->
                        BarcodeHistoryItem(code)
                    }
                }
            }
        }
    }
}

@Composable
private fun ColumnScope.EmptyHistoryHint() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .padding(top = 8.dp),
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
