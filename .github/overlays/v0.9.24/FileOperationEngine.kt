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

enum class FileOperationType { COPY, MOVE, TRASH, VAULT, DELETE }
enum class FileConflictPolicy { KEEP_BOTH, REPLACE, SKIP }

data class FileOperationRequest(
    val id: String,
    val type: FileOperationType,
    val sources: List<String>,
    val destination: String,
    val conflictPolicy: FileConflictPolicy,
    val createdAt: Long
)

data class FileNameConflict(val sourcePath: String, val destinationPath: String, val name: String)

data class FileOperationSnapshot(
    val id: String = "",
    val title: String = "",
    val percent: Int = 0,
    val processedBytes: Long = 0L,
    val totalBytes: Long = 0L,
    val speedBytesPerSec: Long = 0L,
    val etaSeconds: Long = -1L,
    val sourceCount: Int = 0,
    val startedAt: Long = 0L,
    val state: String = "IDLE",
    val message: String = ""
)

data class FileOperationSummary(
    val success: Int = 0,
    val failed: Int = 0,
    val skipped: Int = 0,
    val totalBytes: Long = 0L
)

data class FileOperationHistoryEntry(
    val id: String,
    val type: FileOperationType,
    val state: String,
    val sourceCount: Int,
    val successCount: Int,
    val failedCount: Int,
    val skippedCount: Int,
    val totalBytes: Long,
    val destination: String,
    val message: String,
    val createdAt: Long,
    val startedAt: Long,
    val finishedAt: Long
)

class FileOperationCancelled : RuntimeException()

object FileOperationEngine {
    private const val PREFS = "nerdora_file_operation_engine"
    private const val QUEUE = "queue"
    private const val SNAPSHOT = "snapshot"
    private const val HISTORY = "history"
    private const val HISTORY_LIMIT = 60

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @Synchronized
    fun enqueue(
        context: Context,
        sources: List<String>,
        destination: String,
        move: Boolean,
        conflictPolicy: FileConflictPolicy = FileConflictPolicy.KEEP_BOTH
    ): String = enqueueRequest(
        context,
        if (move) FileOperationType.MOVE else FileOperationType.COPY,
        sources,
        destination,
        conflictPolicy
    )

    @Synchronized
    fun enqueueBulk(context: Context, sources: List<String>, type: FileOperationType): String {
        require(type in setOf(FileOperationType.TRASH, FileOperationType.VAULT, FileOperationType.DELETE)) {
            "Ação em lote inválida."
        }
        return enqueueRequest(context, type, sources, "", FileConflictPolicy.KEEP_BOTH)
    }

    @Synchronized
    private fun enqueueRequest(
        context: Context,
        type: FileOperationType,
        sources: List<String>,
        destination: String,
        conflictPolicy: FileConflictPolicy
    ): String {
        val clean = sources.distinct().filter { File(it).exists() }
        require(clean.isNotEmpty()) { "Nenhum item válido para a operação." }

        if (type in setOf(FileOperationType.COPY, FileOperationType.MOVE)) {
            val target = File(destination)
            require(target.exists() && target.isDirectory) { "Escolha uma pasta de destino válida." }
        }

        val request = FileOperationRequest(
            id = UUID.randomUUID().toString(),
            type = type,
            sources = clean,
            destination = destination,
            conflictPolicy = conflictPolicy,
            createdAt = System.currentTimeMillis()
        )

        writeQueue(context, readQueue(context).toMutableList().apply { add(request) })
        if (snapshot(context).state != "RUNNING") {
            setSnapshot(
                context,
                FileOperationSnapshot(
                    id = request.id,
                    title = titleFor(request.type, false),
                    sourceCount = request.sources.size,
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

    fun detectConflicts(sources: List<String>, destination: String): List<FileNameConflict> {
        val parent = File(destination)
        if (!parent.exists() || !parent.isDirectory) return emptyList()
        return sources.distinct().mapNotNull { raw ->
            val source = File(raw)
            if (!source.exists()) return@mapNotNull null
            val target = File(parent, source.name)
            if (!target.exists() || target.absolutePath == source.absolutePath) null
            else FileNameConflict(source.absolutePath, target.absolutePath, source.name)
        }
    }

    @Synchronized fun queue(context: Context): List<FileOperationRequest> = readQueue(context)
    @Synchronized fun peek(context: Context): FileOperationRequest? = readQueue(context).firstOrNull()

    @Synchronized
    fun complete(context: Context, id: String) {
        writeQueue(context, readQueue(context).filterNot { it.id == id })
    }

    fun pendingCount(context: Context): Int = readQueue(context).size

    fun cancelActive(context: Context, id: String) {
        runCatching {
            context.startService(
                Intent(context, FileOperationService::class.java)
                    .setAction(FileOperationService.ACTION_CANCEL)
                    .putExtra(FileOperationService.EXTRA_ID, id)
            )
        }
    }

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
                speedBytesPerSec = o.optLong("speedBytesPerSec"),
                etaSeconds = o.optLong("etaSeconds", -1L),
                sourceCount = o.optInt("sourceCount"),
                startedAt = o.optLong("startedAt"),
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
            put("speedBytesPerSec", value.speedBytesPerSec)
            put("etaSeconds", value.etaSeconds)
            put("sourceCount", value.sourceCount)
            put("startedAt", value.startedAt)
            put("state", value.state)
            put("message", value.message)
        }
        prefs(context).edit().putString(SNAPSHOT, o.toString()).apply()
    }

    fun history(context: Context): List<FileOperationHistoryEntry> {
        val raw = prefs(context).getString(HISTORY, "[]") ?: "[]"
        return runCatching {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    add(
                        FileOperationHistoryEntry(
                            id = o.optString("id"),
                            type = runCatching { FileOperationType.valueOf(o.optString("type")) }.getOrDefault(FileOperationType.COPY),
                            state = o.optString("state"),
                            sourceCount = o.optInt("sourceCount"),
                            successCount = o.optInt("successCount"),
                            failedCount = o.optInt("failedCount"),
                            skippedCount = o.optInt("skippedCount"),
                            totalBytes = o.optLong("totalBytes"),
                            destination = o.optString("destination"),
                            message = o.optString("message"),
                            createdAt = o.optLong("createdAt"),
                            startedAt = o.optLong("startedAt"),
                            finishedAt = o.optLong("finishedAt")
                        )
                    )
                }
            }
        }.getOrDefault(emptyList()).sortedByDescending { it.finishedAt }
    }

    @Synchronized
    fun recordHistory(
        context: Context,
        request: FileOperationRequest,
        state: String,
        message: String,
        summary: FileOperationSummary,
        startedAt: Long,
        finishedAt: Long = System.currentTimeMillis()
    ) {
        val entry = FileOperationHistoryEntry(
            id = request.id,
            type = request.type,
            state = state,
            sourceCount = request.sources.size,
            successCount = summary.success,
            failedCount = summary.failed,
            skippedCount = summary.skipped,
            totalBytes = summary.totalBytes,
            destination = request.destination,
            message = message,
            createdAt = request.createdAt,
            startedAt = startedAt,
            finishedAt = finishedAt
        )
        val values = history(context).filterNot { it.id == entry.id }.toMutableList()
        values.add(0, entry)
        writeHistory(context, values.take(HISTORY_LIMIT))
    }

    fun clearHistory(context: Context) {
        prefs(context).edit().remove(HISTORY).apply()
    }

    fun perform(
        context: Context,
        request: FileOperationRequest,
        onProgress: (processed: Long, total: Long, currentName: String) -> Unit,
        isCancelled: () -> Boolean
    ): FileOperationSummary {
        val sources = request.sources.map(::File).filter { it.exists() }
        val total = sources.sumOf(::sizeOf).coerceAtLeast(1L)
        var processed = 0L
        var success = 0
        var failed = 0
        var skipped = 0

        fun tick(delta: Long, name: String) {
            processed = (processed + delta).coerceAtMost(total)
            onProgress(processed, total, name)
            if (isCancelled()) throw FileOperationCancelled()
        }

        if (request.type in setOf(FileOperationType.TRASH, FileOperationType.VAULT, FileOperationType.DELETE)) {
            sources.forEach { source ->
                if (isCancelled()) throw FileOperationCancelled()
                val size = sizeOf(source)
                val result = when (request.type) {
                    FileOperationType.TRASH -> FileBulkOperations.moveToTrash(context, source)
                    FileOperationType.VAULT -> FileBulkOperations.moveToVault(context, source)
                    FileOperationType.DELETE -> FileBulkOperations.deletePermanently(context, source)
                    else -> FileOperationResult(false, "Ação inválida.")
                }
                if (result.success) success++ else failed++
                tick(size, source.name)
            }
            onProgress(total, total, "")
            return FileOperationSummary(success, failed, skipped, total)
        }

        val destinationRoot = File(request.destination)
        if (!destinationRoot.exists() && !destinationRoot.mkdirs()) {
            throw IllegalStateException("Não foi possível acessar a pasta de destino.")
        }
        if (!destinationRoot.isDirectory) throw IllegalStateException("O destino não é uma pasta.")

        sources.forEach { source ->
            if (isCancelled()) throw FileOperationCancelled()
            val sourceSize = sizeOf(source)
            val sourcePrefix = source.absolutePath.trimEnd(File.separatorChar) + File.separator
            if (source.isDirectory && destinationRoot.absolutePath.startsWith(sourcePrefix)) {
                failed++
                tick(sourceSize, source.name)
                return@forEach
            }

            val naturalTarget = File(destinationRoot, source.name)
            val samePath = naturalTarget.absolutePath == source.absolutePath
            if (samePath && request.type == FileOperationType.MOVE) {
                skipped++
                tick(sourceSize, source.name)
                return@forEach
            }
            if (samePath && request.type == FileOperationType.COPY &&
                request.conflictPolicy != FileConflictPolicy.KEEP_BOTH
            ) {
                skipped++
                tick(sourceSize, source.name)
                return@forEach
            }

            val target = when {
                samePath && request.type == FileOperationType.COPY ->
                    uniqueDestination(destinationRoot, source.name, source.isDirectory)
                !naturalTarget.exists() -> naturalTarget
                request.conflictPolicy == FileConflictPolicy.SKIP -> {
                    skipped++
                    tick(sourceSize, source.name)
                    return@forEach
                }
                request.conflictPolicy == FileConflictPolicy.KEEP_BOTH ->
                    uniqueDestination(destinationRoot, source.name, source.isDirectory)
                else -> naturalTarget
            }

            try {
                if (request.conflictPolicy == FileConflictPolicy.REPLACE && target.exists()) {
                    replaceSafely(context, source, target, request.type == FileOperationType.MOVE, ::tick, isCancelled)
                } else if (request.type == FileOperationType.MOVE && source.renameTo(target)) {
                    tick(sourceSize, source.name)
                    updateAfterMove(context, source.absolutePath, target)
                } else {
                    copyWithProgress(source, target, ::tick, isCancelled)
                    if (request.type == FileOperationType.MOVE) {
                        val deleted = if (source.isDirectory) source.deleteRecursively() else source.delete()
                        if (!deleted) {
                            runCatching { deleteExact(target) }
                            throw IllegalStateException("Não foi possível remover a origem após a cópia.")
                        }
                        updateAfterMove(context, source.absolutePath, target)
                    } else {
                        indexCopiedTarget(context, target)
                    }
                }
                success++
            } catch (cancelled: FileOperationCancelled) {
                if (request.conflictPolicy != FileConflictPolicy.REPLACE) {
                    runCatching { if (target.exists()) deleteExact(target) }
                }
                throw cancelled
            } catch (_: Throwable) {
                if (request.conflictPolicy != FileConflictPolicy.REPLACE) {
                    runCatching { if (target.exists()) deleteExact(target) }
                }
                failed++
            }
        }

        onProgress(total, total, "")
        return FileOperationSummary(success, failed, skipped, total)
    }

    private fun replaceSafely(
        context: Context,
        source: File,
        target: File,
        move: Boolean,
        tick: (Long, String) -> Unit,
        isCancelled: () -> Boolean
    ) {
        val staging = File(target.parentFile, ".nerdora_tmp_${UUID.randomUUID()}")
        try {
            copyWithProgress(source, staging, tick, isCancelled)
            if (!deleteExact(target) || target.exists()) {
                throw IllegalStateException("Não foi possível substituir o item existente.")
            }
            if (!staging.renameTo(target) && !moveExact(staging, target)) {
                throw IllegalStateException("Não foi possível finalizar a substituição.")
            }
            if (move) {
                val oldPath = source.absolutePath
                if (!deleteExact(source)) throw IllegalStateException("Não foi possível remover a origem.")
                updateAfterMove(context, oldPath, target)
            } else {
                indexCopiedTarget(context, target)
            }
        } finally {
            if (staging.exists()) runCatching { deleteExact(staging) }
        }
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
                source.copyTo(destination, overwrite = false)
                if (!destination.exists() || destination.length() != source.length() || !source.delete()) {
                    runCatching { destination.delete() }
                    false
                } else true
            }
        }.getOrDefault(false)
    }

    private fun deleteExact(file: File): Boolean =
        if (!file.exists()) true else runCatching {
            if (file.isDirectory) file.deleteRecursively() else file.delete()
        }.getOrDefault(false)

    private fun updateAfterMove(context: Context, oldPath: String, destination: File) {
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

    private fun sizeOf(file: File): Long =
        if (file.isDirectory) runCatching { file.walkTopDown().filter { it.isFile }.sumOf { it.length() } }.getOrDefault(0L)
        else file.length().coerceAtLeast(0L)

    private fun uniqueDestination(parent: File, name: String, isDirectory: Boolean): File {
        var candidate = File(parent, name)
        if (!candidate.exists()) return candidate
        val base = if (isDirectory) name else name.substringBeforeLast('.', name)
        val rawExt = if (isDirectory) "" else name.substringAfterLast('.', "")
        val ext = if (rawExt.isBlank() || rawExt == name) "" else ".$rawExt"
        var n = 2
        while (candidate.exists()) {
            candidate = File(parent, "$base ($n)$ext")
            n++
        }
        return candidate
    }

    fun titleFor(type: FileOperationType, running: Boolean = true): String = when (type) {
        FileOperationType.COPY -> if (running) "Copiando arquivos" else "Copiar arquivos"
        FileOperationType.MOVE -> if (running) "Movendo arquivos" else "Mover arquivos"
        FileOperationType.TRASH -> if (running) "Movendo para a Lixeira" else "Enviar para a Lixeira"
        FileOperationType.VAULT -> if (running) "Protegendo no Cofre" else "Enviar para o Cofre"
        FileOperationType.DELETE -> if (running) "Excluindo arquivos" else "Excluir arquivos"
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
                            sources = buildList { for (j in 0 until sources.length()) add(sources.getString(j)) },
                            destination = o.optString("destination"),
                            conflictPolicy = runCatching {
                                FileConflictPolicy.valueOf(o.optString("conflictPolicy", FileConflictPolicy.KEEP_BOTH.name))
                            }.getOrDefault(FileConflictPolicy.KEEP_BOTH),
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
                put("conflictPolicy", value.conflictPolicy.name)
                put("createdAt", value.createdAt)
                put("sources", JSONArray(value.sources))
            })
        }
        prefs(context).edit().putString(QUEUE, arr.toString()).apply()
    }

    private fun writeHistory(context: Context, values: List<FileOperationHistoryEntry>) {
        val arr = JSONArray()
        values.forEach { value ->
            arr.put(JSONObject().apply {
                put("id", value.id)
                put("type", value.type.name)
                put("state", value.state)
                put("sourceCount", value.sourceCount)
                put("successCount", value.successCount)
                put("failedCount", value.failedCount)
                put("skippedCount", value.skippedCount)
                put("totalBytes", value.totalBytes)
                put("destination", value.destination)
                put("message", value.message)
                put("createdAt", value.createdAt)
                put("startedAt", value.startedAt)
                put("finishedAt", value.finishedAt)
            })
        }
        prefs(context).edit().putString(HISTORY, arr.toString()).apply()
    }
}
