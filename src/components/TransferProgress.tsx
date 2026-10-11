import React from 'react';
import { TransferProgress as ITransferProgress } from '../types/transfer';
import { CheckCircle2, AlertCircle, ShieldAlert, Cpu, Activity, Clock, FileText, X } from 'lucide-react';

interface TransferProgressProps {
  progress: ITransferProgress;
  downloadUrl?: string | null;
  role?: 'sender' | 'receiver';
  onCancel: () => void;
  onDone: () => void;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({
  progress,
  downloadUrl,
  role = 'sender',
  onCancel,
  onDone,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const speedMBps = (progress.speedBytesPerSec / (1024 * 1024)).toFixed(1);
  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background glowing indicator */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isCompleted ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-blue-500'
        }`}
      />

      {/* Top Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isError
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : isError ? (
              <AlertCircle className="w-6 h-6 text-rose-400" />
            ) : (
              <FileText className="w-6 h-6 text-blue-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white truncate max-w-[220px] sm:max-w-xs">
              {progress.fileName}
            </h3>
            <p className="text-xs text-slate-400">
              {formatBytes(progress.transferredBytes)} of {formatBytes(progress.fileSize)}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {progress.wakeLockActive && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WakeLock ON
            </span>
          )}

          {!isCompleted && !isError && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cancel Transfer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Percentage & Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {progress.percentage}%
          </span>
          <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {isCompleted ? 'Finished' : `${speedMBps} MB/s`}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-sm shadow-blue-500/50'
            }`}
            style={{ width: `${Math.max(2, progress.percentage)}%` }}
          />
        </div>
      </div>

      {/* 64 KB Chunk Streaming Technical Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-blue-400" />
            64 KB Chunks
          </span>
          <span className="text-xs font-mono font-bold text-slate-200">
            {progress.chunksTransferred.toLocaleString()} / {progress.totalChunks.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Estimated Time
          </span>
          <span className="text-xs font-mono font-bold text-slate-200">
            {isCompleted ? '0s' : `${progress.estimatedSecondsRemaining}s left`}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            RAM Buffer
          </span>
          <span className="text-xs font-medium text-emerald-400">
            Safe (Direct Stream)
          </span>
        </div>
      </div>

      {/* Bottom status note and download action */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          {isCompleted
            ? role === 'receiver'
              ? 'File received! Tap below to save to device storage.'
              : 'File streamed successfully to receiver over 64 KB chunks.'
            : 'Streaming continuous raw byte chunks over P2P socket...'}
        </span>

        <div className="flex items-center gap-2">
          {isCompleted && downloadUrl && (
            <a
              href={downloadUrl}
              download={progress.fileName}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <span>Save File</span>
            </a>
          )}

          {isCompleted && (
            <button
              onClick={onDone}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
