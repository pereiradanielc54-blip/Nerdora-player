package com.nerdora.player

import android.os.StatFs
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest
import java.util.Locale

enum class StorageCategory(val label: String) {
    VIDEO("Vídeos"), IMAGE("Imagens"), AUDIO("Áudios"), DOCUMENT("Documentos"),
    APK("APKs"), ARCHIVE("Compactados"), OTHER("Outros")
}

data class StorageCategoryUsage(val category: StorageCategory, val bytes: Long, val count: Int)
data class DuplicateGroup(val hash: String, val size: Long, val files: List<File>)
data class CleanupCandidate(val file: File, val reason: String, val safe: Boolean)

data class StorageAnalysisResult(
    val totalBytes: Long,
    val usedBytes: Long,
    val freeBytes: Long,
    val scannedFiles: Int,
    val scannedFolders: Int,
    val categoryUsage: List<StorageCategoryUsage>,
    val largeFiles: List<File>,
    val largeFolders: List<Pair<File, Long>>,
    val recentFiles: List<File>,
    val duplicateGroups: List<DuplicateGroup>,
    val temporaryFiles: List<CleanupCandidate>,
    val duplicateDownloads: List<CleanupCandidate>,
    val scanLimited: Boolean
) {
    val cleanupCandidates: List<CleanupCandidate>
        get() = (temporaryFiles + duplicateDownloads).distinctBy { it.file.absolutePath }
    val lowStorage: Boolean get() = totalBytes > 0 && freeBytes.toDouble() / totalBytes.toDouble() < 0.10
}

object StorageAnalyzer {
    private const val MAX_FILES = 60000
    private const val LARGE_FILE = 100L * 1024L * 1024L
    private const val LARGE_FOLDER = 500L * 1024L * 1024L
    private const val RECENT_WINDOW = 7L * 24L * 60L * 60L * 1000L

    fun analyze(root: File): StorageAnalysisResult {
        val stat = StatFs(root.absolutePath)
        val total = stat.totalBytes
        val free = stat.availableBytes
        val used = (total - free).coerceAtLeast(0L)
        val categoryBytes = StorageCategory.entries.associateWith { 0L }.toMutableMap()
        val categoryCount = StorageCategory.entries.associateWith { 0 }.toMutableMap()
        val allFiles = ArrayList<File>()
        val folders = ArrayList<File>()
        val now = System.currentTimeMillis()
        var limited = false

        val stack = ArrayDeque<File>()
        stack.add(root)
        while (stack.isNotEmpty()) {
            val current = stack.removeLast()
            if (shouldSkip(current, root)) continue
            if (current.isDirectory) {
                folders.add(current)
                current.listFiles()?.forEach { child ->
                    if (allFiles.size >= MAX_FILES) {
                        limited = true
                        return@forEach
                    }
                    if (child.isDirectory) stack.add(child) else allFiles.add(child)
                }
            }
            if (limited) break
        }

        allFiles.forEach { file ->
            val category = categoryOf(file)
            categoryBytes[category] = (categoryBytes[category] ?: 0L) + file.length()
            categoryCount[category] = (categoryCount[category] ?: 0) + 1
        }

        val categoryUsage = StorageCategory.entries.map {
            StorageCategoryUsage(it, categoryBytes[it] ?: 0L, categoryCount[it] ?: 0)
        }.sortedByDescending { it.bytes }

        val largeFiles = allFiles.asSequence().filter { it.length() >= LARGE_FILE }
            .sortedByDescending { it.length() }.take(100).toList()

        val largeFolders = folders.asSequence()
            .map { it to fastFolderSize(it, 15000) }
            .filter { it.second >= LARGE_FOLDER }
            .sortedByDescending { it.second }.take(60).toList()

        val recentFiles = allFiles.asSequence()
            .filter { now - it.lastModified() in 0..RECENT_WINDOW }
            .sortedByDescending { it.lastModified() }.take(150).toList()

        val duplicateGroups = findDuplicates(allFiles)

        val temporary = allFiles.asSequence().filter(::isTemporary).take(500).map {
            CleanupCandidate(it, "Arquivo temporário", true)
        }.toList()

        val duplicateDownloads = duplicateGroups.flatMap { group ->
            group.files.filter { isInsideDownloads(it) }.drop(1).map {
                CleanupCandidate(it, "Download duplicado • SHA-256 confirmado", true)
            }
        }.take(500)

        return StorageAnalysisResult(
            totalBytes = total,
            usedBytes = used,
            freeBytes = free,
            scannedFiles = allFiles.size,
            scannedFolders = folders.size,
            categoryUsage = categoryUsage,
            largeFiles = largeFiles,
            largeFolders = largeFolders,
            recentFiles = recentFiles,
            duplicateGroups = duplicateGroups,
            temporaryFiles = temporary,
            duplicateDownloads = duplicateDownloads,
            scanLimited = limited
        )
    }

    private fun shouldSkip(file: File, root: File): Boolean {
        if (file.absolutePath == root.absolutePath) return false
        val p = file.absolutePath.replace('\\', '/').lowercase(Locale.ROOT)
        return p.contains("/android/data") || p.contains("/android/obb") ||
            p.contains("/.thumbnails") || p.contains("/.nerdora")
    }

    private fun categoryOf(file: File): StorageCategory {
        val e = file.extension.lowercase(Locale.ROOT)
        return when (e) {
            "mp4","mkv","avi","mov","webm","m4v","3gp" -> StorageCategory.VIDEO
            "jpg","jpeg","png","gif","webp","bmp","heic","avif" -> StorageCategory.IMAGE
            "mp3","aac","m4a","wav","ogg","flac","opus" -> StorageCategory.AUDIO
            "pdf","doc","docx","xls","xlsx","ppt","pptx","txt","rtf","csv","odt","ods","odp" -> StorageCategory.DOCUMENT
            "apk","apks","xapk","aab" -> StorageCategory.APK
            "zip","rar","7z","tar","gz","xz","bz2","tgz" -> StorageCategory.ARCHIVE
            else -> StorageCategory.OTHER
        }
    }

    private fun fastFolderSize(folder: File, cap: Int): Long {
        var total = 0L
        var count = 0
        val stack = ArrayDeque<File>()
        stack.add(folder)
        while (stack.isNotEmpty() && count < cap) {
            val f = stack.removeLast()
            val children = f.listFiles() ?: continue
            for (c in children) {
                if (c.isDirectory) stack.add(c) else {
                    total += c.length(); count++
                    if (count >= cap) break
                }
            }
        }
        return total
    }

    private fun findDuplicates(files: List<File>): List<DuplicateGroup> {
        val candidates = files.filter { it.length() > 0L }.groupBy { it.length() }.filterValues { it.size > 1 }
        val result = ArrayList<DuplicateGroup>()
        for ((size, sameSize) in candidates) {
            val byHash = sameSize.groupBy { sha256(it) }.filterKeys { it.isNotBlank() }.filterValues { it.size > 1 }
            byHash.forEach { (hash, sameHash) -> result.add(DuplicateGroup(hash, size, sameHash)) }
            if (result.size >= 100) break
        }
        return result.sortedByDescending { it.size * it.files.size }.take(100)
    }

    private fun sha256(file: File): String = runCatching {
        val md = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { input ->
            val buffer = ByteArray(256 * 1024)
            while (true) {
                val n = input.read(buffer)
                if (n <= 0) break
                md.update(buffer, 0, n)
            }
        }
        md.digest().joinToString("") { "%02x".format(it) }
    }.getOrDefault("")

    private fun isTemporary(file: File): Boolean {
        val name = file.name.lowercase(Locale.ROOT)
        val parent = file.parentFile?.name?.lowercase(Locale.ROOT).orEmpty()
        return name.endsWith(".tmp") || name.endsWith(".temp") || name.endsWith(".partial") ||
            name.endsWith(".crdownload") || name.endsWith(".download") ||
            parent == "temp" || parent == "tmp"
    }

    private fun isInsideDownloads(file: File): Boolean =
        file.absolutePath.replace('\\','/').lowercase(Locale.ROOT).contains("/download/")
}
