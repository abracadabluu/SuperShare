import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSendRealFile: (file: File, receiverCode?: string) => void;
  chunkSizeKb: number;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  onStartSendRealFile,
  chunkSizeKb,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiverCode, setReceiverCode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const totalChunks = selectedFile
    ? Math.ceil(selectedFile.size / (chunkSizeKb * 1024))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Send Real Files</h3>
            <p className="text-xs text-slate-400">
              Direct P2P Stream • {chunkSizeKb} KB Chunks
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Real Native File Selector */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40 hover:bg-blue-500/5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Tap to choose a real file from your phone
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Videos, Photos, APKs, Music, Documents (Any size)
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-blue-500/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(selectedFile.size)} • {totalChunks.toLocaleString()} chunks ({chunkSizeKb} KB each)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Receiver Pairing Code Input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Receiver 6-Digit Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 529140 (Or leave empty for auto-pair)"
              value={receiverCode}
              onChange={(e) => setReceiverCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono tracking-wider"
              maxLength={6}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Enter the 6-digit code shown on the Receiver screen, or connect directly on local network.
            </p>
          </div>

          {/* Technical Info */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Actual real bytes streamed directly to receiver with zero RAM overflow.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
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
                onStartSendRealFile(selectedFile, receiverCode);
                onClose();
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFile
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Send File Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
