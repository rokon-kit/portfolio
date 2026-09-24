import type { NextConfig } from 'next';

/**
 * Every route is prerendered at build time and no route handlers or middleware
 * are used, so the site stays compatible with a static export (`output: 'export'`)
 * if the hosting decision (see docs/DESIGN_DECISIONS.md, ADR-007) calls for it.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16.3's dev server otherwise appends a generated block to AGENTS.md. That file is this
  // project's governance document and must only change through an explicit, reviewed edit.
  agentRules: false,
};

export default nextConfig;
