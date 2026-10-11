/**
 * SuperShare - Offline High-Speed Heavy File Transfer
 * Wi-Fi Direct (P2P) & 64 KB Chunked Stream Buffer Engine
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { MainActions } from './components/MainActions';
import { SendModal } from './components/SendModal';
import { ReceiveModal } from './components/ReceiveModal';
import { SettingsModal } from './components/SettingsModal';
import { TransferProgress } from './components/TransferProgress';
import { AppSettings, TransferProgress as ITransferProgress } from './types/transfer';
import { globalEngine } from './services/transferEngine';

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

  const handleStartSend = (file: File | { name: string; size: number; type: string }) => {
    globalEngine.streamFile(file, settings.chunkSizeKb, (progress) => {
      setActiveTransfer(progress);
    });
  };

  const handleSimulateIncoming = (fileName: string, sizeBytes: number) => {
    globalEngine.streamFile(
      { name: fileName, size: sizeBytes, type: 'video/mp4' },
      settings.chunkSizeKb,
      (progress) => {
        setActiveTransfer(progress);
      }
    );
  };

  const handleCancelTransfer = () => {
    globalEngine.cancelTransfer();
    setActiveTransfer(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Minimalist Top Header: Only App Name and Settings Button */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-3xl w-full mx-auto">
        {/* Active Transfer Stream Tracker if currently transferring */}
        {activeTransfer && (
          <div className="w-full max-w-xl my-4">
            <TransferProgress
              progress={activeTransfer}
              onCancel={handleCancelTransfer}
              onDone={() => setActiveTransfer(null)}
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

      {/* Modals */}
      <SendModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onStartSend={handleStartSend}
        chunkSizeKb={settings.chunkSizeKb}
      />

      <ReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onSimulateIncoming={handleSimulateIncoming}
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
