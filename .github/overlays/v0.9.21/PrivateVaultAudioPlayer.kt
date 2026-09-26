package com.nerdora.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.LibraryMusic
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.delay

@Composable
fun PrivateVaultAudioPlayer(
    media: NerdoraMedia,
    autoplay: Boolean,
    modifier: Modifier = Modifier
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val player = remember(media.id) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(media.url))
            prepare()
            playWhenReady = autoplay
        }
    }
    var playing by remember(media.id) { mutableStateOf(autoplay) }
    var position by remember(media.id) { mutableLongStateOf(0L) }
    var duration by remember(media.id) { mutableLongStateOf(media.durationMs.coerceAtLeast(1L)) }

    DisposableEffect(player) {
        onDispose {
            runCatching { player.stop() }
            player.release()
        }
    }

    LaunchedEffect(player) {
        while (true) {
            playing = player.isPlaying
            position = player.currentPosition.coerceAtLeast(0L)
            if (player.duration > 0L) duration = player.duration
            delay(400L)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF251039), Color.Black))),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier
                    .size(210.dp)
                    .background(Color(0xFF2D1742), RoundedCornerShape(30.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.LibraryMusic, null, tint = Color.White, modifier = Modifier.size(88.dp))
            }
            Spacer(Modifier.size(22.dp))
            Text(
                media.title,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text("Reprodução privada • sem mini player global", color = Color(0xFFC9BED4), fontSize = 11.sp)
            Spacer(Modifier.size(18.dp))
            Slider(
                value = position.coerceAtMost(duration.coerceAtLeast(1L)).toFloat(),
                onValueChange = {
                    position = it.toLong()
                    player.seekTo(position)
                },
                valueRange = 0f..duration.coerceAtLeast(1L).toFloat(),
                modifier = Modifier.fillMaxWidth()
            )
            Row(Modifier.fillMaxWidth()) {
                Text(privateDuration(position), color = Color(0xFFCFC3DA), fontSize = 11.sp)
                Spacer(Modifier.weight(1f))
                Text(privateDuration(duration), color = Color(0xFFCFC3DA), fontSize = 11.sp)
            }
            Spacer(Modifier.size(12.dp))
            Box(
                Modifier.size(72.dp).background(MaterialTheme.colorScheme.primary, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = { if (player.isPlaying) player.pause() else player.play() },
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        if (playing) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                        if (playing) "Pausar" else "Reproduzir",
                        tint = Color.White,
                        modifier = Modifier.size(38.dp)
                    )
                }
            }
        }
    }
}

private fun privateDuration(ms: Long): String {
    val seconds = (ms / 1000L).coerceAtLeast(0L)
    val min = seconds / 60L
    val sec = seconds % 60L
    return String.format("%02d:%02d", min, sec)
}
