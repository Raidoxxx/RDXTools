import type { ImageFormat, ProcessOptions } from '../types';

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PIXELS = 32_000_000;
export const MAX_SIDE = 16384;
export const FORMATS: { value: ImageFormat; label: string; extension: string }[] = [
  { value: 'image/jpeg', label: 'JPG', extension: 'jpg' },
  { value: 'image/png', label: 'PNG', extension: 'png' },
  { value: 'image/webp', label: 'WebP', extension: 'webp' },
  { value: 'image/avif', label: 'AVIF', extension: 'avif' },
];
export const defaultOptions: ProcessOptions = {
  mode: 'convert', format: 'image/webp', quality: 0.82, background: '#ffffff',
  width: 1200, height: 1200, keepRatio: true, resizeMode: 'dimensions', percent: 50,
};
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB`;
}
export function outputName(name: string, format: ImageFormat): string {
  const base = name.replace(/\.[^.]+$/, '') || 'imagem';
  return `${base}.${FORMATS.find(f => f.value === format)?.extension ?? 'png'}`;
}
export function savings(original: number, result: number): number {
  return original > 0 ? Math.max(0, Math.round((1 - result / original) * 100)) : 0;
}
export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return 'image/png';
  const text = new TextDecoder('ascii').decode(bytes);
  if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') return 'image/webp';
  return null;
}
export function validateDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error('Use dimensões entre 1 e 16.384 px e no máximo 32 megapixels.');
  }
}
export function targetDimensions(width: number, height: number, options: ProcessOptions) {
  validateDimensions(width, height);
  if (options.mode !== 'resize') return { width, height };
  let w: number, h: number;
  if (options.resizeMode === 'percent') {
    if (!Number.isFinite(options.percent) || options.percent < 1 || options.percent > 400) throw new Error('Escolha um percentual entre 1 e 400%.');
    w = Math.max(1, Math.round(width * options.percent / 100));
    h = Math.max(1, Math.round(height * options.percent / 100));
  } else if (options.keepRatio) {
    validateDimensions(options.width, options.height);
    const scale = Math.min(options.width / width, options.height / height);
    w = Math.max(1, Math.round(width * scale));
    h = Math.max(1, Math.round(height * scale));
  } else {
    w = Math.round(options.width);
    h = Math.round(options.height);
  }
  validateDimensions(w, h);
  return { width: w, height: h };
}
export function requiresBackground(format: ImageFormat) { return format === 'image/jpeg'; }
export async function inspectFile(file: File): Promise<ImageFormat> {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: o limite de segurança é de 40 MB por imagem.`);
  const format = detectFormat(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
  if (!format) throw new Error(`${file.name}: selecione um arquivo PNG, JPG ou WebP válido.`);
  return format;
}
