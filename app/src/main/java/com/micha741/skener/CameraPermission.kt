package com.micha741.skener

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat

class CameraPermissionState(val granted: Boolean, val requestPermission: () -> Unit)

/** Tracks CAMERA permission state and requests it once on first composition. */
@Composable
fun rememberCameraPermissionState(): CameraPermissionState {
    val context = LocalContext.current
    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted -> granted = isGranted }

    LaunchedEffect(Unit) {
        if (!granted) launcher.launch(Manifest.permission.CAMERA)
    }

    return CameraPermissionState(granted) { launcher.launch(Manifest.permission.CAMERA) }
}

/** Shown in place of a camera screen while permission is missing. [onClose] is optional for screens with no back action. */
@Composable
fun CameraPermissionRationale(
    onRequestPermission: () -> Unit,
    onClose: (() -> Unit)? = null,
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Default.PhotoCamera,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = stringResource(R.string.camera_permission_rationale),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 12.dp, start = 24.dp, end = 24.dp),
            )
            Button(onClick = onRequestPermission, modifier = Modifier.padding(top = 16.dp)) {
                Text(stringResource(R.string.camera_permission_request))
            }
            if (onClose != null) {
                Button(onClick = onClose, modifier = Modifier.padding(top = 8.dp)) {
                    Text(stringResource(R.string.close))
                }
            }
        }
    }
}
