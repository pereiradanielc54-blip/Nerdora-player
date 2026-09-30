package com.nerdora.player

import android.content.ContentUris
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.MediaStore
import androidx.documentfile.provider.DocumentFile
import java.io.File

/**
 * Camada única de sincronização entre o armazenamento físico, MediaStore,
 * SAF/DocumentProvider e os índices internos do Nerdora.
 *
 * As operações físicas continuam sendo executadas pelos engines existentes.
 * Este objeto garante que o restante do Android veja imediatamente o mesmo estado.
 */
object SystemStorageAuthority {

    fun onPathRenamed(context: Context, oldPath: String, newFile: File) {
        removeStaleMediaRows(context, oldPath, includeChildren = newFile.isDirectory)
        if (newFile.isDirectory) {
            UniversalFileIndexCache.replacePrefix(context, oldPath, newFile.absolutePath)
            scanTree(context, newFile)
        } else {
            UniversalFileIndexCache.replacePath(context, oldPath, newFile.absolutePath)
            scanPaths(context, listOf(newFile.absolutePath))
        }
        LibraryStore.replaceFilePathReferences(context, oldPath, newFile.absolutePath)
    }

    fun onPathMoved(context: Context, oldPath: String, newFile: File) =
        onPathRenamed(context, oldPath, newFile)

    fun onPathCopied(context: Context, copied: File) {
        if (copied.isDirectory) {
            copied.walkTopDown().filter { it.isFile }.forEach {
                UniversalFileIndexCache.addFromFile(context, it)
            }
            scanTree(context, copied)
        } else {
            UniversalFileIndexCache.addFromFile(context, copied)
            scanPaths(context, listOf(copied.absolutePath))
        }
    }

    fun onPathDeleted(context: Context, oldPath: String, wasDirectory: Boolean) {
        removeStaleMediaRows(context, oldPath, includeChildren = wasDirectory)
        if (wasDirectory) UniversalFileIndexCache.removePrefix(context, oldPath)
        else UniversalFileIndexCache.removePath(context, oldPath)
        LibraryStore.removeFilePathReferences(context, oldPath)
        UniversalFilesStore.forgetTrash(context, oldPath)
        scanPaths(context, listOf(oldPath))
    }

    fun onMovedToTrash(context: Context, oldPath: String, trashFile: File, wasDirectory: Boolean) {
        removeStaleMediaRows(context, oldPath, includeChildren = wasDirectory)
        if (wasDirectory) UniversalFileIndexCache.removePrefix(context, oldPath)
        else UniversalFileIndexCache.removePath(context, oldPath)
        LibraryStore.removeFilePathReferences(context, oldPath)
        if (trashFile.isDirectory) scanTree(context, trashFile)
        else scanPaths(context, listOf(trashFile.absolutePath))
    }

    fun onMovedToVault(context: Context, oldPath: String, wasDirectory: Boolean) {
        removeStaleMediaRows(context, oldPath, includeChildren = wasDirectory)
        if (wasDirectory) UniversalFileIndexCache.removePrefix(context, oldPath)
        else UniversalFileIndexCache.removePath(context, oldPath)
        LibraryStore.removeFilePathReferences(context, oldPath)
        scanPaths(context, listOf(oldPath))
    }

    fun renameDocumentUri(context: Context, uri: Uri, newName: String): Uri? {
        val clean = sanitizeName(newName)
        if (clean.isBlank()) return null
        val resolver = context.contentResolver

        val renamed = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP &&
                DocumentsContract.isDocumentUri(context, uri)
            ) {
                DocumentsContract.renameDocument(resolver, uri, clean)
            } else null
        }.getOrNull()

        if (renamed != null) return renamed

        return runCatching {
            val document = DocumentFile.fromSingleUri(context, uri)
                ?: DocumentFile.fromTreeUri(context, uri)
                ?: return@runCatching null
            if (document.renameTo(clean)) document.uri else null
        }.getOrNull()
    }

    fun deleteDocumentUri(context: Context, uri: Uri): Boolean {
        val resolver = context.contentResolver
        val deletedByContract = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT &&
                DocumentsContract.isDocumentUri(context, uri)
            ) {
                DocumentsContract.deleteDocument(resolver, uri)
            } else false
        }.getOrDefault(false)
        if (deletedByContract) return true

        return runCatching {
            (DocumentFile.fromSingleUri(context, uri)
                ?: DocumentFile.fromTreeUri(context, uri))
                ?.delete() == true
        }.getOrDefault(false)
    }

    fun moveDocumentUri(
        context: Context,
        source: Uri,
        sourceParent: Uri,
        targetParent: Uri
    ): Uri? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return null
        if (!DocumentsContract.isDocumentUri(context, source)) return null
        return runCatching {
            DocumentsContract.moveDocument(
                context.contentResolver,
                source,
                sourceParent,
                targetParent
            )
        }.getOrNull()
    }

    fun scanPaths(context: Context, paths: List<String>) {
        val clean = paths.filter { it.isNotBlank() }.distinct()
        if (clean.isEmpty()) return
        MediaScannerConnection.scanFile(context, clean.toTypedArray(), null, null)
    }

    fun scanTree(context: Context, root: File) {
        val files = runCatching {
            root.walkTopDown().filter { it.isFile }.map { it.absolutePath }.take(10000).toList()
        }.getOrDefault(emptyList())
        if (files.isNotEmpty()) scanPaths(context, files)
    }

    private fun removeStaleMediaRows(context: Context, oldPath: String, includeChildren: Boolean) {
        if (oldPath.isBlank()) return
        val resolver = context.contentResolver
        val collection = MediaStore.Files.getContentUri("external")
        val projection = arrayOf(
            MediaStore.Files.FileColumns._ID,
            MediaStore.MediaColumns.DATA
        )

        runCatching {
            resolver.query(collection, projection, null, null, null)?.use { cursor ->
                val idCol = cursor.getColumnIndex(MediaStore.Files.FileColumns._ID)
                val dataCol = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)
                if (idCol < 0 || dataCol < 0) return@use

                val prefix = oldPath.trimEnd(File.separatorChar) + File.separator
                val ids = ArrayList<Long>()
                while (cursor.moveToNext()) {
                    val path = cursor.getString(dataCol) ?: continue
                    val matches = path == oldPath || (includeChildren && path.startsWith(prefix))
                    if (matches) ids.add(cursor.getLong(idCol))
                }
                ids.forEach { id ->
                    runCatching {
                        resolver.delete(ContentUris.withAppendedId(collection, id), null, null)
                    }
                }
            }
        }
    }

    private fun sanitizeName(value: String): String =
        value.trim().replace(Regex("[\\/:*?\"<>|]"), "_").take(180)
}
