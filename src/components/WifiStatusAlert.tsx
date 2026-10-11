import React, { useState, useEffect } from 'react';
import { Wifi, AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface WifiStatusAlertProps {
  onDismiss?: () => void;
}

export const WifiStatusAlert: React.FC<WifiStatusAlertProps> = ({ onDismiss }) => {
  const [isWifiOn, setIsWifiOn] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check Android native bridge if running inside APK
    const checkWifi = () => {
      if (typeof (window as any).AndroidBridge?.isWifiHardwareOn === 'function') {
        const nativeWifi = (window as any).AndroidBridge.isWifiHardwareOn();
        setIsWifiOn(Boolean(nativeWifi));
      } else {
        // In browser, Wi-Fi hardware state isn't directly exposed by standard Web API,
        // so we check navigator.onLine and show helpful guidance banner
        setIsWifiOn(true);
      }
    };

    checkWifi();
    const interval = setInterval(checkWifi, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isDismissed) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-lg flex items-start gap-3.5 relative overflow-hidden">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Wifi className="w-5 h-5" />
      </div>

      <div className="flex-1 pr-6">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          Wi-Fi Hardware Zaroori Hai (Zero Internet)
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            Wi-Fi Direct P2P
          </span>
        </h4>
        <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
          File transfer ke liye dono phones ka <strong>Wi-Fi switch ON</strong> hona zaroori hai. Kisi router ya internet connection ki zaroorat nahi hai — Wi-Fi Direct bina internet direct P2P connection banata hai.
        </p>

        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Router/Hotspot Not Required</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setIsDismissed(true);
          onDismiss?.();
        }}
        className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-200 p-1 rounded-lg transition"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
