import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { PROJECTS, domainOf, type Lang } from '../data/projects';
import { SITE, STACK } from '../data/site';
import { useI18n } from '../lib/i18n';
import { prefersReducedMotion, scrollToTarget } from '../lib/scroll';

type Line = { id: number; kind: 'in' | 'out' | 'err'; body: ReactNode };

const COMMANDS = ['help', 'ls', 'open', 'visit', 'whoami', 'stack', 'services', 'contact', 'lang', 'clear'];
const ALIASES: Record<string, string> = {
  ayuda: 'help', '?': 'help',
  proyectos: 'ls', projects: 'ls', dir: 'ls',
  abrir: 'open', cd: 'open',
  visitar: 'visit',
  about: 'whoami', estudio: 'whoami', studio: 'whoami',
  servicios: 'services',
  contacto: 'contact',
  idioma: 'lang',
  cls: 'clear', limpiar: 'clear',
};
const CHIPS = ['help', 'ls', 'open 1', 'whoami', 'stack', 'contact'];

const tx = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

function findProject(arg: string) {
  if (!arg) return -1;
  const n = Number(arg);
  if (Number.isInteger(n) && n >= 1 && n <= PROJECTS.length) return n - 1;
  const q = arg.toLowerCase().replace(/\s+/g, '-');
  let i = PROJECTS.findIndex((p) => p.slug === q);
  if (i < 0) i = PROJECTS.findIndex((p) => p.slug.startsWith(q) || p.name.toLowerCase().startsWith(arg.toLowerCase()));
  return i;
}

/** Una terminal que funciona: lista proyectos, los abre, cambia el idioma… */
export function Terminal({ onOpen }: { onOpen: OpenProject }) {
  const { t, lang, setLang } = useI18n();
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState('');
  const idRef = useRef(0);
  const history = useRef<string[]>([]);
  const hIndex = useRef(-1);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const section = useRef<HTMLElement>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  const exec = useCallback(
    (name: string, arg: string): { kind: Line['kind']; body: ReactNode }[] => {
      const l = langRef.current;
      const out = (b: ReactNode) => ({ kind: 'out' as const, body: b });
      const err = (b: ReactNode) => ({ kind: 'err' as const, body: b });
      switch (name) {
        case 'help':
          return [
            out(
              <dl className="term__help">
                {[
                  ['ls', tx(l, 'lista los proyectos', 'list the projects')],
                  ['open <n>', tx(l, 'abre la ficha de un proyecto', "open a project's page")],
                  ['visit <n>', tx(l, 'abre el sitio en otra pestaña', 'open the site in a new tab')],
                  ['whoami', tx(l, 'quiénes somos', 'who we are')],
                  ['stack', tx(l, 'con qué trabajamos', 'what we work with')],
                  ['services', tx(l, 'qué hacemos', 'what we do')],
                  ['contact', tx(l, 'cómo escribirnos', 'how to reach us')],
                  ['lang es|en', tx(l, 'cambia el idioma', 'switch language')],
                  ['clear', tx(l, 'limpia la pantalla', 'clear the screen')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>,
            ),
          ];
        case 'ls':
          return [
            out(
              <ul className="term__ls">
                {PROJECTS.map((p, i) => (
                  <li key={p.slug}>
                    <button type="button" onClick={() => onOpen(p.slug)}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <b>{p.slug}</b>
                      <em>{p.kind[l]}</em>
                    </button>
                  </li>
                ))}
              </ul>,
            ),
            out(tx(l, 'Escribe open y el número, o toca un proyecto.', 'Type open and the number, or tap a project.')),
          ];
        case 'open':
        case 'visit': {
          const i = findProject(arg);
          if (i < 0)
            return [
              err(
                tx(
                  l,
                  `No hay ningún proyecto "${arg || '?'}". Usa ls para ver la lista.`,
                  `There is no project "${arg || '?'}". Use ls to see the list.`,
                ),
              ),
            ];
          const p = PROJECTS[i];
          if (name === 'open') {
            onOpen(p.slug);
            return [out(tx(l, `Abriendo ${p.name}…`, `Opening ${p.name}…`))];
          }
          window.open(p.url, '_blank', 'noopener,noreferrer');
          return [out(`→ ${domainOf(p.url)}`)];
        }
        case 'whoami':
          return [
            out(
              tx(
                l,
                `${SITE.name}: un estudio de desarrollo con ${SITE.years} años construyendo tiendas, plataformas y webs de marca. Todo en código propio, sin plantillas.`,
                `${SITE.name}: a development studio with ${SITE.years} years building stores, platforms and brand sites. All custom code, no templates.`,
              ),
            ),
          ];
        case 'stack':
          return [out(<span className="term__stack">{STACK.map((s) => <i key={s}>{s}</i>)}</span>)];
        case 'services':
          return COPY.studio.services.map((s) =>
            out(
              <>
                <b>{s.name[l]}</b>: {s.text[l]}
              </>,
            ),
          );
        case 'contact': {
          const rows: ReactNode[] = [];
          if (SITE.email) rows.push(<a href={`mailto:${SITE.email}`}>{SITE.email}</a>);
          if (SITE.whatsapp)
            rows.push(
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp +{SITE.whatsapp}
              </a>,
            );
          if (SITE.github)
            rows.push(
              <a href={SITE.github} target="_blank" rel="noopener noreferrer">
                {SITE.github.replace('https://', '')}
              </a>,
            );
          scrollToTarget('#contacto', 1.6);
          return rows.map((r) => out(r));
        }
        case 'lang': {
          if (arg !== 'es' && arg !== 'en') return [err(tx(l, 'Uso: lang es | lang en', 'Usage: lang es | lang en'))];
          setLang(arg);
          return [out(arg === 'es' ? 'Idioma: español.' : 'Language: English.')];
        }
        case 'sudo':
          return [err(tx(l, 'Buen intento. Aquí no hace falta ser root: prueba con help.', 'Nice try. No root needed here: try help.'))];
        default:
          return [
            err(
              tx(
                l,
                `Comando no encontrado: ${name}. Escribe help para ver los disponibles.`,
                `Command not found: ${name}. Type help to see what's available.`,
              ),
            ),
          ];
      }
    },
    [onOpen, setLang],
  );

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      history.current.unshift(cmd);
      hIndex.current = -1;
      const [first, ...rest] = cmd.split(/\s+/);
      const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
      if (name === 'clear') {
        setLines([]);
        return;
      }
      const result = exec(name, rest.join(' '));
      setLines((prev) => [
        ...prev.slice(-60),
        { id: ++idRef.current, kind: 'in', body: cmd },
        ...result.map((r) => ({ id: ++idRef.current, ...r })),
      ]);
    },
    [exec],
  );

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Demostración: la primera vez que la terminal entra en pantalla, se escribe sola.
  useEffect(() => {
    const el = section.current!;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const demo = 'whoami';
        if (prefersReducedMotion()) {
          run(demo);
          return;
        }
        [...demo].forEach((_, i) => {
          timers.push(window.setTimeout(() => setValue(demo.slice(0, i + 1)), 350 + i * 95));
        });
        timers.push(
          window.setTimeout(() => {
            setValue('');
            run(demo);
          }, 350 + demo.length * 95 + 260),
        );
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      timers = [];
    };
  }, [run]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Sin esto, el mismo Enter activaría el botón que reciba el foco al abrir una ficha.
      e.preventDefault();
      run(value);
      setValue('');
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      hIndex.current = Math.max(-1, Math.min(h.length - 1, hIndex.current + (e.key === 'ArrowUp' ? 1 : -1)));
      setValue(hIndex.current < 0 ? '' : h[hIndex.current]);
    } else if (e.key === 'Tab' && value.trim()) {
      const [first, ...rest] = value.split(/\s+/);
      if (!rest.length) {
        const hit = COMMANDS.find((c) => c.startsWith(first.toLowerCase()));
        if (hit) {
          e.preventDefault();
          setValue(hit === 'open' || hit === 'visit' || hit === 'lang' ? `${hit} ` : hit);
        }
      } else {
        const hit = PROJECTS.find((p) => p.slug.startsWith(rest.join('-').toLowerCase()));
        if (hit) {
          e.preventDefault();
          setValue(`${first} ${hit.slug}`);
        }
      }
    }
  };

  return (
    <section id="terminal" ref={section} className="section term">
      <header className="section__head">
        <h2 className="h2">{t(COPY.term.title)}</h2>
        <p className="lead">{t(COPY.term.sub)}</p>
      </header>
      <div
        className="term__win"
        onClick={(e) => {
          if (!(e.target as Element).closest('a, button') && !window.getSelection()?.toString())
            input.current?.focus({ preventScroll: true });
        }}
      >
        <div className="term__bar">
          <i />
          <span>gammalab: ~</span>
        </div>
        <div className="term__body" ref={body} data-lenis-prevent role="log" aria-live="polite">
          <p className="term__line term__line--out">
            {tx(lang, 'Gamma Lab shell. Escribe help para empezar.', 'Gamma Lab shell. Type help to get started.')}
          </p>
          {lines.map((l) => (
            <div key={l.id} className={`term__line term__line--${l.kind}`}>
              {l.kind === 'in' && <span className="term__ps1">~ %</span>}
              {l.body}
            </div>
          ))}
        </div>
        <label className="term__prompt">
          <span className="term__ps1" aria-hidden="true">
            ~ %
          </span>
          <span className="sr-only">{t(COPY.term.inputLabel)}</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={t(COPY.term.placeholder)}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </label>
      </div>
      <div className="term__chips">
        {CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => run(c)}>
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
