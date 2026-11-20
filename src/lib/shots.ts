// Capturas generadas por `npm run shots` (o por la acción de GitHub). Si no hay
// captura de un proyecto, la web dibuja una portada generada.
const files = import.meta.glob('../shots/*.{webp,jpg,png}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const byName = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.(webp|jpg|png)$/, '');
  byName.set(name, url);
}

export type Shots = { hero?: string; full?: string; mobile?: string };

export function shotsFor(slug: string): Shots {
  return {
    hero: byName.get(slug),
    full: byName.get(`${slug}-full`) ?? byName.get(slug),
    mobile: byName.get(`${slug}-mobile`),
  };
}
