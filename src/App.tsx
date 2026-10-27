import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToolPage } from './pages/ToolPage';
import { LegalPage } from './pages/LegalPage';
import { getPage, legalPages, siteUrl, structuredData } from './data/pages';

export function App() {
  const { pathname, key } = useLocation();
  const page = getPage(pathname);
  const legal = legalPages.find(p => p.path === pathname.replace(/\/$/, ''));
  const title = page?.title ?? (legal ? `${legal.title} | RDXCompressor` : 'Página não encontrada | RDXCompressor');
  const description = page?.description ?? legal?.description ?? 'Encontre as ferramentas gratuitas do RDXCompressor.';
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [key]);
  useEffect(() => {
    document.title = title;
    const update = (selector: string, value: string) => document.querySelector(selector)?.setAttribute('content', value);
    update('meta[name="description"]', description);
    update('meta[property="og:title"]', title);
    update('meta[property="og:description"]', description);
    update('meta[property="og:url"]', siteUrl + pathname);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', siteUrl + pathname);
    update('meta[name="robots"]', page || legal ? 'index,follow' : 'noindex,follow');
    let script = document.getElementById('structured-data');
    if (!script) { script = document.createElement('script'); script.id = 'structured-data'; script.setAttribute('type', 'application/ld+json'); document.head.append(script); }
    script.textContent = JSON.stringify(structuredData(page));
  }, [pathname, title, description, page, legal]);
  return <Layout>{page ? <ToolPage page={page} /> : legal ? <LegalPage path={legal.path} title={legal.title} /> : <section className="container not-found"><span className="section-kicker">404</span><h1>Esta página não está por aqui.</h1><p>Suas próximas imagens podem começar pela ferramenta principal.</p><Link to="/" className="button">Ir para o início</Link></section>}</Layout>;
}
