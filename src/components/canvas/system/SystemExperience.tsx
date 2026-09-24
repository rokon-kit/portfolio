'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { getSystemComponent } from '@/content/system';
import { SceneLabels } from './SceneLabels';
import { SystemPanel } from './SystemPanel';
import { SystemPoster } from './SystemPoster';
import { useMediaQuery, useQuality, useReducedMotion, useRenderGate, useSystemSelector, type MotionPreference } from './hooks.ts';
import type { QualityPreference } from './quality.ts';
import type { LabelBridge } from './SceneRuntime.ts';
import type { SceneStats } from './SystemCanvas';
import { createSystemStore, viewOf, type SystemStore } from './store.ts';
import { detectWebGL } from './webgl.ts';
import type { ComponentId } from '@/types/system';

// three.js and React Three Fiber only load in the browser, and only when this component mounts.
const SystemCanvas = dynamic(() => import('./SystemCanvas'), { ssr: false });

export interface SystemExperienceOptions {
  readonly quality: QualityPreference;
  readonly motion: MotionPreference;
  readonly forceFallback: boolean;
  readonly paused: boolean;
  readonly showHitVolumes: boolean;
  /** Expose `window.__SYSTEM_SCENE__` (lab and automated tests only). */
  readonly debug: boolean;
  /** Bump to remount the scene from scratch. */
  readonly sceneKey: number;
}

export const DEFAULT_OPTIONS: SystemExperienceOptions = {
  quality: 'auto',
  motion: 'auto',
  forceFallback: false,
  paused: false,
  showHitVolumes: false,
  debug: false,
  sceneKey: 0,
};

interface SystemExperienceProps {
  readonly options?: Partial<SystemExperienceOptions>;
  readonly store?: SystemStore;
  readonly onStats?: (stats: SceneStats) => void;
}

const STAGE_LABEL =
  'Interactive 3D sculpture of a conceptual web system: a frontend canopy, an authentication gate, application-service towers, a database stack, a cache tray, a search index and a message bus, joined by routed data-flow conduits. The component list beside it offers the same interactions.';

const noopSubscribe = () => () => {};

/** Catches WebGL / render failures inside the canvas and hands control back to the fallback. */
class SceneBoundary extends Component<{ readonly onError: () => void; readonly children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SystemExperience({ options: partial, store: providedStore, onStats }: SystemExperienceProps) {
  const options = { ...DEFAULT_OPTIONS, ...partial };
  const [ownStore] = useState(createSystemStore);
  const store = providedStore ?? ownStore;

  const stageRef = useRef<HTMLDivElement>(null);
  const [labels] = useState<LabelBridge>(() => ({ elements: new Map<ComponentId, HTMLElement>() }));

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const supported = useSyncExternalStore(noopSubscribe, detectWebGL, () => false);
  const quality = useQuality(options.quality);
  const reducedMotion = useReducedMotion(options.motion);
  const coarse = useMediaQuery('(pointer: coarse)');
  const gate = useRenderGate(stageRef);

  const sceneId = `${quality}-${options.sceneKey}`;
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  const mode = useSystemSelector(store, useCallback((s) => s.mode, []));
  const selected = useSystemSelector(store, useCallback((s) => s.selected, []));
  const view = viewOf({ mode, selected });
  const selectedComponent = selected ? getSystemComponent(selected) : undefined;

  const phase = !mounted
    ? 'detecting'
    : options.forceFallback || !supported || failedFor === sceneId
      ? 'fallback'
      : lostFor === sceneId
        ? 'lost'
        : readyFor === sceneId
          ? 'ready'
          : 'loading';

  const active = gate && !options.paused && phase !== 'fallback' && phase !== 'lost';
  const related = new Set<ComponentId>(selectedComponent?.talksTo ?? []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && (mode !== 'overview' || selected)) {
      event.preventDefault();
      store.reset();
    }
  };

  const announcement = selectedComponent
    ? `${selectedComponent.label} selected${mode === 'architecture' ? ' in the architecture view' : ''}.`
    : mode === 'architecture'
      ? 'Architecture view. All components are separated and labelled.'
      : 'Overview. Original composition.';

  const badge =
    phase === 'loading' || phase === 'detecting'
      ? 'LOADING 3D SCENE'
      : phase === 'fallback'
        ? 'STATIC DRAWING'
        : phase === 'lost'
          ? 'GRAPHICS CONTEXT LOST'
          : selectedComponent
            ? `SELECTED: ${selectedComponent.label.toUpperCase()}`
            : mode === 'architecture'
              ? 'VIEW: ARCHITECTURE'
              : 'VIEW: OVERVIEW';

  return (
    <section
      className="system-experience"
      aria-label="Strata — a conceptual reference system"
      data-scene-view={view}
      data-scene-renderer={phase}
      data-scene-quality={quality}
      data-scene-motion={reducedMotion ? 'reduced' : 'full'}
      onKeyDown={onKeyDown}
    >
      <div className="blueprint-viewport-frame system-figure">
        <div className="viewport-hud-header">
          <div className="hud-status">
            <span className="hud-dot" aria-hidden="true" />
            <span className="hud-title">STRATA // REFERENCE SYSTEM</span>
          </div>
          <div className="hud-controls">
            <span className="hud-badge active-layer">{badge}</span>
          </div>
        </div>

        <div className="system-stage" ref={stageRef} role="img" aria-label={STAGE_LABEL}>
          <SystemPoster selected={selected} related={related} showLabels={phase === 'fallback'} />
          {phase !== 'fallback' && phase !== 'detecting' && (
            <SceneBoundary key={sceneId} onError={() => setFailedFor(sceneId)}>
              <SystemCanvas
                store={store}
                quality={quality}
                reducedMotion={reducedMotion}
                active={active}
                labels={labels}
                showHitVolumes={options.showHitVolumes}
                debug={options.debug}
                onReady={() => setReadyFor(sceneId)}
                onContextLost={() => setLostFor(sceneId)}
                onContextRestored={() => setLostFor(null)}
                {...(onStats ? { onStats } : {})}
              />
            </SceneBoundary>
          )}
          <SceneLabels bridge={labels} />
          {phase === 'fallback' && (
            <p className="system-fallback-note">
              3D view unavailable on this device — showing the static drawing. Every component is still explorable in
              the list.
            </p>
          )}
        </div>

        <div className="viewport-hud-footer">
          <div className="layer-pills system-controls" role="group" aria-label="View controls">
            <button
              type="button"
              className="layer-btn"
              aria-pressed={mode === 'architecture'}
              onClick={() => store.toggleArchitecture()}
            >
              ARCHITECTURE VIEW
            </button>
            <button type="button" className="layer-btn" onClick={() => store.reset()}>
              RETURN TO OVERVIEW
            </button>
          </div>
          <span className="hud-label system-hint">
            {coarse ? 'DRAG TO ORBIT · TAP A COMPONENT' : 'DRAG TO ORBIT · CLICK A COMPONENT · ESC TO RETURN'}
          </span>
        </div>
      </div>

      <SystemPanel store={store} />

      <p className="sr-only" role="status">
        {announcement}
      </p>
    </section>
  );
}
