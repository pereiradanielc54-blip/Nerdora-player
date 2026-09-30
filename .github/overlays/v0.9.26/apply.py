from pathlib import Path
import re

path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

# --- estados: abas persistentes ---
state_anchor = '    var navigationSettings by remember { mutableStateOf(FileNavigationPrefs.read(context)) }\n'
assert state_anchor in text, "navigationSettings v0.9.25 não encontrado"
if "folderTabs by remember" not in text:
    text = text.replace(
        state_anchor,
        state_anchor +
        '    var folderTabs by remember { mutableStateOf<List<String>>(emptyList()) }\n'
        '    var activeFolderTab by remember { mutableIntStateOf(0) }\n',
        1
    )

# --- histórico de pesquisa com debounce ---
watcher_anchor = '    val rawSelectionCandidates = if (folder == null) shownItems.map { it.file } else folderChildren\n'
assert watcher_anchor in text, "rawSelectionCandidates v0.9.25 não encontrado"
search_effect = '''    LaunchedEffect(query) {
        val term = query.trim()
        if (term.length >= 2) {
            delay(900L)
            FileNavigationPrefs.rememberSearch(context, term)
        }
    }

'''
if "FileNavigationPrefs.rememberSearch(context, term)" not in text:
    text = text.replace(watcher_anchor, search_effect + watcher_anchor, 1)

# --- abas + breadcrumb + toolbar ---
old_nav_start = '''            if (folder != null) {
                LaunchedEffect(folder?.absolutePath) {
                    folder?.let { FileNavigationPrefs.rememberFolder(context, it) }
                }
                FileBreadcrumbBar(root = root, folder = folder) { target ->
                    folder = target
                    query = ""
                }
                FileNavigationToolbar(
'''
assert old_nav_start in text, "bloco Navigation Pro v0.9.25 não encontrado"
new_nav_start = '''            if (folder != null) {
                LaunchedEffect(folder?.absolutePath) {
                    folder?.let { current ->
                        FileNavigationPrefs.rememberFolder(context, current)
                        val currentPath = current.absolutePath
                        if (folderTabs.isEmpty()) {
                            val restored = FileNavigationPrefs.savedTabs(context)
                                .map(::File)
                                .filter { it.exists() && it.isDirectory }
                                .map { it.absolutePath }
                                .take(6)
                            folderTabs = if (restored.isNotEmpty()) restored else listOf(currentPath)
                            activeFolderTab = folderTabs.indexOf(currentPath).takeIf { it >= 0 } ?: 0
                        } else {
                            val safeIndex = activeFolderTab.coerceIn(0, folderTabs.lastIndex)
                            val next = folderTabs.toMutableList()
                            next[safeIndex] = currentPath
                            folderTabs = next.distinct().take(6)
                            activeFolderTab = folderTabs.indexOf(currentPath).takeIf { it >= 0 } ?: 0
                        }
                        FileNavigationPrefs.saveTabs(context, folderTabs)
                    }
                }

                if (folderTabs.isNotEmpty()) {
                    FileTabsBar(
                        tabs = folderTabs,
                        activeIndex = activeFolderTab.coerceIn(0, folderTabs.lastIndex),
                        onSwitch = { index, target ->
                            activeFolderTab = index
                            folder = target
                            query = ""
                        },
                        onAdd = {
                            val next = (folderTabs + root.absolutePath).takeLast(6)
                            folderTabs = next
                            activeFolderTab = next.lastIndex
                            folder = root
                            query = ""
                            FileNavigationPrefs.saveTabs(context, next)
                        },
                        onClose = { index ->
                            val next = folderTabs.toMutableList().apply {
                                if (index in indices) removeAt(index)
                            }
                            folderTabs = next
                            if (next.isEmpty()) {
                                activeFolderTab = 0
                                folder = null
                            } else {
                                activeFolderTab = activeFolderTab.coerceAtMost(next.lastIndex)
                                folder = File(next[activeFolderTab])
                            }
                            FileNavigationPrefs.saveTabs(context, next)
                        }
                    )
                }

                FileBreadcrumbBar(root = root, folder = folder) { target ->
                    folder = target
                    query = ""
                }
                FileNavigationToolbar(
'''
text = text.replace(old_nav_start, new_nav_start, 1)

# Histórico aparece quando a caixa de pesquisa está vazia.
selection_marker = '            if (selectedPaths.isNotEmpty()) {\n'
assert selection_marker in text, "barra de seleção não encontrada"
history_ui = '''            if (query.isBlank()) {
                SearchHistoryRow(context = context, onSelect = { term -> query = term })
            }

'''
if "SearchHistoryRow(context = context" not in text:
    text = text.replace(selection_marker, history_ui + selection_marker, 1)

# --- Mostrar na pasta em resultados/categorias ---
device_call_anchor = '''                                selected = selectedPaths.contains(item.file.absolutePath),
                                onSelect = { toggleSelection(item.file) },
'''
assert device_call_anchor in text, "DeviceFileRow v0.9.23 não encontrado"
device_call_new = '''                                selected = selectedPaths.contains(item.file.absolutePath),
                                iconSize = navigationSettings.iconSize,
                                onSelect = { toggleSelection(item.file) },
                                onShowInFolder = {
                                    item.file.parentFile?.takeIf { it.exists() && it.isDirectory }?.let { parent ->
                                        folder = parent
                                        query = ""
                                    }
                                },
'''
text = text.replace(device_call_anchor, device_call_new, 1)

raw_call_anchor = '''                                selected = selectedPaths.contains(item.absolutePath),
                                onSelect = { toggleSelection(item) },
'''
assert raw_call_anchor in text, "RawFolderRow v0.9.23 não encontrado"
text = text.replace(
    raw_call_anchor,
    '''                                selected = selectedPaths.contains(item.absolutePath),
                                iconSize = navigationSettings.iconSize,
                                onSelect = { toggleSelection(item) },
''',
    1
)

# Assinatura DeviceFileRow.
old_device_sig = '''private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, selected: Boolean, onSelect: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit,
'''
new_device_sig = '''private fun DeviceFileRow(
    file: File, mime: String, favorite: Boolean, isTrash: Boolean, selected: Boolean, iconSize: NerdoraIconSize,
    onSelect: () -> Unit, onShowInFolder: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit,
'''
assert old_device_sig in text, "assinatura DeviceFileRow atual não encontrada"
text = text.replace(old_device_sig, new_device_sig, 1)

old_raw_sig = '''private fun RawFolderRow(
    file: File, favorite: Boolean, selected: Boolean, onSelect: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
'''
new_raw_sig = '''private fun RawFolderRow(
    file: File, favorite: Boolean, selected: Boolean, iconSize: NerdoraIconSize, onSelect: () -> Unit,
    onClick: () -> Unit, onFavorite: () -> Unit, onRename: () -> Unit,
'''
assert old_raw_sig in text, "assinatura RawFolderRow atual não encontrada"
text = text.replace(old_raw_sig, new_raw_sig, 1)

# Insere Mostrar na pasta no DeviceFileRow, antes do menu.
def function_span(source, signature):
    start = source.index(signature)
    brace = source.index("{", start)
    depth = 0
    in_string = False
    escape = False
    for i in range(brace, len(source)):
        ch = source[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
    raise AssertionError("fim da função não encontrado")

d_start, d_end = function_span(text, "private fun DeviceFileRow(")
device_fn = text[d_start:d_end]
if 'Text("Pasta"' not in device_fn:
    menu_anchor = '''            Box {
'''
    assert menu_anchor in device_fn, "Box do menu DeviceFileRow não encontrado"
    device_fn = device_fn.replace(
        menu_anchor,
        '''            TextButton(
                onClick = onShowInFolder,
                modifier = Modifier.height(36.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 6.dp)
            ) { Text("Pasta", fontSize = 10.sp) }
            Box {
''',
        1
    )

# Ajusta o primeiro ícone visual >= 40dp ao tamanho configurável.
def replace_large_size(fn):
    pattern = re.compile(r'Modifier\.size\((\d+)\.dp\)')
    changed = False
    def repl(m):
        nonlocal changed
        if not changed and int(m.group(1)) >= 40:
            changed = True
            return 'Modifier.size(navigationIconDp(iconSize))'
        return m.group(0)
    return pattern.sub(repl, fn)

device_fn = replace_large_size(device_fn)
text = text[:d_start] + device_fn + text[d_end:]

r_start, r_end = function_span(text, "private fun RawFolderRow(")
raw_fn = text[r_start:r_end]
raw_fn = replace_large_size(raw_fn)
text = text[:r_start] + raw_fn + text[r_end:]

# --- renderer Grade real nas pastas ---
def lambda_block(source, token):
    start = source.index(token)
    brace = source.index("{", start + token.rindex("{"))
    depth = 0
    in_string = False
    escape = False
    for i in range(brace, len(source)):
        ch = source[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
    raise AssertionError("fim do lambda não encontrado: " + token)

folder_token = 'items(selectionCandidates, key = { it.absolutePath }) { item ->'
if folder_token in text and "navigationGridColumns(navigationSettings.iconSize)" not in text:
    start, end = lambda_block(text, folder_token)
    line_start = text.rfind("\n", 0, start) + 1
    indent = text[line_start:start]
    original = text[start:end]
    indented_original = "\n".join("    " + line if line.strip() else line for line in original.splitlines())
    grid = f'''if (navigationSettings.viewMode == NerdoraFileViewMode.LIST) {{
{indented_original}
{indent}}} else {{
{indent}    val gridColumns = navigationGridColumns(navigationSettings.iconSize)
{indent}    items(
{indent}        selectionCandidates.chunked(gridColumns),
{indent}        key = {{ row -> row.joinToString("|") {{ it.absolutePath }} }}
{indent}    ) {{ rowItems ->
{indent}        Row(Modifier.fillMaxWidth()) {{
{indent}            rowItems.forEach {{ item ->
{indent}                Box(Modifier.weight(1f)) {{
{indent}                    FileGridCell(
{indent}                        file = item,
{indent}                        selected = selectedPaths.contains(item.absolutePath),
{indent}                        iconSize = navigationSettings.iconSize,
{indent}                        onSelect = {{ toggleSelection(item) }},
{indent}                        onClick = {{
{indent}                            if (selectedPaths.isNotEmpty()) toggleSelection(item)
{indent}                            else if (item.isDirectory) enterFolder(item)
{indent}                            else openFile(item)
{indent}                        }}
{indent}                    )
{indent}                }}
{indent}            }}
{indent}            repeat((gridColumns - rowItems.size).coerceAtLeast(0)) {{
{indent}                Spacer(Modifier.weight(1f))
{indent}            }}
{indent}        }}
{indent}    }}
{indent}}}'''
    text = text[:start] + grid + text[end:]

# Grade real também na tela de categorias/resultados globais.
device_token = 'items(shownItems, key = { it.file.absolutePath }) { item ->'
if device_token in text and "shownItems.chunked(gridColumns)" not in text:
    start, end = lambda_block(text, device_token)
    line_start = text.rfind("\n", 0, start) + 1
    indent = text[line_start:start]
    original = text[start:end]
    indented_original = "\n".join("    " + line if line.strip() else line for line in original.splitlines())
    grid = f'''if (navigationSettings.viewMode == NerdoraFileViewMode.LIST) {{
{indented_original}
{indent}}} else {{
{indent}    val gridColumns = navigationGridColumns(navigationSettings.iconSize)
{indent}    items(
{indent}        shownItems.chunked(gridColumns),
{indent}        key = {{ row -> row.joinToString("|") {{ it.file.absolutePath }} }}
{indent}    ) {{ rowItems ->
{indent}        Row(Modifier.fillMaxWidth()) {{
{indent}            rowItems.forEach {{ entry ->
{indent}                val file = entry.file
{indent}                Box(Modifier.weight(1f)) {{
{indent}                    FileGridCell(
{indent}                        file = file,
{indent}                        selected = selectedPaths.contains(file.absolutePath),
{indent}                        iconSize = navigationSettings.iconSize,
{indent}                        onSelect = {{ toggleSelection(file) }},
{indent}                        onClick = {{
{indent}                            if (selectedPaths.isNotEmpty()) toggleSelection(file)
{indent}                            else if (file.isDirectory) enterFolder(file)
{indent}                            else openFile(file)
{indent}                        }}
{indent}                    )
{indent}                }}
{indent}            }}
{indent}            repeat((gridColumns - rowItems.size).coerceAtLeast(0)) {{
{indent}                Spacer(Modifier.weight(1f))
{indent}            }}
{indent}        }}
{indent}    }}
{indent}}}'''
    text = text[:start] + grid + text[end:]

path.write_text(text, encoding="utf-8")

settings = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
st = settings.read_text(encoding="utf-8")
st = st.replace(
    'title = { Text("Nerdora Player 0.9.25 — Storage & Navigation Pro") }',
    'title = { Text("Nerdora Player 0.9.26 — File Explorer Pro") }',
    1
)
settings.write_text(st, encoding="utf-8")
