'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { systemComponents } from '@/content/system';
import { DEFAULT_OPTIONS, SystemExperience, type SystemExperienceOptions } from './SystemExperience';
import { useSystemSelector } from './hooks.ts';
import type { SceneStats } from './SystemCanvas';
import { createSystemStore, viewOf, type SystemStore } from './store.ts';

/* A tiny store so the 2×/second stats never re-render the scene or its parents. */
function createStatsStore() {
  let value: SceneStats | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: SceneStats) {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
type StatsStore = ReturnType<typeof createStatsStore>;

const CALL_BUDGET = 30;
const TRIANGLE_BUDGET = 20000;

function LabStats({ stats, store }: { stats: StatsStore; store: SystemStore }) {
  const s = useSyncExternalStore(stats.subscribe, stats.get, () => null);
  const mode = useSystemSelector(store, useCallback((x) => x.mode, []));
  const selected = useSystemSelector(store, useCallback((x) => x.selected, []));
  const hovered = useSystemSelector(store, useCallback((x) => x.hovered, []));
  const view = viewOf({ mode, selected });

  const rows: Array<[string, string, boolean?]> = [
    ['State', view],
    ['Selected', selected ?? '—'],
    ['Hovered', hovered ?? '—'],
    ['Draw calls', s ? `${s.calls} / ${CALL_BUDGET}` : '—', s ? s.calls <= CALL_BUDGET : undefined],
    ['Triangles', s ? `${s.triangles} / ${TRIANGLE_BUDGET}` : '—', s ? s.triangles <= TRIANGLE_BUDGET : undefined],
    ['Line segments', s ? String(s.lines) : '—'],
    ['Geometries', s ? String(s.geometries) : '—'],
    ['Textures', s ? String(s.textures) : '—'],
    ['Pixel ratio', s ? s.dpr.toFixed(2) : '—'],
    ['Canvas', s ? `${Math.round(s.width)} × ${Math.round(s.height)}` : '—'],
    ['Frame interval', s && s.frameMs > 0 ? `${s.frameMs.toFixed(1)} ms (${s.fps.toFixed(0)} fps)` : '—'],
    ['Scene CPU / frame', s ? `${s.cpuMs.toFixed(2)} ms` : '—'],
    ['Frames rendered', s ? String(s.frames) : '—'],
  ];

  return (
    <dl className="lab-stats" data-testid="lab-stats">
      {rows.map(([name, value, ok]) => (
        <div key={name} className="lab-stat">
          <dt>{name}</dt>
          <dd data-ok={ok === undefined ? undefined : String(ok)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="lab-control">
      <span className="lab-control-label">{label}</span>
      <div className="layer-pills" role="group" aria-label={label}>
        {options.map((option) => (
          <button key={option} type="button" className="layer-btn" aria-pressed={value === option} onClick={() => onChange(option)}>
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, pressed, onChange }: { label: string; pressed: boolean; onChange: (next: boolean) => void }) {
  return (
    <button type="button" className="layer-btn" aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      {label}
    </button>
  );
}

/**
 * Scene laboratory: the Strata sculpture on its own, with instrumentation and switches for every
 * quality tier, motion preference and failure mode. Not linked from the site; gated in production.
 */
export function SystemLab() {
  const [store] = useState(createSystemStore);
  const [stats] = useState(createStatsStore);
  const [options, setOptions] = useState<SystemExperienceOptions>({ ...DEFAULT_OPTIONS, debug: true });
  const patch = (next: Partial<SystemExperienceOptions>) => setOptions((o) => ({ ...o, ...next }));

  return (
    <div className="lab">
      <div className="section-container">
        <p className="lab-banner">DEVELOPMENT ONLY — SCENE LABORATORY // /lab/system</p>
        <h1 className="lab-title">Strata — signature system sculpture</h1>
        <p className="lab-intro">
          A standalone Three.js / React Three Fiber scene, developed in isolation before it is integrated into the
          portfolio (Milestone 5). Use the controls below to exercise quality tiers, motion preferences and failure
          modes.
        </p>

        <SystemExperience options={options} store={store} onStats={stats.set} />

        <section className="lab-panel" aria-label="Laboratory controls">
          <h2 className="lab-heading">{'// CONTROLS'}</h2>
          <div className="lab-controls">
            <Segmented label="Quality tier" value={options.quality} options={['auto', 'high', 'low'] as const} onChange={(quality) => patch({ quality })} />
            <Segmented label="Motion" value={options.motion} options={['auto', 'reduce', 'full'] as const} onChange={(motion) => patch({ motion })} />
            <div className="lab-control">
              <span className="lab-control-label">Switches</span>
              <div className="layer-pills" role="group" aria-label="Switches">
                <Toggle label="PAUSE RENDERING" pressed={options.paused} onChange={(paused) => patch({ paused })} />
                <Toggle label="SIMULATE NO WEBGL" pressed={options.forceFallback} onChange={(forceFallback) => patch({ forceFallback })} />
                <Toggle label="SHOW HIT VOLUMES" pressed={options.showHitVolumes} onChange={(showHitVolumes) => patch({ showHitVolumes })} />
              </div>
            </div>
            <div className="lab-control">
              <span className="lab-control-label">Scene</span>
              <div className="layer-pills" role="group" aria-label="Scene actions">
                <button type="button" className="layer-btn" onClick={() => patch({ sceneKey: options.sceneKey + 1 })}>
                  REMOUNT SCENE
                </button>
                <button
                  type="button"
                  className="layer-btn"
                  onClick={() => (window as unknown as { __SYSTEM_SCENE__?: { loseContext(): void } }).__SYSTEM_SCENE__?.loseContext()}
                >
                  LOSE GL CONTEXT
                </button>
                <button
                  type="button"
                  className="layer-btn"
                  onClick={() => (window as unknown as { __SYSTEM_SCENE__?: { restoreContext(): void } }).__SYSTEM_SCENE__?.restoreContext()}
                >
                  RESTORE GL CONTEXT
                </button>
              </div>
            </div>
            <div className="lab-control">
              <span className="lab-control-label">Jump to state</span>
              <div className="layer-pills" role="group" aria-label="Jump to state">
                <button type="button" className="layer-btn" onClick={() => store.reset()}>
                  OVERVIEW
                </button>
                <button type="button" className="layer-btn" onClick={() => store.setMode('architecture')}>
                  ARCHITECTURE
                </button>
                {systemComponents.map((c) => (
                  <button key={c.id} type="button" className="layer-btn" onClick={() => store.select(c.id)}>
                    {c.label.toUpperCase().slice(0, 12)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lab-panel" aria-label="Live instrumentation">
          <h2 className="lab-heading">{'// LIVE INSTRUMENTATION'}</h2>
          <LabStats stats={stats} store={store} />
          <p className="lab-note">
            Budgets: ≤ {CALL_BUDGET} draw calls and ≤ {TRIANGLE_BUDGET.toLocaleString()} triangles (docs/DESIGN_SYSTEM.md
            §6). Frame time is measured between rendered frames; under software rendering it is far slower than on a real
            GPU.
          </p>
        </section>
      </div>
    </div>
  );
}
