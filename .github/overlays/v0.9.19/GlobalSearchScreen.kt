package com.nerdora.player.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.UniversalFileIndexCache
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun GlobalSearchScreen(
    mediaItems: List<NerdoraMedia>,
    onBack: () -> Unit,
    onOpenMedia: (NerdoraMedia) -> Unit,
    onOpenFileLocation: (String) -> Unit
) {
    val context = LocalContext.current
    var query by remember { mutableStateOf("") }
    var indexedPaths by remember { mutableStateOf<List<String>>(emptyList()) }

    LaunchedEffect(Unit) {
        indexedPaths = withContext(Dispatchers.IO) {
            runCatching { UniversalFileIndexCache.readPaths(context) }.getOrDefault(emptyList())
        }
    }

    val q = query.trim()
    val mediaResults = remember(q, mediaItems) {
        if (q.length < 2) emptyList() else mediaItems.filter { media ->
            listOf(media.title, media.artist, media.album, media.folder)
                .any { it.contains(q, ignoreCase = true) }
        }.take(30)
    }
    val fileResults = remember(q, indexedPaths) {
        if (q.length < 2) emptyList() else indexedPaths.filter { path ->
            File(path).name.contains(q, ignoreCase = true) ||
                File(path).parentFile?.name.orEmpty().contains(q, ignoreCase = true)
        }.take(50)
    }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, "Voltar") }
                Text("Busca global", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            }

            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp),
                leadingIcon = { Icon(Icons.Rounded.Search, null) },
                placeholder = { Text("Músicas, vídeos, imagens, documentos e arquivos...") },
                singleLine = true
            )

            Spacer(Modifier.size(8.dp))

            if (q.length < 2) {
                Text(
                    "Digite pelo menos 2 caracteres para pesquisar em toda a biblioteca e no índice de arquivos.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(18.dp)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    if (mediaResults.isNotEmpty()) {
                        item {
                            Text(
                                "Mídia",
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                        }
                        items(mediaResults, key = { "media:" + it.id }) { media ->
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .clickable { onOpenMedia(media) }
                                    .padding(horizontal = 16.dp, vertical = 11.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Rounded.Search, null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(Modifier.size(11.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(media.title, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(
                                        media.artist.ifBlank { media.folder },
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 10.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    if (fileResults.isNotEmpty()) {
                        item {
                            Text(
                                "Arquivos",
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                        }
                        items(fileResults, key = { "file:" + it }) { path ->
                            val file = File(path)
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .clickable { onOpenFileLocation(path) }
                                    .padding(horizontal = 16.dp, vertical = 11.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    if (file.isDirectory) Icons.Rounded.Folder else Icons.Rounded.Description,
                                    null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(Modifier.size(11.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(file.name.ifBlank { path }, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(
                                        file.parent.orEmpty(),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 10.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    if (mediaResults.isEmpty() && fileResults.isEmpty()) {
                        item {
                            Text(
                                "Nenhum resultado encontrado.",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
