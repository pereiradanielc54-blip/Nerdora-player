package com.nerdora.player

import android.content.Context
import android.os.Environment
import java.io.File

object FileBulkOperations {
    private fun trashRoot(): File =
        File(Environment.getExternalStorageDirectory(), ".NerdoraTrash")

    fun moveToTrash(context: Context, source: File): FileOperationResult {
        if (!source.exists()) return FileOperationResult(false, "O item não existe mais.")
        val trash = trashRoot()
        if (source.absolutePath.startsWith(trash.absolutePath)) {
            return FileOperationResult(false, "O item já está na Lixeira.")
        }
        if (!trash.exists() && !trash.mkdirs()) {
            return FileOperationResult(false, "Não foi possível criar a Lixeira do Nerdora.")
        }

        val original = source.absolutePath
        val wasDirectory = source.isDirectory
        val destination = uniqueDestination(trash, source.name, wasDirectory)
        if (!moveExact(source, destination)) {
            return FileOperationResult(false, "Não foi possível mover para a Lixeira.")
        }

        UniversalFilesStore.rememberTrash(context, destination.absolutePath, original)
        LibraryStore.removeFilePathReferences(context, original)
        if (wasDirectory) UniversalFileIndexCache.removePrefix(context, original)
        else UniversalFileIndexCache.removePath(context, original)
        RealFileOperations.scanChangedPaths(context, listOf(original, destination.absolutePath))
        return FileOperationResult(true, "Movido para a Lixeira.", destination)
    }

    fun moveToVault(context: Context, source: File): FileOperationResult {
        val oldPath = source.absolutePath
        val wasDirectory = source.isDirectory
        val result = PrivateVaultStore.hideFile(context, source)
        if (result.success) {
            if (wasDirectory) UniversalFileIndexCache.removePrefix(context, oldPath)
            else UniversalFileIndexCache.removePath(context, oldPath)
        }
        return result
    }

    fun deletePermanently(context: Context, source: File): FileOperationResult =
        RealFileOperations.deletePermanently(context, source)

    private fun moveExact(source: File, destination: File): Boolean {
        if (source.renameTo(destination)) return true
        return runCatching {
            if (source.isDirectory) {
                source.copyRecursively(destination, overwrite = false)
                if (!destination.exists() || !source.deleteRecursively()) {
                    runCatching { destination.deleteRecursively() }
                    false
                } else true
            } else {
                val expected = source.length()
                source.copyTo(destination, overwrite = false)
                if (!destination.exists() || destination.length() != expected || !source.delete()) {
                    runCatching { destination.delete() }
                    false
                } else true
            }
        }.getOrDefault(false)
    }

    private fun uniqueDestination(parent: File, name: String, isDirectory: Boolean): File {
        var destination = File(parent, name)
        if (!destination.exists()) return destination
        val base = if (isDirectory) name else name.substringBeforeLast('.', name)
        val rawExt = if (isDirectory) "" else name.substringAfterLast('.', "")
        val ext = if (rawExt.isBlank() || rawExt == name) "" else ".$rawExt"
        var n = 2
        while (destination.exists()) {
            destination = File(parent, "$base ($n)$ext")
            n++
        }
        return destination
    }
}
