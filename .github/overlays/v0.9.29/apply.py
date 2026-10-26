from pathlib import Path

root = Path("extracted_project/app/src/main")
ui = root / "java/com/nerdora/player/ui"
app = ui / "NerdoraPlayerApp.kt"
text = app.read_text(encoding="utf-8")

old_enum = """    HOME, LIBRARY, CENTRAL, FILES, SEARCH, PLAYLISTS, SETTINGS, YOUTUBE,
    ACCOUNT, HIDDEN, REMOVED, DIAGNOSTICS
"""
new_enum = """    HOME, LIBRARY, CENTRAL, FILES, SEARCH, PLAYLISTS, SETTINGS, YOUTUBE, DOWNLOADS_MANAGER,
    ACCOUNT, HIDDEN, REMOVED, DIAGNOSTICS
"""
assert old_enum in text or "DOWNLOADS_MANAGER" in text, "enum AppScreen não encontrado"
if "DOWNLOADS_MANAGER" not in text:
    text = text.replace(old_enum, new_enum, 1)

old_call = """                    onOpenYouTube = { navigateTo(AppScreen.YOUTUBE) }
                )
"""
new_call = """                    onOpenYouTube = { navigateTo(AppScreen.YOUTUBE) },
                    onOpenDownloadsManager = { navigateTo(AppScreen.DOWNLOADS_MANAGER) }
                )
"""
assert old_call in text or "onOpenDownloadsManager" in text, "chamada da Central Nerdora não encontrada"
if "onOpenDownloadsManager" not in text:
    text = text.replace(old_call, new_call, 1)

old_hidden = """        AppScreen.YOUTUBE
    )
"""
new_hidden = """        AppScreen.YOUTUBE,
        AppScreen.DOWNLOADS_MANAGER
    )
"""
if "        AppScreen.DOWNLOADS_MANAGER\n" not in text:
    assert old_hidden in text, "lista de telas sem barra inferior não encontrada"
    text = text.replace(old_hidden, new_hidden, 1)

screen_anchor = "                AppScreen.YOUTUBE -> YouTubeScreen(onBack = ::navigateBack)\n"
assert screen_anchor in text or "AppScreen.DOWNLOADS_MANAGER -> DownloadsManagerScreen" in text, "ponto de navegação do YouTube não encontrado"
if "AppScreen.DOWNLOADS_MANAGER -> DownloadsManagerScreen" not in text:
    text = text.replace(screen_anchor, screen_anchor + "                AppScreen.DOWNLOADS_MANAGER -> DownloadsManagerScreen(onBack = ::navigateBack)\n", 1)
app.write_text(text, encoding="utf-8")

central = ui / "NerdoraCentralScreen.kt"
text = central.read_text(encoding="utf-8")
text = text.replace(
    "    onOpenYouTube: () -> Unit\n) {",
    "    onOpenYouTube: () -> Unit,\n    onOpenDownloadsManager: () -> Unit\n) {",
    1
)
assert "onOpenDownloadsManager: () -> Unit" in text, "parâmetros da Central não atualizados"
old = """                ToolGridRow(
                    ToolItem("YouTube", "▶", onOpenYouTube),
                    ToolItem("Abrir link", "↗", onOpenLink)
                )
"""
new = """                ToolGridRow(
                    ToolItem("YouTube", "▶", onOpenYouTube),
                    ToolItem("Downloads", "↓", onOpenDownloadsManager)
                )
                Spacer(Modifier.height(8.dp))
                ToolGridRow(
                    ToolItem("Abrir link", "↗", onOpenLink),
                    ToolItem("Recentes de arquivos", "↺") { onOpenFileCategory("RECENT") }
                )
"""
assert old in text or "ToolItem(\"Downloads\", \"↓\", onOpenDownloadsManager)" in text, "grade de utilidades não encontrada"
if "ToolItem(\"Downloads\", \"↓\", onOpenDownloadsManager)" not in text:
    text = text.replace(old, new, 1)
central.write_text(text, encoding="utf-8")

manifest = root / "AndroidManifest.xml"
m = manifest.read_text(encoding="utf-8")
if "android.permission.INTERNET" not in m:
    m = m.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">', '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />', 1)
manifest.write_text(m, encoding="utf-8")
