package com.nerdora.player

import android.content.Context
import android.os.Environment
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import androidx.documentfile.provider.DocumentFile
import com.nerdora.player.model.DocumentRef
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Locale
import java.util.UUID

data class PrivateVaultEntry(
    val id: String,
    val storedName: String,
    val originalPath: String,
    val displayName: String,
    val mimeType: String,
    val sizeBytes: Long,
    val hiddenAt: Long,
    val isDirectory: Boolean
)

object PrivateVaultStore {
    private const val PREFS = "nerdora_private_vault"
    private const val ENTRIES = "entries"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun root(context: Context): File =
        File(context.filesDir, "nerdora_private_vault").apply { mkdirs() }

    private fun dataRoot(context: Context): File =
        File(root(context), "data").apply { mkdirs() }

    fun entries(context: Context): List<PrivateVaultEntry> {
        val raw = prefs(context).getString(ENTRIES, "[]") ?: "[]"
        val parsed = runCatching {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val obj = array.optJSONObject(i) ?: continue
                    add(
                        PrivateVaultEntry(
                            id = obj.optString("id"),
                            storedName = obj.optString("storedName"),
                            originalPath = obj.optString("originalPath"),
                            displayName = obj.optString("displayName"),
                            mimeType = obj.optString("mimeType"),
                            sizeBytes = obj.optLong("sizeBytes", 0L),
                            hiddenAt = obj.optLong("hiddenAt", 0L),
                            isDirectory = obj.optBoolean("isDirectory", false)
                        )
                    )
                }
            }
        }.getOrDefault(emptyList())

        val valid = parsed.filter { storedFile(context, it).exists() }
        if (valid.size != parsed.size) saveEntries(context, valid)
        return valid.sortedByDescending { it.hiddenAt }
    }

    fun hideFile(context: Context, source: File): FileOperationResult {
        if (!source.exists()) return FileOperationResult(false, "O arquivo não existe mais.")
        if (source.absolutePath.startsWith(root(context).absolutePath)) {
            return FileOperationResult(false, "Esse item já está no Cofre privado.")
        }

        val id = UUID.randomUUID().toString()
        val ext = if (source.isFile) source.extension.takeIf { it.isNotBlank() }?.let { ".$it" }.orEmpty() else ""
        val storedName = if (source.isDirectory) "$id.dir" else "$id$ext"
        val destination = File(dataRoot(context), storedName)
        val originalPath = source.absolutePath
        val size = if (source.isDirectory) folderSize(source) else source.length()
        val mime = if (source.isDirectory) "inode/directory" else guessMime(source.name)

        val moved = moveIntoVault(source, destination)
        if (!moved) return FileOperationResult(false, "Não foi possível mover o item para o Cofre privado.")

        val entry = PrivateVaultEntry(
            id = id,
            storedName = storedName,
            originalPath = originalPath,
            displayName = source.name,
            mimeType = mime,
            sizeBytes = size,
            hiddenAt = System.currentTimeMillis(),
            isDirectory = source.isDirectory
        )

        val updated = entries(context).toMutableList().apply { add(0, entry) }
        saveEntries(context, updated)
        LibraryStore.removeFilePathReferences(context, originalPath)
        UniversalFileIndexCache.removePrefix(context, originalPath)
        RealFileOperations.scanChangedPaths(context, listOf(originalPath))
        return FileOperationResult(true, "Movido para o Cofre privado. O original não fica mais visível nos gerenciadores comuns.", destination)
    }

    fun hideSafDocument(context: Context, document: DocumentFile): FileOperationResult {
        if (!document.exists() || !document.isFile) {
            return FileOperationResult(false, "Neste modo, o Cofre aceita arquivos individuais. Para pastas, conceda acesso completo.")
        }

        val id = UUID.randomUUID().toString()
        val displayName = document.name ?: "arquivo"
        val ext = displayName.substringAfterLast('.', "").takeIf { it.isNotBlank() }?.let { ".$it" }.orEmpty()
        val storedName = "$id$ext"
        val destination = File(dataRoot(context), storedName)
        val size = document.length().coerceAtLeast(0L)
        val mime = document.type ?: guessMime(displayName)

        val copied = runCatching {
            context.contentResolver.openInputStream(document.uri)?.use { input ->
                destination.outputStream().use { output -> input.copyTo(output) }
            } != null
        }.getOrDefault(false)

        if (!copied || !destination.exists() || (size > 0L && destination.length() != size)) {
            destination.delete()
            return FileOperationResult(false, "Não foi possível copiar o arquivo para o Cofre.")
        }

        if (!document.delete()) {
            destination.delete()
            return FileOperationResult(false, "O Android não permitiu remover o arquivo original.")
        }

        val entry = PrivateVaultEntry(
            id = id,
            storedName = storedName,
            originalPath = "saf:${document.uri}",
            displayName = displayName,
            mimeType = mime,
            sizeBytes = destination.length(),
            hiddenAt = System.currentTimeMillis(),
            isDirectory = false
        )
        saveEntries(context, entries(context).toMutableList().apply { add(0, entry) })
        return FileOperationResult(true, "Movido para o Cofre privado. Ao restaurar, será enviado para Downloads.", destination)
    }

    fun hideMedia(context: Context, media: NerdoraMedia): FileOperationResult {
        val file = RealFileOperations.resolveMediaFile(context, media)
            ?: return FileOperationResult(false, "Não foi possível localizar o arquivo físico dessa mídia.")
        return hideFile(context, file)
    }

    fun restore(context: Context, entry: PrivateVaultEntry): FileOperationResult {
        val source = storedFile(context, entry)
        if (!source.exists()) {
            removeEntry(context, entry.id)
            return FileOperationResult(false, "O arquivo protegido não existe mais.")
        }

        val desired = if (entry.originalPath.startsWith("saf:")) {
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), entry.displayName)
        } else {
            entry.originalPath.takeIf { it.isNotBlank() }?.let(::File)
                ?: File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), entry.displayName)
        }
        val parent = desired.parentFile ?: Environment.getExternalStorageDirectory()
        if (!parent.exists() && !parent.mkdirs()) {
            return FileOperationResult(false, "Não foi possível recriar a pasta original.")
        }
        val destination = if (desired.exists()) uniqueDestination(parent, desired.name) else desired

        val moved = moveOutOfVault(source, destination)
        if (!moved) return FileOperationResult(false, "Não foi possível restaurar o arquivo.")

        removeEntry(context, entry.id)
        UniversalFileIndexCache.addFromFile(context, destination)
        RealFileOperations.scanChangedPaths(context, listOf(destination.absolutePath))
        return FileOperationResult(true, "Restaurado em ${destination.parentFile?.absolutePath ?: "armazenamento"}.", destination)
    }

    fun deletePermanently(context: Context, entry: PrivateVaultEntry): FileOperationResult {
        val source = storedFile(context, entry)
        val success = if (!source.exists()) true else runCatching {
            if (source.isDirectory) source.deleteRecursively() else source.delete()
        }.getOrDefault(false)

        if (!success || source.exists()) return FileOperationResult(false, "Não foi possível excluir o item do Cofre.")
        removeEntry(context, entry.id)
        return FileOperationResult(true, "Excluído definitivamente do Cofre e do celular.")
    }

    fun asMediaFile(context: Context, file: File, displayName: String = file.name): NerdoraMedia? {
        if (!file.exists() || !file.isFile) return null
        val mime = guessMime(displayName)
        val kind = when {
            mime.startsWith("image/") -> MediaKind.IMAGE
            mime.startsWith("video/") -> MediaKind.VIDEO
            mime.startsWith("audio/") -> MediaKind.AUDIO
            else -> return null
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        return NerdoraMedia(
            id = "vault-${file.absolutePath.hashCode()}",
            kind = kind,
            url = uri.toString(),
            thumbnailUrl = if (kind == MediaKind.IMAGE) uri.toString() else null,
            title = displayName,
            description = "Cofre privado",
            username = "Nerdora Player",
            dateAddedSeconds = file.lastModified() / 1000L,
            dateModifiedSeconds = file.lastModified() / 1000L,
            folder = "Cofre privado",
            mimeType = mime,
            sizeBytes = file.length()
        )
    }

    fun asDocumentFile(context: Context, file: File, displayName: String = file.name): DocumentRef? {
        if (!file.exists() || !file.isFile) return null
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        return DocumentRef(
            uri = uri,
            name = displayName,
            mimeType = guessMime(displayName),
            sizeBytes = file.length(),
            lastModified = file.lastModified()
        )
    }

    fun asMedia(context: Context, entry: PrivateVaultEntry): NerdoraMedia? {
        if (entry.isDirectory) return null
        val kind = when {
            entry.mimeType.startsWith("image/") -> MediaKind.IMAGE
            entry.mimeType.startsWith("video/") -> MediaKind.VIDEO
            entry.mimeType.startsWith("audio/") -> MediaKind.AUDIO
            else -> return null
        }
        val file = storedFile(context, entry)
        if (!file.exists()) return null
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        return NerdoraMedia(
            id = "vault-${entry.id}",
            kind = kind,
            url = uri.toString(),
            thumbnailUrl = if (kind == MediaKind.IMAGE) uri.toString() else null,
            title = entry.displayName,
            description = "Cofre privado",
            username = "Nerdora Player",
            dateAddedSeconds = entry.hiddenAt / 1000L,
            dateModifiedSeconds = file.lastModified() / 1000L,
            folder = "Cofre privado",
            mimeType = entry.mimeType,
            sizeBytes = file.length()
        )
    }

    fun asDocument(context: Context, entry: PrivateVaultEntry): DocumentRef? {
        if (entry.isDirectory) return null
        val file = storedFile(context, entry)
        if (!file.exists()) return null
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        return DocumentRef(
            uri = uri,
            name = entry.displayName,
            mimeType = entry.mimeType,
            sizeBytes = file.length(),
            lastModified = file.lastModified()
        )
    }

    fun storedFile(context: Context, entry: PrivateVaultEntry): File =
        File(dataRoot(context), entry.storedName)

    private fun saveEntries(context: Context, entries: List<PrivateVaultEntry>) {
        val array = JSONArray()
        entries.forEach { entry ->
            array.put(JSONObject().apply {
                put("id", entry.id)
                put("storedName", entry.storedName)
                put("originalPath", entry.originalPath)
                put("displayName", entry.displayName)
                put("mimeType", entry.mimeType)
                put("sizeBytes", entry.sizeBytes)
                put("hiddenAt", entry.hiddenAt)
                put("isDirectory", entry.isDirectory)
            })
        }
        prefs(context).edit().putString(ENTRIES, array.toString()).apply()
    }

    private fun removeEntry(context: Context, id: String) {
        saveEntries(context, entries(context).filterNot { it.id == id })
    }

    private fun moveIntoVault(source: File, destination: File): Boolean {
        if (source.renameTo(destination)) return true
        return runCatching {
            if (source.isDirectory) {
                source.copyRecursively(destination, overwrite = false)
                if (!destination.exists() || !source.deleteRecursively()) {
                    destination.deleteRecursively()
                    return@runCatching false
                }
            } else {
                val expected = source.length()
                source.copyTo(destination, overwrite = false)
                if (!destination.exists() || destination.length() != expected || !source.delete()) {
                    destination.delete()
                    return@runCatching false
                }
            }
            true
        }.getOrDefault(false)
    }

    private fun moveOutOfVault(source: File, destination: File): Boolean =
        moveIntoVault(source, destination)

    private fun uniqueDestination(parent: File, preferredName: String): File {
        var destination = File(parent, preferredName)
        if (!destination.exists()) return destination
        val base = preferredName.substringBeforeLast('.', preferredName)
        val rawExt = preferredName.substringAfterLast('.', "")
        val ext = if (rawExt.isBlank() || rawExt == preferredName) "" else ".$rawExt"
        var n = 2
        while (destination.exists()) {
            destination = File(parent, "$base ($n)$ext")
            n++
        }
        return destination
    }

    private fun folderSize(folder: File): Long =
        runCatching { folder.walkTopDown().filter { it.isFile }.sumOf { it.length() } }.getOrDefault(0L)

    private fun guessMime(name: String): String {
        val ext = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
    }
}
