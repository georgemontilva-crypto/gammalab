import raw from './projects.json';

export type Lang = 'es' | 'en';
export type L10n = Record<Lang, string>;

export type Project = {
  /** Identificador único; también es el nombre de archivo de las capturas en src/shots. */
  slug: string;
  name: string;
  /** Enlace público. */
  url: string;
  kind: L10n;
  blurb: L10n;
  tags: string[];
  /** Tono (0-360) de la portada generada mientras no exista captura. */
  hue: number;
  /** Selectores extra que el script de capturas debe pulsar (ventanas de edad, cookies…). */
  shotClicks?: string[];
  /** "hide": en vez de pulsar el aviso de entrada, el script lo oculta. */
  shotGate?: string;
};

export const PROJECTS = raw as Project[];

export const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
