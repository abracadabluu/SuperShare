package com.supershare.offline

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.os.PowerManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.supershare.offline.service.SuperShareReceiverService
import org.json.JSONArray
import org.json.JSONObject
import java.net.Inet4Address
import java.net.NetworkInterface

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private var wifiP2pManager: WifiP2pManager? = null
    private var wifiP2pChannel: WifiP2pManager.Channel? = null
    private var discoveredPeersList = mutableListOf<WifiP2pDevice>()

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            fileUploadCallback?.onReceiveValue(uris.toTypedArray())
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    private val p2pReceiver = object : BroadcastReceiver() {
        @SuppressLint("MissingPermission")
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                    wifiP2pManager?.requestPeers(wifiP2pChannel) { peers: WifiP2pDeviceList ->
                        discoveredPeersList.clear()
                        discoveredPeersList.addAll(peers.deviceList)

                        val jsonArray = JSONArray()
                        for (dev in peers.deviceList) {
                            val obj = JSONObject()
                            obj.put("id", dev.deviceAddress)
                            obj.put("name", dev.deviceName ?: dev.deviceAddress)
                            obj.put("status", dev.status)
                            jsonArray.put(obj)
                        }

                        val jsCall = "javascript:if(window.onNativePeersFound) { window.onNativePeersFound(${jsonArray}); }"
                        webView.post { webView.evaluateJavascript(jsCall, null) }
                    }
                }
                WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                    wifiP2pManager?.requestConnectionInfo(wifiP2pChannel) { info: WifiP2pInfo ->
                        val obj = JSONObject()
                        obj.put("groupFormed", info.groupFormed)
                        obj.put("isGroupOwner", info.isGroupOwner)
                        obj.put("groupOwnerAddress", info.groupOwnerAddress?.hostAddress ?: "192.168.49.1")

                        val jsCall = "javascript:if(window.onNativeP2pConnected) { window.onNativeP2pConnected(${obj}); }"
                        webView.post { webView.evaluateJavascript(jsCall, null) }
                    }
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            initWifiP2p()

            webView = WebView(this)
            setContentView(webView)

            setupWebView()
            checkPermissionsSafely()

            webView.loadUrl("file:///android_asset/index.html")
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "SuperShare initialization: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun initWifiP2p() {
        wifiP2pManager = getSystemService(Context.WIFI_P2P_SERVICE) as? WifiP2pManager
        wifiP2pChannel = wifiP2pManager?.initialize(this, Looper.getMainLooper(), null)

        val intentFilter = IntentFilter().apply {
            addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION)
        }
        registerReceiver(p2pReceiver, intentFilter)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                super.onReceivedError(view, errorCode, description, failingUrl)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                try {
                    request?.grant(request.resources)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onShowFileChooser(
                view: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                try {
                    filePickerLauncher.launch("*/*")
                    return true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    return false
                }
            }
        }

        webView.addJavascriptInterface(AndroidNativeBridge(this), "AndroidBridge")
    }

    inner class AndroidNativeBridge(private val context: Context) {

        @JavascriptInterface
        fun getLocalIpAddress(): String {
            try {
                val interfaces = NetworkInterface.getNetworkInterfaces()
                while (interfaces.hasMoreElements()) {
                    val intf = interfaces.nextElement()
                    val addresses = intf.inetAddresses
                    while (addresses.hasMoreElements()) {
                        val addr = addresses.nextElement()
                        if (!addr.isLoopbackAddress && addr is Inet4Address) {
                            return addr.hostAddress ?: "192.168.49.1"
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return "192.168.49.1"
        }

        @JavascriptInterface
        fun isWifiHardwareOn(): Boolean {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? android.net.wifi.WifiManager
            return wifiManager?.isWifiEnabled ?: true
        }

        @SuppressLint("MissingPermission")
        @JavascriptInterface
        fun discoverRealPeers() {
            wifiP2pManager?.discoverPeers(wifiP2pChannel, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {}
                override fun onFailure(reason: Int) {
                    val jsCall = "javascript:if(window.onNativePeersError) { window.onNativePeersError(${reason}); }"
                    webView.post { webView.evaluateJavascript(jsCall, null) }
                }
            })
        }

        @SuppressLint("MissingPermission")
        @JavascriptInterface
        fun connectToPeer(deviceAddress: String) {
            val config = WifiP2pConfig().apply {
                this.deviceAddress = deviceAddress
            }
            wifiP2pManager?.connect(wifiP2pChannel, config, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {
                    showToast("Connecting to Wi-Fi Direct device...")
                }
                override fun onFailure(reason: Int) {
                    showToast("Connection failed (code: $reason)")
                }
            })
        }

        @JavascriptInterface
        fun acquireWakeLock() {
            try {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "SuperShare::ActiveStreamLock"
                ).apply {
                    setReferenceCounted(false)
                    acquire(2 * 60 * 60 * 1000L)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun releaseWakeLock() {
            try {
                if (wakeLock?.isHeld == true) {
                    wakeLock?.release()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun startReceiveService(port: Int) {
            try {
                val serviceIntent = Intent(context, SuperShareReceiverService::class.java).apply {
                    putExtra("PORT", port)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @JavascriptInterface
        fun showToast(message: String) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkPermissionsSafely() {
        try {
            val permissions = mutableListOf<String>()
            permissions.add(Manifest.permission.CAMERA)
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
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(p2pReceiver)
        } catch (_: Exception) {}
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (_: Exception) {}
    }
}
