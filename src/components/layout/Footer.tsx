import Link from 'next/link';
import { navItems, profile } from '@/content/profile';
import { Monogram } from '@/components/ui/Monogram';

const { location } = profile;

/** "The Closing Blueprint Plate". */
export function Footer() {
  const footerLinks = navItems.filter((item) => item.id !== 'hero');

  return (
    <footer className="blueprint-footer">
      <div className="footer-container">
        <div className="footer-top-row">
          <div className="footer-brand">
            <Monogram size={24} />
            <span className="footer-name">{profile.name.toUpperCase()}</span>
            <span className="footer-tagline">· {profile.eyebrow}</span>
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/#hero">Top</Link>
            {footerLinks.map((item) => (
              <Link key={item.id} href={`/#${item.id}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-hairline" />

        <div className="footer-bottom-row">
          <p className="footer-copy">
            © {new Date().getFullYear()} {profile.name}. Designed with architectural discipline &amp; human
            empathy. All rights reserved.
          </p>
          <p className="footer-telemetry">
            <span>LAT {location.latitude.toFixed(4)}° N</span>
            <span>LON {location.longitude.toFixed(4)}° E</span>
            <span>{location.city.toUpperCase()}, {location.country.toUpperCase()}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
