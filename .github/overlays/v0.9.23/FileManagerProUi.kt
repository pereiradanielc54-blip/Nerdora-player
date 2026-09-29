package com.nerdora.player.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.nerdora.player.BatchRenameEngine
import com.nerdora.player.BatchRenameOptions
import com.nerdora.player.DuplicateHashEngine
import com.nerdora.player.FileChecksums
import com.nerdora.player.FileOperationEngine
import kotlinx.coroutines.delay
import java.io.File

@Composable
fun FileOperationStatusCard(context: Context) {
    var snapshot by remember { mutableStateOf(FileOperationEngine.snapshot(context)) }
    var pending by remember { mutableIntStateOf(FileOperationEngine.pendingCount(context)) }

    LaunchedEffect(Unit) {
        while (true) {
            snapshot = FileOperationEngine.snapshot(context)
            pending = FileOperationEngine.pendingCount(context)
            delay(700L)
        }
    }

    if (snapshot.state !in setOf("RUNNING", "QUEUED") && pending == 0) return

    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(snapshot.title.ifBlank { "Operações de arquivos" }, fontWeight = FontWeight.Bold)
                Text(if (snapshot.state == "QUEUED") "Na fila" else "${snapshot.percent}%")
            }
            Spacer(Modifier.height(7.dp))
            if (snapshot.state == "QUEUED") {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            } else {
                LinearProgressIndicator(
                    progress = snapshot.percent.coerceIn(0, 100) / 100f,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(Modifier.height(5.dp))
            Text(
                buildString {
                    append(snapshot.message.ifBlank { "Processando…" })
                    if (pending > 1) append(" • $pending operações na fila")
                },
                style = MaterialTheme.typography.bodySmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun FileSelectionActionBar(
    selectedCount: Int,
    canChecksum: Boolean,
    onClear: () -> Unit,
    onSelectAll: () -> Unit,
    onCopy: () -> Unit,
    onMove: () -> Unit,
    onBatchRename: () -> Unit,
    onChecksum: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(vertical = 8.dp)) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("$selectedCount selecionado(s)", fontWeight = FontWeight.Bold)
                TextButton(onClick = onClear) { Text("Cancelar") }
            }
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                TextButton(onClick = onSelectAll) { Text("Todos") }
                TextButton(onClick = onCopy) { Text("Copiar") }
                TextButton(onClick = onMove) { Text("Mover") }
                TextButton(onClick = onBatchRename) { Text("Renomear lote") }
                if (canChecksum) {
                    TextButton(onClick = onChecksum) { Text("Checksum") }
                }
            }
        }
    }
}

@Composable
fun BatchRenameDialog(
    files: List<File>,
    onDismiss: () -> Unit,
    onApply: (BatchRenameOptions) -> Unit
) {
    var prefix by remember { mutableStateOf("") }
    var suffix by remember { mutableStateOf("") }
    var findText by remember { mutableStateOf("") }
    var replaceText by remember { mutableStateOf("") }
    var addNumber by remember { mutableStateOf(false) }
    var start by remember { mutableStateOf("1") }

    val options = remember(prefix, suffix, findText, replaceText, addNumber, start) {
        BatchRenameOptions(
            prefix = prefix,
            suffix = suffix,
            findText = findText,
            replaceText = replaceText,
            addNumber = addNumber,
            startNumber = start.toIntOrNull() ?: 1
        )
    }
    val preview = remember(files, options) { BatchRenameEngine.preview(files, options).take(6) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Renomear em lote") },
        text = {
            Column {
                Text("${files.size} item(ns)", style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(prefix, { prefix = it }, label = { Text("Prefixo") }, singleLine = true)
                OutlinedTextField(suffix, { suffix = it }, label = { Text("Sufixo") }, singleLine = true)
                OutlinedTextField(findText, { findText = it }, label = { Text("Localizar") }, singleLine = true)
                OutlinedTextField(replaceText, { replaceText = it }, label = { Text("Substituir por") }, singleLine = true)
                Row {
                    Checkbox(checked = addNumber, onCheckedChange = { addNumber = it })
                    Text("Adicionar numeração", modifier = Modifier.padding(top = 12.dp))
                }
                if (addNumber) {
                    OutlinedTextField(
                        start,
                        { start = it.filter(Char::isDigit).take(6) },
                        label = { Text("Número inicial") },
                        singleLine = true
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text("Prévia", fontWeight = FontWeight.Bold)
                preview.forEach {
                    Text(
                        "${it.source.name} → ${it.newName}",
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onApply(options) }) { Text("Aplicar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
fun ChecksumDialog(
    context: Context,
    file: File,
    onDismiss: () -> Unit
) {
    var result by remember(file.absolutePath) { mutableStateOf<FileChecksums?>(null) }
    var error by remember(file.absolutePath) { mutableStateOf<String?>(null) }

    LaunchedEffect(file.absolutePath) {
        runCatching { DuplicateHashEngine.checksums(file) }
            .onSuccess { result = it }
            .onFailure { error = it.message ?: "Falha ao calcular checksum." }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Checksum") },
        text = {
            Column {
                Text(file.name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(10.dp))
                when {
                    error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
                    result == null -> {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            CircularProgressIndicator()
                            Text("Calculando MD5, SHA-1 e SHA-256…")
                        }
                    }
                    else -> {
                        HashLine(context, "MD5", result!!.md5)
                        HashLine(context, "SHA-1", result!!.sha1)
                        HashLine(context, "SHA-256", result!!.sha256)
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Fechar") } }
    )
}

@Composable
private fun HashLine(context: Context, label: String, value: String) {
    Column(Modifier.padding(vertical = 5.dp)) {
        Text(label, fontWeight = FontWeight.Bold)
        Text(value, style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText(label, value))
            Toast.makeText(context, "$label copiado.", Toast.LENGTH_SHORT).show()
        }) { Text("Copiar $label") }
    }
}
