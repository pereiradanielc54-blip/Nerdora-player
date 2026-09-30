from pathlib import Path

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
assert old in t, "helpers atuais do FileOperationEngine não encontrados"
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
assert old in t, "moveToTrash atual não encontrado"
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
assert old in t, "moveToVault atual não encontrado"
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
