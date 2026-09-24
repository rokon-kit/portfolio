/** Joins truthy class names. Deliberately tiny — avoids a dependency for one helper. */
export function cn(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
