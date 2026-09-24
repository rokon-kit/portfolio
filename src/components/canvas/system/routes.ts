/** Orthogonal route geometry. Pure math on tuples — no three.js. */
import type { Vec3 } from './modules.ts';

export type Axis = 'x' | 'y' | 'z';

const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };
const EPS = 1e-6;

const samePoint = (a: Vec3, b: Vec3) =>
  Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS && Math.abs(a[2] - b[2]) < EPS;

const ALL_AXES: readonly Axis[] = ['x', 'y', 'z'];

/**
 * Manhattan route from `start` to `end`: move along each listed axis in turn until it matches
 * `end`. Axes that are not listed are appended afterwards, so the route *always* finishes exactly
 * on `end` — even when the exploded view offsets the two modules along an axis the route did not
 * expect to travel. Consecutive duplicate points (zero-length legs) are dropped.
 */
export function buildPolyline(start: Vec3, end: Vec3, order: readonly Axis[]): Vec3[] {
  const points: Vec3[] = [start];
  let current: [number, number, number] = [start[0], start[1], start[2]];
  const complete = [...order, ...ALL_AXES.filter((axis) => !order.includes(axis))];
  for (const axis of complete) {
    const i = AXIS_INDEX[axis];
    const next: [number, number, number] = [current[0], current[1], current[2]];
    next[i] = end[i];
    const last = points[points.length - 1];
    if (last && !samePoint(last, next)) points.push(next);
    current = next;
  }
  return points;
}

export interface PolylineLengths {
  /** Cumulative distance at each point (cum[0] = 0). */
  readonly cum: readonly number[];
  readonly total: number;
}

export function polylineLengths(points: readonly Vec3[]): PolylineLengths {
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1] as Vec3;
    const b = points[i] as Vec3;
    cum.push((cum[i - 1] ?? 0) + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return { cum, total: cum[cum.length - 1] ?? 0 };
}

/** Writes the point at `distance` along the polyline into `out` (clamped to the ends). */
export function pointAt(
  points: readonly Vec3[],
  lengths: PolylineLengths,
  distance: number,
  out: [number, number, number],
): [number, number, number] {
  const d = Math.min(Math.max(distance, 0), lengths.total);
  for (let i = 1; i < points.length; i += 1) {
    const end = lengths.cum[i] ?? 0;
    if (d <= end + EPS) {
      const a = points[i - 1] as Vec3;
      const b = points[i] as Vec3;
      const start = lengths.cum[i - 1] ?? 0;
      const span = end - start;
      const u = span < EPS ? 0 : (d - start) / span;
      out[0] = a[0] + (b[0] - a[0]) * u;
      out[1] = a[1] + (b[1] - a[1]) * u;
      out[2] = a[2] + (b[2] - a[2]) * u;
      return out;
    }
  }
  const last = points[points.length - 1] as Vec3;
  out[0] = last[0];
  out[1] = last[1];
  out[2] = last[2];
  return out;
}

/** True when every segment changes exactly one coordinate. */
export function isAxisAligned(points: readonly Vec3[]): boolean {
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1] as Vec3;
    const b = points[i] as Vec3;
    const changed = [0, 1, 2].filter((k) => Math.abs((a[k as 0] ?? 0) - (b[k as 0] ?? 0)) > EPS).length;
    if (changed !== 1) return false;
  }
  return true;
}
