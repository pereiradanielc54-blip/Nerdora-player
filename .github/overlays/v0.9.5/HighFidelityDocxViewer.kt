package com.nerdora.player.ui

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.nerdora.player.model.DocumentRef
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

private const val DOCX_MAX_BYTES = 50 * 1024 * 1024
private const val BRIDGE_CHUNK_SIZE = 256 * 1024

private class NerdoraDocxBridge(
    private val base64: String,
    private val onRenderedCallback: (Int) -> Unit,
    private val onPageCallback: (Int, Int) -> Unit,
    private val onErrorCallback: (String) -> Unit,
) {
    private val main = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun getChunkCount(): Int = (base64.length + BRIDGE_CHUNK_SIZE - 1) / BRIDGE_CHUNK_SIZE

    @JavascriptInterface
    fun getChunk(index: Int): String {
        if (index < 0) return ""
        val start = index * BRIDGE_CHUNK_SIZE
        if (start >= base64.length) return ""
        return base64.substring(start, minOf(start + BRIDGE_CHUNK_SIZE, base64.length))
    }

    @JavascriptInterface
    fun onRendered(pageCount: Int) {
        main.post { onRenderedCallback(pageCount.coerceAtLeast(1)) }
    }

    @JavascriptInterface
    fun onPageChanged(page: Int, total: Int) {
        main.post { onPageCallback(page.coerceAtLeast(1), total.coerceAtLeast(1)) }
    }

    @JavascriptInterface
    fun onError(message: String?) {
        main.post { onErrorCallback(message?.takeIf { it.isNotBlank() } ?: "Falha ao renderizar o DOCX.") }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HighFidelityDocxViewer(context: Context, document: DocumentRef) {
    var encoded by remember(document.uri, document.sizeBytes) { mutableStateOf<String?>(null) }
    var readError by remember(document.uri) { mutableStateOf<String?>(null) }
    var renderError by remember(document.uri) { mutableStateOf<String?>(null) }
    var rendered by remember(document.uri) { mutableStateOf(false) }
    var page by remember(document.uri) { mutableIntStateOf(1) }
    var pages by remember(document.uri) { mutableIntStateOf(0) }
    var webView by remember(document.uri) { mutableStateOf<WebView?>(null) }

    LaunchedEffect(document.uri, document.sizeBytes) {
        encoded = null
        readError = null
        renderError = null
        rendered = false
        page = 1
        pages = 0

        val result = withContext(Dispatchers.IO) {
            runCatching {
                context.contentResolver.openInputStream(document.uri)?.use { input ->
                    val bytes = input.readBytes()
                    if (bytes.isEmpty()) throw IOException("O arquivo DOCX está vazio.")
                    if (bytes.size > DOCX_MAX_BYTES) {
                        throw IOException("DOCX acima de 50 MB. Use 'Abrir em outro app' para este arquivo.")
                    }
                    Base64.encodeToString(bytes, Base64.NO_WRAP)
                } ?: throw IOException("Não foi possível ler o arquivo DOCX.")
            }
        }

        result.onSuccess { encoded = it }
            .onFailure { readError = it.message ?: "Não foi possível preparar o DOCX." }
    }

    DisposableEffect(document.uri) {
        onDispose {
            runCatching { webView?.removeJavascriptInterface("NerdoraDocx") }
            runCatching { webView?.stopLoading() }
            runCatching { webView?.destroy() }
            webView = null
        }
    }

    val failure = readError ?: renderError
    if (failure != null) {
        Column(
            Modifier.fillMaxSize().padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(48.dp))
            Text("Não foi possível renderizar este DOCX", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(10.dp))
            Text(failure, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            Spacer(Modifier.height(10.dp))
            Text(
                "Você ainda pode usar “Abrir em outro app” no topo. O Nerdora não envia o documento para a internet.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        }
        return
    }

    val payload = encoded
    if (payload == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator()
                Spacer(Modifier.height(12.dp))
                Text("Preparando DOCX…")
                Text("Leitura local • nenhuma informação é enviada", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        return
    }

    Box(Modifier.fillMaxSize()) {
        key(document.uri) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        webView = this
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.allowFileAccess = true
                        settings.allowContentAccess = false
                        settings.blockNetworkLoads = true
                        settings.useWideViewPort = true
                        settings.loadWithOverviewMode = true
                        settings.builtInZoomControls = true
                        settings.displayZoomControls = false
                        settings.setSupportZoom(true)
                        settings.defaultTextEncodingName = "utf-8"

                        addJavascriptInterface(
                            NerdoraDocxBridge(
                                base64 = payload,
                                onRenderedCallback = { count ->
                                    pages = count
                                    page = page.coerceIn(1, count)
                                    rendered = true
                                },
                                onPageCallback = { current, total ->
                                    pages = total
                                    page = current.coerceIn(1, total)
                                },
                                onErrorCallback = { renderError = it },
                            ),
                            "NerdoraDocx"
                        )
                        webChromeClient = WebChromeClient()
                        webViewClient = WebViewClient()
                        loadUrl("file:///android_asset/docx_renderer/viewer.html")
                    }
                }
            )
        }

        if (!rendered) {
            Surface(
                modifier = Modifier.align(Alignment.Center),
                shape = MaterialTheme.shapes.large,
                tonalElevation = 6.dp
            ) {
                Column(
                    Modifier.padding(horizontal = 24.dp, vertical = 18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator()
                    Spacer(Modifier.height(10.dp))
                    Text("Reconstruindo layout do Word…", fontSize = 12.sp)
                }
            }
        }

        if (rendered && pages > 0) {
            Surface(
                modifier = Modifier.align(Alignment.TopEnd).padding(10.dp),
                shape = MaterialTheme.shapes.large,
                tonalElevation = 5.dp
            ) {
                Text(
                    "$page / $pages",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    fontSize = 11.sp
                )
            }
        }
    }
}
