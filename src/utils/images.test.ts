import { describe, expect, it } from 'vitest';
import { defaultOptions, detectFormat, inspectFile, MAX_FILE_BYTES, outputName, requiresBackground, savings, targetDimensions } from './images';

describe('formatos e arquivos', () => {
  it('identifica conteúdo real sem confiar na extensão', () => {
    expect(detectFormat(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(detectFormat(new Uint8Array([255, 216, 255, 224]))).toBe('image/jpeg');
    expect(detectFormat(new TextEncoder().encode('RIFF0000WEBPVP8 '))).toBe('image/webp');
    expect(detectFormat(new TextEncoder().encode('<svg>'))).toBeNull();
    expect(detectFormat(new Uint8Array())).toBeNull();
  });
  it('preserva nome e troca somente a extensão final', () => {
    expect(outputName('minha.foto.JPEG', 'image/webp')).toBe('minha.foto.webp');
    expect(outputName('foto', 'image/png')).toBe('foto.png');
    expect(outputName('.png', 'image/jpeg')).toBe('imagem.jpg');
    expect(outputName('café.png', 'image/avif')).toBe('café.avif');
  });
  it('rejeita conteúdo inválido e tamanho excessivo', async () => {
    await expect(inspectFile(new File(['ruim'], 'foto.png', { type: 'image/png' }))).rejects.toThrow('válido');
    const huge = new File(['x'], 'grande.jpg');
    Object.defineProperty(huge, 'size', { value: MAX_FILE_BYTES + 1 });
    await expect(inspectFile(huge)).rejects.toThrow('40 MB');
  });
  it('nunca inventa economia', () => {
    expect(savings(100, 70)).toBe(30);
    expect(savings(100, 120)).toBe(0);
    expect(savings(0, 0)).toBe(0);
  });
  it('aplica fundo apenas a JPG', () => {
    expect(requiresBackground('image/jpeg')).toBe(true);
    expect(requiresBackground('image/png')).toBe(false);
    expect(requiresBackground('image/webp')).toBe(false);
  });
});
describe('dimensões', () => {
  const options = { ...defaultOptions, mode: 'resize' as const };
  it('encaixa sem deformação em paisagem e retrato', () => {
    expect(targetDimensions(1600, 800, { ...options, width: 1000, height: 1000 })).toEqual({ width: 1000, height: 500 });
    expect(targetDimensions(800, 1600, { ...options, width: 1000, height: 1000 })).toEqual({ width: 500, height: 1000 });
  });
  it('produz dimensões exatas e percentuais', () => {
    expect(targetDimensions(1600, 800, { ...options, width: 354, height: 472, keepRatio: false })).toEqual({ width: 354, height: 472 });
    expect(targetDimensions(1600, 800, { ...options, resizeMode: 'percent', percent: 25 })).toEqual({ width: 400, height: 200 });
  });
  it('valida memória, dimensões e valores inválidos', () => {
    expect(() => targetDimensions(9000, 9000, options)).toThrow('32 megapixels');
    expect(() => targetDimensions(100, 100, { ...options, width: 0 })).toThrow();
    expect(() => targetDimensions(100, 100, { ...options, height: NaN })).toThrow();
    expect(() => targetDimensions(100, 100, { ...options, resizeMode: 'percent', percent: 500 })).toThrow();
  });
});
