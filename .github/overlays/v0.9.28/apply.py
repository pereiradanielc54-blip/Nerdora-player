from pathlib import Path

p = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
t = p.read_text(encoding="utf-8")

# 1) A lista principal já volta pré-ordenada em IO; evita ordenar 30 mil arquivos no Main.
old = '''private fun scanDeviceFiles(root: File, limit: Int = 30000): Pair<List<DeviceFileItem>, Boolean> {
    val result = ArrayList<DeviceFileItem>(4096); val stack = ArrayDeque<File>(); stack.add(root); var limited = false
    while (stack.isNotEmpty()) {
        val dir = stack.removeLast(); if (shouldHideSystemPath(dir) || isInsideNerdoraTrash(dir)) continue
        val children = runCatching { dir.listFiles() }.getOrNull() ?: continue
        for (child in children) {
            if (result.size >= limit) { limited = true; break }
            if (shouldHideSystemPath(child) || isInsideNerdoraTrash(child)) continue
            if (child.isDirectory) stack.add(child) else if (child.isFile) result += deviceItem(child)
        }
        if (limited) break
    }
    return result to limited
}
'''
new = '''private fun scanDeviceFiles(root: File, limit: Int = 30000): Pair<List<DeviceFileItem>, Boolean> {
    val result = ArrayList<DeviceFileItem>(4096)
    val stack = ArrayDeque<File>()
    stack.add(root)
    var limited = false

    while (stack.isNotEmpty()) {
        val dir = stack.removeLast()
        if (shouldHideSystemPath(dir) || isInsideNerdoraTrash(dir)) continue
        val children = runCatching { dir.listFiles() }.getOrNull() ?: continue
        for (child in children) {
            if (result.size >= limit) {
                limited = true
                break
            }
            if (shouldHideSystemPath(child) || isInsideNerdoraTrash(child)) continue
            if (child.isDirectory) stack.add(child)
            else if (child.isFile) result += deviceItem(child)
        }
        if (limited) break
    }

    // Esta função é chamada dentro de Dispatchers.IO.
    // Ordenar aqui evita milhares de chamadas File.lastModified() na thread da UI.
    result.sortByDescending { it.file.lastModified() }
    return result to limited
}
'''
assert old in t, "scanDeviceFiles atual não encontrado"
t = t.replace(old, new, 1)

# 2) No modo padrão (Mais recentes, sem busca), usa a ordem já pronta do scanner.
old = '''    val shownItems = remember(categoryItems, query, sort) {
        val filtered = if (query.isBlank()) categoryItems else categoryItems.filter {
            it.file.name.contains(query, ignoreCase = true) || it.file.parentFile?.name.orEmpty().contains(query, ignoreCase = true)
        }
        sortDeviceItems(filtered, sort)
    }
'''
new = '''    val shownItems = remember(categoryItems, query, sort) {
        val filtered = if (query.isBlank()) categoryItems else categoryItems.filter {
            it.file.name.contains(query, ignoreCase = true) ||
                it.file.parentFile?.name.orEmpty().contains(query, ignoreCase = true)
        }
        if (query.isBlank() && sort == FileSort.NEWEST) filtered
        else sortDeviceItems(filtered, sort)
    }
'''
assert old in t, "shownItems atual não encontrado"
t = t.replace(old, new, 1)

# 3) Entrar em pasta não pode fazer listFiles/sort no Main.
old = '''    val folderChildren = remember(folder, refreshEpoch, query, sort) {
        folder?.let { dir ->
            val files = runCatching { dir.listFiles()?.toList().orEmpty() }.getOrDefault(emptyList())
                .filterNot { shouldHideSystemPath(it) }
                .filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
            sortRawFiles(files, sort)
        }.orEmpty()
    }
'''
new = '''    var folderChildren by remember { mutableStateOf<List<File>>(emptyList()) }

    LaunchedEffect(folder?.absolutePath, refreshEpoch, query, sort) {
        val currentFolder = folder
        folderChildren = if (currentFolder == null) {
            emptyList()
        } else {
            withContext(Dispatchers.IO) {
                val files = runCatching { currentFolder.listFiles()?.toList().orEmpty() }
                    .getOrDefault(emptyList())
                    .filterNot { shouldHideSystemPath(it) }
                    .filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
                sortRawFiles(files, sort)
            }
        }
    }
'''
assert old in t, "folderChildren síncrono não encontrado"
t = t.replace(old, new, 1)

# 4) Evita reprocessamento visual gigante de uma só vez ao final da varredura.
old = '''        val scan = withContext(Dispatchers.IO) { scanDeviceFiles(root) }
        allFiles = scan.first
        scanLimited = scan.second
        trashFiles = withContext(Dispatchers.IO) { scanTrashFiles() }
        withContext(Dispatchers.IO) { UniversalFilesStore.prune(context) }
        loading = false
'''
new = '''        val scan = withContext(Dispatchers.IO) { scanDeviceFiles(root) }

        // Entrega primeiro um lote pequeno à UI para manter a tela responsiva.
        // Depois publica o índice completo já ordenado.
        val scanned = scan.first
        val firstBatch = if (scanned.size > 1200) scanned.take(1200) else scanned
        allFiles = firstBatch
        scanLimited = scan.second
        trashFiles = withContext(Dispatchers.IO) { scanTrashFiles() }
        loading = false

        if (scanned.size > firstBatch.size) {
            kotlinx.coroutines.yield()
            allFiles = scanned
        }

        withContext(Dispatchers.IO) {
            UniversalFilesStore.prune(context)
            UniversalFileIndexCache.replace(
                context,
                scanned.map { it.file.absolutePath },
                scan.second
            )
        }
'''
assert old in t, "LaunchedEffect de scan atual não encontrado"
t = t.replace(old, new, 1)

# 5) Texto deixa claro que o app está utilizável enquanto indexa.
t = t.replace(
    'else if (loading) "Analisando o celular…" else "${allFiles.size} arquivo(s) indexado(s)"',
    'else if (loading) "Indexando em segundo plano…" else "${allFiles.size} arquivo(s) indexado(s)"',
    1
)

# Versão exibida.
settings = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
s = settings.read_text(encoding="utf-8")
s = s.replace(
    'title = { Text("Nerdora Player 0.9.27 — System Storage Authority") }',
    'title = { Text("Nerdora Player 0.9.28 — Arquivos Responsivos") }',
    1
)
settings.write_text(s, encoding="utf-8")

p.write_text(t, encoding="utf-8")
