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
            val title = if (request.type == FileOperationType.MOVE) "Movendo arquivos" else "Copiando arquivos"
            FileOperationEngine.setSnapshot(
                this,
                FileOperationSnapshot(
                    id = request.id,
                    title = title,
                    state = "RUNNING",
                    message = "${request.sources.size} item(ns)"
                )
            )

            var lastNotify = 0L
            try {
                val (ok, failed) = FileOperationEngine.perform(
                    context = this,
                    request = request,
                    onProgress = { processed, total, current ->
                        val percent = ((processed.toDouble() / total.coerceAtLeast(1L)) * 100.0)
                            .roundToInt().coerceIn(0, 100)
                        val now = System.currentTimeMillis()
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
                                    state = "RUNNING",
                                    message = current
                                )
                            )
                            getSystemService(NotificationManager::class.java).notify(
                                NOTIFICATION_ID,
                                notification(title, current.ifBlank { "$percent%" }, percent, false, request.id)
                            )
                        }
                    },
                    isCancelled = { cancelId == request.id }
                )
                FileOperationEngine.complete(this, request.id)
                val message = if (failed == 0) "$ok item(ns) concluído(s)." else "$ok concluído(s), $failed com falha."
                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        percent = 100,
                        state = if (failed == 0) "DONE" else "DONE_WITH_ERRORS",
                        message = message
                    )
                )
                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Operação concluída", message, 100, false, null)
                )
            } catch (_: FileOperationCancelled) {
                FileOperationEngine.complete(this, request.id)
                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        state = "CANCELLED",
                        message = "Operação cancelada."
                    )
                )
                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Operação cancelada", "Nenhum novo item será copiado.", 0, false, null)
                )
            } catch (t: Throwable) {
                FileOperationEngine.complete(this, request.id)
                FileOperationEngine.setSnapshot(
                    this,
                    FileOperationSnapshot(
                        id = request.id,
                        title = title,
                        state = "FAILED",
                        message = t.message ?: "Falha na operação."
                    )
                )
                getSystemService(NotificationManager::class.java).notify(
                    NOTIFICATION_ID,
                    notification("Falha na operação", t.message ?: "Não foi possível concluir.", 0, false, null)
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
                    description = "Progresso de cópia e movimentação de arquivos do Nerdora."
                }
            )
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
