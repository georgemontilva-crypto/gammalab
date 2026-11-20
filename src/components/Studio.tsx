import { COPY } from '../data/copy';
import { STACK } from '../data/site';
import { useI18n } from '../lib/i18n';

export function Studio() {
  const { t } = useI18n();
  return (
    <section id="estudio" className="section studio">
      <div className="studio__lead">
        <h2 className="h2">{t(COPY.studio.title)}</h2>
        <p className="lead">{t(COPY.studio.body)}</p>
      </div>
      <ul className="services">
        {COPY.studio.services.map((s) => (
          <li key={s.name.es}>
            <h3>{t(s.name)}</h3>
            <p>{t(s.text)}</p>
          </li>
        ))}
      </ul>
      <div className="stack">
        <h3>{t(COPY.studio.stack)}</h3>
        <ul>
          {STACK.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
