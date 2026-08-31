package com.micha741.skener

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.FormatListNumbered
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.micha741.skener.data.BarcodeImageEncoder
import com.micha741.skener.data.ScanDocument
import com.micha741.skener.ui.theme.SkenerTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.text.DateFormat
import java.util.Date

class MainActivity : ComponentActivity() {

    private val viewModel: ScanViewModel by viewModels { ScanViewModelFactory(this) }
    private val countingViewModel: CountingViewModel by viewModels { CountingViewModelFactory(this) }
    private val suspicionsViewModel: SuspicionsViewModel by viewModels { SuspicionsViewModelFactory(this) }
    private val barcodeViewModel: BarcodeViewModel by viewModels()

    private val scannerOptions = GmsDocumentScannerOptions.Builder()
        .setGalleryImportAllowed(true)
        .setPageLimit(50)
        .setResultFormats(
            GmsDocumentScannerOptions.RESULT_FORMAT_PDF,
            GmsDocumentScannerOptions.RESULT_FORMAT_JPEG,
        )
        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
        .build()

    private val scanner by lazy { GmsDocumentScanning.getClient(scannerOptions) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        offerCrashLogShare()
        setContent {
            SkenerTheme {
                val navController = rememberNavController()

                val scanLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.StartIntentSenderForResult()
                ) { result ->
                    if (result.resultCode == RESULT_OK) {
                        val scanResult = GmsDocumentScanningResult.fromActivityResultIntent(result.data)
                        when (viewModel.uiState.value.scanMode) {
                            ScanMode.TEXT -> {
                                val imageUris = scanResult?.pages?.map { it.imageUri }
                                if (!imageUris.isNullOrEmpty()) {
                                    viewModel.onScanSucceededWithText(imageUris)
                                } else {
                                    viewModel.onScanFailed(getString(R.string.scan_failed))
                                }
                            }
                            ScanMode.IMAGE -> {
                                val pdf = scanResult?.pdf
                                if (pdf != null) {
                                    viewModel.onScanSucceeded(pdf.uri, pdf.pageCount)
                                } else {
                                    viewModel.onScanFailed(getString(R.string.scan_failed))
                                }
                            }
                        }
                    }
                }

                val pickPhotoLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.PickVisualMedia()
                ) { uri ->
                    uri?.let { countingViewModel.onPhotoSelected(it) }
                }

                val pickBarcodePhotoLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.PickVisualMedia()
                ) { uri ->
                    uri?.let { barcodeViewModel.onPhotoPicked(applicationContext, it) }
                }

                var pendingSaveDocument by remember { mutableStateOf<ScanDocument?>(null) }
                val saveLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.CreateDocument("application/pdf")
                ) { destUri ->
                    val document = pendingSaveDocument
                    pendingSaveDocument = null
                    if (destUri != null && document != null) {
                        exportDocument(document, destUri)
                    }
                }

                var pendingSaveBarcode by remember { mutableStateOf<ScannedCode?>(null) }
                val saveBarcodeImageLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.CreateDocument("image/png")
                ) { destUri ->
                    val code = pendingSaveBarcode
                    pendingSaveBarcode = null
                    if (destUri != null && code != null) {
                        saveBarcodeImage(code, destUri)
                    }
                }

                val saveCountResultLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.CreateDocument("image/png")
                ) { destUri ->
                    if (destUri != null) {
                        countingViewModel.saveResult(destUri)
                    }
                }

                AppScaffold(
                    navController = navController,
                    scanViewModel = viewModel,
                    countingViewModel = countingViewModel,
                    suspicionsViewModel = suspicionsViewModel,
                    barcodeViewModel = barcodeViewModel,
                    onStartScan = { startScan(scanLauncher) },
                    onShare = ::shareDocument,
                    onSaveToDevice = { document ->
                        pendingSaveDocument = document
                        saveLauncher.launch(document.pdfFile.name)
                    },
                    onPickPhoto = {
                        pickPhotoLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    onPickBarcodePhoto = {
                        pickBarcodePhotoLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    onSaveBarcodeImage = { code ->
                        pendingSaveBarcode = code
                        saveBarcodeImageLauncher.launch("kod_${code.timestamp}.png")
                    },
                    onSaveCountResult = {
                        saveCountResultLauncher.launch("pocet_${System.currentTimeMillis()}.png")
                    },
                )
            }
        }
    }

    private fun startScan(
        scanLauncher: androidx.activity.result.ActivityResultLauncher<IntentSenderRequest>,
    ) {
        scanner.getStartScanIntent(this)
            .addOnSuccessListener { intentSender ->
                scanLauncher.launch(IntentSenderRequest.Builder(intentSender).build())
            }
            .addOnFailureListener { exception ->
                viewModel.onScanFailed(exception.message ?: getString(R.string.scan_failed))
            }
    }

    /**
     * If the app crashed last run (see [SkenerApplication]), offers to share
     * the saved stack trace. The marker file is renamed to a fresh name and
     * the original deleted right away, so this only fires once per crash -
     * but the renamed copy itself is left alone, since the receiving share
     * target reads it asynchronously (potentially after the user spends a
     * few seconds picking an app from the chooser) and deleting it here
     * could race that read and send an empty file.
     */
    private fun offerCrashLogShare() {
        val crashFile = File(cacheDir, SkenerApplication.CRASH_LOG_FILE_NAME)
        if (!crashFile.exists()) return

        val shareFile = File(cacheDir, "crash_${System.currentTimeMillis()}.txt")
        crashFile.copyTo(shareFile, overwrite = true)
        crashFile.delete()

        Toast.makeText(this, getString(R.string.crash_log_found), Toast.LENGTH_LONG).show()
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", shareFile)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(intent, getString(R.string.share)))
    }

    private fun shareDocument(document: ScanDocument) {
        val uri = FileProvider.getUriForFile(
            this,
            "$packageName.fileprovider",
            document.pdfFile,
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(intent, getString(R.string.share)))
    }

    private fun saveBarcodeImage(code: ScannedCode, destUri: Uri) {
        lifecycleScope.launch {
            val bitmap = withContext(Dispatchers.Default) { BarcodeImageEncoder.encode(code.value, code.format) }
            if (bitmap == null) {
                Toast.makeText(this@MainActivity, getString(R.string.save_failed), Toast.LENGTH_SHORT).show()
                return@launch
            }
            try {
                contentResolver.openOutputStream(destUri)?.use { output ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
                }
                Toast.makeText(this@MainActivity, getString(R.string.save_success), Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, e.message ?: getString(R.string.save_failed), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun exportDocument(document: ScanDocument, destUri: Uri) {
        try {
            contentResolver.openOutputStream(destUri)?.use { output ->
                document.pdfFile.inputStream().use { input -> input.copyTo(output) }
            }
            viewModel.onSaveSucceeded()
        } catch (e: Exception) {
            viewModel.onScanFailed(e.message ?: getString(R.string.save_failed))
        }
    }
}

@Composable
private fun AppScaffold(
    navController: NavHostController,
    scanViewModel: ScanViewModel,
    countingViewModel: CountingViewModel,
    suspicionsViewModel: SuspicionsViewModel,
    barcodeViewModel: BarcodeViewModel,
    onStartScan: () -> Unit,
    onShare: (ScanDocument) -> Unit,
    onSaveToDevice: (ScanDocument) -> Unit,
    onPickPhoto: () -> Unit,
    onPickBarcodePhoto: () -> Unit,
    onSaveBarcodeImage: (ScannedCode) -> Unit,
    onSaveCountResult: () -> Unit,
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val countingUiState by countingViewModel.uiState.collectAsState()
    // Hidden once a photo's loaded on the count screen, not just on live_count/suspicions -
    // dragging out a region of interest on a large gallery photo needs every bit of vertical
    // space it can get; the nav bar's own ~80dp was enough to make that drag hard to land.
    val hideBottomBar = currentRoute == "live_count" ||
        currentRoute == "suspicions" ||
        (currentRoute == "count" && countingUiState.photoUri != null)

    Scaffold(
        bottomBar = {
            if (!hideBottomBar) {
                NavigationBar {
                    NavigationBarItem(
                        selected = currentRoute == "scan",
                        onClick = { navController.navigateSingleTopTo("scan") },
                        icon = { Icon(Icons.Default.DocumentScanner, contentDescription = null) },
                        label = { Text(stringResource(R.string.nav_scan)) },
                    )
                    NavigationBarItem(
                        selected = currentRoute == "count",
                        onClick = { navController.navigateSingleTopTo("count") },
                        icon = { Icon(Icons.Default.FormatListNumbered, contentDescription = null) },
                        label = { Text(stringResource(R.string.nav_count)) },
                    )
                    NavigationBarItem(
                        selected = currentRoute == "barcode",
                        onClick = { navController.navigateSingleTopTo("barcode") },
                        icon = { Icon(Icons.Default.QrCodeScanner, contentDescription = null) },
                        label = { Text(stringResource(R.string.nav_barcode)) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "scan",
            modifier = Modifier.padding(padding),
        ) {
            composable("scan") {
                ScanScreen(
                    viewModel = scanViewModel,
                    onStartScan = onStartScan,
                    onShare = onShare,
                    onSaveToDevice = onSaveToDevice,
                )
            }
            composable("count") {
                CountingScreen(
                    viewModel = countingViewModel,
                    onCapturePhoto = { navController.navigate("live_count") },
                    onPickPhoto = onPickPhoto,
                    onSaveResult = onSaveCountResult,
                    onViewSuspicions = {
                        suspicionsViewModel.refresh()
                        navController.navigate("suspicions")
                    },
                )
            }
            composable("suspicions") {
                SuspicionsScreen(
                    viewModel = suspicionsViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable("live_count") {
                LiveCameraScreen(
                    onPhotoCaptured = { uri, roi ->
                        countingViewModel.onPhotoSelected(uri, roi)
                        navController.popBackStack()
                    },
                    onClose = { navController.popBackStack() },
                )
            }
            composable("barcode") {
                BarcodeScreen(
                    viewModel = barcodeViewModel,
                    onPickPhoto = onPickBarcodePhoto,
                    onSaveImage = onSaveBarcodeImage,
                )
            }
        }
    }
}

private fun NavHostController.navigateSingleTopTo(route: String) {
    val startId = graph.startDestinationId
    navigate(route) {
        popUpTo(startId) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ScanScreen(
    viewModel: ScanViewModel,
    onStartScan: () -> Unit,
    onShare: (ScanDocument) -> Unit,
    onSaveToDevice: (ScanDocument) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.consumeError()
        }
    }

    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.consumeInfoMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.app_name)) })
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                text = { Text(stringResource(R.string.scan_button)) },
                icon = { Icon(Icons.Default.DocumentScanner, contentDescription = null) },
                onClick = onStartScan,
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            ScanModeSelector(
                mode = uiState.scanMode,
                onModeChange = viewModel::setScanMode,
            )

            if (uiState.documents.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    EmptyState(PaddingValues(0.dp))
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                ) {
                    items(uiState.documents, key = { it.pdfFile.path }) { document ->
                        ScanListItem(
                            document = document,
                            onShare = { onShare(document) },
                            onSaveToDevice = { onSaveToDevice(document) },
                            onDelete = { viewModel.delete(document) },
                        )
                    }
                }
            }
        }

        if (uiState.isProcessing) {
            OcrProcessingOverlay()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ScanModeSelector(mode: ScanMode, onModeChange: (ScanMode) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        FilterChip(
            selected = mode == ScanMode.IMAGE,
            onClick = { onModeChange(ScanMode.IMAGE) },
            label = { Text(stringResource(R.string.scan_mode_image)) },
        )
        FilterChip(
            selected = mode == ScanMode.TEXT,
            onClick = { onModeChange(ScanMode.TEXT) },
            label = { Text(stringResource(R.string.scan_mode_text)) },
        )
    }
}

@Composable
private fun OcrProcessingOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.35f)),
        contentAlignment = Alignment.Center,
    ) {
        Surface(shape = RoundedCornerShape(12.dp)) {
            Row(
                modifier = Modifier.padding(24.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CircularProgressIndicator()
                Text(
                    text = stringResource(R.string.ocr_processing),
                    modifier = Modifier.padding(start = 16.dp),
                )
            }
        }
    }
}

@Composable
private fun EmptyState(padding: PaddingValues) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Default.DocumentScanner,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = stringResource(R.string.empty_state_title),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 12.dp),
            )
            Text(
                text = stringResource(R.string.empty_state_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
private fun ScanListItem(
    document: ScanDocument,
    onShare: () -> Unit,
    onSaveToDevice: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Description,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
                Column(modifier = Modifier.padding(start = 12.dp)) {
                    Text(
                        text = document.pdfFile.name,
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Text(
                        text = "${stringResource(R.string.pages_count, document.pageCount)} · " +
                            DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                                .format(Date(document.createdAtMillis)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Row {
                IconButton(onClick = onSaveToDevice) {
                    Icon(Icons.Default.Download, contentDescription = stringResource(R.string.save_to_device))
                }
                IconButton(onClick = onShare) {
                    Icon(Icons.Default.Share, contentDescription = stringResource(R.string.share))
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = stringResource(R.string.delete))
                }
            }
        }
    }
}
