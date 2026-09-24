import Link from 'next/link';
import { contact } from '@/content/contact';
import { navItems, profile } from '@/content/profile';
import { Monogram } from '@/components/ui/Monogram';
import { HeaderNav } from './HeaderNav';

const { location } = profile;
const latitude = `${location.latitude.toFixed(2)}°N`;
const longitude = `${location.longitude.toFixed(2)}°E`;

/** "The Precision Rail": sticky top bar with monogram, coordinates and navigation. */
export function Header() {
  return (
    <header className="precision-rail">
      <div className="rail-container">
        <Link href="/" className="brand-anchor" aria-label={`${profile.name} — ${profile.shortTitle}, home`}>
          <div className="monogram-badge">
            <Monogram size={34} className="brand-glyph" />
            <div className="brand-meta">
              <span className="brand-name">{profile.name.toUpperCase()}</span>
              <span className="brand-title">{profile.shortTitle.toUpperCase()}</span>
            </div>
          </div>
        </Link>

        <div className="rail-telemetry" aria-hidden="true">
          <span className="telemetry-item">
            <span className="coord-label">LOC:</span> {location.city.toUpperCase()} {latitude} {longitude}
          </span>
          <span className="telemetry-separator">/</span>
          <span className="telemetry-item">
            <span className="coord-label">TZ:</span> {location.timezone}
          </span>
        </div>

        <div className="rail-actions">
          <HeaderNav
            items={navItems}
            availability={profile.availability}
            email={contact.email}
            locationLabel={`${location.city}, ${location.country} · ${location.timezone}`}
          />
        </div>
      </div>
    </header>
  );
}
