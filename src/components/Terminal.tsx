import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { OpenProject } from '../App';
import { COPY } from '../data/copy';
import { PROJECTS, type Lang } from '../data/projects';
import { SITE, STACK } from '../data/site';
import { useI18n } from '../lib/i18n';
import { prefersReducedMotion, scrollToTarget } from '../lib/scroll';

type Line = { id: number; kind: 'in' | 'out'; body: ReactNode };
type Answer = ReactNode[];

const tx = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

/** Minúsculas, sin acentos ni signos: "¿Quiénes son?" → "quienes son". */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const PROJECT_KEYS = PROJECTS.map((p) => normalize(p.name));

function findProject(q: string) {
  const n = q.match(/\b(\d{1,2})\b/);
  if (n && /\b(open|abrir|abre|ver|proyecto|project|visit|visitar)\b/.test(q)) {
    const i = Number(n[1]) - 1;
    if (i >= 0 && i < PROJECTS.length) return i;
  }
  return PROJECT_KEYS.findIndex((k) => q.includes(k) || q.includes(k.replace(/[' ]/g, '')));
}

// Cada tema se reconoce por palabras sueltas, en español o en inglés.
const TOPICS: { id: string; re: RegExp }[] = [
  { id: 'contact', re: /contact|escrib|correo|email|mail|whatsapp|telefono|llamar|hablar|cotiz|presupuesto|precio|cuanto|cuesta|price|quote|cost|hire|contrat/ },
  { id: 'projects', re: /proyecto|project|portafolio|portfolio|trabajos|clientes|clients|webs|sitios|sites|\bls\b|lista|list/ },
  { id: 'services', re: /servicio|service|que hacen|que hace|hacen|ofrecen|offer|what do you do|do you do|pueden hacer|desarrollan|tienda|app|diseno|design|branding/ },
  { id: 'stack', re: /stack|tecnolog|technolog|herramienta|tools|con que|work with|lenguaje|language|framework|react/ },
  { id: 'about', re: /quien|who|about|sobre|estudio|studio|ustedes|whoami|gamma|experiencia|experience|anos|years/ },
  { id: 'hello', re: /^(hola|hello|hi|hey|buenas|buenos dias|que tal)\b/ },
  { id: 'help', re: /help|ayuda|opciones|options|comandos|commands|que puedo|what can/ },
];

/** Una terminal a la que se le pregunta con palabras normales. */
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

  const answer = useCallback(
    (raw: string): Answer => {
      const l = langRef.current;
      const q = normalize(raw);

      if (/\b(english|ingles)\b/.test(q) || q === 'lang en') {
        setLang('en');
        return ['Language: English.'];
      }
      if (/\b(espanol|spanish)\b/.test(q) || q === 'lang es') {
        setLang('es');
        return ['Idioma: español.'];
      }

      const pi = findProject(q);
      if (pi >= 0) {
        const p = PROJECTS[pi];
        onOpen(p.slug);
        return [tx(l, `Abriendo ${p.name}…`, `Opening ${p.name}…`)];
      }

      switch (TOPICS.find((topic) => topic.re.test(q))?.id) {
        case 'about':
          return [
            tx(
              l,
              `${SITE.name} es un estudio de desarrollo con ${SITE.years} años de trayectoria. Diseñamos y programamos tiendas online, plataformas y sitios de marca a medida.`,
              `${SITE.name} is a development studio with ${SITE.years} years of experience. We design and build custom online stores, platforms and brand sites.`,
            ),
          ];
        case 'services':
          return COPY.studio.services.map((s) => (
            <>
              <b>{s.name[l]}.</b> {s.text[l]}
            </>
          ));
        case 'projects':
          return [
            <ul className="term__ls">
              {PROJECTS.map((p, i) => (
                <li key={p.slug}>
                  <button type="button" onClick={() => onOpen(p.slug)}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <b>{p.name}</b>
                    <em>{p.kind[l]}</em>
                  </button>
                </li>
              ))}
            </ul>,
            tx(l, 'Toca un proyecto para abrirlo.', 'Tap a project to open it.'),
          ];
        case 'stack':
          return [
            <span className="term__stack">
              {STACK.map((s) => (
                <i key={s}>{s}</i>
              ))}
            </span>,
          ];
        case 'contact': {
          const rows: Answer = [];
          if (SITE.email) rows.push(<a href={`mailto:${SITE.email}`}>{SITE.email}</a>);
          if (SITE.whatsapp)
            rows.push(
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp +{SITE.whatsapp}
              </a>,
            );
          scrollToTarget('#contacto', 1.6);
          rows.push(tx(l, 'Te llevo a la sección de contacto.', 'Taking you to the contact section.'));
          return rows;
        }
        case 'hello':
          return [
            tx(
              l,
              'Hola. Pregunta por el estudio, lo que hacemos, los proyectos o cómo escribirnos.',
              'Hi. Ask about the studio, what we do, the projects or how to reach us.',
            ),
          ];
        default:
          return [
            tx(
              l,
              'Puedes preguntar quiénes somos, qué hacemos, con qué trabajamos o cómo escribirnos. También puedes pedir los proyectos o escribir el nombre de uno para abrirlo.',
              'You can ask who we are, what we do, what we work with or how to reach us. You can also ask for the projects or type the name of one to open it.',
            ),
          ];
      }
    },
    [onOpen, setLang],
  );

  const run = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      history.current.unshift(text);
      hIndex.current = -1;
      if (/^(clear|cls|limpiar|borrar)$/i.test(text)) {
        setLines([]);
        return;
      }
      const result = answer(text);
      setLines((prev) => [
        ...prev.slice(-40),
        { id: ++idRef.current, kind: 'in', body: text },
        ...result.map((b) => ({ id: ++idRef.current, kind: 'out' as const, body: b })),
      ]);
    },
    [answer],
  );

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Demostración: la primera vez que entra en pantalla, se escribe sola una pregunta.
  useEffect(() => {
    const el = section.current!;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const demo = COPY.term.chips[0][langRef.current];
        if (prefersReducedMotion()) {
          run(demo);
          return;
        }
        [...demo].forEach((_, i) => {
          timers.push(window.setTimeout(() => setValue(demo.slice(0, i + 1)), 350 + i * 70));
        });
        timers.push(
          window.setTimeout(() => {
            setValue('');
            run(demo);
          }, 350 + demo.length * 70 + 260),
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
          <span>gammalab</span>
        </div>
        <div className="term__body" ref={body} data-lenis-prevent role="log" aria-live="polite">
          <p className="term__line term__line--out">{t(COPY.term.hello)}</p>
          {lines.map((l) => (
            <div key={l.id} className={`term__line term__line--${l.kind}`}>
              {l.kind === 'in' && <span className="term__ps1">&gt;</span>}
              {l.body}
            </div>
          ))}
        </div>
        <label className="term__prompt">
          <span className="term__ps1" aria-hidden="true">
            &gt;
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
            enterKeyHint="send"
          />
        </label>
      </div>
      <div className="term__chips">
        {COPY.term.chips.map((c) => (
          <button key={c.es} type="button" onClick={() => run(t(c))}>
            {t(c)}
          </button>
        ))}
      </div>
    </section>
  );
}
