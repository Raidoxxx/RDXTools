import type { QueueItem } from '../types';

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export async function downloadZip(items: QueueItem[]) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Set<string>();
  for (const item of items) {
    if (!item.result) continue;
    let name = item.result.name;
    let i = 2;
    while (used.has(name)) { name = item.result.name.replace(/(\.[^.]+)$/, `-${i++}$1`); }
    used.add(name);
    zip.file(name, item.result.blob);
  }
  downloadBlob(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), 'RDXCompressor-imagens.zip');
}
