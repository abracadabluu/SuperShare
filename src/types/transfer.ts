export interface FileMetadata {
  id: string;
  name: string;
  size: number; // in bytes
  type: string;
  lastModified?: number;
}

export interface TransferProgress {
  fileId: string;
  fileName: string;
  fileSize: number;
  transferredBytes: number;
  percentage: number;
  chunksTransferred: number;
  totalChunks: number;
  speedBytesPerSec: number;
  estimatedSecondsRemaining: number;
  status: 'idle' | 'connecting' | 'waiting_metadata' | 'transferring' | 'completed' | 'paused' | 'error';
  errorMessage?: string;
  wakeLockActive: boolean;
  startTime?: number;
}

export interface AppSettings {
  chunkSizeKb: number; // default 64
  tcpPort: number; // default 8888
  wakeLockEnabled: boolean;
  foregroundServiceEnabled: boolean;
  storageFolder: string;
  deviceName: string;
  autoAcceptIncoming: boolean;
  soundOnComplete: boolean;
}

export interface PeerDevice {
  id: string;
  name: string;
  ipAddress?: string;
  isHost: boolean;
  status: 'available' | 'connecting' | 'connected' | 'disconnected';
  signalStrength?: number;
}
