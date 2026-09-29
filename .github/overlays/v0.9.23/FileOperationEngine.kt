package com.nerdora.player

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.UUID

enum class FileOperationType { COPY, MOVE }

data class FileOperationRequest(
    val id: String,
    val type: FileOperationType,
    val sources: List<String>,
    val destination: String,
    val createdAt: Long
)

data class FileOperationSnapshot(
    val id: String = "",
    val title: String = "",
    val percent: Int = 0,
    val processedBytes: Long = 0L,
    val totalBytes: Long = 0L,
    val state: String = "IDLE",
    val message: String = ""
)

class FileOperationCancelled : RuntimeException()

object FileOperationEngine {
    private const val PREFS = "nerdora_file_operation_engine"
    private const val QUEUE = "queue"
    private const val SNAPSHOT = "snapshot"

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @Synchronized
    fun enqueue(context: Context, sources: List<String>, destination: String, move: Boolean): String {
        val clean = sources.distinct().filter { File(it).exists() }
        require(clean.isNotEmpty()) { "Nenhum item válido para a operação." }
        val request = FileOperationRequest(
            id = UUID.randomUUID().toString(),
            type = if (move) FileOperationType.MOVE else FileOperationType.COPY,
            sources = clean,
            destination = destination,
            createdAt = System.currentTimeMillis()
        )
        writeQueue(context, readQueue(context).toMutableList().apply { add(request) })
        if (snapshot(context).state != "RUNNING") {
            setSnapshot(
                context,
                FileOperationSnapshot(
                    id = request.id,
                    title = if (move) "Mover arquivos" else "Copiar arquivos",
                    state = "QUEUED",
                    message = "Aguardando na fila"
                )
            )
        }
        ContextCompat.startForegroundService(
            context,
            Intent(context, FileOperationService::class.java).setAction(FileOperationService.ACTION_PROCESS)
        )
        return request.id
    }

    @Synchronized
    fun peek(context: Context): FileOperationRequest? = readQueue(context).firstOrNull()

    @Synchronized
    fun complete(context: Context, id: String) {
        writeQueue(context, readQueue(context).filterNot { it.id == id })
    }

    fun pendingCount(context: Context): Int = readQueue(context).size

    fun snapshot(context: Context): FileOperationSnapshot {
        val raw = prefs(context).getString(SNAPSHOT, null) ?: return FileOperationSnapshot()
        return runCatching {
            val o = JSONObject(raw)
            FileOperationSnapshot(
                id = o.optString("id"),
                title = o.optString("title"),
                percent = o.optInt("percent"),
                processedBytes = o.optLong("processedBytes"),
                totalBytes = o.optLong("totalBytes"),
                state = o.optString("state", "IDLE"),
                message = o.optString("message")
            )
        }.getOrDefault(FileOperationSnapshot())
    }

    fun setSnapshot(context: Context, value: FileOperationSnapshot) {
        val o = JSONObject().apply {
            put("id", value.id)
            put("title", value.title)
            put("percent", value.percent)
            put("processedBytes", value.processedBytes)
            put("totalBytes", value.totalBytes)
            put("state", value.state)
            put("message", value.message)
        }
        prefs(context).edit().putString(SNAPSHOT, o.toString()).apply()
    }

    fun perform(
        context: Context,
        request: FileOperationRequest,
        onProgress: (processed: Long, total: Long, currentName: String) -> Unit,
        isCancelled: () -> Boolean
    ): Pair<Int, Int> {
        val sources = request.sources.map(::File).filter { it.exists() }
        val destinationRoot = File(request.destination)
        if (!destinationRoot.exists() && !destinationRoot.mkdirs()) {
            throw IllegalStateException("Não foi possível acessar a pasta de destino.")
        }
        if (!destinationRoot.isDirectory) throw IllegalStateException("O destino não é uma pasta.")

        val total = sources.sumOf(::sizeOf).coerceAtLeast(1L)
        var processed = 0L
        var success = 0
        var failed = 0

        fun tick(delta: Long, name: String) {
            processed = (processed + delta).coerceAtMost(total)
            onProgress(processed, total, name)
            if (isCancelled()) throw FileOperationCancelled()
        }

        sources.forEach { source ->
            if (isCancelled()) throw FileOperationCancelled()
            val sourcePrefix = source.absolutePath.trimEnd(File.separatorChar) + File.separator
            if (source.isDirectory && destinationRoot.absolutePath.startsWith(sourcePrefix)) {
                failed++
                return@forEach
            }
            val target = uniqueDestination(destinationRoot, source.name)
            val sourceSize = sizeOf(source)
            try {
                if (request.type == FileOperationType.MOVE && source.renameTo(target)) {
                    tick(sourceSize, source.name)
                    updateAfterMove(context, source.absolutePath, target)
                } else {
                    copyWithProgress(source, target, ::tick, isCancelled)
                    if (request.type == FileOperationType.MOVE) {
                        val deleted = if (source.isDirectory) source.deleteRecursively() else source.delete()
                        if (!deleted) {
                            runCatching { if (target.isDirectory) target.deleteRecursively() else target.delete() }
                            throw IllegalStateException("Não foi possível remover a origem após a cópia.")
                        }
                        updateAfterMove(context, source.absolutePath, target)
                    } else {
                        UniversalFileIndexCache.addFromFile(context, target)
                        RealFileOperations.scanChangedPaths(context, listOf(target.absolutePath))
                    }
                }
                success++
            } catch (cancelled: FileOperationCancelled) {
                runCatching { if (target.isDirectory) target.deleteRecursively() else target.delete() }
                throw cancelled
            } catch (_: Throwable) {
                runCatching { if (target.exists()) { if (target.isDirectory) target.deleteRecursively() else target.delete() } }
                failed++
            }
        }
        onProgress(total, total, "")
        return success to failed
    }

    private fun copyWithProgress(
        source: File,
        destination: File,
        tick: (Long, String) -> Unit,
        isCancelled: () -> Boolean
    ) {
        if (isCancelled()) throw FileOperationCancelled()
        if (source.isDirectory) {
            if (!destination.exists() && !destination.mkdirs()) throw IllegalStateException("Falha ao criar pasta.")
            source.listFiles()?.forEach { child ->
                copyWithProgress(child, File(destination, child.name), tick, isCancelled)
            }
            destination.setLastModified(source.lastModified())
            return
        }

        destination.parentFile?.mkdirs()
        FileInputStream(source).use { input ->
            FileOutputStream(destination).use { output ->
                val buffer = ByteArray(256 * 1024)
                while (true) {
                    if (isCancelled()) throw FileOperationCancelled()
                    val read = input.read(buffer)
                    if (read <= 0) break
                    output.write(buffer, 0, read)
                    tick(read.toLong(), source.name)
                }
                output.fd.sync()
            }
        }
        destination.setLastModified(source.lastModified())
    }

    private fun updateAfterMove(context: Context, oldPath: String, destination: File) {
        LibraryStore.replaceFilePathReferences(context, oldPath, destination.absolutePath)
        if (destination.isDirectory) {
            UniversalFileIndexCache.replacePrefix(context, oldPath, destination.absolutePath)
        } else {
            UniversalFileIndexCache.replacePath(context, oldPath, destination.absolutePath)
        }
        RealFileOperations.scanChangedPaths(context, listOf(oldPath, destination.absolutePath))
    }

    private fun sizeOf(file: File): Long =
        if (file.isDirectory) runCatching { file.walkTopDown().filter { it.isFile }.sumOf { it.length() } }.getOrDefault(0L)
        else file.length().coerceAtLeast(0L)

    private fun uniqueDestination(parent: File, name: String): File {
        var candidate = File(parent, name)
        if (!candidate.exists()) return candidate
        val isDir = candidate.isDirectory
        val base = if (isDir) name else name.substringBeforeLast('.', name)
        val rawExt = if (isDir) "" else name.substringAfterLast('.', "")
        val ext = if (rawExt.isBlank() || rawExt == name) "" else ".$rawExt"
        var n = 2
        while (candidate.exists()) {
            candidate = File(parent, "$base ($n)$ext")
            n++
        }
        return candidate
    }

    @Synchronized
    private fun readQueue(context: Context): List<FileOperationRequest> {
        val raw = prefs(context).getString(QUEUE, "[]") ?: "[]"
        return runCatching {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    val sources = o.optJSONArray("sources") ?: JSONArray()
                    add(
                        FileOperationRequest(
                            id = o.getString("id"),
                            type = FileOperationType.valueOf(o.getString("type")),
                            sources = buildList {
                                for (j in 0 until sources.length()) add(sources.getString(j))
                            },
                            destination = o.getString("destination"),
                            createdAt = o.optLong("createdAt")
                        )
                    )
                }
            }
        }.getOrDefault(emptyList())
    }

    @Synchronized
    private fun writeQueue(context: Context, values: List<FileOperationRequest>) {
        val arr = JSONArray()
        values.forEach { value ->
            arr.put(JSONObject().apply {
                put("id", value.id)
                put("type", value.type.name)
                put("destination", value.destination)
                put("createdAt", value.createdAt)
                put("sources", JSONArray(value.sources))
            })
        }
        prefs(context).edit().putString(QUEUE, arr.toString()).apply()
    }
}
