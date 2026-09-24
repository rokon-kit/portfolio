import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SchematicPlate } from '@/components/ui/SchematicPlate';
import type { Project } from '@/types/content';

const GITHUB_ICON_PATH =
  'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z';

interface DossierCardProps {
  readonly project: Project;
}

/** A "System Dossier": project summary, verified facts, and its architecture schematic. */
export function DossierCard({ project }: DossierCardProps) {
  const titleId = `dossier-${project.slug}-title`;
  const [primaryRepo, ...otherRepos] = project.repos;

  return (
    <article className="system-dossier-card" id={`dossier-${project.slug}`} aria-labelledby={titleId}>
      <CornerFrame />

      <div className="dossier-grid">
        <div className="dossier-specs-col">
          <div className="dossier-header-meta">
            <span className="sys-code">{project.systemCode}</span>
            <span className={`sys-status tone-${project.roleTone}`}>{project.role.toUpperCase()}</span>
          </div>

          <h3 className="dossier-title" id={titleId}>
            {project.title}
          </h3>

          <ul className="tech-stack-pills" aria-label="Technology stack">
            {project.stack.map((tech) => (
              <li key={tech} className="tech-pill">
                {tech}
              </li>
            ))}
          </ul>

          <div className="challenge-solution-grid">
            <div className="cs-box problem-box">
              <span className="cs-label">HUMAN CHALLENGE</span>
              <p className="cs-text">{project.challenge}</p>
            </div>
            <div className="cs-box solution-box">
              <span className="cs-label">ENGINEERING ARCHITECTURE</span>
              <p className="cs-text">{project.approachSummary}</p>
            </div>
          </div>

          <dl className="impact-metrics-row">
            {project.facts.map((fact) => (
              <div key={fact.key} className="impact-item">
                <dt className="impact-key">{fact.key}</dt>
                <dd className="impact-val">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="dossier-actions">
            {primaryRepo && (
              <ButtonLink href={primaryRepo.href} variant="repo">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
                  <path d={GITHUB_ICON_PATH} />
                </svg>
                <span>{primaryRepo.label}</span>
              </ButtonLink>
            )}
            {otherRepos.map((repo) => (
              <ButtonLink key={repo.href} href={repo.href} variant="subrepo">
                <span>{repo.label}</span>
              </ButtonLink>
            ))}
            <ButtonLink
              href={`/work/${project.slug}`}
              variant="case"
              ariaLabel={`Read the case study: ${project.title}`}
            >
              <span>CASE STUDY</span>
              <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
        </div>

        <div className="dossier-diagram-col">
          <SchematicPlate figure={project.figure} />
        </div>
      </div>
    </article>
  );
}
