import React, { useState, useEffect } from 'react';
import { X, Wifi, ShieldCheck, Cpu, HardDrive, Radio, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  tcpPort: number;
  chunkSizeKb: number;
  wakeLockEnabled: boolean;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  onClose,
  tcpPort,
  chunkSizeKb,
  wakeLockEnabled,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('582419');

  useEffect(() => {
    if (isOpen) {
      // Generate random 6-digit PIN for pairing
      const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
      setPinCode(randomPin);

      // Real P2P payload
      const p2pPayload = JSON.stringify({
        app: 'SuperShare',
        action: 'receive_ready',
        pin: randomPin,
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
  }, [isOpen, tcpPort, chunkSizeKb]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Receive Mode Ready</h3>
              <p className="text-xs text-slate-400">
                P2P Offline Listener • Port {tcpPort}
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
        <div className="p-6 overflow-y-auto space-y-5 flex flex-col items-center text-center">
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
            <p className="mt-2 text-[11px] font-semibold text-slate-700 tracking-wide flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              Scan on Sender phone to pair
            </p>
          </div>

          {/* 6-Digit PIN Pairing Alternative */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Or Enter 6-Digit Code on Sender Phone
            </span>
            <div className="flex items-center justify-center gap-2 font-mono text-2xl font-extrabold text-emerald-400 tracking-widest my-1">
              <span>{pinCode.slice(0, 3)}</span>
              <span className="text-slate-600">-</span>
              <span>{pinCode.slice(3, 6)}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sender will stream real files directly in {chunkSizeKb} KB slices.
            </p>
          </div>

          {/* Live Status Indicators */}
          <div className="w-full grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>WakeLock</span>
              </div>
              <p className="text-xs font-semibold text-emerald-400">
                {wakeLockEnabled ? 'Active (Screen Awake)' : 'Disabled'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Stream Buffer</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 font-mono">
                {chunkSizeKb} KB Continuous
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
