package com.micha741.skener

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.micha741.skener.data.SuspicionRecord
import java.text.DateFormat
import java.util.Date

/**
 * Lists results the user flagged via [CountingViewModel.reportSuspicion] -
 * a personal log to review later, not something the app itself acts on
 * (see [com.micha741.skener.data.SuspicionRepository]'s own doc comment on
 * why a remembered note can't feed back into future counting).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SuspicionsScreen(viewModel: SuspicionsViewModel, onBack: () -> Unit) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.suspicions_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
            )
        },
    ) { padding ->
        if (uiState.records.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.History,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = stringResource(R.string.suspicions_empty_title),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    Text(
                        text = stringResource(R.string.suspicions_empty_subtitle),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(
                    start = 16.dp,
                    top = padding.calculateTopPadding() + 16.dp,
                    end = 16.dp,
                    bottom = 16.dp,
                ),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(uiState.records, key = { it.imageFile.path }) { record ->
                    SuspicionListItem(
                        record = record,
                        onDelete = { viewModel.delete(record) },
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun SuspicionListItem(record: SuspicionRecord, onDelete: () -> Unit, modifier: Modifier = Modifier) {
    val bitmap = remember(record.imageFile.path) { BitmapFactory.decodeFile(record.imageFile.path) }

    Card(modifier = modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(12.dp)) {
            if (bitmap != null) {
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(8.dp)),
                )
            }
            Column(modifier = Modifier.padding(start = 12.dp).weight(1f)) {
                Text(text = record.note, style = MaterialTheme.typography.bodyLarge)
                Text(
                    text = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                        .format(Date(record.createdAtMillis)),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = stringResource(R.string.delete))
            }
        }
    }
}
