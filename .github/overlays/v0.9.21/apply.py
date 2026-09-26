from pathlib import Path

# 1) MediaViewer: mídia do Cofre não entra em histórico, favoritos, playlists ou sessão global.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/MediaViewerScreen.kt")
text = path.read_text(encoding="utf-8")

old_history = '''    LaunchedEffect(current.id) {
        videoChromeVisible = true
        imageZoomed = false
        LibraryStore.recordOpened(context, current.id)
        onStoreChanged()
    }'''
new_history = '''    LaunchedEffect(current.id) {
        videoChromeVisible = true
        imageZoomed = false
        if (!current.id.startsWith("vault-")) {
            LibraryStore.recordOpened(context, current.id)
            onStoreChanged()
        }
    }'''
assert old_history in text, "histórico do MediaViewer não encontrado"
text = text.replace(old_history, new_history, 1)

old_audio = '                            NerdoraAudioPlayer(media = item, queue = items, autoplay = autoplay, modifier = Modifier.fillMaxSize())'
new_audio = '''                            if (item.id.startsWith("vault-")) {
                                PrivateVaultAudioPlayer(media = item, autoplay = autoplay, modifier = Modifier.fillMaxSize())
                            } else {
                                NerdoraAudioPlayer(media = item, queue = items, autoplay = autoplay, modifier = Modifier.fillMaxSize())
                            }'''
assert old_audio in text, "player de áudio não encontrado"
text = text.replace(old_audio, new_audio, 1)

old_favorite = '''                        IconButton(onClick = {
                            favorite = !favorite
                            LibraryStore.setFavorite(context, current.id, favorite)
                            onStoreChanged()
                        }) { Icon(if (favorite) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder, "Favoritar", tint = if (favorite) MaterialTheme.colorScheme.primary else Color.White) }'''
new_favorite = '''                        if (!current.id.startsWith("vault-")) {
                            IconButton(onClick = {
                                favorite = !favorite
                                LibraryStore.setFavorite(context, current.id, favorite)
                                onStoreChanged()
                            }) { Icon(if (favorite) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder, "Favoritar", tint = if (favorite) MaterialTheme.colorScheme.primary else Color.White) }
                        }'''
assert old_favorite in text, "favorito do MediaViewer não encontrado"
text = text.replace(old_favorite, new_favorite, 1)

old_playlist = '''                        TextButton(onClick = { playlistOpen = true }) {
                            Icon(Icons.Rounded.AddToQueue, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Playlist")
                        }'''
new_playlist = '''                        if (!current.id.startsWith("vault-")) {
                            TextButton(onClick = { playlistOpen = true }) {
                                Icon(Icons.Rounded.AddToQueue, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.size(5.dp)); Text("Playlist")
                            }
                        }'''
assert old_playlist in text, "botão Playlist do MediaViewer não encontrado"
text = text.replace(old_playlist, new_playlist, 1)
path.write_text(text, encoding="utf-8")


# 2) FilesScreen: SAF deixa de ser somente leitura + lixeira passa a aceitar pastas corretamente.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

start = text.index("@Composable\nprivate fun LegacySafBrowser(")
end = text.index("private fun hasFullStorageAccess", start)
new_saf = r'''@Composable
private fun LegacySafBrowser(
    context: Context, rootUri: Uri, onRequestFullAccess: () -> Unit, onChangeRoot: () -> Unit,
    onOpenMedia: (NerdoraMedia) -> Unit, onOpenDocument: (DocumentRef) -> Unit
) {
    val root = remember(rootUri) { DocumentFile.fromTreeUri(context, rootUri) }
    var current by remember(rootUri) { mutableStateOf(root) }
    var stack by remember(rootUri) { mutableStateOf<List<DocumentFile>>(emptyList()) }
    var files by remember { mutableStateOf<List<DocumentFile>>(emptyList()) }
    var query by rememberSaveable { mutableStateOf("") }
    var refresh by remember { mutableIntStateOf(0) }
    var renameTarget by remember { mutableStateOf<DocumentFile?>(null) }
    var deleteTarget by remember { mutableStateOf<DocumentFile?>(null) }
    var hideTarget by remember { mutableStateOf<DocumentFile?>(null) }
    val scope = rememberCoroutineScope()

    BackHandler(enabled = stack.isNotEmpty()) {
        current = stack.last()
        stack = stack.dropLast(1)
        query = ""
    }

    LaunchedEffect(current?.uri, refresh) {
        files = withContext(Dispatchers.IO) {
            runCatching {
                current?.listFiles()?.toList().orEmpty()
                    .sortedWith(compareByDescending<DocumentFile> { it.isDirectory }.thenBy { it.name?.lowercase().orEmpty() })
            }.getOrDefault(emptyList())
        }
    }

    val shown = remember(files, query) {
        if (query.isBlank()) files else files.filter { it.name.orEmpty().contains(query, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(current?.name ?: "Arquivos") },
                navigationIcon = {
                    if (stack.isNotEmpty()) {
                        IconButton(onClick = {
                            current = stack.last()
                            stack = stack.dropLast(1)
                        }) { Icon(Icons.Rounded.ArrowBack, "Voltar") }
                    }
                },
                actions = { IconButton(onClick = { refresh++ }) { Icon(Icons.Rounded.Refresh, "Atualizar") } }
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Surface(color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("Modo compatível: pasta autorizada", fontWeight = FontWeight.Bold)
                    Text("Renomear, excluir e Cofre funcionam nos arquivos autorizados pelo Android.", fontSize = 11.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onRequestFullAccess) { Text("Acesso completo") }
                        TextButton(onClick = onChangeRoot) { Text("Trocar pasta") }
                    }
                }
            }

            OutlinedTextField(
                query,
                { query = it },
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Rounded.Search, null) },
                placeholder = { Text("Buscar nesta pasta") }
            )

            LazyColumn(Modifier.fillMaxSize()) {
                items(shown, key = { it.uri.toString() }) { file ->
                    val mime = file.type ?: guessMime(file.name.orEmpty())
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (file.isDirectory) {
                                    current?.let { stack = stack + it }
                                    current = file
                                    query = ""
                                } else when {
                                    mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/") ->
                                        onOpenMedia(file.toMediaSaf(mime))
                                    else ->
                                        onOpenDocument(DocumentRef(file.uri, file.name ?: "Documento", mime, file.length(), file.lastModified()))
                                }
                            }
                            .padding(start = 14.dp, top = 8.dp, bottom = 8.dp, end = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(fileIconUniversal(file.isDirectory, mime), null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.size(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(file.name ?: "Sem nome", maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(
                                if (file.isDirectory) "Pasta" else formatFileSizeUniversal(file.length()),
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        var menu by remember(file.uri) { mutableStateOf(false) }
                        Box {
                            IconButton(onClick = { menu = true }) { Icon(Icons.Rounded.MoreVert, "Ações") }
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                DropdownMenuItem(
                                    text = { Text("Renomear") },
                                    leadingIcon = { Icon(Icons.Rounded.Edit, null) },
                                    onClick = { menu = false; renameTarget = file }
                                )
                                if (file.isFile) {
                                    DropdownMenuItem(
                                        text = { Text("Ocultar no Cofre") },
                                        leadingIcon = { Icon(Icons.Rounded.Lock, null) },
                                        onClick = { menu = false; hideTarget = file }
                                    )
                                }
                                DropdownMenuItem(
                                    text = { Text("Excluir definitivamente") },
                                    leadingIcon = { Icon(Icons.Rounded.Delete, null) },
                                    onClick = { menu = false; deleteTarget = file }
                                )
                            }
                        }
                    }
                    HorizontalDivider()
                }
            }
        }
    }

    renameTarget?.let { target ->
        TextPromptDialogUniversal(
            "Renomear no celular",
            target.name.orEmpty(),
            "Salvar",
            { renameTarget = null }
        ) { requested ->
            val clean = sanitizeName(requested)
            val ok = clean.isNotBlank() && target.renameTo(clean)
            Toast.makeText(context, if (ok) "Renomeado no armazenamento." else "O Android não permitiu renomear.", Toast.LENGTH_LONG).show()
            renameTarget = null
            if (ok) refresh++
        }
    }

    hideTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { hideTarget = null },
            title = { Text("Ocultar no Cofre?") },
            text = { Text("${target.name ?: "Arquivo"} será removido desta pasta e enviado ao Cofre privado.") },
            confirmButton = {
                TextButton(onClick = {
                    hideTarget = null
                    scope.launch {
                        val result = withContext(Dispatchers.IO) { PrivateVaultStore.hideSafDocument(context, target) }
                        Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                        if (result.success) refresh++
                    }
                }) { Text("Ocultar") }
            },
            dismissButton = { TextButton(onClick = { hideTarget = null }) { Text("Cancelar") } }
        )
    }

    deleteTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Excluir definitivamente?") },
            text = { Text("${target.name ?: "Item"} será apagado da pasta autorizada.") },
            confirmButton = {
                TextButton(onClick = {
                    val ok = target.delete()
                    Toast.makeText(context, if (ok) "Excluído definitivamente." else "O Android não permitiu excluir.", Toast.LENGTH_LONG).show()
                    deleteTarget = null
                    if (ok) refresh++
                }) { Text("Excluir") }
            },
            dismissButton = { TextButton(onClick = { deleteTarget = null }) { Text("Cancelar") } }
        )
    }
}

'''
text = text[:start] + new_saf + text[end:]

text = text.replace(
    'private fun scanTrashFiles(): List<DeviceFileItem> { val trash = nerdoraTrashRoot(); if (!trash.exists() || !trash.isDirectory) return emptyList(); return trash.listFiles()?.filter { it.isFile }?.map(::deviceItem).orEmpty() }',
    'private fun scanTrashFiles(): List<DeviceFileItem> { val trash = nerdoraTrashRoot(); if (!trash.exists() || !trash.isDirectory) return emptyList(); return trash.listFiles()?.filter { it.isFile || it.isDirectory }?.map(::deviceItem).orEmpty() }',
    1
)

old_trash_success = 'return if (success && destination.exists()) { UniversalFilesStore.rememberTrash(context, destination.absolutePath, original); "Movido para a Lixeira do Nerdora." } else "Não foi possível mover para a Lixeira."'
new_trash_success = 'return if (success && destination.exists()) { UniversalFilesStore.rememberTrash(context, destination.absolutePath, original); UniversalFileIndexCache.removePrefix(context, original); RealFileOperations.scanChangedPaths(context, listOf(original, destination.absolutePath)); "Movido para a Lixeira do Nerdora." } else "Não foi possível mover para a Lixeira."'
assert old_trash_success in text, "sucesso de mover para lixeira não encontrado"
text = text.replace(old_trash_success, new_trash_success, 1)

old_restore_success = 'return if (success && destination.exists()) { UniversalFilesStore.forgetTrash(context, source.absolutePath); "Arquivo restaurado em ${destination.parentFile?.name ?: "armazenamento"}." } else "Não foi possível restaurar o arquivo."'
new_restore_success = 'return if (success && destination.exists()) { UniversalFilesStore.forgetTrash(context, source.absolutePath); UniversalFileIndexCache.addFromFile(context, destination); RealFileOperations.scanChangedPaths(context, listOf(destination.absolutePath)); "Arquivo restaurado em ${destination.parentFile?.name ?: "armazenamento"}." } else "Não foi possível restaurar o arquivo."'
assert old_restore_success in text, "sucesso de restaurar lixeira não encontrado"
text = text.replace(old_restore_success, new_restore_success, 1)
path.write_text(text, encoding="utf-8")


# 3) Ajustes: "Removidos da Biblioteca" vira apenas área de legado.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
text = path.read_text(encoding="utf-8")
old_removed = '            ActionSetting(Icons.Rounded.DeleteSweep, "Itens removidos da Biblioteca", "$trashCount item(ns). O arquivo físico continua no celular.", onOpenTrash)'
new_removed = '''            if (trashCount > 0) {
                ActionSetting(
                    Icons.Rounded.DeleteSweep,
                    "Removidos antigos",
                    "$trashCount item(ns) do sistema antigo. Restaure ou limpe quando quiser.",
                    onOpenTrash
                )
            }'''
assert old_removed in text, "ação de removidos antigos não encontrada"
text = text.replace(old_removed, new_removed, 1)

text = text.replace(
    '            Text("Ocultar agora move o arquivo para o Cofre privado. Remover da Biblioteca continua sendo apenas uma remoção visual; Excluir definitivamente apaga o arquivo físico.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)',
    '            Text("Cofre move o arquivo para a área privada; Lixeira permite recuperar; Excluir definitivamente apaga o arquivo físico. “Removidos antigos” só aparece se houver dados do sistema anterior.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)',
    1
)
text = text.replace(
    'title = { Text("Nerdora Player 0.9.19 — Reorganização Funcional") }',
    'title = { Text("Nerdora Player 0.9.21 — Coerência Funcional") }',
    1
)
path.write_text(text, encoding="utf-8")
