import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPY } from '../data/copy';
import { PROJECTS, domainOf } from '../data/projects';
import { useI18n } from '../lib/i18n';
import { lockScroll, prefersReducedMotion } from '../lib/scroll';
import { shotsFor } from '../lib/shots';
import { Cover } from './Cover';

type Props = {
  index: number;
  origin: DOMRect | null;
  onClose: () => void;
  onNavigate: (delta: number) => void;
};

const EASE = 'cubic-bezier(.7,0,.15,1)';

function insetFrom(r: DOMRect | null) {
  if (!r) return 'inset(50% 50% 50% 50% round 16px)';
  const right = Math.max(0, window.innerWidth - r.right);
  const bottom = Math.max(0, window.innerHeight - r.bottom);
  return `inset(${Math.max(0, r.top)}px ${right}px ${bottom}px ${Math.max(0, r.left)}px round 12px)`;
}

/** Ficha a pantalla completa: se abre desde el rectángulo de la ventana pulsada. */
export function CaseView({ index, origin, onClose, onNavigate }: Props) {
  const { t } = useI18n();
  const project = PROJECTS[index];
  const shots = shotsFor(project.slug);
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [mode, setMode] = useState<'shot' | 'live'>(shots.full ? 'shot' : 'live');
  const [device, setDevice] = useState<'desktop' | 'mobile'>(() =>
    matchMedia('(max-width: 899px)').matches ? 'mobile' : 'desktop',
  );
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = useState(false);

  // Al cambiar de proyecto, vuelve al modo por defecto de ese proyecto.
  useEffect(() => {
    setMode(shotsFor(PROJECTS[index].slug).full ? 'shot' : 'live');
    setLoaded(false);
    viewport.current?.querySelector('.frame__scroll')?.scrollTo(0, 0);
  }, [index]);

  useEffect(() => setLoaded(false), [mode, device]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = root.current;
    if (!el || prefersReducedMotion()) {
      onClose();
      return;
    }
    const anim = el.animate(
      [{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: insetFrom(origin), opacity: 0.2 }],
      { duration: 480, easing: EASE, fill: 'forwards' },
    );
    anim.onfinish = onClose;
  }, [onClose, origin]);

  useLayoutEffect(() => {
    const el = root.current!;
    if (prefersReducedMotion()) return;
    el.animate([{ clipPath: insetFrom(origin) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], {
      duration: 700,
      easing: EASE,
    });
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lockScroll(true);
    const previous = document.activeElement as HTMLElement | null;
    // Un fotograma después: la tecla que abrió la ficha no debe activar también «Cerrar».
    const raf = requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(raf);
      lockScroll(false);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') onNavigate(1);
      else if (e.key === 'ArrowLeft') onNavigate(-1);
      else if (e.key === 'Tab') {
        // Mantiene el foco dentro de la ficha.
        const nodes = root.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, onNavigate]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((b) => (Math.abs(b.w - width) > 1 || Math.abs(b.h - height) > 1 ? { w: width, h: height } : b));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Nunca se incrusta el propio sitio dentro de sí mismo, ni http dentro de https.
  let canEmbed = true;
  try {
    const u = new URL(project.url);
    if (u.host === window.location.host) canEmbed = false;
    if (window.location.protocol === 'https:' && u.protocol !== 'https:') canEmbed = false;
    if (window.top !== window.self) canEmbed = false;
  } catch {
    canEmbed = false;
  }

  const image = device === 'mobile' ? (shots.mobile ?? shots.full) : shots.full;
  const baseW = device === 'mobile' ? 390 : 1440;
  const scale = box.w ? Math.min(1, box.w / baseW) : 1;

  return (
    <div ref={root} className="case" role="dialog" aria-modal="true" aria-label={project.name} data-lenis-prevent>
      <aside className="case__info">
        <button ref={closeBtn} type="button" className="btn btn--ghost case__close" onClick={close}>
          {t(COPY.cas.close)}
          <kbd>Esc</kbd>
        </button>
        <div className="case__text" key={project.slug}>
          <p className="case__kind">{t(project.kind)}</p>
          <h2 className="case__name">{project.name}</h2>
          <p className="case__blurb">{t(project.blurb)}</p>
          <ul className="tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <a className="btn btn--solid case__visit" href={project.url} target="_blank" rel="noopener noreferrer">
            {t(COPY.work.visit)}
            <span className="case__domain">{domainOf(project.url)}</span>
          </a>
        </div>
        <div className="case__nav">
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate(-1)}>
            {t(COPY.cas.prev)}
          </button>
          <span aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
          </span>
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate(1)}>
            {t(COPY.cas.next)}
          </button>
        </div>
      </aside>

      <div className={`frame frame--${device}`}>
        <div className="frame__bar">
          <span className="frame__url">
            <i className={mode === 'live' ? 'live' : ''} />
            {domainOf(project.url)}
          </span>
          <div className="seg" role="group" aria-label={t(COPY.cas.mode)}>
            <button type="button" aria-pressed={mode === 'shot'} disabled={!shots.full} onClick={() => setMode('shot')}>
              {t(COPY.cas.shot)}
            </button>
            <button type="button" aria-pressed={mode === 'live'} disabled={!canEmbed} onClick={() => setMode('live')}>
              {t(COPY.cas.live)}
            </button>
          </div>
          <div className="seg" role="group" aria-label={t(COPY.cas.device)}>
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>
              {t(COPY.cas.desktop)}
            </button>
            <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>
              {t(COPY.cas.mobile)}
            </button>
          </div>
        </div>
        <div className="frame__stage">
          <div className="frame__view" ref={viewport}>
            {mode === 'shot' && image ? (
              <div className="frame__scroll" data-lenis-prevent tabIndex={0} key={`${project.slug}-${device}`}>
                <img src={image} alt={`${project.name}, ${t(COPY.cas.shot).toLowerCase()}`} />
              </div>
            ) : (
              <>
                <Cover project={project} />
                {mode === 'live' && canEmbed && box.w > 0 && (
                  <iframe
                    key={`${project.slug}-${device}`}
                    className={`frame__live ${loaded ? 'is-loaded' : ''}`}
                    src={project.url}
                    title={project.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={() => setLoaded(true)}
                    style={{
                      width: baseW,
                      height: box.h / scale,
                      transform: `scale(${scale})`,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
        <p className="frame__note">
          {mode === 'live' ? t(COPY.cas.liveNote) : t(COPY.cas.shotNote)} <span className="only-fine">{t(COPY.cas.keys)}</span>
        </p>
      </div>
    </div>
  );
}
