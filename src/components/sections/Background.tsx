import { education, experience } from '@/content/background';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SectionHeader } from '@/components/ui/SectionHeader';

/** Experience and education — content mandated by docs/CONTENT.md, absent from the M2 prototype. */
export function Background() {
  return (
    <section className="blueprint-section background-section" id="background" aria-labelledby="background-heading">
      <div className="section-container">
        <SectionHeader
          index="03"
          label="BACKGROUND // EXPERIENCE & EDUCATION"
          headingId="background-heading"
          headline={['Where the ', { text: 'foundations', tone: 'italic' }, ' were built.']}
        >
          A formal software engineering education, and hands-on industry experience building interface tooling
          with a team.
        </SectionHeader>

        <div className="record-grid">
          <article className="record-card" aria-labelledby="experience-title">
            <CornerFrame />
            <div className="record-code">
              <span className="record-kind">EXPERIENCE</span>
              <span className="record-period">{experience.period}</span>
            </div>
            <h3 className="record-title" id="experience-title">
              {experience.organization}
            </h3>
            <p className="record-subtitle">
              {experience.role} · {experience.duration}
            </p>
            <p className="record-text">{experience.focus}</p>
            <ul className="record-list" aria-label="Key contributions">
              {experience.contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="record-card" aria-labelledby="education-title">
            <CornerFrame />
            <div className="record-code">
              <span className="record-kind">EDUCATION</span>
              <span className="record-period">{education.period}</span>
            </div>
            <h3 className="record-title" id="education-title">
              {education.degree}
            </h3>
            <p className="record-subtitle">CGPA {education.cgpa}</p>
            <p className="record-text">{education.institution}</p>
            <p className="record-certs-label">CERTIFICATIONS</p>
            <ul className="record-certs" aria-label="Certifications">
              {education.certifications.map((cert) => (
                <li key={cert.title}>
                  <span>
                    {cert.title} — {cert.issuer}
                  </span>
                  <span className="cert-period">{cert.period}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
