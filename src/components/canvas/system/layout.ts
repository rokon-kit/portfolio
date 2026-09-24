/**
 * Spatial layout of the "Strata" sculpture: where each module sits, where its ports are, how the
 * conduits between them are routed, how the exploded view separates them, and the camera poses.
 * Pure data + math (no three.js) so it is unit-tested and shared with the SVG poster.
 */
import type { ComponentId, RouteId } from '@/types/system';
import { COMPONENT_IDS } from '../../../types/system.ts';
import { DB_TOP, EVENTS_TOWER, MANIFOLD_TOP, MANIFOLD_Z, SLAB_TOP, TOWERS, moduleBounds, type Vec3 } from './modules.ts';
import { buildPolyline, type Axis } from './routes.ts';

/** Reference positions of each module (world, at rest). */
export const ORIGINS: Record<ComponentId, Vec3> = {
  frontend: [-0.4, 7.0, 0.3],
  services: [0.4, 2.85, -0.3],
  auth: [-4.5, 2.95, 1.1],
  database: [-0.6, 0, 0.4],
  cache: [4.9, 1.1, 1.6],
  search: [6.0, 1.0, -2.4],
  messaging: [5.6, 5.6, -3.2],
};

/** Offset applied at full explosion (architecture view). */
export const EXPLODE: Record<ComponentId, Vec3> = {
  frontend: [0, 2.6, 0.4],
  services: [0, 0.4, 0],
  auth: [-1.6, 0.9, 0.6],
  database: [0, -0.6, 0],
  cache: [1.4, 0.3, 0.6],
  search: [1.6, 0.9, -0.6],
  messaging: [1.2, 1.5, -0.9],
};

/** Visual centre of each module, local coordinates (camera focus + label anchor). */
export const CENTERS: Record<ComponentId, Vec3> = {
  frontend: [0, 0.5, 0],
  services: [0, 1.3, 0],
  auth: [0, 1.4, 0],
  database: [0, 0.85, 0],
  cache: [0, 0.35, 0],
  search: [0, 1.1, 0],
  messaging: [0, 0, 0],
};

export interface HitVolume {
  readonly size: Vec3;
  readonly pos: Vec3;
  /**
   * Glass volumes are only picked when nothing solid lies behind them, so a visitor can click a
   * tower they can see *through* the glass canopy without selecting the canopy instead.
   */
  readonly glass?: boolean;
}

/** Invisible picking volumes (local coordinates). Solid volumes always outrank glass. */
export const HIT_VOLUMES: Record<ComponentId, readonly HitVolume[]> = {
  frontend: [
    // Rim frame, UI panes and struts are solid; the glass plate between them is glass-tier.
    { size: [9.4, 0.5, 0.5], pos: [0, 0, 2.7] },
    { size: [9.4, 0.5, 0.5], pos: [0, 0, -2.7] },
    { size: [0.5, 0.5, 5.6], pos: [-4.5, 0, 0] },
    { size: [0.5, 0.5, 5.6], pos: [4.5, 0, 0] },
    { size: [2.2, 1.5, 0.7], pos: [-2.3, 0.95, -0.7] },
    { size: [2.2, 1.5, 0.7], pos: [0.1, 1.1, 0.4] },
    { size: [2.2, 1.5, 0.7], pos: [2.5, 0.95, -0.4] },
    { size: [0.3, 3.95, 0.3], pos: [-2.6, -1.955, -1.9] },
    { size: [0.3, 3.95, 0.3], pos: [3.6, -1.955, -1.9] },
    { size: [0.3, 3.95, 0.3], pos: [-2.6, -1.955, 1.7] },
    { size: [0.3, 3.95, 0.3], pos: [3.6, -1.955, 1.7] },
    { size: [9.2, 0.35, 5.6], pos: [0, 0, 0], glass: true },
  ],
  // Follows the geometry (slab, manifold, each tower) rather than one box, so the empty air above
  // the slab does not steal clicks meant for the neighbouring Authentication gate.
  services: [
    { size: [7.2, SLAB_TOP, 5.0], pos: [0, SLAB_TOP / 2, 0] },
    { size: [6.0, 0.5, 0.5], pos: [0, 0.25, MANIFOLD_Z] },
    ...TOWERS.map(([x, z, w, d, h]): HitVolume => ({ size: [w + 0.1, SLAB_TOP + h, d + 0.1], pos: [x, (SLAB_TOP + h) / 2, z] })),
  ],
  auth: [{ size: [2.6, 3.0, 2.6], pos: [0, 1.5, 0] }],
  database: [{ size: [4.9, 1.85, 4.9], pos: [0, 0.85, 0] }],
  cache: [{ size: [2.9, 1.3, 2.3], pos: [0, 0.3, 0] }],
  search: [{ size: [3.5, 2.8, 2.7], pos: [0, 1.4, 0] }],
  messaging: [{ size: [3.7, 0.55, 1.95], pos: [0, 0, 0] }],
};

const eventsTower = TOWERS[EVENTS_TOWER] as readonly [number, number, number, number, number, boolean];

/** Named connection points, local coordinates. */
export const PORTS: Record<ComponentId, Record<string, Vec3>> = {
  frontend: { request: [-4.5, -0.05, 0.8] },
  auth: { entry: [-0.7, 1.35, 0], exit: [0.7, 1.35, 0] },
  services: {
    in: [-2.9, MANIFOLD_TOP, MANIFOLD_Z],
    query: [-1.0, 0, 0.7],
    cache: [3.0, MANIFOLD_TOP, MANIFOLD_Z],
    search: [3.4, SLAB_TOP, -1.2],
    events: [eventsTower[0], SLAB_TOP + eventsTower[4], eventsTower[1]],
  },
  database: { top: [0, DB_TOP, 0] },
  cache: { in: [-0.6, 0.8, 0] },
  search: { top: [0, 2.6, 0], feed: [-0.9, 2.6, 0.05] },
  messaging: { events: [-1.7, 0, 0.85], index: [-0.5, -0.07, 0.85] },
};

export const COMPONENT_COLOR: Record<ComponentId, string> = {
  frontend: '#38BDF8',
  services: '#2563EB',
  auth: '#F1F5F9',
  database: '#F59E0B',
  cache: '#7DD3FC',
  search: '#CBD5E1',
  messaging: '#10B981',
};

/** Brighter tint used for outline edges of cobalt (which is too dark to read as a line). */
export const EDGE_COLOR: Record<ComponentId, string> = {
  ...COMPONENT_COLOR,
  services: '#60A5FA',
};

export interface RouteEndpoint {
  readonly m: ComponentId;
  readonly port: string;
}

export interface RouteSpec {
  readonly id: RouteId;
  readonly from: RouteEndpoint;
  readonly to: RouteEndpoint;
  /** Axes to travel, in order. */
  readonly order: readonly Axis[];
  readonly color: string;
  /** Forward pulses (request direction) and reverse pulses (responses). */
  readonly pulses: number;
  readonly returns: number;
  /** Pulse speed, units per second. */
  readonly speed: number;
}

export const ROUTES: readonly RouteSpec[] = [
  { id: 'request', from: { m: 'frontend', port: 'request' }, to: { m: 'auth', port: 'entry' }, order: ['x', 'y'], color: '#38BDF8', pulses: 3, returns: 1, speed: 2.4 },
  { id: 'authorized', from: { m: 'auth', port: 'exit' }, to: { m: 'services', port: 'in' }, order: ['x', 'y'], color: '#F1F5F9', pulses: 2, returns: 1, speed: 1.8 },
  { id: 'query', from: { m: 'services', port: 'query' }, to: { m: 'database', port: 'top' }, order: ['y'], color: '#F59E0B', pulses: 2, returns: 2, speed: 1.1 },
  { id: 'cache', from: { m: 'services', port: 'cache' }, to: { m: 'cache', port: 'in' }, order: ['x', 'z', 'y'], color: '#7DD3FC', pulses: 2, returns: 1, speed: 2.0 },
  { id: 'search', from: { m: 'services', port: 'search' }, to: { m: 'search', port: 'top' }, order: ['y', 'x', 'z'], color: '#CBD5E1', pulses: 2, returns: 1, speed: 2.0 },
  { id: 'events', from: { m: 'services', port: 'events' }, to: { m: 'messaging', port: 'events' }, order: ['y', 'z', 'x'], color: '#10B981', pulses: 2, returns: 0, speed: 1.4 },
  { id: 'index', from: { m: 'messaging', port: 'index' }, to: { m: 'search', port: 'feed' }, order: ['x', 'z', 'y'], color: '#10B981', pulses: 3, returns: 0, speed: 3.0 },
];

/** Which routes each component takes part in (drives highlighting when selected). */
export const COMPONENT_ROUTES: Record<ComponentId, readonly RouteId[]> = (() => {
  const map = Object.fromEntries(COMPONENT_IDS.map((id) => [id, [] as RouteId[]])) as Record<ComponentId, RouteId[]>;
  for (const route of ROUTES) {
    map[route.from.m].push(route.id);
    map[route.to.m].push(route.id);
  }
  return map;
})();

/** Origin of a module with the explosion factor `t` ∈ [0, 1] applied. */
export function worldOrigin(id: ComponentId, t = 0): Vec3 {
  const o = ORIGINS[id];
  const e = EXPLODE[id];
  return [o[0] + e[0] * t, o[1] + e[1] * t, o[2] + e[2] * t];
}

export function worldPoint(id: ComponentId, local: Vec3, t = 0): Vec3 {
  const o = worldOrigin(id, t);
  return [o[0] + local[0], o[1] + local[1], o[2] + local[2]];
}

export function worldPort(id: ComponentId, port: string, t = 0): Vec3 {
  const local = PORTS[id][port];
  if (!local) throw new Error(`Unknown port "${port}" on "${id}"`);
  return worldPoint(id, local, t);
}

export function resolveRoute(spec: RouteSpec, t = 0): Vec3[] {
  return buildPolyline(worldPort(spec.from.m, spec.from.port, t), worldPort(spec.to.m, spec.to.port, t), spec.order);
}

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

export interface CameraPose {
  readonly target: Vec3;
  readonly radius: number;
  /** Degrees around Y, measured from +Z towards +X. */
  readonly yaw: number;
  /** Degrees above the horizon. */
  readonly pitch: number;
}

export const FOV = 30;

export const OVERVIEW: Record<'wide' | 'narrow', { yaw: number; pitch: number; base: Vec3; margin: number }> = {
  wide: { yaw: 34, pitch: 21, base: [-0.3, 3.9, -0.3], margin: 0.94 },
  narrow: { yaw: 52, pitch: 22, base: [-0.3, 3.9, -0.3], margin: 0.94 },
};

export const ARCHITECTURE: Record<'wide' | 'narrow', { yaw: number; pitch: number; base: Vec3; margin: number }> = {
  wide: { yaw: 26, pitch: 30, base: [-0.3, 4.4, -0.4], margin: 0.94 },
  narrow: { yaw: 44, pitch: 30, base: [-0.3, 4.4, -0.4], margin: 0.94 },
};

/** Close-up framing per component: view direction and how much of the frame the module fills. */
export const FOCUS: Record<ComponentId, { yaw: number; pitch: number; margin: number }> = {
  frontend: { yaw: 30, pitch: 22, margin: 0.78 },
  services: { yaw: 34, pitch: 20, margin: 0.74 },
  auth: { yaw: -38, pitch: 16, margin: 0.62 },
  database: { yaw: 22, pitch: 24, margin: 0.7 },
  cache: { yaw: 44, pitch: 22, margin: 0.62 },
  search: { yaw: 38, pitch: 22, margin: 0.7 },
  messaging: { yaw: 40, pitch: 26, margin: 0.74 },
};

/** Where a module's DOM label attaches: just above the top of its geometry (local coordinates). */
export function labelAnchor(id: ComponentId): Vec3 {
  const { min, max } = moduleBounds(id, 'high');
  return [(min[0] + max[0]) / 2, max[1] + 0.35, (min[2] + max[2]) / 2];
}

const BOUNDS_CACHE = new Map<ComponentId, readonly Vec3[]>();

/** Corners of a module's real geometry, local coordinates (cached: the geometry is static). */
function localCorners(id: ComponentId): readonly Vec3[] {
  const cached = BOUNDS_CACHE.get(id);
  if (cached) return cached;
  const { min, max } = moduleBounds(id, 'high');
  const corners: Vec3[] = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) corners.push([x, y, z]);
  BOUNDS_CACHE.set(id, corners);
  return corners;
}

/** Corners of one module's geometry in world space, for the given explosion factor. */
export function modulePoints(id: ComponentId, t = 0): Vec3[] {
  const o = worldOrigin(id, t);
  return localCorners(id).map((c) => [o[0] + c[0], o[1] + c[1], o[2] + c[2]] as Vec3);
}

/** Corners of every module in world space — what the overview / architecture framing must contain. */
export function boundPoints(t = 0): Vec3[] {
  return COMPONENT_IDS.flatMap((id) => modulePoints(id, t));
}

/** Screen-space nudge (px) applied to each label so neighbouring labels do not collide. */
export const LABEL_NUDGE: Record<ComponentId, readonly [number, number]> = {
  frontend: [0, 0],
  auth: [-46, 10],
  services: [40, 0],
  database: [0, 4],
  cache: [30, 0],
  search: [44, 6],
  messaging: [40, -8],
};
