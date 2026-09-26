package com.nerdora.player.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nerdora.player.model.NerdoraMedia

@Composable
fun TrashScreen(
    items: List<NerdoraMedia>,
    onBack: () -> Unit,
    onOpenItems: (List<NerdoraMedia>, Int) -> Unit,
    onRestore: (String) -> Unit,
    onEmptyLogicalTrash: () -> Unit
) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, "Voltar") }
                Column(Modifier.weight(1f)) {
                    Text("Itens removidos da Biblioteca", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Remove apenas da Biblioteca do Nerdora; o arquivo continua no armazenamento do Android.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (items.isNotEmpty()) {
                    IconButton(onClick = onEmptyLogicalTrash) {
                        Icon(Icons.Rounded.DeleteSweep, "Limpar itens removidos")
                    }
                }
            }
            if (items.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Nenhum item removido", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(145.dp),
                    modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    itemsIndexed(items, key = { _, item -> item.id }) { index, item ->
                        Column {
                            MediaCard(
                                media = item,
                                modifier = Modifier.fillMaxWidth().height(190.dp),
                                onClick = { onOpenItems(items, index) }
                            )
                            Button(onClick = { onRestore(item.id) }, modifier = Modifier.fillMaxWidth()) {
                                Icon(Icons.Rounded.Refresh, null)
                                Text(" Restaurar")
                            }
                        }
                    }
                }
            }
        }
    }
}
