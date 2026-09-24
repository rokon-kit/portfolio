/** Rendering tiers. Pure so the decision logic can be unit-tested. */
export type Quality = 'high' | 'low';
export type QualityPreference = 'auto' | Quality;

export interface QualityConfig {
  readonly detail: Quality;
  readonly discSegments: number;
  /** Fraction of the pulse budget that is drawn. */
  readonly pulseScale: number;
  /** Additive glow halos behind pulses (one extra draw call). */
  readonly glow: boolean;
  readonly maxDpr: number;
  readonly fpsCap: number;
  /** Hover raycasting; skipped on touch tiers. */
  readonly hover: boolean;
  /** Expand hit volumes for finger-sized taps. */
  readonly hitPadding: number;
}

export const QUALITY: Record<Quality, QualityConfig> = {
  high: { detail: 'high', discSegments: 56, pulseScale: 1, glow: true, maxDpr: 2, fpsCap: 60, hover: true, hitPadding: 1 },
  low: { detail: 'low', discSegments: 28, pulseScale: 0.5, glow: false, maxDpr: 1, fpsCap: 30, hover: false, hitPadding: 1.2 },
};

export interface QualityInput {
  readonly preference: QualityPreference;
  readonly viewportWidth: number;
  readonly coarsePointer: boolean;
  readonly cores?: number | undefined;
  readonly memoryGb?: number | undefined;
}

/** Narrow viewports, touch-first devices and weak hardware get the simplified scene. */
export function pickQuality(input: QualityInput): Quality {
  if (input.preference !== 'auto') return input.preference;
  if (input.viewportWidth < 768 || input.coarsePointer) return 'low';
  if (input.cores !== undefined && input.cores <= 2) return 'low';
  if (input.memoryGb !== undefined && input.memoryGb <= 2) return 'low';
  return 'high';
}
