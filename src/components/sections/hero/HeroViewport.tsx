'use client';

import { useState } from 'react';
import {
  LAYER_FILTERS,
  SCENE_BOXES,
  SCENE_CALLOUTS,
  SCENE_DESCRIPTION,
  SCENE_FLOOR,
  SCENE_VIEWBOX,
  type LayerFilter,
  type SceneLayer,
} from './scene-model';

const LAYER_ORDER: readonly SceneLayer[] = ['database', 'backend', 'frontend'];

/**
 * Hero system-model viewport: static isometric SVG with an accessible layer filter.
 * Works without JavaScript (all layers visible) and without WebGL.
 */
export function HeroViewport() {
  const [activeLayer, setActiveLayer] = useState<LayerFilter['id']>('all');
  const isVisible = (layer: SceneLayer) => activeLayer === 'all' || activeLayer === layer;

  return (
    <div className="blueprint-viewport-frame" role="group" aria-label="Isometric full-stack system model">
      <div className="viewport-hud-header">
        <div className="hud-status">
          <span className="hud-dot" aria-hidden="true" />
          <span className="hud-title">ISOMETRIC SYSTEM MODEL // 3 LAYERS</span>
        </div>
        <div className="hud-controls">
          <span className="hud-badge active-layer" role="status">
            LAYER: {activeLayer.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="viewport-canvas-container">
        <svg
          className="scene-svg"
          viewBox={`0 0 ${SCENE_VIEWBOX.width} ${SCENE_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={SCENE_DESCRIPTION}
        >
          <circle
            cx={SCENE_FLOOR.ring.cx}
            cy={SCENE_FLOOR.ring.cy}
            r={SCENE_FLOOR.ring.r}
            fill="none"
            stroke="var(--color-accent-cyan)"
            strokeOpacity={0.08}
          />
          {SCENE_FLOOR.lines.map((line) => (
            <line key={`${line.x1}-${line.y1}`} {...line} stroke="#fff" strokeOpacity={0.04} />
          ))}

          {LAYER_ORDER.map((layer) => (
            <g key={layer} className="scene-layer" data-hidden={!isVisible(layer)}>
              {SCENE_BOXES.filter((box) => box.layer === layer).map((box) => (
                <g key={box.id} className={box.floats ? 'scene-float' : undefined}>
                  <polygon points={box.faces.bottom} fill={box.fill} fillOpacity={box.fillOpacity} />
                  {(['left', 'right', 'top'] as const).map((face) => (
                    <polygon
                      key={face}
                      points={box.faces[face]}
                      fill={box.fill}
                      fillOpacity={box.fillOpacity}
                      stroke={box.stroke}
                      strokeOpacity={box.strokeOpacity}
                      strokeWidth={1.2}
                      strokeLinejoin="round"
                    />
                  ))}
                  {box.nodes.map((node) => (
                    <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={2.5} fill="var(--color-accent-cyan)" />
                  ))}
                </g>
              ))}
            </g>
          ))}
        </svg>

        {SCENE_CALLOUTS.map((callout) => (
          <div
            key={callout.layer}
            className="blueprint-callout"
            style={callout.position}
            aria-hidden="true"
            data-hidden={!isVisible(callout.layer)}
          >
            <span className="callout-node" />
            <span className="callout-badge">{callout.label}</span>
          </div>
        ))}
      </div>

      <div className="viewport-hud-footer">
        <span className="hud-label" id="layer-filter-label">
          SIMULATION LAYERS:
        </span>
        <div className="layer-pills" role="group" aria-labelledby="layer-filter-label">
          {LAYER_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="layer-btn"
              aria-pressed={activeLayer === filter.id}
              onClick={() => setActiveLayer(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
