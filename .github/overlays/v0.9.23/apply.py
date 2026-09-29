from pathlib import Path

path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

imports_marker = "import com.nerdora.player.FileManagerStore\n"
assert imports_marker in text, "import FileManagerStore não encontrado"
pro_imports = """import com.nerdora.player.BatchRenameEngine
import com.nerdora.player.DuplicateHashEngine
import com.nerdora.player.FileOperationEngine
"""
if "import com.nerdora.player.FileOperationEngine" not in text:
    text = text.replace(imports_marker, imports_marker + pro_imports, 1)

if "import kotlinx.coroutines.delay" not in text:
    text = text.replace("import kotlinx.coroutines.Dispatchers\n", "import kotlinx.coroutines.Dispatchers\nimport kotlinx.coroutines.delay\n", 1)

text = text.replace('DUPLICATES("Duplicados*")', 'DUPLICATES("Duplicados")')

old_pending = "private data class RawPendingOperation(val source: File, val move: Boolean)"
new_pending = "private data class RawPendingOperation(val sources: List<File>, val move: Boolean)"
assert old_pending in text, "RawPendingOperation antigo não encontrado"
text = text.replace(old_pending, new_pending, 1)

state_marker = "    var storeEpoch by remember { mutableIntStateOf(0) }\n"
assert state_marker in text, "estado storeEpoch não encontrado"
state_block = """    var selectedPaths by remember { mutableStateOf<Set<String>>(emptySet()) }
    var batchRenameTargets by remember { mutableStateOf<List<File>>(emptyList()) }
    var checksumTarget by remember { mutableStateOf<File?>(null) }
    var lastFinishedOperationId by remember { mutableStateOf("") }
    val proScope = rememberCoroutineScope()

"""
if "var selectedPaths by remember" not in text:
    text = text.replace(state_marker, state_marker + state_block, 1)

old_back = """    BackHandler(enabled = folder != null) {
        val current = folder
        folder = when {
            current == null -> null
            current.absolutePath == root.absolutePath -> null
            current.parentFile != null && current.parentFile!!.absolutePath.startsWith(root.absolutePath) -> current.parentFile
            else -> null
        }
        query = ""
    }
"""
new_back = """    BackHandler(enabled = folder != null || selectedPaths.isNotEmpty()) {
        if (selectedPaths.isNotEmpty()) {
            selectedPaths = emptySet()
        } else {
            val current = folder
            folder = when {
                current == null -> null
                current.absolutePath == root.absolutePath -> null
                current.parentFile != null && current.parentFile!!.absolutePath.startsWith(root.absolutePath) -> current.parentFile
                else -> null
            }
            query = ""
        }
    }
"""
assert old_back in text, "BackHandler principal não encontrado"
text = text.replace(old_back, new_back, 1)

old_dup = """    val duplicatePaths = remember(allFiles, category) {
        if (category != UniversalCategory.DUPLICATES) emptySet<String>() else allFiles.filter { it.file.length() > 0L }
            .groupBy { it.file.length().toString() + "|" + it.file.extension.lowercase(Locale.ROOT) }
            .values.filter { it.size > 1 }.flatten().map { it.file.absolutePath }.toSet()
    }
"""
new_dup = """    var duplicatePaths by remember { mutableStateOf<Set<String>>(emptySet()) }
    var duplicateAnalyzing by remember { mutableStateOf(false) }

    LaunchedEffect(category, allFiles, refreshEpoch) {
        if (category == UniversalCategory.DUPLICATES) {
            duplicateAnalyzing = true
            duplicatePaths = DuplicateHashEngine.findDuplicatePaths(allFiles.map { it.file })
            duplicateAnalyzing = false
        } else {
            duplicatePaths = emptySet()
            duplicateAnalyzing = false
        }
    }
"""
assert old_dup in text, "detector antigo de duplicados não encontrado"
text = text.replace(old_dup, new_dup, 1)

open_marker = """    fun openFile(file: File) {
"""
assert open_marker in text, "openFile não encontrado"
watcher = """    LaunchedEffect(Unit) {
        while (true) {
            val snapshot = FileOperationEngine.snapshot(context)
            if (snapshot.state in setOf("DONE", "DONE_WITH_ERRORS", "FAILED", "CANCELLED") &&
                snapshot.id.isNotBlank() && snapshot.id != lastFinishedOperationId
            ) {
                lastFinishedOperationId = snapshot.id
                forceRescan = true
                refreshEpoch++
            }
            delay(900L)
        }
    }

"""
if "lastFinishedOperationId = snapshot.id" not in text:
    text = text.replace(open_marker, watcher + open_marker, 1)

enter_marker = """    fun enterFolder(next: File) {
        if (next.isDirectory && next.canRead()) {
            folder = next
            query = ""
        }
    }

"""
assert enter_marker in text, "enterFolder não encontrado"
toggle = """    fun toggleSelection(file: File) {
        selectedPaths = if (selectedPaths.contains(file.absolutePath)) {
            selectedPaths - file.absolutePath
        } else {
            selectedPaths + file.absolutePath
        }
    }

"""
if "fun toggleSelection(file: File)" not in text:
    text = text.replace(enter_marker, enter_marker + toggle, 1)

old_bottom = """        bottomBar = {
            pendingOperation?.let { pending ->
                Surface(tonalElevation = 6.dp) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(if (pending.move) "Mover" else "Copiar", fontWeight = FontWeight.SemiBold)
                            Text(pending.source.name, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        TextButton(onClick = { pendingOperation = null }) { Text("Cancelar") }
                        Button(
                            enabled = folder != null && folder!!.isDirectory && folder!!.absolutePath != pending.source.absolutePath,
                            onClick = {
                                val destination = folder ?: return@Button
                                val result = withRawOperation(pending.source, destination, pending.move)
                                Toast.makeText(context, result, Toast.LENGTH_LONG).show()
                                pendingOperation = null
                                forceRescan = true; refreshEpoch++
                            }
                        ) { Text("Colar aqui") }
                    }
                }
            }
        }
"""
new_bottom = """        bottomBar = {
            pendingOperation?.let { pending ->
                Surface(tonalElevation = 6.dp) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(if (pending.move) "Mover em segundo plano" else "Copiar em segundo plano", fontWeight = FontWeight.SemiBold)
                            Text("${pending.sources.size} item(ns) selecionado(s)", fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        TextButton(onClick = { pendingOperation = null }) { Text("Cancelar") }
                        Button(
                            enabled = folder != null && folder!!.isDirectory &&
                                pending.sources.none { it.absolutePath == folder!!.absolutePath },
                            onClick = {
                                val destination = folder ?: return@Button
                                runCatching {
                                    FileOperationEngine.enqueue(
                                        context = context,
                                        sources = pending.sources.map { it.absolutePath },
                                        destination = destination.absolutePath,
                                        move = pending.move
                                    )
                                }.onSuccess {
                                    Toast.makeText(context, "Operação adicionada à fila. Você pode sair desta tela.", Toast.LENGTH_LONG).show()
                                }.onFailure {
                                    Toast.makeText(context, it.message ?: "Não foi possível iniciar a operação.", Toast.LENGTH_LONG).show()
                                }
                                pendingOperation = null
                                selectedPaths = emptySet()
                            }
                        ) { Text("Iniciar") }
                    }
                }
            }
        }
"""
assert old_bottom in text, "bottomBar de operação antiga não encontrado"
text = text.replace(old_bottom, new_bottom, 1)

search_marker = """                if (folder != null) FilledTonalButton(onClick = { showCreateFolder = true }) { Icon(Icons.Rounded.CreateNewFolder, "Nova pasta") }
            }

            if (folder == null) {
"""
assert search_marker in text, "fim da barra de busca não encontrado"
selection_block = """                if (folder != null) FilledTonalButton(onClick = { showCreateFolder = true }) { Icon(Icons.Rounded.CreateNewFolder, "Nova pasta") }
            }

            if (selectedPaths.isNotEmpty()) {
                val selectedFiles = selectedPaths.map(::File).filter { it.exists() }
                FileSelectionActionBar(
                    selectedCount = selectedFiles.size,
                    canChecksum = selectedFiles.size == 1 && selectedFiles.firstOrNull()?.isFile == true,
                    onClear = { selectedPaths = emptySet() },
                    onSelectAll = {
                        val candidates = if (folder == null) shownItems.map { it.file } else folderChildren
                        selectedPaths = candidates.map { it.absolutePath }.toSet()
                    },
                    onCopy = {
                        if (selectedFiles.isNotEmpty()) {
                            pendingOperation = RawPendingOperation(selectedFiles, false)
                            folder = root
                            query = ""
                        }
                    },
                    onMove = {
                        if (selectedFiles.isNotEmpty()) {
                            pendingOperation = RawPendingOperation(selectedFiles, true)
                            folder = root
                            query = ""
                        }
                    },
                    onBatchRename = {
                        if (selectedFiles.isNotEmpty()) batchRenameTargets = selectedFiles
                    },
                    onChecksum = {
                        checksumTarget = selectedFiles.singleOrNull()?.takeIf { it.isFile }
                    }
                )
            }

            FileOperationStatusCard(context)

            if (folder == null) {
"""
text = text.replace(search_marker, selection_block, 1)

old_dup_note = '                    Text("* Possíveis duplicados são arquivos com o mesmo tamanho e extensão. Confira antes de excluir.", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(horizontal = 14.dp, vertical = 3.dp))'
new_dup_note = '''                    Text(
                        if (duplicateAnalyzing) "Calculando SHA-256 dos candidatos…"
                        else "Duplicados confirmados: mesmo tamanho + mesmo SHA-256.",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 3.dp)
                    )'''
assert old_dup_note in text, "nota antiga de duplicados não encontrada"
text = text.replace(old_dup_note, new_dup_note, 1)

old_device_call = """                            DeviceFileRow(
                                file = item.file, mime = item.mime, favorite = isFavorite, isTrash = category == UniversalCategory.TRASH,
                                onClick = { if (category == UniversalCategory.TRASH) detailsTarget = item.file else openFile(item.file) },
"""
new_device_call = """                            DeviceFileRow(
                                file = item.file, mime = item.mime, favorite = isFavorite, isTrash = category == UniversalCategory.TRASH,
                                selected = selectedPaths.contains(item.file.absolutePath),
                                onSelect = { toggleSelection(item.file) },
                                onClick = {
                                    if (selectedPaths.isNotEmpty()) toggleSelection(item.file)
                                    else if (category == UniversalCategory.TRASH) detailsTarget = item.file
                                    else openFile(item.file)
                                },
"""
assert old_device_call in text, "DeviceFileRow call não encontrado"
text = text.replace(old_device_call, new_device_call, 1)

text = text.replace(
    'onCopy = { pendingOperation = RawPendingOperation(item.file, false); folder = root; query = "" },',
    'onCopy = { pendingOperation = RawPendingOperation(listOf(item.file), false); folder = root; query = "" },'
)
text = text.replace(
    'onMove = { pendingOperation = RawPendingOperation(item.file, true); folder = root; query = "" },',
    'onMove = { pendingOperation = RawPendingOperation(listOf(item.file), true); folder = root; query = "" },'
)

old_raw_call = """                            RawFolderRow(
                                file = item, favorite = favorites.contains(item.absolutePath),
                                onClick = { if (item.isDirectory) enterFolder(item) else openFile(item) },
"""
new_raw_call = """                            RawFolderRow(
                                file = item, favorite = favorites.contains(item.absolutePath),
                                selected = selectedPaths.contains(item.absolutePath),
                                onSelect = { toggleSelection(item) },
                                onClick = {
                                    if (selectedPaths.isNotEmpty()) toggleSelection(item)
                                    else if (item.isDirectory) enterFolder(item)
                                    else openFile(item)
                                },
"""
assert old_raw_call in text, "RawFolderRow call não encontrado"
text = text.replace(old_raw_call, new_raw_call, 1)

text = text.replace(
    "onRename = { renameTarget = item }, onCopy = { pendingOperation = RawPendingOperation(item, false) },",
    "onRename = { renameTarget = item }, onCopy = { pendingOperation = RawPendingOperation(listOf(item), false) },"
)
text = text.replace(
    "onMove = { pendingOperation = RawPendingOperation(item, true) },",
    "onMove = { pendingOperation = RawPendingOperation(listOf(item), true) },"
)

old_device_sig = """private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, onClick: () -> Unit, onFavorite: () -> Unit,
    onRename: () -> Unit, onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onRestore: () -> Unit, onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {
"""
new_device_sig = """private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, selected: Boolean, onSelect: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit,
    onRename: () -> Unit, onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onRestore: () -> Unit, onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {
"""
assert old_device_sig in text, "assinatura DeviceFileRow não encontrada"
text = text.replace(old_device_sig, new_device_sig, 1)

device_anchor = """            if (!isTrash) IconButton(onClick = onFavorite, modifier = Modifier.size(36.dp)) { Icon(if (favorite) Icons.Rounded.Star else Icons.Rounded.StarBorder, "Favorito", modifier = Modifier.size(20.dp)) }
            Box {
"""
device_insert = """            if (!isTrash) {
                IconButton(onClick = onSelect, modifier = Modifier.size(36.dp)) {
                    Text(if (selected) "✓" else "○", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
                IconButton(onClick = onFavorite, modifier = Modifier.size(36.dp)) { Icon(if (favorite) Icons.Rounded.Star else Icons.Rounded.StarBorder, "Favorito", modifier = Modifier.size(20.dp)) }
            }
            Box {
"""
assert device_anchor in text, "seletor DeviceFileRow não encontrado"
text = text.replace(device_anchor, device_insert, 1)

old_raw_sig = """private fun RawFolderRow(
    file: File, favorite: Boolean, onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
    onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {
"""
new_raw_sig = """private fun RawFolderRow(
    file: File, favorite: Boolean, selected: Boolean, onSelect: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
    onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {
"""
assert old_raw_sig in text, "assinatura RawFolderRow não encontrada"
text = text.replace(old_raw_sig, new_raw_sig, 1)

raw_anchor = """            if (file.isFile) IconButton(onClick = onFavorite, modifier = Modifier.size(36.dp)) { Icon(if (favorite) Icons.Rounded.Star else Icons.Rounded.StarBorder, "Favorito", modifier = Modifier.size(20.dp)) }
            Box {
"""
raw_insert = """            IconButton(onClick = onSelect, modifier = Modifier.size(36.dp)) {
                Text(if (selected) "✓" else "○", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            if (file.isFile) IconButton(onClick = onFavorite, modifier = Modifier.size(36.dp)) { Icon(if (favorite) Icons.Rounded.Star else Icons.Rounded.StarBorder, "Favorito", modifier = Modifier.size(20.dp)) }
            Box {
"""
assert raw_anchor in text, "seletor RawFolderRow não encontrado"
text = text.replace(raw_anchor, raw_insert, 1)

details_marker = """    detailsTarget?.let { file -> FileDetailsDialog(context, file) { detailsTarget = null } }
}
"""
assert details_marker in text, "final dos dialogs de Arquivos não encontrado"
dialogs = """    if (batchRenameTargets.isNotEmpty()) {
        BatchRenameDialog(
            files = batchRenameTargets,
            onDismiss = { batchRenameTargets = emptyList() },
            onApply = { options ->
                val targets = batchRenameTargets
                batchRenameTargets = emptyList()
                proScope.launch {
                    val result = withContext(Dispatchers.IO) { BatchRenameEngine.apply(context, targets, options) }
                    Toast.makeText(
                        context,
                        "${result.renamed} renomeado(s)" + if (result.failed > 0) " • ${result.failed} falha(s)" else "",
                        Toast.LENGTH_LONG
                    ).show()
                    selectedPaths = emptySet()
                    forceRescan = true
                    refreshEpoch++
                }
            }
        )
    }

    checksumTarget?.let { file ->
        ChecksumDialog(context = context, file = file, onDismiss = { checksumTarget = null })
    }

    detailsTarget?.let { file -> FileDetailsDialog(context, file) { detailsTarget = null } }
}
"""
text = text.replace(details_marker, dialogs, 1)

path.write_text(text, encoding="utf-8")

manifest = Path("extracted_project/app/src/main/AndroidManifest.xml")
m = manifest.read_text(encoding="utf-8")
manifest_open = '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n'
assert manifest_open in m, "abertura do manifest não encontrada"
permissions = '''    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
'''
if "android.permission.FOREGROUND_SERVICE_DATA_SYNC" not in m:
    m = m.replace(manifest_open, manifest_open + permissions, 1)

app_close = "    </application>"
assert app_close in m, "fechamento application não encontrado"
service = '''        <service
            android:name=".FileOperationService"
            android:exported="false"
            android:stopWithTask="false"
            android:foregroundServiceType="dataSync" />

'''
if 'android:name=".FileOperationService"' not in m:
    m = m.replace(app_close, service + app_close, 1)
manifest.write_text(m, encoding="utf-8")

settings = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
st = settings.read_text(encoding="utf-8")
st = st.replace(
    'title = { Text("Nerdora Player 0.9.22 — Organização Base") }',
    'title = { Text("Nerdora Player 0.9.23 — Gerenciador Pro Fase 1") }',
    1
)
settings.write_text(st, encoding="utf-8")
