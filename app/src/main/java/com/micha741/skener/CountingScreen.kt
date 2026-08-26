package com.micha741.skener

import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CropFree
import androidx.compose.material.icons.filled.FormatListNumbered
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.micha741.skener.data.DetectedBlob
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CountingScreen(
    viewModel: CountingViewModel,
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
                title = { Text(stringResource(R.string.nav_count)) },
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
                .padding(padding),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            val photoUri = uiState.photoUri
            if (photoUri == null) {
                CountingEmptyState(onCapturePhoto = onCapturePhoto, onPickPhoto = onPickPhoto)
            } else {
                var isSelectingRoi by remember(photoUri) { mutableStateOf(false) }
                CountingResult(
                    photoUri = photoUri,
                    blobs = uiState.blobs,
                    referenceBox = uiState.referenceBox,
                    referenceActive = uiState.referenceActive,
                    roiBox = uiState.roiBox,
                    isSelectingRoi = isSelectingRoi,
                    count = uiState.adjustedCount.takeIf { uiState.count != null },
                    excludedBoxes = uiState.excludedBoxes,
                    manualAdditions = uiState.manualAdditions,
                    isProcessing = uiState.isProcessing,
                    onTap = { point -> viewModel.onReferenceTap(point) },
                    onToggleExclude = { box -> viewModel.toggleExcluded(box) },
                    onAddManual = { point -> viewModel.addManualPiece(point) },
                    onRemoveManual = { point -> viewModel.removeManualPiece(point) },
                    onRoiSelected = { rect ->
                        viewModel.setRoi(rect)
                        isSelectingRoi = false
                    },
                )
                Spacer(modifier = Modifier.padding(top = 8.dp))
                if (uiState.roiBox != null) {
                    OutlinedButton(onClick = { viewModel.clearRoi() }) {
                        Text(stringResource(R.string.count_clear_roi))
                    }
                } else {
                    OutlinedButton(onClick = { isSelectingRoi = !isSelectingRoi }) {
                        Icon(Icons.Default.CropFree, contentDescription = null)
                        Text(
                            text = stringResource(if (isSelectingRoi) R.string.count_roi_selecting else R.string.count_select_roi),
                            modifier = Modifier.padding(start = 8.dp),
                        )
                    }
                }
                Spacer(modifier = Modifier.padding(top = 8.dp))
                if (uiState.referenceActive) {
                    OutlinedButton(onClick = { viewModel.clearReference() }) {
                        Text(stringResource(R.string.count_clear_reference))
                    }
                    Spacer(modifier = Modifier.padding(top = 8.dp))
                }
                Button(onClick = { viewModel.reset() }) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Text(
                        text = stringResource(R.string.count_new_photo),
                        modifier = Modifier.padding(start = 8.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun CountingEmptyState(onCapturePhoto: () -> Unit, onPickPhoto: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Default.FormatListNumbered,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = stringResource(R.string.count_empty_title),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 12.dp),
            )
            Text(
                text = stringResource(R.string.count_empty_subtitle),
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
private fun CountingResult(
    photoUri: Uri,
    blobs: List<DetectedBlob>,
    referenceBox: Rect?,
    referenceActive: Boolean,
    roiBox: Rect?,
    isSelectingRoi: Boolean,
    count: Int?,
    excludedBoxes: Set<Rect>,
    manualAdditions: List<Point>,
    isProcessing: Boolean,
    onTap: (Point) -> Unit,
    onToggleExclude: (Rect) -> Unit,
    onAddManual: (Point) -> Unit,
    onRemoveManual: (Point) -> Unit,
    onRoiSelected: (Rect) -> Unit,
) {
    val context = LocalContext.current
    val bitmap = remember(photoUri) {
        context.contentResolver.openInputStream(photoUri)?.use { BitmapFactory.decodeStream(it) }
    }

    if (bitmap == null) {
        Text(stringResource(R.string.count_failed))
        return
    }

    val manualHitRadius = max(20, min(bitmap.width, bitmap.height) / 40)
    var dragStart by remember(photoUri, isSelectingRoi) { mutableStateOf<Offset?>(null) }
    var dragCurrent by remember(photoUri, isSelectingRoi) { mutableStateOf<Offset?>(null) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(bitmap.width.toFloat() / bitmap.height.toFloat())
            .pointerInput(photoUri, isSelectingRoi) {
                if (isSelectingRoi) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            dragStart = offset
                            dragCurrent = offset
                        },
                        onDrag = { change, _ -> dragCurrent = change.position },
                        onDragEnd = {
                            val start = dragStart
                            val end = dragCurrent
                            if (start != null && end != null) {
                                val scaleX = size.width.toFloat() / bitmap.width
                                val scaleY = size.height.toFloat() / bitmap.height
                                val left = (min(start.x, end.x) / scaleX).roundToInt().coerceIn(0, bitmap.width - 1)
                                val top = (min(start.y, end.y) / scaleY).roundToInt().coerceIn(0, bitmap.height - 1)
                                val right = (max(start.x, end.x) / scaleX).roundToInt().coerceIn(left + 1, bitmap.width)
                                val bottom = (max(start.y, end.y) / scaleY).roundToInt().coerceIn(top + 1, bitmap.height)
                                onRoiSelected(Rect(left, top, right, bottom))
                            }
                            dragStart = null
                            dragCurrent = null
                        },
                    )
                } else {
                    detectTapGestures(
                        onTap = { offset ->
                            val scaleX = size.width.toFloat() / bitmap.width
                            val scaleY = size.height.toFloat() / bitmap.height
                            val bitmapX = (offset.x / scaleX).roundToInt().coerceIn(0, bitmap.width - 1)
                            val bitmapY = (offset.y / scaleY).roundToInt().coerceIn(0, bitmap.height - 1)
                            onTap(Point(bitmapX, bitmapY))
                        },
                        onLongPress = { offset ->
                            val scaleX = size.width.toFloat() / bitmap.width
                            val scaleY = size.height.toFloat() / bitmap.height
                            val bitmapX = (offset.x / scaleX).roundToInt().coerceIn(0, bitmap.width - 1)
                            val bitmapY = (offset.y / scaleY).roundToInt().coerceIn(0, bitmap.height - 1)

                            val nearestManual = manualAdditions.minByOrNull { marker ->
                                val dx = (marker.x - bitmapX).toDouble()
                                val dy = (marker.y - bitmapY).toDouble()
                                dx * dx + dy * dy
                            }
                            val manualDistance = nearestManual?.let {
                                val dx = (it.x - bitmapX).toDouble()
                                val dy = (it.y - bitmapY).toDouble()
                                sqrt(dx * dx + dy * dy)
                            }

                            val hitBlob = blobs.firstOrNull { it.box.contains(bitmapX, bitmapY) }

                            when {
                                nearestManual != null && manualDistance != null && manualDistance <= manualHitRadius -> {
                                    onRemoveManual(nearestManual)
                                }
                                hitBlob != null -> onToggleExclude(hitBlob.box)
                                else -> onAddManual(Point(bitmapX, bitmapY))
                            }
                        },
                    )
                }
            },
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
        )
        Canvas(modifier = Modifier.fillMaxSize()) {
            val scaleX = size.width / bitmap.width
            val scaleY = size.height / bitmap.height

            blobs.forEach { blob ->
                val box = blob.box
                val isExcluded = box in excludedBoxes
                val isReference = referenceActive && referenceBox != null && box == referenceBox
                val color = when {
                    isExcluded -> Color(0x889E9E9E)
                    isReference -> Color(0xFFFFB300)
                    else -> Color(0xFF62B6CB)
                }
                val strokeWidth = if (isReference) 6f else 4f

                drawRect(
                    color = color,
                    topLeft = Offset(box.left * scaleX, box.top * scaleY),
                    size = Size(box.width() * scaleX, box.height() * scaleY),
                    style = Stroke(width = strokeWidth),
                )
            }

            val markerRadius = manualHitRadius * scaleX
            manualAdditions.forEach { point ->
                drawCircle(
                    color = Color(0xFF4CAF50),
                    radius = markerRadius,
                    center = Offset(point.x * scaleX, point.y * scaleY),
                    style = Stroke(width = 5f),
                )
            }

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
            if (roiBox != null) {
                drawRect(
                    color = Color.White,
                    topLeft = Offset(roiBox.left * scaleX, roiBox.top * scaleY),
                    size = Size(roiBox.width() * scaleX, roiBox.height() * scaleY),
                    style = roiStroke,
                )
            }
        }
        if (isProcessing) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.scrim.copy(alpha = 0.3f),
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    CircularProgressIndicator()
                }
            }
        }
        if (!isProcessing && count != null) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(),
                color = MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f),
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text(
                        text = if (referenceActive) {
                            stringResource(R.string.count_reference_active, count)
                        } else {
                            stringResource(R.string.count_result, count)
                        },
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                    )
                    if (count == 0) {
                        Text(
                            text = stringResource(R.string.count_zero_hint),
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }
            }
        }
    }
}
