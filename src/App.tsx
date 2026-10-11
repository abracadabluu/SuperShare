/**
 * SuperShare - Offline High-Speed Heavy File Transfer
 * Real P2P 64 KB Chunked Stream Engine
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MainActions } from './components/MainActions';
import { SendModal, PeerConnectionTarget } from './components/SendModal';
import { ReceiveModal } from './components/ReceiveModal';
import { SettingsModal } from './components/SettingsModal';
import { TransferProgress } from './components/TransferProgress';
import { AppSettings, TransferProgress as ITransferProgress } from './types/transfer';
import { realP2p } from './services/realP2pEngine';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>({
    chunkSizeKb: 64,
    tcpPort: 8888,
    wakeLockEnabled: true,
    foregroundServiceEnabled: true,
    storageFolder: '/storage/emulated/0/Download/SuperShare',
    deviceName: 'SuperShare Android',
    autoAcceptIncoming: true,
    soundOnComplete: true,
  });

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeTransfer, setActiveTransfer] = useState<ITransferProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [transferRole, setTransferRole] = useState<'sender' | 'receiver'>('sender');

  useEffect(() => {
    // 1. Listen for real-time incoming stream on Receiver phone
    (window as any).onNativeReceiveStreamUpdate = (data: any) => {
      setIsReceiveOpen(false); // Switch from QR code modal to live progress screen!
      setTransferRole('receiver');

      const totalSize = data.fileSize || 1;
      const bytesRecv = data.bytesReceived || 0;
      const percent = Math.min(100, Math.round((bytesRecv / totalSize) * 100));
      const totalChunks = Math.ceil(totalSize / (settings.chunkSizeKb * 1024));
      const chunksRecv = Math.ceil(bytesRecv / (settings.chunkSizeKb * 1024));

      setActiveTransfer({
        fileId: 'native_recv_' + (data.fileName || 'file'),
        fileName: data.fileName || 'Receiving File...',
        fileSize: totalSize,
        transferredBytes: bytesRecv,
        percentage: percent,
        chunksTransferred: chunksRecv,
        totalChunks,
        speedBytesPerSec: 35 * 1024 * 1024,
        estimatedSecondsRemaining: percent === 100 ? 0 : Math.max(1, Math.round((totalSize - bytesRecv) / (35 * 1024 * 1024))),
        status: data.status === 'completed' ? 'completed' : data.status === 'error' ? 'error' : 'transferring',
        wakeLockActive: true,
      });

      if (data.status === 'completed') {
        setDownloadUrl(data.filePath || null);
      }
    };

    // 2. Listen for native socket sender progress on Sender phone
    (window as any).onNativeSenderProgress = (fileName: string, sentBytes: number, totalBytes: number, percent: number, speedMBps: number) => {
      setTransferRole('sender');
      const totalChunks = Math.ceil(totalBytes / (settings.chunkSizeKb * 1024));
      const chunksSent = Math.ceil(sentBytes / (settings.chunkSizeKb * 1024));

      setActiveTransfer({
        fileId: 'native_send_' + fileName,
        fileName,
        fileSize: totalBytes,
        transferredBytes: sentBytes,
        percentage: percent,
        chunksTransferred: chunksSent,
        totalChunks,
        speedBytesPerSec: (speedMBps || 35) * 1024 * 1024,
        estimatedSecondsRemaining: percent === 100 ? 0 : Math.max(1, Math.round((totalBytes - sentBytes) / (((speedMBps || 35)) * 1024 * 1024))),
        status: percent >= 100 ? 'completed' : 'transferring',
        wakeLockActive: true,
      });
    };

    (window as any).onNativeSenderCompleted = (fileName: string) => {
      setActiveTransfer((prev) => prev ? { ...prev, percentage: 100, status: 'completed' } : null);
    };

    return () => {
      delete (window as any).onNativeReceiveStreamUpdate;
      delete (window as any).onNativeSenderProgress;
      delete (window as any).onNativeSenderCompleted;
    };
  }, [settings.chunkSizeKb]);

  const handleStartSendRealFile = async (file: File, target?: PeerConnectionTarget) => {
    setTransferRole('sender');
    setDownloadUrl(null);

    const targetIp = target?.ip || '192.168.49.1';
    const targetPort = target?.port || settings.tcpPort || 8888;

    // Check if inside Android APK with native socket bridge
    if (typeof (window as any).AndroidBridge?.sendFileViaSocket === 'function') {
      const totalChunks = Math.ceil(file.size / (settings.chunkSizeKb * 1024));
      setActiveTransfer({
        fileId: 'native_send_' + file.name,
        fileName: file.name,
        fileSize: file.size,
        transferredBytes: 0,
        percentage: 0,
        chunksTransferred: 0,
        totalChunks,
        speedBytesPerSec: 0,
        estimatedSecondsRemaining: 1,
        status: 'transferring',
        wakeLockActive: settings.wakeLockEnabled,
      });

      (window as any).AndroidBridge.sendFileViaSocket(targetIp, targetPort, file.name, file.size);
      return;
    }

    // Web / browser fallback
    await realP2p.startSender(file, (stats) => {
      setActiveTransfer({
        fileId: 'transfer_' + Date.now(),
        fileName: stats.fileName,
        fileSize: stats.fileSize,
        transferredBytes: stats.bytesTransferred,
        percentage: stats.percentage,
        chunksTransferred: stats.chunksTransferred,
        totalChunks: stats.totalChunks,
        speedBytesPerSec: stats.speedMBps * 1024 * 1024,
        estimatedSecondsRemaining: stats.etaSeconds,
        status: stats.status === 'completed' ? 'completed' : 'transferring',
        wakeLockActive: settings.wakeLockEnabled,
      });
    });
  };

  const handleCancelTransfer = () => {
    realP2p.cancel();
    setActiveTransfer(null);
    setDownloadUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Minimalist Top Header: Vector Icon, App Name & Settings */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-3xl w-full mx-auto">
        {/* Active Real File Transfer Stream Tracker */}
        {activeTransfer && (
          <div className="w-full max-w-xl my-4">
            <TransferProgress
              progress={activeTransfer}
              downloadUrl={downloadUrl}
              role={transferRole}
              onCancel={handleCancelTransfer}
              onDone={() => {
                setActiveTransfer(null);
                setDownloadUrl(null);
              }}
            />
          </div>
        )}

        {/* Homepage Large Send and Receive Buttons + Technical Pills */}
        <MainActions
          onSendClick={() => setIsSendOpen(true)}
          onReceiveClick={() => setIsReceiveOpen(true)}
          chunkSizeKb={settings.chunkSizeKb}
        />
      </main>

      {/* Modals for Real File Operations */}
      <SendModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onStartSendRealFile={handleStartSendRealFile}
        chunkSizeKb={settings.chunkSizeKb}
      />

      <ReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        tcpPort={settings.tcpPort}
        chunkSizeKb={settings.chunkSizeKb}
        wakeLockEnabled={settings.wakeLockEnabled}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
      />
    </div>
  );
}
