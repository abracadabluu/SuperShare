import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Zap, HardDrive, Cpu } from 'lucide-react';

interface MainActionsProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
  chunkSizeKb: number;
}

export const MainActions: React.FC<MainActionsProps> = ({
  onSendClick,
  onReceiveClick,
  chunkSizeKb,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Visual Subtitle & Device Badge */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
          Direct Device-to-Device Sharing
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Transfer GBs of multimedia files at high speeds without internet.
        </p>
      </div>

      {/* Large Send & Receive Buttons Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {/* Large SEND Button */}
        <button
          onClick={onSendClick}
          className="group relative flex flex-col items-start justify-between p-7 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden border border-blue-400/30 text-left min-h-[220px]"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />

          {/* Top row with icon & indicator */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
              Sender Mode
            </span>
          </div>

          {/* Bottom row with title & info */}
          <div className="z-10 mt-6">
            <span className="text-xs text-blue-200 uppercase tracking-widest font-semibold block mb-1">
              Wi-Fi Direct TCP
            </span>
            <span className="text-3xl font-extrabold tracking-tight text-white block">
              SEND
            </span>
            <p className="text-xs text-blue-100/80 mt-1 line-clamp-2">
              Select videos, apps, or heavy files to stream in {chunkSizeKb} KB chunks
            </p>
          </div>
        </button>

        {/* Large RECEIVE Button */}
        <button
          onClick={onReceiveClick}
          className="group relative flex flex-col items-start justify-between p-7 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/25 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden border border-emerald-400/30 text-left min-h-[220px]"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />

          {/* Top row with icon & indicator */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>Ready</span>
            </div>
          </div>

          {/* Bottom row with title & info */}
          <div className="z-10 mt-6">
            <span className="text-xs text-emerald-200 uppercase tracking-widest font-semibold block mb-1">
              Foreground Socket
            </span>
            <span className="text-3xl font-extrabold tracking-tight text-white block">
              RECEIVE
            </span>
            <p className="text-xs text-emerald-100/80 mt-1 line-clamp-2">
              Wait for incoming P2P connection with WakeLock &amp; auto-save to storage
            </p>
          </div>
        </button>
      </div>

      {/* Technical Architecture Feature Pills */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
          <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-200">Wi-Fi Direct</span>
          <span className="text-[11px] text-slate-400">Zero Internet</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
          <Cpu className="w-4 h-4 text-blue-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-200">{chunkSizeKb} KB Chunks</span>
          <span className="text-[11px] text-slate-400">Stream Buffer</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
          <HardDrive className="w-4 h-4 text-emerald-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-200">Zero RAM Crash</span>
          <span className="text-[11px] text-slate-400">Direct Disk I/O</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
          <ShieldCheck className="w-4 h-4 text-purple-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-200">WakeLock</span>
          <span className="text-[11px] text-slate-400">Foreground Keepalive</span>
        </div>
      </div>
    </div>
  );
};
