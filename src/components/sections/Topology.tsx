import { layers, layerViews } from '@/content/layers';
import { projects } from '@/content/projects';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LayerInspector } from './LayerInspector';

export function Topology() {
  const projectLinks = projects.map(({ slug, shortTitle }) => ({ slug, title: shortTitle }));

  return (
    <section className="blueprint-section topology-section" id="systems-topology" aria-labelledby="topology-heading">
      <div className="section-container">
        <SectionHeader
          index="04"
          label="INTERACTIVE VISUALIZATION // FULL-STACK TOPOLOGY"
          headingId="topology-heading"
          headline={['Anatomy of a complete ', { text: 'full-stack', tone: 'italic' }, ' architecture.']}
        >
          Select a layer to see the technologies and practices I work with at each level of a full-stack
          system, and which of the projects above use it.
        </SectionHeader>

        <LayerInspector layers={layers} views={layerViews} projects={projectLinks} />
      </div>
    </section>
  );
}
