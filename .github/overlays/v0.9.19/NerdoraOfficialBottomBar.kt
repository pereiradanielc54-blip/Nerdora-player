package com.nerdora.player.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.R

@Composable
private fun Modifier.nerdoraNavPress(onClick: () -> Unit): Modifier {
    val interaction = androidx.compose.runtime.remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.93f else 1f,
        animationSpec = tween(durationMillis = 110)
    )
    return this
        .graphicsLayer(scaleX = scale, scaleY = scale)
        .clickable(interactionSource = interaction, indication = null, onClick = onClick)
}

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
        OfficialNavItem("CENTRAL", "Nerdora", central = true),
        OfficialNavItem("PLAYLISTS", "Playlists", Icons.Rounded.LibraryMusic),
        OfficialNavItem("FILES", "Arquivos", Icons.Rounded.Description)
    )

    Surface(
        color = Color(0xFF0B0710),
        shadowElevation = 16.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(88.dp)
                .padding(horizontal = 4.dp, vertical = 6.dp),
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
    val inactive = Color(0xFFAAA0B5)
    val selectedScale by animateFloatAsState(
        targetValue = if (selected) 1.06f else 1f,
        animationSpec = tween(durationMillis = 180)
    )

    Column(
        modifier = modifier
            .height(76.dp)
            .nerdoraNavPress(onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (item.central) {
            Box(
                modifier = Modifier
                    .offset(y = (-9).dp)
                    .size(60.dp)
                    .shadow(13.dp, CircleShape, clip = false)
                    .clip(CircleShape)
                    .background(Color(0xFF4B117F)),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    Modifier
                        .size(55.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF6B1AC0))
                )
                Image(
                    painter = painterResource(R.drawable.nerdora_player_mark),
                    contentDescription = item.label,
                    modifier = Modifier.size(50.dp),
                    contentScale = ContentScale.Fit
                )
            }
            Text(
                item.label,
                color = active,
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                modifier = Modifier.offset(y = (-7).dp)
            )
        } else {
            if (selected) {
                Box(
                    Modifier
                        .width(18.dp)
                        .height(3.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(active)
                )
                Spacer(Modifier.height(3.dp))
            } else {
                Spacer(Modifier.height(6.dp))
            }

            Box(
                modifier = Modifier
                    .size(width = 44.dp, height = 31.dp)
                    .graphicsLayer(scaleX = selectedScale, scaleY = selectedScale)
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (selected) Color(0xFF35134F) else Color.Transparent),
                contentAlignment = Alignment.Center
            ) {
                if (item.glyph != null) {
                    Text(
                        item.glyph,
                        color = if (selected) active else inactive,
                        fontSize = 25.sp,
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

            Spacer(Modifier.height(3.dp))
            Text(
                item.label,
                color = if (selected) active else inactive,
                fontSize = 8.5.sp,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                maxLines = 1
            )
        }
    }
}
