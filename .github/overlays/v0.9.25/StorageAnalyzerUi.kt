package com.nerdora.player.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.nerdora.player.FileOperationEngine
import com.nerdora.player.FileOperationType
import com.nerdora.player.StorageAnalysisResult
import com.nerdora.player.StorageAnalyzer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

private enum class AnalyzerTab { OVERVIEW, LARGE, DUPLICATES, CLEANUP, RECENT }

@Composable
fun StorageAnalyzerDialog(context: Context, root: File, onDismiss: () -> Unit, onOpenFolder: (File) -> Unit) {
    val scope = rememberCoroutineScope()
    var result by remember { mutableStateOf<StorageAnalysisResult?>(null) }
    var loading by remember { mutableStateOf(true) }
    var tab by remember { mutableStateOf(AnalyzerTab.OVERVIEW) }
    var selected by remember { mutableStateOf<Set<String>>(emptySet()) }
    var confirm by remember { mutableStateOf(false) }

    fun refresh() {
        loading = true
        scope.launch {
            result = withContext(Dispatchers.IO) { StorageAnalyzer.analyze(root) }
            loading = false
        }
    }
    LaunchedEffect(root.absolutePath) { refresh() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Analisador de armazenamento") },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Fechar") } },
        dismissButton = { TextButton(onClick = ::refresh, enabled = !loading) { Text("Atualizar") } },
        text = {
            Column(Modifier.fillMaxWidth().heightIn(max = 650.dp)) {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        AnalyzerTab.OVERVIEW to "Resumo",
                        AnalyzerTab.LARGE to "Grandes",
                        AnalyzerTab.DUPLICATES to "Duplicados",
                        AnalyzerTab.CLEANUP to "Limpeza",
                        AnalyzerTab.RECENT to "Recentes"
                    ).forEach { pair ->
                        FilterChip(selected = tab == pair.first, onClick = { tab = pair.first }, label = { Text(pair.second) })
                    }
                }
                Spacer(Modifier.height(8.dp))
                if (loading) {
                    LinearProgressIndicator(Modifier.fillMaxWidth())
                    Spacer(Modifier.height(8.dp))
                    Text("Analisando arquivos, pastas e duplicados…")
                } else {
                    val r = result
                    if (r != null) {
                        if (r.lowStorage) {
                            Surface(color = MaterialTheme.colorScheme.errorContainer, shape = MaterialTheme.shapes.medium) {
                                Text("Armazenamento quase cheio • " + formatAnalyzerBytes(r.freeBytes) + " livres", Modifier.padding(10.dp), fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(8.dp))
                        }
                        when (tab) {
                            AnalyzerTab.OVERVIEW -> AnalyzerOverview(r)
                            AnalyzerTab.LARGE -> AnalyzerLarge(r, onOpenFolder)
                            AnalyzerTab.DUPLICATES -> AnalyzerDuplicates(r, onOpenFolder)
                            AnalyzerTab.CLEANUP -> AnalyzerCleanup(r, selected) { path, checked -> selected = if (checked) selected + path else selected - path }
                            AnalyzerTab.RECENT -> AnalyzerRecent(r, onOpenFolder)
                        }
                        if (tab == AnalyzerTab.CLEANUP && selected.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            Button(onClick = { confirm = true }, modifier = Modifier.fillMaxWidth()) {
                                Text("Revisar exclusão • " + selected.size + " item(ns)")
                            }
                        }
                    }
                }
            }
        }
    )

    if (confirm) {
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = { Text("Pré-visualização da limpeza") },
            text = { Text("Somente os itens selecionados serão excluídos. Nada é removido automaticamente.") },
            confirmButton = {
                Button(onClick = {
                    runCatching { FileOperationEngine.enqueueBulk(context, selected.toList(), FileOperationType.DELETE) }
                        .onSuccess {
                            Toast.makeText(context, "Limpeza adicionada à fila.", Toast.LENGTH_LONG).show()
                            selected = emptySet()
                            confirm = false
                        }
                        .onFailure { Toast.makeText(context, it.message ?: "Falha ao iniciar limpeza.", Toast.LENGTH_LONG).show() }
                }) { Text("Excluir selecionados") }
            },
            dismissButton = { TextButton(onClick = { confirm = false }) { Text("Cancelar") } }
        )
    }
}

@Composable
private fun AnalyzerOverview(r: StorageAnalysisResult) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        item {
            Text(formatAnalyzerBytes(r.usedBytes) + " usados de " + formatAnalyzerBytes(r.totalBytes), fontWeight = FontWeight.Bold)
            Text(formatAnalyzerBytes(r.freeBytes) + " livres • " + r.scannedFiles + " arquivos • " + r.scannedFolders + " pastas", style = MaterialTheme.typography.bodySmall)
            if (r.scanLimited) Text("A varredura atingiu o limite de segurança.", color = MaterialTheme.colorScheme.tertiary)
        }
        items(r.categoryUsage) { c ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(c.category.label)
                Text(formatAnalyzerBytes(c.bytes) + " • " + c.count)
            }
            val progress = if (r.usedBytes > 0L) (c.bytes.toFloat() / r.usedBytes.toFloat()).coerceIn(0f, 1f) else 0f
            LinearProgressIndicator(progress = progress, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun AnalyzerLarge(r: StorageAnalysisResult, onOpenFolder: (File) -> Unit) {
    LazyColumn {
        item { Text("Arquivos grandes", fontWeight = FontWeight.Bold) }
        items(r.largeFiles) { f -> AnalyzerRow(f, formatAnalyzerBytes(f.length())) { onOpenFolder(f.parentFile ?: f) } }
        item { Spacer(Modifier.height(10.dp)); Text("Pastas grandes", fontWeight = FontWeight.Bold) }
        items(r.largeFolders) { pair -> AnalyzerRow(pair.first, formatAnalyzerBytes(pair.second)) { onOpenFolder(pair.first) } }
    }
}

@Composable
private fun AnalyzerDuplicates(r: StorageAnalysisResult, onOpenFolder: (File) -> Unit) {
    LazyColumn {
        if (r.duplicateGroups.isEmpty()) item { Text("Nenhum duplicado confirmado por SHA-256.") }
        r.duplicateGroups.forEach { group ->
            item { Text(group.files.size.toString() + " cópias • " + formatAnalyzerBytes(group.size), fontWeight = FontWeight.Bold) }
            items(group.files) { f -> AnalyzerRow(f, f.parent ?: "") { onOpenFolder(f.parentFile ?: f) } }
            item { HorizontalDivider() }
        }
    }
}

@Composable
private fun AnalyzerCleanup(r: StorageAnalysisResult, selected: Set<String>, onChecked: (String, Boolean) -> Unit) {
    LazyColumn {
        item { Text("Limpeza segura", fontWeight = FontWeight.Bold); Text("Revise antes de excluir.", style = MaterialTheme.typography.bodySmall) }
        if (r.cleanupCandidates.isEmpty()) item { Text("Nenhum temporário ou download duplicado encontrado.") }
        items(r.cleanupCandidates) { c ->
            Row(Modifier.fillMaxWidth().clickable { onChecked(c.file.absolutePath, c.file.absolutePath !in selected) }.padding(vertical = 4.dp)) {
                Checkbox(checked = c.file.absolutePath in selected, onCheckedChange = { onChecked(c.file.absolutePath, it) })
                Column(Modifier.weight(1f)) {
                    Text(c.file.name, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(c.reason + " • " + formatAnalyzerBytes(c.file.length()), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun AnalyzerRecent(r: StorageAnalysisResult, onOpenFolder: (File) -> Unit) {
    LazyColumn {
        items(r.recentFiles) { f -> AnalyzerRow(f, formatAnalyzerBytes(f.length())) { onOpenFolder(f.parentFile ?: f) } }
    }
}

@Composable
private fun AnalyzerRow(file: File, detail: String, onClick: () -> Unit) {
    Column(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 5.dp)) {
        Text(file.name.ifBlank { file.absolutePath }, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(detail, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

private fun formatAnalyzerBytes(value: Long): String {
    if (value < 1024L) return value.toString() + " B"
    val kb = value / 1024.0
    if (kb < 1024.0) return String.format("%.1f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
