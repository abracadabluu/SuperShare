package com.supershare.offline

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.supershare.offline.service.SuperShareReceiverService

class MainActivity : AppCompatActivity() {

    private val selectFileLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            Toast.makeText(this, "Selected file ready for 64KB streaming", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            setContentView(R.layout.activity_main)

            val btnSend = findViewById<Button>(R.id.btnSend)
            val btnReceive = findViewById<Button>(R.id.btnReceive)
            val btnSettings = findViewById<ImageButton>(R.id.btnSettings)

            btnSend?.setOnClickListener {
                try {
                    selectFileLauncher.launch("*/*")
                } catch (e: Exception) {
                    Toast.makeText(this, "Unable to open file picker: \${e.message}", Toast.LENGTH_SHORT).show()
                }
            }

            btnReceive?.setOnClickListener {
                startReceiveMode()
            }

            btnSettings?.setOnClickListener {
                Toast.makeText(this, "SuperShare Settings: 64KB Buffer | Port 8888", Toast.LENGTH_SHORT).show()
            }

            checkPermissionsSafely()
        } catch (t: Throwable) {
            t.printStackTrace()
        }
    }

    private fun startReceiveMode() {
        try {
            val serviceIntent = Intent(this, SuperShareReceiverService::class.java).apply {
                putExtra("PORT", 8888)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            Toast.makeText(this, "SuperShare Receiver Active! Socket Port: 8888", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Service start error: \${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkPermissionsSafely() {
        try {
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
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
