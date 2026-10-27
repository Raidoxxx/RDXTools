import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { App } from './App';
import { getPage, legalPages, siteUrl, toolPages, structuredData } from './data/pages';

export const routes = [...toolPages.map(p => p.path), ...legalPages.map(p => p.path)];
export const origin = siteUrl;
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function render(path: string) {
  const page = getPage(path);
  const legal = legalPages.find(p => p.path === path);
  const title = page?.title ?? `${legal?.title ?? 'Página não encontrada'} | RDXCompressor`;
  const description = page?.description ?? legal?.description ?? 'Ferramentas gratuitas de imagem.';
  const data = structuredData(page);
  return {
    html: renderToString(<StaticRouter location={path}><App /></StaticRouter>),
    head: `<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}" />\n<meta name="robots" content="${page || legal ? 'index,follow' : 'noindex,follow'}" />\n<link rel="canonical" href="${escape(siteUrl + path)}" />\n<meta property="og:title" content="${escape(title)}" />\n<meta property="og:description" content="${escape(description)}" />\n<meta property="og:url" content="${escape(siteUrl + path)}" />\n<meta property="og:type" content="website" />\n<meta property="og:locale" content="pt_BR" />\n<meta property="og:site_name" content="RDXCompressor" />\n<meta property="og:image" content="${siteUrl}/social-card.svg" />\n<script id="structured-data" type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
  };
}
