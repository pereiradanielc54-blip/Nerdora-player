package com.nerdora.player

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

data class FileChecksums(
    val md5: String,
    val sha1: String,
    val sha256: String
)

object DuplicateHashEngine {
    suspend fun findDuplicatePaths(
        files: List<File>,
        onProgress: (done: Int, total: Int) -> Unit = { _, _ -> }
    ): Set<String> = withContext(Dispatchers.IO) {
        val candidates = files.asSequence()
            .filter { it.exists() && it.isFile && it.length() > 0L }
            .groupBy { it.length() }
            .values
            .filter { it.size > 1 }
            .flatten()

        val total = candidates.size
        var done = 0
        val byHash = LinkedHashMap<String, MutableList<File>>()
        candidates.forEach { file ->
            val hash = sha256(file)
            if (hash.isNotBlank()) byHash.getOrPut(hash) { mutableListOf() }.add(file)
            done++
            onProgress(done, total)
        }

        byHash.values
            .filter { it.size > 1 }
            .flatten()
            .map { it.absolutePath }
            .toSet()
    }

    suspend fun checksums(file: File): FileChecksums = withContext(Dispatchers.IO) {
        require(file.exists() && file.isFile) { "Selecione um arquivo válido." }
        val md5 = MessageDigest.getInstance("MD5")
        val sha1 = MessageDigest.getInstance("SHA-1")
        val sha256 = MessageDigest.getInstance("SHA-256")

        FileInputStream(file).use { input ->
            val buffer = ByteArray(256 * 1024)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                md5.update(buffer, 0, read)
                sha1.update(buffer, 0, read)
                sha256.update(buffer, 0, read)
            }
        }
        FileChecksums(md5.digest().hex(), sha1.digest().hex(), sha256.digest().hex())
    }

    private fun sha256(file: File): String = runCatching {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { input ->
            val buffer = ByteArray(256 * 1024)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
        }
        digest.digest().hex()
    }.getOrDefault("")

    private fun ByteArray.hex(): String = joinToString("") { "%02x".format(it) }
}
