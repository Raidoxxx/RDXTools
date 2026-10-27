import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/sora/latin-400.css';
import '@fontsource/sora/latin-500.css';
import '@fontsource/sora/latin-600.css';
import './styles.css';

const element = document.getElementById('root')!;
const app = <BrowserRouter><App /></BrowserRouter>;
const path = window.location.pathname.replace(/\/$/, '') || '/';
if (element.hasChildNodes() && element.dataset.route === path) hydrateRoot(element, app); else createRoot(element).render(app);
