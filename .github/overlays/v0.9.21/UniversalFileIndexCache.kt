package com.nerdora.player

import android.content.Context
import android.util.Base64
import java.io.File

/** Índice persistente de arquivos usado por Arquivos, Home e Busca Global. */
object UniversalFileIndexCache {
    private const val PREFS = "nerdora_universal_index"
    private const val READY = "ready"
    private const val LIMITED = "limited"
    private const val FILE_NAME = "universal-files-index-v1.txt"

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun indexFile(context: Context) = File(context.filesDir, FILE_NAME)

    fun isReady(context: Context): Boolean = prefs(context).getBoolean(READY, false) && indexFile(context).exists()
    fun wasLimited(context: Context): Boolean = prefs(context).getBoolean(LIMITED, false)

    fun readPaths(context: Context): List<String> {
        val file = indexFile(context)
        if (!file.exists()) return emptyList()
        return runCatching {
            file.useLines { lines ->
                lines.mapNotNull { encoded ->
                    if (encoded.isBlank()) null else runCatching {
                        String(Base64.decode(encoded, Base64.NO_WRAP), Charsets.UTF_8)
                    }.getOrNull()
                }.toList()
            }
        }.getOrDefault(emptyList())
    }

    fun replace(context: Context, paths: List<String>, limited: Boolean) {
        write(context, paths, limited)
    }

    fun replacePath(context: Context, oldPath: String, newPath: String) {
        if (oldPath.isBlank() || newPath.isBlank() || oldPath == newPath) return
        val current = readPaths(context)
        if (current.isEmpty()) return
        val updated = current.map { if (it == oldPath) newPath else it }.distinct()
        write(context, updated, wasLimited(context))
    }

    fun replacePrefix(context: Context, oldPrefix: String, newPrefix: String) {
        if (oldPrefix.isBlank() || newPrefix.isBlank() || oldPrefix == newPrefix) return
        val prefix = oldPrefix.trimEnd(File.separatorChar) + File.separator
        val current = readPaths(context)
        if (current.isEmpty()) return
        val updated = current.map { path ->
            when {
                path == oldPrefix -> newPrefix
                path.startsWith(prefix) -> newPrefix.trimEnd(File.separatorChar) + File.separator + path.removePrefix(prefix)
                else -> path
            }
        }.distinct()
        write(context, updated, wasLimited(context))
    }

    fun removePath(context: Context, path: String) {
        if (path.isBlank()) return
        val current = readPaths(context)
        if (current.isEmpty()) return
        write(context, current.filterNot { it == path }, wasLimited(context))
    }

    fun removePrefix(context: Context, rawPrefix: String) {
        if (rawPrefix.isBlank()) return
        val prefix = rawPrefix.trimEnd(File.separatorChar) + File.separator
        val current = readPaths(context)
        if (current.isEmpty()) return
        write(
            context,
            current.filterNot { it == rawPrefix || it.startsWith(prefix) },
            wasLimited(context)
        )
    }

    fun addFromFile(context: Context, file: File) {
        if (!file.exists()) return
        val additions = if (file.isDirectory) {
            runCatching {
                file.walkTopDown().filter { it.isFile }.map { it.absolutePath }.toList()
            }.getOrDefault(emptyList())
        } else {
            listOf(file.absolutePath)
        }
        if (additions.isEmpty()) return
        write(context, (readPaths(context) + additions).distinct(), wasLimited(context))
    }

    fun clear(context: Context) {
        runCatching { indexFile(context).delete() }
        prefs(context).edit().clear().apply()
    }

    private fun write(context: Context, paths: List<String>, limited: Boolean) {
        val target = indexFile(context)
        val temp = File(context.filesDir, "$FILE_NAME.tmp")
        temp.bufferedWriter().use { out ->
            paths.asSequence()
                .filter { it.isNotBlank() }
                .distinct()
                .forEach { path ->
                    out.append(Base64.encodeToString(path.toByteArray(Charsets.UTF_8), Base64.NO_WRAP))
                    out.newLine()
                }
        }
        if (target.exists()) target.delete()
        if (!temp.renameTo(target)) {
            temp.copyTo(target, overwrite = true)
            temp.delete()
        }
        prefs(context).edit()
            .putBoolean(READY, true)
            .putBoolean(LIMITED, limited)
            .apply()
    }
}
