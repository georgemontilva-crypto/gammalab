import { LOGO_BONE, LOGO_BRAND } from '../brand/paths';
import { ParticleField, type FieldLayout, type FieldShape } from './ParticleField';

const SHAPES: FieldShape[] = [
  { tone: 'bone', d: LOGO_BONE },
  { tone: 'brand', d: LOGO_BRAND },
];

// El logotipo ocupa casi todo el ancho; su proporción es 5:1.
const layout = (W: number, H: number): FieldLayout => {
  const w = Math.min(W * 0.9, 1500);
  const h = w / 5;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h, cell: w / 290 };
};

// Formado mientras cruza el centro de la pantalla; se deshace al acercarse a los bordes.
const scatter = (rect: DOMRect) => {
  const vh = window.innerHeight;
  const off = Math.abs(rect.top + rect.height / 2 - vh / 2) / vh;
  return (off - 0.3) / 0.45;
};

/** Franja entre secciones: el logotipo completo con la misma física que el isotipo del hero. */
export function Band() {
  return (
    <div className="band" aria-hidden="true">
      <div className="band__grid" />
      <ParticleField className="band__canvas" shapes={SHAPES} vbW={1080} vbH={216} layout={layout} active scatter={scatter} />
    </div>
  );
}
