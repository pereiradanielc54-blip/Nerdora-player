package com.nerdora.player.ui

import android.content.Context
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.DeleteForever
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.LibraryStore
import com.nerdora.player.PrivateVaultEntry
import com.nerdora.player.PrivateVaultStore
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale

@Composable
fun PrivateVaultScreen(
    context: Context,
    entries: List<PrivateVaultEntry>,
    legacyItems: List<NerdoraMedia>,
    onBack: () -> Unit,
    onOpenFile: (File, String) -> Unit,
    onChanged: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var deleteTarget by remember { mutableStateOf<PrivateVaultEntry?>(null) }
    var folderEntry by remember { mutableStateOf<PrivateVaultEntry?>(null) }
    var currentDirectory by remember { mutableStateOf<File?>(null) }

    val activeEntry = folderEntry
    val activeRoot = activeEntry?.let { PrivateVaultStore.storedFile(context, it) }
    val browsingFolder = activeEntry != null && currentDirectory != null

    fun leaveFolderBrowser() {
        folderEntry = null
        currentDirectory = null
    }

    BackHandler(enabled = browsingFolder) {
        val current = currentDirectory
        val root = activeRoot
        if (current != null && root != null && current.absolutePath != root.absolutePath) {
            currentDirectory = current.parentFile?.takeIf {
                it.absolutePath.startsWith(root.absolutePath)
            } ?: root
        } else {
            leaveFolderBrowser()
        }
    }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    if (browsingFolder) {
                        val current = currentDirectory
                        val root = activeRoot
                        if (current != null && root != null && current.absolutePath != root.absolutePath) {
                            currentDirectory = current.parentFile?.takeIf { it.absolutePath.startsWith(root.absolutePath) } ?: root
                        } else leaveFolderBrowser()
                    } else onBack()
                }) { Icon(Icons.Rounded.ArrowBack, "Voltar") }
                Column(Modifier.weight(1f)) {
                    Text(
                        if (browsingFolder) activeEntry?.displayName ?: "Pasta protegida" else "Cofre privado",
                        fontSize = 23.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        if (browsingFolder) {
                            currentDirectory?.relativeToOrNull(activeRoot ?: currentDirectory!!)?.path?.ifBlank { "Raiz da pasta" }
                                ?: "Conteúdo protegido"
                        } else {
                            "Arquivos fora do armazenamento compartilhado."
                        },
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Icon(Icons.Rounded.Lock, null, tint = MaterialTheme.colorScheme.primary)
            }

            if (!browsingFolder) {
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        "O arquivo sai da pasta original e fica na área privada do Nerdora. Pastas protegidas agora podem ser abertas e navegadas aqui.",
                        modifier = Modifier.padding(12.dp),
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            if (browsingFolder) {
                val children = remember(currentDirectory?.absolutePath) {
                    currentDirectory?.listFiles()?.toList()
                        ?.sortedWith(compareByDescending<File> { it.isDirectory }.thenBy { it.name.lowercase(Locale.ROOT) })
                        .orEmpty()
                }
                if (children.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Esta pasta está vazia", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        items(children, key = { it.absolutePath }) { file ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp)
                                    .clickable {
                                        if (file.isDirectory) currentDirectory = file
                                        else onOpenFile(file, file.name)
                                    },
                                shape = RoundedCornerShape(13.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        if (file.isDirectory) Icons.Rounded.Folder else Icons.Rounded.Description,
                                        null,
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(Modifier.size(10.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(file.name, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text(
                                            if (file.isDirectory) "Pasta protegida" else formatVaultSize(file.length()),
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (entries.isEmpty() && legacyItems.isEmpty()) {
                        item {
                            Box(Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) {
                                Text("O Cofre privado está vazio", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    if (entries.isNotEmpty()) {
                        item {
                            Text(
                                "Protegidos",
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        items(entries, key = { it.id }) { entry ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp)
                                    .clickable {
                                        val stored = PrivateVaultStore.storedFile(context, entry)
                                        if (entry.isDirectory) {
                                            folderEntry = entry
                                            currentDirectory = stored
                                        } else {
                                            onOpenFile(stored, entry.displayName)
                                        }
                                    },
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        if (entry.isDirectory) Icons.Rounded.Folder else Icons.Rounded.Lock,
                                        null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(32.dp)
                                    )
                                    Spacer(Modifier.size(10.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(entry.displayName, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text(
                                            if (entry.isDirectory) "Pasta protegida • ${formatVaultSize(entry.sizeBytes)}"
                                            else formatVaultSize(entry.sizeBytes),
                                            fontSize = 9.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 1
                                        )
                                    }
                                    TextButton(onClick = {
                                        scope.launch {
                                            val result = withContext(Dispatchers.IO) { PrivateVaultStore.restore(context, entry) }
                                            Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                                            if (result.success) onChanged()
                                        }
                                    }) {
                                        Icon(Icons.Rounded.Refresh, null, modifier = Modifier.size(17.dp))
                                        Text(" Restaurar")
                                    }
                                    IconButton(onClick = { deleteTarget = entry }) {
                                        Icon(Icons.Rounded.DeleteForever, "Excluir definitivamente")
                                    }
                                }
                            }
                        }
                    }

                    if (legacyItems.isNotEmpty()) {
                        item {
                            Text(
                                "Ocultos antigos",
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                color = MaterialTheme.colorScheme.secondary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        item {
                            Text(
                                "Esses itens eram apenas escondidos na Biblioteca. Use “Proteger agora” para migrá-los ao Cofre real.",
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp),
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        items(legacyItems, key = { it.id }) { media ->
                            Surface(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Rounded.Lock, null, tint = MaterialTheme.colorScheme.secondary)
                                    Spacer(Modifier.size(10.dp))
                                    Text(media.title, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    TextButton(onClick = {
                                        scope.launch {
                                            val result = withContext(Dispatchers.IO) { PrivateVaultStore.hideMedia(context, media) }
                                            Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                                            if (result.success) {
                                                LibraryStore.setHidden(context, media.id, false)
                                                onChanged()
                                            }
                                        }
                                    }) { Text("Proteger agora") }
                                }
                            }
                        }
                    }

                    item { Spacer(Modifier.height(20.dp)) }
                }
            }
        }
    }

    deleteTarget?.let { entry ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Excluir definitivamente?") },
            text = { Text("${entry.displayName} será apagado do Cofre e não poderá ser recuperado.") },
            confirmButton = {
                TextButton(onClick = {
                    deleteTarget = null
                    scope.launch {
                        val result = withContext(Dispatchers.IO) { PrivateVaultStore.deletePermanently(context, entry) }
                        Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                        if (result.success) onChanged()
                    }
                }) { Text("Excluir") }
            },
            dismissButton = { TextButton(onClick = { deleteTarget = null }) { Text("Cancelar") } }
        )
    }
}

private fun formatVaultSize(bytes: Long): String = when {
    bytes < 1024L -> "$bytes B"
    bytes < 1024L * 1024L -> String.format(Locale.getDefault(), "%.1f KB", bytes / 1024.0)
    bytes < 1024L * 1024L * 1024L -> String.format(Locale.getDefault(), "%.1f MB", bytes / (1024.0 * 1024.0))
    else -> String.format(Locale.getDefault(), "%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0))
}
