import { LOGO_BONE, LOGO_BRAND, LOGO_VIEWBOX, MARK_PIECES, MARK_VIEWBOX } from './paths';

export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} role="img" aria-label="Gamma Lab">
      <path fill="var(--bone)" fillRule="evenodd" d={LOGO_BONE} />
      <path fill="var(--brand)" fillRule="evenodd" d={LOGO_BRAND} />
    </svg>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={MARK_VIEWBOX} aria-hidden="true">
      {MARK_PIECES.map((p) => (
        <path key={p.q} className={`mark-piece mark-piece--${p.q}`} fill={p.tone === 'brand' ? 'var(--brand)' : 'var(--bone)'} d={p.d} />
      ))}
    </svg>
  );
}
