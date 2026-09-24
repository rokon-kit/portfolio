/** Camera math. Pure. Angles in degrees unless noted. */
import type { Vec3 } from './modules.ts';

const DEG = Math.PI / 180;

/** Camera position on a sphere around `target`. */
export function poseToPosition(target: Vec3, radius: number, yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  const horizontal = Math.cos(pitch) * radius;
  return [
    target[0] + Math.sin(yaw) * horizontal,
    target[1] + Math.sin(pitch) * radius,
    target[2] + Math.cos(yaw) * horizontal,
  ];
}

/** Frame-rate independent exponential smoothing towards `target`. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export interface Framing {
  readonly target: Vec3;
  readonly radius: number;
}

/**
 * Exact framing: where to aim, and how far back to stand, so that every point in `points` lands
 * inside the central `margin` (0…1) of the frame for a perspective camera with the given field of
 * view and aspect ratio. Works for any pose — nothing is assumed about the view direction.
 *
 * The bounds are first centred on screen (shifting the target along the camera's right/up axes),
 * then the radius is the smallest that keeps the farthest-out point inside the margin.
 */
export function frameBounds(
  points: readonly Vec3[],
  base: Vec3,
  yawDeg: number,
  pitchDeg: number,
  fovDeg: number,
  aspect: number,
  margin: number,
): Framing {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  // Direction from target towards the camera, and the camera basis.
  const dx = Math.sin(yaw) * Math.cos(pitch);
  const dy = Math.sin(pitch);
  const dz = Math.cos(yaw) * Math.cos(pitch);
  const forward: Vec3 = [-dx, -dy, -dz];
  const rl = Math.hypot(forward[2], forward[0]) || 1;
  const right: Vec3 = [-forward[2] / rl, 0, forward[0] / rl];
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  const local = points.map((p) => {
    const q: Vec3 = [p[0] - base[0], p[1] - base[1], p[2] - base[2]];
    const r = dot(q, right);
    const u = dot(q, up);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    return { r, u, d: dot(q, forward) };
  });
  const cr = (minR + maxR) / 2;
  const cu = (minU + maxU) / 2;

  const tan = Math.tan((fovDeg * DEG) / 2);
  let radius = 0;
  for (const p of local) {
    const needX = Math.abs(p.r - cr) / (margin * tan * aspect) - p.d;
    const needY = Math.abs(p.u - cu) / (margin * tan) - p.d;
    radius = Math.max(radius, needX, needY);
  }
  return {
    target: [base[0] + right[0] * cr + up[0] * cu, base[1] + right[1] * cr + up[1] * cu, base[2] + right[2] * cr + up[2] * cu],
    radius,
  };
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
