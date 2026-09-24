import type { SystemComponent, SystemFlow } from '@/types/system';

/**
 * Copy for the Strata system sculpture.
 *
 * This is a *conceptual reference system*. It does not describe the confidential
 * architecture of any employer's product, and it makes no claim about production scale.
 * `usedIn` lists project slugs only where docs/CONTENT.md documents the layer; Caching,
 * Search and Messaging are not documented project experience and stay empty on purpose.
 */
export const systemDisclaimer =
  'A conceptual reference system for illustration. It is not the architecture of any employer’s production system, and it makes no claim about scale or performance.';

export const systemComponents: readonly SystemComponent[] = [
  {
    id: 'frontend',
    index: '01',
    label: 'Frontend',
    kind: 'Client interface',
    role: 'The browser-facing layer. It renders application state as UI, validates input, and calls backend APIs. Its work is measured by what the user perceives: rendering strategy, accessibility, and latency.',
    talksTo: ['auth'],
    concerns: ['Rendering strategy (SSR / CSR)', 'State management', 'Accessibility', 'Perceived latency'],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
  {
    id: 'auth',
    index: '02',
    label: 'Authentication',
    kind: 'Identity & access',
    role: 'Establishes who is calling and what they may do. It verifies credentials, issues and validates tokens such as JWTs, and enforces role-based access control before a request reaches the services.',
    talksTo: ['frontend', 'services'],
    concerns: ['Token issuance & validation', 'Role-based access control', 'Session lifetime', 'Password hashing'],
    usedIn: ['volunteering-platform'],
  },
  {
    id: 'services',
    index: '03',
    label: 'Application services',
    kind: 'Business logic',
    role: 'The application core behind an API. It orchestrates use cases, enforces domain rules and transactions, and coordinates the cache, database, search index and message bus.',
    talksTo: ['auth', 'database', 'cache', 'search', 'messaging'],
    concerns: ['Stateless design', 'Idempotent operations', 'Transaction boundaries', 'Clear service boundaries'],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
  {
    id: 'database',
    index: '04',
    label: 'Database',
    kind: 'System of record',
    role: 'Durable, transactional storage and the single source of truth. A relational schema enforces integrity through keys and constraints, while indexes keep queries fast.',
    talksTo: ['services'],
    concerns: ['Normalisation', 'Indexing & query plans', 'ACID transactions', 'Backup & recovery'],
    usedIn: ['volunteering-platform', 'courseflow'],
  },
  {
    id: 'cache',
    index: '05',
    label: 'Caching',
    kind: 'In-memory tier',
    role: 'A fast, disposable copy of frequently read data held in memory, so most reads never reach the database. Correctness depends on when entries expire or are invalidated.',
    talksTo: ['services'],
    concerns: ['Cache-aside vs write-through', 'TTL & invalidation', 'Stampede protection', 'Hit ratio'],
    usedIn: [],
  },
  {
    id: 'search',
    index: '06',
    label: 'Search',
    kind: 'Query index',
    role: 'A purpose-built index for full-text and faceted queries, kept in sync from the system of record. It trades immediate consistency for fast, relevance-ranked retrieval.',
    talksTo: ['services', 'messaging'],
    concerns: ['Analysers & tokenisation', 'Relevance ranking', 'Eventual consistency', 'Re-indexing'],
    usedIn: [],
  },
  {
    id: 'messaging',
    index: '07',
    label: 'Messaging',
    kind: 'Event bus / queue',
    role: 'A queue or event bus that decouples producers from consumers. It enables asynchronous work, retries and fan-out, and keeps downstream systems such as the search index up to date.',
    talksTo: ['services', 'search'],
    concerns: ['Delivery guarantees', 'Ordering', 'Idempotent consumers', 'Dead-letter handling'],
    usedIn: [],
  },
];

export const systemFlows: readonly SystemFlow[] = [
  { id: 'request', label: 'Request', from: 'frontend', to: 'auth', description: 'The browser calls the API; every request meets the authentication gate first.' },
  { id: 'authorized', label: 'Authorised request', from: 'auth', to: 'services', description: 'Once identity and role are verified, the request is passed to the application services.' },
  { id: 'query', label: 'Query', from: 'services', to: 'database', description: 'Services read and write the system of record inside transactions.' },
  { id: 'cache', label: 'Cache read', from: 'services', to: 'cache', description: 'Hot reads are served from memory; a miss falls through to the database.' },
  { id: 'search', label: 'Search query', from: 'services', to: 'search', description: 'Full-text and faceted queries go to the search index instead of the database.' },
  { id: 'events', label: 'Events', from: 'services', to: 'messaging', description: 'State changes are published as events for asynchronous consumers.' },
  { id: 'index', label: 'Index feed', from: 'messaging', to: 'search', description: 'Consumers update the search index from the event stream, eventually consistent.' },
];

export function getSystemComponent(id: string): SystemComponent | undefined {
  return systemComponents.find((component) => component.id === id);
}
