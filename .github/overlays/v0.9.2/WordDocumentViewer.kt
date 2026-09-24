@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.nerdora.player.ui

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.model.DocumentRef
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.ByteArrayOutputStream
import java.io.Closeable
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.Locale
import java.util.zip.ZipInputStream
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt

private data class WordPrepared(val pdf: File, val text: String, val legacy: Boolean)
private data class WordPayload(val html: String, val text: String)
private data class PageSetup(
    var widthPt: Float = 595f,
    var heightPt: Float = 842f,
    var topPt: Float = 54f,
    var rightPt: Float = 54f,
    var bottomPt: Float = 54f,
    var leftPt: Float = 54f
)

@Composable
fun WordDocumentViewer(context: Context, document: DocumentRef) {
    val prepared by produceState<Result<WordPrepared>?>(null, document.uri, document.sizeBytes) {
        value = runCatching { prepareWord(context, document) }
    }
    when (val state = prepared) {
        null -> Column(
            Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text("Preparando Word…")
            Text("A primeira abertura cria um PDF temporário em cache.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        else -> state.fold(
            onSuccess = { WordPdfViewer(context, document, it) },
            onFailure = {
                Column(
                    Modifier.fillMaxSize().padding(28.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Não foi possível preparar este Word", fontSize = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(it.message ?: "Erro desconhecido", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        )
    }
}

@Composable
private fun WordPdfViewer(context: Context, document: DocumentRef, prepared: WordPrepared) {
    val pdf = remember(prepared.pdf.absolutePath) { runCatching { WordPdfDoc(prepared.pdf) }.getOrNull() }
    DisposableEffect(pdf) { onDispose { pdf?.close() } }
    if (pdf == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Não foi possível abrir o PDF temporário.") }
        return
    }

    val prefs = remember { context.getSharedPreferences("nerdora_word_progress", Context.MODE_PRIVATE) }
    val progressKey = remember(document.uri) { "word_" + document.uri.toString().hashCode() }
    val saved = prefs.getInt(progressKey, 0).coerceIn(0, (pdf.pageCount - 1).coerceAtLeast(0))
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = saved)
    val scope = rememberCoroutineScope()
    val screenWidth = LocalConfiguration.current.screenWidthDp
    var zoom by remember { mutableFloatStateOf(1f) }
    var current by remember { mutableIntStateOf(saved) }
    var showThumbs by remember { mutableStateOf(false) }
    var showSearch by remember { mutableStateOf(false) }
    var showGoto by remember { mutableStateOf(false) }
    var showText by remember { mutableStateOf(false) }

    LaunchedEffect(listState, pdf.pageCount) {
        snapshotFlow { listState.firstVisibleItemIndex }.collect { index ->
            current = index.coerceIn(0, (pdf.pageCount - 1).coerceAtLeast(0))
            prefs.edit().putInt(progressKey, current).apply()
        }
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text((current + 1).toString() + " / " + pdf.pageCount, modifier = Modifier.width(64.dp), fontSize = 11.sp)
            TextButton(onClick = { showThumbs = !showThumbs }) { Text("Miniaturas", fontSize = 11.sp) }
            TextButton(onClick = { showSearch = true }) { Text("Buscar", fontSize = 11.sp) }
            TextButton(onClick = { showGoto = true }) { Text("Ir", fontSize = 11.sp) }
            TextButton(onClick = { showText = true }) { Text("Texto", fontSize = 11.sp) }
        }

        if (showThumbs) {
            LazyRow(Modifier.fillMaxWidth().height(132.dp).padding(vertical = 4.dp)) {
                items((0 until pdf.pageCount).toList()) { index ->
                    val thumb by produceState<Bitmap?>(null, index) {
                        value = withContext(Dispatchers.IO) { runCatching { pdf.render(index, 120) }.getOrNull() }
                    }
                    Column(
                        Modifier.width(96.dp).padding(horizontal = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (thumb != null) {
                            Image(
                                thumb!!.asImageBitmap(),
                                "Página " + (index + 1),
                                Modifier.width(82.dp).height(105.dp).pointerInput(index) {
                                    detectTapGestures(onTap = { scope.launch { listState.animateScrollToItem(index) } })
                                },
                                contentScale = ContentScale.Fit
                            )
                        } else {
                            Box(Modifier.width(82.dp).height(105.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        }
                        Text((index + 1).toString(), fontSize = 9.sp)
                    }
                }
            }
        }

        LazyColumn(state = listState, modifier = Modifier.fillMaxSize()) {
            itemsIndexed((0 until pdf.pageCount).toList(), key = { _, item -> item }) { _, index ->
                val bitmap by produceState<Bitmap?>(null, index, zoom) {
                    val target = (screenWidth * zoom).roundToInt().coerceIn(320, 2800)
                    value = withContext(Dispatchers.IO) { runCatching { pdf.render(index, target) }.getOrNull() }
                }
                Column(
                    Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Página " + (index + 1), fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (bitmap == null) {
                        Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                    } else {
                        Row(
                            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Image(
                                bitmap!!.asImageBitmap(),
                                "Página " + (index + 1),
                                Modifier
                                    .width((screenWidth * zoom).dp)
                                    .pointerInput(Unit) {
                                        detectTransformGestures { _, _, scale, _ ->
                                            zoom = (zoom * scale).coerceIn(0.75f, 3.2f)
                                        }
                                    }
                                    .pointerInput(Unit) {
                                        detectTapGestures(onDoubleTap = {
                                            zoom = if (zoom < 1.6f) 2f else 1f
                                        })
                                    },
                                contentScale = ContentScale.FillWidth
                            )
                        }
                    }
                }
            }
        }
    }

    if (showSearch) WordSearchDialog(
        text = prepared.text,
        pageCount = pdf.pageCount,
        onDismiss = { showSearch = false },
        onPage = { page ->
            showSearch = false
            scope.launch { listState.animateScrollToItem(page.coerceIn(0, pdf.pageCount - 1)) }
        }
    )

    if (showGoto) {
        var value by remember { mutableStateOf((current + 1).toString()) }
        AlertDialog(
            onDismissRequest = { showGoto = false },
            title = { Text("Ir para página") },
            text = {
                OutlinedTextField(
                    value = value,
                    onValueChange = { value = it.filter(Char::isDigit) },
                    label = { Text("1 a " + pdf.pageCount) }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    val page = (value.toIntOrNull() ?: 1).coerceIn(1, pdf.pageCount) - 1
                    showGoto = false
                    scope.launch { listState.animateScrollToItem(page) }
                }) { Text("Ir") }
            },
            dismissButton = { TextButton(onClick = { showGoto = false }) { Text("Cancelar") } }
        )
    }

    if (showText) {
        AlertDialog(
            onDismissRequest = { showText = false },
            title = { Text(if (prepared.legacy) "Texto do DOC legado" else "Texto do documento") },
            text = {
                Box(Modifier.heightIn(max = 520.dp).verticalScroll(rememberScrollState())) {
                    SelectionContainer { Text(prepared.text.ifBlank { "Nenhum texto extraível." }, fontSize = 12.sp) }
                }
            },
            confirmButton = { TextButton(onClick = { showText = false }) { Text("Fechar") } }
        )
    }
}

@Composable
private fun WordSearchDialog(text: String, pageCount: Int, onDismiss: () -> Unit, onPage: (Int) -> Unit) {
    var query by remember { mutableStateOf("") }
    val normalized = query.trim()
    val matches = remember(text, normalized) {
        if (normalized.length < 2) emptyList() else {
            val lowerText = text.lowercase(Locale.ROOT)
            val lowerQuery = normalized.lowercase(Locale.ROOT)
            buildList {
                var start = 0
                while (size < 100) {
                    val found = lowerText.indexOf(lowerQuery, start)
                    if (found < 0) break
                    add(found)
                    start = found + lowerQuery.length.coerceAtLeast(1)
                }
            }
        }
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Buscar no Word") },
        text = {
            Column {
                OutlinedTextField(query, { query = it }, label = { Text("Palavra ou frase") })
                Spacer(Modifier.height(8.dp))
                Text(
                    if (normalized.length < 2) "Digite pelo menos 2 caracteres."
                    else matches.size.toString() + " ocorrência(s) encontrada(s).",
                    fontSize = 12.sp
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = matches.isNotEmpty(),
                onClick = {
                    val pos = matches.firstOrNull() ?: 0
                    val ratio = if (text.isBlank()) 0f else pos.toFloat() / text.length.toFloat()
                    val page = (ratio * pageCount).toInt().coerceIn(0, (pageCount - 1).coerceAtLeast(0))
                    onPage(page)
                }
            ) { Text("Ir ao resultado") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Fechar") } }
    )
}

private suspend fun prepareWord(context: Context, document: DocumentRef): WordPrepared {
    val cacheDir = File(context.cacheDir, "word_pdf").apply { mkdirs() }
    cleanupWordCache(cacheDir)
    val modified = queryLastModified(context, document.uri)
    val fingerprint = sha256(document.uri.toString() + "|" + document.sizeBytes + "|" + modified)
    val pdf = File(cacheDir, fingerprint + ".pdf")
    val txt = File(cacheDir, fingerprint + ".txt")
    val legacy = document.name.substringAfterLast('.', "").equals("doc", true) ||
        document.mimeType.equals("application/msword", true)

    if (pdf.exists() && pdf.length() > 0 && txt.exists()) {
        return WordPrepared(pdf, txt.readText(), legacy)
    }

    val payload = withContext(Dispatchers.IO) {
        if (legacy) legacyDocPayload(context, document.uri) else docxPayload(context, document.uri)
    }
    val tmp = File(cacheDir, fingerprint + ".tmp.pdf")
    if (tmp.exists()) tmp.delete()
    htmlToPdf(context, payload.html, tmp)
    if (!tmp.exists() || tmp.length() == 0L) error("A conversão do Word para PDF não gerou conteúdo.")
    if (pdf.exists()) pdf.delete()
    if (!tmp.renameTo(pdf)) {
        tmp.copyTo(pdf, overwrite = true)
        tmp.delete()
    }
    txt.writeText(payload.text)
    return WordPrepared(pdf, payload.text, legacy)
}

private fun cleanupWordCache(dir: File) {
    val files = dir.listFiles()?.sortedByDescending { it.lastModified() }.orEmpty()
    if (files.size <= 30) return
    files.drop(30).forEach { runCatching { it.delete() } }
}

private fun queryLastModified(context: Context, uri: Uri): Long {
    return runCatching {
        context.contentResolver.query(
            uri,
            arrayOf("last_modified", "_size"),
            null,
            null,
            null
        )?.use { cursor ->
            if (!cursor.moveToFirst()) return@use 0L
            val i = cursor.getColumnIndex("last_modified")
            if (i >= 0) cursor.getLong(i) else 0L
        } ?: 0L
    }.getOrDefault(0L)
}

private fun sha256(value: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray())
    return digest.joinToString("") { "%02x".format(it) }
}

private fun docxPayload(context: Context, uri: Uri): WordPayload {
    val zip = readWordZip(context, uri)
    val documentXml = zip["word/document.xml"]?.toString(Charsets.UTF_8) ?: error("DOCX inválido: word/document.xml ausente.")
    val rels = parseRelationships(zip["word/_rels/document.xml.rels"]?.toString(Charsets.UTF_8).orEmpty())
    val setup = parsePageSetup(documentXml)
    val header = firstText(zip, "word/header")
    val footer = firstText(zip, "word/footer")
    val rendered = renderDocxBody(documentXml, zip, rels)
    val css = buildString {
        append("@page{size:")
        append(setup.widthPt)
        append("pt ")
        append(setup.heightPt)
        append("pt;margin:")
        append(setup.topPt)
        append("pt ")
        append(setup.rightPt)
        append("pt ")
        append(setup.bottomPt)
        append("pt ")
        append(setup.leftPt)
        append("pt}")
        append("*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,sans-serif}")
        append("body{font-size:11pt;line-height:1.35}p{margin:0 0 8pt 0;white-space:pre-wrap}")
        append("table{border-collapse:collapse;width:100%;margin:7pt 0}td,th{border:1px solid #888;padding:4pt;vertical-align:top}")
        append("img{max-width:100%;height:auto}.page-break{break-after:page;page-break-after:always}")
        append(".header{position:fixed;top:-35pt;left:0;right:0;font-size:8.5pt;color:#555}.footer{position:fixed;bottom:-35pt;left:0;right:0;font-size:8.5pt;color:#555}")
        append(".doc-body{width:100%}")
    }
    val html = buildString {
        append("<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>")
        append("<style>")
        append(css)
        append("</style></head><body>")
        if (header.isNotBlank()) {
            append("<div class='header'>")
            append(htmlEscape(header))
            append("</div>")
        }
        if (footer.isNotBlank()) {
            append("<div class='footer'>")
            append(htmlEscape(footer))
            append("</div>")
        }
        append("<div class='doc-body'>")
        append(rendered.first)
        append("</div></body></html>")
    }
    return WordPayload(html, rendered.second)
}

private fun renderDocxBody(
    xml: String,
    zip: Map<String, ByteArray>,
    rels: Map<String, String>
): Pair<String, String> {
    val p = parser(xml)
    val out = StringBuilder()
    val plain = StringBuilder()
    val para = StringBuilder()
    var inParagraph = false
    var inText = false
    var align = "left"
    var list = false
    var bold = false
    var italic = false
    var underline = false
    var strike = false
    var sizePt = 11f
    var color: String? = null
    var font: String? = null
    var tableDepth = 0
    var event = p.eventType

    while (event != XmlPullParser.END_DOCUMENT) {
        val tag = p.name?.substringAfter(':').orEmpty()
        if (event == XmlPullParser.START_TAG) {
            when (tag) {
                "p" -> {
                    inParagraph = true
                    para.clear()
                    align = "left"
                    list = false
                }
                "jc" -> if (inParagraph) align = cssAlign(attrLocal(p, "val").orEmpty())
                "numId" -> if (inParagraph) list = true
                "r" -> {
                    bold = false
                    italic = false
                    underline = false
                    strike = false
                    sizePt = 11f
                    color = null
                    font = null
                }
                "b" -> bold = true
                "i" -> italic = true
                "u" -> underline = true
                "strike", "dstrike" -> strike = true
                "sz" -> attrLocal(p, "val")?.toFloatOrNull()?.let { sizePt = (it / 2f).coerceIn(6f, 72f) }
                "color" -> attrLocal(p, "val")?.takeIf { it.matches(Regex("[0-9A-Fa-f]{6}")) }?.let { color = "#" + it }
                "rFonts" -> font = attrLocal(p, "ascii") ?: attrLocal(p, "hAnsi")
                "t" -> inText = true
                "tab" -> if (inParagraph) para.append("&emsp;")
                "br" -> if (inParagraph) {
                    if (attrLocal(p, "type") == "page") para.append("<span class='page-break'></span>") else para.append("<br>")
                }
                "lastRenderedPageBreak" -> if (inParagraph) para.append("<span class='page-break'></span>")
                "blip" -> if (inParagraph) {
                    val id = attrLocal(p, "embed")
                    val target = id?.let { rels[it] }
                    val bytes = target?.let { zip[it] }
                    if (bytes != null) {
                        para.append("<img src='data:")
                        para.append(wordImageMime(target))
                        para.append(";base64,")
                        para.append(android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP))
                        para.append("'>")
                    }
                }
                "tbl" -> {
                    if (inParagraph && para.isNotEmpty()) flushParagraph(out, plain, para, align, list)
                    inParagraph = false
                    out.append("<table>")
                    tableDepth++
                }
                "tr" -> if (tableDepth > 0) out.append("<tr>")
                "tc" -> if (tableDepth > 0) out.append("<td>")
            }
        } else if (event == XmlPullParser.TEXT && inText && inParagraph) {
            val raw = p.text ?: ""
            if (raw.isNotEmpty()) {
                plain.append(raw)
                var style = StringBuilder()
                if (bold) style.append("font-weight:700;")
                if (italic) style.append("font-style:italic;")
                if (underline || strike) {
                    style.append("text-decoration:")
                    if (underline) style.append(" underline")
                    if (strike) style.append(" line-through")
                    style.append(";")
                }
                style.append("font-size:").append(sizePt).append("pt;")
                color?.let { style.append("color:").append(it).append(";") }
                font?.let { style.append("font-family:'").append(htmlEscapeAttr(it)).append("',sans-serif;") }
                para.append("<span style='").append(style).append("'>").append(htmlEscape(raw)).append("</span>")
            }
        } else if (event == XmlPullParser.END_TAG) {
            when (tag) {
                "t" -> inText = false
                "p" -> {
                    if (inParagraph) {
                        flushParagraph(out, plain, para, align, list)
                        plain.append('\n')
                    }
                    inParagraph = false
                }
                "tc" -> if (tableDepth > 0) out.append("</td>")
                "tr" -> if (tableDepth > 0) out.append("</tr>")
                "tbl" -> {
                    if (tableDepth > 0) {
                        out.append("</table>")
                        tableDepth--
                    }
                }
            }
        }
        event = p.next()
    }
    return out.toString() to plain.toString().trim()
}

private fun flushParagraph(
    out: StringBuilder,
    plain: StringBuilder,
    para: StringBuilder,
    align: String,
    list: Boolean
) {
    out.append("<p style='text-align:").append(align).append("'>")
    if (list) {
        out.append("•&nbsp;")
        plain.append("• ")
    }
    if (para.isEmpty()) out.append("&nbsp;") else out.append(para)
    out.append("</p>")
}

private fun parseRelationships(xml: String): Map<String, String> {
    if (xml.isBlank()) return emptyMap()
    val p = parser(xml)
    val out = linkedMapOf<String, String>()
    var e = p.eventType
    while (e != XmlPullParser.END_DOCUMENT) {
        if (e == XmlPullParser.START_TAG && p.name?.substringAfter(':') == "Relationship") {
            val id = attrLocal(p, "Id")
            val target = attrLocal(p, "Target")
            if (!id.isNullOrBlank() && !target.isNullOrBlank() && !target.contains("://")) {
                val normalized = if (target.startsWith("/")) target.removePrefix("/") else "word/" + target.removePrefix("../")
                out[id] = normalizeWordPath(normalized)
            }
        }
        e = p.next()
    }
    return out
}

private fun normalizeWordPath(path: String): String {
    val parts = ArrayDeque<String>()
    path.replace('\\', '/').split('/').forEach { part ->
        when (part) {
            "", "." -> Unit
            ".." -> if (parts.isNotEmpty()) parts.removeLast()
            else -> parts.addLast(part)
        }
    }
    return parts.joinToString("/")
}

private fun parsePageSetup(xml: String): PageSetup {
    val result = PageSetup()
    val p = parser(xml)
    var e = p.eventType
    while (e != XmlPullParser.END_DOCUMENT) {
        if (e == XmlPullParser.START_TAG) {
            when (p.name?.substringAfter(':')) {
                "pgSz" -> {
                    attrLocal(p, "w")?.toFloatOrNull()?.let { result.widthPt = it / 20f }
                    attrLocal(p, "h")?.toFloatOrNull()?.let { result.heightPt = it / 20f }
                }
                "pgMar" -> {
                    attrLocal(p, "top")?.toFloatOrNull()?.let { result.topPt = it / 20f }
                    attrLocal(p, "right")?.toFloatOrNull()?.let { result.rightPt = it / 20f }
                    attrLocal(p, "bottom")?.toFloatOrNull()?.let { result.bottomPt = it / 20f }
                    attrLocal(p, "left")?.toFloatOrNull()?.let { result.leftPt = it / 20f }
                }
            }
        }
        e = p.next()
    }
    return result
}

private fun firstText(zip: Map<String, ByteArray>, prefix: String): String {
    val entry = zip.entries.firstOrNull { it.key.startsWith(prefix) && it.key.endsWith(".xml") } ?: return ""
    return extractXmlText(entry.value.toString(Charsets.UTF_8))
}

private fun extractXmlText(xml: String): String {
    val p = parser(xml)
    val out = StringBuilder()
    var capture = false
    var e = p.eventType
    while (e != XmlPullParser.END_DOCUMENT) {
        val tag = p.name?.substringAfter(':').orEmpty()
        when (e) {
            XmlPullParser.START_TAG -> if (tag == "t") capture = true
            XmlPullParser.TEXT -> if (capture) out.append(p.text)
            XmlPullParser.END_TAG -> if (tag == "t") {
                capture = false
                out.append(' ')
            }
        }
        e = p.next()
    }
    return out.toString().trim()
}

private fun legacyDocPayload(context: Context, uri: Uri): WordPayload {
    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Arquivo DOC não encontrado.")
    val text = extractLegacyDocText(bytes)
    val body = if (text.isBlank()) {
        "<p>Não foi possível extrair o texto deste DOC legado. Use “Abrir em outro app” para fidelidade total.</p>"
    } else {
        text.split(Regex("\\r?\\n")).joinToString("") { "<p>" + htmlEscape(it) + "</p>" }
    }
    val html = "<!doctype html><html><head><meta charset='utf-8'><style>@page{size:A4;margin:54pt}body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;color:#111}p{margin:0 0 8pt;white-space:pre-wrap}</style></head><body>" + body + "</body></html>"
    return WordPayload(html, text)
}

private fun extractLegacyDocText(bytes: ByteArray): String {
    val utf16 = StringBuilder()
    var i = 0
    while (i + 1 < bytes.size) {
        val code = (bytes[i].toInt() and 0xff) or ((bytes[i + 1].toInt() and 0xff) shl 8)
        if (code == 9 || code == 10 || code == 13 || code in 32..0xD7FF) {
            val c = code.toChar()
            if (c == '\u0000') {
                if (utf16.isNotEmpty() && utf16.last() != '\n') utf16.append('\n')
            } else utf16.append(c)
        } else if (utf16.isNotEmpty() && utf16.last() != '\n') {
            utf16.append('\n')
        }
        i += 2
    }
    val lines = utf16.toString()
        .replace(Regex("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]"), "")
        .lines()
        .map { it.trim() }
        .filter { it.length >= 2 && it.count(Char::isLetterOrDigit) >= 2 }
        .distinct()
    return lines.joinToString("\n").take(2_000_000)
}

private suspend fun htmlToPdf(context: Context, html: String, output: File) {
    withContext(Dispatchers.Main) {
        suspendCancellableCoroutine<Unit> { continuation ->
            val web = WebView(context)
            var finished = false

            fun fail(t: Throwable) {
                if (finished) return
                finished = true
                runCatching { web.stopLoading() }
                runCatching { web.destroy() }
                if (continuation.isActive) continuation.resumeWithException(t)
            }

            fun done() {
                if (finished) return
                finished = true
                runCatching { web.destroy() }
                if (continuation.isActive) continuation.resume(Unit)
            }

            web.settings.javaScriptEnabled = false
            web.settings.loadsImagesAutomatically = true
            web.settings.defaultTextEncodingName = "utf-8"
            web.settings.useWideViewPort = true
            web.settings.loadWithOverviewMode = false

            web.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String?) {
                    view.post {
                        runCatching {
                            val renderWidthPx = 794
                            val pageWidthPt = 595
                            val pageHeightPt = 842
                            val scaleToPdf = pageWidthPt.toFloat() / renderWidthPx.toFloat()
                            val pageHeightPx = (pageHeightPt / scaleToPdf).roundToInt()

                            val widthSpec = android.view.View.MeasureSpec.makeMeasureSpec(
                                renderWidthPx,
                                android.view.View.MeasureSpec.EXACTLY
                            )
                            val heightSpec = android.view.View.MeasureSpec.makeMeasureSpec(
                                0,
                                android.view.View.MeasureSpec.UNSPECIFIED
                            )
                            view.measure(widthSpec, heightSpec)
                            val measured = max(view.measuredHeight, pageHeightPx)
                            view.layout(0, 0, renderWidthPx, measured)

                            val cssHeight = (view.contentHeight * view.scale).roundToInt()
                            val contentHeight = max(max(cssHeight, view.measuredHeight), pageHeightPx)
                            val pageCount = ceil(contentHeight.toDouble() / pageHeightPx.toDouble())
                                .toInt()
                                .coerceIn(1, 500)

                            output.parentFile?.mkdirs()
                            val pdf = PdfDocument()
                            try {
                                for (index in 0 until pageCount) {
                                    val info = PdfDocument.PageInfo.Builder(
                                        pageWidthPt,
                                        pageHeightPt,
                                        index + 1
                                    ).create()
                                    val page = pdf.startPage(info)
                                    val canvas = page.canvas
                                    canvas.save()
                                    canvas.scale(scaleToPdf, scaleToPdf)
                                    canvas.clipRect(
                                        0f,
                                        0f,
                                        renderWidthPx.toFloat(),
                                        pageHeightPx.toFloat()
                                    )
                                    canvas.translate(0f, -(index * pageHeightPx).toFloat())
                                    view.draw(canvas)
                                    canvas.restore()
                                    pdf.finishPage(page)
                                }
                                FileOutputStream(output).use { stream -> pdf.writeTo(stream) }
                            } finally {
                                pdf.close()
                            }
                        }.onSuccess { done() }.onFailure(::fail)
                    }
                }
            }

            continuation.invokeOnCancellation {
                runCatching { web.stopLoading() }
                runCatching { web.destroy() }
            }

            web.loadDataWithBaseURL(
                "file:///android_asset/",
                html,
                "text/html",
                "UTF-8",
                null
            )
        }
    }
}

private class WordPdfDoc(file: File) : Closeable {
    private val fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
        ?: throw FileNotFoundException(file.absolutePath)
    private val renderer = PdfRenderer(fd)
    val pageCount: Int get() = renderer.pageCount

    @Synchronized
    fun render(index: Int, targetWidth: Int): Bitmap {
        val page = renderer.openPage(index)
        return try {
            val width = targetWidth.coerceIn(120, 2800)
            val height = (width * page.height.toFloat() / page.width.toFloat()).roundToInt().coerceAtLeast(1)
            Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also { bmp ->
                bmp.eraseColor(Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            }
        } finally {
            page.close()
        }
    }

    override fun close() {
        runCatching { renderer.close() }
        runCatching { fd.close() }
    }
}

private fun readWordZip(context: Context, uri: Uri): Map<String, ByteArray> {
    val result = linkedMapOf<String, ByteArray>()
    context.contentResolver.openInputStream(uri)?.use { input ->
        ZipInputStream(input.buffered()).use { zip ->
            var entry = zip.nextEntry
            var count = 0
            while (entry != null && count < 3500) {
                if (!entry.isDirectory) {
                    val out = ByteArrayOutputStream()
                    val buffer = ByteArray(8192)
                    var total = 0
                    while (true) {
                        val n = zip.read(buffer)
                        if (n <= 0) break
                        total += n
                        if (total > 24 * 1024 * 1024) break
                        out.write(buffer, 0, n)
                    }
                    result[entry.name] = out.toByteArray()
                }
                zip.closeEntry()
                count++
                entry = zip.nextEntry
            }
        }
    } ?: error("Arquivo não encontrado.")
    return result
}

private fun parser(xml: String): XmlPullParser =
    XmlPullParserFactory.newInstance().newPullParser().apply { setInput(xml.reader()) }

private fun attrLocal(p: XmlPullParser, name: String): String? {
    for (i in 0 until p.attributeCount) {
        if (p.getAttributeName(i).substringAfter(':') == name) return p.getAttributeValue(i)
    }
    return null
}

private fun cssAlign(value: String): String = when (value.lowercase(Locale.ROOT)) {
    "center" -> "center"
    "right", "end" -> "right"
    "both", "justify", "distribute" -> "justify"
    else -> "left"
}

private fun wordImageMime(name: String): String = when (name.substringAfterLast('.').lowercase(Locale.ROOT)) {
    "png" -> "image/png"
    "gif" -> "image/gif"
    "webp" -> "image/webp"
    "svg" -> "image/svg+xml"
    else -> "image/jpeg"
}

private fun htmlEscape(value: String): String = value
    .replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace("\"", "&quot;")

private fun htmlEscapeAttr(value: String): String = htmlEscape(value).replace("'", "&#39;")
