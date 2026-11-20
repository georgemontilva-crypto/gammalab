import { useEffect, useRef, useState } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { useI18n } from '../lib/i18n';
import { prefersReducedMotion, scrollToTarget } from '../lib/scroll';
import { Deck } from './Deck';
import { ProjectList } from './ProjectList';
import { Tunnel } from './Tunnel';

export type WorkView = 'tunnel' | 'list';

export function Work({ onOpen }: { onOpen: OpenProject }) {
  const { t } = useI18n();
  const [view, setView] = useState<WorkView>(() => (prefersReducedMotion() ? 'list' : 'tunnel'));

  // En teléfono el túnel 3D pesa demasiado: ahí los proyectos son una baraja deslizable.
  const [phone, setPhone] = useState(() => matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const mq = matchMedia('(max-width: 760px)');
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Al cambiar de vista, la sección vuelve a su inicio (el alto de la página cambia).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scrollToTarget('#proyectos', 0);
  }, [view]);

  const toggle = (
    <div className="seg" role="group" aria-label={t(COPY.work.view)}>
      {(['tunnel', 'list'] as const).map((v) => (
        <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
          {t(COPY.work[v])}
        </button>
      ))}
    </div>
  );

  if (phone) return <Deck onOpen={onOpen} />;

  return view === 'tunnel' ? (
    <Tunnel onOpen={onOpen} toggle={toggle} />
  ) : (
    <ProjectList onOpen={onOpen} toggle={toggle} />
  );
}
