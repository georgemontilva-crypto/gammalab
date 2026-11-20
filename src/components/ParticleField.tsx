import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/scroll';

const BRAND = '#FF2D55';
const BONE = '#EFEFEF';

export type FieldShape = { tone: 'bone' | 'brand'; d: string };
export type FieldLayout = { x: number; y: number; w: number; h: number; cell: number };

type Props = {
  className?: string;
  /** Trazos SVG que forman la figura, en las unidades de su viewBox. */
  shapes: FieldShape[];
  vbW: number;
  vbH: number;
  /** Dónde y a qué tamaño se dibuja la figura dentro del canvas. */
  layout: (W: number, H: number) => FieldLayout;
  /** La figura empieza a formarse cuando esto es true y el canvas está en pantalla. */
  active: boolean;
  /** 0 = figura formada · 1 = dispersa. Se consulta en cada fotograma. */
  scatter: (rect: DOMRect) => number;
};

/**
 * Una figura hecha de "píxeles" con física: vuelven a su sitio con un resorte,
 * huyen del cursor, estallan con un clic y se dispersan según `scatter`.
 * La usan el isotipo del hero y la franja del logotipo.
 */
export function ParticleField({ className, shapes, vbW, vbH, layout, active, scatter }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const scatterRef = useRef(scatter);
  scatterRef.current = scatter;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = prefersReducedMotion();

    let W = 0;
    let H = 0;
    let dpr = 1;
    let n = 0;
    let split = 0; // [0, split) hueso · [split, n) marca
    let cell = 4;
    let x = new Float32Array(0);
    let y = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);

    let mx = -9999;
    let my = -9999;
    let raf = 0;
    let running = false;
    let born = 0; // instante en que la figura empieza a formarse
    let built = false;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      const box = layoutRef.current(W, H);
      const bw = Math.max(2, Math.round(box.w));
      const bh = Math.max(2, Math.round(box.h));
      cell = Math.max(2, Math.round(box.cell));

      const off = document.createElement('canvas');
      off.width = bw;
      off.height = bh;
      const o = off.getContext('2d', { willReadFrequently: true })!;
      o.scale(bw / vbW, bh / vbH);
      for (const s of shapes) {
        o.fillStyle = s.tone === 'brand' ? '#ff0000' : '#0000ff';
        o.fill(new Path2D(s.d), 'evenodd');
      }
      const data = o.getImageData(0, 0, bw, bh).data;
      const bone: number[] = [];
      const brand: number[] = [];
      for (let gy = cell >> 1; gy < bh; gy += cell) {
        for (let gx = cell >> 1; gx < bw; gx += cell) {
          const i = (gy * bw + gx) * 4;
          if (data[i + 3] < 128) continue;
          (data[i] > data[i + 2] ? brand : bone).push(box.x + gx, box.y + gy);
        }
      }
      const homes = bone.concat(brand);
      const count = homes.length / 2;
      const keep = built && count === n;
      split = bone.length / 2;
      n = count;
      hx = new Float32Array(n);
      hy = new Float32Array(n);
      if (!keep) {
        x = new Float32Array(n);
        y = new Float32Array(n);
        vx = new Float32Array(n);
        vy = new Float32Array(n);
        sx = new Float32Array(n);
        sy = new Float32Array(n);
      }
      const cx = box.x + bw / 2;
      const cy = box.y + bh / 2;
      const reach = Math.max(W, H);
      for (let i = 0; i < n; i++) {
        hx[i] = homes[i * 2];
        hy[i] = homes[i * 2 + 1];
        if (keep) continue;
        const a = Math.random() * Math.PI * 2;
        const r = 0.35 + Math.random() * 0.65;
        sx[i] = Math.cos(a) * r;
        sy[i] = Math.sin(a) * r;
        if (reduce) {
          x[i] = hx[i];
          y[i] = hy[i];
        } else {
          x[i] = cx + sx[i] * reach;
          y[i] = cy + sy[i] * reach;
        }
      }
      built = true;
    };

    const draw = (alpha: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (alpha <= 0 || !n) return;
      // Con celdas muy pequeñas (teléfono) el píxel casi llena la celda para que no pierda brillo.
      const s = cell <= 2 ? cell * 0.86 : cell * 0.68;
      const h = s / 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = BONE;
      for (let i = 0; i < split; i++) ctx.fillRect(x[i] - h, y[i] - h, s, s);
      ctx.fillStyle = BRAND;
      for (let i = split; i < n; i++) ctx.fillRect(x[i] - h, y[i] - h, s, s);
      // Destellos: unos pocos píxeles se encienden en cada fotograma.
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 10; k++) {
        const i = (Math.random() * n) | 0;
        ctx.fillRect(x[i] - h, y[i] - h, s, s);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      if (activeRef.current && !born) born = now;
      if (!born || !n) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const sc = Math.min(1, Math.max(0, scatterRef.current(canvas.getBoundingClientRect())));
      const push = sc * sc * Math.max(W, H) * 0.75;
      const R = Math.max(90, cell * 26);
      const R2 = R * R;
      const t = now * 0.0013;
      for (let i = 0; i < n; i++) {
        const tx = hx[i] + sx[i] * push + Math.sin(t + hy[i] * 0.02) * 1.4;
        const ty = hy[i] + sy[i] * push + Math.cos(t + hx[i] * 0.02) * 1.4;
        let ax = (tx - x[i]) * 0.05;
        let ay = (ty - y[i]) * 0.05;
        const dx = x[i] - mx;
        const dy = y[i] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) ** 2 * 5.5;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
        vx[i] = (vx[i] + ax) * 0.86;
        vy[i] = (vy[i] + ay) * 0.86;
        x[i] += vx[i];
        y[i] += vy[i];
      }
      const fadeIn = Math.min(1, (now - born) / 500);
      draw(fadeIn * (1 - sc * 0.9));
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = my = -9999;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY > r.bottom || e.clientY < r.top) return;
      if ((e.target as Element).closest('a, button, input')) return;
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const B = Math.max(260, cell * 90);
      for (let i = 0; i < n; i++) {
        const dx = x[i] - px;
        const dy = y[i] - py;
        const d = Math.hypot(dx, dy) || 1;
        if (d > B) continue;
        const f = (1 - d / B) ** 2 * 46;
        vx[i] += (dx / d) * f + (Math.random() - 0.5) * 6;
        vy[i] += (dy / d) * f + (Math.random() - 0.5) * 6;
      }
      if (e.pointerType !== 'mouse') onLeave();
    };

    build();
    if (reduce) draw(1);

    const ro = new ResizeObserver(() => {
      build();
      if (reduce) draw(1);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
    // La figura no cambia durante la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
