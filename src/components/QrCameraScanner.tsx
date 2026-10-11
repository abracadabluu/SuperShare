import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';

interface QrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QrCameraScanner: React.FC<QrCameraScannerProps> = ({ onScanSuccess, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scannerId = 'super-share-qr-reader';
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setErrorMessage(null);

        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback
            try {
              html5QrCode?.stop().then(() => {
                html5QrCode?.clear();
              }).catch(() => {});
            } catch (_e) {}
            onScanSuccess(decodedText);
          },
          () => {
            // QR code scanning in progress (no error)
          }
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Camera QR scanner error:', err);
        setIsInitializing(false);
        setErrorMessage(
          err?.message || 'Unable to access camera. Please allow camera permissions.'
        );
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
          } else {
            scannerRef.current.clear();
          }
        } catch (_e) {}
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Scan Receiver QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black border-2 border-blue-500/50 shadow-inner flex items-center justify-center">
            <div id="super-share-qr-reader" className="w-full h-full object-cover" />

            {isInitializing && !errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs font-medium">Starting Camera...</span>
              </div>
            )}

            {/* Target Reticle Overlay */}
            {!errorMessage && (
              <div className="absolute inset-8 pointer-events-none border-2 border-white/40 rounded-xl flex items-center justify-center">
                <div className="w-full h-0.5 bg-blue-500/80 animate-pulse shadow-sm shadow-blue-400" />
              </div>
            )}
          </div>

          {errorMessage ? (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Camera Access Blocked</p>
                <p className="mt-0.5 text-[11px] text-rose-300/80">
                  {errorMessage}
                </p>
                <p className="mt-2 text-[11px] text-slate-300">
                  Tip: You can also use the 6-digit PIN code on the Sender screen.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400 text-center">
              Point your camera at the QR code displayed on the Receiver phone.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
