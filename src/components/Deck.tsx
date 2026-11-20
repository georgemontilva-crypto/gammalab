import { useEffect, useRef, useState } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { PROJECTS, domainOf } from '../data/projects';
import { useI18n } from '../lib/i18n';
import { shotsFor } from '../lib/shots';
import { Cover } from './Cover';

const N = PROJECTS.length;

/**
 * Proyectos en teléfono: una baraja horizontal que se desliza con el dedo.
 * El scroll es nativo y el efecto de giro lo hace el navegador (CSS), así que
 * no hay cálculo por fotograma ni imágenes pesadas.
 */
export function Deck({ onOpen }: { onOpen: OpenProject }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current!;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      cards.current.forEach((c, i) => {
        if (!c) return;
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const center = (i: number) => {
    const el = track.current;
    const c = cards.current[i];
    if (!el || !c) return;
    el.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' });
  };

  const open = (i: number) => {
    const view = cards.current[i]?.querySelector('.card__view');
    onOpen(PROJECTS[i].slug, view?.getBoundingClientRect() ?? null);
  };

  const project = PROJECTS[active];

  return (
    <section id="proyectos" className="deck">
      <header className="deck__head">
        <h2 className="h2">{t(COPY.work.title)}</h2>
        <p className="lead">{t(COPY.work.swipe)}</p>
      </header>

      <div className="deck__track" ref={track} data-lenis-prevent>
        {PROJECTS.map((p, i) => {
          const shots = shotsFor(p.slug);
          const img = shots.phone ?? shots.hero;
          return (
            <button
              key={p.slug}
              type="button"
              ref={(n) => {
                cards.current[i] = n;
              }}
              className={`card ${i === active ? 'is-active' : ''}`}
              aria-label={`${t(COPY.work.open)}: ${p.name}`}
              onFocus={(e) => {
                if (e.currentTarget.matches(':focus-visible')) center(i);
              }}
              onClick={() => (i === active ? open(i) : center(i))}
            >
              <span className="card__bar">
                <i />
                <span>{domainOf(p.url)}</span>
              </span>
              <span className="card__view">
                {img ? (
                  <img src={img} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
                ) : (
                  <Cover project={p} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="deck__progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${(active + 1) / N})` }} />
      </div>

      <div className="deck__info">
        <p className="hud__kind">{t(project.kind)}</p>
        <h3 className="deck__name">{project.name}</h3>
        <div className="deck__row">
          <p className="hud__count" aria-hidden="true">
            <b>{String(active + 1).padStart(2, '0')}</b> / {String(N).padStart(2, '0')}
          </p>
          <button type="button" className="btn btn--solid" onClick={() => open(active)}>
            {t(COPY.work.open)}
          </button>
        </div>
      </div>
    </section>
  );
}
