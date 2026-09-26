package com.nerdora.player.ui

import android.webkit.MimeTypeMap
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.FileProvider
import com.nerdora.player.BuildConfig
import com.nerdora.player.LibraryStore
import com.nerdora.player.MainActivity
import com.nerdora.player.MediaPermissions
import com.nerdora.player.NerdoraAccountStore
import com.nerdora.player.PlayerPreferences
import com.nerdora.player.PrivateVaultStore
import com.nerdora.player.RealFileOperations
import com.nerdora.player.UniversalFilesStore
import com.nerdora.player.UpdateChecker
import com.nerdora.player.UpdateResult
import com.nerdora.player.data.LocalMediaRepository
import com.nerdora.player.data.MediaIndexCache
import com.nerdora.player.data.SampleMedia
import com.nerdora.player.model.DocumentRef
import com.nerdora.player.model.MediaKind
import com.nerdora.player.model.NerdoraMedia
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

private enum class AppScreen {
    HOME, LIBRARY, CENTRAL, FILES, SEARCH, PLAYLISTS, SETTINGS,
    ACCOUNT, HIDDEN, REMOVED, DIAGNOSTICS
}

@Composable
fun NerdoraPlayerApp(
    activity: MainActivity,
    externalMedia: NerdoraMedia?,
    onEnterPictureInPicture: () -> Unit,
    onThemeChanged: () -> Unit
) {
    var screenName by rememberSaveable { mutableStateOf(AppScreen.HOME.name) }
    var screenHistory by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    var accountEpoch by remember { mutableIntStateOf(0) }
    var localMedia by remember { mutableStateOf<List<NerdoraMedia>>(emptyList()) }
    var permissionEpoch by remember { mutableIntStateOf(0) }
    var storeEpoch by remember { mutableIntStateOf(0) }
    var hasMediaAccess by remember { mutableStateOf(MediaPermissions.hasAnyAccess(activity)) }
    var viewerItems by remember { mutableStateOf<List<NerdoraMedia>>(emptyList()) }
    var viewerIndex by rememberSaveable { mutableStateOf<Int?>(if (externalMedia != null) 0 else null) }
    var showOpenUrl by remember { mutableStateOf(false) }
    var openDocument by remember { mutableStateOf<DocumentRef?>(null) }
    var showWhatsNew by remember { mutableStateOf(false) }
    var availableUpdate by remember { mutableStateOf<UpdateResult?>(null) }
    var onboarding by remember { mutableStateOf(!PlayerPreferences.onboardingDone(activity) && externalMedia == null) }

    var libraryMode by rememberSaveable { mutableStateOf("ALL") }
    var fileCategory by rememberSaveable { mutableStateOf("ALL") }
    var fileFolder by rememberSaveable { mutableStateOf<String?>(null) }
    var fileQuery by rememberSaveable { mutableStateOf("") }
    var fileOpenEpoch by rememberSaveable { mutableIntStateOf(0) }
    val appScope = rememberCoroutineScope()

    fun navigateTo(target: AppScreen) {
        val current = runCatching { AppScreen.valueOf(screenName) }.getOrDefault(AppScreen.HOME)
        if (target == current) return
        if (target == AppScreen.HOME) {
            screenHistory = emptyList()
        } else {
            screenHistory = (screenHistory + current.name).takeLast(30)
        }
        screenName = target.name
    }

    fun navigateBack() {
        val current = runCatching { AppScreen.valueOf(screenName) }.getOrDefault(AppScreen.HOME)
        if (current == AppScreen.HOME) {
            activity.finish()
            return
        }
        if (screenHistory.isNotEmpty()) {
            screenName = screenHistory.last()
            screenHistory = screenHistory.dropLast(1)
        } else {
            screenName = AppScreen.HOME.name
        }
    }

    fun openLibrary(mode: String = "ALL") {
        libraryMode = mode
        navigateTo(AppScreen.LIBRARY)
    }

    fun openFiles(
        category: String = "ALL",
        folderPath: String? = null,
        query: String = ""
    ) {
        fileCategory = category
        fileFolder = folderPath
        fileQuery = query
        fileOpenEpoch++
        navigateTo(AppScreen.FILES)
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        hasMediaAccess = MediaPermissions.hasAnyAccess(activity)
        permissionEpoch++
    }

    LaunchedEffect(Unit) {
        withContext(Dispatchers.IO) {
            // Migra favoritos/recentes antigos do gerenciador para a fonte única.
            UniversalFilesStore.favorites(activity)
            UniversalFilesStore.recentPaths(activity)
        }
        storeEpoch++
    }

    LaunchedEffect(permissionEpoch, hasMediaAccess) {
        if (!hasMediaAccess) {
            localMedia = emptyList()
            return@LaunchedEffect
        }
        val cached = withContext(Dispatchers.IO) { MediaIndexCache.read(activity) }.filter { item ->
            when (item.kind) {
                MediaKind.IMAGE -> MediaPermissions.hasPhotoAccess(activity)
                MediaKind.VIDEO -> MediaPermissions.hasVideoAccess(activity)
                MediaKind.AUDIO -> MediaPermissions.hasAudioAccess(activity)
            }
        }
        localMedia = cached
        val needsInitialScan = !PlayerPreferences.mediaIndexInitialized(activity)
        if (needsInitialScan || permissionEpoch > 0) {
            val fresh = withContext(Dispatchers.IO) { LocalMediaRepository.loadAll(activity) }
            localMedia = fresh
            withContext(Dispatchers.IO) { MediaIndexCache.replace(activity, fresh) }
            PlayerPreferences.setLastMediaScan(activity)
            PlayerPreferences.setMediaIndexInitialized(activity)
        }
    }

    LaunchedEffect(externalMedia?.id) {
        if (externalMedia != null) {
            viewerItems = listOf(externalMedia)
            viewerIndex = 0
        }
    }

    if (onboarding) {
        OnboardingScreen(onFinish = {
            PlayerPreferences.setOnboardingDone(activity)
            onboarding = false
        })
        return
    }

    LaunchedEffect(onboarding) {
        if (!onboarding) {
            showWhatsNew = PlayerPreferences.shouldShowWhatsNew(activity, BuildConfig.VERSION_NAME)
            val shouldCheck = PlayerPreferences.autoUpdateCheck(activity) &&
                BuildConfig.GITHUB_REPOSITORY.isNotBlank() &&
                System.currentTimeMillis() - PlayerPreferences.lastUpdateCheck(activity) > 24 * 60 * 60_000L
            if (shouldCheck) {
                val result = UpdateChecker.check(BuildConfig.GITHUB_REPOSITORY, BuildConfig.VERSION_NAME)
                PlayerPreferences.setLastUpdateCheck(activity)
                if (result.hasUpdate) availableUpdate = result
            }
        }
    }

    val hiddenIds = remember(localMedia, storeEpoch) { LibraryStore.hiddenIds(activity) }
    val trashIds = remember(localMedia, storeEpoch) { LibraryStore.trashIds(activity) }
    val vaultEntries = remember(storeEpoch) { PrivateVaultStore.entries(activity) }
    val favoriteIds = remember(localMedia, storeEpoch) { LibraryStore.favoriteIds(activity) }
    val recentIds = remember(localMedia, storeEpoch) { LibraryStore.recentIds(activity) }
    val playlists = remember(localMedia, storeEpoch) { LibraryStore.playlists(activity) }
    val visibleMedia = remember(localMedia, hiddenIds, trashIds) {
        localMedia.filterNot { hiddenIds.contains(it.id) || trashIds.contains(it.id) }
    }
    val hiddenMedia = remember(localMedia, hiddenIds, trashIds) {
        localMedia.filter { hiddenIds.contains(it.id) && !trashIds.contains(it.id) }
    }
    val removedMedia = remember(localMedia, trashIds) {
        localMedia.filter { trashIds.contains(it.id) }
    }

    BackHandler(enabled = !onboarding) {
        when {
            openDocument != null -> openDocument = null
            viewerIndex != null -> viewerIndex = null
            else -> navigateBack()
        }
    }

    openDocument?.let { document ->
        DocumentViewerScreen(context = activity, document = document, onClose = { openDocument = null })
        return
    }

    val selected = viewerIndex
    if (selected != null) {
        val items = viewerItems.ifEmpty { externalMedia?.let { listOf(it) } ?: SampleMedia.items }
        MediaViewerScreen(
            activity = activity,
            items = items,
            initialIndex = selected.coerceIn(items.indices),
            autoplay = PlayerPreferences.autoplay(activity),
            onClose = { viewerIndex = null },
            onEnterPictureInPicture = onEnterPictureInPicture,
            onStoreChanged = { storeEpoch++ },
            onFileSystemChanged = {
                storeEpoch++
                permissionEpoch++
            }
        )
        return
    }

    val screen = runCatching { AppScreen.valueOf(screenName) }.getOrDefault(AppScreen.HOME)

    fun openItems(items: List<NerdoraMedia>, index: Int) {
        if (items.isEmpty()) return
        viewerItems = items
        viewerIndex = index.coerceIn(items.indices)
    }

    fun openPrivate() {
        activity.authenticatePrivateMedia { success ->
            if (success) navigateTo(AppScreen.HIDDEN)
        }
    }

    fun openPhysicalFile(path: String) {
        val file = File(path)
        if (!file.exists()) {
            Toast.makeText(activity, "O arquivo não existe mais.", Toast.LENGTH_SHORT).show()
            return
        }
        if (file.isDirectory) {
            openFiles(folderPath = file.absolutePath)
            return
        }
        val ext = file.extension.lowercase()
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: when (ext) {
            "pdf" -> "application/pdf"
            "doc", "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "xls", "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "ppt", "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            "txt", "md", "csv", "json", "xml" -> "text/plain"
            else -> "application/octet-stream"
        }
        val uri = runCatching {
            FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
        }.getOrElse {
            Toast.makeText(activity, "Não foi possível abrir este arquivo.", Toast.LENGTH_SHORT).show()
            return
        }
        when {
            mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/") -> {
                val kind = when {
                    mime.startsWith("image/") -> MediaKind.IMAGE
                    mime.startsWith("audio/") -> MediaKind.AUDIO
                    else -> MediaKind.VIDEO
                }
                openItems(
                    listOf(
                        NerdoraMedia(
                            id = "search-${file.absolutePath.hashCode()}",
                            kind = kind,
                            url = uri.toString(),
                            thumbnailUrl = if (kind == MediaKind.IMAGE) uri.toString() else null,
                            title = file.name,
                            description = file.absolutePath,
                            folder = file.parentFile?.name.orEmpty(),
                            mimeType = mime,
                            sizeBytes = file.length(),
                            dateModifiedSeconds = file.lastModified() / 1000L
                        )
                    ),
                    0
                )
            }
            else -> {
                openDocument = DocumentRef(
                    uri = uri,
                    name = file.name,
                    mimeType = mime,
                    sizeBytes = file.length(),
                    lastModified = file.lastModified()
                )
            }
        }
    }

    val miniPlayerItems = remember(visibleMedia, viewerItems, externalMedia) {
        (viewerItems + visibleMedia + SampleMedia.items + listOfNotNull(externalMedia))
            .filter { it.kind == MediaKind.AUDIO && !it.id.startsWith("vault-") }
            .distinctBy { it.id }
    }

    val currentAccount = remember(accountEpoch) { NerdoraAccountStore.currentAccount(activity) }

    val showBottomBar = screen !in setOf(
        AppScreen.ACCOUNT,
        AppScreen.HIDDEN,
        AppScreen.REMOVED,
        AppScreen.DIAGNOSTICS,
        AppScreen.SEARCH
    )

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                Column {
                    NerdoraMiniAudioPlayer(
                        onExpand = { playingId ->
                            val index = miniPlayerItems.indexOfFirst { it.id == playingId }
                            if (index >= 0) openItems(miniPlayerItems, index)
                        }
                    )
                    NerdoraOfficialBottomBar(
                        selectedRoute = screen.name,
                        onRoute = { route ->
                            val target = runCatching { AppScreen.valueOf(route) }.getOrDefault(AppScreen.HOME)
                            when (target) {
                                AppScreen.LIBRARY -> openLibrary("ALL")
                                AppScreen.FILES -> openFiles("ALL")
                                else -> navigateTo(target)
                            }
                        }
                    )
                }
            }
        }
    ) { padding ->
        androidx.compose.foundation.layout.Box(Modifier.padding(padding)) {
            when (screen) {
                AppScreen.HOME -> HomeScreen(
                    items = visibleMedia,
                    hasMediaAccess = hasMediaAccess,
                    recentIds = recentIds,
                    hiddenCount = vaultEntries.size + hiddenMedia.size,
                    positionFor = { PlayerPreferences.loadPosition(activity, it.url) },
                    onRequestPermissions = { permissionLauncher.launch(MediaPermissions.permissionsToRequest()) },
                    onOpenItems = ::openItems,
                    onOpenSearch = { navigateTo(AppScreen.SEARCH) },
                    onOpenLibraryMode = ::openLibrary,
                    onOpenFileCategory = { openFiles(category = it) },
                    onOpenFileFolder = { openFiles(folderPath = it) },
                    onOpenPrivate = ::openPrivate,
                    onRefreshLibrary = { permissionEpoch++ },
                    onOpenSettings = { navigateTo(AppScreen.SETTINGS) },
                    onOpenLink = { showOpenUrl = true }
                )

                AppScreen.LIBRARY -> LibraryScreen(
                    items = visibleMedia,
                    favoriteIds = favoriteIds,
                    recentIds = recentIds,
                    initialMode = libraryMode,
                    onOpenItems = ::openItems,
                    onRefresh = { permissionEpoch++ },
                    onFavorite = { id, value -> LibraryStore.setFavorite(activity, id, value); storeEpoch++ },
                    onHideToVault = { selectedItems ->
                        appScope.launch {
                            val results = withContext(Dispatchers.IO) {
                                selectedItems.map { PrivateVaultStore.hideMedia(activity, it) }
                            }
                            val ok = results.count { it.success }
                            val failed = results.size - ok
                            Toast.makeText(
                                activity,
                                if (failed == 0) "$ok item(ns) movido(s) para o Cofre."
                                else "$ok protegido(s); $failed não puderam ser movidos.",
                                Toast.LENGTH_LONG
                            ).show()
                            if (ok > 0) {
                                storeEpoch++
                                permissionEpoch++
                            }
                        }
                    },
                    onDeletePermanently = { selectedItems ->
                        appScope.launch {
                            val results = withContext(Dispatchers.IO) {
                                selectedItems.map { RealFileOperations.deleteMediaPermanently(activity, it) }
                            }
                            val ok = results.count { it.success }
                            val failed = results.size - ok
                            Toast.makeText(
                                activity,
                                if (failed == 0) "$ok item(ns) excluído(s) definitivamente."
                                else "$ok excluído(s); $failed falharam.",
                                Toast.LENGTH_LONG
                            ).show()
                            if (ok > 0) {
                                storeEpoch++
                                permissionEpoch++
                            }
                        }
                    },
                    onShare = { shareMedia(activity, it) }
                )

                AppScreen.CENTRAL -> NerdoraCentralScreen(
                    items = visibleMedia,
                    favoriteIds = favoriteIds,
                    recentIds = recentIds,
                    playlistCount = playlists.size,
                    positionFor = { PlayerPreferences.loadPosition(activity, it.url) },
                    onOpenItems = ::openItems,
                    onOpenLibraryMode = ::openLibrary,
                    onOpenDownloads = { openFiles(folderPath = "DOWNLOAD") },
                    onOpenVault = ::openPrivate,
                    onOpenLargeFiles = { openFiles(category = "LARGE") },
                    onOpenLink = { showOpenUrl = true },
                    onOpenPlaylists = { navigateTo(AppScreen.PLAYLISTS) }
                )

                AppScreen.FILES -> androidx.compose.runtime.key(fileOpenEpoch) {
                    FilesScreen(
                        context = activity,
                        initialCategoryName = fileCategory,
                        initialFolderPath = fileFolder,
                        initialQuery = fileQuery,
                        onOpenMedia = { media -> openItems(listOf(media), 0) },
                        onOpenDocument = { openDocument = it }
                    )
                }

                AppScreen.SEARCH -> GlobalSearchScreen(
                    mediaItems = visibleMedia,
                    onBack = ::navigateBack,
                    onOpenMedia = { media -> openItems(listOf(media), 0) },
                    onOpenFile = ::openPhysicalFile,
                    onOpenFileLocation = { path ->
                        val file = File(path)
                        openFiles(
                            folderPath = if (file.isDirectory) file.absolutePath else file.parentFile?.absolutePath,
                            query = if (file.isDirectory) "" else file.name
                        )
                    }
                )

                AppScreen.PLAYLISTS -> PlaylistsScreen(
                    playlists = playlists,
                    allItems = visibleMedia,
                    onCreate = { LibraryStore.createPlaylist(activity, it); storeEpoch++ },
                    onDelete = { LibraryStore.deletePlaylist(activity, it); storeEpoch++ },
                    onRename = { old, new -> LibraryStore.renamePlaylist(activity, old, new); storeEpoch++ },
                    onDuplicate = { LibraryStore.duplicatePlaylist(activity, it); storeEpoch++ },
                    onOpen = { if (it.isNotEmpty()) openItems(it, 0) }
                )

                AppScreen.SETTINGS -> SettingsScreen(
                    hiddenCount = vaultEntries.size + hiddenMedia.size,
                    trashCount = removedMedia.size,
                    accountEmail = currentAccount?.email,
                    onOpenAccount = { navigateTo(AppScreen.ACCOUNT) },
                    onThemeChanged = onThemeChanged,
                    onOpenPrivate = ::openPrivate,
                    onOpenTrash = { navigateTo(AppScreen.REMOVED) },
                    onOpenFileTrash = { openFiles(category = "TRASH") },
                    onOpenDiagnostics = { navigateTo(AppScreen.DIAGNOSTICS) },
                    onClearHistory = { LibraryStore.clearHistory(activity); storeEpoch++ },
                    onOpenCastSettings = activity::openCastSettings,
                    onLibraryChanged = { storeEpoch++; onThemeChanged() }
                )

                AppScreen.ACCOUNT -> AccountScreen(
                    onBack = ::navigateBack,
                    onSessionChanged = { accountEpoch++ }
                )

                AppScreen.HIDDEN -> PrivateVaultScreen(
                    context = activity,
                    entries = vaultEntries,
                    legacyItems = hiddenMedia,
                    onBack = ::navigateBack,
                    onOpenFile = { file, displayName ->
                        val media = PrivateVaultStore.asMediaFile(activity, file, displayName)
                        if (media != null) {
                            openItems(listOf(media), 0)
                        } else {
                            PrivateVaultStore.asDocumentFile(activity, file, displayName)?.let { openDocument = it }
                        }
                    },
                    onChanged = {
                        storeEpoch++
                        permissionEpoch++
                    }
                )

                AppScreen.REMOVED -> TrashScreen(
                    items = removedMedia,
                    onBack = ::navigateBack,
                    onOpenItems = ::openItems,
                    onRestore = { LibraryStore.restoreFromTrash(activity, it); storeEpoch++ },
                    onEmptyLogicalTrash = { LibraryStore.emptyTrash(activity); storeEpoch++ }
                )

                AppScreen.DIAGNOSTICS -> DiagnosticsScreen(onBack = ::navigateBack)
            }
        }
    }

    if (showOpenUrl) {
        OpenMediaUrlDialog(
            onDismiss = { showOpenUrl = false },
            onOpen = { media ->
                viewerItems = listOf(media)
                viewerIndex = 0
            }
        )
    }

    if (showWhatsNew) {
        WhatsNewDialog(version = BuildConfig.VERSION_NAME.removeSuffix("-debug")) {
            PlayerPreferences.markVersionShown(activity, BuildConfig.VERSION_NAME)
            showWhatsNew = false
        }
    } else {
        availableUpdate?.let { result ->
            UpdateAvailableDialog(context = activity, result = result, onDismiss = { availableUpdate = null })
        }
    }
}
