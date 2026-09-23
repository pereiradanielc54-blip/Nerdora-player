package com.nerdora.player

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Small persistent index used by the Universal Files area.
 *
 * It intentionally stores only paths/metadata chosen by the user (favorites,
 * recents and trash restore locations), never document contents.
 */
object UniversalFilesStore {
    private const val PREFS = "nerdora_universal_files"
    private const val FAVORITES = "favorites"
    private const val RECENTS = "recents"
    private const val TRASH_MAP = "trash_map"
    private const val MAX_RECENTS = 80

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun favorites(context: Context): Set<String> =
        prefs(context).getStringSet(FAVORITES, emptySet())?.toSet() ?: emptySet()

    fun isFavorite(context: Context, path: String): Boolean =
        favorites(context).contains(path)

    fun setFavorite(context: Context, path: String, favorite: Boolean) {
        val current = favorites(context).toMutableSet()
        if (favorite) current += path else current -= path
        prefs(context).edit().putStringSet(FAVORITES, current).apply()
    }

    fun toggleFavorite(context: Context, path: String): Boolean {
        val newValue = !isFavorite(context, path)
        setFavorite(context, path, newValue)
        return newValue
    }

    fun recentPaths(context: Context): List<String> {
        val raw = prefs(context).getString(RECENTS, "[]").orEmpty()
        return runCatching {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val value = array.optString(i)
                    if (value.isNotBlank()) add(value)
                }
            }
        }.getOrDefault(emptyList())
    }

    fun markOpened(context: Context, path: String) {
        if (path.isBlank()) return
        val list = recentPaths(context).toMutableList()
        list.remove(path)
        list.add(0, path)
        while (list.size > MAX_RECENTS) list.removeLast()
        val array = JSONArray()
        list.forEach { array.put(it) }
        prefs(context).edit().putString(RECENTS, array.toString()).apply()
    }

    fun clearRecents(context: Context) {
        prefs(context).edit().remove(RECENTS).apply()
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
        val fav = favorites(context).filter { File(it).exists() }.toSet()
        val recent = recentPaths(context).filter { File(it).exists() }.take(MAX_RECENTS)
        val trash = trashEntries(context).filterKeys { File(it).exists() }

        val arr = JSONArray()
        recent.forEach { arr.put(it) }
        val obj = JSONObject()
        trash.forEach { (key, value) -> obj.put(key, value) }

        prefs(context).edit()
            .putStringSet(FAVORITES, fav)
            .putString(RECENTS, arr.toString())
            .putString(TRASH_MAP, obj.toString())
            .apply()
    }
}
