from pathlib import Path

path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

# Novos tipos da Fase 1.1.
import_anchor = "import com.nerdora.player.FileOperationEngine\n"
assert import_anchor in text, "import FileOperationEngine não encontrado"
if "import com.nerdora.player.FileConflictPolicy" not in text:
    text = text.replace(
        import_anchor,
        import_anchor +
        "import com.nerdora.player.FileConflictPolicy\n" +
        "import com.nerdora.player.FileOperationType\n",
        1
    )

# Estados de seleção por intervalo, histórico/fila, conflitos e ações em lote.
state_anchor = """    var lastFinishedOperationId by remember { mutableStateOf("") }
    val proScope = rememberCoroutineScope()
"""
assert state_anchor in text, "estados Pro v0.9.23 não encontrados"
state_new = """    var lastFinishedOperationId by remember { mutableStateOf("") }
    var selectionAnchorPath by remember { mutableStateOf<String?>(null) }
    var rangeSelectionMode by remember { mutableStateOf(false) }
    var showOperationCenter by remember { mutableStateOf(false) }
    var conflictDestination by remember { mutableStateOf<File?>(null) }
    var bulkActionType by remember { mutableStateOf<FileOperationType?>(null) }
    var bulkActionTargets by remember { mutableStateOf<List<File>>(emptyList()) }
    val proScope = rememberCoroutineScope()
"""
text = text.replace(state_anchor, state_new, 1)

# Back cancela primeiro seleção/intervalo.
old_back_clear = """        if (selectedPaths.isNotEmpty()) {
            selectedPaths = emptySet()
        } else {
"""
new_back_clear = """        if (selectedPaths.isNotEmpty()) {
            selectedPaths = emptySet()
            selectionAnchorPath = null
            rangeSelectionMode = false
        } else {
"""
assert old_back_clear in text, "limpeza de seleção no Back não encontrada"
text = text.replace(old_back_clear, new_back_clear, 1)

# Lista ordenada visível usada para seleção por intervalo.
watcher_anchor = """    LaunchedEffect(Unit) {
        while (true) {
            val snapshot = FileOperationEngine.snapshot(context)
"""
assert watcher_anchor in text, "watcher de operações não encontrado"
selection_candidates = """    val selectionCandidates = if (folder == null) shownItems.map { it.file } else folderChildren

"""
text = text.replace(watcher_anchor, selection_candidates + watcher_anchor, 1)

# Seleção normal + seleção contínua entre a âncora e o segundo item.
old_toggle = """    fun toggleSelection(file: File) {
        selectedPaths = if (selectedPaths.contains(file.absolutePath)) {
            selectedPaths - file.absolutePath
        } else {
            selectedPaths + file.absolutePath
        }
    }
"""
new_toggle = """    fun toggleSelection(file: File) {
        val pathValue = file.absolutePath
        if (rangeSelectionMode && selectionAnchorPath != null) {
            val visiblePaths = selectionCandidates.map { it.absolutePath }
            val startIndex = visiblePaths.indexOf(selectionAnchorPath)
            val endIndex = visiblePaths.indexOf(pathValue)
            val next = if (startIndex >= 0 && endIndex >= 0) {
                val from = minOf(startIndex, endIndex)
                val to = maxOf(startIndex, endIndex)
                selectedPaths + visiblePaths.subList(from, to + 1)
            } else {
                selectedPaths + pathValue
            }
            selectedPaths = next
            selectionAnchorPath = pathValue
            rangeSelectionMode = false
        } else {
            val next = if (selectedPaths.contains(pathValue)) selectedPaths - pathValue else selectedPaths + pathValue
            selectedPaths = next
            if (pathValue in next) {
                selectionAnchorPath = pathValue
            } else if (selectionAnchorPath == pathValue) {
                selectionAnchorPath = next.firstOrNull()
            }
            if (next.isEmpty()) rangeSelectionMode = false
        }
    }
"""
assert old_toggle in text, "toggleSelection v0.9.23 não encontrado"
text = text.replace(old_toggle, new_toggle, 1)

# Acesso permanente à fila e histórico no topo de Arquivos.
top_actions = """                actions = {
                    IconButton(onClick = { forceRescan = true; refreshEpoch++ }) { Icon(Icons.Rounded.Refresh, "Atualizar") }
"""
top_actions_new = """                actions = {
                    TextButton(onClick = { showOperationCenter = true }) { Text("Fila") }
                    IconButton(onClick = { forceRescan = true; refreshEpoch++ }) { Icon(Icons.Rounded.Refresh, "Atualizar") }
"""
assert top_actions in text, "ações da TopAppBar não encontradas"
text = text.replace(top_actions, top_actions_new, 1)

# Copiar/mover: antes de iniciar, detectar conflito e perguntar ao usuário.
old_enqueue = """                                runCatching {
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
"""
new_enqueue = """                                val conflicts = FileOperationEngine.detectConflicts(
                                    pending.sources.map { it.absolutePath },
                                    destination.absolutePath
                                )
                                if (conflicts.isNotEmpty()) {
                                    conflictDestination = destination
                                } else {
                                    runCatching {
                                        FileOperationEngine.enqueue(
                                            context = context,
                                            sources = pending.sources.map { it.absolutePath },
                                            destination = destination.absolutePath,
                                            move = pending.move,
                                            conflictPolicy = FileConflictPolicy.KEEP_BOTH
                                        )
                                    }.onSuccess {
                                        Toast.makeText(context, "Operação adicionada à fila. Você pode sair desta tela.", Toast.LENGTH_LONG).show()
                                    }.onFailure {
                                        Toast.makeText(context, it.message ?: "Não foi possível iniciar a operação.", Toast.LENGTH_LONG).show()
                                    }
                                    pendingOperation = null
                                    selectedPaths = emptySet()
                                    selectionAnchorPath = null
                                    rangeSelectionMode = false
                                }
"""
assert old_enqueue in text, "enqueue v0.9.23 não encontrado"
text = text.replace(old_enqueue, new_enqueue, 1)

# Substitui a barra de seleção antiga inteira.
selection_start = text.index("            if (selectedPaths.isNotEmpty()) {", text.index('placeholder = { Text(if (folder == null) "Pesquisar no dispositivo"'))
selection_end = text.index("            if (folder == null) {", selection_start)
old_selection_block = text[selection_start:selection_end]
new_selection_block = """            if (selectedPaths.isNotEmpty()) {
                val selectedFiles = selectedPaths.map(::File).filter { it.exists() }
                FileSelectionActionBar(
                    selectedCount = selectedFiles.size,
                    canChecksum = selectedFiles.size == 1 && selectedFiles.firstOrNull()?.isFile == true,
                    canRange = selectionAnchorPath != null && selectionCandidates.size > 1,
                    rangeMode = rangeSelectionMode,
                    allowVault = category != UniversalCategory.TRASH,
                    allowTrash = category != UniversalCategory.TRASH,
                    onClear = {
                        selectedPaths = emptySet()
                        selectionAnchorPath = null
                        rangeSelectionMode = false
                    },
                    onSelectAll = {
                        selectedPaths = selectionCandidates.map { it.absolutePath }.toSet()
                        selectionAnchorPath = selectionCandidates.firstOrNull()?.absolutePath
                        rangeSelectionMode = false
                    },
                    onRange = {
                        rangeSelectionMode = !rangeSelectionMode
                    },
                    onCopy = {
                        if (selectedFiles.isNotEmpty()) {
                            pendingOperation = RawPendingOperation(selectedFiles, false)
                            folder = root
                            query = ""
                            rangeSelectionMode = false
                        }
                    },
                    onMove = {
                        if (selectedFiles.isNotEmpty()) {
                            pendingOperation = RawPendingOperation(selectedFiles, true)
                            folder = root
                            query = ""
                            rangeSelectionMode = false
                        }
                    },
                    onBatchRename = {
                        if (selectedFiles.isNotEmpty()) batchRenameTargets = selectedFiles
                    },
                    onChecksum = {
                        checksumTarget = selectedFiles.singleOrNull()?.takeIf { it.isFile }
                    },
                    onVault = {
                        bulkActionTargets = selectedFiles
                        bulkActionType = FileOperationType.VAULT
                    },
                    onTrash = {
                        bulkActionTargets = selectedFiles
                        bulkActionType = FileOperationType.TRASH
                    },
                    onDelete = {
                        bulkActionTargets = selectedFiles
                        bulkActionType = FileOperationType.DELETE
                    }
                )
            }

            FileOperationStatusCard(context, onOpenCenter = { showOperationCenter = true })

"""
text = text[:selection_start] + new_selection_block + text[selection_end:]

# Ao concluir renomeação em lote, zera também âncora/modo intervalo.
batch_clear = """                    selectedPaths = emptySet()
                    forceRescan = true
"""
batch_clear_new = """                    selectedPaths = emptySet()
                    selectionAnchorPath = null
                    rangeSelectionMode = false
                    forceRescan = true
"""
assert batch_clear in text, "limpeza pós Batch Rename não encontrada"
text = text.replace(batch_clear, batch_clear_new, 1)

# Novos diálogos: fila/histórico, conflitos e ações destrutivas em lote.
details_marker = """    detailsTarget?.let { file -> FileDetailsDialog(context, file) { detailsTarget = null } }
}
"""
assert details_marker in text, "final de FilesScreen não encontrado"
dialogs = """    if (showOperationCenter) {
        FileOperationCenterDialog(context = context, onDismiss = { showOperationCenter = false })
    }

    val pendingForConflict = pendingOperation
    val destinationForConflict = conflictDestination
    if (pendingForConflict != null && destinationForConflict != null) {
        val conflicts = FileOperationEngine.detectConflicts(
            pendingForConflict.sources.map { it.absolutePath },
            destinationForConflict.absolutePath
        )
        FileConflictDialog(
            conflicts = conflicts,
            onDismiss = { conflictDestination = null },
            onChoice = { policy ->
                runCatching {
                    FileOperationEngine.enqueue(
                        context = context,
                        sources = pendingForConflict.sources.map { it.absolutePath },
                        destination = destinationForConflict.absolutePath,
                        move = pendingForConflict.move,
                        conflictPolicy = policy
                    )
                }.onSuccess {
                    Toast.makeText(context, "Operação adicionada à fila com a regra escolhida.", Toast.LENGTH_LONG).show()
                }.onFailure {
                    Toast.makeText(context, it.message ?: "Não foi possível iniciar a operação.", Toast.LENGTH_LONG).show()
                }
                conflictDestination = null
                pendingOperation = null
                selectedPaths = emptySet()
                selectionAnchorPath = null
                rangeSelectionMode = false
            }
        )
    }

    bulkActionType?.let { action ->
        BulkFileActionDialog(
            action = action,
            count = bulkActionTargets.size,
            onDismiss = {
                bulkActionType = null
                bulkActionTargets = emptyList()
            },
            onConfirm = {
                val targets = bulkActionTargets
                runCatching {
                    FileOperationEngine.enqueueBulk(
                        context = context,
                        sources = targets.map { it.absolutePath },
                        type = action
                    )
                }.onSuccess {
                    Toast.makeText(context, "Ação em lote adicionada à fila.", Toast.LENGTH_LONG).show()
                }.onFailure {
                    Toast.makeText(context, it.message ?: "Não foi possível iniciar a ação em lote.", Toast.LENGTH_LONG).show()
                }
                bulkActionType = null
                bulkActionTargets = emptyList()
                selectedPaths = emptySet()
                selectionAnchorPath = null
                rangeSelectionMode = false
            }
        )
    }

    detailsTarget?.let { file -> FileDetailsDialog(context, file) { detailsTarget = null } }
}
"""
text = text.replace(details_marker, dialogs, 1)

path.write_text(text, encoding="utf-8")

# Identidade da versão em Ajustes.
settings = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
st = settings.read_text(encoding="utf-8")
st = st.replace(
    'title = { Text("Nerdora Player 0.9.23 — Gerenciador Pro Fase 1") }',
    'title = { Text("Nerdora Player 0.9.24 — Gerenciador Pro Fase 1.1") }',
    1
)
settings.write_text(st, encoding="utf-8")
