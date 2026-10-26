package com.nerdora.player.ui

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.database.Cursor
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import android.widget.Toast
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.Locale

private data class ManagedDownload(
    val id: Long,
    val title: String,
    val status: Int,
    val downloaded: Long,
    val total: Long,
    val reason: Int
)

@Composable
fun DownloadsManagerScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val manager = remember(context) {
        context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    }
    var url by remember { mutableStateOf("") }
    var downloads by remember { mutableStateOf<List<ManagedDownload>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    suspend fun refresh() {
        loading = true
        downloads = withContext(Dispatchers.IO) {
            val result = mutableListOf<ManagedDownload>()
            val cursor: Cursor? = runCatching { manager.query(DownloadManager.Query().setFilterByStatus(
                DownloadManager.STATUS_PENDING or DownloadManager.STATUS_RUNNING or
                    DownloadManager.STATUS_PAUSED or DownloadManager.STATUS_SUCCESSFUL or
                    DownloadManager.STATUS_FAILED
            )) }.getOrNull()
            cursor?.use { c ->
                val idCol = c.getColumnIndex(DownloadManager.COLUMN_ID)
                val titleCol = c.getColumnIndex(DownloadManager.COLUMN_TITLE)
                val statusCol = c.getColumnIndex(DownloadManager.COLUMN_STATUS)
                val downloadedCol = c.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                val totalCol = c.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                val reasonCol = c.getColumnIndex(DownloadManager.COLUMN_REASON)
                while (c.moveToNext()) {
                    result += ManagedDownload(
                        id = c.getLong(idCol),
                        title = c.getString(titleCol) ?: "Download",
                        status = c.getInt(statusCol),
                        downloaded = c.getLong(downloadedCol),
                        total = c.getLong(totalCol),
                        reason = c.getInt(reasonCol)
                    )
                }
            }
            result.sortedByDescending { it.id }
        }
        loading = false
    }

    LaunchedEffect(manager, refreshTrigger) {
        while (true) {
            refresh()
            delay(1500)
        }
    }

    fun enqueueDownload() {
        val raw = url.trim()
        val uri = runCatching { Uri.parse(raw) }.getOrNull()
        val host = uri?.host?.lowercase(Locale.ROOT).orEmpty()
        if (uri == null || uri.scheme !in listOf("http", "https") || host.isBlank() ||
            uri.userInfo != null || host == "youtube.com" || host.endsWith(".youtube.com") ||
            host == "youtu.be" || host.endsWith(".youtu.be") ||
            host == "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com")) {
            Toast.makeText(context, "Use um link direto HTTP/HTTPS autorizado. Links do YouTube não são baixados.", Toast.LENGTH_LONG).show()
            return
        }
        val rawName = uri.lastPathSegment?.substringAfterLast('/')?.takeIf { it.isNotBlank() }
            ?: "nerdora-download-${System.currentTimeMillis()}.bin"
        val safeName = rawName.replace(Regex("[\\\\/:*?\"<>|\\p{Cntrl}]"), "_").take(160)
        runCatching {
            val request = DownloadManager.Request(uri)
                .setTitle(safeName)
                .setDescription("Nerdora Player • Downloads autorizados")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI or DownloadManager.Request.NETWORK_MOBILE)
                .setAllowedOverRoaming(false)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeName)
            manager.enqueue(request)
        }.onSuccess {
            url = ""
            Toast.makeText(context, "Download adicionado à fila do Android.", Toast.LENGTH_SHORT).show()
        }.onFailure {
            Toast.makeText(context, "Não foi possível iniciar: ${it.message ?: "erro"}", Toast.LENGTH_LONG).show()
        }
    }

    fun statusLabel(item: ManagedDownload): String = when (item.status) {
        DownloadManager.STATUS_PENDING -> "Na fila"
        DownloadManager.STATUS_RUNNING -> "Baixando"
        DownloadManager.STATUS_PAUSED -> "Pausado pelo sistema"
        DownloadManager.STATUS_SUCCESSFUL -> "Concluído • Downloads"
        DownloadManager.STATUS_FAILED -> "Falhou (código ${item.reason})"
        else -> "Estado desconhecido"
    }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onBack) { Text("Voltar") }
                Text("Gerenciador de downloads", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                IconButton(onClick = { refreshTrigger++ }) { Icon(Icons.Rounded.Refresh, contentDescription = "Atualização automática") }
            }
            Text("Baixe arquivos por links diretos autorizados. O Android mantém a fila e as notificações; arquivos concluídos ficam na pasta Downloads.", style = MaterialTheme.typography.bodySmall)
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("URL direta do arquivo") },
                placeholder = { Text("https://site.com/arquivo.mp4") },
                singleLine = true
            )
            Button(onClick = ::enqueueDownload, enabled = url.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Add, contentDescription = null)
                Text("Adicionar download", modifier = Modifier.padding(start = 8.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Fila e histórico", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                if (loading) CircularProgressIndicator()
                Text("${downloads.size}")
            }
            if (downloads.isEmpty()) {
                Text("Nenhum download encontrado. Cole um link direto acima para começar.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(downloads, key = { it.id }) { item ->
                        Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors()) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Rounded.Download, contentDescription = null)
                                    Text(item.title, modifier = Modifier.weight(1f), fontWeight = FontWeight.Medium)
                                    IconButton(onClick = {
                                        manager.remove(item.id)
                                    }) { Icon(Icons.Rounded.Delete, contentDescription = "Remover download") }
                                }
                                Text(statusLabel(item), style = MaterialTheme.typography.bodySmall)
                                if (item.total > 0 && item.status != DownloadManager.STATUS_SUCCESSFUL) {
                                    LinearProgressIndicator(
                                        progress = { (item.downloaded.toFloat() / item.total.toFloat()).coerceIn(0f, 1f) },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                } else if (item.status == DownloadManager.STATUS_RUNNING && item.total <= 0) {
                                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                                }
                                Text("${formatDownloadBytes(item.downloaded)} / ${if (item.total > 0) formatDownloadBytes(item.total) else "tamanho desconhecido"}", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }
            Text("Limite desta primeira versão: a API de downloads do Android gerencia fila, retomadas quando suportadas e notificações; o app não extrai streams, não remove DRM e não baixa vídeos de páginas como YouTube.", style = MaterialTheme.typography.labelSmall)
        }
    }
}

private fun formatDownloadBytes(value: Long): String {
    if (value < 1024) return "${value} B"
    val kb = value / 1024.0
    if (kb < 1024) return String.format(Locale.getDefault(), "%.1f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format(Locale.getDefault(), "%.1f MB", mb)
    return String.format(Locale.getDefault(), "%.2f GB", mb / 1024.0)
}
