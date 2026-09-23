package com.nerdora.player

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.fragment.app.FragmentActivity
import com.nerdora.player.model.DocumentRef
import com.nerdora.player.ui.DocumentViewerScreen
import com.nerdora.player.ui.NerdoraTheme

/**
 * Entry point used by Android's "Open with" chooser for documents.
 *
 * Keeping document intents in a dedicated Activity prevents office/PDF files
 * from being misclassified as videos by MainActivity's media deep-link flow.
 */
class DocumentOpenActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val document = resolveDocument(intent)
        if (document == null) {
            finish()
            return
        }

        setContent {
            var themeMode by remember { mutableStateOf(PlayerPreferences.theme(this)) }
            var accent by remember { mutableStateOf(PlayerPreferences.accent(this)) }

            NerdoraTheme(themeMode = themeMode, accent = accent) {
                DocumentViewerScreen(
                    context = this,
                    document = document,
                    onClose = { finish() }
                )
            }
        }
    }

    private fun resolveDocument(intent: Intent?): DocumentRef? {
        if (intent == null || intent.action != Intent.ACTION_VIEW) return null
        val uri: Uri = intent.data ?: return null

        val metadata = queryMetadata(uri)
        val name = metadata.first
            ?: uri.lastPathSegment?.substringAfterLast('/')
            ?: "Documento"
        val size = metadata.second ?: 0L
        val mime = resolveMimeType(uri, name, intent.type)

        return DocumentRef(
            uri = uri,
            name = name,
            mimeType = mime,
            sizeBytes = size,
            lastModified = 0L
        )
    }

    private fun queryMetadata(uri: Uri): Pair<String?, Long?> {
        return runCatching {
            contentResolver.query(
                uri,
                arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE),
                null,
                null,
                null
            )?.use { cursor ->
                if (!cursor.moveToFirst()) return@use null to null
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                val name = if (nameIndex >= 0 && !cursor.isNull(nameIndex)) cursor.getString(nameIndex) else null
                val size = if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) cursor.getLong(sizeIndex) else null
                name to size
            } ?: (null to null)
        }.getOrDefault(null to null)
    }

    private fun resolveMimeType(uri: Uri, name: String, supplied: String?): String {
        val resolverType = runCatching { contentResolver.getType(uri) }.getOrNull()
        val candidate = supplied?.takeUnless { it.isBlank() || it == "application/octet-stream" }
            ?: resolverType?.takeUnless { it.isBlank() || it == "application/octet-stream" }

        if (candidate != null) return candidate

        return when (name.substringAfterLast('.', "").lowercase()) {
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            "pdf" -> "application/pdf"
            "txt", "log" -> "text/plain"
            "csv" -> "text/csv"
            "md", "markdown" -> "text/markdown"
            "json" -> "application/json"
            "xml" -> "application/xml"
            "html", "htm" -> "text/html"
            "css" -> "text/css"
            "yaml", "yml" -> "application/yaml"
            "zip" -> "application/zip"
            else -> supplied.orEmpty()
        }
    }
}
