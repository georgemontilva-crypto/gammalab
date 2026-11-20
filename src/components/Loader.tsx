import { useEffect, useState } from 'react';
import { Mark } from '../brand/Logo';
import { PROJECTS } from '../data/projects';
import { lockScroll, prefersReducedMotion } from '../lib/scroll';

const LINES = [
  '$ git clone gammalab',
  '$ npm run build',
  `✓ ${PROJECTS.length} proyectos enlazados`,
  '✓ listo',
];
const DURATION = 1900;

/** Secuencia de arranque: el isotipo se ensambla mientras "compila" la página. */
export function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<'run' | 'out' | 'gone'>(() => (prefersReducedMotion() ? 'gone' : 'run'));

  useEffect(() => {
    if (phase === 'gone') {
      onDone();
      return;
    }
    lockScroll(true);
    window.scrollTo(0, 0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // Avance irregular, como un build real.
      const eased = p < 0.6 ? p * 0.75 : 0.45 + (p - 0.6) * 1.375;
      setPct(Math.round(Math.min(1, eased) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    let t1 = 0;
    const finish = () => {
      setPhase('out');
      onDone();
      lockScroll(false);
      t1 = window.setTimeout(() => setPhase('gone'), 900);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => {
      cancelAnimationFrame(raf);
      finish();
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'gone') return null;
  const shown = Math.min(LINES.length, Math.floor((pct / 100) * (LINES.length + 0.4)) + 1);

  return (
    <div className={`loader ${phase === 'out' ? 'is-out' : ''}`} aria-hidden="true">
      <div className="loader__mark">
        <Mark />
      </div>
      <div className="loader__log">
        {LINES.slice(0, shown).map((l) => (
          <p key={l} className={l.startsWith('✓') ? 'ok' : ''}>
            {l}
          </p>
        ))}
      </div>
      <div className="loader__bar">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <div className="loader__pct">{String(pct).padStart(3, '0')}</div>
    </div>
  );
}
