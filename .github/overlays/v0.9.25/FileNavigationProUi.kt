package com.nerdora.player.ui

import android.content.Context
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import java.io.File

enum class NerdoraFileViewMode { LIST, GRID }
enum class NerdoraSortField { NAME, DATE, SIZE, TYPE }

data class FileNavigationSettings(
    val viewMode: NerdoraFileViewMode = NerdoraFileViewMode.LIST,
    val showHidden: Boolean = false,
    val sortField: NerdoraSortField = NerdoraSortField.NAME,
    val ascending: Boolean = true
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
            ascending = p.getBoolean("asc", true)
        )
    }
    fun write(context: Context, s: FileNavigationSettings) {
        prefs(context).edit().putString("view", s.viewMode.name).putBoolean("hidden", s.showHidden).putString("sort", s.sortField.name).putBoolean("asc", s.ascending).apply()
    }
    fun favorites(context: Context): Set<String> = prefs(context).getStringSet("folder_favorites", emptySet())?.toSet().orEmpty()
    fun toggleFavorite(context: Context, folder: File) {
        val next = favorites(context).toMutableSet()
        if (!next.add(folder.absolutePath)) next.remove(folder.absolutePath)
        prefs(context).edit().putStringSet("folder_favorites", next).apply()
    }
    fun recentFolders(context: Context): List<String> = prefs(context).getString("recent_folders", "").orEmpty().split('\n').filter { it.isNotBlank() }
    fun rememberFolder(context: Context, folder: File) {
        val next = (listOf(folder.absolutePath) + recentFolders(context)).distinct().take(12)
        prefs(context).edit().putString("recent_folders", next.joinToString("\n")).apply()
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

@Composable
fun FileBreadcrumbBar(root: File, folder: File?, onNavigate: (File?) -> Unit) {
    val current = folder ?: root
    val rootPath = root.absolutePath.trimEnd(File.separatorChar)
    val relative = current.absolutePath.removePrefix(rootPath).trim(File.separatorChar)
    val segments = if (relative.isBlank()) emptyList() else relative.split(File.separatorChar)
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 5.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        TextButton(onClick = { onNavigate(null) }) { Text("Armazenamento") }
        var acc = root
        segments.forEach { segment ->
            Text("›", modifier = Modifier.padding(top = 12.dp))
            acc = File(acc, segment)
            val target = acc
            TextButton(onClick = { onNavigate(target) }) { Text(segment, maxLines = 1, overflow = TextOverflow.Ellipsis) }
        }
    }
}

@Composable
fun FileNavigationToolbar(context: Context, currentFolder: File, settings: FileNavigationSettings, onSettings: (FileNavigationSettings) -> Unit, onOpen: (File) -> Unit) {
    var menu by remember { mutableStateOf(false) }
    var favoriteEpoch by remember { mutableIntStateOf(0) }
    val favorites = remember(favoriteEpoch, currentFolder.absolutePath) { FileNavigationPrefs.favorites(context) }
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        AssistChip(onClick = { FileNavigationPrefs.toggleFavorite(context, currentFolder); favoriteEpoch++ }, label = { Text(if (currentFolder.absolutePath in favorites) "★ Fixada" else "☆ Fixar pasta") })
        AssistChip(onClick = { onSettings(settings.copy(viewMode = if (settings.viewMode == NerdoraFileViewMode.LIST) NerdoraFileViewMode.GRID else NerdoraFileViewMode.LIST)) }, label = { Text(if (settings.viewMode == NerdoraFileViewMode.LIST) "Grade" else "Lista") })
        AssistChip(onClick = { onSettings(settings.copy(showHidden = !settings.showHidden)) }, label = { Text(if (settings.showHidden) "Ocultar ocultos" else "Mostrar ocultos") })
        Box {
            AssistChip(onClick = { menu = true }, label = { Text("Ordenar") })
            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                NerdoraSortField.entries.forEach { field ->
                    DropdownMenuItem(text = { Text(field.name.lowercase().replaceFirstChar { it.uppercase() }) }, onClick = { menu = false; onSettings(settings.copy(sortField = field)) })
                }
                DropdownMenuItem(text = { Text(if (settings.ascending) "Descendente" else "Ascendente") }, onClick = { menu = false; onSettings(settings.copy(ascending = !settings.ascending)) })
            }
        }
        FileNavigationPrefs.recentFolders(context).map(::File).filter { it.exists() && it.isDirectory }.take(3).forEach { f ->
            AssistChip(onClick = { onOpen(f) }, label = { Text(f.name.ifBlank { "Armazenamento" }, maxLines = 1) })
        }
    }
}
