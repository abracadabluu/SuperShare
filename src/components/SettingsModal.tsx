import React from 'react';
import { X, HardDrive, Shield, Cpu, Smartphone, Folder, HelpCircle } from 'lucide-react';
import { AppSettings } from '../types/transfer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">SuperShare Settings</h3>
            <p className="text-xs text-slate-400">Configure P2P socket and stream buffer</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Chunk Buffer Size (64 KB by default) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                Stream Chunk Buffer Size
              </label>
              <span className="text-xs font-mono font-bold text-blue-400">
                {settings.chunkSizeKb} KB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Standard 64 KB ensures smooth socket throughput while preventing Android RAM exhaustion on 1GB+ files.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[32, 64, 128].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ chunkSizeKb: size })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    settings.chunkSizeKb === size
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {size} KB {size === 64 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Local TCP Socket Port */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Local TCP Socket Server Port
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Sender and Receiver connect over this port over Wi-Fi Direct.
            </p>
            <input
              type="number"
              value={settings.tcpPort}
              onChange={(e) => onUpdateSettings({ tcpPort: parseInt(e.target.value) || 8888 })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* WakeLock Toggle */}
          <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                Keep Awake (WakeLock API)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prevents CPU/screen sleep during heavy file streams
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.wakeLockEnabled}
              onChange={(e) => onUpdateSettings({ wakeLockEnabled: e.target.checked })}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Foreground Service Toggle */}
          <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Android Foreground Service
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Runs background dataSync service with persistent notification
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.foregroundServiceEnabled}
              onChange={(e) => onUpdateSettings({ foregroundServiceEnabled: e.target.checked })}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          {/* Save Destination Path */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
              <Folder className="w-4 h-4 text-yellow-400" />
              Download Directory
            </span>
            <input
              type="text"
              value={settings.storageFolder}
              onChange={(e) => onUpdateSettings({ storageFolder: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition cursor-pointer"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
