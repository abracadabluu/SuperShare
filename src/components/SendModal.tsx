import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image, Music, Package, File, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { PeerDevice } from '../types/transfer';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSend: (file: File | { name: string; size: number; type: string }) => void;
  chunkSizeKb: number;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  onStartSend,
  chunkSizeKb,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    file?: File;
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'pick' | 'sample'>('pick');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    }
  };

  // Sample heavy multimedia files to test 64KB chunk buffer live
  const sampleHeavyFiles = [
    {
      name: '4K_Drone_Cinematic_Video.mp4',
      size: 280 * 1024 * 1024, // 280 MB
      type: 'video/mp4',
      icon: Film,
      color: 'text-rose-400 bg-rose-500/10',
    },
    {
      name: 'Game_Resource_Assets_v2.obb',
      size: 720 * 1024 * 1024, // 720 MB
      type: 'application/octet-stream',
      icon: Package,
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      name: 'SuperShare_Installer.apk',
      size: 48 * 1024 * 1024, // 48 MB
      type: 'application/vnd.android.package-archive',
      icon: Package,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      name: 'Lossless_Soundtrack_HiRes.flac',
      size: 145 * 1024 * 1024, // 145 MB
      type: 'audio/flac',
      icon: Music,
      color: 'text-indigo-400 bg-indigo-500/10',
    },
  ];

  const handleSelectSample = (sample: typeof sampleHeavyFiles[0]) => {
    setSelectedFile({
      name: sample.name,
      size: sample.size,
      type: sample.type,
    });
  };

  const totalChunks = selectedFile
    ? Math.ceil(selectedFile.size / (chunkSizeKb * 1024))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Send Offline File</h3>
            <p className="text-xs text-slate-400">
              Wi-Fi Direct P2P • {chunkSizeKb} KB Continuous Buffer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-slate-950/50 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('pick')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'pick'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Device Storage (Phone)
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'sample'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Heavy Media Benchmarks
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'pick' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleNativeFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/30 hover:bg-blue-500/5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Tap to browse heavy files on this phone
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Videos, Large Archives, APKs, Photos (Any size)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-400 mb-1">
                Select a heavy multimedia workload to test 64 KB streaming:
              </p>
              {sampleHeavyFiles.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedFile?.name === s.name;
                return (
                  <div
                    key={s.name}
                    onClick={() => handleSelectSample(s)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/50'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{s.name}</p>
                        <p className="text-[11px] text-slate-400">{formatBytes(s.size)}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected File Details & 64 KB Chunks Breakdown */}
          {selectedFile && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-2">
                Transfer Payload Metadata
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">File Name:</span>
                <span className="text-white font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-slate-400">Total Size:</span>
                <span className="text-white font-medium">
                  {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString()} bytes)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-slate-400">Stream Buffer Size:</span>
                <span className="text-emerald-400 font-mono font-medium">
                  {chunkSizeKb} KB ({chunkSizeKb * 1024} bytes/slice)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-slate-400">Calculated Stream Slices:</span>
                <span className="text-blue-400 font-mono font-bold">
                  {totalChunks.toLocaleString()} chunks
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero RAM crash protection: file is piped in continuous slices.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            disabled={!selectedFile}
            onClick={() => {
              if (selectedFile) {
                onStartSend(selectedFile.file || selectedFile);
                onClose();
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFile
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Start 64KB Stream</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
