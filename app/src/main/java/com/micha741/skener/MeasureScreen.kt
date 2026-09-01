package com.micha741.skener

import android.graphics.BitmapFactory
import android.graphics.PointF
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.PointerInputScope
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.micha741.skener.data.AutoCalibrationSuggestion
import com.micha741.skener.data.CalibrationPoints
import com.micha741.skener.data.KnownReferenceObject
import com.micha741.skener.data.MeasuredSegment
import com.micha741.skener.data.formatCm
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

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
                    autoCalibrationSuggestion = uiState.autoCalibrationSuggestion,
                    onTap = { point -> viewModel.onTap(point) },
                    onRemoveSegment = { segment -> viewModel.removeSegment(segment) },
                )
                Spacer(modifier = Modifier.padding(top = 8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (uiState.isCalibrated) {
                        OutlinedButton(onClick = { viewModel.recalibrate() }) {
                            Text(stringResource(R.string.measure_recalibrate))
                        }
                    } else {
                        OutlinedButton(
                            onClick = { viewModel.detectAutoCalibration() },
                            enabled = !uiState.isDetectingAutoCalibration,
                        ) {
                            if (uiState.isDetectingAutoCalibration) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            } else {
                                Text(stringResource(R.string.measure_auto_calibrate))
                            }
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

    val autoSuggestion = uiState.autoCalibrationSuggestion
    if (autoSuggestion != null) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissAutoCalibrationSuggestion() },
            title = { Text(stringResource(R.string.measure_auto_calibration_title)) },
            text = {
                val messageRes = when (autoSuggestion.objectType) {
                    KnownReferenceObject.A4_PAPER -> R.string.measure_auto_calibration_message_a4
                    KnownReferenceObject.PAYMENT_CARD -> R.string.measure_auto_calibration_message_card
                }
                Text(stringResource(messageRes))
            },
            confirmButton = {
                TextButton(onClick = { viewModel.confirmAutoCalibration() }) {
                    Text(stringResource(R.string.measure_auto_calibration_use))
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissAutoCalibrationSuggestion() }) {
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
    autoCalibrationSuggestion: AutoCalibrationSuggestion?,
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

    // Position (in the photo Box's own coordinate space) of the finger while it's down, so the
    // magnifier below can render there; null while nothing is pressed. Written from inside the
    // pointerInput gesture below, read from the Canvas draw block further down.
    val magnifierPosition = remember { mutableStateOf<Offset?>(null) }
    val imageBitmap = remember(bitmap) { bitmap.asImageBitmap() }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(bitmap.width.toFloat() / bitmap.height.toFloat())
            .pointerInput(photoUri) {
                val hitRadius = max(24f, min(size.width, size.height) / 30f)
                detectMeasurementGestures(
                    hitRadius = hitRadius,
                    segments = { currentSegments.value },
                    onMagnifierMove = { position -> magnifierPosition.value = position },
                    onPlacePoint = { offset ->
                        currentOnTap.value(PointF(offset.x / size.width, offset.y / size.height))
                    },
                    onRemoveSegment = { segment -> currentOnRemoveSegment.value(segment) },
                )
            },
    ) {
        Image(
            bitmap = imageBitmap,
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
            autoCalibrationSuggestion?.let { drawSegment(it.a, it.b, Color(0xFF66BB6A), formatCm(it.realLengthCm)) }
            segments.forEach { segment ->
                val color = if (segment.isLikelyUnreliable) Color(0xFFFF7043) else Color(0xFF62B6CB)
                val label = if (segment.isLikelyUnreliable) "${formatCm(segment.lengthCm)} ?" else formatCm(segment.lengthCm)
                drawSegment(segment.a, segment.b, color, label)
            }

            pendingPoint?.let { point ->
                drawCircle(
                    color = Color.White,
                    radius = 12f,
                    center = Offset(point.x * size.width, point.y * size.height),
                )
            }

            // Zoomed loupe around the finger while it's down, so a point can be placed on the
            // exact pixel instead of guessing under a fingertip - the displayed image is almost
            // always shrunk well below the photo's real resolution, so a screen pixel can be
            // several photo pixels wide.
            magnifierPosition.value?.let { finger ->
                val radiusPx = 55.dp.toPx()
                val zoom = 2.5f
                val bitmapPerScreenPx = bitmap.width / size.width
                val srcRadius = (radiusPx / zoom) * bitmapPerScreenPx
                val srcCenterX = finger.x * bitmapPerScreenPx
                val srcCenterY = finger.y * bitmapPerScreenPx
                val srcLeft = (srcCenterX - srcRadius).roundToInt().coerceIn(0, bitmap.width)
                val srcTop = (srcCenterY - srcRadius).roundToInt().coerceIn(0, bitmap.height)
                val srcRight = (srcCenterX + srcRadius).roundToInt().coerceIn(0, bitmap.width)
                val srcBottom = (srcCenterY + srcRadius).roundToInt().coerceIn(0, bitmap.height)

                val gap = radiusPx * 2.3f
                val dstCenter = Offset(
                    x = finger.x.coerceIn(radiusPx, size.width - radiusPx),
                    y = if (finger.y - gap > radiusPx) finger.y - gap else finger.y + gap,
                )

                clipPath(
                    Path().apply {
                        addOval(
                            androidx.compose.ui.geometry.Rect(
                                center = dstCenter,
                                radius = radiusPx,
                            ),
                        )
                    },
                ) {
                    drawImage(
                        image = imageBitmap,
                        srcOffset = IntOffset(srcLeft, srcTop),
                        srcSize = IntSize((srcRight - srcLeft).coerceAtLeast(1), (srcBottom - srcTop).coerceAtLeast(1)),
                        dstOffset = IntOffset((dstCenter.x - radiusPx).roundToInt(), (dstCenter.y - radiusPx).roundToInt()),
                        dstSize = IntSize((radiusPx * 2).roundToInt(), (radiusPx * 2).roundToInt()),
                    )
                }
                drawCircle(color = Color.White, radius = radiusPx, center = dstCenter, style = Stroke(width = 4f))
                drawLine(Color.Red, Offset(dstCenter.x - 14f, dstCenter.y), Offset(dstCenter.x + 14f, dstCenter.y), strokeWidth = 3f)
                drawLine(Color.Red, Offset(dstCenter.x, dstCenter.y - 14f), Offset(dstCenter.x, dstCenter.y + 14f), strokeWidth = 3f)
            }
        }
        Column(modifier = Modifier.align(Alignment.BottomCenter)) {
            if (segments.any { it.isLikelyUnreliable }) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFFFF7043).copy(alpha = 0.85f),
                ) {
                    Text(
                        text = stringResource(R.string.measure_unreliable_hint),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    )
                }
            }
            Surface(
                modifier = Modifier.fillMaxWidth(),
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
}

/**
 * A press drives the magnifier ([onMagnifierMove]) to track the finger until it's lifted - the
 * final position is where the point gets placed ([onPlacePoint]), so a tap can be fine-tuned
 * onto the exact pixel before it commits instead of guessing under a fingertip. Holding still
 * near an existing segment's midpoint for a long press instead deletes it ([onRemoveSegment]),
 * same as the old detectTapGestures(onLongPress) behavior this replaces.
 */
private suspend fun PointerInputScope.detectMeasurementGestures(
    hitRadius: Float,
    segments: () -> List<MeasuredSegment>,
    onMagnifierMove: (Offset?) -> Unit,
    onPlacePoint: (Offset) -> Unit,
    onRemoveSegment: (MeasuredSegment) -> Unit,
) {
    awaitEachGesture {
        val down = awaitFirstDown()
        val longPressTimeoutMillis = viewConfiguration.longPressTimeoutMillis
        val downTime = System.currentTimeMillis()
        val downPos = down.position

        val nearestAtDown = segments()
            .map { segment ->
                val midX = (segment.a.x + segment.b.x) / 2f * size.width
                val midY = (segment.a.y + segment.b.y) / 2f * size.height
                segment to hypot(midX - downPos.x, midY - downPos.y)
            }
            .minByOrNull { it.second }
            ?.takeIf { it.second <= hitRadius }
            ?.first

        onMagnifierMove(downPos)
        var lastPos = downPos
        var moved = false
        val pointerId = down.id
        while (true) {
            val event = awaitPointerEvent()
            val change = event.changes.firstOrNull { it.id == pointerId } ?: break
            if (change.changedToUpIgnoreConsumed()) {
                lastPos = change.position
                break
            }
            if (change.positionChanged()) {
                lastPos = change.position
                if (hypot(lastPos.x - downPos.x, lastPos.y - downPos.y) > viewConfiguration.touchSlop) moved = true
                onMagnifierMove(lastPos)
                change.consume()
            }
        }
        onMagnifierMove(null)

        val elapsed = System.currentTimeMillis() - downTime
        if (nearestAtDown != null && !moved && elapsed >= longPressTimeoutMillis) {
            onRemoveSegment(nearestAtDown)
        } else {
            onPlacePoint(lastPos)
        }
    }
}
