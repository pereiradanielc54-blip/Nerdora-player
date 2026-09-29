from pathlib import Path

# Reorganiza a página inicial de Arquivos em blocos claros:
# armazenamento -> acesso rápido -> categorias -> documentos -> locais/ferramentas.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/FilesScreen.kt")
text = path.read_text(encoding="utf-8")

old = '''                StorageSummary(storage, allFiles.size, scanLimited) { folder = root }
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp)
                ) {
                    items(UniversalCategory.entries, key = { it.name }) { item ->
                        val count = categoryCount(item, allFiles, trashFiles, favorites, recents, duplicatePaths)
                        CategoryPill(category == item, item.label, count) { categoryName = item.name; query = "" }
                    }
                }
'''
new = '''                StorageSummary(storage, allFiles.size, scanLimited) { folder = root }

                Text(
                    "Acesso rápido",
                    modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 10.dp, bottom = 2.dp),
                    fontWeight = FontWeight.Bold
                )
                QuickFoldersRow(root, ::enterFolder)

                Text(
                    "Categorias",
                    modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 10.dp, bottom = 2.dp),
                    fontWeight = FontWeight.Bold
                )
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp)
                ) {
                    items(
                        listOf(
                            UniversalCategory.ALL,
                            UniversalCategory.DOCUMENTS,
                            UniversalCategory.IMAGE,
                            UniversalCategory.VIDEO,
                            UniversalCategory.AUDIO,
                            UniversalCategory.ZIP,
                            UniversalCategory.APK,
                            UniversalCategory.OTHER
                        ),
                        key = { it.name }
                    ) { item ->
                        val count = categoryCount(item, allFiles, trashFiles, favorites, recents, duplicatePaths)
                        CategoryPill(category == item, item.label, count) { categoryName = item.name; query = "" }
                    }
                }

                Text(
                    "Documentos",
                    modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 8.dp, bottom = 2.dp),
                    fontWeight = FontWeight.Bold
                )
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp)
                ) {
                    items(
                        listOf(
                            UniversalCategory.PDF,
                            UniversalCategory.WORD,
                            UniversalCategory.EXCEL,
                            UniversalCategory.POWERPOINT,
                            UniversalCategory.TEXT
                        ),
                        key = { it.name }
                    ) { item ->
                        val count = categoryCount(item, allFiles, trashFiles, favorites, recents, duplicatePaths)
                        CategoryPill(category == item, item.label, count) { categoryName = item.name; query = "" }
                    }
                }

                Text(
                    "Locais e organização",
                    modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 8.dp, bottom = 2.dp),
                    fontWeight = FontWeight.Bold
                )
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp)
                ) {
                    items(
                        listOf(
                            UniversalCategory.FAVORITES,
                            UniversalCategory.RECENT,
                            UniversalCategory.LARGE,
                            UniversalCategory.DUPLICATES,
                            UniversalCategory.TRASH
                        ),
                        key = { it.name }
                    ) { item ->
                        val count = categoryCount(item, allFiles, trashFiles, favorites, recents, duplicatePaths)
                        CategoryPill(category == item, item.label, count) { categoryName = item.name; query = "" }
                    }
                }
'''
assert old in text, "bloco de categorias de Arquivos não encontrado"
text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")

# Ajustes: identifica a reorganização sem alterar as configurações existentes.
path = Path("extracted_project/app/src/main/java/com/nerdora/player/ui/SettingsScreen.kt")
text = path.read_text(encoding="utf-8")
text = text.replace(
    'title = { Text("Nerdora Player 0.9.21 — Coerência Funcional") }',
    'title = { Text("Nerdora Player 0.9.22 — Organização Base") }',
    1
)
path.write_text(text, encoding="utf-8")
