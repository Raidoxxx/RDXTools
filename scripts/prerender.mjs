import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { render, routes, origin } from '../.prerender/entry-server.js';

const template = await readFile('dist/index.html', 'utf8');
for (const path of [...routes, '/404']) {
  const { html, head } = render(path);
  const result = template.replace('<!--app-html-->', html).replace('<!--app-head-->', head).replace('id="root"', `id="root" data-route="${path}"`);
  const target = path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : `dist${path}/index.html`;
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, result);
}
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Pré-renderização concluída: ${routes.length} páginas e 404, sitemap e robots.txt.`);
if (origin.includes('.example')) console.warn('Antes de publicar, configure VITE_SITE_URL com o domínio real e execute o build novamente.');
