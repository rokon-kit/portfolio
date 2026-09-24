/**
 * Types for the "Strata" system sculpture (Milestone 4).
 * The conceptual system it depicts is a *reference architecture*, not the architecture of
 * any real employer's product.
 */

export const COMPONENT_IDS = [
  'frontend',
  'services',
  'auth',
  'database',
  'cache',
  'search',
  'messaging',
] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

export const ROUTE_IDS = ['request', 'authorized', 'query', 'cache', 'search', 'events', 'index'] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export type SystemMode = 'overview' | 'architecture';

/** Derived, human-readable visual state (also exposed as `data-scene-view` for testing). */
export type SystemView = 'overview' | 'selected' | 'architecture' | 'architecture-selected';

export interface SystemComponent {
  readonly id: ComponentId;
  /** Two-digit index, matches the site's numbered-label language. */
  readonly index: string;
  readonly label: string;
  /** Short category shown under the label, e.g. "Client interface". */
  readonly kind: string;
  /** Concise explanation of the component's role, in accurate engineering terms. */
  readonly role: string;
  /** Components this one exchanges data with directly. */
  readonly talksTo: readonly ComponentId[];
  /** Engineering concerns typically owned by this component. */
  readonly concerns: readonly string[];
  /** Project slugs where `docs/CONTENT.md` documents this layer. Empty = reference concept only. */
  readonly usedIn: readonly string[];
}

export interface SystemFlow {
  readonly id: RouteId;
  readonly label: string;
  readonly from: ComponentId;
  readonly to: ComponentId;
  /** One-sentence plain description of what travels along the route. */
  readonly description: string;
}
