package com.nerdora.player

import android.content.Context
import android.net.Uri
import org.json.JSONObject

object NerdoraBackup {
    fun build(context: Context): String {
        val root = JSONObject()
        root.put("format", "nerdora-player-backup")
        root.put("version", 2)
        root.put("createdAt", System.currentTimeMillis())
        root.put("library", LibraryStore.exportJson(context))
        root.put("preferences", PlayerPreferences.exportJson(context))
        root.put("files", UniversalFilesStore.exportJson(context))
        return root.toString(2)
    }

    fun write(context: Context, uri: Uri) {
        context.contentResolver.openOutputStream(uri, "wt")?.bufferedWriter()?.use { it.write(build(context)) }
            ?: error("Não foi possível abrir o arquivo de destino.")
    }

    fun restore(context: Context, uri: Uri) {
        val text = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            ?: error("Não foi possível ler o backup.")
        val root = JSONObject(text)
        require(root.optString("format") == "nerdora-player-backup") { "Arquivo de backup inválido." }
        root.optJSONObject("library")?.let { LibraryStore.importJson(context, it) }
        root.optJSONObject("preferences")?.let { PlayerPreferences.importJson(context, it) }
        root.optJSONObject("files")?.let { UniversalFilesStore.importJson(context, it) }
    }
}
