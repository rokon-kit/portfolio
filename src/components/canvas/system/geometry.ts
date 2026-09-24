/**
 * Turns the data-only module descriptions into merged three.js geometry.
 *
 * Each module becomes at most four draw calls (body, glass, accent, outline edges) no matter how
 * many primitives it contains — this is what keeps the whole sculpture under the draw-call budget.
 */
import { BoxGeometry, BufferGeometry, CylinderGeometry, EdgesGeometry, Float32BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ComponentId } from '@/types/system';
import { modulePrimitives, type Detail, type Primitive, type PrimitiveLayer } from './modules.ts';

export interface ModuleGeometry {
  readonly body: BufferGeometry | null;
  readonly glass: BufferGeometry | null;
  readonly accent: BufferGeometry | null;
  /** Line-segment geometry for crisp outlines. */
  readonly edges: BufferGeometry | null;
}

const EDGE_ANGLE_DEG = 25;

function primitiveGeometry(p: Primitive, segments: number): BufferGeometry {
  const geometry =
    p.kind === 'box'
      ? new BoxGeometry(p.size[0], p.size[1], p.size[2])
      : new CylinderGeometry(p.radius, p.radius, p.height, segments, 1, false);
  if (p.kind === 'box') {
    if (p.rotX) geometry.rotateX(p.rotX);
    if (p.rotY) geometry.rotateY(p.rotY);
  }
  geometry.translate(p.pos[0], p.pos[1], p.pos[2]);
  return geometry;
}

function wantsEdges(p: Primitive): boolean {
  if (p.edges !== undefined) return p.edges;
  return p.layer !== 'accent';
}

function merge(parts: BufferGeometry[]): BufferGeometry | null {
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}

export function buildModuleGeometry(id: ComponentId, detail: Detail, discSegments: number): ModuleGeometry {
  const buckets: Record<PrimitiveLayer, BufferGeometry[]> = { body: [], glass: [], accent: [] };
  const edgeParts: BufferGeometry[] = [];

  for (const primitive of modulePrimitives(id, detail)) {
    const geometry = primitiveGeometry(primitive, discSegments);
    if (wantsEdges(primitive)) edgeParts.push(new EdgesGeometry(geometry, EDGE_ANGLE_DEG));
    buckets[primitive.layer].push(geometry);
  }

  return {
    body: withHeightGradient(merge(buckets.body)),
    glass: merge(buckets.glass),
    accent: merge(buckets.accent),
    edges: merge(edgeParts),
  };
}

/**
 * Bakes a soft dark-to-light gradient (bottom to top) into vertex colours. Gives the obsidian
 * forms depth and grounding without any extra lights, textures or draw calls.
 */
function withHeightGradient(geometry: BufferGeometry | null): BufferGeometry | null {
  if (!geometry) return null;
  const position = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  const span = Math.max(box.max.y - box.min.y, 0.001);
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const t = (position.getY(i) - box.min.y) / span;
    const shade = 0.4 + 0.6 * Math.pow(t, 0.75);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function disposeModuleGeometry(geometry: ModuleGeometry): void {
  geometry.body?.dispose();
  geometry.glass?.dispose();
  geometry.accent?.dispose();
  geometry.edges?.dispose();
}
