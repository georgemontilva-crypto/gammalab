import { COPY } from '../data/copy';
import { useI18n } from '../lib/i18n';
import { scrollToTarget } from '../lib/scroll';
import { ParticleMark } from './ParticleMark';

export function Hero({ ready }: { ready: boolean }) {
  const { t } = useI18n();
  return (
    <section id="top" className={`hero ${ready ? 'is-ready' : ''}`}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />
      <ParticleMark active={ready} />
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
