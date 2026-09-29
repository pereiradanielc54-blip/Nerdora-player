package com.nerdora.player.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
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
import com.nerdora.player.FileConflictPolicy
import com.nerdora.player.FileNameConflict
import com.nerdora.player.FileOperationEngine
import com.nerdora.player.FileOperationHistoryEntry
import com.nerdora.player.FileOperationRequest
import com.nerdora.player.FileOperationSnapshot
import com.nerdora.player.FileOperationType
import kotlinx.coroutines.delay
import java.io.File
import java.text.DateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FileOperationStatusCard(context: Context, onOpenCenter: () -> Unit) {
    var snapshot by remember { mutableStateOf(FileOperationEngine.snapshot(context)) }
    var pending by remember { mutableIntStateOf(FileOperationEngine.pendingCount(context)) }

    LaunchedEffect(Unit) {
        while (true) {
            snapshot = FileOperationEngine.snapshot(context)
            pending = FileOperationEngine.pendingCount(context)
            delay(650L)
        }
    }

    if (snapshot.state !in setOf("RUNNING", "QUEUED") && pending == 0) return

    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp).clickable(onClick = onOpenCenter),
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
            Spacer(Modifier.height(6.dp))
            Text(
                buildString {
                    if (snapshot.totalBytes > 0L) {
                        append(formatProBytes(snapshot.processedBytes))
                        append(" / ")
                        append(formatProBytes(snapshot.totalBytes))
                    }
                    if (snapshot.speedBytesPerSec > 0L) {
                        if (isNotEmpty()) append(" • ")
                        append(formatProBytes(snapshot.speedBytesPerSec))
                        append("/s")
                    }
                    if (snapshot.etaSeconds >= 0L) {
                        if (isNotEmpty()) append(" • ")
                        append(formatEta(snapshot.etaSeconds))
                    }
                }.ifBlank { snapshot.message.ifBlank { "Processando…" } },
                style = MaterialTheme.typography.bodySmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (snapshot.message.isNotBlank() && snapshot.totalBytes > 0L) {
                Text(snapshot.message, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text(
                if (pending > 1) "$pending operações na fila • toque para ver" else "Toque para abrir fila e histórico",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
fun FileSelectionActionBar(
    selectedCount: Int,
    canChecksum: Boolean,
    canRange: Boolean,
    rangeMode: Boolean,
    allowVault: Boolean,
    allowTrash: Boolean,
    onClear: () -> Unit,
    onSelectAll: () -> Unit,
    onRange: () -> Unit,
    onCopy: () -> Unit,
    onMove: () -> Unit,
    onBatchRename: () -> Unit,
    onChecksum: () -> Unit,
    onVault: () -> Unit,
    onTrash: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        color = if (rangeMode) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(vertical = 8.dp)) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("$selectedCount selecionado(s)", fontWeight = FontWeight.Bold)
                TextButton(onClick = onClear) { Text("Cancelar") }
            }
            if (rangeMode) {
                Text(
                    "Intervalo ativo: toque no último item do intervalo.",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 2.dp),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                TextButton(onClick = onSelectAll) { Text("Todos") }
                if (canRange) TextButton(onClick = onRange) { Text(if (rangeMode) "Intervalo ativo" else "Intervalo") }
                TextButton(onClick = onCopy) { Text("Copiar") }
                TextButton(onClick = onMove) { Text("Mover") }
                TextButton(onClick = onBatchRename) { Text("Renomear lote") }
                if (canChecksum) TextButton(onClick = onChecksum) { Text("Checksum") }
                if (allowVault) TextButton(onClick = onVault) { Text("Cofre") }
                if (allowTrash) TextButton(onClick = onTrash) { Text("Lixeira") }
                TextButton(onClick = onDelete) { Text("Excluir") }
            }
        }
    }
}

@Composable
fun FileConflictDialog(
    conflicts: List<FileNameConflict>,
    onDismiss: () -> Unit,
    onChoice: (FileConflictPolicy) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Conflito de nomes") },
        text = {
            Column {
                Text(
                    if (conflicts.size == 1) "Já existe um item com este nome no destino."
                    else "${conflicts.size} itens já existem na pasta de destino."
                )
                Spacer(Modifier.height(8.dp))
                conflicts.take(6).forEach {
                    Text("• ${it.name}", style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (conflicts.size > 6) Text("… e mais ${conflicts.size - 6}", style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(10.dp))
                Text(
                    "Manter ambos cria um novo nome. Substituir troca o item existente após preparar uma cópia temporária. Ignorar pula somente os conflitos.",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            Row {
                TextButton(onClick = { onChoice(FileConflictPolicy.KEEP_BOTH) }) { Text("Manter ambos") }
                TextButton(onClick = { onChoice(FileConflictPolicy.REPLACE) }) { Text("Substituir") }
                TextButton(onClick = { onChoice(FileConflictPolicy.SKIP) }) { Text("Ignorar") }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
fun BulkFileActionDialog(
    action: FileOperationType,
    count: Int,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val title = when (action) {
        FileOperationType.TRASH -> "Mover para a Lixeira?"
        FileOperationType.VAULT -> "Ocultar no Cofre?"
        FileOperationType.DELETE -> "Excluir definitivamente?"
        else -> "Confirmar operação?"
    }
    val description = when (action) {
        FileOperationType.TRASH -> "$count item(ns) serão movidos para a Lixeira e poderão ser restaurados."
        FileOperationType.VAULT -> "$count item(ns) serão retirados do armazenamento compartilhado e protegidos no Cofre privado."
        FileOperationType.DELETE -> "$count item(ns) serão apagados fisicamente do celular. Esta ação não pode ser desfeita."
        else -> "Confirmar a operação com $count item(ns)?"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(description) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(if (action == FileOperationType.DELETE) "Excluir definitivamente" else "Confirmar")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
fun FileOperationCenterDialog(context: Context, onDismiss: () -> Unit) {
    var snapshot by remember { mutableStateOf(FileOperationEngine.snapshot(context)) }
    var queue by remember { mutableStateOf(FileOperationEngine.queue(context)) }
    var history by remember { mutableStateOf(FileOperationEngine.history(context)) }

    LaunchedEffect(Unit) {
        while (true) {
            snapshot = FileOperationEngine.snapshot(context)
            queue = FileOperationEngine.queue(context)
            history = FileOperationEngine.history(context)
            delay(650L)
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Fila e histórico") },
        text = {
            LazyColumn(Modifier.fillMaxWidth().heightIn(max = 520.dp)) {
                if (snapshot.state in setOf("RUNNING", "QUEUED")) {
                    item {
                        OperationSnapshotBlock(snapshot, queue.size, context)
                        HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    }
                }

                item {
                    Text("Fila atual", fontWeight = FontWeight.Bold)
                    if (queue.isEmpty()) Text("Nenhuma operação aguardando.", style = MaterialTheme.typography.bodySmall)
                }

                items(queue, key = { "queue-" + it.id }) { request ->
                    QueueEntry(request, active = snapshot.id == request.id && snapshot.state == "RUNNING")
                }

                item {
                    Spacer(Modifier.height(10.dp))
                    Text("Histórico", fontWeight = FontWeight.Bold)
                    if (history.isEmpty()) Text("Nenhuma operação concluída ainda.", style = MaterialTheme.typography.bodySmall)
                }

                items(history.take(30), key = { "history-" + it.id }) { entry ->
                    HistoryEntry(entry)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Fechar") } },
        dismissButton = {
            if (history.isNotEmpty()) {
                TextButton(onClick = {
                    FileOperationEngine.clearHistory(context)
                    history = emptyList()
                }) { Text("Limpar histórico") }
            }
        }
    )
}

@Composable
private fun OperationSnapshotBlock(snapshot: FileOperationSnapshot, queueCount: Int, context: Context) {
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(snapshot.title, fontWeight = FontWeight.Bold)
            Text(if (snapshot.state == "QUEUED") "Na fila" else "${snapshot.percent}%")
        }
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = if (snapshot.state == "QUEUED") 0f else snapshot.percent.coerceIn(0, 100) / 100f,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(5.dp))
        Text(
            buildString {
                if (snapshot.speedBytesPerSec > 0L) append(formatProBytes(snapshot.speedBytesPerSec) + "/s")
                if (snapshot.etaSeconds >= 0L) {
                    if (isNotEmpty()) append(" • ")
                    append(formatEta(snapshot.etaSeconds))
                }
                if (queueCount > 1) {
                    if (isNotEmpty()) append(" • ")
                    append("$queueCount na fila")
                }
            }.ifBlank { snapshot.message.ifBlank { "Processando…" } },
            style = MaterialTheme.typography.bodySmall
        )
        if (snapshot.state == "RUNNING" && snapshot.id.isNotBlank()) {
            TextButton(onClick = { FileOperationEngine.cancelActive(context, snapshot.id) }) {
                Text("Cancelar operação atual")
            }
        }
    }
}

@Composable
private fun QueueEntry(request: FileOperationRequest, active: Boolean) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        color = if (active) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(Modifier.padding(9.dp)) {
            Text(
                (if (active) "Em execução • " else "") + FileOperationEngine.titleFor(request.type, false),
                fontWeight = FontWeight.SemiBold
            )
            Text(
                "${request.sources.size} item(ns)" +
                    if (request.destination.isNotBlank()) " • ${File(request.destination).name.ifBlank { "destino" }}" else "",
                style = MaterialTheme.typography.bodySmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun HistoryEntry(entry: FileOperationHistoryEntry) {
    val status = when (entry.state) {
        "DONE" -> "Concluída"
        "DONE_WITH_ERRORS" -> "Concluída com falhas"
        "CANCELLED" -> "Cancelada"
        "FAILED" -> "Falhou"
        else -> entry.state
    }

    Column(Modifier.fillMaxWidth().padding(vertical = 7.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(FileOperationEngine.titleFor(entry.type, false), fontWeight = FontWeight.SemiBold)
            Text(status, style = MaterialTheme.typography.bodySmall)
        }
        Text(
            buildString {
                append("${entry.successCount}/${entry.sourceCount} concluído(s)")
                if (entry.skippedCount > 0) append(" • ${entry.skippedCount} ignorado(s)")
                if (entry.failedCount > 0) append(" • ${entry.failedCount} falha(s)")
                if (entry.totalBytes > 0L) append(" • " + formatProBytes(entry.totalBytes))
            },
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(entry.finishedAt)),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        HorizontalDivider(Modifier.padding(top = 7.dp))
    }
}

@Composable
fun BatchRenameDialog(files: List<File>, onDismiss: () -> Unit, onApply: (BatchRenameOptions) -> Unit) {
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
    val conflicts = remember(files, options) { BatchRenameEngine.conflicts(files, options) }

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
                if (conflicts.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Text("Conflitos encontrados", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                    conflicts.take(4).forEach {
                        Text("• $it", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(enabled = conflicts.isEmpty(), onClick = { onApply(options) }) { Text("Aplicar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
fun ChecksumDialog(context: Context, file: File, onDismiss: () -> Unit) {
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

private fun formatProBytes(bytes: Long): String = when {
    bytes < 1024L -> "$bytes B"
    bytes < 1024L * 1024L -> String.format(Locale.getDefault(), "%.1f KB", bytes / 1024.0)
    bytes < 1024L * 1024L * 1024L -> String.format(Locale.getDefault(), "%.1f MB", bytes / (1024.0 * 1024.0))
    else -> String.format(Locale.getDefault(), "%.2f GB", bytes / (1024.0 * 1024.0 * 1024.0))
}

private fun formatEta(seconds: Long): String = when {
    seconds < 60L -> "~${seconds}s"
    seconds < 3600L -> "~${seconds / 60L} min"
    else -> "~${seconds / 3600L}h ${(seconds % 3600L) / 60L}min"
}
