package com.supershare.offline.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.BufferedInputStream
import java.io.DataInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.ServerSocket
import java.net.Socket

class SuperShareReceiverService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var wakeLock: PowerManager.WakeLock? = null
    private var serverSocket: ServerSocket? = null
    private val CHANNEL_ID = "supershare_channel"
    private val NOTIFICATION_ID = 101
    private val BUFFER_SIZE = 64 * 1024

    override fun onCreate() {
        super.onCreate()
        try {
            acquireWakeLock()
            createNotificationChannel()
            startForeground(NOTIFICATION_ID, buildNotification("SuperShare Active", "Waiting for incoming stream..."))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "SuperShare::OfflineStreamLock"
            ).apply {
                setReferenceCounted(false)
                acquire(2 * 60 * 60 * 1000L)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val port = intent?.getIntExtra("PORT", 8888) ?: 8888
        startSocketServer(port)
        return START_NOT_STICKY
    }

    private fun startSocketServer(port: Int) {
        serviceScope.launch {
            try {
                serverSocket = ServerSocket(port)
                serverSocket?.reuseAddress = true

                while (serverSocket != null && !serverSocket!!.isClosed) {
                    val clientSocket = serverSocket!!.accept()
                    handleIncomingStream(clientSocket)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun handleIncomingStream(socket: Socket) {
        serviceScope.launch {
            var inputStream: DataInputStream? = null
            var fileOutputStream: FileOutputStream? = null

            try {
                inputStream = DataInputStream(BufferedInputStream(socket.getInputStream()))

                val fileName = inputStream.readUTF()
                val totalFileSize = inputStream.readLong()

                val downloadDir = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "SuperShare"
                )
                if (!downloadDir.exists()) downloadDir.mkdirs()

                val targetFile = File(downloadDir, fileName)
                fileOutputStream = FileOutputStream(targetFile)

                val buffer = ByteArray(BUFFER_SIZE)
                var totalBytesReceived: Long = 0

                while (totalBytesReceived < totalFileSize) {
                    val toRead = Math.min(BUFFER_SIZE.toLong(), totalFileSize - totalBytesReceived).toInt()
                    val bytesRead = inputStream.read(buffer, 0, toRead)
                    if (bytesRead == -1) break
                    fileOutputStream.write(buffer, 0, bytesRead)
                    totalBytesReceived += bytesRead
                }

                fileOutputStream.flush()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                try {
                    fileOutputStream?.close()
                    inputStream?.close()
                    socket.close()
                } catch (_: Exception) {}
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SuperShare Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            serverSocket?.close()
        } catch (_: Exception) {}
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (_: Exception) {}
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
