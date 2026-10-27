import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { ensureBuild } from './scripts/ensure-build.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
try { await ensureBuild(directory); }
catch (error) { console.error('Não foi possível preparar o site:', error.message); process.exit(1); }
const root = await realpath(resolve(directory, 'build'));
const headers = Object.fromEntries((await readFile(resolve(root, '_headers'), 'utf8'))
  .split(/\r?\n/).filter(line => /^\s+[^:]+:/.test(line))
  .map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]; }));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};
function withinRoot(path) {
  const local = relative(root, path);
  return local !== '..' && !local.startsWith('..' + '/') && !local.startsWith('..' + '\\') && !isAbsolute(local);
}
async function findFile(pathname) {
  if (pathname.includes('\0') || pathname.split(/[\\/]/).some(part => part.startsWith('.') || part === '_headers' || part === '_redirects')) return null;
  let candidate = resolve(root, '.' + pathname);
  if (!withinRoot(candidate)) return null;
  try {
    let info = await stat(candidate);
    if (info.isDirectory()) { candidate = resolve(candidate, 'index.html'); info = await stat(candidate); }
    if (!info.isFile() || !withinRoot(await realpath(candidate))) return null;
    return { path: candidate, size: info.size };
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) return null;
    throw error;
  }
}
const server = createServer(async (request, response) => {
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Método não permitido.'); return;
  }
  try {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400); response.end(); return; }
    const found = await findFile(pathname);
    const file = found ?? { path: resolve(root, '404.html'), size: (await stat(resolve(root, '404.html'))).size };
    const immutable = found && relative(root, file.path).replace(/\\/g, '/').startsWith('assets/');
    response.writeHead(found ? 200 : 404, {
      'Content-Type': mimeTypes[extname(file.path)] ?? 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (request.method === 'HEAD') { response.end(); return; }
    await pipeline(createReadStream(file.path), response);
  } catch (error) {
    if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error('Falha ao servir arquivo:', error.message);
    if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    if (!response.destroyed) response.end();
  }
});
const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT deve ser um número entre 1 e 65535.');
server.listen(port, '0.0.0.0', () => console.log(`RDXCompressor disponível em 0.0.0.0:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.close(error => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
});
