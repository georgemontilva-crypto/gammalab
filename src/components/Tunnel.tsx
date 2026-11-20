import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { PROJECTS, domainOf } from '../data/projects';
import { useI18n } from '../lib/i18n';
import { useScramble } from '../lib/scramble';
import { scrollToTarget } from '../lib/scroll';
import { shotsFor } from '../lib/shots';
import { Cover } from './Cover';

const N = PROJECTS.length;
const GAP = 1500; // separación en profundidad entre ventanas (px)
const START = 1200; // distancia a la primera ventana al entrar
const SPAN = (N - 1) * GAP + START;
const STEP_VH = 0.8; // pantallas de scroll por proyecto
const DEPTH = 3200; // profundidad del campo de estelas

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const progressOf = (i: number) => (i * GAP + START) / SPAN;

/**
 * Recorrido en profundidad: el scroll mueve la cámara hacia delante y cada
 * proyecto es una ventana de navegador suspendida en el espacio.
 */
export function Tunnel({ onOpen, toggle }: { onOpen: OpenProject; toggle: ReactNode }) {
  const { t } = useI18n();
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const warp = useRef<HTMLCanvasElement>(null);
  const wins = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [intro, setIntro] = useState(true);

  const jumpTo = useCallback((i: number, duration = 1.1) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    scrollToTarget(Math.round(top + progressOf(i) * total), duration);
  }, []);

  useEffect(() => {
    const el = section.current!;
    const pin = sticky.current!;
    const canvas = warp.current!;
    const ctx = canvas.getContext('2d')!;

    let W = pin.clientWidth;
    let H = pin.clientHeight;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let px = 0;
    let py = 0;
    let rx = 0;
    let ry = 0;
    let lastCam = NaN;
    let speed = 0;
    let lastP = -1;
    let idleSince = 0;
    let snapped = true;
    let curActive = -1;
    let curIntro: boolean | null = null;

    const stars = Array.from({ length: 220 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.22 + Math.random() * 1.1,
      z: Math.random() * DEPTH,
      brand: Math.random() < 0.3,
    }));

    const resize = () => {
      W = pin.clientWidth;
      H = pin.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - H;
      const p = clamp01(-rect.top / total);
      const cam = -START + p * SPAN;
      speed += ((Number.isNaN(lastCam) ? 0 : cam - lastCam) - speed) * 0.3;
      lastCam = cam;

      rx += (px - rx) * 0.06;
      ry += (py - ry) * 0.06;
      world.current!.style.transform = `rotateY(${(rx * 3).toFixed(3)}deg) rotateX(${(-ry * 2.2).toFixed(3)}deg)`;

      // Título de la sección: un plano que se atraviesa al empezar.
      const dT = cam + START * 0.8;
      const opT = 1 - clamp01((dT - 40) / 340);
      const tn = title.current!;
      tn.style.visibility = opT <= 0.01 ? 'hidden' : 'visible';
      tn.style.opacity = opT.toFixed(3);
      tn.style.transform = `translate3d(-50%, -50%, ${dT.toFixed(1)}px)`;
      const dim = 1 - 0.72 * opT; // mientras se lee el título, las ventanas esperan en penumbra

      const narrow = W < 760;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < N; i++) {
        const node = wins.current[i];
        if (!node) continue;
        const d = cam - i * GAP; // 0 en foco · negativo por delante · positivo ya pasó
        if (Math.abs(d) < bestD) {
          bestD = Math.abs(d);
          best = i;
        }
        const far = Math.max(0, -d / GAP);
        const op =
          (d > 0 ? 1 - clamp01((d - 90) / 380) : clamp01((3.2 - far) / 1.2) * (1 - 0.62 * clamp01(far))) * dim;
        if (op <= 0.01) {
          if (node.style.visibility !== 'hidden') node.style.visibility = 'hidden';
          continue;
        }
        const side = i % 2 ? 1 : -1;
        const f = Math.min(far, 1.8);
        let x = side * W * (narrow ? 0.14 : 0.3) * f ** 0.85;
        const y = Math.sin(i * 1.9) * H * 0.07 * f;
        const rot = -side * (narrow ? 8 : 16) * Math.min(far, 1);
        if (d > 0) x += side * d * 0.9;
        node.style.visibility = 'visible';
        node.style.opacity = op.toFixed(3);
        node.style.pointerEvents = d > 60 ? 'none' : 'auto';
        node.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${d.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`;
      }

      if (best !== curActive) {
        curActive = best;
        setActive(best);
      }
      const isIntro = cam < -GAP * 0.42;
      if (isIntro !== curIntro) {
        curIntro = isIntro;
        setIntro(isIntro);
      }

      // Estelas: su longitud depende de la velocidad del scroll.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2 + rx * 24;
      const cy = H * 0.46 - ry * 18;
      const focal = 520;
      const streak = Math.min(520, Math.abs(speed) * 4.5 + 5);
      ctx.lineCap = 'round';
      for (const s of stars) {
        const z = (((s.z - cam) % DEPTH) + DEPTH) % DEPTH;
        const z1 = z + 60;
        const z2 = z1 + streak;
        const X = Math.cos(s.a) * s.r * W * 0.75;
        const Y = Math.sin(s.a) * s.r * H * 0.75;
        const k1 = focal / z1;
        const k2 = focal / z2;
        const alpha = clamp01(1 - z / DEPTH) * clamp01(z / 240) * (s.brand ? 0.85 : 0.4);
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = s.brand ? '#FF2D55' : '#EFEFEF';
        ctx.lineWidth = Math.min(3, Math.max(0.6, 1.3 * k1));
        ctx.beginPath();
        ctx.moveTo(cx + X * k2, cy + Y * k2);
        ctx.lineTo(cx + X * k1, cy + Y * k1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Imán suave: al soltar el scroll, la ventana más cercana se centra.
      if (Math.abs(p - lastP) > 0.00003) {
        lastP = p;
        idleSince = now;
        snapped = false;
      } else if (!snapped && now - idleSince > 220) {
        snapped = true;
        const off = Math.abs(p - progressOf(best));
        if (p > 0 && p < 1 && !isIntro && off > 0.0006 && off < (GAP / SPAN) * 0.46) jumpTo(best, 0.9);
      }

      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(pin);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [jumpTo]);

  const project = PROJECTS[active];
  const name = useScramble(project.name);

  return (
    <section
      id="proyectos"
      ref={section}
      className="tunnel"
      style={{ height: `calc(${(N * STEP_VH + 1).toFixed(2)} * 100vh)` }}
    >
      <div className="tunnel__sticky" ref={sticky}>
        <canvas ref={warp} className="tunnel__warp" aria-hidden="true" />
        <div className="tunnel__scene">
          <div className="tunnel__world" ref={world}>
            <div className="tunnel__title" ref={title}>
              <h2>{t(COPY.work.title)}</h2>
              <p>{t(COPY.work.intro)}</p>
            </div>
            {PROJECTS.map((p, i) => {
              const shots = shotsFor(p.slug);
              const isActive = i === active && !intro;
              return (
                <button
                  key={p.slug}
                  type="button"
                  ref={(n) => {
                    wins.current[i] = n;
                  }}
                  className={`win ${isActive ? 'is-active' : ''}`}
                  aria-label={`${isActive ? t(COPY.work.open) : t(COPY.work.goTo)}: ${p.name}`}
                  data-cursor={isActive ? t(COPY.work.cursorOpen) : t(COPY.work.cursorGo)}
                  onFocus={(e) => {
                    if (e.currentTarget.matches(':focus-visible')) jumpTo(i);
                  }}
                  onClick={(e) => {
                    if (isActive) {
                      const view = e.currentTarget.querySelector('.win__view') ?? e.currentTarget;
                      onOpen(p.slug, view.getBoundingClientRect());
                    } else jumpTo(i);
                  }}
                >
                  <span className="win__bar">
                    <i />
                    <span className="win__url">{domainOf(p.url)}</span>
                  </span>
                  <span className="win__view">
                    {shots.hero ? (
                      <picture>
                        {shots.mobile && <source media="(max-width: 760px)" srcSet={shots.mobile} />}
                        <img src={shots.hero} alt="" loading="lazy" draggable={false} />
                      </picture>
                    ) : (
                      <Cover project={p} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tunnel__top">{toggle}</div>

        <div className={`hud ${intro ? 'is-intro' : ''}`}>
          <div className="hud__main">
            <p className="hud__kind">
              {t(project.kind)}
              <span>{domainOf(project.url)}</span>
            </p>
            <h3 className="hud__name" aria-label={project.name}>
              {name}
            </h3>
          </div>
          <div className="hud__side">
            <p className="hud__count" aria-hidden="true">
              <b>{String(active + 1).padStart(2, '0')}</b> / {String(N).padStart(2, '0')}
            </p>
            <div className="hud__actions">
              <button
                type="button"
                className="btn btn--solid"
                tabIndex={intro ? -1 : 0}
                onClick={() => {
                  const view = wins.current[active]?.querySelector('.win__view');
                  onOpen(project.slug, view?.getBoundingClientRect() ?? null);
                }}
              >
                {t(COPY.work.open)}
              </button>
              <a className="btn" href={project.url} target="_blank" rel="noopener noreferrer" tabIndex={intro ? -1 : 0}>
                {t(COPY.work.visit)}
              </a>
            </div>
          </div>
        </div>

        <nav className="rail" aria-label={t(COPY.work.title)}>
          {PROJECTS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              className={i === active && !intro ? 'on' : ''}
              aria-label={`${t(COPY.work.goTo)} ${p.name}`}
              aria-current={i === active && !intro ? 'true' : undefined}
              onClick={() => jumpTo(i)}
            >
              <span>{p.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
