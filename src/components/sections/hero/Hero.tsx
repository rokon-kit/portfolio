import { heroMetrics } from '@/content/background';
import { contact } from '@/content/contact';
import { profile } from '@/content/profile';
import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { RichText } from '@/components/ui/RichText';
import { HeroViewport } from './HeroViewport';

/**
 * Hero section. The headline, summary and calls to action are server-rendered so the
 * largest contentful paint never waits on JavaScript (or, in Milestone 4, on WebGL).
 */
export function Hero() {
  return (
    <section className="blueprint-section hero-section" id="hero" aria-labelledby="hero-heading">
      <div className="section-container">
        <div className="blueprint-ribbon">
          <p className="ribbon-tag">
            <span className="blueprint-bracket" aria-hidden="true">[</span>
            <span className="ribbon-text">{profile.ribbon.tag}</span>
            <span className="blueprint-bracket" aria-hidden="true">]</span>
          </p>
          <p className="ribbon-coords">{profile.ribbon.note}</p>
        </div>

        <div className="hero-split-grid">
          <div className="hero-narrative-col">
            <p className="hero-eyebrow">
              <span className="eyebrow-dash" aria-hidden="true">—</span>
              <span className="eyebrow-text">{profile.eyebrow}</span>
            </p>

            <h1 className="hero-headline" id="hero-heading">
              <RichText content={profile.headline} />
            </h1>

            <p className="hero-summary">
              <RichText content={profile.summary} />
            </p>

            <figure className="human-ethos-box">
              <CornerFrame />
              <figcaption className="ethos-header">
                <span className="ethos-icon" aria-hidden="true">❖</span>
                <span className="ethos-title">CORE ENGINEERING ETHOS</span>
              </figcaption>
              <blockquote className="ethos-quote">“{profile.ethos.quote}”</blockquote>
              <p className="ethos-footer">{profile.ethos.focus}</p>
            </figure>

            <div className="hero-cta-group">
              <ButtonLink href="/#selected-works" variant="primary">
                <span className="btn-label">EXPLORE DOSSIERS</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href={contact.resume.href} variant="secondary">
                <span className="btn-label">DOWNLOAD RESUME</span>
                <span className="btn-icon" aria-hidden="true">↓</span>
              </ButtonLink>
              <ButtonLink href="/#contact-dossier" variant="ghost">
                <span className="btn-label">GET IN TOUCH</span>
              </ButtonLink>
            </div>
          </div>

          <div className="hero-visual-col">
            <HeroViewport />

            <ul className="hero-telemetry-grid" aria-label="Profile at a glance">
              {heroMetrics.map((metric) => (
                <li key={metric.label} className="telemetry-metric-tile">
                  <span className="tile-number">{metric.value}</span>
                  <span className="tile-label">{metric.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
