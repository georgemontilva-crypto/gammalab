import { COPY } from '../data/copy';
import { useI18n } from '../lib/i18n';
import { scrollToTarget } from '../lib/scroll';
import { MARK_PIECES } from '../brand/paths';
import { ParticleField, type FieldLayout } from './ParticleField';

// Isotipo a la derecha en pantallas anchas; arriba y centrado en teléfono.
const markLayout = (W: number, H: number): FieldLayout => {
  const wide = W >= 900;
  const size = Math.round(wide ? Math.min(W * 0.36, H * 0.68) : Math.min(W * 0.7, H * 0.3));
  const cx = wide ? W * 0.74 : W * 0.5;
  const cy = wide ? H * 0.5 : 84 + size / 2;
  return { x: cx - size / 2, y: cy - size / 2, w: size, h: size, cell: Math.max(3, size / 86) };
};

// Se dispersa a medida que el hero sale de la pantalla.
const markScatter = (rect: DOMRect) => window.scrollY / (rect.height * 0.85);

export function Hero({ ready }: { ready: boolean }) {
  const { t } = useI18n();
  return (
    <section id="top" className={`hero ${ready ? 'is-ready' : ''}`}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />
      <ParticleField
        className="hero__canvas"
        shapes={MARK_PIECES}
        vbW={655}
        vbH={655}
        layout={markLayout}
        active={ready}
        scatter={markScatter}
      />
      <div className="hero__body">
        <h1 className="hero__title">
          {COPY.hero.lines.map((l, i) => (
            <span className="mask" key={i}>
              <span style={{ transitionDelay: `${120 + i * 90}ms` }}>{t(l)}</span>
            </span>
          ))}
        </h1>
        <p className="hero__sub">{t(COPY.hero.sub)}</p>
        <div className="hero__cta">
          <a
            className="btn btn--solid"
            href="#proyectos"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget('#proyectos', 1.6);
            }}
          >
            {t(COPY.hero.cta)}
          </a>
          <a
            className="btn"
            href="#contacto"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget('#contacto', 2);
            }}
          >
            {t(COPY.hero.cta2)}
          </a>
        </div>
      </div>
      <p className="hero__hint">
        <span className="only-fine">{t(COPY.hero.hint)}</span>
        <span className="only-coarse">{t(COPY.hero.hintTouch)}</span>
      </p>
    </section>
  );
}
