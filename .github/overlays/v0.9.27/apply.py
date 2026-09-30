from pathlib import Path

p = Path("extracted_project/app/src/main/java/com/nerdora/player/RealFileOperations.kt")
t = p.read_text(encoding="utf-8")

old = """        LibraryStore.replaceFilePathReferences(context, oldPath, destination.absolutePath)
        scanChangedPaths(context, listOf(oldPath, destination.absolutePath))
        return FileOperationResult(true, "Renomeado no armazenamento do celular.", destination)
"""
new = """        SystemStorageAuthority.onPathRenamed(context, oldPath, destination)
        return FileOperationResult(true, "Renomeado no armazenamento do celular e sincronizado com o Android.", destination)
"""
assert old in t, "renameReal antigo não encontrado"
t = t.replace(old, new, 1)

t = t.replace(
    """        val oldPath = target.absolutePath
        val success = runCatching {
""",
    """        val oldPath = target.absolutePath
        val wasDirectory = target.isDirectory
        val success = runCatching {
""",
    1
)

old = """        LibraryStore.removeFilePathReferences(context, oldPath)
        UniversalFilesStore.forgetTrash(context, oldPath)
        scanChangedPaths(context, listOf(oldPath))
        return FileOperationResult(true, "Excluído definitivamente do celular.")
"""
new = """        SystemStorageAuthority.onPathDeleted(context, oldPath, wasDirectory)
        return FileOperationResult(true, "Excluído definitivamente do armazenamento do celular.")
"""
assert old in t, "deletePermanently antigo não encontrado"
t = t.replace(old, new, 1)

old = """    fun scanChangedPaths(context: Context, paths: List<String>) {
        val clean = paths.filter { it.isNotBlank() }.distinct()
        if (clean.isEmpty()) return
        MediaScannerConnection.scanFile(context, clean.toTypedArray(), null, null)
    }
"""
new = """    fun scanChangedPaths(context: Context, paths: List<String>) {
        SystemStorageAuthority.scanPaths(context, paths)
    }
"""
assert old in t, "scanChangedPaths antigo não encontrado"
t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

p = Path("extracted_project/app/src/main/java/com/nerdora/player/FileOperationEngine.kt")
t = p.read_text(encoding="utf-8")
old = """    private fun updateAfterMove(context: Context, oldPath: String, destination: File) {
        LibraryStore.replaceFilePathReferences(context, oldPath, destination.absolutePath)
        if (destination.isDirectory) UniversalFileIndexCache.replacePrefix(context, oldPath, destination.absolutePath)
        else UniversalFileIndexCache.replacePath(context, oldPath, destination.absolutePath)
        RealFileOperations.scanChangedPaths(context, listOf(oldPath, destination.absolutePath))
    }

    private fun indexCopiedTarget(context: Context, target: File) {
        if (target.isDirectory) {
            target.walkTopDown().filter { it.isFile }.forEach { UniversalFileIndexCache.addFromFile(context, it) }
        } else UniversalFileIndexCache.addFromFile(context, target)
        RealFileOperations.scanChangedPaths(context, listOf(target.absolutePath))
    }
"""
new = """    private fun updateAfterMove(context: Context, oldPath: String, destination: File) {
        SystemStorageAuthority.onPathMoved(context, oldPath, destination)
    }

    private fun indexCopiedTarget(context: Context, target: File) {
        SystemStorageAuthority.onPathCopied(context, target)
    }
"""
assert old in t, "helpers do FileOperationEngine não encontrados"
t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

p = Path("extracted_project/app/src/main/java/com/nerdora/player/FileBulkOperations.kt")
t = p.read_text(encoding="utf-8")
old = """        UniversalFilesStore.rememberTrash(context, destination.absolutePath, original)
        LibraryStore.removeFilePathReferences(context, original)
        if (wasDirectory) UniversalFileIndexCache.removePrefix(context, original)
        else UniversalFileIndexCache.removePath(context, original)
        RealFileOperations.scanChangedPaths(context, listOf(original, destination.absolutePath))
        return FileOperationResult(true, "Movido para a Lixeira.", destination)
"""
new = """        UniversalFilesStore.rememberTrash(context, destination.absolutePath, original)
        SystemStorageAuthority.onMovedToTrash(context, original, destination, wasDirectory)
        return FileOperationResult(true, "Movido fisicamente para a Lixeira do Nerdora.", destination)
"""
assert old in t, "moveToTrash antigo não encontrado"
t = t.replace(old, new, 1)

old = """        if (result.success) {
            if (wasDirectory) UniversalFileIndexCache.removePrefix(context, oldPath)
            else UniversalFileIndexCache.removePath(context, oldPath)
        }
"""
new = """        if (result.success) {
            SystemStorageAuthority.onMovedToVault(context, oldPath, wasDirectory)
        }
"""
assert old in t, "moveToVault antigo não encontrado"
t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

p = Path("extracted_project/app/src/main/java/com/nerdora/player/PrivateVaultStore.kt")
t = p.read_text(encoding="utf-8")
old = """        LibraryStore.removeFilePathReferences(context, originalPath)
        RealFileOperations.scanChangedPaths(context, listOf(originalPath))
        return FileOperationResult(true, "Movido para o Cofre privado. O original não fica mais visível nos gerenciadores comuns.", destination)
"""
new = """        return FileOperationResult(true, "Movido para o Cofre privado. O original foi removido do armazenamento público.", destination)
"""
assert old in t, "sync antigo do Cofre não encontrado"
t = t.replace(old, new, 1)

old = """        removeEntry(context, entry.id)
        RealFileOperations.scanChangedPaths(context, listOf(destination.absolutePath))
        return FileOperationResult(true, "Restaurado em ${destination.parentFile?.absolutePath ?: "armazenamento"}.", destination)
"""
new = """        removeEntry(context, entry.id)
        SystemStorageAuthority.onPathCopied(context, destination)
        return FileOperationResult(true, "Restaurado fisicamente em ${destination.parentFile?.absolutePath ?: "armazenamento"}.", destination)
"""
assert old in t, "restore antigo do Cofre não encontrado"
t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

p = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
t = p.read_text(encoding="utf-8")
t = t.replace(
    'title = { Text("Nerdora Player 0.9.26 — File Explorer Pro") }',
    'title = { Text("Nerdora Player 0.9.27 — System Storage Authority") }',
    1
)
p.write_text(t, encoding="utf-8")
