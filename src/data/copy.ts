import type { L10n } from './projects';

const c = (es: string, en: string): L10n => ({ es, en });

export const COPY = {
  nav: {
    work: c('Proyectos', 'Projects'),
    terminal: c('Preguntas', 'Ask'),
    studio: c('Estudio', 'Studio'),
    contact: c('Contacto', 'Contact'),
    menu: c('Menú', 'Menu'),
    close: c('Cerrar', 'Close'),
    lang: c('Cambiar idioma a inglés', 'Switch language to Spanish'),
  },
  hero: {
    lines: [c('Desarrollo web', 'Custom web'), c('y plataformas', 'development'), c('a medida.', 'and platforms.')],
    sub: c(
      'Gamma Lab es un estudio de desarrollo con 8 años de trayectoria. Diseñamos y programamos tiendas online, plataformas y sitios de marca.',
      'Gamma Lab is a development studio with 8 years of experience. We design and build online stores, platforms and brand sites.',
    ),
    cta: c('Ver proyectos', 'See projects'),
    cta2: c('Escribirnos', 'Write to us'),
    hint: c('Pasa el cursor por el logo. Haz clic para romperlo.', 'Hover the logo. Click to break it.'),
    hintTouch: c('Toca el logo para romperlo.', 'Tap the logo to break it.'),
  },
  work: {
    title: c('Proyectos', 'Projects'),
    intro: c(
      'Cada ventana es una web real. Sigue bajando para recorrerlas.',
      'Every window is a real website. Keep scrolling to fly through them.',
    ),
    swipe: c('Desliza para recorrerlos. Toca uno para abrirlo.', 'Swipe to browse them. Tap one to open it.'),
    tunnel: c('Túnel', 'Tunnel'),
    list: c('Lista', 'List'),
    view: c('Vista de proyectos', 'Project view'),
    open: c('Abrir proyecto', 'Open project'),
    visit: c('Visitar sitio', 'Visit site'),
    goTo: c('Ir a', 'Go to'),
    cursorOpen: c('Abrir', 'Open'),
    cursorGo: c('Ir', 'Go'),
  },
  cas: {
    shot: c('Captura', 'Screenshot'),
    live: c('En vivo', 'Live'),
    desktop: c('Escritorio', 'Desktop'),
    mobile: c('Móvil', 'Mobile'),
    close: c('Cerrar', 'Close'),
    prev: c('Anterior', 'Previous'),
    next: c('Siguiente', 'Next'),
    mode: c('Modo de vista', 'View mode'),
    device: c('Dispositivo', 'Device'),
    liveNote: c(
      'Estás viendo el sitio real. Si queda en blanco, ese sitio no permite mostrarse dentro de otra página: ábrelo con «Visitar sitio».',
      "You're looking at the real site. If it stays blank, that site doesn't allow being shown inside another page: open it with “Visit site”.",
    ),
    shotNote: c('Desplázate dentro de la ventana para recorrer la página.', 'Scroll inside the window to browse the page.'),
    keys: c('Esc cierra. Las flechas cambian de proyecto.', 'Esc closes. Arrow keys switch project.'),
  },
  term: {
    title: c('Pregúntanos lo que quieras.', 'Ask us anything.'),
    sub: c('Escribe tu pregunta o toca una de las de abajo.', 'Type your question or tap one of the ones below.'),
    hello: c('Hola. ¿Qué quieres saber del estudio?', 'Hi. What would you like to know about the studio?'),
    placeholder: c('escribe tu pregunta', 'type your question'),
    inputLabel: c('Tu pregunta', 'Your question'),
    chips: [
      c('¿Quiénes son?', 'Who are you?'),
      c('¿Qué hacen?', 'What do you do?'),
      c('Ver proyectos', 'See projects'),
      c('¿Con qué trabajan?', 'What do you work with?'),
      c('Contacto', 'Contact'),
    ],
  },
  studio: {
    title: c('Un estudio pequeño que escribe su propio código.', 'A small studio that writes its own code.'),
    body: c(
      'Trabajamos sin plantillas ni constructores de páginas. Cada proyecto se diseña, se programa y se publica aquí, así que recibes exactamente lo que ves: rápido, a tu medida y fácil de mantener.',
      'We work without templates or page builders. Every project is designed, coded and shipped here, so you get exactly what you see: fast, made to measure and easy to maintain.',
    ),
    years: c('años construyendo para la web', 'years building for the web'),
    services: [
      {
        name: c('Desarrollo web', 'Web development'),
        text: c(
          'Tiendas online, sitios de marca, landings y plataformas con panel de administración.',
          'Online stores, brand sites, landing pages and platforms with an admin panel.',
        ),
      },
      {
        name: c('Apps', 'Apps'),
        text: c(
          'Aplicaciones web y de escritorio, del prototipo a la publicación.',
          'Web and desktop applications, from prototype to release.',
        ),
      },
      {
        name: c('Diseño UI/UX', 'UI/UX design'),
        text: c(
          'Interfaces claras que se sienten bien en el teléfono y en pantalla grande.',
          'Clear interfaces that feel right on a phone and on a large screen.',
        ),
      },
      {
        name: c('Branding', 'Branding'),
        text: c(
          'Nombre, logotipo y sistema visual para que tu marca se reconozca.',
          'Name, logo and visual system so your brand is recognized.',
        ),
      },
    ],
    stack: c('Con qué trabajamos', 'What we work with'),
  },
  contact: {
    title: c('¿Tienes un proyecto en mente?', 'Got a project in mind?'),
    sub: c(
      'Cuéntanos qué necesitas y te respondemos con una propuesta.',
      "Tell us what you need and we'll reply with a proposal.",
    ),
    email: c('Enviar correo', 'Send email'),
    whatsapp: c('Escribir por WhatsApp', 'Message on WhatsApp'),
    whatsappText: c('Hola, quiero hablar de un proyecto.', "Hi, I'd like to talk about a project."),
    github: c('Ver GitHub', 'See GitHub'),
    instagram: c('Ver Instagram', 'See Instagram'),
  },
  footer: {
    top: c('Volver arriba', 'Back to top'),
    made: c('Diseñada y programada a mano.', 'Designed and coded by hand.'),
  },
};
