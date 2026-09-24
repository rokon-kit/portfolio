import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { JsonLd } from '@/components/seo/JsonLd';
import { contact } from '@/content/contact';
import { profile } from '@/content/profile';
import { siteConfig } from '@/lib/site';
import './globals.css';

// Self-hosted at build time by next/font — no runtime request to Google Fonts.
const display = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-newsreader',
});

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  keywords: [
    'Md. Rokonuzzaman',
    'full-stack software engineer',
    'Dhaka',
    'Bangladesh',
    'Java',
    'Spring Boot',
    'TypeScript',
    'React',
    'Next.js',
  ],
  alternates: { canonical: '/' },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.locale,
  },
  twitter: {
    card: 'summary',
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0B0E14',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.title,
  url: siteConfig.url,
  address: {
    '@type': 'PostalAddress',
    addressLocality: profile.location.city,
    addressCountry: 'BD',
  },
  alumniOf: 'Noakhali Science and Technology University',
  sameAs: contact.channels.filter((channel) => channel.external).map((channel) => channel.href),
};

/*
 * `data-scroll-behavior` on <html>: base.css enables smooth in-page scrolling (only when the
 * visitor has not requested reduced motion); this attribute tells Next to suspend it during
 * route transitions so page changes are instant.
 */
export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <SkipLink />
        <Header />
        <main id="main" tabIndex={-1} className="blueprint-canvas">
          {children}
        </main>
        <Footer />
        <JsonLd data={personJsonLd} />
      </body>
    </html>
  );
}
