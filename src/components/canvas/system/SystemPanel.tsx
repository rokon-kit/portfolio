'use client';

import Link from 'next/link';
import { useCallback, useId } from 'react';
import { projects } from '@/content/projects';
import { systemComponents, systemDisclaimer, systemFlows, getSystemComponent } from '@/content/system';
import { COMPONENT_ROUTES } from './layout.ts';
import { useSystemSelector } from './hooks.ts';
import type { SystemStore } from './store.ts';
import type { ComponentId } from '@/types/system';

interface SystemPanelProps {
  readonly store: SystemStore;
}

const projectTitle = (slug: string) => projects.find((p) => p.slug === slug)?.shortTitle ?? slug;

/**
 * The accessible DOM interface. It is a complete equivalent of the 3D interactions: every
 * component can be selected, explained, and explored with a keyboard or screen reader, with or
 * without WebGL. Selection state is shared with the scene through the store.
 */
export function SystemPanel({ store }: SystemPanelProps) {
  const uid = useId();
  const selectedId = useSystemSelector(store, useCallback((s) => s.selected, []));
  const selected = selectedId ? getSystemComponent(selectedId) : undefined;

  return (
    <div className="system-panel">
      <div className="node-tree-panel">
        <span className="panel-tag" id={`${uid}-list`}>
          {'// SYSTEM COMPONENTS (SELECT TO EXPLORE)'}
        </span>
        <div role="group" aria-labelledby={`${uid}-list`} className="node-tree-panel">
          {systemComponents.map((c) => (
            <button
              key={c.id}
              type="button"
              className="interactive-node"
              data-component={c.id}
              aria-pressed={selectedId === c.id}
              onClick={() => store.select(c.id)}
            >
              <span className="node-header">
                <span className="node-indicator" aria-hidden="true" />
                <span className="node-title">
                  {c.index}. {c.label.toUpperCase()}
                </span>
              </span>
              <span className="node-desc">{c.kind}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="node-readout-panel system-detail" aria-labelledby={`${uid}-detail`}>
        <div className="readout-header">
          <span className="readout-label">{selected ? `// COMPONENT ${selected.index}` : '// REFERENCE SYSTEM'}</span>
          <span className="readout-id" id={`${uid}-detail`}>
            {selected ? selected.label.toUpperCase() : 'OVERVIEW'}
          </span>
        </div>

        <div className="readout-content" aria-live="polite">
          {selected ? (
            <>
              <p className="system-kind">{selected.kind}</p>
              <p className="system-role">{selected.role}</p>

              <div className="system-facts">
                <span className="readout-used-label">TALKS TO</span>
                <div className="readout-used-links">
                  {selected.talksTo.map((id) => (
                    <button key={id} type="button" className="used-in-link" onClick={() => store.select(id)}>
                      {getSystemComponent(id)?.label ?? id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="system-facts">
                <span className="readout-used-label">TYPICAL CONCERNS</span>
                <ul className="system-concerns">
                  {selected.concerns.map((concern) => (
                    <li key={concern}>{concern}</li>
                  ))}
                </ul>
              </div>

              <div className="system-facts">
                <span className="readout-used-label">FLOWS INVOLVED</span>
                <ul className="system-concerns">
                  {(COMPONENT_ROUTES[selected.id as ComponentId] as readonly string[]).map((routeId) => {
                    const flow = systemFlows.find((f) => f.id === routeId);
                    return flow ? (
                      <li key={flow.id}>
                        <strong>{flow.label}:</strong> {flow.description}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>

              <div className="system-facts">
                <span className="readout-used-label">IN THIS PORTFOLIO</span>
                {selected.usedIn.length > 0 ? (
                  <div className="readout-used-links">
                    {selected.usedIn.map((slug) => (
                      <Link key={slug} href={`/work/${slug}`} className="used-in-link">
                        {projectTitle(slug)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="system-note">Reference concept — not listed as project experience.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="system-role">
                Seven components of a typical web system, drawn as one structure. Select a component — in
                the model or in this list — to see its role, what it talks to, and how data moves through it.
              </p>
              <div className="system-facts">
                <span className="readout-used-label">DATA FLOWS</span>
                <ul className="system-concerns">
                  {systemFlows.map((flow) => (
                    <li key={flow.id}>
                      <strong>{flow.label}:</strong> {flow.description}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="readout-footer system-disclaimer">
          <span>{systemDisclaimer}</span>
        </div>
      </section>
    </div>
  );
}
