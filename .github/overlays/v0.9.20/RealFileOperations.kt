package com.nerdora.player

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.nerdora.player.model.NerdoraMedia
import java.io.File

data class FileOperationResult(
    val success: Boolean,
    val message: String,
    val file: File? = null
)

object RealFileOperations {
    fun renameReal(context: Context, source: File, requestedName: String): FileOperationResult {
        if (!source.exists()) return FileOperationResult(false, "O arquivo não existe mais.")
        val clean = sanitizeName(requestedName)
        if (clean.isBlank()) return FileOperationResult(false, "Digite um nome válido.")
        val parent = source.parentFile ?: return FileOperationResult(false, "Não foi possível localizar a pasta do arquivo.")
        val destination = File(parent, clean)
        if (destination.absolutePath == source.absolutePath) return FileOperationResult(true, "O nome já é esse.", source)
        if (destination.exists()) return FileOperationResult(false, "Já existe um arquivo ou pasta com esse nome.")

        val oldPath = source.absolutePath
        val success = moveExact(source, destination)
        if (!success) return FileOperationResult(false, "Não foi possível renomear o arquivo.")

        LibraryStore.replaceFilePathReferences(context, oldPath, destination.absolutePath)
        scanChangedPaths(context, listOf(oldPath, destination.absolutePath))
        return FileOperationResult(true, "Renomeado no armazenamento do celular.", destination)
    }

    fun deletePermanently(context: Context, target: File): FileOperationResult {
        if (!target.exists()) {
            LibraryStore.removeFilePathReferences(context, target.absolutePath)
            UniversalFilesStore.forgetTrash(context, target.absolutePath)
            return FileOperationResult(true, "O arquivo já não existe no celular.")
        }
        val oldPath = target.absolutePath
        val success = runCatching {
            if (target.isDirectory) target.deleteRecursively() else target.delete()
        }.getOrDefault(false)

        if (!success || target.exists()) return FileOperationResult(false, "Não foi possível excluir definitivamente.")

        LibraryStore.removeFilePathReferences(context, oldPath)
        UniversalFilesStore.forgetTrash(context, oldPath)
        scanChangedPaths(context, listOf(oldPath))
        return FileOperationResult(true, "Excluído definitivamente do celular.")
    }

    fun deleteMediaPermanently(context: Context, media: NerdoraMedia): FileOperationResult {
        val file = resolveMediaFile(context, media)
            ?: return FileOperationResult(false, "Não foi possível localizar o arquivo físico dessa mídia.")
        val result = deletePermanently(context, file)
        if (result.success && media.url.startsWith("content://")) {
            runCatching { context.contentResolver.delete(Uri.parse(media.url), null, null) }
        }
        return result
    }

    fun resolveMediaFile(context: Context, media: NerdoraMedia): File? {
        media.description.takeIf { it.startsWith("/") }?.let { path ->
            File(path).takeIf { it.exists() }?.let { return it }
        }

        val uri = runCatching { Uri.parse(media.url) }.getOrNull() ?: return null
        if (uri.scheme == "file") return uri.path?.let(::File)?.takeIf { it.exists() }
        if (uri.scheme != "content") return null

        val projection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.RELATIVE_PATH)
        } else {
            arrayOf(MediaStore.MediaColumns.DISPLAY_NAME, "_data")
        }

        return runCatching {
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                if (!cursor.moveToFirst()) return@use null
                val nameIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val displayName = if (nameIndex >= 0) cursor.getString(nameIndex).orEmpty() else media.title

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val relativeIndex = cursor.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)
                    val relative = if (relativeIndex >= 0) cursor.getString(relativeIndex).orEmpty() else ""
                    File(Environment.getExternalStorageDirectory(), relative + displayName)
                } else {
                    val dataIndex = cursor.getColumnIndex("_data")
                    if (dataIndex >= 0) File(cursor.getString(dataIndex)) else null
                }
            }
        }.getOrNull()?.takeIf { it.exists() }
    }

    fun scanChangedPaths(context: Context, paths: List<String>) {
        val clean = paths.filter { it.isNotBlank() }.distinct()
        if (clean.isEmpty()) return
        MediaScannerConnection.scanFile(context, clean.toTypedArray(), null, null)
    }

    private fun moveExact(source: File, destination: File): Boolean {
        if (source.renameTo(destination)) return true
        return runCatching {
            if (source.isDirectory) {
                source.copyRecursively(destination, overwrite = false)
                if (!destination.exists()) return@runCatching false
                if (!source.deleteRecursively()) {
                    destination.deleteRecursively()
                    return@runCatching false
                }
            } else {
                val expected = source.length()
                source.copyTo(destination, overwrite = false)
                if (!destination.exists() || destination.length() != expected) {
                    destination.delete()
                    return@runCatching false
                }
                if (!source.delete()) {
                    destination.delete()
                    return@runCatching false
                }
            }
            true
        }.getOrDefault(false)
    }

    private fun sanitizeName(value: String): String =
        value.trim().replace(Regex("[\\/:*?\"<>|]"), "_").take(180)
}
