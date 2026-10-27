export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
export type ToolMode = 'convert' | 'compress' | 'resize';
export interface ProcessOptions {
  mode: ToolMode;
  format: ImageFormat;
  quality: number;
  background: string;
  width: number;
  height: number;
  keepRatio: boolean;
  resizeMode: 'dimensions' | 'percent';
  percent: number;
}
export interface ImageResult {
  blob: Blob;
  width: number;
  height: number;
  format: ImageFormat;
  keptOriginal: boolean;
}
export interface QueueItem {
  id: string;
  file: File;
  format: ImageFormat;
  preview: string;
  status: 'ready' | 'processing' | 'done' | 'error' | 'cancelled';
  result?: ImageResult & { url: string; name: string };
  error?: string;
}
