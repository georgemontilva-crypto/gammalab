import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { PROJECTS, domainOf } from '../data/projects';
import { useI18n } from '../lib/i18n';
import { shotsFor } from '../lib/shots';
import { Cover } from './Cover';

/** Vista compacta: una fila por proyecto, con la vista previa siguiendo al cursor. */
export function ProjectList({ onOpen, toggle }: { onOpen: OpenProject; toggle: ReactNode }) {
  const { t } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const peek = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = peek.current;
    if (!el) return;
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const loop = () => {
      cx += (x - cx) * 0.16;
      cy += (y - cy) * 0.16;
      el.style.transform = `translate3d(${cx + 28}px, ${cy - 110}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = hover === null ? null : PROJECTS[hover];

  return (
    <section id="proyectos" className="list">
      <header className="list__head">
        <h2 className="h2">{t(COPY.work.title)}</h2>
        {toggle}
      </header>
      <ul className="list__rows" onPointerLeave={() => setHover(null)}>
        {PROJECTS.map((p, i) => (
          <li key={p.slug}>
            <button
              type="button"
              className="row"
              data-cursor={t(COPY.work.cursorOpen)}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={(e) => onOpen(p.slug, e.currentTarget.getBoundingClientRect())}
            >
              <span className="row__name">{p.name}</span>
              <span className="row__kind">{t(p.kind)}</span>
              <span className="row__domain">{domainOf(p.url)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div ref={peek} className={`peek ${current ? 'is-on' : ''}`} aria-hidden="true">
        {current &&
          (shotsFor(current.slug).hero ? (
            <img src={shotsFor(current.slug).hero} alt="" />
          ) : (
            <Cover project={current} />
          ))}
      </div>
    </section>
  );
}
