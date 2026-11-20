import { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from './lib/i18n';
import { initScroll } from './lib/scroll';
import { PROJECTS } from './data/projects';
import { Loader } from './components/Loader';
import { Cursor } from './components/Cursor';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Work } from './components/Work';
import { CaseView } from './components/CaseView';
import { Terminal } from './components/Terminal';
import { Studio } from './components/Studio';
import { Contact } from './components/Contact';

export type OpenProject = (slug: string, origin?: DOMRect | null) => void;

export default function App() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<{ index: number; origin: DOMRect | null } | null>(null);

  useEffect(() => {
    initScroll();
  }, []);

  const openProject = useCallback<OpenProject>((slug, origin = null) => {
    const index = PROJECTS.findIndex((p) => p.slug === slug);
    if (index >= 0) setOpen({ index, origin });
  }, []);

  const navigate = useCallback((delta: number) => {
    setOpen((cur) =>
      cur ? { index: (cur.index + delta + PROJECTS.length) % PROJECTS.length, origin: null } : cur,
    );
  }, []);

  return (
    <I18nProvider>
      <Loader onDone={() => setReady(true)} />
      <Cursor />
      <Nav />
      <main>
        <Hero ready={ready} />
        <Work onOpen={openProject} />
        <Terminal onOpen={openProject} />
        <Studio />
        <Contact />
      </main>
      {open && (
        <CaseView
          key="case"
          index={open.index}
          origin={open.origin}
          onClose={() => setOpen(null)}
          onNavigate={navigate}
        />
      )}
      <div className="grain" aria-hidden="true" />
    </I18nProvider>
  );
}
