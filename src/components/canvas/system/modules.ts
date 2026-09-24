/**
 * Geometry of the "Strata" sculpture as plain data.
 *
 * Every component is a list of primitives in *module-local* coordinates (y up, units ≈ metres).
 * The same data feeds the WebGL builder, the static SVG poster and the unit tests, so the
 * three can never drift apart. This file must stay free of three.js.
 */
import type { ComponentId } from '@/types/system';

export type Vec3 = readonly [number, number, number];
export type PrimitiveLayer = 'body' | 'glass' | 'accent';
export type Detail = 'high' | 'low';

export interface BoxPrimitive {
  readonly kind: 'box';
  /** Full extents (w, h, d). */
  readonly size: Vec3;
  /** Centre. */
  readonly pos: Vec3;
  readonly layer: PrimitiveLayer;
  /** Rotation about X (radians) — used for tilted screens. */
  readonly rotX?: number;
  /** Rotation about Y (radians). */
  readonly rotY?: number;
  /** Draw crisp outline edges. Defaults to true for body/glass, false for accent. */
  readonly edges?: boolean;
}

export interface DiscPrimitive {
  readonly kind: 'disc';
  readonly radius: number;
  readonly height: number;
  readonly pos: Vec3;
  readonly layer: PrimitiveLayer;
  readonly edges?: boolean;
}

export type Primitive = BoxPrimitive | DiscPrimitive;

const box = (
  size: Vec3,
  pos: Vec3,
  layer: PrimitiveLayer = 'body',
  extra: Partial<Pick<BoxPrimitive, 'rotX' | 'rotY' | 'edges'>> = {},
): BoxPrimitive => ({ kind: 'box', size, pos, layer, ...extra });

const disc = (radius: number, height: number, pos: Vec3, layer: PrimitiveLayer = 'body', edges?: boolean): DiscPrimitive =>
  edges === undefined ? { kind: 'disc', radius, height, pos, layer } : { kind: 'disc', radius, height, pos, layer, edges };

/* ------------------------------------------------------------------ */
/* Shared dimensions (also used by layout.ts for port positions)        */
/* ------------------------------------------------------------------ */

export const DB_DISC_RADIUS = 2.3;
export const DB_DISC_HEIGHT = 0.36;
export const DB_DISC_PITCH = 0.45;
export const DB_DISC_COUNT = 4;
/** Top surface of the database stack, local y. */
export const DB_TOP = (DB_DISC_COUNT - 1) * DB_DISC_PITCH + DB_DISC_HEIGHT;

export const SLAB_TOP = 0.24;
export const SLAB_SIZE: Vec3 = [7.2, 0.24, 5.0];
export const MANIFOLD_Z = 1.4;
export const MANIFOLD_TOP = 0.5;

/** [x, z, w, d, h, keptInLowDetail] */
export const TOWERS: ReadonlyArray<readonly [number, number, number, number, number, boolean]> = [
  [-2.7, -1.3, 0.8, 0.9, 1.3, false],
  [-1.6, -0.2, 0.9, 0.9, 2.1, true],
  [-0.5, -1.5, 0.8, 0.8, 1.0, false],
  [0.7, -0.4, 0.9, 0.9, 2.4, true],
  [1.9, -1.2, 0.8, 0.8, 1.6, true],
  [2.9, 0.0, 0.8, 0.9, 1.9, true],
];
/** Tower whose roof carries the "events" port. */
export const EVENTS_TOWER = 4;

/* ------------------------------------------------------------------ */
/* Modules                                                              */
/* ------------------------------------------------------------------ */

function database(): Primitive[] {
  const out: Primitive[] = [disc(DB_DISC_RADIUS + 0.25, 0.14, [0, -0.05, 0], 'body')];
  for (let i = 0; i < DB_DISC_COUNT; i += 1) {
    const y = i * DB_DISC_PITCH + DB_DISC_HEIGHT / 2;
    out.push(disc(DB_DISC_RADIUS, DB_DISC_HEIGHT, [0, y, 0], 'body'));
    // A tab that steps around the stack: reads as ledger records and gives the drum a spiral.
    const a = i * 0.62 + 0.4;
    out.push(
      box([0.55, DB_DISC_HEIGHT, 0.3], [Math.cos(a) * DB_DISC_RADIUS, y, Math.sin(a) * DB_DISC_RADIUS], 'accent', { rotY: -a }),
    );
  }
  return out;
}

function services(detail: Detail): Primitive[] {
  const out: Primitive[] = [box(SLAB_SIZE, [0, SLAB_SIZE[1] / 2, 0], 'body')];
  // API manifold along the front edge.
  out.push(box([6.0, 0.26, 0.36], [0, SLAB_TOP + 0.13, MANIFOLD_Z], 'body'));
  out.push(box([6.0, 0.03, 0.14], [0, MANIFOLD_TOP - 0.015, MANIFOLD_Z], 'accent'));
  TOWERS.forEach(([x, z, w, d, h, keep]) => {
    if (detail === 'low' && !keep) return;
    out.push(box([w, h, d], [x, SLAB_TOP + h / 2, z], 'body'));
    out.push(box([w * 0.9, 0.06, d * 0.9], [x, SLAB_TOP + h + 0.03, z], 'accent'));
  });
  // Pilotis lifting the slab off the ground plane.
  for (const sx of [-3.2, 3.2]) {
    for (const sz of [-2.1, 2.1]) {
      out.push(box([0.24, 3.0, 0.24], [sx, -1.5, sz], 'body'));
    }
  }
  return out;
}

function auth(): Primitive[] {
  return [
    box([2.6, 0.16, 2.6], [0, 0.08, 0], 'body'),
    box([0.3, 2.4, 0.3], [0, 0.16 + 1.2, 0.9], 'body'),
    box([0.3, 2.4, 0.3], [0, 0.16 + 1.2, -0.9], 'body'),
    box([0.3, 0.24, 2.1], [0, 0.16 + 2.4 + 0.12, 0], 'body'),
    box([0.34, 0.14, 0.5], [0, 0.16 + 2.4 + 0.31, 0], 'accent'),
    // The verification field the request passes through.
    box([0.04, 2.0, 1.5], [0, 1.35, 0], 'glass', { edges: false }),
  ];
}

function frontend(detail: Detail): Primitive[] {
  const out: Primitive[] = [
    box([9.0, 0.08, 5.4], [0, 0, 0], 'glass', { edges: false }),
    box([9.0, 0.12, 0.14], [0, 0, 2.7], 'body'),
    box([9.0, 0.12, 0.14], [0, 0, -2.7], 'body'),
    box([0.14, 0.12, 5.4], [-4.5, 0, 0], 'body'),
    box([0.14, 0.12, 5.4], [4.5, 0, 0], 'body'),
  ];
  const across = detail === 'high' ? [-1.8, -0.9, 0, 0.9, 1.8] : [-1.35, 1.35];
  const along = detail === 'high' ? [-3, -1.5, 0, 1.5, 3] : [-2.25, 2.25];
  for (const z of across) out.push(box([9.0, 0.05, 0.05], [0, 0, z], 'body', { edges: false }));
  for (const x of along) out.push(box([0.05, 0.05, 5.4], [x, 0, 0], 'body', { edges: false }));
  // Struts down to the services slab.
  for (const sx of [-2.6, 3.6]) {
    for (const sz of [-1.9, 1.7]) out.push(box([0.12, 3.91, 0.12], [sx, -1.955, sz], 'body'));
  }
  // Floating UI panes.
  const panes: ReadonlyArray<readonly [number, number, number]> = [
    [-2.3, 0.95, -0.7],
    [0.1, 1.1, 0.4],
    [2.5, 0.95, -0.4],
  ];
  panes.forEach(([x, y, z]) => {
    out.push(box([1.9, 1.2, 0.05], [x, y, z], 'glass', { rotX: -0.2 }));
    out.push(box([1.2, 0.07, 0.02], [x, y + 0.28, z + 0.02], 'accent', { rotX: -0.2 }));
    out.push(box([0.8, 0.07, 0.02], [x - 0.2, y, z + 0.02], 'accent', { rotX: -0.2 }));
    out.push(box([0.06, 0.6, 0.06], [x, y - 0.75, z], 'body'));
  });
  return out;
}

function cache(detail: Detail): Primitive[] {
  const out: Primitive[] = [box([2.8, 0.12, 2.2], [0, 0, 0], 'body'), box([0.22, 1.19, 0.22], [0, -0.655, 0], 'body')];
  const xs = detail === 'high' ? [-0.85, 0, 0.85] : [-0.45, 0.45];
  for (const x of xs) {
    for (const z of [-0.5, 0.5]) out.push(box([0.62, 0.62, 0.62], [x, 0.37, z], 'accent', { edges: true }));
  }
  return out;
}

function search(detail: Detail): Primitive[] {
  const n = detail === 'high' ? 9 : 6;
  const out: Primitive[] = [box([3.4, 0.14, 2.6], [0, 0.07, 0], 'body')];
  for (let i = 0; i < n; i += 1) {
    const x = (i - (n - 1) / 2) * (2.6 / (n - 1));
    const h = 0.6 + 1.75 * Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 1.3);
    out.push(box([0.07, h, 2.0], [x, 0.14 + h / 2, 0], 'body'));
    out.push(box([0.07, 0.05, 2.0], [x, 0.14 + h + 0.025, 0], 'accent'));
  }
  return out;
}

function messaging(): Primitive[] {
  const out: Primitive[] = [
    box([3.4, 0.14, 0.14], [0, 0, 0.85], 'body'),
    box([3.4, 0.14, 0.14], [0, 0, -0.85], 'body'),
    box([0.14, 0.14, 1.7], [-1.7, 0, 0], 'body'),
    box([0.14, 0.14, 1.7], [1.7, 0, 0], 'body'),
    box([3.4, 0.03, 0.06], [0, 0.09, 0.85], 'accent'),
    box([3.4, 0.03, 0.06], [0, 0.09, -0.85], 'accent'),
    box([0.6, 0.22, 0.34], [-0.6, 0, 0.85], 'body'),
    box([0.6, 0.22, 0.34], [0.7, 0, -0.85], 'body'),
  ];
  for (const x of [-1.7, 1.7]) {
    for (const z of [-0.85, 0.85]) out.push(box([0.36, 0.36, 0.36], [x, 0, z], 'accent', { edges: true }));
  }
  // Slender pylons carrying the bus down to the ground plane (rear side, clear of the slab).
  out.push(box([0.12, 5.15, 0.12], [-1.7, -2.575, -0.85], 'body'));
  out.push(box([0.12, 5.15, 0.12], [1.7, -2.575, -0.85], 'body'));
  return out;
}

export function modulePrimitives(id: ComponentId, detail: Detail = 'high'): Primitive[] {
  switch (id) {
    case 'database':
      return database();
    case 'services':
      return services(detail);
    case 'auth':
      return auth();
    case 'frontend':
      return frontend(detail);
    case 'cache':
      return cache(detail);
    case 'search':
      return search(detail);
    case 'messaging':
      return messaging();
  }
}

export interface Bounds3 {
  readonly min: Vec3;
  readonly max: Vec3;
}

function rotate(p: Vec3, rotX = 0, rotY = 0): Vec3 {
  let [x, y, z] = p;
  if (rotX) {
    const c = Math.cos(rotX);
    const s = Math.sin(rotX);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (rotY) {
    const c = Math.cos(rotY);
    const s = Math.sin(rotY);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  return [x, y, z];
}

/** Axis-aligned bounds of a module's actual geometry (local coordinates). */
export function moduleBounds(id: ComponentId, detail: Detail = 'high'): Bounds3 {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  const add = (x: number, y: number, z: number) => {
    min[0] = Math.min(min[0], x);
    min[1] = Math.min(min[1], y);
    min[2] = Math.min(min[2], z);
    max[0] = Math.max(max[0], x);
    max[1] = Math.max(max[1], y);
    max[2] = Math.max(max[2], z);
  };
  for (const p of modulePrimitives(id, detail)) {
    if (p.kind === 'disc') {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) add(p.pos[0] + sx * p.radius, p.pos[1] + (sy * p.height) / 2, p.pos[2] + sz * p.radius);
    } else {
      for (const sx of [-0.5, 0.5]) {
        for (const sy of [-0.5, 0.5]) {
          for (const sz of [-0.5, 0.5]) {
            const r = rotate([sx * p.size[0], sy * p.size[1], sz * p.size[2]], p.rotX, p.rotY);
            add(p.pos[0] + r[0], p.pos[1] + r[1], p.pos[2] + r[2]);
          }
        }
      }
    }
  }
  return { min, max };
}

/** Ground plate under the whole sculpture, world coordinates. */
export const GROUND = { size: [13.5, 0.16, 11.5] as Vec3, pos: [-0.2, -0.23, -0.6] as Vec3 };

/** Triangles for a set of primitives (indexed box = 12; capped cylinder = 4 × segments). */
export function estimateTriangles(primitives: readonly Primitive[], discSegments: number): number {
  return primitives.reduce((sum, p) => sum + (p.kind === 'box' ? 12 : discSegments * 4), 0);
}
