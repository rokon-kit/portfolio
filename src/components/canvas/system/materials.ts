/** Per-module materials and the emphasis (dim / highlight) mapping. */
import { Color, DoubleSide, LineBasicMaterial, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import type { ComponentId } from '@/types/system';
import { COMPONENT_COLOR, EDGE_COLOR } from './layout.ts';

export interface ModuleMaterials {
  readonly body: MeshStandardMaterial;
  readonly glass: MeshStandardMaterial;
  readonly accent: MeshBasicMaterial;
  readonly edges: LineBasicMaterial;
  readonly base: { readonly accent: Color; readonly edge: Color };
}

const BODY_LIT = new Color('#1D222D');
const BODY_DIM = new Color('#080A0F');

export function createModuleMaterials(id: ComponentId): ModuleMaterials {
  const accent = new Color(COMPONENT_COLOR[id]);
  const edge = new Color(EDGE_COLOR[id]);
  return {
    body: new MeshStandardMaterial({
      color: BODY_LIT.clone(),
      vertexColors: true,
      roughness: 0.42,
      metalness: 0.2,
      emissive: accent.clone(),
      emissiveIntensity: 0.012,
    }),
    glass: new MeshStandardMaterial({
      color: accent.clone().multiplyScalar(0.35),
      transparent: true,
      opacity: 0.16,
      roughness: 0.15,
      metalness: 0.2,
      side: DoubleSide,
      // Draw double-sided glass in one pass (three otherwise issues two draw calls per mesh).
      forceSinglePass: true,
      depthWrite: false,
      emissive: accent.clone(),
      emissiveIntensity: 0.28,
    }),
    accent: new MeshBasicMaterial({ color: accent.clone(), toneMapped: false }),
    edges: new LineBasicMaterial({ color: edge.clone(), transparent: true, opacity: 0.9, toneMapped: false }),
    base: { accent, edge },
  };
}

/**
 * Applies emphasis. `weight` 1 = fully present, → 0 = receded; `glow` 0…1 = highlighted
 * (hover / selection). Mutates in place — no allocations per frame.
 */
export function applyEmphasis(m: ModuleMaterials, weight: number, glow: number): void {
  m.body.color.copy(BODY_DIM).lerp(BODY_LIT, weight);
  // Body emissive is only a hint of the module's colour; the glow lives in edges, accents and glass.
  m.body.emissiveIntensity = 0.004 + 0.008 * weight + 0.09 * glow;
  m.accent.color.copy(m.base.accent).multiplyScalar(0.16 + 0.84 * weight + 0.55 * glow);
  m.edges.color.copy(m.base.edge).multiplyScalar(0.22 + 0.78 * weight + 0.3 * glow);
  m.edges.opacity = Math.min(1, 0.16 + 0.7 * weight + 0.14 * glow);
  m.glass.opacity = 0.04 + 0.11 * weight + 0.14 * glow;
  m.glass.emissiveIntensity = 0.1 + 0.2 * weight + 0.5 * glow;
}

export function disposeModuleMaterials(m: ModuleMaterials): void {
  m.body.dispose();
  m.glass.dispose();
  m.accent.dispose();
  m.edges.dispose();
}
