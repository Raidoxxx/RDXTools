import { test, expect, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function tinyPNG() {
  function chunk(type: string, bytes: Buffer) {
    const content = Buffer.concat([Buffer.from(type), bytes]);
    let crc = 0xffffffff;
    for (const value of content) { crc ^= value; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
    const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, content, checksum]);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 1;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0,0]))), chunk('IEND', Buffer.alloc(0))]);
}

async function fixture(page: Page, type = 'image/png', name = 'imagem.png') {
  const data = await page.evaluate(type => {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(30, 20, 100, 40);
    return canvas.toDataURL(type).split(',')[1]!;
  }, type);
  return { name, mimeType: type, buffer: Buffer.from(data, 'base64') };
}
async function processAndResult(page: Page) {
  await page.locator('.queue-toolbar .button').first().click();
  await expect(page.locator('.file-card.done')).toHaveCount(1);
  return page.locator('.file-card.done');
}
async function inspectPreview(page: Page) {
  return page.locator('.file-preview img').evaluate(async element => {
    const img = element as HTMLImageElement; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0);
    const blob = await fetch(img.src).then(r => r.blob());
    return { type: blob.type, width: img.naturalWidth, height: img.naturalHeight, pixel: [...context.getImageData(0, 0, 1, 1).data] };
  });
}
for (const [from, to, mime] of [
  ['png', 'jpg', 'image/jpeg'], ['jpg', 'png', 'image/png'], ['png', 'webp', 'image/webp'],
  ['webp', 'png', 'image/png'], ['jpg', 'webp', 'image/webp'], ['webp', 'jpg', 'image/jpeg'],
] as const) {
  test(`${from} → ${to}: codifica formato correto e trata transparência`, async ({ page }) => {
    const outbound: string[] = [];
    page.on('request', request => { if (['POST', 'PUT', 'PATCH'].includes(request.method())) outbound.push(request.url()); });
    await page.goto(`/converter-${from}-para-${to}`);
    const file = await fixture(page, from === 'jpg' ? 'image/jpeg' : `image/${from}`, `foto.${from}`);
    await page.locator('#image-upload').setInputFiles(file);
    const card = await processAndResult(page);
    const result = await inspectPreview(page);
    expect(result.type).toBe(mime); expect(result.width).toBe(160); expect(result.height).toBe(80);
    if (from !== 'jpg' && to === 'jpg') expect(result.pixel).toEqual([255, 255, 255, 255]);
    if (from !== 'jpg' && to !== 'jpg') expect(result.pixel[3]).toBe(0);
    const downloadEvent = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Baixar', exact: true }).click();
    expect((await downloadEvent).suggestedFilename()).toBe(`foto.${to}`);
    expect(outbound).toEqual([]);
  });
}
test('lote e ZIP preservam arquivos com nomes duplicados', async ({ page }) => {
  await page.goto('/');
  const file = await fixture(page);
  await page.locator('#image-upload').setInputFiles([file, file]);
  await page.getByRole('button', { name: 'Converter imagens', exact: true }).click();
  await expect(page.locator('.file-card.done')).toHaveCount(2);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar tudo (ZIP)' }).click();
  const path = await (await download).path();
  const zip = await JSZip.loadAsync(await readFile(path!));
  expect(Object.keys(zip.files)).toEqual(['imagem.webp', 'imagem-2.webp']);
  for (const entry of Object.values(zip.files)) expect((await entry.async('uint8array')).length).toBeGreaterThan(0);
});
test('compressão mantém o original quando uma nova codificação fica maior', async ({ page }) => {
  await page.goto('/comprimir-imagem');
  // PNG 1×1 otimizado: o codificador do navegador produz um arquivo maior.
  const buffer = tinyPNG();
  await page.locator('#image-upload').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer });
  await processAndResult(page);
  await expect(page.getByText('Original mantido · sem redução')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar', exact: true }).click();
  expect(await readFile((await (await download).path())!)).toEqual(buffer);
});
test('redimensiona em pixels, com proporção e por percentual', async ({ page }) => {
  await page.goto('/redimensionar-imagem');
  await page.locator('#image-upload').setInputFiles(await fixture(page));
  await page.getByLabel('Largura', { exact: true }).fill('100');
  await page.getByLabel('Altura', { exact: true }).fill('100');
  await processAndResult(page);
  expect(await inspectPreview(page)).toMatchObject({ width: 100, height: 50 });
  await page.getByRole('button', { name: '3×4', exact: true }).click();
  await processAndResult(page);
  expect(await inspectPreview(page)).toMatchObject({ width: 354, height: 472 });
  await page.getByRole('button', { name: 'Percentual', exact: true }).click();
  await page.getByLabel('Escala em percentual').fill('25');
  await processAndResult(page);
  expect(await inspectPreview(page)).toMatchObject({ width: 40, height: 20 });
});
test('rejeita arquivos falsos e informa imagens corrompidas', async ({ page }) => {
  await page.goto('/');
  await page.locator('#image-upload').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('válido');
  await page.locator('#image-upload').setInputFiles({ name: 'corrupt.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0]) });
  await page.locator('.queue-toolbar .button').first().click();
  await expect(page.locator('.file-error')).toContainText('corrompida');
});
test('tema, navegação mobile e layout sem overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.screenshot({ path: 'test-results/dark.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Redimensionar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('tamanho certo');
  await page.locator('#image-upload').setInputFiles(await fixture(page));
  await processAndResult(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-result.png', fullPage: true, animations: 'disabled' });
  expect(errors).toEqual([]);
});
test('HTML inicial contém conteúdo, SEO individual e rotas institucionais', async ({ request }) => {
  for (const path of ['/', '/converter-png-para-jpg', '/converter-jpg-para-png', '/converter-png-para-webp', '/converter-webp-para-png', '/converter-jpg-para-webp', '/converter-webp-para-jpg', '/comprimir-imagem', '/redimensionar-imagem', '/privacidade', '/termos', '/sobre', '/contato']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('<h1>'); expect(html).toContain('rel="canonical"'); expect(html).not.toContain('<!--app-html-->');
  }
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/comprimir-imagem');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
});

test('compressão JPG reduz o tamanho e informa a economia real', async ({ page }) => {
  await page.goto('/comprimir-imagem');
  const file = await fixture(page, 'image/jpeg', 'foto.jpg');
  await page.locator('#image-upload').setInputFiles(file);
  await page.locator('#quality').fill('30');
  const card = await processAndResult(page);
  await expect(card.locator('.saving')).toBeVisible();
  const download = page.waitForEvent('download');
  await card.getByRole('button', { name: 'Baixar', exact: true }).click();
  const result = await readFile((await (await download).path())!);
  expect(result.length).toBeLessThan(file.buffer.length);
  await expect(card.locator('.saving')).toContainText(`${Math.round((1 - result.length / file.buffer.length) * 100)}%`);
});

test('upload por arrastar e colar funciona sem rede externa', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url()); });
  await page.goto('/');
  await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 10;
    const bytes = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]!), ch => ch.charCodeAt(0));
    const transfer = new DataTransfer(); transfer.items.add(new File([bytes], 'arrastada.png', { type: 'image/png' }));
    document.querySelector('.dropzone')!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(page.locator('.file-card')).toHaveCount(1);
  await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 10;
    const bytes = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]!), ch => ch.charCodeAt(0));
    const transfer = new DataTransfer(); transfer.items.add(new File([bytes], 'colada.png', { type: 'image/png' }));
    document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer }));
  });
  await expect(page.locator('.file-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Converter imagens', exact: true }).click();
  await expect(page.locator('.file-card.done')).toHaveCount(2);
  expect(external).toEqual([]);
});

test('fallback Canvas funciona sem OffscreenCanvas', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'OffscreenCanvas', { value: undefined }));
  await page.goto('/converter-png-para-jpg');
  await page.locator('#image-upload').setInputFiles(await fixture(page));
  await page.getByLabel('Cor de fundo').fill('#0000ff');
  await processAndResult(page);
  const result = await inspectPreview(page);
  expect(result.type).toBe('image/jpeg');
  expect(result.pixel[0]).toBeLessThan(5); expect(result.pixel[1]).toBeLessThan(5); expect(result.pixel[2]).toBeGreaterThan(250);
});

test('cancelar termina o Worker e permite tentar novamente', async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      postMessage(message: unknown) { setTimeout(() => super.postMessage(message), 1500); }
      terminate() { document.documentElement.dataset.workerTerminated = 'true'; super.terminate(); }
    };
  });
  await page.goto('/');
  await page.locator('#image-upload').setInputFiles(await fixture(page));
  await page.locator('.queue-toolbar .button').first().click();
  await page.getByRole('button', { name: 'Cancelar processamento' }).click();
  await expect(page.locator('.file-card.cancelled')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-worker-terminated', 'true');
  await processAndResult(page);
});

test('exportação AVIF é exibida somente com suporte real', async ({ page }) => {
  await page.goto('/');
  const canEncode = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    return await new Promise<boolean>(resolve => canvas.toBlob(blob => resolve(blob?.type === 'image/avif'), 'image/avif'));
  });
  await expect(page.locator('#output-format option[value="image/avif"]')).toHaveCount(canEncode ? 1 : 0);
  if (canEncode) {
    await page.locator('#output-format').selectOption('image/avif');
    await page.locator('#image-upload').setInputFiles(await fixture(page));
    await processAndResult(page);
    expect((await inspectPreview(page)).type).toBe('image/avif');
  }
});
