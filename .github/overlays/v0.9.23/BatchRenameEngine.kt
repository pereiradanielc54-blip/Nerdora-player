package com.nerdora.player

import android.content.Context
import java.io.File
import java.util.Locale

data class BatchRenameOptions(
    val prefix: String = "",
    val suffix: String = "",
    val findText: String = "",
    val replaceText: String = "",
    val addNumber: Boolean = false,
    val startNumber: Int = 1,
    val numberPadding: Int = 2
)

data class BatchRenamePreview(
    val source: File,
    val newName: String
)

data class BatchRenameResult(
    val renamed: Int,
    val failed: Int,
    val messages: List<String>
)

object BatchRenameEngine {
    fun preview(files: List<File>, options: BatchRenameOptions): List<BatchRenamePreview> =
        files.sortedBy { it.name.lowercase(Locale.ROOT) }.mapIndexed { index, file ->
            BatchRenamePreview(file, buildName(file, options, index))
        }

    fun apply(context: Context, files: List<File>, options: BatchRenameOptions): BatchRenameResult {
        val plan = preview(files, options)
        val duplicateNames = plan.groupBy { it.source.parentFile?.absolutePath.orEmpty() + "|" + it.newName.lowercase(Locale.ROOT) }
            .filterValues { it.size > 1 }
        if (duplicateNames.isNotEmpty()) {
            return BatchRenameResult(0, files.size, listOf("O padrão gera nomes repetidos. Ajuste prefixo, sufixo ou numeração."))
        }

        var renamed = 0
        var failed = 0
        val messages = mutableListOf<String>()
        plan.forEach { item ->
            if (item.newName == item.source.name) return@forEach
            val result = RealFileOperations.renameReal(context, item.source, item.newName)
            if (result.success) renamed++ else {
                failed++
                messages += "${item.source.name}: ${result.message}"
            }
        }
        return BatchRenameResult(renamed, failed, messages.take(8))
    }

    private fun buildName(file: File, options: BatchRenameOptions, index: Int): String {
        val isDirectory = file.isDirectory
        val originalBase = if (isDirectory) file.name else file.nameWithoutExtension
        val extension = if (isDirectory || file.extension.isBlank()) "" else ".${file.extension}"

        var base = originalBase
        if (options.findText.isNotEmpty()) {
            base = base.replace(options.findText, options.replaceText, ignoreCase = false)
        }
        val number = if (options.addNumber) {
            val raw = (options.startNumber + index).coerceAtLeast(0).toString()
            " " + raw.padStart(options.numberPadding.coerceIn(1, 6), '0')
        } else ""
        val safe = (options.prefix + base + options.suffix + number)
            .trim()
            .replace(Regex("[\\/:*?\"<>|]"), "_")
            .take(170)
        return (safe.ifBlank { originalBase } + extension).take(180)
    }
}
