import type { ProjectFigure } from '@/types/content';
import { ProjectDiagram } from '@/components/figures';

interface SchematicPlateProps {
  readonly figure: ProjectFigure;
}

/** Framed schematic figure. The diagram scrolls horizontally on very narrow screens instead of shrinking its text. */
export function SchematicPlate({ figure }: SchematicPlateProps) {
  return (
    <figure className="schematic-plate">
      <figcaption className="plate-hud">
        <span className="plate-title">{figure.title}</span>
        <span className="plate-tag">{figure.tag}</span>
      </figcaption>
      <div
        className="schematic-canvas-box"
        role="region"
        aria-label={`${figure.tag} diagram`}
        tabIndex={0}
      >
        <ProjectDiagram id={figure.id} description={figure.description} />
      </div>
      <p className="plate-scroll-hint" aria-hidden="true">
        ← SWIPE TO VIEW THE FULL DIAGRAM →
      </p>
      <div className="plate-footer">
        <span>{figure.footer[0]}</span>
        <span>{figure.footer[1]}</span>
      </div>
    </figure>
  );
}
