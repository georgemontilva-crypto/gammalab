import { useEffect, useState } from 'react';
import { Logo } from '../brand/Logo';
import { COPY } from '../data/copy';
import { useI18n } from '../lib/i18n';
import { lockScroll, scrollToTarget } from '../lib/scroll';

const LINKS = [
  { id: 'proyectos', label: COPY.nav.work },
  { id: 'terminal', label: COPY.nav.terminal },
  { id: 'estudio', label: COPY.nav.studio },
  { id: 'contacto', label: COPY.nav.contact },
] as const;

export function Nav() {
  const { t, lang, setLang } = useI18n();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onBrand, setOnBrand] = useState(false);

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 40);
      // Sobre el bloque magenta de contacto, el logo y los enlaces pasan a tinta.
      const contact = document.getElementById('contacto');
      setOnBrand(!!contact && contact.getBoundingClientRect().top < 34);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!menu) return;
    lockScroll(true);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const go = (id: string) => {
    setMenu(false);
    // Deja que el bloqueo de scroll del menú se libere antes de moverse.
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${menu ? 'is-open' : ''} ${onBrand && !menu ? 'on-brand' : ''}`}>
      <a
        className="nav__logo"
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          setMenu(false);
          scrollToTarget(0);
        }}
      >
        <Logo />
      </a>
      <nav className="nav__links" aria-label="Principal">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={(e) => {
              e.preventDefault();
              go(l.id);
            }}
          >
            {t(l.label)}
          </a>
        ))}
      </nav>
      <div className="nav__tools">
        <button
          type="button"
          className="lang"
          aria-label={t(COPY.nav.lang)}
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        >
          <span className={lang === 'es' ? 'on' : ''}>ES</span>
          <span className={lang === 'en' ? 'on' : ''}>EN</span>
        </button>
        <button
          type="button"
          className="nav__burger"
          aria-expanded={menu}
          aria-controls="menu"
          onClick={() => setMenu((m) => !m)}
        >
          {menu ? t(COPY.nav.close) : t(COPY.nav.menu)}
        </button>
      </div>
      <div id="menu" className="menu" hidden={!menu}>
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={(e) => {
              e.preventDefault();
              go(l.id);
            }}
          >
            {t(l.label)}
          </a>
        ))}
      </div>
    </header>
  );
}
