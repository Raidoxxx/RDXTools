import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { render, routes, origin } from '../.prerender/entry-server.js';

const outputDir = process.argv[2] ?? 'build';
const template = await readFile(join(outputDir, 'index.html'), 'utf8');
for (const path of [...routes, '/404']) {
  const { html, head } = render(path);
  const result = template.replace('<!--app-html-->', html).replace('<!--app-head-->', head).replace('id="root"', `id="root" data-route="${path}"`);
  const target = join(outputDir, path === '/' ? 'index.html' : path === '/404' ? '404.html' : `${path.slice(1)}/index.html`);
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, result);
}
await writeFile(join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`);
await writeFile(join(outputDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Pré-renderização concluída: ${routes.length} páginas e 404, sitemap e robots.txt.`);
if (origin.includes('.example')) console.warn('Antes de publicar, configure VITE_SITE_URL com o domínio real e execute o build novamente.');
