/**
 * Site-wide constants. The canonical URL comes from `NEXT_PUBLIC_SITE_URL`
 * (see `.env.example`) and falls back to the existing portfolio host.
 */
const DEFAULT_SITE_URL = 'https://rokonuzzaaman.web.app';

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  url: resolveSiteUrl(),
  name: 'Md. Rokonuzzaman',
  title: 'Md. Rokonuzzaman — Full-Stack Software Engineer',
  description:
    'Portfolio of Md. Rokonuzzaman, a full-stack software engineer in Dhaka, Bangladesh, building scalable systems with Java, Spring Boot, TypeScript and React.',
  locale: 'en_US',
} as const;
