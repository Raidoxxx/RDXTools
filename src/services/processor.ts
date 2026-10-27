import type { ImageFormat, ImageResult, ProcessOptions } from '../types';
import { processImage } from './engine';

export async function supportedFormats(): Promise<ImageFormat[]> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const formats: ImageFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const results = await Promise.all(formats.map(format => new Promise<ImageFormat | null>(resolve => {
    canvas.toBlob(blob => resolve(blob?.type === format ? format : null), format);
  })));
  return results.filter((f): f is ImageFormat => f !== null);
}
export function runImage(file: File, options: ProcessOptions, signal: AbortSignal): Promise<ImageResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelado', 'AbortError')); return; }
    let worker: Worker | undefined;
    let settled = false;
    const finish = (error?: unknown, result?: ImageResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker?.terminate();
      if (error) reject(error); else if (result) resolve(result);
    };
    const abort = () => finish(new DOMException('Cancelado', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('O processamento demorou demais. Tente uma imagem menor.')), 90_000);
    signal.addEventListener('abort', abort, { once: true });
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {
      try {
        worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<{ error?: string; result?: ImageResult }>) => finish(event.data.error ? new Error(event.data.error) : undefined, event.data.result);
        worker.onerror = () => finish(new Error('Não foi possível iniciar o processamento local. Recarregue a página.'));
        worker.postMessage({ file, options });
      } catch (error) { finish(error); }
    } else {
      void processImage(file, options).then(result => finish(undefined, result), finish);
    }
  });
}
