package com.nerdora.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.LibraryMusic
import androidx.compose.material.icons.rounded.Link
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia

@Composable
fun NerdoraCentralScreen(
    items: List<NerdoraMedia>,
    favoriteIds: Set<String>,
    recentIds: List<String>,
    playlistCount: Int,
    positionFor: (NerdoraMedia) -> Long,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit,
    onOpenLibraryMode: (String) -> Unit,
    onOpenDownloads: () -> Unit,
    onOpenVault: () -> Unit,
    onOpenLargeFiles: () -> Unit,
    onOpenLink: () -> Unit,
    onOpenPlaylists: () -> Unit
) {
    val byId = remember(items) { items.associateBy { it.id } }
    val recent = remember(recentIds, items) { recentIds.mapNotNull(byId::get).take(12) }
    val favorites = remember(favoriteIds, items) { items.filter { favoriteIds.contains(it.id) }.take(12) }
    val continueItems = remember(items) {
        items.filter { media ->
            val position = positionFor(media)
            media.durationMs > 0L && position > 5_000L && position < media.durationMs - 5_000L
        }.take(10)
    }

    Surface(Modifier.fillMaxSize(), color = Color(0xFF08060E)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            item {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF25103E), Color(0xFF0D0714))
                            )
                        )
                        .padding(horizontal = 18.dp, vertical = 24.dp)
                ) {
                    Text("Central Nerdora", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                    Text(
                        "Retome sua mídia e veja atalhos inteligentes do aparelho.",
                        color = Color(0xFFC5B9D2),
                        fontSize = 12.sp
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CentralAction("Downloads", "↓", Modifier.weight(1f), onOpenDownloads)
                    CentralAction("Cofre", "◆", Modifier.weight(1f), onOpenVault)
                    CentralAction("Grandes", "GB", Modifier.weight(1f), onOpenLargeFiles)
                    CentralAction("Abrir link", "↗", Modifier.weight(1f), onOpenLink)
                }
            }

            if (continueItems.isNotEmpty()) {
                item {
                    CentralHeader("Continuar", "Retome exatamente de onde parou")
                    CentralMediaRow(continueItems, positionFor, onOpenItems)
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CentralStat(
                        title = "Favoritos",
                        value = favoriteIds.count { !it.startsWith("file:") }.toString(),
                        icon = Icons.Rounded.Favorite,
                        modifier = Modifier.weight(1f)
                    ) { onOpenLibraryMode("FAVORITES") }
                    CentralStat(
                        title = "Recentes",
                        value = recent.size.toString(),
                        icon = Icons.Rounded.History,
                        modifier = Modifier.weight(1f)
                    ) { onOpenLibraryMode("RECENT") }
                    CentralStat(
                        title = "Playlists",
                        value = playlistCount.toString(),
                        icon = Icons.Rounded.LibraryMusic,
                        modifier = Modifier.weight(1f),
                        onClick = onOpenPlaylists
                    )
                }
            }

            if (favorites.isNotEmpty()) {
                item {
                    CentralHeader("Favoritos", "Sua mídia marcada")
                    CentralMediaRow(favorites, positionFor, onOpenItems)
                }
            }

            if (recent.isNotEmpty()) {
                item {
                    CentralHeader("Reproduzidos recentemente", "Seu histórico de mídia")
                    CentralMediaRow(recent, positionFor, onOpenItems)
                }
            }
        }
    }
}

@Composable
private fun CentralAction(
    title: String,
    glyph: String,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.height(92.dp).clickable(onClick = onClick),
        color = Color(0xFF191023),
        shape = RoundedCornerShape(16.dp),
        shadowElevation = 4.dp
    ) {
        Column(
            Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(glyph, color = Color(0xFFB85DFF), fontSize = 26.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(5.dp))
            Text(title, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
        }
    }
}

@Composable
private fun CentralStat(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.height(92.dp).clickable(onClick = onClick),
        color = Color(0xFF171020),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            Modifier.padding(12.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, null, tint = Color(0xFFB85DFF), modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(6.dp))
            Text(value, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(title, color = Color(0xFFBBAEC8), fontSize = 10.sp)
        }
    }
}

@Composable
private fun CentralHeader(title: String, subtitle: String) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(title, color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = Color(0xFFAA9DB8), fontSize = 10.sp)
    }
}

@Composable
private fun CentralMediaRow(
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
                Modifier
                    .size(width = 172.dp, height = 152.dp)
                    .clickable { onOpenItems(media, index) }
            ) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(98.dp)
                        .background(Color(0xFF21172D), RoundedCornerShape(14.dp))
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
                    val position = positionFor(item)
                    if (position > 0L && item.durationMs > 0L) {
                        LinearProgressIndicator(
                            progress = (position.toFloat() / item.durationMs.toFloat()).coerceIn(0f, 1f),
                            modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().height(3.dp)
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(item.title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    item.artist.ifBlank { item.folder.ifBlank { "Nerdora Player" } },
                    color = Color(0xFFAA9DB8),
                    fontSize = 9.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
