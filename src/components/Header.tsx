import React from 'react';
import { Settings } from 'lucide-react';
import { SuperShareIcon } from './SuperShareIcon';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
      {/* Left: App Vector Icon & Name */}
      <div className="flex items-center gap-3">
        <SuperShareIcon size={34} />
        <h1 className="text-xl font-bold tracking-tight text-white">
          SuperShare
        </h1>
      </div>

      {/* Right: Settings button only */}
      <button
        onClick={onOpenSettings}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="Settings"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
};
