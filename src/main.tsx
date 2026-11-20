import { createRoot } from 'react-dom/client';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/jetbrains-mono';
import 'lenis/dist/lenis.css';
import './styles.css';
import App from './App';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(<App />);
