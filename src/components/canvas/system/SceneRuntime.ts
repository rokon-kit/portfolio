/**
 * SceneRuntime — builds and animates the "Strata" sculpture.
 *
 * Everything animated lives here and is driven imperatively from one per-frame `update()`:
 * exploded-view offsets, dim / highlight emphasis, conduit routing, data-flow pulses and the
 * camera rig. React is never re-rendered by animation; it only mounts this object and forwards
 * interaction state.
 *
 * Draw-call budget (high tier): 7 modules × ≤4 (body, glass, accent, edges) + ground (2) +
 * conduits (1) + pulses (1) + glow (1) — kept under the 30-call design budget.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  Raycaster,
  Vector2,
  type PerspectiveCamera,
} from 'three';
import { COMPONENT_IDS, type ComponentId, type RouteId } from '@/types/system';
import { clamp, damp, frameBounds, poseToPosition } from './camera.ts';
import { buildModuleGeometry, disposeModuleGeometry, type ModuleGeometry } from './geometry.ts';
import {
  ARCHITECTURE,
  CENTERS,
  COMPONENT_ROUTES,
  FOCUS,
  FOV,
  HIT_VOLUMES,
  LABEL_NUDGE,
  labelAnchor,
  OVERVIEW,
  boundPoints,
  modulePoints,
  ROUTES,
  ORIGINS,
  resolveRoute,
  worldOrigin,
  worldPoint,
} from './layout.ts';
import { applyEmphasis, createModuleMaterials, disposeModuleMaterials, type ModuleMaterials } from './materials.ts';
import { GROUND, type Vec3 } from './modules.ts';
import type { QualityConfig } from './quality.ts';
import { pointAt, polylineLengths, type PolylineLengths } from './routes.ts';
import type { SystemState } from './store.ts';

/* ------------------------------------------------------------------ */
/* Public types                                                         */
/* ------------------------------------------------------------------ */

export interface FrameInput {
  readonly state: SystemState;
  readonly camera: PerspectiveCamera;
  readonly width: number;
  readonly height: number;
  readonly time: number;
  readonly dt: number;
  readonly reducedMotion: boolean;
  /** Pointer position in NDC (-1…1) for parallax, or null when unavailable. */
  readonly pointer: { readonly x: number; readonly y: number } | null;
  /** Manual orbit offsets in degrees. */
  readonly orbit: { readonly yaw: number; readonly pitch: number };
  /** True while the visitor is dragging (suppresses idle sway). */
  readonly interacting: boolean;
}

export interface LabelBridge {
  readonly elements: Map<ComponentId, HTMLElement>;
}

export interface RuntimeOptions {
  readonly quality: QualityConfig;
  readonly showHitVolumes?: boolean;
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const CONDUIT_THICKNESS = 0.07;
const PORT_CUBE = 0.17;
const PULSE_SIZE = 0.1;
const GLOW_FACTOR = 3.4;
const REST_TIME = 0.6; // frozen pulse time for reduced motion
const IDS = COMPONENT_IDS;

/** Components that share a route with each other (used to soften, not hide, neighbours). */
const NEIGHBOURS: Record<ComponentId, ReadonlySet<ComponentId>> = (() => {
  const map = Object.fromEntries(IDS.map((id) => [id, new Set<ComponentId>()])) as Record<ComponentId, Set<ComponentId>>;
  for (const route of ROUTES) {
    map[route.from.m].add(route.to.m);
    map[route.to.m].add(route.from.m);
  }
  return map;
})();

interface ModuleRuntime {
  readonly group: Group;
  readonly geometry: ModuleGeometry;
  readonly materials: ModuleMaterials;
  /** Exact hit volumes. */
  readonly proxies: Mesh[];
  /** Padded, finger-sized volumes; only consulted when nothing exact was hit. */
  readonly tolerant: Mesh[];
  weight: number;
  glow: number;
  applied: boolean;
}

interface RouteRuntime {
  points: Vec3[];
  lengths: PolylineLengths;
  intensity: number;
  target: number;
  firstInstance: number;
  instanceCount: number;
}

interface PulseDef {
  readonly route: number;
  readonly phase: number;
  readonly dir: 1 | -1;
  readonly speed: number;
}

interface CameraState {
  target: [number, number, number];
  radius: number;
  yaw: number;
  pitch: number;
  ready: boolean;
}

const fract = (v: number) => v - Math.floor(v);

/** World centre of a module — the starting point for its close-up framing. */
const CENTERS_BASE = (id: ComponentId, t: number): Vec3 => worldPoint(id, CENTERS[id], t);

/* ------------------------------------------------------------------ */
/* Runtime                                                              */
/* ------------------------------------------------------------------ */

export class SceneRuntime {
  readonly root = new Group();

  private readonly options: RuntimeOptions;
  private readonly modules: Record<ComponentId, ModuleRuntime>;
  private readonly routes: RouteRuntime[];
  private readonly pulseDefs: PulseDef[] = [];
  private readonly conduits: InstancedMesh;
  private readonly pulses: InstancedMesh;
  private readonly glow: InstancedMesh | null;
  private readonly ground: { plate: Mesh; lines: LineSegments; extras: Array<{ dispose(): void }> };
  private readonly lights: Array<Object3D> = [];
  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly dummy = new Object3D();
  private readonly tint = new Color();
  private readonly point: [number, number, number] = [0, 0, 0];
  private readonly cam: CameraState = { target: [0, 0, 0], radius: 20, yaw: 30, pitch: 20, ready: false };
  private fitCache: { key: string; target: Vec3; radius: number } | null = null;

  private explodeT = 0;
  private conduitsDirty = true;
  private colorsDirty = true;
  private pulsesDirty = true;
  private disposed = false;
  /** Frames drawn with animation ticking (exposed for the lab). */
  frames = 0;

  constructor(options: RuntimeOptions) {
    this.options = options;
    const { quality } = options;

    /* Modules ------------------------------------------------------- */
    this.modules = Object.fromEntries(
      IDS.map((id) => {
        const geometry = buildModuleGeometry(id, quality.detail, quality.discSegments);
        const materials = createModuleMaterials(id);
        const group = new Group();
        group.name = id;
        group.position.set(...ORIGINS[id]);
        if (geometry.body) group.add(new Mesh(geometry.body, materials.body));
        if (geometry.glass) group.add(new Mesh(geometry.glass, materials.glass));
        if (geometry.accent) group.add(new Mesh(geometry.accent, materials.accent));
        if (geometry.edges) group.add(new LineSegments(geometry.edges, materials.edges));

        // Invisible hit volumes used for picking (never drawn unless the lab asks for it).
        const makeProxy = (hit: (typeof HIT_VOLUMES)[ComponentId][number], scale: number, color: string) => {
          const proxy = new Mesh(
            new BoxGeometry(hit.size[0] * scale, hit.size[1] * scale, hit.size[2] * scale),
            new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 }),
          );
          proxy.position.set(...hit.pos);
          proxy.visible = Boolean(options.showHitVolumes);
          proxy.userData['componentId'] = id;
          proxy.userData['glass'] = Boolean(hit.glass);
          group.add(proxy);
          return proxy;
        };
        const proxies = HIT_VOLUMES[id].map((hit) => makeProxy(hit, 1, hit.glass ? '#F59E0B' : '#38BDF8'));
        const tolerant =
          quality.hitPadding > 1 ? HIT_VOLUMES[id].filter((hit) => !hit.glass).map((hit) => makeProxy(hit, quality.hitPadding, '#10B981')) : [];

        this.root.add(group);
        const runtime: ModuleRuntime = { group, geometry, materials, proxies, tolerant, weight: 1, glow: 0, applied: false };
        return [id, runtime];
      }),
    ) as Record<ComponentId, ModuleRuntime>;

    /* Conduits + pulses --------------------------------------------- */
    this.routes = ROUTES.map((spec) => {
      const points = resolveRoute(spec, 0);
      return { points, lengths: polylineLengths(points), intensity: 0.55, target: 0.55, firstInstance: 0, instanceCount: 0 };
    });

    const capacity = ROUTES.length * 8;
    this.conduits = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      capacity,
    );
    this.conduits.instanceMatrix.setUsage(DynamicDrawUsage);
    this.conduits.frustumCulled = false;
    this.conduits.setColorAt(0, this.tint.set('#ffffff'));
    this.root.add(this.conduits);

    ROUTES.forEach((spec, routeIndex) => {
      const forward = Math.max(1, Math.round(spec.pulses * quality.pulseScale));
      const back = spec.returns === 0 ? 0 : Math.max(1, Math.round(spec.returns * quality.pulseScale));
      for (let i = 0; i < forward; i += 1) {
        this.pulseDefs.push({ route: routeIndex, phase: fract(i / forward + routeIndex * 0.137), dir: 1, speed: spec.speed });
      }
      for (let i = 0; i < back; i += 1) {
        this.pulseDefs.push({ route: routeIndex, phase: fract((i + 0.5) / back + routeIndex * 0.291), dir: -1, speed: spec.speed * 0.8 });
      }
    });

    this.pulses = new InstancedMesh(
      new OctahedronGeometry(1, 0),
      new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      this.pulseDefs.length,
    );
    this.pulses.instanceMatrix.setUsage(DynamicDrawUsage);
    this.pulses.frustumCulled = false;
    this.pulses.setColorAt(0, this.tint.set('#ffffff'));
    this.root.add(this.pulses);

    if (quality.glow) {
      this.glow = new InstancedMesh(
        new IcosahedronGeometry(1, 1),
        new MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.2,
          blending: AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
        this.pulseDefs.length,
      );
      this.glow.instanceMatrix.setUsage(DynamicDrawUsage);
      this.glow.frustumCulled = false;
      this.glow.setColorAt(0, this.tint.set('#ffffff'));
      this.root.add(this.glow);
    } else {
      this.glow = null;
    }

    /* Ground -------------------------------------------------------- */
    this.ground = this.buildGround();

    /* Lights -------------------------------------------------------- */
    this.buildLights();
  }

  /* ---------------------------------------------------------------- */
  /* Construction helpers                                              */
  /* ---------------------------------------------------------------- */

  private buildGround() {
    const [sx, sy, sz] = GROUND.size;
    const plate = new Mesh(
      new BoxGeometry(sx, sy, sz),
      new MeshStandardMaterial({ color: '#0A0F18', roughness: 0.85, metalness: 0.1 }),
    );
    plate.position.set(...GROUND.pos);
    this.root.add(plate);

    const y = GROUND.pos[1] + sy / 2 + 0.004;
    const x0 = GROUND.pos[0] - sx / 2;
    const x1 = GROUND.pos[0] + sx / 2;
    const z0 = GROUND.pos[2] - sz / 2;
    const z1 = GROUND.pos[2] + sz / 2;
    const v: number[] = [];
    const seg = (ax: number, az: number, bx: number, bz: number) => v.push(ax, y, az, bx, y, bz);

    // Drafting grid.
    for (let x = Math.ceil(x0 / 1.5) * 1.5; x <= x1; x += 1.5) seg(x, z0, x, z1);
    for (let z = Math.ceil(z0 / 1.5) * 1.5; z <= z1; z += 1.5) seg(x0, z, x1, z);
    // Compass rings around the foundation.
    const cx = ORIGINS.database[0];
    const cz = ORIGINS.database[2];
    for (const r of [3.3, 5.2]) {
      const n = 96;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2;
        const b = ((i + 1) / n) * Math.PI * 2;
        seg(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r);
      }
    }
    // Corner registration marks.
    for (const [px, pz, dx, dz] of [
      [x0, z0, 1, 1],
      [x1, z0, -1, 1],
      [x0, z1, 1, -1],
      [x1, z1, -1, -1],
    ] as const) {
      seg(px, pz, px + dx * 0.9, pz);
      seg(px, pz, px, pz + dz * 0.9);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(v, 3));
    const lines = new LineSegments(
      geometry,
      new LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.1, toneMapped: false }),
    );
    this.root.add(lines);
    return { plate, lines, extras: [] as Array<{ dispose(): void }> };
  }

  private buildLights() {
    // Design-system lighting (docs/DESIGN_SYSTEM.md §6): cool ambient base, cyan key, amber rim.
    const ambient = new AmbientLight('#3A425A', 0.5);
    const hemi = new HemisphereLight('#4A5A85', '#06080C', 0.5);
    const key = new DirectionalLight('#38BDF8', 1.35);
    key.position.set(9, 14, 10);
    const rim = new DirectionalLight('#F59E0B', 0.5);
    rim.position.set(-10, 6, -12);
    const fill = new DirectionalLight('#A9B8D8', 0.35);
    fill.position.set(-8, 5, 9);
    for (const light of [ambient, hemi, key, rim, fill]) {
      this.root.add(light);
      this.lights.push(light);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Per-frame update                                                   */
  /* ---------------------------------------------------------------- */

  /** Advances the scene. Returns true while anything is still moving (used in reduced motion). */
  update(input: FrameInput): boolean {
    if (this.disposed) return false;
    const { state, reducedMotion: snap } = input;
    const dt = Math.min(input.dt, 0.1);
    let moving = false;

    /* Exploded view */
    const explodeTarget = state.mode === 'architecture' ? 1 : 0;
    const previous = this.explodeT;
    this.explodeT = snap || Math.abs(explodeTarget - previous) < 1e-3 ? explodeTarget : damp(previous, explodeTarget, 2.4, dt);
    if (this.explodeT !== previous || !this.cam.ready) {
      for (const id of IDS) this.modules[id].group.position.set(...worldOrigin(id, this.explodeT));
      this.conduitsDirty = true;
      this.pulsesDirty = true;
      moving = moving || Math.abs(this.explodeT - explodeTarget) > 1e-3;
    }

    /* Emphasis */
    const { selected, hovered } = state;
    for (const id of IDS) {
      const m = this.modules[id];
      const targetWeight = selected ? (id === selected ? 1 : NEIGHBOURS[selected].has(id) ? 0.5 : 0.14) : 1;
      const targetGlow = selected === id ? 1 : hovered === id ? 0.6 : 0;
      const weight = snap ? targetWeight : damp(m.weight, targetWeight, 6, dt);
      const glow = snap ? targetGlow : damp(m.glow, targetGlow, 8, dt);
      if (!m.applied || Math.abs(weight - m.weight) > 1e-3 || Math.abs(glow - m.glow) > 1e-3) {
        m.weight = weight;
        m.glow = glow;
        m.applied = true;
        applyEmphasis(m.materials, weight, glow);
        moving = moving || Math.abs(weight - targetWeight) > 4e-3 || Math.abs(glow - targetGlow) > 4e-3;
      }
    }

    /* Route emphasis */
    ROUTES.forEach((spec, index) => {
      const route = this.routes[index] as RouteRuntime;
      const involved = (id: ComponentId | null) => (id ? (COMPONENT_ROUTES[id] as readonly RouteId[]).includes(spec.id) : false);
      route.target = selected
        ? involved(selected)
          ? 1
          : 0.12
        : hovered
          ? involved(hovered)
            ? 0.95
            : 0.45
          : state.mode === 'architecture'
            ? 0.85
            : 0.55;
      const next = snap ? route.target : damp(route.intensity, route.target, 6, dt);
      if (Math.abs(next - route.intensity) > 1e-3) {
        route.intensity = next;
        this.colorsDirty = true;
        this.pulsesDirty = true;
        moving = moving || Math.abs(next - route.target) > 4e-3;
      }
    });

    if (this.conduitsDirty) this.rebuildConduits();
    if (this.colorsDirty) this.recolor();
    if (!snap || this.pulsesDirty) this.updatePulses(snap ? REST_TIME : input.time);

    /* Camera */
    moving = this.updateCamera(input, dt) || moving;

    this.frames += 1;
    return moving;
  }

  private rebuildConduits() {
    let cursor = 0;
    const th = CONDUIT_THICKNESS;
    const write = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
      if (cursor >= this.conduits.instanceMatrix.count) return;
      this.dummy.position.set(cx, cy, cz);
      this.dummy.scale.set(sx, sy, sz);
      this.dummy.updateMatrix();
      this.conduits.setMatrixAt(cursor, this.dummy.matrix);
      cursor += 1;
    };

    ROUTES.forEach((spec, index) => {
      const route = this.routes[index] as RouteRuntime;
      route.points = resolveRoute(spec, this.explodeT);
      route.lengths = polylineLengths(route.points);
      route.firstInstance = cursor;
      const first = route.points[0] as Vec3;
      const last = route.points[route.points.length - 1] as Vec3;
      write(first[0], first[1], first[2], PORT_CUBE, PORT_CUBE, PORT_CUBE);
      for (let i = 1; i < route.points.length; i += 1) {
        const a = route.points[i - 1] as Vec3;
        const b = route.points[i] as Vec3;
        write(
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2,
          (a[2] + b[2]) / 2,
          Math.abs(b[0] - a[0]) + th,
          Math.abs(b[1] - a[1]) + th,
          Math.abs(b[2] - a[2]) + th,
        );
      }
      write(last[0], last[1], last[2], PORT_CUBE, PORT_CUBE, PORT_CUBE);
      route.instanceCount = cursor - route.firstInstance;
    });

    this.conduits.count = cursor;
    this.conduits.instanceMatrix.needsUpdate = true;
    this.conduitsDirty = false;
    this.colorsDirty = true;
  }

  private recolor() {
    ROUTES.forEach((spec, index) => {
      const route = this.routes[index] as RouteRuntime;
      this.tint.set(spec.color).multiplyScalar(0.2 + 0.8 * route.intensity);
      for (let i = 0; i < route.instanceCount; i += 1) this.conduits.setColorAt(route.firstInstance + i, this.tint);
    });
    if (this.conduits.instanceColor) this.conduits.instanceColor.needsUpdate = true;

    this.pulseDefs.forEach((pulse, i) => {
      const spec = ROUTES[pulse.route]!;
      const route = this.routes[pulse.route] as RouteRuntime;
      this.tint.set(spec.color).multiplyScalar(0.4 + 0.9 * route.intensity);
      this.pulses.setColorAt(i, this.tint);
      this.glow?.setColorAt(i, this.tint);
    });
    if (this.pulses.instanceColor) this.pulses.instanceColor.needsUpdate = true;
    if (this.glow?.instanceColor) this.glow.instanceColor.needsUpdate = true;
    this.colorsDirty = false;
  }

  private updatePulses(time: number) {
    this.pulseDefs.forEach((pulse, i) => {
      const route = this.routes[pulse.route] as RouteRuntime;
      const total = route.lengths.total;
      const u = fract(pulse.phase + (pulse.dir * time * pulse.speed) / Math.max(total, 0.001));
      pointAt(route.points, route.lengths, u * total, this.point);
      // Fade in/out at the ports so pulses never pop.
      const fade = Math.pow(Math.sin(Math.PI * u), 0.6);
      const size = PULSE_SIZE * (0.55 + 0.9 * route.intensity) * fade;
      this.dummy.position.set(this.point[0], this.point[1], this.point[2]);
      this.dummy.scale.setScalar(size);
      this.dummy.updateMatrix();
      this.pulses.setMatrixAt(i, this.dummy.matrix);
      if (this.glow) {
        this.dummy.scale.setScalar(size * GLOW_FACTOR);
        this.dummy.updateMatrix();
        this.glow.setMatrixAt(i, this.dummy.matrix);
      }
    });
    this.pulses.instanceMatrix.needsUpdate = true;
    if (this.glow) this.glow.instanceMatrix.needsUpdate = true;
    this.pulsesDirty = false;
  }

  private updateCamera(input: FrameInput, dt: number): boolean {
    const { state, camera, reducedMotion: snap } = input;
    const aspect = input.width / Math.max(input.height, 1);
    const narrow = aspect < 1.1;

    let target: Vec3;
    let radius: number;
    let yaw: number;
    let pitch: number;

    if (state.selected) {
      const focus = FOCUS[state.selected];
      const fit = this.fit(`sel:${state.selected}`, () => modulePoints(state.selected as ComponentId, this.explodeT), CENTERS_BASE(state.selected, this.explodeT), focus.yaw, focus.pitch, aspect, focus.margin);
      target = fit.target;
      radius = clamp(fit.radius, 5.5, 22);
      yaw = focus.yaw;
      pitch = focus.pitch;
    } else {
      const architecture = state.mode === 'architecture';
      const base = (architecture ? ARCHITECTURE : OVERVIEW)[narrow ? 'narrow' : 'wide'];
      const fit = this.fit(`${architecture ? 'arch' : 'over'}:${narrow ? 'n' : 'w'}`, () => boundPoints(this.explodeT), base.base, base.yaw, base.pitch, aspect, base.margin);
      target = fit.target;
      radius = fit.radius;
      yaw = base.yaw;
      pitch = base.pitch;
    }

    // Idle sway, pointer parallax and manual orbit are offsets on top of the pose.
    const selectedScale = state.selected ? 0.35 : 1;
    if (!snap) {
      if (!input.interacting) {
        yaw += Math.sin(input.time * 0.35) * 1.3;
        pitch += Math.sin(input.time * 0.23 + 1.2) * 0.45;
      }
      if (input.pointer) {
        yaw += input.pointer.x * 3 * selectedScale;
        pitch += input.pointer.y * 1.6 * selectedScale;
      }
    }
    yaw += input.orbit.yaw * selectedScale;
    pitch = clamp(pitch + input.orbit.pitch * selectedScale, 4, 62);

    const cam = this.cam;
    if (!cam.ready || snap) {
      cam.target = [target[0], target[1], target[2]];
      cam.radius = radius;
      cam.yaw = yaw;
      cam.pitch = pitch;
      cam.ready = true;
    } else {
      const lambda = state.selected || input.interacting ? 3.4 : 3.0;
      cam.target[0] = damp(cam.target[0], target[0], lambda, dt);
      cam.target[1] = damp(cam.target[1], target[1], lambda, dt);
      cam.target[2] = damp(cam.target[2], target[2], lambda, dt);
      cam.radius = damp(cam.radius, radius, lambda, dt);
      cam.yaw = damp(cam.yaw, yaw, lambda, dt);
      cam.pitch = damp(cam.pitch, pitch, lambda, dt);
    }

    const position = poseToPosition(cam.target, cam.radius, cam.yaw, cam.pitch);
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
    camera.updateMatrixWorld();

    const settled =
      Math.abs(cam.radius - radius) < 0.02 &&
      Math.abs(cam.yaw - yaw) < 0.05 &&
      Math.abs(cam.pitch - pitch) < 0.05 &&
      Math.abs(cam.target[0] - target[0]) < 0.02 &&
      Math.abs(cam.target[1] - target[1]) < 0.02 &&
      Math.abs(cam.target[2] - target[2]) < 0.02;
    return !settled;
  }

  /** Memoised framing: recomputed only when the explosion, aspect ratio or pose changes. */
  private fit(
    key: string,
    points: () => Vec3[],
    base: Vec3,
    yaw: number,
    pitch: number,
    aspect: number,
    margin: number,
  ): { target: Vec3; radius: number } {
    const full = `${key}|${this.explodeT.toFixed(3)}|${aspect.toFixed(3)}`;
    if (this.fitCache?.key === full) return this.fitCache;
    const framing = frameBounds(points(), base, yaw, pitch, FOV, aspect, margin);
    this.fitCache = { key: full, target: framing.target, radius: framing.radius };
    return this.fitCache;
  }

  /* ---------------------------------------------------------------- */
  /* Interaction                                                        */
  /* ---------------------------------------------------------------- */

  /** Nearest component under the pointer (NDC coordinates), or null. */
  pick(x: number, y: number, camera: PerspectiveCamera): ComponentId | null {
    this.root.updateMatrixWorld();
    this.ndc.set(x, y);
    this.raycaster.setFromCamera(this.ndc, camera);
    const owner = (h: { object: Object3D }) => h.object.userData['componentId'] as ComponentId | undefined;

    // 1. Exact volumes, nearest first. Solid outranks glass, so a tower seen *through* the canopy
    //    can still be selected.
    const exact = this.raycaster.intersectObjects(
      IDS.flatMap((id) => this.modules[id].proxies),
      false,
    );
    const solid = exact.find((h) => !h.object.userData['glass']);
    if (solid) return owner(solid) ?? null;

    // 2. Forgiving, finger-sized volumes — only when nothing exact was hit.
    const tolerantHits = this.raycaster.intersectObjects(
      IDS.flatMap((id) => this.modules[id].tolerant),
      false,
    );
    if (tolerantHits[0]) return owner(tolerantHits[0]) ?? null;

    // 3. Empty glass (e.g. the canopy plate with nothing behind it).
    return exact[0] ? (owner(exact[0]) ?? null) : null;
  }

  /** A spread of points on a component's geometry, in canvas pixels (used to test reachability). */
  samplePointsToScreen(id: ComponentId, camera: PerspectiveCamera, width: number, height: number) {
    // Centres of the solid picking volumes, largest first: bounding-box fractions are unreliable
    // because a module's bounds include empty space (e.g. between the messaging pylons).
    const solid = HIT_VOLUMES[id]
      .filter((hit) => !hit.glass)
      .sort((a, b) => b.size[0] * b.size[1] * b.size[2] - a.size[0] * a.size[1] * a.size[2]);
    const local: Vec3[] = solid.map((hit) => [...hit.pos]);
    // Then a few points spread across the largest volume, in case its centre is occluded.
    const [main] = solid;
    if (main) {
      for (const [fx, fy] of [[0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]] as const) {
        local.push([main.pos[0] + main.size[0] * fx, main.pos[1] + main.size[1] * fy, main.pos[2]]);
      }
    }
    const e = camera.matrixWorldInverse.elements;
    const p = camera.projectionMatrix.elements;
    return local.map((l) => {
      const [x, y, z] = worldPoint(id, l, this.explodeT);
      const cx = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
      const cy = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
      const cz = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!;
      const pw = -cz;
      return {
        x: (((p[0]! * cx + p[8]! * cz) / pw) * 0.5 + 0.5) * width,
        y: (1 - (((p[5]! * cy + p[9]! * cz) / pw) * 0.5 + 0.5)) * height,
      };
    });
  }

  setHitVolumesVisible(visible: boolean) {
    for (const id of IDS) for (const proxy of [...this.modules[id].proxies, ...this.modules[id].tolerant]) proxy.visible = visible;
  }

  /** Projects a component's label anchor to canvas pixels (also used by tests to click precisely). */
  anchorToScreen(id: ComponentId, camera: PerspectiveCamera, width: number, height: number) {
    const local = labelAnchor(id);
    const world = worldPoint(id, local, this.explodeT);
    const v = new Vector2();
    // Manual projection avoids allocating a Vector3 per label per frame.
    const e = camera.matrixWorldInverse.elements;
    const p = camera.projectionMatrix.elements;
    const [x, y, z] = world;
    const cx = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
    const cy = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
    const cz = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!;
    const px = p[0]! * cx + p[8]! * cz;
    const py = p[5]! * cy + p[9]! * cz;
    const pw = -cz;
    v.set(((px / pw) * 0.5 + 0.5) * width, (1 - ((py / pw) * 0.5 + 0.5)) * height);
    return { x: v.x, y: v.y, visible: pw > 0 };
  }

  /** Centre of a component in canvas pixels (test hook: where to click). */
  centerToScreen(id: ComponentId, camera: PerspectiveCamera, width: number, height: number) {
    const world = worldPoint(id, CENTERS[id], this.explodeT);
    const e = camera.matrixWorldInverse.elements;
    const p = camera.projectionMatrix.elements;
    const [x, y, z] = world;
    const cx = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
    const cy = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
    const cz = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!;
    const pw = -cz;
    return {
      x: (((p[0]! * cx + p[8]! * cz) / pw) * 0.5 + 0.5) * width,
      y: (1 - (((p[5]! * cy + p[9]! * cz) / pw) * 0.5 + 0.5)) * height,
    };
  }

  /** Positions DOM labels over their 3D anchors. Only labels that should show are projected. */
  updateLabels(bridge: LabelBridge, camera: PerspectiveCamera, width: number, height: number, state: SystemState) {
    for (const id of IDS) {
      const el = bridge.elements.get(id);
      if (!el) continue;
      const show = state.mode === 'architecture' || state.selected === id || state.hovered === id;
      const shown = el.dataset['visible'] === 'true';
      if (!show) {
        if (shown) el.dataset['visible'] = 'false';
        continue;
      }
      const s = this.anchorToScreen(id, camera, width, height);
      if (!s.visible) continue;
      // Measure once (reading layout every frame would force reflow), then keep labels inside the stage.
      let w = Number(el.dataset['w']) || 0;
      if (w === 0 && el.firstElementChild instanceof HTMLElement) {
        w = el.firstElementChild.offsetWidth;
        el.dataset['w'] = String(w);
      }
      const nudge = LABEL_NUDGE[id];
      const x = clamp(s.x + nudge[0], w / 2 + 8, Math.max(w / 2 + 8, width - w / 2 - 8));
      const y = clamp(s.y + nudge[1], 36, Math.max(36, height - 8));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (!shown) el.dataset['visible'] = 'true';
    }
  }

  /** Lab hook: a compact description of every module's materials (for debugging looks). */
  describeMaterials() {
    return Object.fromEntries(
      IDS.map((id) => {
        const m = this.modules[id].materials;
        return [
          id,
          {
            body: { color: m.body.color.getHexString(), emissive: m.body.emissive.getHexString(), emissiveIntensity: m.body.emissiveIntensity, vertexColors: m.body.vertexColors, roughness: m.body.roughness, metalness: m.body.metalness },
            accent: m.accent.color.getHexString(),
            edges: { color: m.edges.color.getHexString(), opacity: m.edges.opacity },
          },
        ];
      }),
    );
  }

  get explode() {
    return this.explodeT;
  }

  cameraState() {
    return { radius: this.cam.radius, yaw: this.cam.yaw, pitch: this.cam.pitch, target: [...this.cam.target] as [number, number, number] };
  }

  /** Forces the first frame after mount to snap the camera and materials into place. */
  invalidateAll() {
    this.cam.ready = false;
    this.conduitsDirty = true;
    this.colorsDirty = true;
    this.pulsesDirty = true;
    for (const id of IDS) this.modules[id].applied = false;
  }

  /* ---------------------------------------------------------------- */
  /* Cleanup                                                            */
  /* ---------------------------------------------------------------- */

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const id of IDS) {
      const m = this.modules[id];
      disposeModuleGeometry(m.geometry);
      disposeModuleMaterials(m.materials);
      for (const proxy of [...m.proxies, ...m.tolerant]) {
        proxy.geometry.dispose();
        (proxy.material as MeshBasicMaterial).dispose();
      }
    }
    for (const mesh of [this.conduits, this.pulses, this.glow]) {
      if (!mesh) continue;
      mesh.geometry.dispose();
      (mesh.material as MeshBasicMaterial).dispose();
      mesh.dispose();
    }
    this.ground.plate.geometry.dispose();
    (this.ground.plate.material as MeshStandardMaterial).dispose();
    this.ground.lines.geometry.dispose();
    (this.ground.lines.material as LineBasicMaterial).dispose();
    this.root.clear();
  }
}
