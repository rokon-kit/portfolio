/**
 * The scene laboratory (`/lab/system`) is a development tool, not part of the site.
 * It is available in `next dev`, and in a production build only when the server-side flag
 * `ENABLE_SCENE_LAB=true` was set at build time (used for QA against an optimised build).
 * Otherwise the route returns a 404 and is excluded from robots and the sitemap.
 */
export const LAB_ENABLED = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SCENE_LAB === 'true';
