import { ArrowDownLeft, ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export function Brand() {
  return <Link to="/" className="brand" aria-label="RDXCompressor — início"><span className="brand-icon"><ArrowDownLeft size={19} /><ArrowUpRight size={19} /></span><span><b>RDX</b>Compressor<span className="brand-dot">.</span></span></Link>;
}
function readTheme() {
  try { const stored = localStorage.getItem('rdx-theme'); if (stored) return stored === 'dark'; } catch { /* Storage is optional. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function subscribeTheme(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener('storage', callback);
  window.addEventListener('rdx-theme', callback);
  media.addEventListener('change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('rdx-theme', callback); media.removeEventListener('change', callback); };
}
export function Layout({ children }: { children: ReactNode }) {
  const dark = useSyncExternalStore(subscribeTheme, readTheme, () => false);
  const [temporaryDark, setTemporaryDark] = useState<boolean | null>(null);
  const isDark = temporaryDark ?? dark;
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const location = useLocation();
  const open = openedPath === location.pathname;
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark]);
  function toggleTheme() {
    setTemporaryDark(!isDark);
    try { localStorage.setItem('rdx-theme', !isDark ? 'dark' : 'light'); window.dispatchEvent(new Event('rdx-theme')); } catch { /* Theme still works without storage. */ }
  }
  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header"><div className="container header-inner"><Brand />
      <nav aria-label="Navegação principal" className={open ? 'main-nav open' : 'main-nav'}>
        <NavLink to="/" end>Converter</NavLink><NavLink to="/comprimir-imagem">Comprimir</NavLink><NavLink to="/redimensionar-imagem">Redimensionar</NavLink>
      </nav>
      <div className="header-actions"><span className="free-label"><span />100% gratuito</span><button className="icon-button theme-button" onClick={toggleTheme} aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}>{isDark ? <Sun size={19} /> : <Moon size={19} />}</button><button className="icon-button mobile-menu" onClick={() => setOpenedPath(open ? null : location.pathname)} aria-label="Abrir menu" aria-expanded={open}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div></header>
    <main id="conteudo">{children}</main>
    <footer className="site-footer"><div className="container footer-top"><div><Brand /><p>Seus arquivos, do jeito que você precisa.</p></div><nav aria-label="Links institucionais"><Link to="/sobre">Sobre</Link><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos de uso</Link><Link to="/contato">Contato</Link></nav></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} RDXCompressor</span><span>Feito para simplificar. Com privacidade.</span></div></footer>
  </>;
}
