/**
 * Datos de contacto del estudio. Los campos vacíos no se muestran en la web.
 */
export const SITE = {
  name: 'Gamma Lab',
  years: 8,
  /** Correo de contacto, p. ej. "hola@tudominio.com". */
  email: '',
  /** WhatsApp con código de país y solo números, p. ej. "573001234567". */
  whatsapp: '573023169089',
  github: '',
  instagram: '',
};

/** Enlace de WhatsApp con un mensaje ya escrito. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

export const STACK = [
  'React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Node.js', 'tRPC', 'Drizzle ORM', 'MySQL',
  'Railway', 'Cloudflare R2', 'Resend', 'Stripe', 'WebGL', 'PWA', 'Tauri', 'Claude API',
];
