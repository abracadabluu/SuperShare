import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Camera,
  CheckCircle2,
  ArrowRight,
  Radio,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { QrCameraScanner } from './QrCameraScanner';

export interface PeerConnectionTarget {
  ip: string;
  port: number;
  pin: string;
  name?: string;
}

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSendRealFile: (file: File, target?: PeerConnectionTarget) => void;
  chunkSizeKb: number;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  onStartSendRealFile,
  chunkSizeKb,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiverPin, setReceiverPin] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [connectedPeerInfo, setConnectedPeerInfo] = useState<PeerConnectionTarget | null>(null);

  const [isScanningNearby, setIsScanningNearby] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for real Wi-Fi Direct peers discovered by Android native system
    (window as any).onNativePeersFound = (peers: Array<{ id: string; name: string }>) => {
      setIsScanningNearby(false);
      if (peers && peers.length > 0) {
        setDiscoveredDevices(peers);
        setScanStatusMessage(null);
      } else {
        setDiscoveredDevices([]);
        setScanStatusMessage('No Wi-Fi Direct devices detected nearby. Make sure Receiver phone is in Receive mode.');
      }
    };

    (window as any).onNativePeersError = (reason: number) => {
      setIsScanningNearby(false);
      setScanStatusMessage(`Wi-Fi Direct scan failed (code: ${reason}). Make sure Wi-Fi is turned on.`);
    };

    (window as any).onNativeP2pConnected = (info: any) => {
      const ownerIp = info.groupOwnerAddress || '192.168.49.1';
      setIsPeerConnected(true);
      setConnectedPeerInfo({
        ip: ownerIp,
        port: 8888,
        pin: 'P2P-DIRECT',
        name: 'Wi-Fi Direct Peer (' + ownerIp + ')',
      });
    };

    return () => {
      delete (window as any).onNativePeersFound;
      delete (window as any).onNativePeersError;
      delete (window as any).onNativeP2pConnected;
    };
  }, []);

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

  const handleScanSuccess = (decodedText: string) => {
    setIsCameraScannerOpen(false);
    try {
      const payload = JSON.parse(decodedText);
      if (payload.app === 'SuperShare' || payload.ip) {
        const target: PeerConnectionTarget = {
          ip: payload.ip || '192.168.49.1',
          port: payload.port || 8888,
          pin: payload.pin || '',
          name: `Receiver Phone (${payload.ip || '192.168.49.1'}:${payload.port || 8888})`,
        };
        setConnectedPeerInfo(target);
        setIsPeerConnected(true);
      } else {
        // Fallback generic peer
        const target: PeerConnectionTarget = {
          ip: '192.168.49.1',
          port: 8888,
          pin: decodedText.slice(0, 6),
          name: `Receiver (#${decodedText.slice(0, 6)})`,
        };
        setConnectedPeerInfo(target);
        setIsPeerConnected(true);
      }
    } catch (_e) {
      const target: PeerConnectionTarget = {
        ip: '192.168.49.1',
        port: 8888,
        pin: decodedText.slice(0, 6),
        name: `Receiver (#${decodedText.slice(0, 6)})`,
      };
      setConnectedPeerInfo(target);
      setIsPeerConnected(true);
    }
  };

  const handleConnectByPin = () => {
    if (receiverPin.trim().length >= 4) {
      const target: PeerConnectionTarget = {
        ip: '192.168.49.1',
        port: 8888,
        pin: receiverPin.trim(),
        name: `Receiver (#${receiverPin.trim()})`,
      };
      setConnectedPeerInfo(target);
      setIsPeerConnected(true);
    }
  };

  const handleDiscoverPeers = () => {
    setIsScanningNearby(true);
    setDiscoveredDevices([]);
    setScanStatusMessage(null);

    // Call real Android native WifiP2pManager if inside APK
    if (typeof (window as any).AndroidBridge?.discoverRealPeers === 'function') {
      (window as any).AndroidBridge.discoverRealPeers();
    } else {
      // In web browser without native bridge: inform user
      setTimeout(() => {
        setIsScanningNearby(false);
        setScanStatusMessage('Use "Scan Receiver QR Code" to pair devices directly.');
      }, 1000);
    }
  };

  const handleSelectDiscoveredDevice = (device: { id: string; name: string }) => {
    if (typeof (window as any).AndroidBridge?.connectToPeer === 'function') {
      (window as any).AndroidBridge.connectToPeer(device.id);
    } else {
      setIsPeerConnected(true);
      setConnectedPeerInfo({
        ip: '192.168.49.1',
        port: 8888,
        pin: 'P2P',
        name: device.name,
      });
    }
  };

  const totalChunks = selectedFile
    ? Math.ceil(selectedFile.size / (chunkSizeKb * 1024))
    : 0;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Send Offline File</h3>
              <p className="text-xs text-slate-400">
                Wi-Fi Direct P2P • {chunkSizeKb} KB Chunks
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
            {/* Step 1: Real Native File Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step 1: Choose File
                </span>
                {selectedFile && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    File Ready
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40 hover:bg-blue-500/5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Tap to pick real file from phone storage
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Videos, Photos, APKs, Music, Documents
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-blue-500/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
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

            {/* Step 2: Peer Connection / Scanner */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step 2: Connect to Receiver
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isPeerConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isPeerConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {isPeerConnected && connectedPeerInfo ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{connectedPeerInfo.name}</p>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        Target Socket: {connectedPeerInfo.ip}:{connectedPeerInfo.port}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsPeerConnected(false);
                      setConnectedPeerInfo(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Camera QR Scanner Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraScannerOpen(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Receiver QR Code (Camera Viewfinder)</span>
                  </button>

                  {/* Real Wi-Fi Direct Nearby Device Scan */}
                  <button
                    type="button"
                    onClick={handleDiscoverPeers}
                    disabled={isScanningNearby}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition cursor-pointer"
                  >
                    <Radio className={`w-4 h-4 text-emerald-400 ${isScanningNearby ? 'animate-spin' : ''}`} />
                    <span>{isScanningNearby ? 'Scanning Wi-Fi Direct Devices...' : 'Scan Nearby Devices (Wi-Fi Direct)'}</span>
                  </button>

                  {/* Scan Status message if no devices */}
                  {scanStatusMessage && (
                    <p className="text-[11px] text-slate-400 text-center px-2">
                      {scanStatusMessage}
                    </p>
                  )}

                  {/* Real Discovered Devices List */}
                  {discoveredDevices.length > 0 && (
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Nearby Wi-Fi Direct Devices Found:
                      </span>
                      {discoveredDevices.map((dev) => (
                        <div
                          key={dev.id}
                          onClick={() => handleSelectDiscoveredDevice(dev)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Smartphone className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold text-white">{dev.name}</span>
                          </div>
                          <span className="text-[11px] font-bold text-blue-400">Pair & Connect</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PIN Code Input */}
                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or enter Receiver PIN code"
                      value={receiverPin}
                      onChange={(e) => setReceiverPin(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleConnectByPin}
                      disabled={receiverPin.trim().length < 4}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        receiverPin.trim().length >= 4
                          ? 'bg-blue-600 text-white cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Pair
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Safety Note */}
            {!isPeerConnected && (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <span>
                  Receiver ke QR code ko scan karein ya 6-digit PIN enter karke connect karein.
                </span>
              </div>
            )}
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
              disabled={!selectedFile || !isPeerConnected}
              onClick={() => {
                if (selectedFile && isPeerConnected && connectedPeerInfo) {
                  onStartSendRealFile(selectedFile, connectedPeerInfo);
                  onClose();
                }
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition ${
                selectedFile && isPeerConnected
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Send File Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Camera Scanner Modal */}
      {isCameraScannerOpen && (
        <QrCameraScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsCameraScannerOpen(false)}
        />
      )}
    </>
  );
};
