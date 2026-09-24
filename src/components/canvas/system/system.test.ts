import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { systemComponents, systemFlows } from '../../../content/system.ts';
import { projects } from '../../../content/projects.ts';
import { COMPONENT_IDS, ROUTE_IDS } from '../../../types/system.ts';
import { damp, frameBounds, poseToPosition } from './camera.ts';
import {
  ARCHITECTURE,
  COMPONENT_ROUTES,
  EXPLODE,
  FOV,
  OVERVIEW,
  boundPoints,
  FOCUS,
  HIT_VOLUMES,
  ORIGINS,
  ROUTES,
  resolveRoute,
  worldPort,
} from './layout.ts';
import { estimateTriangles, modulePrimitives } from './modules.ts';
import { QUALITY, pickQuality } from './quality.ts';
import { isAxisAligned, pointAt, polylineLengths } from './routes.ts';
import { INITIAL_STATE, createSystemStore, viewOf } from './store.ts';

describe('content', () => {
  it('describes exactly the seven required components, once each', () => {
    assert.deepEqual(systemComponents.map((c) => c.id).sort(), [...COMPONENT_IDS].sort());
    for (const required of ['frontend', 'services', 'auth', 'database', 'cache', 'search', 'messaging']) {
      assert.ok(systemComponents.some((c) => c.id === required), `missing ${required}`);
    }
  });

  it('keeps explanations concise', () => {
    for (const c of systemComponents) {
      assert.ok(c.role.length >= 80 && c.role.length <= 300, `${c.id} role length ${c.role.length}`);
      assert.ok(c.concerns.length >= 3 && c.concerns.length <= 5, `${c.id} concerns`);
    }
  });

  it('only claims project usage for layers documented in CONTENT.md', () => {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const c of systemComponents) for (const slug of c.usedIn) assert.ok(slugs.has(slug), `${c.id}: unknown project ${slug}`);
    // Not documented anywhere as project experience:
    for (const id of ['cache', 'search', 'messaging']) {
      assert.deepEqual(systemComponents.find((c) => c.id === id)?.usedIn, [], `${id} must not claim project use`);
    }
  });

  it('has a flow description for every route and only references real components', () => {
    assert.deepEqual(systemFlows.map((f) => f.id).sort(), [...ROUTE_IDS].sort());
    for (const f of systemFlows) {
      assert.ok(COMPONENT_IDS.includes(f.from) && COMPONENT_IDS.includes(f.to));
    }
    for (const c of systemComponents) for (const other of c.talksTo) assert.ok(COMPONENT_IDS.includes(other));
  });
});

describe('layout and routing', () => {
  it('has origins, explode offsets, focus poses and hit volumes for every component', () => {
    for (const id of COMPONENT_IDS) {
      assert.ok(ORIGINS[id] && EXPLODE[id] && FOCUS[id] && HIT_VOLUMES[id], id);
    }
  });

  it('routes finish exactly at their destination port at rest, mid-explosion and fully exploded', () => {
    for (const t of [0, 0.5, 1]) {
      for (const route of ROUTES) {
        const line = resolveRoute(route, t);
        const end = worldPort(route.to.m, route.to.port, t);
        const last = line[line.length - 1] as readonly number[];
        for (let k = 0; k < 3; k += 1) {
          assert.ok(Math.abs((last[k] as number) - (end[k] as number)) < 1e-6, `${route.id} axis ${k} at t=${t}`);
        }
        const start = worldPort(route.from.m, route.from.port, t);
        assert.deepEqual(line[0], start);
      }
    }
  });

  it('keeps every conduit orthogonal (axis-aligned segments)', () => {
    for (const t of [0, 0.5, 1]) for (const route of ROUTES) assert.ok(isAxisAligned(resolveRoute(route, t)), `${route.id} t=${t}`);
  });

  it('attaches every component to at least one route', () => {
    for (const id of COMPONENT_IDS) assert.ok(COMPONENT_ROUTES[id].length > 0, id);
    assert.equal(new Set(ROUTES.map((r) => r.id)).size, ROUTES.length);
  });

  it('samples points along a polyline by distance', () => {
    const line = resolveRoute(ROUTES[0]!);
    const lengths = polylineLengths(line);
    const out: [number, number, number] = [0, 0, 0];
    assert.deepEqual([...pointAt(line, lengths, 0, out)], [...(line[0] as readonly number[])]);
    const end = [...pointAt(line, lengths, lengths.total + 5, out)];
    assert.deepEqual(end, [...(line[line.length - 1] as readonly number[])]);
    assert.ok(lengths.total > 1);
  });
});

describe('picking volumes', () => {
  it('gives every component at least one solid hit volume', () => {
    for (const id of COMPONENT_IDS) assert.ok(HIT_VOLUMES[id].some((v) => !v.glass), id);
  });

  it('keeps glass-tier volumes to the frontend canopy, so it cannot shadow what is visible through it', () => {
    const glass = COMPONENT_IDS.flatMap((id) => HIT_VOLUMES[id].filter((v) => v.glass).map(() => id));
    assert.deepEqual(glass, ['frontend']);
  });
});

describe('picking volumes do not swallow their neighbours', () => {
  const box = (id: (typeof COMPONENT_IDS)[number], v: { size: readonly number[]; pos: readonly number[] }) =>
    [0, 1, 2].map((a) => [ORIGINS[id][a]! + v.pos[a]! - v.size[a]! / 2, ORIGINS[id][a]! + v.pos[a]! + v.size[a]! / 2] as const);

  it('keeps solid volumes of different components from overlapping at rest', () => {
    for (const a of COMPONENT_IDS) {
      for (const b of COMPONENT_IDS) {
        if (a >= b) continue;
        for (const va of HIT_VOLUMES[a].filter((v) => !v.glass)) {
          for (const vb of HIT_VOLUMES[b].filter((v) => !v.glass)) {
            const A = box(a, va);
            const B = box(b, vb);
            const overlap = [0, 1, 2].every((i) => Math.min(A[i]![1], B[i]![1]) - Math.max(A[i]![0], B[i]![0]) > 0.05); // struts deliberately rest on the slab
            assert.ok(!overlap, `${a} and ${b} picking volumes overlap`);
          }
        }
      }
    }
  });
});

describe('geometry budget', () => {
  it('stays far below the 20,000-triangle design budget in both tiers', () => {
    for (const quality of ['high', 'low'] as const) {
      const cfg = QUALITY[quality];
      const total = COMPONENT_IDS.reduce((sum, id) => sum + estimateTriangles(modulePrimitives(id, cfg.detail), cfg.discSegments), 0);
      assert.ok(total < (quality === 'high' ? 9000 : 5000), `${quality}: ${total} triangles`);
    }
  });

  it('simplifies the mobile tier', () => {
    const count = (q: 'high' | 'low') => COMPONENT_IDS.reduce((n, id) => n + modulePrimitives(id, q).length, 0);
    assert.ok(count('low') < count('high'));
  });

  it('keeps the tower that carries the events port in the low tier', () => {
    const towers = modulePrimitives('services', 'low').filter((p) => p.kind === 'box' && p.layer === 'body' && p.size[1] > 0.9 && p.size[1] < 3);
    assert.ok(towers.length >= 3);
  });
});

describe('quality selection', () => {
  const base = { preference: 'auto', viewportWidth: 1440, coarsePointer: false } as const;
  it('uses the high tier on capable desktops', () => assert.equal(pickQuality(base), 'high'));
  it('uses the low tier for narrow, touch or weak devices', () => {
    assert.equal(pickQuality({ ...base, viewportWidth: 390 }), 'low');
    assert.equal(pickQuality({ ...base, coarsePointer: true }), 'low');
    assert.equal(pickQuality({ ...base, cores: 2 }), 'low');
    assert.equal(pickQuality({ ...base, memoryGb: 2 }), 'low');
  });
  it('honours an explicit preference', () => {
    assert.equal(pickQuality({ ...base, preference: 'low' }), 'low');
    assert.equal(pickQuality({ ...base, viewportWidth: 390, preference: 'high' }), 'high');
  });
});

describe('camera maths', () => {
  it('places the camera on a sphere of the requested radius', () => {
    const target = [1, 2, 3] as const;
    const p = poseToPosition(target, 10, 35, 20);
    assert.ok(Math.abs(Math.hypot(p[0] - 1, p[1] - 2, p[2] - 3) - 10) < 1e-9);
  });
  it('damps monotonically towards the target without overshoot', () => {
    let v = 0;
    let previous = 0;
    for (let i = 0; i < 120; i += 1) {
      v = damp(v, 10, 3, 1 / 60);
      assert.ok(v >= previous && v <= 10);
      previous = v;
    }
    assert.ok(v > 9.5);
  });
  it('is frame-rate independent', () => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < 60; i += 1) a = damp(a, 1, 3, 1 / 60);
    for (let i = 0; i < 30; i += 1) b = damp(b, 1, 3, 1 / 30);
    assert.ok(Math.abs(a - b) < 1e-9);
  });
  /** Projects a world point through the camera that `frameBounds` describes; returns NDC. */
  function ndc(point: readonly number[], target: readonly number[], radius: number, yaw: number, pitch: number, aspect: number) {
    const cam = poseToPosition(target as [number, number, number], radius, yaw, pitch);
    const f = [target[0]! - cam[0], target[1]! - cam[1], target[2]! - cam[2]];
    const fl = Math.hypot(...f);
    const fw = f.map((v) => v / fl) as [number, number, number];
    const rl = Math.hypot(fw[0], fw[2]);
    const right = [-fw[2] / rl, 0, fw[0] / rl] as const;
    const up = [
      right[1] * fw[2] - right[2] * fw[1],
      right[2] * fw[0] - right[0] * fw[2],
      right[0] * fw[1] - right[1] * fw[0],
    ] as const;
    const q = [point[0]! - cam[0], point[1]! - cam[1], point[2]! - cam[2]];
    const depth = q[0]! * fw[0] + q[1]! * fw[1] + q[2]! * fw[2];
    const tan = Math.tan((FOV * Math.PI) / 360);
    return {
      x: (q[0]! * right[0] + q[1]! * right[1] + q[2]! * right[2]) / (depth * tan * aspect),
      y: (q[0]! * up[0] + q[1]! * up[1] + q[2]! * up[2]) / (depth * tan),
      depth,
    };
  }

  it('frames the whole sculpture inside the requested margin for any aspect ratio and explosion', () => {
    for (const aspect of [0.7, 1, 1.45, 2.2]) {
      for (const t of [0, 1]) {
        const pose = t === 0 ? OVERVIEW.wide : ARCHITECTURE.wide;
        const margin = 0.9;
        const fit = frameBounds(boundPoints(t), pose.base, pose.yaw, pose.pitch, FOV, aspect, margin);
        let worst = 0;
        for (const p of boundPoints(t)) {
          const n = ndc(p, fit.target, fit.radius, pose.yaw, pose.pitch, aspect);
          assert.ok(n.depth > 0.5, 'point must be in front of the camera');
          worst = Math.max(worst, Math.abs(n.x), Math.abs(n.y));
        }
        assert.ok(worst <= margin + 1e-6, `aspect ${aspect} t ${t}: worst ${worst.toFixed(3)}`);
        // ...and it is a tight fit (something touches the margin), not a wasteful one.
        assert.ok(worst >= margin - 0.02, `aspect ${aspect} t ${t}: loose fit ${worst.toFixed(3)}`);
      }
    }
  });

  it('stands further back on narrower canvases', () => {
    const fit = (aspect: number) => frameBounds(boundPoints(0), OVERVIEW.wide.base, 34, 21, FOV, aspect, 0.9).radius;
    assert.ok(fit(0.7) > fit(1.45));
  });
});

describe('interaction store', () => {
  it('starts in the original composition', () => {
    const store = createSystemStore();
    assert.deepEqual(store.getState(), INITIAL_STATE);
    assert.equal(viewOf(store.getState()), 'overview');
  });

  it('counts every reset, even when nothing else changed (so manual orbit can be cleared)', () => {
    const store = createSystemStore();
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });
    store.reset();
    store.reset();
    assert.equal(store.getState().epoch, 2);
    assert.equal(calls, 2);
  });

  it('walks through the required visual states and back', () => {
    const store = createSystemStore();
    store.select('auth');
    assert.equal(viewOf(store.getState()), 'selected');
    store.toggleArchitecture();
    assert.equal(viewOf(store.getState()), 'architecture-selected');
    store.select(null);
    assert.equal(viewOf(store.getState()), 'architecture');
    store.reset();
    const after = store.getState();
    assert.deepEqual([after.mode, after.selected, after.hovered], ['overview', null, null]);
  });

  it('toggles a selection off when the same component is chosen again', () => {
    const store = createSystemStore();
    store.select('cache');
    store.select('cache');
    assert.equal(store.getState().selected, null);
  });

  it('notifies subscribers only on real changes and supports unsubscribe', () => {
    const store = createSystemStore();
    let calls = 0;
    const off = store.subscribe(() => {
      calls += 1;
    });
    store.hover('search');
    store.hover('search');
    store.select('database');
    assert.equal(calls, 2);
    off();
    store.reset();
    assert.equal(calls, 2);
  });
});
