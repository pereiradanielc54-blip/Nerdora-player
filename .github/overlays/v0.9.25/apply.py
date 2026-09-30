from pathlib import Path

path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

anchor = '''    var showOperationCenter by remember { mutableStateOf(false) }\n'''
assert anchor in text, "estado showOperationCenter v0.9.24 não encontrado"
if "showStorageAnalyzer" not in text:
    text = text.replace(anchor, anchor + '''    var showStorageAnalyzer by remember { mutableStateOf(false) }\n    var navigationSettings by remember { mutableStateOf(FileNavigationPrefs.read(context)) }\n''', 1)

old = '''                    TextButton(onClick = { showOperationCenter = true }) { Text("Fila") }\n                    IconButton(onClick = { forceRescan = true; refreshEpoch++ }) { Icon(Icons.Rounded.Refresh, "Atualizar") }\n'''
new = '''                    TextButton(onClick = { showStorageAnalyzer = true }) { Text("Analisar") }\n                    TextButton(onClick = { showOperationCenter = true }) { Text("Fila") }\n                    IconButton(onClick = { forceRescan = true; refreshEpoch++ }) { Icon(Icons.Rounded.Refresh, "Atualizar") }\n'''
assert old in text or new in text, "ações da TopAppBar v0.9.24 não encontradas"
text = text.replace(old, new, 1)

marker = '''            if (selectedPaths.isNotEmpty()) {\n'''
assert marker in text, "barra de seleção não encontrada"
nav = '''            if (folder != null) {\n                LaunchedEffect(folder?.absolutePath) {\n                    folder?.let { FileNavigationPrefs.rememberFolder(context, it) }\n                }\n                FileBreadcrumbBar(root = root, folder = folder) { target ->\n                    folder = target\n                    query = ""\n                }\n                FileNavigationToolbar(\n                    context = context,\n                    currentFolder = folder ?: root,\n                    settings = navigationSettings,\n                    onSettings = { next ->\n                        navigationSettings = next\n                        FileNavigationPrefs.write(context, next)\n                        refreshEpoch++\n                    },\n                    onOpen = { target -> folder = target; query = "" }\n                )\n            }\n\n'''
if "FileBreadcrumbBar(root = root" not in text:
    text = text.replace(marker, nav + marker, 1)

old_sel = '''    val selectionCandidates = if (folder == null) shownItems.map { it.file } else folderChildren\n\n'''
new_sel = '''    val rawSelectionCandidates = if (folder == null) shownItems.map { it.file } else folderChildren\n    val selectionCandidates = applyNavigationSettings(rawSelectionCandidates, navigationSettings)\n\n'''
assert old_sel in text or new_sel in text, "selectionCandidates não encontrado"
text = text.replace(old_sel, new_sel, 1)

text = text.replace('items(folderChildren, key = { it.absolutePath })', 'items(selectionCandidates, key = { it.absolutePath })')

details_marker = '''    if (showOperationCenter) {\n        FileOperationCenterDialog(context = context, onDismiss = { showOperationCenter = false })\n    }\n\n'''
assert details_marker in text, "centro de operações não encontrado"
if "StorageAnalyzerDialog(" not in text:
    text = text.replace(details_marker, details_marker + '''    if (showStorageAnalyzer) {\n        StorageAnalyzerDialog(\n            context = context,\n            root = root,\n            onDismiss = { showStorageAnalyzer = false },\n            onOpenFolder = { target ->\n                folder = target\n                query = ""\n                showStorageAnalyzer = false\n            }\n        )\n    }\n\n''', 1)

path.write_text(text, encoding="utf-8")

settings = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
st = settings.read_text(encoding="utf-8")
st = st.replace(
    'title = { Text("Nerdora Player 0.9.24 — Gerenciador Pro Fase 1.1") }',
    'title = { Text("Nerdora Player 0.9.25 — Storage & Navigation Pro") }',
    1
)
settings.write_text(st, encoding="utf-8")
