package com.nerdora.player

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

class FileOperationService : Service() {
    companion object {
        const val ACTION_PROCESS = "com.nerdora.player.FILE_OPERATION_PROCESS"
        const val ACTION_CANCEL = "com.nerdora.player.FILE_OPERATION_CANCEL"
        const val EXTRA_ID = "operation_id"
        private const val CHANNEL = "nerdora_file_operations"
        private const val NOTIFICATION_ID = 6223
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val processing = java.util.concurrent.atomic.AtomicBoolean(false)
    @Volatile private var cancelId: String? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CANCEL) {
            cancelId = intent.getStringExtra(EXTRA_ID)
            return START_NOT_STICKY
        }

        startForeground(
            NOTIFICATION_ID,
            notification("Gerenciador Pro", "Preparando operação…", 0, true, null)
        )

        if (processing.compareAndSet(false, true)) {
            scope.launch {
                try {
                    processQueue()
                } finally {
                    processing.set(false)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            }
        }
        return START_STICKY
    }

    private fun processQueue() {
        while (true) {
            val request = FileOperationEngine.peek(this) ?: break
            cancelId = null
            val startedAt = System.currentTimeMillis()
            val title = FileOperationEngine.titleFor(request.type, true)

            FileOperationEngine.setSnapshot(
                this,
                FileOperationSnapshot(
                    id = request.id,
                    title = title,
                    sourceCount = request.sources.size,
                    startedAt = startedAt,
                    state = "RUNNING",
                    message = "${request.sources.size} item(ns)"
                )
            )

            var lastNotify = 0L
            var lastSummary = FileOperationSummary()
            try {
                val summary = FileOperationEngine.perform(
                    context = this,
                    request = request,
                    onProgress = { processed, total, current ->
                        val percent = ((processed.toDouble() / total.coerceAtLeast(1L)) * 100.0)
                            .roundToInt().coerceIn(0, 100)
                        val now = System.currentTimeMillis()
                        val elapsedMs = (now - startedAt).coerceAtLeast(1L)
                        val speed = if (elapsedMs >= 250L) (processed * 1000L / elapsedMs).coerceAtLeast(0L) else 0L
                        val eta = if (speed > 0L && processed < total) ((total - processed) / speed).coerceAtLeast(0L) else -1L

                        if (now - lastNotify > 350L || percent >= 100) {
                            lastNotify = now
                            FileOperationEngine.setSnapshot(
                                this,
                                FileOperationSnapshot(
                                    id = request.id,
                                    title = title,
                                    percent = percent,
                                    processedBytes = processed,
                                    totalBytes = total,
                                    speedBytesPerSec = speed,
                                    etaSeconds = eta,
                                    sourceCount = request.sources.size,
                                    startedAt = startedAt,
                                    state = "RUNNING",
                                    message = current
                                )
                            )
                            val detail = buildString {
                                if (speed > 0L) append(formatSpeed(speed))
                                if (eta >= 0L) {
                                    if (isNotEmpty()) append(" • ")
                                    append(formatEta(eta))
                                }
                                if (current.isNotBlank()) {
                                    if (isNotEmpty()) append(" • ")
                                    append(current)
                                }
                            }.ifBlank { "$percent%" }

                            getSystemService(NotificationManager::class.java).notify(
                                NOTIFICATION_ID,
                                notification(title, detail, percent, false, request.id)
                            )
                        }
                    },
                    isCancelled = { cancelId == request.id }
                )
                lastSummary = summary
                FileOperationEngine.complete(this, request.id)

                val message = buildString {
                    append("${summary.success} concluído(s)")
                    if (summary.skipped > 0) append(" • ${summary.skipped} ignorado(s)")
                    if (summary.failed > 0) append(" • ${summary.failed} falha(s)")
                }
                val state = if (summary.failed == 0) "DONE" else "DONE_WITH_ERRORS"

                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        percent = 100,
                        processedBytes = summary.totalBytes,
                        totalBytes = summary.totalBytes,
                        speedBytesPerSec = 0L,
                        etaSeconds = 0L,
                        sourceCount = request.sources.size,
                        startedAt = startedAt,
                        state = state,
                        message = message
                    )
                )
                FileOperationEngine.recordHistory(this, request, state, message, summary, startedAt)

                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Operação concluída", message, 100, false, null)
                )
            } catch (_: FileOperationCancelled) {
                FileOperationEngine.complete(this, request.id)
                val summary = lastSummary
                val message = "Operação cancelada."
                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        sourceCount = request.sources.size,
                        startedAt = startedAt,
                        state = "CANCELLED",
                        message = message
                    )
                )
                FileOperationEngine.recordHistory(this, request, "CANCELLED", message, summary, startedAt)
                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Operação cancelada", "A fila seguirá para a próxima operação.", 0, false, null)
                )
            } catch (t: Throwable) {
                FileOperationEngine.complete(this, request.id)
                val message = t.message ?: "Falha na operação."
                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        sourceCount = request.sources.size,
                        startedAt = startedAt,
                        state = "FAILED",
                        message = message
                    )
                )
                FileOperationEngine.recordHistory(this, request, "FAILED", message, lastSummary, startedAt)
                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Falha na operação", message, 0, false, null)
                )
            }
        }
    }

    private fun notification(
        title: String,
        text: String,
        progress: Int,
        indeterminate: Boolean,
        operationId: String?
    ): android.app.Notification {
        val builder = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setOnlyAlertOnce(true)
            .setOngoing(operationId != null)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setProgress(100, progress.coerceIn(0, 100), indeterminate)

        if (operationId != null) {
            val cancelIntent = Intent(this, FileOperationService::class.java)
                .setAction(ACTION_CANCEL)
                .putExtra(EXTRA_ID, operationId)
            val pending = PendingIntent.getService(
                this,
                operationId.hashCode(),
                cancelIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancelar", pending)
        }
        return builder.build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL,
                    "Operações de arquivos",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Fila, velocidade e progresso das operações de arquivos do Nerdora."
                }
            )
        }
    }

    private fun formatSpeed(bytesPerSecond: Long): String =
        "${formatBytes(bytesPerSecond)}/s"

    private fun formatEta(seconds: Long): String = when {
        seconds < 60L -> "~${seconds}s restantes"
        seconds < 3600L -> "~${seconds / 60L} min restantes"
        else -> "~${seconds / 3600L}h ${(seconds % 3600L) / 60L}min restantes"
    }

    private fun formatBytes(bytes: Long): String = when {
        bytes < 1024L -> "$bytes B"
        bytes < 1024L * 1024L -> "%.1f KB".format(bytes / 1024.0)
        bytes < 1024L * 1024L * 1024L -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
        else -> "%.2f GB".format(bytes / (1024.0 * 1024.0 * 1024.0))
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
