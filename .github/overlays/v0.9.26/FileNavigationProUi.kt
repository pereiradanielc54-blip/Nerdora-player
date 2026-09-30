package com.nerdora.player.ui

import android.content.Context
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import java.io.File

enum class NerdoraFileViewMode { LIST, GRID }
enum class NerdoraSortField { NAME, DATE, SIZE, TYPE }
enum class NerdoraIconSize { SMALL, MEDIUM, LARGE }

data class FileNavigationSettings(
    val viewMode: NerdoraFileViewMode = NerdoraFileViewMode.LIST,
    val showHidden: Boolean = false,
    val sortField: NerdoraSortField = NerdoraSortField.NAME,
    val ascending: Boolean = true,
    val iconSize: NerdoraIconSize = NerdoraIconSize.MEDIUM
)

object FileNavigationPrefs {
    private const val PREF = "nerdora_file_navigation_pro"
    private fun prefs(context: Context) = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    fun read(context: Context): FileNavigationSettings {
        val p = prefs(context)
        return FileNavigationSettings(
            viewMode = runCatching { NerdoraFileViewMode.valueOf(p.getString("view", "LIST") ?: "LIST") }.getOrDefault(NerdoraFileViewMode.LIST),
            showHidden = p.getBoolean("hidden", false),
            sortField = runCatching { NerdoraSortField.valueOf(p.getString("sort", "NAME") ?: "NAME") }.getOrDefault(NerdoraSortField.NAME),
            ascending = p.getBoolean("asc", true),
            iconSize = runCatching { NerdoraIconSize.valueOf(p.getString("icon_size", "MEDIUM") ?: "MEDIUM") }.getOrDefault(NerdoraIconSize.MEDIUM)
        )
    }

    fun write(context: Context, s: FileNavigationSettings) {
        prefs(context).edit()
            .putString("view", s.viewMode.name)
            .putBoolean("hidden", s.showHidden)
            .putString("sort", s.sortField.name)
            .putBoolean("asc", s.ascending)
            .putString("icon_size", s.iconSize.name)
            .apply()
    }

    fun favorites(context: Context): Set<String> =
        prefs(context).getStringSet("folder_favorites", emptySet())?.toSet().orEmpty()

    fun toggleFavorite(context: Context, folder: File) {
        val next = favorites(context).toMutableSet()
        if (!next.add(folder.absolutePath)) next.remove(folder.absolutePath)
        prefs(context).edit().putStringSet("folder_favorites", next).apply()
    }

    fun recentFolders(context: Context): List<String> =
        prefs(context).getString("recent_folders", "").orEmpty()
            .split('\n').filter { it.isNotBlank() }

    fun rememberFolder(context: Context, folder: File) {
        val next = (listOf(folder.absolutePath) + recentFolders(context)).distinct().take(12)
        prefs(context).edit().putString("recent_folders", next.joinToString("\n")).apply()
    }

    fun searchHistory(context: Context): List<String> =
        prefs(context).getString("search_history", "").orEmpty()
            .split('\n').filter { it.isNotBlank() }

    fun rememberSearch(context: Context, query: String) {
        val clean = query.trim()
        if (clean.length < 2) return
        val next = (listOf(clean) + searchHistory(context)).distinct().take(20)
        prefs(context).edit().putString("search_history", next.joinToString("\n")).apply()
    }

    fun clearSearchHistory(context: Context) {
        prefs(context).edit().remove("search_history").apply()
    }

    fun savedTabs(context: Context): List<String> =
        prefs(context).getString("open_tabs", "").orEmpty()
            .split('\n').filter { it.isNotBlank() }

    fun saveTabs(context: Context, tabs: List<String>) {
        prefs(context).edit().putString("open_tabs", tabs.distinct().take(6).joinToString("\n")).apply()
    }
}

fun applyNavigationSettings(files: List<File>, settings: FileNavigationSettings): List<File> {
    val filtered = if (settings.showHidden) files else files.filterNot { it.name.startsWith('.') }
    val comparator = when (settings.sortField) {
        NerdoraSortField.NAME -> compareBy<File> { it.name.lowercase() }
        NerdoraSortField.DATE -> compareBy<File> { it.lastModified() }
        NerdoraSortField.SIZE -> compareBy<File> { if (it.isFile) it.length() else 0L }
        NerdoraSortField.TYPE -> compareBy<File> { if (it.isDirectory) "" else it.extension.lowercase() }.thenBy { it.name.lowercase() }
    }
    val sorted = filtered.sortedWith(compareByDescending<File> { it.isDirectory }.then(comparator))
    return if (settings.ascending) sorted else sorted.reversed()
}

fun navigationIconDp(size: NerdoraIconSize): Dp = when (size) {
    NerdoraIconSize.SMALL -> 34.dp
    NerdoraIconSize.MEDIUM -> 46.dp
    NerdoraIconSize.LARGE -> 60.dp
}

fun navigationGridColumns(size: NerdoraIconSize): Int = when (size) {
    NerdoraIconSize.SMALL -> 4
    NerdoraIconSize.MEDIUM -> 3
    NerdoraIconSize.LARGE -> 2
}

@Composable
fun FileBreadcrumbBar(root: File, folder: File?, onNavigate: (File?) -> Unit) {
    val current = folder ?: root
    val rootPath = root.absolutePath.trimEnd(File.separatorChar)
    val relative = current.absolutePath.removePrefix(rootPath).trim(File.separatorChar)
    val segments = if (relative.isBlank()) emptyList() else relative.split(File.separatorChar)
    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
            .padding(horizontal = 12.dp, vertical = 3.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        TextButton(onClick = { onNavigate(null) }) { Text("Armazenamento") }
        var acc = root
        segments.forEach { segment ->
            Text("›", modifier = Modifier.padding(top = 12.dp))
            acc = File(acc, segment)
            val target = acc
            TextButton(onClick = { onNavigate(target) }) {
                Text(segment, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun FileTabsBar(
    tabs: List<String>,
    activeIndex: Int,
    onSwitch: (Int, File) -> Unit,
    onAdd: () -> Unit,
    onClose: (Int) -> Unit
) {
    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
            .padding(horizontal = 10.dp, vertical = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        tabs.forEachIndexed { index, path ->
            val file = File(path)
            val selected = index == activeIndex
            FilterChip(
                selected = selected,
                onClick = { onSwitch(index, file) },
                label = {
                    Text(
                        file.name.ifBlank { "Armazenamento" },
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                trailingIcon = {
                    if (tabs.size > 1) {
                        TextButton(
                            onClick = { onClose(index) },
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.size(28.dp)
                        ) { Text("×") }
                    }
                }
            )
        }
        AssistChip(onClick = onAdd, label = { Text("+ Aba") })
    }
}

@Composable
fun FileNavigationToolbar(
    context: Context,
    currentFolder: File,
    settings: FileNavigationSettings,
    onSettings: (FileNavigationSettings) -> Unit,
    onOpen: (File) -> Unit
) {
    var sortMenu by remember { mutableStateOf(false) }
    var sizeMenu by remember { mutableStateOf(false) }
    var favoriteEpoch by remember { mutableIntStateOf(0) }
    val favorites = remember(favoriteEpoch, currentFolder.absolutePath) {
        FileNavigationPrefs.favorites(context)
    }

    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
            .padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        AssistChip(
            onClick = {
                FileNavigationPrefs.toggleFavorite(context, currentFolder)
                favoriteEpoch++
            },
            label = { Text(if (currentFolder.absolutePath in favorites) "★ Fixada" else "☆ Fixar pasta") }
        )
        AssistChip(
            onClick = {
                onSettings(
                    settings.copy(
                        viewMode = if (settings.viewMode == NerdoraFileViewMode.LIST)
                            NerdoraFileViewMode.GRID else NerdoraFileViewMode.LIST
                    )
                )
            },
            label = { Text(if (settings.viewMode == NerdoraFileViewMode.LIST) "Grade" else "Lista") }
        )
        Box {
            AssistChip(onClick = { sizeMenu = true }, label = {
                Text(
                    when (settings.iconSize) {
                        NerdoraIconSize.SMALL -> "Ícones P"
                        NerdoraIconSize.MEDIUM -> "Ícones M"
                        NerdoraIconSize.LARGE -> "Ícones G"
                    }
                )
            })
            DropdownMenu(expanded = sizeMenu, onDismissRequest = { sizeMenu = false }) {
                NerdoraIconSize.entries.forEach { size ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                when (size) {
                                    NerdoraIconSize.SMALL -> "Pequenos"
                                    NerdoraIconSize.MEDIUM -> "Médios"
                                    NerdoraIconSize.LARGE -> "Grandes"
                                }
                            )
                        },
                        onClick = {
                            sizeMenu = false
                            onSettings(settings.copy(iconSize = size))
                        }
                    )
                }
            }
        }
        AssistChip(
            onClick = { onSettings(settings.copy(showHidden = !settings.showHidden)) },
            label = { Text(if (settings.showHidden) "Ocultar ocultos" else "Mostrar ocultos") }
        )
        Box {
            AssistChip(onClick = { sortMenu = true }, label = { Text("Ordenar") })
            DropdownMenu(expanded = sortMenu, onDismissRequest = { sortMenu = false }) {
                NerdoraSortField.entries.forEach { field ->
                    DropdownMenuItem(
                        text = { Text(field.name.lowercase().replaceFirstChar { it.uppercase() }) },
                        onClick = {
                            sortMenu = false
                            onSettings(settings.copy(sortField = field))
                        }
                    )
                }
                DropdownMenuItem(
                    text = { Text(if (settings.ascending) "Descendente" else "Ascendente") },
                    onClick = {
                        sortMenu = false
                        onSettings(settings.copy(ascending = !settings.ascending))
                    }
                )
            }
        }
        FileNavigationPrefs.recentFolders(context)
            .map(::File).filter { it.exists() && it.isDirectory }.take(3)
            .forEach { f ->
                AssistChip(
                    onClick = { onOpen(f) },
                    label = {
                        Text(f.name.ifBlank { "Armazenamento" }, maxLines = 1)
                    }
                )
            }
    }
}

@Composable
fun SearchHistoryRow(
    context: Context,
    onSelect: (String) -> Unit
) {
    var epoch by remember { mutableIntStateOf(0) }
    val history = remember(epoch) { FileNavigationPrefs.searchHistory(context) }
    if (history.isEmpty()) return

    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
            .padding(horizontal = 12.dp, vertical = 3.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("Recentes", style = MaterialTheme.typography.labelMedium)
        history.take(8).forEach { term ->
            AssistChip(onClick = { onSelect(term) }, label = {
                Text(term, maxLines = 1, overflow = TextOverflow.Ellipsis)
            })
        }
        TextButton(onClick = {
            FileNavigationPrefs.clearSearchHistory(context)
            epoch++
        }) { Text("Limpar") }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun FileGridCell(
    file: File,
    selected: Boolean,
    iconSize: NerdoraIconSize,
    onClick: () -> Unit,
    onSelect: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth()
            .padding(4.dp)
            .combinedClickable(onClick = onClick, onLongClick = onSelect),
        tonalElevation = if (selected) 5.dp else 1.dp,
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val dp = navigationIconDp(iconSize)
            Surface(
                modifier = Modifier.size(dp),
                shape = MaterialTheme.shapes.medium,
                color = if (selected) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.surfaceVariant
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        if (file.isDirectory) "📁" else fileIconGlyph(file),
                        style = when (iconSize) {
                            NerdoraIconSize.SMALL -> MaterialTheme.typography.titleMedium
                            NerdoraIconSize.MEDIUM -> MaterialTheme.typography.headlineSmall
                            NerdoraIconSize.LARGE -> MaterialTheme.typography.headlineMedium
                        }
                    )
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(
                file.name.ifBlank { file.absolutePath },
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
            )
            if (file.isFile) {
                Text(
                    formatNavSize(file.length()),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private fun fileIconGlyph(file: File): String = when (file.extension.lowercase()) {
    "jpg","jpeg","png","gif","webp","heic","avif" -> "🖼"
    "mp4","mkv","avi","mov","webm","m4v","3gp" -> "🎬"
    "mp3","aac","m4a","wav","ogg","flac","opus" -> "🎵"
    "pdf","doc","docx","txt","rtf" -> "📄"
    "xls","xlsx","csv" -> "📊"
    "ppt","pptx" -> "📽"
    "zip","rar","7z","tar","gz","xz" -> "🗜"
    "apk","apks","xapk" -> "🤖"
    else -> "📄"
}

private fun formatNavSize(value: Long): String {
    if (value < 1024L) return value.toString() + " B"
    val kb = value / 1024.0
    if (kb < 1024.0) return String.format("%.1f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    return String.format("%.1f GB", mb / 1024.0)
}
