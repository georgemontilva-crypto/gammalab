import { Logo, Mark } from '../brand/Logo';
import { COPY } from '../data/copy';
import { SITE, whatsappLink } from '../data/site';
import { useI18n } from '../lib/i18n';
import { scrollToTarget } from '../lib/scroll';

export function Contact() {
  const { t } = useI18n();
  const links = [
    SITE.email && { href: `mailto:${SITE.email}`, label: t(COPY.contact.email), detail: SITE.email, solid: true },
    SITE.whatsapp && {
      href: whatsappLink(t(COPY.contact.whatsappText)),
      label: t(COPY.contact.whatsapp),
      detail: '',
      solid: !SITE.email,
    },
    SITE.github && { href: SITE.github, label: t(COPY.contact.github), detail: '', solid: !SITE.email && !SITE.whatsapp },
    SITE.instagram && { href: SITE.instagram, label: t(COPY.contact.instagram), detail: '', solid: false },
  ].filter(Boolean) as { href: string; label: string; detail: string; solid: boolean }[];

  return (
    <section id="contacto" className="contact">
      <Mark className="contact__mark" />
      <div className="contact__body">
        <h2 className="contact__title">{t(COPY.contact.title)}</h2>
        <p className="contact__sub">{t(COPY.contact.sub)}</p>
        <div className="contact__actions">
          {links.map((l) => (
            <a
              key={l.href}
              className={`btn ${l.solid ? 'btn--solid' : ''}`}
              href={l.href}
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {l.label}
              {l.detail && <span>{l.detail}</span>}
            </a>
          ))}
        </div>
      </div>
      <footer className="foot">
        <Logo className="foot__logo" />
        <p>
          © {new Date().getFullYear()} {SITE.name}. {t(COPY.footer.made)}
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => scrollToTarget(0, 2.2)}>
          {t(COPY.footer.top)}
        </button>
      </footer>
    </section>
  );
}
