import type { FigureId } from '@/types/content';
import { ChemistryFigure } from './ChemistryFigure';
import { CourseflowFigure } from './CourseflowFigure';
import { VolunteeringFigure } from './VolunteeringFigure';

interface ProjectDiagramProps {
  readonly id: FigureId;
  readonly description: string;
}

/** Maps a project's figure id to its diagram component. */
export function ProjectDiagram({ id, description }: ProjectDiagramProps) {
  switch (id) {
    case 'volunteering':
      return <VolunteeringFigure description={description} />;
    case 'courseflow':
      return <CourseflowFigure description={description} />;
    case 'chemistry':
      return <ChemistryFigure description={description} />;
  }
}
