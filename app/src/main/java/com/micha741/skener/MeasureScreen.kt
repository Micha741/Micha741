package com.micha741.skener

import android.graphics.BitmapFactory
import android.graphics.PointF
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.micha741.skener.data.CalibrationPoints
import com.micha741.skener.data.MeasuredSegment
import com.micha741.skener.data.formatCm
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeasureScreen(
    viewModel: MeasureViewModel,
    onCapturePhoto: () -> Unit,
    onPickPhoto: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { message ->
            snackbarHostState.showSnackbar(message, duration = SnackbarDuration.Long)
            viewModel.consumeError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.nav_measure)) },
                navigationIcon = {
                    if (uiState.photoUri != null) {
                        IconButton(onClick = { viewModel.reset() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                        }
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            val photoUri = uiState.photoUri
            if (photoUri == null) {
                MeasureEmptyState(onCapturePhoto = onCapturePhoto, onPickPhoto = onPickPhoto)
            } else {
                MeasureResult(
                    photoUri = photoUri,
                    calibration = uiState.calibration,
                    segments = uiState.segments,
                    pendingPoint = uiState.pendingPoint,
                    onTap = { point -> viewModel.onTap(point) },
                    onRemoveSegment = { segment -> viewModel.removeSegment(segment) },
                )
                Spacer(modifier = Modifier.padding(top = 8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (uiState.isCalibrated) {
                        OutlinedButton(onClick = { viewModel.recalibrate() }) {
                            Text(stringResource(R.string.measure_recalibrate))
                        }
                    }
                    Button(onClick = { viewModel.reset() }) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Text(
                            text = stringResource(R.string.measure_new_photo),
                            modifier = Modifier.padding(start = 8.dp),
                        )
                    }
                }
            }
        }
    }

    val pendingCalibration = uiState.pendingCalibrationSegment
    if (pendingCalibration != null) {
        var lengthText by remember(pendingCalibration) { mutableStateOf("") }
        var showInvalid by remember(pendingCalibration) { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { viewModel.cancelCalibration() },
            title = { Text(stringResource(R.string.measure_calibration_dialog_title)) },
            text = {
                Column {
                    OutlinedTextField(
                        value = lengthText,
                        onValueChange = { lengthText = it; showInvalid = false },
                        placeholder = { Text(stringResource(R.string.measure_calibration_dialog_hint)) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (showInvalid) {
                        Text(
                            text = stringResource(R.string.measure_calibration_invalid),
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val cm = lengthText.replace(',', '.').toFloatOrNull()
                        if (cm == null || cm <= 0f) {
                            showInvalid = true
                        } else {
                            viewModel.confirmCalibration(cm)
                        }
                    },
                ) {
                    Text(stringResource(R.string.measure_confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.cancelCalibration() }) {
                    Text(stringResource(R.string.cancel))
                }
            },
        )
    }
}

@Composable
private fun MeasureEmptyState(onCapturePhoto: () -> Unit, onPickPhoto: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Default.Straighten,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = stringResource(R.string.measure_empty_title),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 12.dp),
            )
            Text(
                text = stringResource(R.string.measure_empty_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
            )
            Button(onClick = onCapturePhoto, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.CameraAlt, contentDescription = null)
                Text(stringResource(R.string.count_button_camera), modifier = Modifier.padding(start = 8.dp))
            }
            Button(
                onClick = onPickPhoto,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
            ) {
                Icon(Icons.Default.PhotoLibrary, contentDescription = null)
                Text(stringResource(R.string.count_button_gallery), modifier = Modifier.padding(start = 8.dp))
            }
        }
    }
}

@Composable
private fun MeasureResult(
    photoUri: Uri,
    calibration: CalibrationPoints?,
    segments: List<MeasuredSegment>,
    pendingPoint: PointF?,
    onTap: (PointF) -> Unit,
    onRemoveSegment: (MeasuredSegment) -> Unit,
) {
    val context = LocalContext.current
    val bitmap = remember(photoUri) {
        context.contentResolver.openInputStream(photoUri)?.use { BitmapFactory.decodeStream(it) }
    }

    if (bitmap == null) {
        Text(stringResource(R.string.measure_failed))
        return
    }

    val hintRes = when {
        pendingPoint != null -> R.string.measure_second_point_hint
        calibration == null -> R.string.measure_calibrate_hint
        else -> R.string.measure_hint
    }

    // pointerInput(photoUri) only restarts its gesture-detecting coroutine when photoUri
    // itself changes - segments/onTap/onRemoveSegment change far more often (every tap),
    // so reading them directly inside that long-lived block would hit-test against
    // whatever snapshot was current when the block last (re)started, not the latest one.
    // rememberUpdatedState keeps a stable reference the block can read fresh values through.
    val currentSegments = rememberUpdatedState(segments)
    val currentOnTap = rememberUpdatedState(onTap)
    val currentOnRemoveSegment = rememberUpdatedState(onRemoveSegment)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(bitmap.width.toFloat() / bitmap.height.toFloat())
            .pointerInput(photoUri) {
                val hitRadius = max(24f, min(size.width, size.height) / 30f)
                detectTapGestures(
                    onTap = { offset ->
                        currentOnTap.value(PointF(offset.x / size.width, offset.y / size.height))
                    },
                    onLongPress = { offset ->
                        val nearest = currentSegments.value.minByOrNull { segment ->
                            val midX = (segment.a.x + segment.b.x) / 2f * size.width
                            val midY = (segment.a.y + segment.b.y) / 2f * size.height
                            hypot(midX - offset.x, midY - offset.y)
                        } ?: return@detectTapGestures
                        val midX = (nearest.a.x + nearest.b.x) / 2f * size.width
                        val midY = (nearest.a.y + nearest.b.y) / 2f * size.height
                        if (hypot(midX - offset.x, midY - offset.y) <= hitRadius) {
                            currentOnRemoveSegment.value(nearest)
                        }
                    },
                )
            },
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
        )
        val labelPaint = remember {
            android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.WHITE
                textAlign = android.graphics.Paint.Align.CENTER
                setShadowLayer(6f, 0f, 0f, android.graphics.Color.BLACK)
            }
        }
        Canvas(modifier = Modifier.fillMaxSize()) {
            labelPaint.textSize = min(size.width, size.height) / 20f

            fun drawSegment(a: PointF, b: PointF, color: Color, label: String) {
                val start = Offset(a.x * size.width, a.y * size.height)
                val end = Offset(b.x * size.width, b.y * size.height)
                drawLine(color = color, start = start, end = end, strokeWidth = 5f)
                drawCircle(color = color, radius = 10f, center = start)
                drawCircle(color = color, radius = 10f, center = end)
                drawContext.canvas.nativeCanvas.drawText(
                    label,
                    (start.x + end.x) / 2f,
                    (start.y + end.y) / 2f - labelPaint.textSize / 2f,
                    labelPaint,
                )
            }

            calibration?.let { drawSegment(it.a, it.b, Color(0xFFFFB300), formatCm(it.realLengthCm)) }
            segments.forEach { segment -> drawSegment(segment.a, segment.b, Color(0xFF62B6CB), formatCm(segment.lengthCm)) }

            pendingPoint?.let { point ->
                drawCircle(
                    color = Color.White,
                    radius = 12f,
                    center = Offset(point.x * size.width, point.y * size.height),
                )
            }
        }
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            color = MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f),
        ) {
            Text(
                text = stringResource(hintRes),
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }
    }
}
