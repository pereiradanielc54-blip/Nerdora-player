package com.nerdora.player.ui

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import android.view.ViewGroup
import androidx.compose.ui.viewinterop.AndroidView
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun YouTubeScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    var input by remember { mutableStateOf("") }
    var pageUrl by remember { mutableStateOf("https://m.youtube.com/") }
    var webView by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }

    fun navigateToInput() {
        val value = input.trim()
        if (value.isEmpty()) {
            pageUrl = "https://m.youtube.com/"
        } else if (value.contains("youtube.com") || value.contains("youtu.be")) {
            pageUrl = if (value.startsWith("https://") || value.startsWith("http://")) value else "https://$value"
        } else {
            val encoded = URLEncoder.encode(value, StandardCharsets.UTF_8.name())
            pageUrl = "https://m.youtube.com/results?search_query=$encoded"
        }
        webView?.loadUrl(pageUrl)
    }

    BackHandler(enabled = canGoBack) {
        webView?.goBack()
        canGoBack = webView?.canGoBack() == true
    }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TextButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, contentDescription = "Voltar"); Text("Voltar") }
                Text("YouTube", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                TextButton(onClick = {
                    val uri = Uri.parse(pageUrl)
                    val intent = Intent(Intent.ACTION_VIEW, uri).apply { setPackage("com.google.android.youtube") }
                    try { context.startActivity(intent) } catch (_: ActivityNotFoundException) {
                        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                    }
                }) { Icon(Icons.Rounded.OpenInNew, contentDescription = "Abrir app"); Text("App") }
            }
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    label = { Text("Pesquisar ou colar link do YouTube") }
                )
                Button(onClick = ::navigateToInput) { Icon(Icons.Rounded.Search, contentDescription = "Pesquisar") }
            }
            Text(
                "Para continuar ouvindo com a tela apagada, use o app oficial do YouTube e os recursos disponíveis na sua conta (a reprodução em segundo plano geralmente exige Premium).",
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 6.dp),
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall
            )
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.mediaPlaybackRequiresUserGesture = true
                        settings.useWideViewPort = true
                        settings.loadWithOverviewMode = true
                        webChromeClient = WebChromeClient()
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                                val url = request.url.toString()
                                if (url.startsWith("intent://")) return true
                                return false
                            }
                            override fun onPageFinished(view: WebView, url: String) {
                                canGoBack = view.canGoBack()
                            }
                        }
                        webView = this
                        loadUrl(pageUrl)
                    }
                },
                update = { view ->
                    if (view.url != pageUrl) view.loadUrl(pageUrl)
                    webView = view
                }
            )
        }
    }
    DisposableEffect(Unit) {
        onDispose {
            webView?.let { view ->
                view.stopLoading()
                view.destroy()
            }
            webView = null
        }
    }
}
