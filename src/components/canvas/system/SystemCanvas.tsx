'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Fog, type PerspectiveCamera, type Scene } from 'three';
import { COMPONENT_IDS, type ComponentId } from '@/types/system';
import { clamp } from './camera.ts';
import { FOV } from './layout.ts';
import { QUALITY, type Quality } from './quality.ts';
import { SceneRuntime, type LabelBridge } from './SceneRuntime.ts';
import type { SystemStore } from './store.ts';

export interface SceneStats {
  readonly fps: number;
  readonly frameMs: number;
  /** Average CPU time spent in the scene's own per-frame update (ms). Independent of the GPU. */
  readonly cpuMs: number;
  readonly calls: number;
  readonly triangles: number;
  readonly lines: number;
  readonly geometries: number;
  readonly textures: number;
  readonly dpr: number;
  readonly width: number;
  readonly height: number;
  readonly frames: number;
}

export interface SystemCanvasProps {
  readonly store: SystemStore;
  readonly quality: Quality;
  readonly reducedMotion: boolean;
  /** False while off-screen, in a hidden tab or paused: no frames are requested. */
  readonly active: boolean;
  readonly labels: LabelBridge;
  readonly showHitVolumes: boolean;
  /** Exposes `window.__SYSTEM_SCENE__` for the lab and automated tests. */
  readonly debug: boolean;
  readonly onReady: () => void;
  readonly onContextLost: () => void;
  readonly onContextRestored: () => void;
  readonly onStats?: (stats: SceneStats) => void;
}

interface Input {
  pointer: { x: number; y: number } | null;
  orbit: { yaw: number; pitch: number };
  interacting: boolean;
}

/* Imperative helpers: these mutate objects owned by three.js / the DOM, not React state. */
function configureCamera(camera: PerspectiveCamera) {
  camera.fov = FOV;
  camera.near = 0.5;
  camera.far = 90;
  camera.updateProjectionMatrix();
}

function attachToScene(scene: Scene, runtime: SceneRuntime) {
  scene.add(runtime.root);
  scene.fog = new Fog('#12161F', 30, 70);
}

function detachFromScene(scene: Scene, runtime: SceneRuntime) {
  scene.remove(runtime.root);
  scene.fog = null;
  runtime.dispose();
}

function setElementCursor(el: HTMLElement, cursor: string) {
  el.style.cursor = cursor;
}

const ORBIT_YAW_LIMIT = 42;
const ORBIT_PITCH_LIMIT = 14;
const DRAG_THRESHOLD_PX = 5;

/** Everything that lives inside the R3F <Canvas>. */
function SceneBridge(props: SystemCanvasProps) {
  const { store, quality, reducedMotion, active, labels, showHitVolumes, debug } = props;
  const config = QUALITY[quality];

  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);

  const runtimeRef = useRef<SceneRuntime | null>(null);
  const inputRef = useRef<Input>({ pointer: null, orbit: { yaw: 0, pitch: 0 }, interacting: false });
  const dirtyRef = useRef(true);
  const wakeRef = useRef<() => void>(() => {});
  const perf = useRef({ acc: 0, n: 0, fps: 0, ms: 0, cpu: 0, lastStats: 0, ready: false });
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  /* Build / dispose the scene ----------------------------------------- */
  useEffect(() => {
    const runtime = new SceneRuntime({ quality: config, showHitVolumes });
    runtimeRef.current = runtime;
    attachToScene(scene, runtime);
    configureCamera(camera);
    dirtyRef.current = true;
    wakeRef.current();
    return () => {
      detachFromScene(scene, runtime);
      runtimeRef.current = null;
    };
    // showHitVolumes is applied separately below; rebuilding for it would be wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, scene, camera]);

  useEffect(() => {
    runtimeRef.current?.setHitVolumesVisible(showHitVolumes);
    dirtyRef.current = true;
    wakeRef.current();
  }, [showHitVolumes]);

  /* Frame governor: renders only when it should ------------------------ */
  useEffect(() => {
    if (!active) return;
    const minInterval = 1000 / config.fpsCap;
    const timer = { raf: 0, last: 0 };

    const loop = (now: number) => {
      timer.raf = 0;
      // Reduced motion: render only while something is still settling.
      if (reducedMotion && !dirtyRef.current) return;
      if (now - timer.last >= minInterval - 1) {
        timer.last = now;
        dirtyRef.current = false;
        invalidate();
      }
      timer.raf = window.requestAnimationFrame(loop);
    };
    const wake = () => {
      dirtyRef.current = true;
      if (timer.raf === 0) timer.raf = window.requestAnimationFrame(loop);
    };
    wakeRef.current = wake;
    const unsubscribe = store.subscribe(wake);
    wake();
    return () => {
      unsubscribe();
      if (timer.raf !== 0) window.cancelAnimationFrame(timer.raf);
      wakeRef.current = () => {};
    };
  }, [active, reducedMotion, config.fpsCap, invalidate, store]);

  /* Pointer: hover, click-to-select, drag-to-orbit --------------------- */
  useEffect(() => {
    const el = gl.domElement;
    const input = inputRef.current;
    const drag: { current: { x: number; y: number; lastX: number; lastY: number; dragged: boolean } | null } = { current: null };

    const ndc = (event: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: ((event.clientX - r.left) / r.width) * 2 - 1, y: -(((event.clientY - r.top) / r.height) * 2 - 1) };
    };
    const pickAt = (event: PointerEvent): ComponentId | null => {
      const p = ndc(event);
      return runtimeRef.current?.pick(p.x, p.y, camera) ?? null;
    };
    const setCursor = (hovering: boolean) => {
      setElementCursor(el, drag.current?.dragged ? 'grabbing' : hovering ? 'pointer' : 'grab');
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      drag.current = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, dragged: false };
      el.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') input.pointer = ndc(event);
      const down = drag.current;
      if (down) {
        if (!down.dragged && Math.hypot(event.clientX - down.x, event.clientY - down.y) > DRAG_THRESHOLD_PX) {
          down.dragged = true;
          input.interacting = true;
          store.hover(null);
        }
        if (down.dragged) {
          input.orbit.yaw = clamp(input.orbit.yaw - (event.clientX - down.lastX) * 0.15, -ORBIT_YAW_LIMIT, ORBIT_YAW_LIMIT);
          input.orbit.pitch = clamp(input.orbit.pitch + (event.clientY - down.lastY) * 0.1, -ORBIT_PITCH_LIMIT, ORBIT_PITCH_LIMIT);
          down.lastX = event.clientX;
          down.lastY = event.clientY;
          setCursor(false);
        }
      } else if (config.hover && event.pointerType === 'mouse') {
        const id = pickAt(event);
        store.hover(id);
        setCursor(id !== null);
      }
      wakeRef.current();
    };
    const onUp = (event: PointerEvent) => {
      const down = drag.current;
      if (!down) return;
      const wasDrag = down.dragged;
      drag.current = null;
      input.interacting = false;
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
      if (!wasDrag) {
        const id = pickAt(event);
        if (id) store.select(id);
        else if (store.getState().selected) store.select(null);
      }
      setCursor(false);
      wakeRef.current();
    };
    const onLeave = () => {
      if (drag.current) return;
      input.pointer = null;
      store.hover(null);
      setCursor(false);
      wakeRef.current();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    setCursor(false);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      setElementCursor(el, '');
    };
  }, [gl, camera, store, config.hover]);

  /* Reset manual orbit whenever the visitor returns to the original composition */
  useEffect(() => {
    let previous = store.getState();
    return store.subscribe(() => {
      const next = store.getState();
      const returned = next.mode === 'overview' && next.selected === null && (previous.mode !== 'overview' || previous.selected !== null);
      if (next.epoch !== previous.epoch || returned) inputRef.current.orbit = { yaw: 0, pitch: 0 };
      previous = next;
    });
  }, [store]);

  /* WebGL context loss ------------------------------------------------- */
  useEffect(() => {
    const el = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      propsRef.current.onContextLost();
    };
    const restored = () => {
      runtimeRef.current?.invalidateAll();
      dirtyRef.current = true;
      wakeRef.current();
      propsRef.current.onContextRestored();
    };
    el.addEventListener('webglcontextlost', lost);
    el.addEventListener('webglcontextrestored', restored);
    return () => {
      el.removeEventListener('webglcontextlost', lost);
      el.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl]);

  /* Lab / test hooks ---------------------------------------------------- */
  useEffect(() => {
    if (!debug) return;
    // getExtension() returns null while a context is lost, so grab it up front.
    const loseExt = gl.getContext().getExtension('WEBGL_lose_context');
    const api = {
      getState: () => store.getState(),
      select: (id: ComponentId | null) => store.select(id),
      reset: () => store.reset(),
      setMode: (mode: 'overview' | 'architecture') => store.setMode(mode),
      screenPositionOf: (id: ComponentId) => {
        const rt = runtimeRef.current;
        const rect = gl.domElement.getBoundingClientRect();
        if (!rt) return null;
        const p = rt.centerToScreen(id, camera, rect.width, rect.height);
        return { x: rect.left + p.x, y: rect.top + p.y };
      },
      cpuMs: () => perf.current.cpu,
      samplePointsOf: (id: ComponentId) => {
        const rt = runtimeRef.current;
        const rect = gl.domElement.getBoundingClientRect();
        if (!rt) return [];
        return rt.samplePointsToScreen(id, camera, rect.width, rect.height).map((p) => ({ x: rect.left + p.x, y: rect.top + p.y }));
      },
      /** Which component a click at each cell of a grid over the stage would select (QA hit-map). */
      pickMap: (step: number) => {
        const rt = runtimeRef.current;
        const rect = gl.domElement.getBoundingClientRect();
        if (!rt) return null;
        const cols = Math.floor(rect.width / step);
        const rows = Math.floor(rect.height / step);
        const ids: Array<ComponentId | null> = [];
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            const x = ((c + 0.5) * step) / rect.width;
            const y = ((r + 0.5) * step) / rect.height;
            ids.push(rt.pick(x * 2 - 1, -(y * 2 - 1), camera));
          }
        }
        return { cols, rows, step, left: rect.left, top: rect.top, ids };
      },
      camera: () => runtimeRef.current?.cameraState() ?? null,
      materials: () => runtimeRef.current?.describeMaterials() ?? null,
      explode: () => runtimeRef.current?.explode ?? 0,
      info: () => ({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        lines: gl.info.render.lines,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        frame: gl.info.render.frame,
        programs: gl.info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        renderer: (() => {
          const ext = gl.getContext().getExtension('WEBGL_debug_renderer_info');
          return ext ? String(gl.getContext().getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
        })(),
      }),
      loseContext: () => loseExt?.loseContext(),
      restoreContext: () => loseExt?.restoreContext(),
      allIds: COMPONENT_IDS,
    };
    (window as unknown as { __SYSTEM_SCENE__?: typeof api }).__SYSTEM_SCENE__ = api;
    return () => {
      delete (window as unknown as { __SYSTEM_SCENE__?: typeof api }).__SYSTEM_SCENE__;
    };
  }, [debug, gl, camera, store]);

  /* The frame loop ------------------------------------------------------ */
  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const size = state.size;
    const t0 = performance.now();
    const moving = runtime.update({
      state: store.getState(),
      camera,
      width: size.width,
      height: size.height,
      time: state.clock.elapsedTime,
      dt: delta,
      reducedMotion,
      pointer: inputRef.current.pointer,
      orbit: inputRef.current.orbit,
      interacting: inputRef.current.interacting,
    });
    runtime.updateLabels(labels, camera, size.width, size.height, store.getState());
    if (moving) dirtyRef.current = true;

    const p = perf.current;
    p.cpu = p.cpu === 0 ? performance.now() - t0 : p.cpu * 0.9 + (performance.now() - t0) * 0.1;
    if (!p.ready) {
      p.ready = true;
      propsRef.current.onReady();
    }

    // Adaptive resolution: step the pixel ratio down when frames are being missed, and back up
    // when there is plenty of headroom. Skipped in reduced motion (frames are sparse by design).
    if (!reducedMotion && delta > 0) {
      p.acc += delta * 1000;
      p.n += 1;
      if (p.n >= 45) {
        const avg = p.acc / p.n;
        p.ms = avg;
        p.fps = 1000 / avg;
        p.acc = 0;
        p.n = 0;
        const budget = 1000 / config.fpsCap;
        const dpr = gl.getPixelRatio();
        const ceiling = Math.min(window.devicePixelRatio || 1, config.maxDpr);
        if (avg > budget * 1.6 && dpr > 1) setDpr(Math.max(1, dpr - 0.5));
        else if (avg < budget * 1.12 && dpr < ceiling) setDpr(Math.min(ceiling, dpr + 0.25));
      }
    }
    const now = performance.now();
    if (propsRef.current.onStats && now - p.lastStats > 500) {
      p.lastStats = now;
      const info = gl.info;
      propsRef.current.onStats({
        fps: p.fps,
        frameMs: p.ms,
        cpuMs: p.cpu,
        calls: info.render.calls,
        triangles: info.render.triangles,
        lines: info.render.lines,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        dpr: gl.getPixelRatio(),
        width: size.width,
        height: size.height,
        frames: runtime.frames,
      });
    }
  });

  return null;
}

/** R3F canvas for the Strata sculpture. Loaded lazily; never rendered on the server. */
export default function SystemCanvas(props: SystemCanvasProps) {
  const config = QUALITY[props.quality];
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, config.maxDpr]}
      gl={{ antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 0.5, far: 90, position: [14, 10, 16] }}
      style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <SceneBridge {...props} />
    </Canvas>
  );
}
