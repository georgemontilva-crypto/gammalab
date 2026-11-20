import { useState } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { useI18n } from '../lib/i18n';
import { prefersReducedMotion } from '../lib/scroll';
import { ProjectList } from './ProjectList';
import { Tunnel } from './Tunnel';

export type WorkView = 'tunnel' | 'list';

export function Work({ onOpen }: { onOpen: OpenProject }) {
  const { t } = useI18n();
  const [view, setView] = useState<WorkView>(() => (prefersReducedMotion() ? 'list' : 'tunnel'));

  const toggle = (
    <div className="seg" role="group" aria-label={t(COPY.work.view)}>
      {(['tunnel', 'list'] as const).map((v) => (
        <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
          {t(COPY.work[v])}
        </button>
      ))}
    </div>
  );

  return view === 'tunnel' ? (
    <Tunnel onOpen={onOpen} toggle={toggle} />
  ) : (
    <ProjectList onOpen={onOpen} toggle={toggle} />
  );
}
