/**
 * SuperShare - Offline High-Speed Heavy File Transfer
 * Real P2P 64 KB Chunked Stream Engine
 */

import React, { useState } from 'react';
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

  const handleStartSendRealFile = async (file: File, _target?: PeerConnectionTarget) => {
    setTransferRole('sender');
    setDownloadUrl(null);

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
