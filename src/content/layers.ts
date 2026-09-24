import type { Layer, LayerId, LayerView } from '@/types/content';

/**
 * Full-stack layers shown in the architecture inspector.
 *
 * Source: docs/CONTENT.md §5 (Verified Technical Capabilities). Where a layer is
 * marked as used in a project, the stack is listed for that project in
 * docs/CONTENT.md §3. Versions, latencies and configuration values are
 * deliberately not stated — none are documented.
 */
export const layers: readonly Layer[] = [
  {
    id: 'client',
    view: 'dataflow',
    title: '01. BROWSER CLIENT (REACT / NEXT.JS)',
    shortName: 'BROWSER CLIENT',
    blurb: 'React, Next.js and TypeScript on the front end, styled with Tailwind CSS and enhanced with GSAP and Three.js.',
    readouts: [
      { name: 'LANGUAGES', value: 'TypeScript · JavaScript (ESNext)', tone: 'cyan' },
      { name: 'FRAMEWORKS', value: 'React · Next.js (App Router) · Vite' },
      { name: 'STYLING', value: 'Tailwind CSS · CSS Modules · CSS Grid & Flexbox' },
      { name: 'INTERACTION', value: 'GSAP · ScrollTrigger · Three.js · React Three Fiber', tone: 'green' },
    ],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
  {
    id: 'api',
    view: 'dataflow',
    title: '02. API LAYER & CONTROLLERS',
    shortName: 'API LAYER',
    blurb: 'Spring Boot and Node.js services following REST, MVC and layered-architecture conventions.',
    readouts: [
      { name: 'FRAMEWORKS', value: 'Spring Boot · Node.js · Express.js', tone: 'cyan' },
      { name: 'LANGUAGES', value: 'Java (JDK 8/11/17+) · TypeScript' },
      { name: 'PATTERNS', value: 'RESTful API design · MVC · Layered architecture' },
      { name: 'ARCHITECTURE', value: 'Microservices fundamentals', tone: 'green' },
    ],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
  {
    id: 'security',
    view: 'security',
    title: '03. SPRING SECURITY & JWT',
    shortName: 'AUTH & SECURITY',
    blurb: 'Spring Security, JWT and bcrypt hashing with role-based access control.',
    readouts: [
      { name: 'TOKENS', value: 'JWT (JSON Web Tokens)', tone: 'cyan' },
      { name: 'FRAMEWORK', value: 'Spring Security' },
      { name: 'ACCESS MODEL', value: 'Role-based access control (RBAC)' },
      { name: 'ALSO', value: 'bcrypt hashing · OAuth2 concepts', tone: 'green' },
    ],
    usedIn: ['volunteering-platform'],
  },
  {
    id: 'storage',
    view: 'persistence',
    title: '04. DATABASE & PERSISTENCE',
    shortName: 'PERSISTENCE',
    blurb: 'PostgreSQL, MySQL and MongoDB; normalized schemas, indexing and transactional consistency.',
    readouts: [
      { name: 'DATABASES', value: 'PostgreSQL · MySQL · MongoDB', tone: 'cyan' },
      { name: 'SCHEMA DESIGN', value: 'Normalization · relational modeling' },
      { name: 'QUERYING', value: 'Complex joins · indexing' },
      { name: 'INTEGRITY', value: 'Transactional sign-ups (PostgreSQL)', tone: 'green' },
    ],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
];

export const layerViews: readonly LayerView[] = [
  { id: 'dataflow', label: '01 // DATAFLOW PIPELINE', defaultLayer: 'client' },
  { id: 'security', label: '02 // AUTH & SECURITY MATRIX', defaultLayer: 'security' },
  { id: 'persistence', label: '03 // PERSISTENCE', defaultLayer: 'storage' },
];

export function getLayer(id: LayerId): Layer | undefined {
  return layers.find((layer) => layer.id === id);
}
