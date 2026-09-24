import { contact } from '@/content/contact';
import { profile } from '@/content/profile';
import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ContactForm } from './ContactForm';

export function Contact() {
  const { location } = profile;

  return (
    <section className="blueprint-section contact-section" id="contact-dossier" aria-labelledby="contact-heading">
      <div className="section-container">
        <SectionHeader
          index="05"
          label="DIRECT CONNECTION // CONTACT DOSSIER"
          headingId="contact-heading"
          headline={["Let's build something ", { text: 'exceptional', tone: 'italic' }, ' together.']}
        >
          Whether you are looking for a dedicated full-stack engineer, discussing architectural design, or
          collaborating on ambitious digital tools, my inbox is open.
        </SectionHeader>

        <div className="contact-dossier-card">
          <CornerFrame />

          <div className="contact-split-grid">
            <div className="contact-channels-col">
              <div className="channels-header">
                <span className="channel-code">{'// TRANSMISSION CHANNELS'}</span>
                <span className="channel-loc">{location.city.toUpperCase()}, {location.country.toUpperCase()}</span>
              </div>

              <ul className="channels-list">
                {contact.channels.map((channel) => (
                  <li key={channel.id}>
                    <a
                      href={channel.href}
                      className="channel-item"
                      {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <span className="channel-icon-box" aria-hidden="true">{channel.icon}</span>
                      <span className="channel-details">
                        <span className="channel-title">{channel.title}</span>
                        <span className="channel-value">{channel.value}</span>
                      </span>
                      <span className="channel-arrow" aria-hidden="true">→</span>
                      {channel.external && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="resume-download-plate">
                <div className="plate-info">
                  <span className="resume-plate-title">{contact.resume.title}</span>
                  <span className="plate-desc">{contact.resume.description}</span>
                </div>
                <ButtonLink href={contact.resume.href} variant="resume">
                  <span>DOWNLOAD PDF</span>
                  <span aria-hidden="true">↓</span>
                </ButtonLink>
              </div>
            </div>

            <div className="contact-form-col">
              <div className="form-header">
                <span className="form-code">{'// DIRECT TRANSMISSION FORM'}</span>
                <span className="form-status">OPENS YOUR EMAIL APP</span>
              </div>
              <ContactForm recipient={contact.email} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
