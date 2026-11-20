import { useEffect, useRef } from 'react';

/** Cursor propio: punto + anillo que se convierte en etiqueta sobre [data-cursor]. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    document.documentElement.classList.add('has-cursor');

    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    let shown = false;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        d.style.opacity = r.style.opacity = '1';
      }
      const t = e.target as Element | null;
      const tagged = t?.closest?.('[data-cursor]') as HTMLElement | null;
      const interactive = t?.closest?.('a, button, input, [role="button"], label');
      const text = tagged?.dataset.cursor ?? '';
      r.classList.toggle('is-label', !!text);
      d.style.opacity = text ? '0' : '1';
      r.classList.toggle('is-hover', !text && !!interactive);
      if (l.textContent !== text) l.textContent = text;
    };
    const hide = () => {
      shown = false;
      d.style.opacity = r.style.opacity = '0';
    };
    const down = () => r.classList.add('is-down');
    const up = () => r.classList.remove('is-down');

    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', hide);
    // Sobre un iframe el documento deja de recibir el puntero: se oculta el cursor propio.
    window.addEventListener('blur', hide);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span ref={label} />
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
