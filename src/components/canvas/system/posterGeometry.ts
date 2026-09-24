/**
 * Isometric projection of the sculpture's primitives, for the SVG poster (shown before WebGL is
 * ready and whenever WebGL is unavailable). Pure — built from the same data as the 3D scene.
 */
import type { ComponentId, RouteId } from '@/types/system';
import { COMPONENT_IDS } from '../../../types/system.ts';
import { GROUND, modulePrimitives, type Primitive, type PrimitiveLayer, type Vec3 } from './modules.ts';
import { ORIGINS, ROUTES, labelAnchor, resolveRoute } from './layout.ts';

export interface PosterFace {
  readonly points: string;
  /** 0 = top, 1 = right, 2 = left — picks a shade. */
  readonly shade: 0 | 1 | 2;
}

export interface PosterItem {
  readonly key: string;
  readonly id: ComponentId | 'ground';
  readonly layer: PrimitiveLayer;
  readonly depth: number;
  readonly faces: readonly PosterFace[];
  readonly ellipse?: { readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number; readonly side: string };
}

export interface Poster {
  readonly viewBox: string;
  readonly items: readonly PosterItem[];
  readonly routes: ReadonlyArray<{ readonly id: RouteId; readonly color: string; readonly points: string }>;
  readonly labels: ReadonlyArray<{ readonly id: ComponentId; readonly x: number; readonly y: number }>;
}

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Camera azimuth 34° ↔ isometric viewer along u = w after rotating by 45° − 34°. */
const THETA = ((45 - 34) * Math.PI) / 180;

type Q = [number, number, number];

function toView(p: Q): Q {
  // (u, w, y): u and w both point towards the viewer.
  const u = p[0] * Math.cos(THETA) + p[2] * Math.sin(THETA);
  const w = -p[0] * Math.sin(THETA) + p[2] * Math.cos(THETA);
  return [u, w, p[1]];
}

function screen(view: Q): [number, number] {
  const [u, w, y] = view;
  return [(u - w) * COS30, (u + w) * SIN30 - y];
}

const FACES: ReadonlyArray<{ idx: readonly [number, number, number, number]; n: Q }> = [
  { idx: [4, 5, 6, 7], n: [0, 1, 0] }, // +y
  { idx: [1, 5, 6, 2], n: [1, 0, 0] }, // +x
  { idx: [2, 6, 7, 3], n: [0, 0, 1] }, // +z
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] }, // -x
  { idx: [0, 1, 5, 4], n: [0, 0, -1] }, // -z
];

function rotateXY(p: Q, rotX = 0, rotY = 0): Q {
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

function boxItem(id: ComponentId | 'ground', origin: Vec3, p: Extract<Primitive, { kind: 'box' }>, key: string, bounds: Bounds): PosterItem {
  const [w, h, d] = p.size;
  const corners: Q[] = [];
  for (const y of [-h / 2, h / 2]) {
    for (const [x, z] of [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ] as const) {
      const r = rotateXY([x, y, z], p.rotX, p.rotY);
      corners.push([r[0] + p.pos[0] + origin[0], r[1] + p.pos[1] + origin[1], r[2] + p.pos[2] + origin[2]]);
    }
  }
  const views = corners.map(toView);
  const faces: PosterFace[] = [];
  for (const face of FACES) {
    const n = rotateXY(face.n, p.rotX, p.rotY);
    const nv = toView(n);
    if (nv[0] + nv[1] + nv[2] <= 1e-6) continue;
    const pts = face.idx.map((i) => screen(views[i] as Q));
    pts.forEach(([x, y]) => bounds.add(x, y));
    const shade: 0 | 1 | 2 = Math.abs(nv[2]) > Math.abs(nv[0]) && Math.abs(nv[2]) > Math.abs(nv[1]) ? 0 : nv[0] >= nv[1] ? 1 : 2;
    faces.push({ points: pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '), shade });
  }
  const c = toView([p.pos[0] + origin[0], p.pos[1] + origin[1], p.pos[2] + origin[2]]);
  return { key, id, layer: p.layer, depth: c[0] + c[1] + c[2], faces };
}

function discItem(id: ComponentId, origin: Vec3, p: Extract<Primitive, { kind: 'disc' }>, key: string, bounds: Bounds): PosterItem {
  const c = toView([p.pos[0] + origin[0], p.pos[1] + origin[1] + p.height / 2, p.pos[2] + origin[2]]);
  const [cx, cy] = screen(c);
  const rx = p.radius * COS30 * Math.SQRT2; // = 1.2247 r
  const ry = p.radius * SIN30 * Math.SQRT2; // = 0.7071 r
  bounds.add(cx - rx, cy - ry);
  bounds.add(cx + rx, cy + ry + p.height);
  const side = `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(cx + rx).toFixed(2)} ${cy.toFixed(2)} V ${(cy + p.height).toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(cx - rx).toFixed(2)} ${(cy + p.height).toFixed(2)} Z`;
  return { key, id, layer: p.layer, depth: c[0] + c[1] + c[2] - 0.6, faces: [], ellipse: { cx, cy, rx, ry, side } };
}

class Bounds {
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;
  add(x: number, y: number) {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }
}

let cache: Poster | null = null;

export function buildPoster(): Poster {
  if (cache) return cache;
  const bounds = new Bounds();
  const items: PosterItem[] = [];

  const groundPrim = { kind: 'box', size: GROUND.size, pos: [0, 0, 0], layer: 'body' } as const;
  items.push(boxItem('ground', GROUND.pos, groundPrim, 'ground', bounds));

  for (const id of COMPONENT_IDS) {
    const origin = ORIGINS[id];
    modulePrimitives(id, 'high').forEach((p, i) => {
      items.push(p.kind === 'box' ? boxItem(id, origin, p, `${id}-${i}`, bounds) : discItem(id, origin, p, `${id}-${i}`, bounds));
    });
  }
  items.sort((a, b) => (a.id === 'ground' ? -1 : b.id === 'ground' ? 1 : a.depth - b.depth));

  const routes = ROUTES.map((spec) => {
    const pts = resolveRoute(spec, 0).map((p) => screen(toView([p[0], p[1], p[2]])));
    pts.forEach(([x, y]) => bounds.add(x, y));
    return { id: spec.id, color: spec.color, points: pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ') };
  });

  const labels = COMPONENT_IDS.map((id) => {
    const o = ORIGINS[id];
    const a = labelAnchor(id);
    const [x, y] = screen(toView([o[0] + a[0], o[1] + a[1], o[2] + a[2]]));
    return { id, x, y };
  });

  const pad = 1.2;
  const viewBox = `${(bounds.minX - pad).toFixed(2)} ${(bounds.minY - pad).toFixed(2)} ${(bounds.maxX - bounds.minX + pad * 2).toFixed(2)} ${(bounds.maxY - bounds.minY + pad * 2).toFixed(2)}`;
  cache = { viewBox, items, routes, labels };
  return cache;
}
