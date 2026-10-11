import { FileMetadata, TransferProgress } from '../types/transfer';

export class SuperShareEngine {
  private wakeLockSentinel: any = null;
  private isCancelled: boolean = false;

  /**
   * Acquire WakeLock so screen and CPU stay awake during heavy file streaming
   */
  async acquireWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        return true;
      }
    } catch (err) {
      console.warn('WakeLock could not be acquired:', err);
    }
    return false;
  }

  /**
   * Release WakeLock after transfer completion or cancel
   */
  releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (_e) {}
      this.wakeLockSentinel = null;
    }
  }

  cancelTransfer(): void {
    this.isCancelled = true;
    this.releaseWakeLock();
  }

  /**
   * Stream a file using 64 KB chunk stream buffer
   * Simulates/executes continuous raw chunk streaming directly without holding the full file in RAM.
   */
  async streamFile(
    file: File | { name: string; size: number; type: string; fakeContent?: boolean },
    chunkSizeKb: number,
    onProgress: (progress: TransferProgress) => void
  ): Promise<void> {
    this.isCancelled = false;
    const chunkSize = chunkSizeKb * 1024;
    const totalBytes = file.size;
    const totalChunks = Math.ceil(totalBytes / chunkSize);
    const startTime = Date.now();
    let transferredBytes = 0;
    let chunksTransferred = 0;

    const wakeLockActive = await this.acquireWakeLock();

    // 1. Send Metadata Header First
    onProgress({
      fileId: 'stream_' + Date.now(),
      fileName: file.name,
      fileSize: totalBytes,
      transferredBytes: 0,
      percentage: 0,
      chunksTransferred: 0,
      totalChunks,
      speedBytesPerSec: 0,
      estimatedSecondsRemaining: 0,
      status: 'waiting_metadata',
      wakeLockActive,
      startTime
    });

    // Small delay to simulate TCP handshake & metadata receipt
    await new Promise(r => setTimeout(r, 400));

    onProgress({
      fileId: 'stream_' + Date.now(),
      fileName: file.name,
      fileSize: totalBytes,
      transferredBytes: 0,
      percentage: 0,
      chunksTransferred: 0,
      totalChunks,
      speedBytesPerSec: 0,
      estimatedSecondsRemaining: 0,
      status: 'transferring',
      wakeLockActive,
      startTime
    });

    let lastProgressTime = Date.now();
    let bytesSinceLastCheck = 0;
    let currentSpeed = 0;

    // 2. Continuous 64 KB Chunk Loop
    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      if (this.isCancelled) {
        onProgress({
          fileId: 'stream_cancel',
          fileName: file.name,
          fileSize: totalBytes,
          transferredBytes,
          percentage: Math.round((transferredBytes / totalBytes) * 100),
          chunksTransferred,
          totalChunks,
          speedBytesPerSec: 0,
          estimatedSecondsRemaining: 0,
          status: 'idle',
          errorMessage: 'Transfer cancelled by user',
          wakeLockActive: false
        });
        return;
      }

      const currentChunkBytes = Math.min(chunkSize, totalBytes - offset);

      // If real File object, slice 64 KB from disk without loading full file into memory
      if ('slice' in file && typeof (file as any).slice === 'function') {
        const slice = (file as File).slice(offset, offset + currentChunkBytes);
        // Simulate reading the array buffer for transmission
        await slice.arrayBuffer();
      }

      transferredBytes += currentChunkBytes;
      chunksTransferred++;
      bytesSinceLastCheck += currentChunkBytes;

      const now = Date.now();
      const timeDelta = (now - lastProgressTime) / 1000;

      // Yield every few chunks or 40ms to simulate Wi-Fi Direct socket throughput (approx 25-60 MB/s)
      if (chunksTransferred % 10 === 0 || transferredBytes === totalBytes) {
        if (timeDelta > 0.08) {
          currentSpeed = bytesSinceLastCheck / timeDelta;
          bytesSinceLastCheck = 0;
          lastProgressTime = now;
        }

        const remainingBytes = totalBytes - transferredBytes;
        const eta = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : 0;
        const percentage = Math.min(100, Math.round((transferredBytes / totalBytes) * 100));

        onProgress({
          fileId: 'stream_' + startTime,
          fileName: file.name,
          fileSize: totalBytes,
          transferredBytes,
          percentage,
          chunksTransferred,
          totalChunks,
          speedBytesPerSec: currentSpeed || 32 * 1024 * 1024,
          estimatedSecondsRemaining: eta,
          status: transferredBytes >= totalBytes ? 'completed' : 'transferring',
          wakeLockActive,
          startTime
        });

        // Simulate high-speed local TCP stream pacing (5ms throttle per burst)
        await new Promise(r => setTimeout(r, 6));
      }
    }

    this.releaseWakeLock();

    onProgress({
      fileId: 'stream_' + startTime,
      fileName: file.name,
      fileSize: totalBytes,
      transferredBytes: totalBytes,
      percentage: 100,
      chunksTransferred: totalChunks,
      totalChunks,
      speedBytesPerSec: currentSpeed,
      estimatedSecondsRemaining: 0,
      status: 'completed',
      wakeLockActive: false,
      startTime
    });
  }
}

export const globalEngine = new SuperShareEngine();
