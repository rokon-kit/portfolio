'use client';

import { systemComponents } from '@/content/system';
import type { LabelBridge } from './SceneRuntime.ts';
import type { ComponentId } from '@/types/system';

/**
 * DOM labels positioned over the 3D anchors. Purely visual (the DOM interface carries the
 * information), so hidden from assistive technology. Positions are written straight to the DOM
 * by the scene loop — no React state, no re-renders.
 */
export function SceneLabels({ bridge }: { bridge: LabelBridge }) {
  return (
    <div className="system-labels" aria-hidden="true">
      {systemComponents.map((c) => (
        <div
          key={c.id}
          className="system-label"
          data-visible="false"
          ref={(el) => {
            const map = bridge.elements;
            if (el) map.set(c.id as ComponentId, el);
            else map.delete(c.id as ComponentId);
          }}
        >
          <span className="system-label-inner">
            <span className="callout-node" />
            <span className="callout-badge">
              {c.index} {c.label.toUpperCase()}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
