'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  LAYER_FILTERS,
  SCENE_CALLOUTS,
  SCENE_DESCRIPTION,
  SCENE_FLOOR,
  SCENE_VIEWBOX,
  buildScene,
  type LayerFilter,
  type SceneLayer,
} from './scene-model';

const LAYER_ORDER: readonly SceneLayer[] = ['database', 'backend', 'frontend'];

/*
 * Interaction constants ported from the approved prototype (`initIsometricCanvas`):
 * dragging rotates the model, moving the cursor tilts it, and it eases back towards
 * the tilt target after release.
 */
const TILT_RANGE = 0.4; // radians of tilt at the frame edge
const DRAG_MOUSE = 0.008; // radians per pixel
const DRAG_TOUCH = 0.01;
const EASE = 0.05; // per-frame easing towards the target angle
const SETTLE = 0.0005;

const roundAngle = (angle: number) => Math.round(angle * 1000) / 1000;

interface MotionState {
  angle: number;
  target: number;
  dragging: boolean;
  lastX: number;
}

/**
 * Hero system-model viewport: isometric SVG with an accessible layer filter.
 *
 * The server renders the resting view, so it works with no JavaScript and no WebGL.
 * Pointer interaction (drag to rotate, cursor tilt) is progressive enhancement; the
 * animation frame loop only runs while the model is actually moving, and cursor tilt
 * only tracks while the viewport is on screen. Under `prefers-reduced-motion` there is
 * no tilt and no easing — a drag rotates the model and it stays where it was left.
 */
export function HeroViewport() {
  const [activeLayer, setActiveLayer] = useState<LayerFilter['id']>('all');
  const [rotation, setRotation] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const motion = useRef<MotionState>({ angle: 0, target: 0, dragging: false, lastX: 0 });
  const frame = useRef(0);
  const onScreen = useRef(false);
  const reducedMotion = useRef(false);

  const boxes = useMemo(() => buildScene(rotation), [rotation]);
  const isVisible = (layer: SceneLayer) => activeLayer === 'all' || activeLayer === layer;

  // The frame loop lives inside the effect; event handlers reach it through this ref.
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const tick = () => {
      frame.current = 0;
      const state = motion.current;
      if (!state.dragging && !reducedMotion.current) state.angle += (state.target - state.angle) * EASE;
      setRotation(roundAngle(state.angle));
      const moving = state.dragging || (!reducedMotion.current && Math.abs(state.target - state.angle) > SETTLE);
      if (moving) frame.current = window.requestAnimationFrame(tick);
    };
    const kick = () => {
      if (frame.current === 0) frame.current = window.requestAnimationFrame(tick);
    };
    kickRef.current = kick;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = motionQuery.matches;
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion.current = event.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry?.isIntersecting ?? false;
    });
    observer.observe(stage);

    // Cursor tilt: mouse only, only while the model is on screen.
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const state = motion.current;
      if (event.pointerType !== 'mouse' || state.dragging || !onScreen.current || reducedMotion.current) return;
      const rect = stage.getBoundingClientRect();
      state.target = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * TILT_RANGE;
      kick();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      motionQuery.removeEventListener('change', onMotionChange);
      observer.disconnect();
      if (frame.current !== 0) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
      kickRef.current = () => {};
    };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const state = motion.current;
    state.dragging = true;
    state.lastX = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    kickRef.current();
  };

  const onPointerMoveStage = (event: PointerEvent<HTMLDivElement>) => {
    const state = motion.current;
    if (!state.dragging) return;
    const factor = event.pointerType === 'touch' ? DRAG_TOUCH : DRAG_MOUSE;
    state.angle += (event.clientX - state.lastX) * factor;
    state.lastX = event.clientX;
    kickRef.current();
  };

  const endDrag = () => {
    const state = motion.current;
    if (!state.dragging) return;
    state.dragging = false;
    if (reducedMotion.current) state.target = state.angle; // stay where it was left
    kickRef.current();
  };

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

      <div
        ref={stageRef}
        className="viewport-canvas-container"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMoveStage}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
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
              {boxes
                .filter((box) => box.layer === layer)
                .map((box) => (
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
                    {box.nodes.map((node, index) => (
                      <circle key={index} cx={node.x} cy={node.y} r={2.5} fill="var(--color-accent-cyan)" />
                    ))}
                  </g>
                ))}
            </g>
          ))}
        </svg>

        {SCENE_CALLOUTS.map((callout) => (
          <div key={callout.layer} className="blueprint-callout" style={callout.position} aria-hidden="true">
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
