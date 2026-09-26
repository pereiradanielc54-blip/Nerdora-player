package com.nerdora.player

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object LibraryStore {
    private const val PREFS = "nerdora_library_store"
    private const val FAVORITES = "favorites"
    private const val HIDDEN = "hidden"
    private const val RECENTS = "recents"
    private const val PLAYLISTS = "playlists"
    private const val TRASH = "trash"
    private const val FILE_PREFIX = "file:"

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun fileKey(path: String): String = FILE_PREFIX + path

    fun favoriteIds(context: Context): Set<String> =
        prefs(context).getStringSet(FAVORITES, emptySet())?.toSet().orEmpty()

    fun isFavorite(context: Context, id: String): Boolean = favoriteIds(context).contains(id)

    fun setFavorite(context: Context, id: String, value: Boolean) {
        val set = favoriteIds(context).toMutableSet()
        if (value) set += id else set -= id
        prefs(context).edit().putStringSet(FAVORITES, set).apply()
    }

    fun favoriteFilePaths(context: Context): Set<String> =
        favoriteIds(context).asSequence()
            .filter { it.startsWith(FILE_PREFIX) }
            .map { it.removePrefix(FILE_PREFIX) }
            .filter { it.isNotBlank() }
            .toSet()

    fun isFileFavorite(context: Context, path: String): Boolean =
        favoriteIds(context).contains(fileKey(path))

    fun setFileFavorite(context: Context, path: String, value: Boolean) {
        if (path.isBlank()) return
        setFavorite(context, fileKey(path), value)
    }

    fun hiddenIds(context: Context): Set<String> =
        prefs(context).getStringSet(HIDDEN, emptySet())?.toSet().orEmpty()

    fun isHidden(context: Context, id: String): Boolean = hiddenIds(context).contains(id)

    fun setHidden(context: Context, id: String, value: Boolean) {
        val set = hiddenIds(context).toMutableSet()
        if (value) set += id else set -= id
        prefs(context).edit().putStringSet(HIDDEN, set).apply()
    }

    fun recordOpened(context: Context, id: String) {
        if (id.isBlank()) return
        val current = recentIds(context).toMutableList()
        current.remove(id)
        current.add(0, id)
        while (current.size > 120) current.removeLast()
        prefs(context).edit().putString(RECENTS, JSONArray(current).toString()).apply()
    }

    fun recordOpenedFile(context: Context, path: String) {
        if (path.isBlank()) return
        recordOpened(context, fileKey(path))
    }

    fun recentIds(context: Context): List<String> {
        val raw = prefs(context).getString(RECENTS, "[]") ?: "[]"
        return runCatching {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) add(array.optString(i))
            }.filter { it.isNotBlank() }
        }.getOrDefault(emptyList())
    }

    fun recentMediaIds(context: Context): List<String> =
        recentIds(context).filterNot { it.startsWith(FILE_PREFIX) }

    fun recentFilePaths(context: Context): List<String> =
        recentIds(context).filter { it.startsWith(FILE_PREFIX) }
            .map { it.removePrefix(FILE_PREFIX) }
            .filter { it.isNotBlank() }

    fun clearHistory(context: Context) {
        prefs(context).edit().remove(RECENTS).apply()
    }

    fun clearFileHistory(context: Context) {
        val kept = recentIds(context).filterNot { it.startsWith(FILE_PREFIX) }
        prefs(context).edit().putString(RECENTS, JSONArray(kept).toString()).apply()
    }

    fun pruneFileMetadata(context: Context) {
        val keptFavorites = favoriteIds(context).filter { entry ->
            !entry.startsWith(FILE_PREFIX) || File(entry.removePrefix(FILE_PREFIX)).exists()
        }.toSet()
        val keptRecents = recentIds(context).filter { entry ->
            !entry.startsWith(FILE_PREFIX) || File(entry.removePrefix(FILE_PREFIX)).exists()
        }
        prefs(context).edit()
            .putStringSet(FAVORITES, keptFavorites)
            .putString(RECENTS, JSONArray(keptRecents).toString())
            .apply()
    }

    fun playlists(context: Context): Map<String, List<String>> {
        val raw = prefs(context).getString(PLAYLISTS, "{}") ?: "{}"
        return runCatching {
            val obj = JSONObject(raw)
            val map = linkedMapOf<String, List<String>>()
            val keys = obj.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val array = obj.optJSONArray(key) ?: JSONArray()
                val ids = buildList {
                    for (i in 0 until array.length()) add(array.optString(i))
                }.filter { it.isNotBlank() }
                map[key] = ids
            }
            map
        }.getOrDefault(emptyMap())
    }

    fun createPlaylist(context: Context, name: String) {
        val clean = name.trim()
        if (clean.isBlank()) return
        val all = playlists(context).toMutableMap()
        if (!all.containsKey(clean)) all[clean] = emptyList()
        savePlaylists(context, all)
    }

    fun renamePlaylist(context: Context, oldName: String, newName: String) {
        val clean = newName.trim()
        if (clean.isBlank() || oldName == clean) return
        val all = playlists(context).toMutableMap()
        val items = all.remove(oldName) ?: return
        all[clean] = (all[clean].orEmpty() + items).distinct()
        savePlaylists(context, all)
    }

    fun duplicatePlaylist(context: Context, name: String) {
        val all = playlists(context).toMutableMap()
        val original = all[name] ?: return
        var candidate = "$name - cópia"
        var n = 2
        while (all.containsKey(candidate)) {
            candidate = "$name - cópia $n"
            n++
        }
        all[candidate] = original.toList()
        savePlaylists(context, all)
    }

    fun deletePlaylist(context: Context, name: String) {
        val all = playlists(context).toMutableMap()
        all.remove(name)
        savePlaylists(context, all)
    }

    fun addToPlaylist(context: Context, name: String, id: String) {
        val all = playlists(context).toMutableMap()
        val ids = all[name].orEmpty().toMutableList()
        if (!ids.contains(id)) ids += id
        all[name] = ids
        savePlaylists(context, all)
    }

    fun removeFromPlaylist(context: Context, name: String, id: String) {
        val all = playlists(context).toMutableMap()
        all[name] = all[name].orEmpty().filterNot { it == id }
        savePlaylists(context, all)
    }

    fun movePlaylistItem(context: Context, name: String, from: Int, to: Int) {
        val all = playlists(context).toMutableMap()
        val list = all[name].orEmpty().toMutableList()
        if (from !in list.indices || to !in list.indices || from == to) return
        val item = list.removeAt(from)
        list.add(to, item)
        all[name] = list
        savePlaylists(context, all)
    }

    private fun savePlaylists(context: Context, playlists: Map<String, List<String>>) {
        val obj = JSONObject()
        playlists.forEach { (name, ids) -> obj.put(name, JSONArray(ids)) }
        prefs(context).edit().putString(PLAYLISTS, obj.toString()).apply()
    }

    /** Itens removidos somente da Biblioteca. O arquivo físico continua no Android. */
    fun trashEntries(context: Context): Map<String, Long> {
        val raw = prefs(context).getString(TRASH, "{}") ?: "{}"
        return runCatching {
            val obj = JSONObject(raw)
            val result = linkedMapOf<String, Long>()
            val keys = obj.keys()
            while (keys.hasNext()) {
                val id = keys.next()
                result[id] = obj.optLong(id, 0L)
            }
            result
        }.getOrDefault(emptyMap())
    }

    fun trashIds(context: Context): Set<String> = trashEntries(context).keys

    fun moveToTrash(context: Context, id: String) {
        val map = trashEntries(context).toMutableMap()
        map[id] = System.currentTimeMillis()
        saveTrash(context, map)
    }

    fun restoreFromTrash(context: Context, id: String) {
        val map = trashEntries(context).toMutableMap()
        map.remove(id)
        saveTrash(context, map)
    }

    fun emptyTrash(context: Context) {
        prefs(context).edit().remove(TRASH).apply()
    }

    fun pruneTrash(context: Context, days: Int = 30) {
        val cutoff = System.currentTimeMillis() - days.coerceAtLeast(1) * 86_400_000L
        val map = trashEntries(context).filterValues { it >= cutoff }
        saveTrash(context, map)
    }

    private fun saveTrash(context: Context, map: Map<String, Long>) {
        val obj = JSONObject()
        map.forEach { (id, time) -> obj.put(id, time) }
        prefs(context).edit().putString(TRASH, obj.toString()).apply()
    }

    fun exportJson(context: Context): JSONObject {
        val obj = JSONObject()
        obj.put("favorites", JSONArray(favoriteIds(context).toList()))
        obj.put("hidden", JSONArray(hiddenIds(context).toList()))
        obj.put("recents", JSONArray(recentIds(context)))
        val p = JSONObject()
        playlists(context).forEach { (name, ids) -> p.put(name, JSONArray(ids)) }
        obj.put("playlists", p)
        val t = JSONObject()
        trashEntries(context).forEach { (id, time) -> t.put(id, time) }
        obj.put("trash", t)
        return obj
    }

    fun importJson(context: Context, obj: JSONObject) {
        fun arrayToSet(name: String): Set<String> {
            val arr = obj.optJSONArray(name) ?: JSONArray()
            return buildSet {
                for (i in 0 until arr.length()) arr.optString(i).takeIf { it.isNotBlank() }?.let(::add)
            }
        }
        val favorites = arrayToSet("favorites")
        val hidden = arrayToSet("hidden")
        val recents = obj.optJSONArray("recents") ?: JSONArray()
        val playlists = obj.optJSONObject("playlists") ?: JSONObject()
        val trash = obj.optJSONObject("trash") ?: JSONObject()
        prefs(context).edit()
            .putStringSet(FAVORITES, favorites)
            .putStringSet(HIDDEN, hidden)
            .putString(RECENTS, recents.toString())
            .putString(PLAYLISTS, playlists.toString())
            .putString(TRASH, trash.toString())
            .apply()
    }
}
