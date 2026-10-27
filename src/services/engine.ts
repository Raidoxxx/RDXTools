import type { ImageResult, ProcessOptions } from '../types';
import { requiresBackground, targetDimensions } from '../utils/images';

type Canvas = OffscreenCanvas | HTMLCanvasElement;
async function encode(canvas: Canvas, options: ProcessOptions): Promise<Blob> {
  const blob = 'convertToBlob' in canvas
    ? await canvas.convertToBlob({ type: options.format, quality: options.quality })
    : await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Não foi possível exportar esta imagem.')), options.format, options.quality));
  if (blob.type !== options.format) throw new Error('Este navegador não consegue exportar o formato escolhido. Tente PNG ou JPG.');
  return blob;
}
export async function processImage(file: Blob, options: ProcessOptions, worker = false): Promise<ImageResult> {
  let source: ImageBitmap | HTMLImageElement;
  let temporaryUrl: string | undefined;
  if (typeof createImageBitmap === 'function') {
    try { source = await createImageBitmap(file); }
    catch { throw new Error('Imagem corrompida ou formato não reconhecido pelo navegador.'); }
  } else {
    temporaryUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = temporaryUrl;
    try { await img.decode(); } catch { URL.revokeObjectURL(temporaryUrl); throw new Error('Não foi possível abrir esta imagem.'); }
    source = img;
  }
  let canvas: Canvas | undefined;
  try {
    const { width, height } = targetDimensions(source.width, source.height, options);
    canvas = worker ? new OffscreenCanvas(width, height) : document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) throw new Error('Seu navegador não disponibilizou memória para a imagem.');
    if (requiresBackground(options.format)) {
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    const blob = await encode(canvas, options);
    const keptOriginal = options.mode === 'compress' && blob.size >= file.size;
    return { blob: keptOriginal ? file : blob, width, height, format: options.format, keptOriginal };
  } finally {
    if ('close' in source) source.close();
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }
}
