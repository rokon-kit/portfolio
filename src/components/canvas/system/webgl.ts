/** Feature detection for WebGL. Cheap, cached, SSR-safe. */
let cached: boolean | null = null;

export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    cached = Boolean(context);
    // Release the probe context immediately so it does not count against the browser's limit.
    (context as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** Test/lab hook: forget the cached result. */
export function resetWebGLDetection() {
  cached = null;
}
