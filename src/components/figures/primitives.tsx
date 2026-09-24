import type { ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'dim' | 'cyan' | 'amber' | 'green';
type Family = 'mono' | 'sans';

interface FigureTextProps {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly children: ReactNode;
  readonly family?: Family;
  readonly tone?: Tone;
  readonly bold?: boolean;
  readonly anchor?: 'start' | 'middle' | 'end';
}

/** SVG text using the design-system fonts and colour tokens (styled in works.css). */
export function FigureText({
  x,
  y,
  size,
  children,
  family = 'mono',
  tone = 'secondary',
  bold = false,
  anchor = 'start',
}: FigureTextProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      className={`fig-${family} fig-${tone}${bold ? ' fig-bold' : ''}`}
    >
      {children}
    </text>
  );
}

interface FigureSvgProps {
  readonly description: string;
  readonly children: ReactNode;
}

/** Shared <svg> wrapper: fixed native size, accessible name, no decorative role leakage. */
export function FigureSvg({ description, children }: FigureSvgProps) {
  return (
    <svg
      viewBox="0 0 460 280"
      fill="none"
      className="schematic-svg"
      role="img"
      aria-label={description}
    >
      {children}
    </svg>
  );
}

export const STROKE = {
  cyan: 'var(--color-accent-cyan)',
  blue: 'var(--color-accent-blue)',
  amber: 'var(--color-accent-amber)',
  green: 'var(--color-accent-green)',
  hairline: 'var(--color-border-subtle)',
} as const;

/** Small right-pointing arrowhead whose tip is at (x, y). */
export function ArrowHead({ x, y, color }: { readonly x: number; readonly y: number; readonly color: string }) {
  return <polygon points={`${x - 6},${y - 3} ${x},${y} ${x - 6},${y + 3}`} fill={color} />;
}
