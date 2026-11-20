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
  const immediate = prefersReducedMotion();
  if (lenis) {
    lenis.scrollTo(target, { duration, immediate: immediate || duration === 0, force: true });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
}

let locks = 0;
export function lockScroll(lock: boolean) {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  if (locks > 0) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle('is-locked', locks > 0);
}
