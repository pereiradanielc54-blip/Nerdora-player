package com.nerdora.player.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LibraryMusic
import androidx.compose.material.icons.rounded.PermMedia
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.R

private data class OfficialNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector? = null,
    val glyph: String? = null,
    val central: Boolean = false
)

@Composable
fun NerdoraOfficialBottomBar(
    selectedRoute: String,
    onRoute: (String) -> Unit
) {
    val items = listOf(
        OfficialNavItem("HOME", "Início", Icons.Rounded.Home),
        OfficialNavItem("LIBRARY", "Biblioteca", Icons.Rounded.PermMedia),
        OfficialNavItem("DOWNLOADS", "Download", glyph = "↓"),
        OfficialNavItem("FILES", "Arquivos", central = true),
        OfficialNavItem("PLAYLISTS", "Playlists", Icons.Rounded.LibraryMusic),
        OfficialNavItem("SETTINGS", "Ajustes", Icons.Rounded.Settings)
    )

    Surface(
        color = Color(0xFF0C0812),
        shadowElevation = 10.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(82.dp)
                .padding(horizontal = 5.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            items.forEach { item ->
                val selected = selectedRoute == item.route
                OfficialNavButton(
                    item = item,
                    selected = selected,
                    modifier = Modifier.weight(1f),
                    onClick = { onRoute(item.route) }
                )
            }
        }
    }
}

@Composable
private fun OfficialNavButton(
    item: OfficialNavItem,
    selected: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val active = Color(0xFFB65CFF)
    val inactive = Color(0xFFB2A8BD)

    Column(
        modifier = modifier
            .height(70.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (item.central) {
            Box(
                modifier = Modifier
                    .size(53.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF4A127E)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(R.drawable.nerdora_player_mark),
                    contentDescription = item.label,
                    modifier = Modifier.size(47.dp),
                    contentScale = ContentScale.Fit
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .size(width = 44.dp, height = 32.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (selected) Color(0xFF3A155E) else Color.Transparent),
                contentAlignment = Alignment.Center
            ) {
                if (item.glyph != null) {
                    Text(
                        item.glyph,
                        color = if (selected) active else inactive,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                } else if (item.icon != null) {
                    Icon(
                        item.icon,
                        contentDescription = item.label,
                        tint = if (selected) active else inactive,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Icon(
                        Icons.Rounded.Description,
                        contentDescription = item.label,
                        tint = if (selected) active else inactive,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        if (!item.central) Spacer(Modifier.height(3.dp))
        Text(
            item.label,
            color = if (selected || item.central) active else inactive,
            fontSize = 9.sp,
            fontWeight = if (selected || item.central) FontWeight.SemiBold else FontWeight.Normal,
            maxLines = 1
        )
    }
}
