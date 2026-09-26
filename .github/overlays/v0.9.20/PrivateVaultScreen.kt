package com.nerdora.player.ui

import android.content.Context
import android.widget.Toast
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

@Composable
fun PrivateVaultScreen(
    context: Context,
    entries: List<PrivateVaultEntry>,
    legacyItems: List<NerdoraMedia>,
    onBack: () -> Unit,
    onOpenEntry: (PrivateVaultEntry) -> Unit,
    onChanged: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var deleteTarget by remember { mutableStateOf<PrivateVaultEntry?>(null) }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, "Voltar") }
                Column(Modifier.weight(1f)) {
                    Text("Cofre privado", fontSize = 23.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Arquivos movidos para a área privada do Nerdora.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Icon(Icons.Rounded.Lock, null, tint = MaterialTheme.colorScheme.primary)
            }

            Surface(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    "O Cofre não usa apenas .nomedia: o arquivo sai do armazenamento compartilhado. Gerenciadores comuns não conseguem vê-lo. Restaure os arquivos antes de desinstalar o Nerdora Player.",
                    modifier = Modifier.padding(12.dp),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (entries.isEmpty() && legacyItems.isEmpty()) {
                    item {
                        Box(
                            Modifier.fillParentMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("O Cofre privado está vazio", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                if (entries.isNotEmpty()) {
                    item {
                        Text(
                            "Protegidos de verdade",
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
                                .clickable(enabled = !entry.isDirectory) { onOpenEntry(entry) },
                            shape = RoundedCornerShape(14.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Row(
                                Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
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
                                        entry.originalPath,
                                        fontSize = 9.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
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
                            "Esses itens eram apenas escondidos dentro do Nerdora. Use “Proteger agora” para movê-los fisicamente para o Cofre.",
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
                            Row(
                                Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
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
