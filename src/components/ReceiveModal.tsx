import React, { useState, useEffect } from 'react';
import { X, Wifi, ShieldCheck, Cpu, HardDrive, Smartphone, Radio, Play } from 'lucide-react';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateIncoming: (fileName: string, sizeBytes: number) => void;
  tcpPort: number;
  chunkSizeKb: number;
  wakeLockEnabled: boolean;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  onClose,
  onSimulateIncoming,
  tcpPort,
  chunkSizeKb,
  wakeLockEnabled,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('192.168.49.1'); // Standard Android Wi-Fi Direct P2P Group Owner IP

  useEffect(() => {
    if (isOpen) {
      // Generate QR Code containing Wi-Fi Direct P2P connection payload
      const p2pPayload = JSON.stringify({
        app: 'SuperShare',
        mode: 'p2p_receiver',
        ip: ipAddress,
        port: tcpPort,
        chunkSize: chunkSizeKb,
        timestamp: Date.now(),
      });

      QRCode.toDataURL(p2pPayload, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [isOpen, ipAddress, tcpPort, chunkSizeKb]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Receive Mode Active</h3>
              <p className="text-xs text-slate-400">
                Wi-Fi Direct P2P Server • Port {tcpPort}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center">
          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-500/20 flex flex-col items-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="SuperShare P2P QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
                Generating P2P QR...
              </div>
            )}
            <p className="mt-2 text-[11px] font-semibold text-slate-700 tracking-wide">
              Scan with sender device to connect
            </p>
          </div>

          {/* Connection & Foreground Service Telemetry */}
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wi-Fi Direct IP</span>
              </div>
              <p className="text-xs font-mono font-bold text-white">
                {ipAddress}:{tcpPort}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Stream Buffer</span>
              </div>
              <p className="text-xs font-mono font-bold text-white">
                {chunkSizeKb} KB Chunks
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Foreground Svc</span>
              </div>
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active (dataSync)
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>WakeLock</span>
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {wakeLockEnabled ? 'Acquired (No Sleep)' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Quick Simulation to verify Stream receiving */}
          <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">
                Test Incoming Heavy Stream
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                P2P Demo
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Trigger a simulated incoming 450 MB 4K movie stream in {chunkSizeKb} KB byte slices to verify Foreground Service &amp; direct disk writing:
            </p>

            <button
              onClick={() => {
                onSimulateIncoming('4K_Cinematic_Movie_Master.mkv', 450 * 1024 * 1024);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Incoming 450 MB Stream</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close Receiver
          </button>
        </div>
      </div>
    </div>
  );
};
