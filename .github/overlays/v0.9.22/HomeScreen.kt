package com.nerdora.player.ui

import android.os.Environment
import android.os.StatFs
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.LibraryMusic
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.PermMedia
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nerdora.player.R
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.math.roundToInt

private val HomeBg = Color(0xFF07050D)
private val HomePanel = Color(0xFF171023)
private val HomePurple = Color(0xFF9D4DFF)
private val HomeMagenta = Color(0xFFFF43D0)
private val HomeCyan = Color(0xFF13B8FF)
private val HomeMuted = Color(0xFFB8AEC8)

private data class HomeStorage(
    val usedText: String,
    val totalText: String,
    val progress: Float,
    val percent: Int
)

@Composable
private fun Modifier.homePress(onClick: () -> Unit): Modifier {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) .965f else 1f,
        animationSpec = tween(120)
    )
    return graphicsLayer(scaleX = scale, scaleY = scale)
        .clickable(interactionSource = interaction, indication = null, onClick = onClick)
}

@Composable
fun HomeScreen(
    items: List<NerdoraMedia>,
    hasMediaAccess: Boolean,
    recentIds: List<String>,
    hiddenCount: Int,
    positionFor: (NerdoraMedia) -> Long,
    onRequestPermissions: () -> Unit,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit,
    onOpenSearch: () -> Unit,
    onOpenLibraryMode: (String) -> Unit,
    onOpenFileFolder: (String) -> Unit,
    onOpenPrivate: () -> Unit,
    onRefreshLibrary: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val byId = remember(items) { items.associateBy { it.id } }
    val recent = remember(recentIds, items) { recentIds.mapNotNull(byId::get).take(12) }
    val continueVideo = remember(items) {
        items.filter {
            val p = positionFor(it)
            it.kind == MediaKind.VIDEO && it.durationMs > 0L && p > 5_000L && p < it.durationMs - 5_000L
        }.take(10)
    }
    val continueAudio = remember(items) {
        items.filter {
            val p = positionFor(it)
            it.kind == MediaKind.AUDIO && it.durationMs > 0L && p > 5_000L && p < it.durationMs - 5_000L
        }.take(10)
    }
    var storage by remember { mutableStateOf(HomeStorage("0 GB", "0 GB", 0f, 0)) }

    LaunchedEffect(Unit) {
        storage = withContext(Dispatchers.IO) { homeStorage() }
    }

    Surface(Modifier.fillMaxSize(), color = HomeBg) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 22.dp)
        ) {
            item {
                HomeHero(
                    hiddenCount = hiddenCount,
                    onSearch = onOpenSearch,
                    onOpenPrivate = onOpenPrivate,
                    onRefresh = onRefreshLibrary,
                    onOpenSettings = onOpenSettings
                )
            }
            item { HomeStorageCard(storage) }

            if (!hasMediaAccess) {
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        color = Color(0xFF211437),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.PermMedia, null, tint = HomePurple)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text("Permita acesso à mídia", color = Color.White, fontWeight = FontWeight.Bold)
                                Text("Para montar sua Biblioteca e retomar reproduções.", color = HomeMuted, fontSize = 11.sp)
                            }
                            Button(onClick = onRequestPermissions) { Text("Permitir") }
                        }
                    }
                }
            }

            if (continueVideo.isNotEmpty()) {
                item {
                    HomeSectionTitle("Continuar assistindo", "Vídeos em andamento")
                    HomeMediaRow(continueVideo, positionFor, onOpenItems)
                }
            }

            if (continueAudio.isNotEmpty()) {
                item {
                    HomeSectionTitle("Continuar ouvindo", "Músicas e áudios em andamento")
                    HomeMediaRow(continueAudio, positionFor, onOpenItems)
                }
            }

            item {
                HomeSectionTitle("Acesso rápido", "Pastas e privacidade")
                HomeQuickAccess(
                    onDownloads = { onOpenFileFolder("DOWNLOAD") },
                    onCamera = { onOpenFileFolder("DCIM") },
                    onWhatsApp = { onOpenFileFolder("WHATSAPP") },
                    onVault = onOpenPrivate
                )
            }

            item {
                HomeSectionTitle("Recentes", if (recent.isEmpty()) "Você ainda não reproduziu nada" else "Últimas reproduções")
                if (recent.isEmpty()) {
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        color = HomePanel,
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(Modifier.padding(18.dp)) {
                            Text("Nenhum histórico ainda", color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text(
                                "Quando você abrir uma música, vídeo ou imagem, ela aparecerá aqui.",
                                color = HomeMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                } else {
                    HomeMediaRow(recent, positionFor, onOpenItems)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        androidx.compose.material3.TextButton(onClick = { onOpenLibraryMode("RECENT") }) {
                            Text("Ver todos")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeHero(
    hiddenCount: Int,
    onSearch: () -> Unit,
    onOpenPrivate: () -> Unit,
    onRefresh: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var menu by remember { mutableStateOf(false) }
    Box(
        Modifier.fillMaxWidth().height(218.dp)
            .background(Brush.verticalGradient(listOf(Color(0xFF21093E), Color(0xFF130821), HomeBg)))
    ) {
        Text(
            "N",
            color = HomePurple.copy(alpha = .12f),
            fontSize = 170.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.align(Alignment.CenterEnd).padding(end = 8.dp)
        )
        Row(
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 22.dp, end = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            HomeCircleButton(Icons.Rounded.Search, "Busca global", onSearch)
            Box {
                HomeCircleButton(Icons.Rounded.MoreVert, "Mais opções") { menu = true }
                DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                    DropdownMenuItem(
                        text = { Text(if (hiddenCount > 0) "Cofre privado ($hiddenCount)" else "Cofre privado") },
                        onClick = { menu = false; onOpenPrivate() }
                    )
                    DropdownMenuItem(text = { Text("Atualizar biblioteca") }, onClick = { menu = false; onRefresh() })
                    DropdownMenuItem(text = { Text("Ajustes") }, onClick = { menu = false; onOpenSettings() })
                }
            }
        }

        Column(Modifier.align(Alignment.BottomStart).padding(start = 18.dp, bottom = 22.dp)) {
            Image(
                painter = painterResource(R.drawable.nerdora_player_mark),
                contentDescription = "Nerdora Player",
                modifier = Modifier.size(62.dp).clip(RoundedCornerShape(17.dp)),
                contentScale = ContentScale.Fit
            )
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text("Nerdora ", color = Color.White, fontSize = 29.sp, fontWeight = FontWeight.ExtraBold)
                Text("Player", color = HomeMagenta, fontSize = 29.sp, fontWeight = FontWeight.ExtraBold)
            }
            Text("Retome sua mídia e acesse o que importa", color = Color(0xFFD4C9E2), fontSize = 13.sp)
        }
    }
}

@Composable
private fun HomeCircleButton(icon: ImageVector, description: String, onClick: () -> Unit) {
    Box(
        Modifier.size(48.dp).clip(CircleShape).background(Color(0xCC1B1228))
            .border(1.dp, Color(0x553F2B59), CircleShape).shadow(6.dp, CircleShape, clip = false)
            .homePress(onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, description, tint = Color.White, modifier = Modifier.size(25.dp))
    }
}

@Composable
private fun HomeStorageCard(storage: HomeStorage) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        color = Color(0xEE171022),
        shape = RoundedCornerShape(18.dp),
        shadowElevation = 6.dp
    ) {
        Row(
            Modifier.border(1.dp, Color(0xFF482176), RoundedCornerShape(18.dp)).padding(15.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(55.dp).clip(RoundedCornerShape(15.dp))
                    .background(Brush.verticalGradient(listOf(Color(0xFF7B2FEA), Color(0xFF38105F)))),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.Folder, null, tint = Color.White, modifier = Modifier.size(31.dp))
            }
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f)) {
                Text("Armazenamento interno", color = Color.White, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(7.dp))
                LinearProgressIndicator(
                    progress = storage.progress.coerceIn(0f, 1f),
                    modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(8.dp))
                )
                Spacer(Modifier.height(6.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("${storage.usedText} de ${storage.totalText}", color = HomeMuted, fontSize = 10.sp)
                    Text("${storage.percent}% usado", color = Color.White, fontSize = 10.sp)
                }
            }
        }
    }
}

@Composable
private fun HomeSectionTitle(title: String, subtitle: String) {
    Column(Modifier.padding(start = 16.dp, end = 16.dp, top = 18.dp, bottom = 8.dp)) {
        Text(title, color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = HomeMuted, fontSize = 10.sp)
    }
}

@Composable
private fun HomeQuickAccess(
    onDownloads: () -> Unit,
    onCamera: () -> Unit,
    onWhatsApp: () -> Unit,
    onVault: () -> Unit
) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        HomeQuickTile("Downloads", "↓", HomePurple, Modifier.weight(1f), onDownloads)
        HomeQuickTile("Câmera", "●", HomeMagenta, Modifier.weight(1f), onCamera)
        HomeQuickTile("WhatsApp", "W", Color(0xFF1DD46D), Modifier.weight(1f), onWhatsApp)
        HomeQuickTile("Cofre", "◆", HomeCyan, Modifier.weight(1f), onVault)
    }
}

@Composable
private fun HomeQuickTile(
    title: String,
    glyph: String,
    tint: Color,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.height(88.dp).homePress(onClick),
        color = HomePanel,
        shape = RoundedCornerShape(16.dp),
        shadowElevation = 4.dp
    ) {
        Column(
            Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(glyph, color = tint, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(5.dp))
            Text(title, color = Color.White, fontSize = 9.5.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
        }
    }
}

@Composable
private fun HomeMediaRow(
    media: List<NerdoraMedia>,
    positionFor: (NerdoraMedia) -> Long,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(media, key = { it.id }) { item ->
            val index = media.indexOfFirst { it.id == item.id }.coerceAtLeast(0)
            Column(
                Modifier.size(width = 166.dp, height = 150.dp).homePress { onOpenItems(media, index) }
            ) {
                Box(
                    Modifier.fillMaxWidth().height(98.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF21172D))
                ) {
                    if (item.kind == MediaKind.AUDIO && item.thumbnailUrl == null) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Icon(Icons.Rounded.LibraryMusic, null, tint = Color.White, modifier = Modifier.size(38.dp))
                        }
                    } else {
                        AsyncImage(
                            model = item.thumbnailUrl ?: item.url,
                            contentDescription = item.title,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    }
                    val p = positionFor(item)
                    if (p > 0L && item.durationMs > 0L) {
                        LinearProgressIndicator(
                            progress = (p.toFloat() / item.durationMs.toFloat()).coerceIn(0f, 1f),
                            modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().height(3.dp)
                        )
                    }
                    if (item.kind == MediaKind.VIDEO) {
                        Icon(
                            Icons.Rounded.PlayArrow,
                            null,
                            tint = Color.White,
                            modifier = Modifier.align(Alignment.Center).size(35.dp)
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(item.title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    item.artist.ifBlank { item.folder.ifBlank { "Nerdora Player" } },
                    color = HomeMuted,
                    fontSize = 9.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

private fun homeStorage(): HomeStorage {
    val stat = StatFs(Environment.getExternalStorageDirectory().absolutePath)
    val total = stat.totalBytes.coerceAtLeast(1L)
    val free = stat.availableBytes.coerceAtLeast(0L)
    val used = (total - free).coerceAtLeast(0L)
    val progress = (used.toDouble() / total.toDouble()).toFloat()
    return HomeStorage(
        usedText = formatHomeBytes(used),
        totalText = formatHomeBytes(total),
        progress = progress,
        percent = (progress * 100f).roundToInt().coerceIn(0, 100)
    )
}

private fun formatHomeBytes(bytes: Long): String {
    val gb = bytes / (1024.0 * 1024.0 * 1024.0)
    return if (gb >= 1.0) String.format(Locale.getDefault(), "%.1f GB", gb)
    else String.format(Locale.getDefault(), "%.0f MB", bytes / (1024.0 * 1024.0))
}
