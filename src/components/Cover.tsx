import type { CSSProperties } from 'react';
import { domainOf, type Project } from '../data/projects';

/** Portada generada para un proyecto que aún no tiene captura. */
export function Cover({ project }: { project: Project }) {
  return (
    <div className="cover" style={{ '--h': project.hue } as CSSProperties}>
      <span className="cover__name">{project.name}</span>
      <span className="cover__domain">{domainOf(project.url)}</span>
    </div>
  );
}
