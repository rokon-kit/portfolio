import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SchematicPlate } from '@/components/ui/SchematicPlate';
import { getAdjacentProjects, getProject, projects } from '@/content/projects';

interface CaseStudyPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

// Only the slugs below exist; anything else is a 404. Keeps the route fully static.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: { type: 'article', url: `/work/${project.slug}`, title: project.title, description: project.summary },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  const adjacent = getAdjacentProjects(slug);
  if (!project || !adjacent) notFound();

  const { previous, next } = adjacent;

  return (
    <article className="case-study" aria-labelledby="case-title">
      <div className="section-container">
        <Link href="/#selected-works" className="case-breadcrumb">
          <span aria-hidden="true">←</span> BACK TO SELECTED WORKS
        </Link>

        <header className="case-header">
          <div className="dossier-header-meta">
            <span className="sys-code">{project.systemCode}</span>
            <span className={`sys-status tone-${project.roleTone}`}>{project.role.toUpperCase()}</span>
          </div>
          <h1 className="case-title" id="case-title">
            {project.title}
          </h1>
          <ul className="tech-stack-pills" aria-label="Technology stack">
            {project.stack.map((tech) => (
              <li key={tech} className="tech-pill">
                {tech}
              </li>
            ))}
          </ul>
        </header>

        <div className="case-grid">
          <div className="case-main">
            <section className="case-block" aria-labelledby="case-challenge">
              <h2 className="case-heading amber" id="case-challenge">
                HUMAN CHALLENGE
              </h2>
              <p className="case-text">{project.challenge}</p>
            </section>

            <section className="case-block" aria-labelledby="case-approach">
              <h2 className="case-heading" id="case-approach">
                ENGINEERING APPROACH
              </h2>
              <ul className="case-list">
                {project.approach.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="case-block" aria-labelledby="case-human">
              <h2 className="case-heading amber" id="case-human">
                THE HUMAN DIMENSION
              </h2>
              <p className="case-text">{project.humanDimension}</p>
            </section>

            <div className="dossier-actions">
              {project.repos.map((repo, index) => (
                <ButtonLink key={repo.href} href={repo.href} variant={index === 0 ? 'repo' : 'subrepo'}>
                  <span>{repo.label}</span>
                </ButtonLink>
              ))}
            </div>
          </div>

          <aside className="case-aside" aria-label="Architecture and key facts">
            <SchematicPlate figure={project.figure} />
            <dl className="case-facts">
              <CornerFrame />
              {project.facts.map((fact) => (
                <div key={fact.key} className="impact-item">
                  <dt className="impact-key">{fact.key}</dt>
                  <dd className="impact-val">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <nav className="case-pager" aria-label="More case studies">
          <Link href={`/work/${previous.slug}`} className="case-pager-link">
            <span className="case-pager-label">← PREVIOUS</span>
            <span className="case-pager-title">{previous.shortTitle}</span>
          </Link>
          <Link href={`/work/${next.slug}`} className="case-pager-link next">
            <span className="case-pager-label">NEXT →</span>
            <span className="case-pager-title">{next.shortTitle}</span>
          </Link>
        </nav>
      </div>
    </article>
  );
}
