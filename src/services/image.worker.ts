import { processImage } from './engine';
import type { ProcessOptions } from '../types';

self.onmessage = async (event: MessageEvent<{ file: File; options: ProcessOptions }>) => {
  try { self.postMessage({ result: await processImage(event.data.file, event.data.options, true) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Falha ao processar a imagem.' }); }
};
