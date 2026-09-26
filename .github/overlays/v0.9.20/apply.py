from pathlib import Path

# Gerenciador de arquivos: operações físicas reais.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

if "import androidx.compose.material.icons.rounded.Lock" not in text:
    text = text.replace(
        "import androidx.compose.material.icons.rounded.Info\n",
        "import androidx.compose.material.icons.rounded.Info\nimport androidx.compose.material.icons.rounded.Lock\n",
        1
    )
if "import androidx.compose.runtime.rememberCoroutineScope" not in text:
    text = text.replace(
        "import androidx.compose.runtime.remember\n",
        "import androidx.compose.runtime.remember\nimport androidx.compose.runtime.rememberCoroutineScope\n",
        1
    )
if "import com.nerdora.player.PrivateVaultStore" not in text:
    text = text.replace(
        "import com.nerdora.player.FileManagerStore\n",
        "import com.nerdora.player.FileManagerStore\nimport com.nerdora.player.PrivateVaultStore\nimport com.nerdora.player.RealFileOperations\n",
        1
    )
if "import kotlinx.coroutines.launch" not in text:
    text = text.replace(
        "import kotlinx.coroutines.Dispatchers\n",
        "import kotlinx.coroutines.Dispatchers\nimport kotlinx.coroutines.launch\n",
        1
    )

state_marker = "    var renameTarget by remember { mutableStateOf<File?>(null) }\n    var trashTarget by remember { mutableStateOf<File?>(null) }"
assert state_marker in text, "estados de operação de FilesScreen não encontrados"
text = text.replace(
    state_marker,
    "    var renameTarget by remember { mutableStateOf<File?>(null) }\n    var hideTarget by remember { mutableStateOf<File?>(null) }\n    var trashTarget by remember { mutableStateOf<File?>(null) }",
    1
)
scope_marker = "    var storeEpoch by remember { mutableIntStateOf(0) }"
assert scope_marker in text, "storeEpoch não encontrado"
text = text.replace(scope_marker, scope_marker + "\n    val operationScope = rememberCoroutineScope()", 1)

old_device_sig = """private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, onClick: () -> Unit, onFavorite: () -> Unit,
    onRename: () -> Unit, onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onTrash: () -> Unit,
    onRestore: () -> Unit, onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {"""
new_device_sig = """private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, onClick: () -> Unit, onFavorite: () -> Unit,
    onRename: () -> Unit, onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onRestore: () -> Unit, onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {"""
assert old_device_sig in text, "DeviceFileRow signature não encontrada"
text = text.replace(old_device_sig, new_device_sig, 1)

device_trash_line = '                        DropdownMenuItem(text = { Text("Mover para Lixeira") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onTrash() })'
assert device_trash_line in text, "menu de lixeira DeviceFileRow não encontrado"
text = text.replace(
    device_trash_line,
    '                        DropdownMenuItem(text = { Text("Ocultar no Cofre") }, leadingIcon = { Icon(Icons.Rounded.Lock, null) }, onClick = { menu = false; onHide() })\n'
    '                        DropdownMenuItem(text = { Text("Mover para Lixeira") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onTrash() })\n'
    '                        DropdownMenuItem(text = { Text("Excluir definitivamente") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onPermanentDelete() })',
    1
)

old_raw_sig = """private fun RawFolderRow(
    file: File, favorite: Boolean, onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
    onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onTrash: () -> Unit, onDetails: () -> Unit
) {"""
new_raw_sig = """private fun RawFolderRow(
    file: File, favorite: Boolean, onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
    onCopy: () -> Unit, onMove: () -> Unit, onShare: () -> Unit, onHide: () -> Unit, onTrash: () -> Unit,
    onPermanentDelete: () -> Unit, onDetails: () -> Unit
) {"""
assert old_raw_sig in text, "RawFolderRow signature não encontrada"
text = text.replace(old_raw_sig, new_raw_sig, 1)

raw_trash = '                    DropdownMenuItem(text = { Text("Mover para Lixeira") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onTrash() })'
assert raw_trash in text, "menu de lixeira RawFolderRow não encontrado"
text = text.replace(
    raw_trash,
    '                    DropdownMenuItem(text = { Text("Ocultar no Cofre") }, leadingIcon = { Icon(Icons.Rounded.Lock, null) }, onClick = { menu = false; onHide() })\n'
    '                    DropdownMenuItem(text = { Text("Mover para Lixeira") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onTrash() })\n'
    '                    DropdownMenuItem(text = { Text("Excluir definitivamente") }, leadingIcon = { Icon(Icons.Rounded.Delete, null) }, onClick = { menu = false; onPermanentDelete() })',
    1
)

device_call = '                                onShare = { shareRawFile(context, item.file) },\n                                onTrash = { trashTarget = item.file },'
assert device_call in text, "callbacks DeviceFileRow não encontrados"
text = text.replace(
    device_call,
    '                                onShare = { shareRawFile(context, item.file) },\n'
    '                                onHide = { hideTarget = item.file },\n'
    '                                onTrash = { trashTarget = item.file },',
    1
)

raw_call = '                                onShare = { if (item.isFile) shareRawFile(context, item) }, onTrash = { trashTarget = item },\n                                onDetails = { detailsTarget = item }'
assert raw_call in text, "callbacks RawFolderRow não encontrados"
text = text.replace(
    raw_call,
    '                                onShare = { if (item.isFile) shareRawFile(context, item) }, onHide = { hideTarget = item }, onTrash = { trashTarget = item },\n'
    '                                onPermanentDelete = { permanentDeleteTarget = item }, onDetails = { detailsTarget = item }',
    1
)

old_rename = """    renameTarget?.let { target ->
        TextPromptDialogUniversal("Renomear", target.name, "Salvar", { renameTarget = null }) { name ->
            val parent = target.parentFile
            val destination = parent?.let { File(it, sanitizeName(name)) }
            val ok = destination != null && name.isNotBlank() && !destination.exists() && target.renameTo(destination)
            Toast.makeText(context, if (ok) "Renomeado" else "Não foi possível renomear", Toast.LENGTH_SHORT).show()
            renameTarget = null
            forceRescan = true; refreshEpoch++
        }
    }

"""
new_rename = """    renameTarget?.let { target ->
        TextPromptDialogUniversal("Renomear no celular", target.name, "Salvar", { renameTarget = null }) { name ->
            renameTarget = null
            operationScope.launch {
                val result = withContext(Dispatchers.IO) { RealFileOperations.renameReal(context, target, name) }
                Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                if (result.success) {
                    storeEpoch++
                    forceRescan = true
                    refreshEpoch++
                }
            }
        }
    }

"""
assert old_rename in text, "diálogo de renomear original não encontrado"
text = text.replace(old_rename, new_rename, 1)

trash_dialog = '    trashTarget?.let { target ->'
assert trash_dialog in text, "trashTarget dialog não encontrado"
hide_dialog = """    hideTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { hideTarget = null },
            title = { Text("Ocultar no Cofre privado?") },
            text = { Text("${target.name} será removido da pasta atual e movido para a área privada do Nerdora. Gerenciadores comuns deixarão de enxergá-lo.") },
            confirmButton = {
                TextButton(onClick = {
                    hideTarget = null
                    operationScope.launch {
                        val result = withContext(Dispatchers.IO) { PrivateVaultStore.hideFile(context, target) }
                        Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                        if (result.success) {
                            storeEpoch++
                            forceRescan = true
                            refreshEpoch++
                        }
                    }
                }) { Text("Ocultar") }
            },
            dismissButton = { TextButton(onClick = { hideTarget = null }) { Text("Cancelar") } }
        )
    }

"""
text = text.replace(trash_dialog, hide_dialog + trash_dialog, 1)

old_delete = """    permanentDeleteTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { permanentDeleteTarget = null }, title = { Text("Excluir definitivamente?") }, text = { Text("Esta ação não poderá ser desfeita.") },
            confirmButton = { TextButton(onClick = {
                val ok = if (target.isDirectory) target.deleteRecursively() else target.delete()
                if (ok) UniversalFilesStore.forgetTrash(context, target.absolutePath)
                Toast.makeText(context, if (ok) "Excluído definitivamente" else "Não foi possível excluir", Toast.LENGTH_SHORT).show()
                permanentDeleteTarget = null; forceRescan = true; refreshEpoch++
            }) { Text("Excluir") } },
            dismissButton = { TextButton(onClick = { permanentDeleteTarget = null }) { Text("Cancelar") } }
        )
    }"""
new_delete = """    permanentDeleteTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { permanentDeleteTarget = null },
            title = { Text("Excluir definitivamente do celular?") },
            text = { Text("O arquivo físico será apagado e esta ação não poderá ser desfeita.") },
            confirmButton = {
                TextButton(onClick = {
                    permanentDeleteTarget = null
                    operationScope.launch {
                        val result = withContext(Dispatchers.IO) { RealFileOperations.deletePermanently(context, target) }
                        Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                        if (result.success) {
                            storeEpoch++
                            forceRescan = true
                            refreshEpoch++
                        }
                    }
                }) { Text("Excluir definitivamente") }
            },
            dismissButton = { TextButton(onClick = { permanentDeleteTarget = null }) { Text("Cancelar") } }
        )
    }"""
assert old_delete in text, "diálogo excluir definitivamente não encontrado"
text = text.replace(old_delete, new_delete, 1)

media_path_marker = 'title = name.ifBlank { "Arquivo" }, mimeType = mime'
assert media_path_marker in text, "File.toMedia marker não encontrado"
text = text.replace(
    media_path_marker,
    'title = name.ifBlank { "Arquivo" }, description = absolutePath, mimeType = mime',
    1
)
path.write_text(text, encoding="utf-8")

# Player de mídia: Ocultar e Excluir passam a ser operações físicas reais.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/MediaViewerScreen.kt")
text = path.read_text(encoding="utf-8")
if "import android.widget.Toast" not in text:
    package_line = "package com.nerdora.player.ui\n"
    assert package_line in text
    text = text.replace(package_line, package_line + "\nimport android.widget.Toast\n", 1)
if "import com.nerdora.player.PrivateVaultStore" not in text:
    text = text.replace(
        "import com.nerdora.player.PlayerPreferences\n",
        "import com.nerdora.player.PlayerPreferences\nimport com.nerdora.player.PrivateVaultStore\nimport com.nerdora.player.RealFileOperations\n",
        1
    )

sig_old = """    onClose: () -> Unit,
    onEnterPictureInPicture: () -> Unit,
    onStoreChanged: () -> Unit
) {"""
sig_new = """    onClose: () -> Unit,
    onEnterPictureInPicture: () -> Unit,
    onStoreChanged: () -> Unit,
    onFileSystemChanged: () -> Unit
) {"""
assert sig_old in text, "MediaViewerScreen signature não encontrada"
text = text.replace(sig_old, sig_new, 1)

state = '    var imageZoomed by remember(current.id) { mutableStateOf(false) }'
assert state in text
text = text.replace(
    state,
    state + '\n    var fileActionConfirm by remember { mutableStateOf<String?>(null) }\n    val fileOperationScope = rememberCoroutineScope()',
    1
)

old_actions = """                        if (current.isLocal) {
                            TextButton(onClick = {
                                LibraryStore.setHidden(context, current.id, true)
                                onStoreChanged()
                                onClose()
                            }) {
                                Icon(Icons.Rounded.Lock, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Ocultar")
                            }
                            TextButton(onClick = {
                                LibraryStore.moveToTrash(context, current.id)
                                onStoreChanged()
                                onClose()
                            }) {
                                Icon(Icons.Rounded.Delete, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Remover")
                            }
                        }"""
new_actions = """                        if (current.isLocal && !current.id.startsWith("vault-")) {
                            TextButton(onClick = { fileActionConfirm = "hide" }) {
                                Icon(Icons.Rounded.Lock, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Ocultar")
                            }
                            TextButton(onClick = { fileActionConfirm = "delete" }) {
                                Icon(Icons.Rounded.Delete, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Excluir")
                            }
                        }"""
assert old_actions in text, "ações antigas do MediaViewer não encontradas"
text = text.replace(old_actions, new_actions, 1)

info_marker = '    if (infoOpen) {'
assert info_marker in text
confirm_block = """    fileActionConfirm?.let { action ->
        val hiding = action == "hide"
        AlertDialog(
            onDismissRequest = { fileActionConfirm = null },
            title = { Text(if (hiding) "Ocultar no Cofre privado?" else "Excluir definitivamente do celular?") },
            text = {
                Text(
                    if (hiding)
                        "${current.title} será movido para a área privada do Nerdora e deixará de aparecer nos gerenciadores comuns."
                    else
                        "${current.title} será apagado fisicamente do armazenamento. Esta ação não poderá ser desfeita."
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    fileActionConfirm = null
                    fileOperationScope.launch {
                        val result = withContext(Dispatchers.IO) {
                            if (hiding) PrivateVaultStore.hideMedia(context, current)
                            else RealFileOperations.deleteMediaPermanently(context, current)
                        }
                        Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                        if (result.success) {
                            onFileSystemChanged()
                            onClose()
                        }
                    }
                }) { Text(if (hiding) "Ocultar" else "Excluir definitivamente") }
            },
            dismissButton = { TextButton(onClick = { fileActionConfirm = null }) { Text("Cancelar") } }
        )
    }

"""
text = text.replace(info_marker, confirm_block + info_marker, 1)
path.write_text(text, encoding="utf-8")

# Ajustes: deixar claro que o Cofre é físico.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
text = path.read_text(encoding="utf-8")
text = text.replace(
    '            ActionSetting(Icons.Rounded.Lock, "Mídia oculta", "$hiddenCount item(ns). Protegido pela biometria/tela de bloqueio.", onOpenPrivate)',
    '            ActionSetting(Icons.Rounded.Lock, "Cofre privado", "$hiddenCount item(ns). Arquivos movidos para o armazenamento privado do Nerdora.", onOpenPrivate)',
    1
)
text = text.replace(
    '            Text("Ocultar e remover da Biblioteca não apagam o arquivo. A Lixeira de arquivos é a área usada pelo gerenciador para mover arquivos físicos.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)',
    '            Text("Ocultar agora move o arquivo para o Cofre privado. Remover da Biblioteca continua sendo apenas uma remoção visual; Excluir definitivamente apaga o arquivo físico.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)',
    1
)
path.write_text(text, encoding="utf-8")
