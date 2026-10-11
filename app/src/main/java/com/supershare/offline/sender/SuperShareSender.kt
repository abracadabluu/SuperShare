package com.supershare.offline.sender

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedOutputStream
import java.io.DataOutputStream
import java.io.InputStream
import java.net.InetSocketAddress
import java.net.Socket

class SuperShareSender(
    private val context: Context,
    private val onProgress: (fileName: String, sentBytes: Long, totalBytes: Long, percent: Int, speedMBps: Double) -> Unit,
    private val onCompleted: (fileName: String) -> Unit,
    private val onError: (error: String) -> Unit
) {

    private val BUFFER_SIZE = 64 * 1024

    suspend fun sendFile(
        receiverIp: String,
        port: Int = 8888,
        fileUri: Uri,
        fileName: String,
        fileSize: Long
    ) = withContext(Dispatchers.IO) {
        var socket: Socket? = null
        var outputStream: DataOutputStream? = null
        var inputStream: InputStream? = null

        try {
            socket = Socket()
            socket.connect(InetSocketAddress(receiverIp, port), 10000)

            outputStream = DataOutputStream(BufferedOutputStream(socket.getOutputStream()))
            inputStream = context.contentResolver.openInputStream(fileUri)
                ?: throw IllegalStateException("Cannot read file from URI")

            outputStream.writeUTF(fileName)
            outputStream.writeLong(fileSize)
            outputStream.flush()

            val buffer = ByteArray(BUFFER_SIZE)
            var totalBytesSent: Long = 0
            val startTime = System.currentTimeMillis()
            var lastUpdate = startTime

            while (totalBytesSent < fileSize) {
                val toRead = Math.min(BUFFER_SIZE.toLong(), fileSize - totalBytesSent).toInt()
                val bytesRead = inputStream.read(buffer, 0, toRead)
                if (bytesRead == -1) break
                outputStream.write(buffer, 0, bytesRead)
                totalBytesSent += bytesRead

                val now = System.currentTimeMillis()
                if (now - lastUpdate > 150 || totalBytesSent == fileSize) {
                    val elapsedSec = (now - startTime) / 1000.0
                    val speedMBps = if (elapsedSec > 0) (totalBytesSent / (1024.0 * 1024.0)) / elapsedSec else 0.0
                    val percent = ((totalBytesSent * 100) / fileSize).toInt()

                    withContext(Dispatchers.Main) {
                        onProgress(fileName, totalBytesSent, fileSize, percent, speedMBps)
                    }
                    lastUpdate = now
                }
            }

            outputStream.flush()

            withContext(Dispatchers.Main) {
                onCompleted(fileName)
            }

        } catch (e: Exception) {
            withContext(Dispatchers.Main) {
                onError(e.message ?: "File streaming failed")
            }
        } finally {
            try {
                inputStream?.close()
                outputStream?.close()
                socket?.close()
            } catch (_: Exception) {}
        }
    }
}
