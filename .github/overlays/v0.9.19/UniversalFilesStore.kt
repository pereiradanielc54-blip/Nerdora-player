package com.nerdora.player

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Metadados do gerenciador universal de arquivos.
 * Favoritos e recentes agora usam LibraryStore como fonte única.
 */
object UniversalFilesStore {
    private const val PREFS = "nerdora_universal_files"
    private const val FAVORITES = "favorites"
    private const val RECENTS = "recents"
    private const val TRASH_MAP = "trash_map"
    private const val MIGRATED = "unified_metadata_migrated"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun ensureMigrated(context: Context) {
        if (prefs(context).getBoolean(MIGRATED, false)) return

        val legacyFavorites = prefs(context).getStringSet(FAVORITES, emptySet())?.toSet().orEmpty()
        legacyFavorites.forEach { path ->
            if (path.isNotBlank()) LibraryStore.setFileFavorite(context, path, true)
        }

        val raw = prefs(context).getString(RECENTS, "[]").orEmpty()
        val legacyRecents = runCatching {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    array.optString(i).takeIf { it.isNotBlank() }?.let(::add)
                }
            }
        }.getOrDefault(emptyList())

        legacyRecents.asReversed().forEach { LibraryStore.recordOpenedFile(context, it) }

        prefs(context).edit()
            .putBoolean(MIGRATED, true)
            .remove(FAVORITES)
            .remove(RECENTS)
            .apply()
    }

    fun favorites(context: Context): Set<String> {
        ensureMigrated(context)
        return LibraryStore.favoriteFilePaths(context)
    }

    fun isFavorite(context: Context, path: String): Boolean {
        ensureMigrated(context)
        return LibraryStore.isFileFavorite(context, path)
    }

    fun setFavorite(context: Context, path: String, favorite: Boolean) {
        ensureMigrated(context)
        LibraryStore.setFileFavorite(context, path, favorite)
    }

    fun toggleFavorite(context: Context, path: String): Boolean {
        val newValue = !isFavorite(context, path)
        setFavorite(context, path, newValue)
        return newValue
    }

    fun recentPaths(context: Context): List<String> {
        ensureMigrated(context)
        return LibraryStore.recentFilePaths(context)
    }

    fun markOpened(context: Context, path: String) {
        ensureMigrated(context)
        LibraryStore.recordOpenedFile(context, path)
    }

    fun clearRecents(context: Context) {
        ensureMigrated(context)
        LibraryStore.clearFileHistory(context)
    }

    fun rememberTrash(context: Context, trashedPath: String, originalPath: String) {
        val obj = trashObject(context)
        obj.put(trashedPath, originalPath)
        prefs(context).edit().putString(TRASH_MAP, obj.toString()).apply()
        setFavorite(context, originalPath, false)
    }

    fun originalPathFor(context: Context, trashedPath: String): String? =
        trashObject(context).optString(trashedPath).takeIf { it.isNotBlank() }

    fun forgetTrash(context: Context, trashedPath: String) {
        val obj = trashObject(context)
        obj.remove(trashedPath)
        prefs(context).edit().putString(TRASH_MAP, obj.toString()).apply()
    }

    private fun trashObject(context: Context): JSONObject =
        runCatching {
            JSONObject(prefs(context).getString(TRASH_MAP, "{}") ?: "{}")
        }.getOrElse { JSONObject() }

    fun trashEntries(context: Context): Map<String, String> {
        val obj = trashObject(context)
        return buildMap {
            val keys = obj.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = obj.optString(key)
                if (value.isNotBlank()) put(key, value)
            }
        }
    }

    fun prune(context: Context) {
        ensureMigrated(context)
        LibraryStore.pruneFileMetadata(context)
        val trash = trashEntries(context).filterKeys { File(it).exists() }
        val obj = JSONObject()
        trash.forEach { (key, value) -> obj.put(key, value) }
        prefs(context).edit().putString(TRASH_MAP, obj.toString()).apply()
    }

    fun exportJson(context: Context): JSONObject {
        ensureMigrated(context)
        return JSONObject().apply {
            val trash = JSONObject()
            trashEntries(context).forEach { (path, original) -> trash.put(path, original) }
            put("trash_map", trash)
        }
    }

    fun importJson(context: Context, obj: JSONObject) {
        val trash = obj.optJSONObject("trash_map") ?: JSONObject()
        prefs(context).edit()
            .putString(TRASH_MAP, trash.toString())
            .putBoolean(MIGRATED, true)
            .apply()
    }
}
