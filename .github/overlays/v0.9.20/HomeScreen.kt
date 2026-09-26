package com.nerdora.player.ui

import android.os.Environment
import android.os.StatFs
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.History
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nerdora.player.R
import com.nerdora.player.UniversalFileIndexCache
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.math.roundToInt

private val OfficialBackground = Color(0xFF07050D)
private val OfficialPanel = Color(0xFF171023)
private val OfficialPanel2 = Color(0xFF211437)
private val OfficialBorder = Color(0xFF482176)
private val OfficialPurple = Color(0xFF9D4DFF)
private val OfficialMagenta = Color(0xFFFF43D0)
private val OfficialCyan = Color(0xFF13B8FF)
private val OfficialBlue = Color(0xFF277CFF)
private val OfficialGreen = Color(0xFF1DD46D)
private val OfficialOrange = Color(0xFFFF9A3D)
private val OfficialYellow = Color(0xFFFFCF3D)
private val OfficialTextMuted = Color(0xFFB8AEC8)

@Composable
private fun Modifier.nerdoraPress(onClick: () -> Unit): Modifier {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.965f else 1f,
        animationSpec = tween(durationMillis = 120)
    )
    return this
        .graphicsLayer(scaleX = scale, scaleY = scale)
        .clickable(interactionSource = interaction, indication = null, onClick = onClick)
}

private data class StorageSnapshot(
    val usedText: String,
    val totalText: String,
    val progress: Float,
    val percent: Int
)

private data class HomeFileStats(
    val videos: Int = 0,
    val music: Int = 0,
    val images: Int = 0,
    val documents: Int = 0,
    val archives: Int = 0,
    val apps: Int = 0,
    val whatsapp: Int = 0,
    val downloads: Int = 0,
    val others: Int = 0
)

private data class HomeCategoryUi(
    val title: String,
    val count: Int,
    val icon: ImageVector? = null,
    val glyph: String? = null,
    val tint: Color,
    val onClick: () -> Unit
)

@Composable
fun HomeScreen(
    items: List<NerdoraMedia>,
    demoItems: List<NerdoraMedia>,
    hasMediaAccess: Boolean,
    favoriteIds: Set<String>,
    recentIds: List<String>,
    hiddenCount: Int,
    positionFor: (NerdoraMedia) -> Long,
    onRequestPermissions: () -> Unit,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit,
    onOpenSearch: () -> Unit,
    onOpenLibraryMode: (String) -> Unit,
    onOpenFileCategory: (String) -> Unit,
    onOpenFileFolder: (String) -> Unit,
    onOpenPrivate: () -> Unit,
    onOpenRemoved: () -> Unit,
    onRefreshLibrary: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLink: () -> Unit
) {
    val context = LocalContext.current
    val visible = items
    val byId = remember(visible) { visible.associateBy { it.id } }
    val recent = remember(recentIds, visible) { recentIds.mapNotNull(byId::get).take(12) }
    val recentDisplay = remember(recent, visible, demoItems) {
        recent.ifEmpty { visible.take(12) }.ifEmpty { demoItems.take(8) }
    }

    var indexedPaths by remember { mutableStateOf<List<String>>(emptyList()) }
    var storage by remember { mutableStateOf(StorageSnapshot("0 GB", "0 GB", 0f, 0)) }

    LaunchedEffect(Unit) {
        storage = withContext(Dispatchers.IO) { readStorageSnapshot() }
    }
    LaunchedEffect(hasMediaAccess) {
        indexedPaths = withContext(Dispatchers.IO) {
            runCatching { UniversalFileIndexCache.readPaths(context) }.getOrDefault(emptyList())
        }
    }

    val stats = remember(indexedPaths, visible) { buildHomeFileStats(indexedPaths, visible) }

    Surface(modifier = Modifier.fillMaxSize(), color = OfficialBackground) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 18.dp)
        ) {
            item {
                OfficialHero(
                    hiddenCount = hiddenCount,
                    onSearch = onOpenSearch,
                    onOpenPrivate = onOpenPrivate,
                    onOpenRemoved = onOpenRemoved,
                    onRefresh = onRefreshLibrary,
                    onOpenSettings = onOpenSettings
                )
            }

            item { StorageCard(storage) }

            item {
                QuickActions(
                    onPlayRecent = {
                        if (recentDisplay.isNotEmpty()) onOpenItems(recentDisplay, 0)
                    },
                    onOpenLink = onOpenLink,
                    onTransfer = { onOpenFileCategory("ALL") },
                    onFavorites = { onOpenLibraryMode("FAVORITES") }
                )
            }

            if (!hasMediaAccess) {
                item { PermissionCard(onRequestPermissions) }
            }

            item {
                SectionHeader("Categorias de arquivos", "Ver tudo") { onOpenFileCategory("ALL") }
                CategoriesGrid(
                    stats = stats,
                    onOpenLibraryMode = onOpenLibraryMode,
                    onOpenFileCategory = onOpenFileCategory,
                    onOpenFileFolder = onOpenFileFolder
                )
            }

            item {
                SectionHeader("Acesso rápido", "Ver pastas") { onOpenFileCategory("ALL") }
                QuickAccessRow(onOpenFileFolder = onOpenFileFolder)
            }

            item {
                SectionHeader("Reproduzidos recentemente", "Ver todos") { onOpenLibraryMode("RECENT") }
                RecentRow(
                    items = recentDisplay,
                    positionFor = positionFor,
                    onOpenItems = onOpenItems
                )
            }

            item { Spacer(Modifier.height(12.dp)) }
        }
    }

    @Suppress("UNUSED_VARIABLE")
    val preservedFavoriteCount = favoriteIds.size
}

@Composable
private fun OfficialHero(
    hiddenCount: Int,
    onSearch: () -> Unit,
    onOpenPrivate: () -> Unit,
    onOpenRemoved: () -> Unit,
    onRefresh: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(230.dp)
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF21093E), Color(0xFF130821), OfficialBackground)
                )
            )
    ) {
        Text(
            text = "N",
            color = OfficialPurple.copy(alpha = 0.12f),
            fontSize = 176.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.align(Alignment.CenterEnd).padding(end = 8.dp)
        )

        Row(
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 22.dp, end = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            HeaderCircleButton(Icons.Rounded.Search, "Busca global", onSearch)
            Box {
                HeaderCircleButton(Icons.Rounded.MoreVert, "Mais opções") { menuExpanded = true }
                DropdownMenu(
                    expanded = menuExpanded,
                    onDismissRequest = { menuExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(if (hiddenCount > 0) "Cofre privado ($hiddenCount)" else "Cofre privado") },
                        onClick = { menuExpanded = false; onOpenPrivate() }
                    )
                    DropdownMenuItem(
                        text = { Text("Itens removidos da Biblioteca") },
                        onClick = { menuExpanded = false; onOpenRemoved() }
                    )
                    DropdownMenuItem(
                        text = { Text("Atualizar biblioteca") },
                        onClick = { menuExpanded = false; onRefresh() }
                    )
                    DropdownMenuItem(
                        text = { Text("Ajustes") },
                        onClick = { menuExpanded = false; onOpenSettings() }
                    )
                }
            }
        }

        Column(
            modifier = Modifier.align(Alignment.BottomStart).padding(start = 18.dp, end = 18.dp, bottom = 24.dp)
        ) {
            Image(
                painter = painterResource(R.drawable.nerdora_player_mark),
                contentDescription = "Nerdora Player",
                modifier = Modifier.size(66.dp).clip(RoundedCornerShape(18.dp)),
                contentScale = ContentScale.Fit
            )
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text("Nerdora ", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
                Text("Player", color = OfficialMagenta, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
            }
            Text("Sua central de mídia e arquivos", color = Color(0xFFD4C9E2), fontSize = 14.sp)
        }
    }
}

@Composable
private fun HeaderCircleButton(
    icon: ImageVector,
    description: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape)
            .background(Color(0xCC1B1228))
            .border(1.dp, Color(0x553F2B59), CircleShape)
            .shadow(6.dp, CircleShape, clip = false)
            .nerdoraPress(onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, description, tint = Color.White, modifier = Modifier.size(25.dp))
    }
}

@Composable
private fun StorageCard(storage: StorageSnapshot) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        color = Color(0xEE171022),
        shape = RoundedCornerShape(18.dp),
        shadowElevation = 7.dp
    ) {
        Row(
            modifier = Modifier
                .border(1.dp, OfficialBorder.copy(alpha = .75f), RoundedCornerShape(18.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF7B2FEA), Color(0xFF38105F))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.Folder, null, tint = Color.White, modifier = Modifier.size(34.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "Armazenamento interno",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                Spacer(Modifier.height(9.dp))
                LinearProgressIndicator(
                    progress = storage.progress.coerceIn(0f, 1f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(7.dp)
                        .clip(RoundedCornerShape(8.dp))
                )
                Spacer(Modifier.height(8.dp))
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        storage.usedText + " de " + storage.totalText,
                        color = OfficialTextMuted,
                        fontSize = 11.sp
                    )
                    Text(
                        storage.percent.toString() + "% usado",
                        color = Color.White,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun QuickActions(
    onPlayRecent: () -> Unit,
    onOpenLink: () -> Unit,
    onTransfer: () -> Unit,
    onFavorites: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        OfficialActionTile(
            title = "Reproduzir\núltimos",
            icon = Icons.Rounded.PlayArrow,
            tint = OfficialPurple,
            modifier = Modifier.weight(1f),
            onClick = onPlayRecent
        )
        OfficialActionTile(
            title = "Abrir link",
            glyph = "↗",
            tint = Color(0xFFA85BFF),
            modifier = Modifier.weight(1f),
            onClick = onOpenLink
        )
        OfficialActionTile(
            title = "Arquivos",
            glyph = "↔",
            tint = OfficialCyan,
            modifier = Modifier.weight(1f),
            onClick = onTransfer
        )
        OfficialActionTile(
            title = "Favoritos",
            icon = Icons.Rounded.Favorite,
            tint = OfficialMagenta,
            modifier = Modifier.weight(1f),
            onClick = onFavorites
        )
    }
}

@Composable
private fun OfficialActionTile(
    title: String,
    icon: ImageVector? = null,
    glyph: String? = null,
    tint: Color,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .height(106.dp)
            .nerdoraPress(onClick),
        color = OfficialPanel,
        shape = RoundedCornerShape(17.dp),
        shadowElevation = 5.dp
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF211430),
                            Color(0xFF15101F)
                        )
                    )
                )
                .border(1.dp, tint.copy(alpha = .22f), RoundedCornerShape(17.dp))
                .padding(horizontal = 6.dp, vertical = 13.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(13.dp))
                    .background(tint.copy(alpha = .13f)),
                contentAlignment = Alignment.Center
            ) {
                when {
                    glyph != null -> Text(
                        glyph,
                        color = tint,
                        fontSize = 25.sp,
                        fontWeight = FontWeight.Bold
                    )
                    icon != null -> Icon(icon, null, tint = tint, modifier = Modifier.size(29.dp))
                }
            }
            Spacer(Modifier.height(7.dp))
            Text(
                title,
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2
            )
        }
    }
}

@Composable
private fun PermissionCard(onRequestPermissions: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 2.dp),
        color = OfficialPanel2,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Rounded.PermMedia,
                null,
                tint = OfficialPurple,
                modifier = Modifier.size(34.dp)
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "Permita o acesso às suas mídias",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                Text(
                    "O Nerdora lê fotos, vídeos e músicas armazenados no aparelho.",
                    color = OfficialTextMuted,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
            Spacer(Modifier.width(8.dp))
            Button(onClick = onRequestPermissions) {
                Text("Permitir", fontSize = 10.sp)
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    action: String,
    onAction: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 16.dp, top = 18.dp, bottom = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            title,
            color = Color.White,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            action + " ›",
            color = OfficialPurple,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.clickable(onClick = onAction)
        )
    }
}

@Composable
private fun CategoriesGrid(
    stats: HomeFileStats,
    onOpenLibraryMode: (String) -> Unit,
    onOpenFileCategory: (String) -> Unit,
    onOpenFileFolder: (String) -> Unit
) {
    val rows = listOf(
        listOf(
            HomeCategoryUi("Vídeos", stats.videos, icon = Icons.Rounded.PlayArrow, tint = OfficialMagenta) { onOpenLibraryMode("VIDEO") },
            HomeCategoryUi("Músicas", stats.music, icon = Icons.Rounded.LibraryMusic, tint = OfficialMagenta) { onOpenLibraryMode("AUDIO") },
            HomeCategoryUi("Imagens", stats.images, icon = Icons.Rounded.PermMedia, tint = OfficialCyan) { onOpenLibraryMode("IMAGE") }
        ),
        listOf(
            HomeCategoryUi("Documentos", stats.documents, icon = Icons.Rounded.Description, tint = OfficialOrange) { onOpenFileCategory("DOCUMENTS") },
            HomeCategoryUi("Arquivos\nCompactados", stats.archives, glyph = "ZIP", tint = OfficialYellow) { onOpenFileCategory("ZIP") },
            HomeCategoryUi("Aplicativos", stats.apps, glyph = "APK", tint = OfficialGreen) { onOpenFileCategory("APK") }
        ),
        listOf(
            HomeCategoryUi("WhatsApp", stats.whatsapp, glyph = "W", tint = OfficialGreen) { onOpenFileFolder("WHATSAPP") },
            HomeCategoryUi("Downloads", stats.downloads, glyph = "↓", tint = OfficialBlue) { onOpenFileFolder("DOWNLOAD") },
            HomeCategoryUi("Outros", stats.others, icon = Icons.Rounded.Folder, tint = Color(0xFFA59AB8)) { onOpenFileCategory("OTHER") }
        )
    )

    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        rows.forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { category ->
                    HomeCategoryCard(category, Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun HomeCategoryCard(category: HomeCategoryUi, modifier: Modifier) {
    Surface(
        modifier = modifier
            .height(80.dp)
            .nerdoraPress(category.onClick),
        color = OfficialPanel,
        shape = RoundedCornerShape(15.dp),
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF1D1529), Color(0xFF14101C))
                    )
                )
                .border(1.dp, category.tint.copy(alpha = .14f), RoundedCornerShape(15.dp))
                .padding(horizontal = 9.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(41.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(category.tint.copy(alpha = .15f)),
                contentAlignment = Alignment.Center
            ) {
                when {
                    category.glyph != null -> Text(
                        category.glyph,
                        color = category.tint,
                        fontSize = if (category.glyph.length > 1) 10.sp else 20.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    category.icon != null -> Icon(
                        category.icon,
                        null,
                        tint = category.tint,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    category.title,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    lineHeight = 12.sp,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    countLabel(category.count),
                    color = OfficialTextMuted,
                    fontSize = 9.sp,
                    maxLines = 1
                )
            }
            Text("›", color = category.tint.copy(alpha = .55f), fontSize = 19.sp)
        }
    }
}

@Composable
private fun QuickAccessRow(
    onOpenFileFolder: (String) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        item { QuickFolderTile("DCIM", "Câmera") { onOpenFileFolder("DCIM") } }
        item { QuickFolderTile("WhatsApp", "Mídias") { onOpenFileFolder("WHATSAPP") } }
        item { QuickFolderTile("Download", "Arquivos") { onOpenFileFolder("DOWNLOAD") } }
        item { QuickFolderTile("Movies", "Vídeos") { onOpenFileFolder("MOVIES") } }
        item { QuickFolderTile("Music", "Músicas") { onOpenFileFolder("MUSIC") } }
        item { QuickFolderTile("Pictures", "Imagens") { onOpenFileFolder("PICTURES") } }
    }
}

@Composable
private fun QuickFolderTile(
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(96.dp)
            .height(110.dp)
            .nerdoraPress(onClick),
        color = OfficialPanel,
        shape = RoundedCornerShape(15.dp),
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF1C1428), Color(0xFF14101C))
                    )
                )
                .border(1.dp, OfficialPurple.copy(alpha = .13f), RoundedCornerShape(15.dp))
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Rounded.Folder,
                null,
                tint = OfficialPurple,
                modifier = Modifier.size(39.dp)
            )
            Spacer(Modifier.height(7.dp))
            Text(
                title,
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                subtitle,
                color = OfficialTextMuted,
                fontSize = 9.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun RecentRow(
    items: List<NerdoraMedia>,
    positionFor: (NerdoraMedia) -> Long,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit
) {
    if (items.isEmpty()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            color = OfficialPanel,
            shape = RoundedCornerShape(14.dp)
        ) {
            Text(
                "Seus arquivos reproduzidos aparecerão aqui.",
                color = OfficialTextMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(16.dp)
            )
        }
        return
    }

    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(items, key = { it.id }) { media ->
            val index = items.indexOfFirst { it.id == media.id }.coerceAtLeast(0)
            RecentMediaCard(
                media = media,
                position = positionFor(media),
                onClick = { onOpenItems(items, index) }
            )
        }
    }
}

@Composable
private fun RecentMediaCard(
    media: NerdoraMedia,
    position: Long,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(188.dp)
            .nerdoraPress(onClick)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(112.dp)
                .shadow(7.dp, RoundedCornerShape(16.dp), clip = false)
                .clip(RoundedCornerShape(16.dp))
                .background(OfficialPanel2)
                .border(1.dp, OfficialPurple.copy(alpha = .14f), RoundedCornerShape(16.dp))
        ) {
            if (media.kind == MediaKind.AUDIO && media.thumbnailUrl == null) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF6B1DC4), Color(0xFF12091C))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Rounded.LibraryMusic,
                        null,
                        tint = Color.White,
                        modifier = Modifier.size(40.dp)
                    )
                }
            } else {
                AsyncImage(
                    model = media.thumbnailUrl ?: media.url,
                    contentDescription = media.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }

            if (media.durationMs > 0L) {
                Text(
                    formatHomeDuration(media.durationMs),
                    color = Color.White,
                    fontSize = 9.sp,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(5.dp)
                        .clip(RoundedCornerShape(5.dp))
                        .background(Color(0xB3000000))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                )
            }

            if (position > 0L && media.durationMs > 0L) {
                val progress = (position.toFloat() / media.durationMs.toFloat()).coerceIn(0f, 1f)
                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .height(3.dp)
                )
            }
        }
        Spacer(Modifier.height(7.dp))
        Text(
            media.title,
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            when (media.kind) {
                MediaKind.AUDIO -> media.artist.ifBlank { "Áudio" }
                MediaKind.VIDEO -> media.folder.ifBlank { "Vídeo" }
                MediaKind.IMAGE -> media.folder.ifBlank { "Imagem" }
            },
            color = OfficialTextMuted,
            fontSize = 10.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

private fun readStorageSnapshot(): StorageSnapshot {
    return runCatching {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        val total = stat.blockCountLong * stat.blockSizeLong
        val available = stat.availableBlocksLong * stat.blockSizeLong
        val used = (total - available).coerceAtLeast(0L)
        val progress = if (total > 0L) used.toFloat() / total.toFloat() else 0f
        StorageSnapshot(
            usedText = formatStorageBytes(used),
            totalText = formatStorageBytes(total),
            progress = progress,
            percent = (progress * 100f).roundToInt().coerceIn(0, 100)
        )
    }.getOrDefault(StorageSnapshot("0 GB", "0 GB", 0f, 0))
}

private fun formatStorageBytes(bytes: Long): String {
    val gb = 1024.0 * 1024.0 * 1024.0
    val mb = 1024.0 * 1024.0
    val locale = Locale.forLanguageTag("pt-BR")
    return when {
        bytes >= gb -> String.format(locale, "%.1f GB", bytes / gb)
        bytes >= mb -> String.format(locale, "%.0f MB", bytes / mb)
        else -> String.format(locale, "%.0f KB", bytes / 1024.0)
    }
}

private fun buildHomeFileStats(
    paths: List<String>,
    media: List<NerdoraMedia>
): HomeFileStats {
    val videoExt = setOf("mp4", "mkv", "avi", "mov", "webm", "m4v", "3gp", "ts")
    val musicExt = setOf("mp3", "aac", "m4a", "flac", "wav", "ogg", "opus", "wma")
    val imageExt = setOf("jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif")
    val documentExt = setOf("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "odt")
    val archiveExt = setOf("zip", "rar", "7z", "tar", "gz", "bz2", "xz")
    val appExt = setOf("apk", "xapk", "apks", "aab")
    val known = videoExt + musicExt + imageExt + documentExt + archiveExt + appExt

    var pathVideos = 0
    var pathMusic = 0
    var pathImages = 0
    var documents = 0
    var archives = 0
    var apps = 0
    var whatsapp = 0
    var downloads = 0
    var others = 0

    paths.forEach { raw ->
        val path = raw.replace('\\', '/').lowercase(Locale.ROOT)
        val name = path.substringAfterLast('/')
        val ext = name.substringAfterLast('.', "")

        if (path.contains("/whatsapp/") || path.contains("/android/media/com.whatsapp/")) whatsapp++
        if (path.contains("/download/") || path.contains("/downloads/")) downloads++

        when (ext) {
            in videoExt -> pathVideos++
            in musicExt -> pathMusic++
            in imageExt -> pathImages++
            in documentExt -> documents++
            in archiveExt -> archives++
            in appExt -> apps++
            else -> if (ext.isNotBlank() && ext !in known) others++
        }
    }

    return HomeFileStats(
        videos = maxOf(pathVideos, media.count { it.kind == MediaKind.VIDEO }),
        music = maxOf(pathMusic, media.count { it.kind == MediaKind.AUDIO }),
        images = maxOf(pathImages, media.count { it.kind == MediaKind.IMAGE }),
        documents = documents,
        archives = archives,
        apps = apps,
        whatsapp = whatsapp,
        downloads = downloads,
        others = others
    )
}

private fun countLabel(count: Int): String {
    return count.toString() + if (count == 1) " arquivo" else " arquivos"
}

private fun formatHomeDuration(ms: Long): String {
    val totalSeconds = (ms / 1000L).coerceAtLeast(0L)
    val hours = totalSeconds / 3600L
    val minutes = (totalSeconds % 3600L) / 60L
    val seconds = totalSeconds % 60L
    return if (hours > 0L) {
        String.format(Locale.ROOT, "%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format(Locale.ROOT, "%02d:%02d", minutes, seconds)
    }
}
