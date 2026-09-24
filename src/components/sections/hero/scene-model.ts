/**
 * Static isometric model of the three-layer system shown in the hero.
 *
 * Geometry is ported from the approved Milestone 2 prototype (`initIsometricCanvas`
 * in prototype/app.js) and pre-computed here into SVG polygon strings, so the hero
 * renders on the server with no JavaScript and no canvas. Milestone 4 replaces this
 * with the React Three Fiber scene; this model then becomes the WebGL-unavailable
 * fallback. See docs/CLAUDE_HANDOFF.md §5.3.
 */

export type SceneLayer = 'frontend' | 'backend' | 'database';

/** SVG viewBox and origin, matching the prototype canvas composition at desktop size. */
export const SCENE_VIEWBOX = { width: 520, height: 380 } as const;
const ORIGIN = { x: SCENE_VIEWBOX.width / 2, y: SCENE_VIEWBOX.height / 2 + 30 } as const;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface BoxSpec {
  readonly id: string;
  readonly layer: SceneLayer;
  /** Horizontal screen-space offset from the origin. */
  readonly offsetX: number;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  /** Elevation of the box base (z is up). */
  readonly z: number;
  readonly stroke: string;
  readonly strokeOpacity: number;
  readonly fill: string;
  readonly fillOpacity: number;
  readonly cornerNodes: boolean;
  /** Gently bobbing element (CSS animation, disabled under reduced motion). */
  readonly floats?: boolean;
}

const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = Math.sin(Math.PI / 6);

/**
 * Standard isometric projection of a point in world space (x, y ground plane, z up),
 * after rotating the ground plane by `rotation` radians about the vertical axis.
 */
function project(x: number, y: number, z: number, rotation: number): Point {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  return { x: (rx - ry) * COS_30, y: (rx + ry) * SIN_30 - z };
}

const CYAN = 'var(--color-accent-cyan)';
const BLUE = 'var(--color-accent-blue)';
const AMBER = 'var(--color-accent-amber)';
const WHITE = 'var(--color-text-primary)';

const BOXES: readonly BoxSpec[] = [
  // L1 — data / persistence
  { id: 'data-slab', layer: 'database', offsetX: 0, width: 180, depth: 180, height: 16, z: -60, stroke: AMBER, strokeOpacity: 0.5, fill: AMBER, fillOpacity: 0.08, cornerNodes: true },
  { id: 'data-store-a', layer: 'database', offsetX: -45, width: 50, depth: 50, height: 24, z: -38, stroke: AMBER, strokeOpacity: 1, fill: AMBER, fillOpacity: 0.15, cornerNodes: false },
  { id: 'data-store-b', layer: 'database', offsetX: 45, width: 50, depth: 50, height: 24, z: -38, stroke: AMBER, strokeOpacity: 1, fill: AMBER, fillOpacity: 0.15, cornerNodes: false },
  // L2 — services / APIs
  { id: 'service-core', layer: 'backend', offsetX: 0, width: 120, depth: 120, height: 45, z: 0, stroke: CYAN, strokeOpacity: 1, fill: BLUE, fillOpacity: 0.12, cornerNodes: true },
  { id: 'service-tower-a', layer: 'backend', offsetX: -35, width: 30, depth: 30, height: 60, z: 45, stroke: BLUE, strokeOpacity: 1, fill: BLUE, fillOpacity: 0.2, cornerNodes: true },
  { id: 'service-tower-b', layer: 'backend', offsetX: 35, width: 30, depth: 30, height: 60, z: 45, stroke: BLUE, strokeOpacity: 1, fill: BLUE, fillOpacity: 0.2, cornerNodes: true },
  // L3 — client interface
  { id: 'interface-canopy', layer: 'frontend', offsetX: 0, width: 150, depth: 150, height: 18, z: 120, stroke: CYAN, strokeOpacity: 1, fill: CYAN, fillOpacity: 0.16, cornerNodes: true },
  { id: 'interface-pane', layer: 'frontend', offsetX: 0, width: 90, depth: 90, height: 8, z: 150, stroke: WHITE, strokeOpacity: 1, fill: WHITE, fillOpacity: 0.15, cornerNodes: true, floats: true },
];

export interface SceneBox {
  readonly id: string;
  readonly layer: SceneLayer;
  readonly stroke: string;
  readonly strokeOpacity: number;
  readonly fill: string;
  readonly fillOpacity: number;
  readonly floats: boolean;
  /** SVG `points` strings for each visible face. */
  readonly faces: {
    readonly bottom: string;
    readonly left: string;
    readonly right: string;
    readonly top: string;
  };
  /** Glow-node positions at the top corners. */
  readonly nodes: readonly Point[];
}

const round = (value: number): number => Math.round(value * 100) / 100;

function toPoints(points: readonly Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
}

function buildBox(spec: BoxSpec, rotation: number): SceneBox {
  const hw = spec.width / 2;
  const hd = spec.depth / 2;
  const cx = ORIGIN.x + spec.offsetX;
  const place = (p: Point): Point => ({ x: cx + p.x, y: ORIGIN.y + p.y });

  const bottom = [
    project(-hw, -hd, spec.z, rotation),
    project(hw, -hd, spec.z, rotation),
    project(hw, hd, spec.z, rotation),
    project(-hw, hd, spec.z, rotation),
  ].map(place);
  const top = [
    project(-hw, -hd, spec.z + spec.height, rotation),
    project(hw, -hd, spec.z + spec.height, rotation),
    project(hw, hd, spec.z + spec.height, rotation),
    project(-hw, hd, spec.z + spec.height, rotation),
  ].map(place);

  const [b1, b2, b3, b4] = bottom;
  const [t1, t2, t3, t4] = top;
  if (!b1 || !b2 || !b3 || !b4 || !t1 || !t2 || !t3 || !t4) {
    throw new Error(`Scene box "${spec.id}" produced an incomplete face set`);
  }

  return {
    id: spec.id,
    layer: spec.layer,
    stroke: spec.stroke,
    strokeOpacity: spec.strokeOpacity,
    fill: spec.fill,
    fillOpacity: spec.fillOpacity,
    floats: spec.floats ?? false,
    faces: {
      bottom: toPoints([b1, b2, b3, b4]),
      left: toPoints([b4, b3, t3, t4]),
      right: toPoints([b3, b2, t2, t3]),
      top: toPoints([t1, t2, t3, t4]),
    },
    nodes: spec.cornerNodes ? top.map((p) => ({ x: round(p.x), y: round(p.y) })) : [],
  };
}

/** Builds every box at the given rotation (radians). Pure and cheap: ~64 projected points. */
export function buildScene(rotation: number): readonly SceneBox[] {
  return BOXES.map((spec) => buildBox(spec, rotation));
}

/** Server-rendered default view (no rotation). */
export const SCENE_BOXES: readonly SceneBox[] = buildScene(0);

export const SCENE_FLOOR = {
  ring: { cx: ORIGIN.x, cy: ORIGIN.y + 80, r: 140 },
  lines: [
    { x1: ORIGIN.x - 160, y1: ORIGIN.y + 80, x2: ORIGIN.x + 160, y2: ORIGIN.y + 80 },
    { x1: ORIGIN.x, y1: ORIGIN.y - 80, x2: ORIGIN.x, y2: ORIGIN.y + 240 },
  ],
} as const;

export interface LayerFilter {
  readonly id: 'all' | SceneLayer;
  readonly label: string;
}

export const LAYER_FILTERS: readonly LayerFilter[] = [
  { id: 'all', label: 'FULL STACK' },
  { id: 'frontend', label: 'FRONTEND' },
  { id: 'backend', label: 'BACKEND' },
  { id: 'database', label: 'DATABASE' },
];

export interface SceneCallout {
  readonly layer: SceneLayer;
  readonly label: string;
  readonly position: { readonly top?: string; readonly right?: string; readonly bottom?: string; readonly left?: string };
}

export const SCENE_CALLOUTS: readonly SceneCallout[] = [
  { layer: 'frontend', label: 'L3: CLIENT INTERFACE (REACT/TS)', position: { top: '22%', left: '10%' } },
  { layer: 'backend', label: 'L2: SPRING BOOT / REST APIS', position: { top: '50%', right: '8%' } },
  { layer: 'database', label: 'L1: POSTGRESQL / PERSISTENCE', position: { bottom: '18%', left: '15%' } },
];

export const SCENE_DESCRIPTION =
  'Isometric model of a three-layer full-stack system. From the bottom: a data layer with PostgreSQL storage blocks, a services layer of Spring Boot API towers, and a client-interface layer of glass panes for React and TypeScript.';
