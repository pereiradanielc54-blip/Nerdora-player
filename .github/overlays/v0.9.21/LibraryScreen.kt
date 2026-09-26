package com.nerdora.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Sort
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nerdora.player.PlayerPreferences
import com.nerdora.player.model.LibrarySort
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia

private data class LibraryMode(val id: String, val label: String)

@Composable
fun LibraryScreen(
    items: List<NerdoraMedia>,
    favoriteIds: Set<String>,
    recentIds: List<String>,
    initialMode: String = "ALL",
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit,
    onRefresh: () -> Unit,
    onFavorite: (String, Boolean) -> Unit,
    onHideToVault: (List<NerdoraMedia>) -> Unit,
    onDeletePermanently: (List<NerdoraMedia>) -> Unit,
    onShare: (List<NerdoraMedia>) -> Unit
) {
    val context = LocalContext.current
    val modes = remember {
        listOf(
            LibraryMode("ALL", "Tudo"),
            LibraryMode("IMAGE", "Fotos"),
            LibraryMode("VIDEO", "Vídeos"),
            LibraryMode("AUDIO", "Músicas"),
            LibraryMode("FOLDERS", "Pastas"),
            LibraryMode("FAVORITES", "Favoritos"),
            LibraryMode("RECENT", "Recentes")
        )
    }

    var query by rememberSaveable { mutableStateOf("") }
    var modeName by rememberSaveable { mutableStateOf(initialMode) }
    var folderName by rememberSaveable { mutableStateOf<String?>(null) }
    var sortName by rememberSaveable { mutableStateOf(LibrarySort.NEWEST.name) }
    var sortMenu by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf(setOf<String>()) }
    var gridSize by remember { mutableStateOf(PlayerPreferences.gridSize(context)) }

    LaunchedEffect(initialMode) {
        modeName = initialMode
        folderName = null
        query = ""
        selected = emptySet()
    }

    val sort = runCatching { LibrarySort.valueOf(sortName) }.getOrDefault(LibrarySort.NEWEST)
    val byId = remember(items) { items.associateBy { it.id } }
    val mode = modes.firstOrNull { it.id == modeName } ?: modes.first()

    val normalFiltered = remember(items, favoriteIds, query, modeName, folderName, sortName) {
        val source = items.filter { media ->
            val modeOk = when (modeName) {
                "IMAGE" -> media.kind == MediaKind.IMAGE
                "VIDEO" -> media.kind == MediaKind.VIDEO
                "AUDIO" -> media.kind == MediaKind.AUDIO
                "FAVORITES" -> favoriteIds.contains(media.id)
                "FOLDERS" -> folderName == null || media.folder.ifBlank { "Outros" } == folderName
                else -> true
            }
            val q = query.trim().lowercase()
            val searchOk = q.isBlank() || listOf(media.title, media.artist, media.album, media.folder)
                .any { it.lowercase().contains(q) }
            modeOk && searchOk
        }
        sortMedia(source, sort)
    }

    val recentFiltered = remember(items, recentIds, query) {
        recentIds.mapNotNull(byId::get).filter { media ->
            val q = query.trim().lowercase()
            q.isBlank() || listOf(media.title, media.artist, media.album, media.folder)
                .any { it.lowercase().contains(q) }
        }
    }

    val filtered = if (modeName == "RECENT") recentFiltered else normalFiltered
    val folders = remember(items, query) {
        val q = query.trim().lowercase()
        items.groupBy { it.folder.ifBlank { "Outros" } }
            .toList()
            .filter { (name, _) -> q.isBlank() || name.lowercase().contains(q) }
            .sortedByDescending { it.second.size }
    }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            if (selected.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant).padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { selected = emptySet() }) { Icon(Icons.Rounded.Close, "Cancelar") }
                    Text("${selected.size} selecionado(s)", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
                    IconButton(onClick = {
                        selected.forEach { id -> onFavorite(id, true) }
                        selected = emptySet()
                    }) { Icon(Icons.Rounded.Favorite, "Favoritar") }
                    IconButton(onClick = {
                        onShare(filtered.filter { selected.contains(it.id) })
                        selected = emptySet()
                    }) { Icon(Icons.Rounded.Share, "Compartilhar") }
                    IconButton(onClick = {
                        val chosen = filtered.filter { selected.contains(it.id) }
                        if (chosen.isNotEmpty()) onHideToVault(chosen)
                        selected = emptySet()
                    }) { Icon(Icons.Rounded.Lock, "Mover para o Cofre") }
                    IconButton(onClick = {
                        val chosen = filtered.filter { selected.contains(it.id) }
                        if (chosen.isNotEmpty()) onDeletePermanently(chosen)
                        selected = emptySet()
                    }) { Icon(Icons.Rounded.Delete, "Excluir definitivamente") }
                }
            } else {
                Column(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            folderName ?: "Biblioteca",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = onRefresh) { Icon(Icons.Rounded.Refresh, "Atualizar") }
                        Box {
                            IconButton(onClick = { sortMenu = true }) { Icon(Icons.Rounded.Sort, "Ordenar") }
                            DropdownMenu(expanded = sortMenu, onDismissRequest = { sortMenu = false }) {
                                LibrarySort.entries.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option.label) },
                                        onClick = { sortName = option.name; sortMenu = false }
                                    )
                                }
                            }
                        }
                    }

                    if (folderName != null) {
                        TextButton(onClick = { folderName = null; query = "" }) {
                            Text("‹ Voltar para Pastas")
                        }
                    }

                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        leadingIcon = { Icon(Icons.Rounded.Search, null) },
                        placeholder = { Text(if (modeName == "FOLDERS" && folderName == null) "Buscar pastas..." else "Buscar na biblioteca...") }
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        modes.forEach { option ->
                            FilterChip(
                                selected = modeName == option.id,
                                onClick = {
                                    modeName = option.id
                                    folderName = null
                                    query = ""
                                    selected = emptySet()
                                },
                                label = { Text(option.label) },
                                leadingIcon = when (option.id) {
                                    "FOLDERS" -> ({ Icon(Icons.Rounded.Folder, null, modifier = Modifier.size(17.dp)) })
                                    "FAVORITES" -> ({ Icon(Icons.Rounded.Favorite, null, modifier = Modifier.size(17.dp)) })
                                    else -> null
                                }
                            )
                        }
                    }

                    if (!(modeName == "FOLDERS" && folderName == null)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf(0 to "Compacta", 1 to "Normal", 2 to "Grande").forEach { (value, label) ->
                                FilterChip(
                                    selected = gridSize == value,
                                    onClick = {
                                        gridSize = value
                                        PlayerPreferences.setGridSize(context, value)
                                    },
                                    label = { Text(label) }
                                )
                            }
                        }
                    }

                    Text(
                        when {
                            modeName == "FOLDERS" && folderName == null -> "${folders.size} pastas • organização por mídia"
                            modeName == "RECENT" -> "${filtered.size} itens • ordem de abertura"
                            else -> "${filtered.size} itens • ${sort.label}"
                        },
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }

            if (modeName == "FOLDERS" && folderName == null && selected.isEmpty()) {
                if (folders.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Nenhuma pasta de mídia encontrada", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        items(folders, key = { it.first }) { (name, groupItems) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(15.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable { folderName = name; query = "" }
                                    .padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(68.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val thumb = groupItems.firstOrNull()?.thumbnailUrl ?: groupItems.firstOrNull()?.url
                                    if (thumb != null) {
                                        AsyncImage(
                                            model = thumb,
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Icon(Icons.Rounded.Folder, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(34.dp))
                                    }
                                }
                                Spacer(Modifier.size(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("${groupItems.size} itens", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                                }
                                Icon(Icons.Rounded.Folder, null, tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            } else if (filtered.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Nenhuma mídia encontrada", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(when (gridSize) { 0 -> 112.dp; 2 -> 180.dp; else -> 145.dp }),
                    modifier = Modifier.fillMaxSize().padding(horizontal = 3.dp),
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    itemsIndexed(filtered, key = { _, item -> item.id }) { index, item ->
                        MediaCard(
                            media = item,
                            modifier = Modifier.fillMaxWidth().height(205.dp),
                            selected = selected.contains(item.id),
                            onClick = {
                                if (selected.isNotEmpty()) {
                                    selected = if (selected.contains(item.id)) selected - item.id else selected + item.id
                                } else onOpenItems(filtered, index)
                            },
                            onLongClick = {
                                selected = if (selected.contains(item.id)) selected - item.id else selected + item.id
                            }
                        )
                    }
                }
            }
        }
    }
}
