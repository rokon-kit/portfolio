'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { LiveClock } from '@/components/ui/LiveClock';
import { profile } from '@/content/profile';
import type { Layer, LayerId, LayerView } from '@/types/content';

interface LayerInspectorProps {
  readonly layers: readonly Layer[];
  readonly views: readonly LayerView[];
  readonly projects: readonly { readonly slug: string; readonly title: string }[];
}

/**
 * Layer list + readout panel. The view buttons are shortcuts that select the first layer
 * of a view; the selected layer always determines which view is highlighted.
 */
export function LayerInspector({ layers, views, projects }: LayerInspectorProps) {
  const [activeId, setActiveId] = useState<LayerId>(layers[0]?.id ?? 'client');

  const activeIndex = Math.max(
    0,
    layers.findIndex((layer) => layer.id === activeId),
  );
  const active = layers[activeIndex];
  if (!active) return null;

  const projectTitle = (slug: string) => projects.find((project) => project.slug === slug)?.title;

  return (
    <div className="topology-console-deck">
      <CornerFrame />

      <div className="console-controls-bar">
        <div className="console-title-group">
          <span className="console-dot" aria-hidden="true" />
          <span className="console-heading">ARCHITECTURE TELEMETRY MATRIX</span>
        </div>

        <div className="console-tabs" role="group" aria-label="Jump to a view">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              className="console-tab"
              aria-pressed={active.view === view.id}
              onClick={() => setActiveId(view.defaultLayer)}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="topology-display-stage">
        <div className="telemetry-screen">
          <div className="node-tree-panel">
            <span className="panel-tag" id="layer-list-label">
              {'// SYSTEM LAYERS (SELECT NODE TO INSPECT)'}
            </span>
            <div role="group" aria-labelledby="layer-list-label" className="node-tree-panel">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className="interactive-node"
                  aria-pressed={layer.id === active.id}
                  onClick={() => setActiveId(layer.id)}
                >
                  <span className="node-header">
                    <span className="node-indicator" aria-hidden="true" />
                    <span className="node-title">{layer.title}</span>
                  </span>
                  <span className="node-desc">{layer.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="node-readout-panel">
            <div className="readout-header">
              <span className="readout-label">{'// NODE SPECIFICATION INSPECTOR'}</span>
              <span className="readout-id">NODE: {active.shortName}</span>
            </div>

            <div className="readout-content">
              {active.readouts.map((row) => (
                <div key={row.name} className="readout-stat-row">
                  <span className="stat-name">{row.name}:</span>
                  <span
                    className={`stat-val${row.tone === 'cyan' ? ' highlight-cyan' : ''}${row.tone === 'green' ? ' highlight-green' : ''}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              <div className="readout-used">
                <span className="readout-used-label">USED IN</span>
                <div className="readout-used-links">
                  {active.usedIn.map((slug) => (
                    <Link key={slug} href={`/work/${slug}`} className="used-in-link">
                      {projectTitle(slug) ?? slug}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="readout-code-block">
                <span className="code-comment">{active.illustration.caption}</span>
                <pre>
                  <code>{active.illustration.code}</code>
                </pre>
              </div>
            </div>

            <div className="readout-footer">
              <span>
                LAYER {String(activeIndex + 1).padStart(2, '0')} / {String(layers.length).padStart(2, '0')}
              </span>
              <LiveClock timeZone={profile.location.timeZoneId} label={profile.location.timezone} />
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status">
        Layer {activeIndex + 1} of {layers.length} selected: {active.shortName}
      </p>
    </div>
  );
}
