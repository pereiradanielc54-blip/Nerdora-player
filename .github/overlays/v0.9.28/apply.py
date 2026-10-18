from pathlib import Path

root = Path("extracted_project/app/src/main")
ui = root / "java/com/nerdora/player/ui"
app = ui / "NerdoraPlayerApp.kt"
text = app.read_text(encoding="utf-8")

old_enum = """    HOME, LIBRARY, CENTRAL, FILES, SEARCH, PLAYLISTS, SETTINGS,
    ACCOUNT, HIDDEN, REMOVED, DIAGNOSTICS
"""
new_enum = """    HOME, LIBRARY, CENTRAL, FILES, SEARCH, PLAYLISTS, SETTINGS, YOUTUBE,
    ACCOUNT, HIDDEN, REMOVED, DIAGNOSTICS
"""
assert old_enum in text, "enum AppScreen não encontrado"
text = text.replace(old_enum, new_enum, 1)

old_central = """                    onOpenVault = ::openPrivate,
                    onOpenLink = { showOpenUrl = true }
                )
"""
new_central = """                    onOpenVault = ::openPrivate,
                    onOpenLink = { showOpenUrl = true },
                    onOpenYouTube = { navigateTo(AppScreen.YOUTUBE) }
                )
"""
assert old_central in text, "chamada da Central Nerdora não encontrada"
text = text.replace(old_central, new_central, 1)

old_hidden = """        AppScreen.SEARCH
    )
"""
new_hidden = """        AppScreen.SEARCH,
        AppScreen.YOUTUBE
    )
"""
assert old_hidden in text, "lista de telas sem barra inferior não encontrada"
text = text.replace(old_hidden, new_hidden, 1)

needle = """                AppScreen.CENTRAL -> NerdoraCentralScreen(
                    onOpenFileCategory = { openFiles(category = it) },
                    onOpenDownloads = { openFiles(folderPath = "DOWNLOAD") },
                    onOpenVault = ::openPrivate,
                    onOpenLink = { showOpenUrl = true },
                    onOpenYouTube = { navigateTo(AppScreen.YOUTUBE) }
                )

"""
assert needle in text, "Central já atualizada não encontrada"
text = text.replace(needle, needle + """                AppScreen.YOUTUBE -> YouTubeScreen(onBack = ::navigateBack)

""", 1)

app.write_text(text, encoding="utf-8")

central = ui / "NerdoraCentralScreen.kt"
text = central.read_text(encoding="utf-8")
text = text.replace(
"""    onOpenVault: () -> Unit,
    onOpenLink: () -> Unit
) {""",
"""    onOpenVault: () -> Unit,
    onOpenLink: () -> Unit,
    onOpenYouTube: () -> Unit
) {""", 1
)
old = """                ToolGridRow(
                    ToolItem("Abrir link", "↗", onOpenLink),
                    ToolItem("Recentes de arquivos", "↺") { onOpenFileCategory("RECENT") }
                )
"""
new = """                ToolGridRow(
                    ToolItem("YouTube", "▶", onOpenYouTube),
                    ToolItem("Abrir link", "↗", onOpenLink)
                )
                Spacer(Modifier.height(8.dp))
                ToolGridRow(
                    ToolItem("Recentes de arquivos", "↺") { onOpenFileCategory("RECENT") },
                    ToolItem("Todos os arquivos", "▣") { onOpenFileCategory("ALL") }
                )
"""
assert old in text, "grid de Utilidades não encontrado"
text = text.replace(old, new, 1)
central.write_text(text, encoding="utf-8")

manifest = root / "AndroidManifest.xml"
m = manifest.read_text(encoding="utf-8")
if 'android.permission.INTERNET' not in m:
    m = m.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">', '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />', 1)
manifest.write_text(m, encoding="utf-8")

settings = ui / "SettingsScreen.kt"
st = settings.read_text(encoding="utf-8")
st = st.replace(
    'title = { Text("Nerdora Player 0.9.26 — File Explorer Pro") }',
    'title = { Text("Nerdora Player 0.9.28 — YouTube integrado") }',
    1
)
st = st.replace(
    'title = { Text("Nerdora Player 0.9.27 — System Storage Authority") }',
    'title = { Text("Nerdora Player 0.9.28 — YouTube integrado") }',
    1
)
settings.write_text(st, encoding="utf-8")
