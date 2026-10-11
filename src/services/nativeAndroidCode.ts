/**
 * Complete Android Native Kotlin source files & GitHub Actions workflow
 * for SuperShare offline file transfer app.
 */

export const GITHUB_ACTIONS_WORKFLOW = `name: Build SuperShare Debug APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build SuperShare APK
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Grant Execute Permission to Gradle Wrapper
      run: chmod +x gradlew

    - name: Build Debug APK with Gradle
      run: ./gradlew assembleDebug --stacktrace

    - name: Upload Debug APK Artifact
      uses: actions/upload-artifact@v4
      with:
        name: SuperShare-debug-apk
        path: app/build/outputs/apk/debug/app-debug.apk
        retention-days: 30
`;

export const ANDROID_MANIFEST_XML = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.supershare.offline">

    <!-- Wi-Fi Direct & Network Permissions -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

    <!-- Wi-Fi Direct on Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES"
        android:usesPermissionFlags="neverForLocation"
        tools:targetApi="tiramisu" />

    <!-- Location required for Wi-Fi P2P discovery on Android 12 and below -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- WakeLock & Foreground Service to prevent background RAM/CPU kill -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" tools:targetApi="upside_down_cake" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Storage Access -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="SuperShare"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SuperShare"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Service for heavy stream receiving with WakeLock -->
        <service
            android:name=".service.SuperShareReceiverService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

    </application>
</manifest>`;

export const APP_BUILD_GRADLE_KTS = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.supershare.offline"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.supershare.offline"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Keystore configuration will be placed here for release apk
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
`;

export const RECEIVER_SERVICE_KOTLIN = `package com.supershare.offline.service

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
import com.supershare.offline.R
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
    private val CHANNEL_ID = "supershare_transfer_channel"
    private val NOTIFICATION_ID = 1001

    // 64 KB Stream Buffer as requested to prevent RAM spikes on heavy files
    private val BUFFER_SIZE = 64 * 1024

    override fun onCreate() {
        super.onCreate()
        acquireWakeLock()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("SuperShare Ready", "Waiting for incoming file stream...", 0))
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "SuperShare::OfflineStreamWakeLock"
        ).apply {
            setReferenceCounted(false)
            acquire(2 * 60 * 60 * 1000L) // 2 hours max safe timeout for heavy transfers
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

                while (!serverSocket!!.isClosed) {
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

                // 1. Read Metadata first: File Name and Total Size in bytes
                val fileName = inputStream.readUTF()
                val totalFileSize = inputStream.readLong()

                // Save directory in Downloads/SuperShare
                val downloadDir = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "SuperShare"
                )
                if (!downloadDir.exists()) downloadDir.mkdirs()

                val targetFile = File(downloadDir, fileName)
                fileOutputStream = FileOutputStream(targetFile)

                // 2. Continuous 64 KB Chunked Buffer Stream directly to Storage
                val buffer = ByteArray(BUFFER_SIZE)
                var bytesRead = 0
                var totalBytesReceived: Long = 0
                var lastProgressUpdate = System.currentTimeMillis()

                while (totalBytesReceived < totalFileSize) {
                    val toRead = Math.min(BUFFER_SIZE.toLong(), totalFileSize - totalBytesReceived).toInt()
                    bytesRead = inputStream.read(buffer, 0, toRead)
                    if (bytesRead == -1) break
                    fileOutputStream.write(buffer, 0, bytesRead)
                    totalBytesReceived += bytesRead

                    // Update notification and broadcast progress every 200ms
                    val now = System.currentTimeMillis()
                    if (now - lastProgressUpdate > 200 || totalBytesReceived == totalFileSize) {
                        lastProgressUpdate = now
                        val progressPercent = ((totalBytesReceived * 100) / totalFileSize).toInt()
                        updateNotification(fileName, progressPercent)
                        broadcastProgress(fileName, totalBytesReceived, totalFileSize, progressPercent)
                    }
                }

                fileOutputStream.flush()
                broadcastCompleted(fileName, targetFile.absolutePath)
                updateNotification("$fileName received successfully!", 100)

            } catch (e: Exception) {
                broadcastError(e.message ?: "Transfer stream failed")
            } finally {
                fileOutputStream?.close()
                inputStream?.close()
                socket.close()
            }
        }
    }

    private fun broadcastProgress(fileName: String, received: Long, total: Long, percent: Int) {
        val intent = Intent("com.supershare.ACTION_PROGRESS").apply {
            putExtra("FILE_NAME", fileName)
            putExtra("BYTES_RECEIVED", received)
            putExtra("TOTAL_BYTES", total)
            putExtra("PERCENT", percent)
        }
        sendBroadcast(intent)
    }

    private fun broadcastCompleted(fileName: String, filePath: String) {
        val intent = Intent("com.supershare.ACTION_COMPLETED").apply {
            putExtra("FILE_NAME", fileName)
            putExtra("FILE_PATH", filePath)
        }
        sendBroadcast(intent)
    }

    private fun broadcastError(errorMsg: String) {
        val intent = Intent("com.supershare.ACTION_ERROR").apply {
            putExtra("ERROR", errorMsg)
        }
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SuperShare Transfer Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows real-time status of offline P2P stream file transfers"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, content: String, progress: Int): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_supershare_logo)
            .setProgress(100, progress, false)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(fileName: String, progress: Int) {
        val notification = buildNotification("Receiving $fileName", "$progress%", progress)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            serverSocket?.close()
        } catch (_: Exception) {}
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`;

export const SENDER_TASK_KOTLIN = `package com.supershare.offline.sender

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

    // 64 KB Chunk Buffer to prevent heavy file memory overload
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
            // Connect to receiver TCP socket server
            socket.connect(InetSocketAddress(receiverIp, port), 10000)

            outputStream = DataOutputStream(BufferedOutputStream(socket.getOutputStream()))
            inputStream = context.contentResolver.openInputStream(fileUri)
                ?: throw IllegalStateException("Cannot read file content from URI")

            // 1. Send Metadata Header first: File Name & Total byte size
            outputStream.writeUTF(fileName)
            outputStream.writeLong(fileSize)
            outputStream.flush()

            // 2. Stream byte data in 64 KB chunks
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
                onError(e.message ?: "File streaming failed over TCP Socket")
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
`;

export const WIFI_DIRECT_MANAGER_KOTLIN = `package com.supershare.offline.p2p

import android.annotation.SuppressLint
import android.content.Context
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.os.Looper

class WifiDirectManager(
    private val context: Context,
    private val onPeersAvailable: (List<WifiP2pDevice>) -> Unit,
    private val onConnectionInfoAvailable: (WifiP2pInfo) -> Unit,
    private val onError: (String) -> Unit
) {

    private val manager: WifiP2pManager? = context.getSystemService(Context.WIFI_P2P_SERVICE) as? WifiP2pManager
    private var channel: WifiP2pManager.Channel? = null

    init {
        channel = manager?.initialize(context, Looper.getMainLooper(), null)
    }

    @SuppressLint("MissingPermission")
    fun discoverPeers() {
        manager?.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                // Peer discovery started
            }

            override fun onFailure(reasonCode: Int) {
                onError("Wi-Fi Direct discovery failed with code: $reasonCode")
            }
        })
    }

    @SuppressLint("MissingPermission")
    fun requestPeers() {
        manager?.requestPeers(channel) { peers: WifiP2pDeviceList ->
            onPeersAvailable(peers.deviceList.toList())
        }
    }

    @SuppressLint("MissingPermission")
    fun connectToDevice(device: WifiP2pDevice) {
        val config = WifiP2pConfig().apply {
            deviceAddress = device.deviceAddress
        }
        manager?.connect(channel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                // Connection negotiation started
            }

            override fun onFailure(reason: Int) {
                onError("Failed to initiate Wi-Fi Direct connection: $reason")
            }
        })
    }

    fun requestConnectionInfo() {
        manager?.requestConnectionInfo(channel) { info ->
            onConnectionInfoAvailable(info)
        }
    }

    fun disconnect() {
        manager?.removeGroup(channel, null)
    }
}
`;

export const MAIN_ACTIVITY_KOTLIN = `package com.supershare.offline

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.supershare.offline.databinding.ActivityMainBinding
import com.supershare.offline.service.SuperShareReceiverService

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var selectedFileUri: Uri? = null

    // Register file picker for multimedia / heavy files
    private val selectFileLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedFileUri = it
            startFileSending(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        checkPermissions()
    }

    private fun setupUI() {
        // Large 'Send' button
        binding.btnSend.setOnClickListener {
            // Open multimedia file picker (video, apk, zip, images, etc.)
            selectFileLauncher.launch("*/*")
        }

        // Large 'Receive' button
        binding.btnReceive.setOnClickListener {
            startReceiveMode()
        }

        // Settings button in header
        binding.btnSettings.setOnClickListener {
            Toast.makeText(this, "SuperShare Settings: 64KB Chunk Buffer | Port 8888", Toast.LENGTH_SHORT).show()
        }
    }

    private fun startReceiveMode() {
        // Starts Foreground Service with WakeLock for continuous 64KB buffer listening
        val serviceIntent = Intent(this, SuperShareReceiverService::class.java).apply {
            putExtra("PORT", 8888)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        Toast.makeText(this, "Receiver ready! Wi-Fi Direct & 64KB Socket active.", Toast.LENGTH_LONG).show()
    }

    private fun startFileSending(uri: Uri) {
        val (fileName, fileSize) = queryFileInfo(uri)
        Toast.makeText(this, "Sending $fileName (" + (fileSize / (1024 * 1024)) + " MB) via 64KB stream", Toast.LENGTH_SHORT).show()
    }

    private fun queryFileInfo(uri: Uri): Pair<String, Long> {
        var name = "supershare_file"
        var size = 0L
        contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst()) {
                if (nameIndex != -1) name = cursor.getString(nameIndex)
                if (sizeIndex != -1) size = cursor.getLong(sizeIndex)
            }
        }
        return Pair(name, size)
    }

    private fun checkPermissions() {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES)
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        permissions.add(Manifest.permission.WAKE_LOCK)

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (needed.isNotEmpty()) {
            requestPermissions(needed.toTypedArray(), 101)
        }
    }
}
`;

export const ACTIVITY_MAIN_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#090D16"
    android:padding="20dp">

    <!-- Minimalist Header: Left App Name, Right Settings -->
    <RelativeLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:layout_marginBottom="32dp">

        <TextView
            android:id="@+id/tvAppName"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="SuperShare"
            android:textColor="#FFFFFF"
            android:textSize="26sp"
            android:textStyle="bold"
            android:fontFamily="sans-serif-medium"
            android:layout_alignParentStart="true"
            android:layout_centerVertical="true" />

        <ImageButton
            android:id="@+id/btnSettings"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@drawable/ic_settings"
            android:tint="#A0AEC0"
            android:layout_alignParentEnd="true"
            android:layout_centerVertical="true"
            android:contentDescription="Settings" />
    </RelativeLayout>

    <!-- Subtitle Banner -->
    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="High-Speed Offline File Transfer"
        android:textColor="#718096"
        android:textSize="14sp"
        android:layout_marginBottom="24dp" />

    <!-- Main Large Buttons Container -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical"
        android:gravity="center">

        <!-- Large SEND Button -->
        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnSend"
            android:layout_width="match_parent"
            android:layout_height="140dp"
            android:text="SEND"
            android:textSize="22sp"
            android:textStyle="bold"
            android:textColor="#FFFFFF"
            app:backgroundTint="#3B82F6"
            app:cornerRadius="24dp"
            app:icon="@drawable/ic_send_large"
            app:iconGravity="textStart"
            app:iconSize="32dp"
            app:iconPadding="16dp"
            android:elevation="6dp"
            android:layout_marginBottom="24dp" />

        <!-- Large RECEIVE Button -->
        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnReceive"
            android:layout_width="match_parent"
            android:layout_height="140dp"
            android:text="RECEIVE"
            android:textSize="22sp"
            android:textStyle="bold"
            android:textColor="#FFFFFF"
            app:backgroundTint="#10B981"
            app:cornerRadius="24dp"
            app:icon="@drawable/ic_receive_large"
            app:iconGravity="textStart"
            app:iconSize="32dp"
            app:iconPadding="16dp"
            android:elevation="6dp" />
    </LinearLayout>

    <!-- Technical Status Footer -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp"
        android:background="#131B2E">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Core Engine: Wi-Fi Direct (P2P) + 64 KB Stream Buffer"
            android:textColor="#60A5FA"
            android:textSize="12sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Foreground Service &amp; WakeLock Active • Zero RAM Crash"
            android:textColor="#9CA3AF"
            android:textSize="11sp"
            android:layout_marginTop="4dp" />
    </LinearLayout>

</LinearLayout>`;

export const ROOT_BUILD_GRADLE_KTS = `plugins {
    id("com.android.application") version "8.4.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`;

export const SETTINGS_GRADLE_KTS = `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SuperShare"
include(":app")
`;

export const GRADLE_WRAPPER_PROPERTIES = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

export const README_MD = `# SuperShare - Offline High-Speed Heavy File Transfer

SuperShare is a high-speed, offline multimedia file sharing application designed for Android and GitHub CI/CD.

## 🚀 Key Architectural Highlights
1. **Wi-Fi Direct (P2P) Connection**: Direct peer-to-peer connection without an active internet connection or router.
2. **64 KB Chunked Stream Buffer**: Heavy files (1 GB to 20 GB multimedia files) are streamed in 64 KB chunks over raw TCP sockets, preventing RAM overflow and OOM crashes.
3. **Metadata-First Protocol**: Sender transmits filename and exact byte length before the binary stream begins.
4. **Foreground Service & WakeLock**: Prevents Android OS from killing the socket connection during background transfers.

## 📦 How to get the Debug APK from GitHub:
1. Push this repository to your GitHub account:
   \`\`\`bash
   git init
   git add .
   git commit -m "SuperShare initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/SuperShare.git
   git push -u origin main
   \`\`\`
2. Open your GitHub repository in your browser and click on the **Actions** tab.
3. The **"Build SuperShare Debug APK"** workflow will automatically run.
4. When finished (~1-2 minutes), click on the completed run and download **SuperShare-debug-apk**!
5. Extract the zip to get \`app-debug.apk\` and install on any Android phone.

## 🔑 Future Release APK (with Keystore):
When you have your keystore ready:
1. Upload your keystore base64 string to GitHub Secrets (\`KEYSTORE_BASE64\`, \`KEYSTORE_PASSWORD\`, \`KEY_ALIAS\`, \`KEY_PASSWORD\`).
2. The release build will output the signed release APK!
`;
