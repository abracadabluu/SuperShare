package com.supershare.offline.p2p

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
            override fun onSuccess() {}
            override fun onFailure(reasonCode: Int) {
                onError("Wi-Fi Direct discovery failed with code: \$reasonCode")
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
            override fun onSuccess() {}
            override fun onFailure(reason: Int) {
                onError("Failed to initiate connection: \$reason")
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
