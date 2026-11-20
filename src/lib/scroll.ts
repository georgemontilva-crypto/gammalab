import Lenis from 'lenis';

let lenis: Lenis | null = null;

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initScroll(): Lenis {
  if (lenis) return lenis;
  const reduce = prefersReducedMotion();
  lenis = new Lenis({ lerp: reduce ? 1 : 0.11, smoothWheel: !reduce, anchors: false });
  const raf = (t: number) => {
    lenis!.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  return lenis;
}

export const getLenis = () => lenis;

export function scrollToTarget(target: string | number | HTMLElement, duration = 1.2) {
  // Se resuelve a una posición absoluta con el scroll real de la ventana: tras un
  // cambio de alto de la página, la posición que recuerda Lenis puede estar vieja.
  let y: number;
  if (typeof target === 'number') y = target;
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    y = Math.round(el.getBoundingClientRect().top + window.scrollY);
  }
  const immediate = prefersReducedMotion() || duration === 0;
  if (lenis) lenis.scrollTo(y, { duration, immediate, force: true });
  else window.scrollTo({ top: y });
}

let locks = 0;
export function lockScroll(lock: boolean) {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  if (locks > 0) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle('is-locked', locks > 0);
}
