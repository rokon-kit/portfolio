import { COMPONENT_COLOR } from './layout.ts';
import { buildPoster, type PosterItem } from './posterGeometry.ts';
import type { ComponentId } from '@/types/system';

interface SystemPosterProps {
  readonly selected: ComponentId | null;
  readonly related: ReadonlySet<ComponentId>;
  /** Show module names (used when this drawing is the visible fallback). */
  readonly showLabels: boolean;
}

const SHADE = { top: 1, right: 0.62, left: 0.4 } as const;

function shadeOpacity(shade: 0 | 1 | 2) {
  return shade === 0 ? SHADE.top : shade === 1 ? SHADE.right : SHADE.left;
}

function Item({ item }: { item: PosterItem }) {
  const color = item.id === 'ground' ? '#38BDF8' : COMPONENT_COLOR[item.id];
  const solid = item.layer === 'accent';
  const glass = item.layer === 'glass';
  const fill = solid ? color : glass ? color : '#0F1726';
  const baseOpacity = solid ? 0.85 : glass ? 0.12 : 1;

  if (item.ellipse) {
    const { cx, cy, rx, ry, side } = item.ellipse;
    return (
      <g>
        <path d={side} fill="#0B1220" stroke={color} strokeOpacity={0.55} strokeWidth={0.05} />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#111B2E" stroke={color} strokeOpacity={0.9} strokeWidth={0.06} />
      </g>
    );
  }
  return (
    <g>
      {item.faces.map((face, i) => (
        <polygon
          key={i}
          points={face.points}
          fill={fill}
          fillOpacity={baseOpacity * (solid || glass ? 1 : shadeOpacity(face.shade))}
          stroke={item.id === 'ground' ? '#38BDF8' : color}
          strokeOpacity={item.id === 'ground' ? 0.25 : glass ? 0.4 : 0.75}
          strokeWidth={0.04}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

/**
 * Static isometric drawing of the sculpture. Shown while the WebGL scene loads and as the
 * complete fallback when WebGL is unavailable. Decorative: the DOM interface carries the meaning.
 */
export function SystemPoster({ selected, related, showLabels }: SystemPosterProps) {
  const poster = buildPoster();
  const weight = (id: ComponentId | 'ground') => (id === 'ground' || !selected ? 1 : id === selected ? 1 : related.has(id) ? 0.55 : 0.16);

  return (
    <svg className="system-poster" viewBox={poster.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {poster.items.map((item) => (
        <g key={item.key} data-id={item.id} opacity={weight(item.id)}>
          <Item item={item} />
        </g>
      ))}
      {poster.routes.map((route) => (
        <polyline
          key={route.id}
          points={route.points}
          fill="none"
          stroke={route.color}
          strokeWidth={0.09}
          strokeLinejoin="round"
          strokeDasharray="0.28 0.22"
          strokeOpacity={selected ? 0.35 : 0.85}
        />
      ))}
      {showLabels &&
        poster.labels.map((label) => (
          <text
            key={label.id}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            className="system-poster-label"
            opacity={weight(label.id)}
          >
            {label.id.toUpperCase()}
          </text>
        ))}
    </svg>
  );
}
