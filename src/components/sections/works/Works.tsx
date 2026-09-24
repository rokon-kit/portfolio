import { projects } from '@/content/projects';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DossierCard } from './DossierCard';

export function Works() {
  return (
    <section className="blueprint-section works-section" id="selected-works" aria-labelledby="works-heading">
      <div className="section-container">
        <SectionHeader
          index="02"
          label="SELECTED WORKS // SYSTEM DOSSIERS"
          headingId="works-heading"
          headline={['Full-stack systems designed around ', { text: 'real human problems', tone: 'italic' }, '.']}
        >
          Every project starts from a human challenge and answers it with an intentional architecture —
          structured data models, type safety, and a clear purpose.
        </SectionHeader>

        <div className="dossiers-stack">
          {projects.map((project) => (
            <DossierCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
