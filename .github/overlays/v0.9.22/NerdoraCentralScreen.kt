package com.nerdora.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun NerdoraCentralScreen(
    onOpenFileCategory: (String) -> Unit,
    onOpenDownloads: () -> Unit,
    onOpenVault: () -> Unit,
    onOpenLink: () -> Unit
) {
    Surface(Modifier.fillMaxSize(), color = Color(0xFF08060E)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 28.dp)
        ) {
            item {
                Column(
                    Modifier.fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF25103E), Color(0xFF0D0714))
                            )
                        )
                        .padding(horizontal = 18.dp, vertical = 24.dp)
                ) {
                    Text("Central Nerdora", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                    Text(
                        "Ferramentas do Player organizadas em um único lugar.",
                        color = Color(0xFFC5B9D2),
                        fontSize = 12.sp
                    )
                }
            }

            item {
                ToolSectionTitle("Gerenciar armazenamento", "Organização e manutenção dos seus arquivos")
                ToolGridRow(
                    ToolItem("Arquivos grandes", "GB") { onOpenFileCategory("LARGE") },
                    ToolItem("Duplicados", "≋") { onOpenFileCategory("DUPLICATES") }
                )
                Spacer(Modifier.height(8.dp))
                ToolGridRow(
                    ToolItem("Lixeira", "⌫") { onOpenFileCategory("TRASH") },
                    ToolItem("Todos os arquivos", "▣") { onOpenFileCategory("ALL") }
                )
            }

            item {
                ToolSectionTitle("Privacidade", "Proteja arquivos fora do armazenamento compartilhado")
                ToolGridRow(
                    ToolItem("Cofre privado", "◆", onOpenVault),
                    ToolItem("Downloads", "↓", onOpenDownloads)
                )
            }

            item {
                ToolSectionTitle("Utilidades", "Ações rápidas sem duplicar a Home")
                ToolGridRow(
                    ToolItem("Abrir link", "↗", onOpenLink),
                    ToolItem("Recentes de arquivos", "↺") { onOpenFileCategory("RECENT") }
                )
            }

            item {
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 18.dp),
                    color = Color(0xFF15101F),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text("Base organizada", color = Color.White, fontWeight = FontWeight.Bold)
                        Text(
                            "As próximas ferramentas do Gerenciador Pro entrarão nesta central sem misturar mídia, arquivos e configurações.",
                            color = Color(0xFFAA9DB8),
                            fontSize = 10.5.sp
                        )
                    }
                }
            }
        }
    }
}

private data class ToolItem(
    val title: String,
    val glyph: String,
    val action: () -> Unit
)

@Composable
private fun ToolSectionTitle(title: String, subtitle: String) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
        Text(title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = Color(0xFFAA9DB8), fontSize = 10.sp)
    }
}

@Composable
private fun ToolGridRow(first: ToolItem, second: ToolItem) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        ToolCard(first, Modifier.weight(1f))
        ToolCard(second, Modifier.weight(1f))
    }
}

@Composable
private fun ToolCard(item: ToolItem, modifier: Modifier) {
    Surface(
        modifier = modifier.height(104.dp).clickable(onClick = item.action),
        color = Color(0xFF191023),
        shape = RoundedCornerShape(17.dp),
        shadowElevation = 4.dp
    ) {
        Column(
            Modifier.padding(13.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(item.glyph, color = Color(0xFFB85DFF), fontSize = 25.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(item.title, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}
