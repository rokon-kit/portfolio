/**
 * Tiny external store for the sculpture's interaction state.
 *
 * The 3D scene reads it imperatively inside its frame loop (no React re-render), while the DOM
 * interface subscribes with `useSyncExternalStore`. Pure and framework-free so it is unit-tested.
 */
import type { ComponentId, SystemMode, SystemView } from '@/types/system';

export interface SystemState {
  readonly mode: SystemMode;
  readonly selected: ComponentId | null;
  readonly hovered: ComponentId | null;
  /** Incremented by every `reset()`, even when nothing else changed (clears manual orbit). */
  readonly epoch: number;
}

export interface SystemStore {
  getState(): SystemState;
  subscribe(listener: () => void): () => void;
  /** Selecting the already-selected component clears the selection. */
  select(id: ComponentId | null): void;
  hover(id: ComponentId | null): void;
  setMode(mode: SystemMode): void;
  toggleArchitecture(): void;
  /** Return to the original composition. */
  reset(): void;
}

export const INITIAL_STATE: SystemState = { mode: 'overview', selected: null, hovered: null, epoch: 0 };

export function viewOf(state: Pick<SystemState, 'mode' | 'selected'>): SystemView {
  if (state.mode === 'architecture') return state.selected ? 'architecture-selected' : 'architecture';
  return state.selected ? 'selected' : 'overview';
}

export function createSystemStore(initial: SystemState = INITIAL_STATE): SystemStore {
  let state = initial;
  const listeners = new Set<() => void>();

  const set = (next: SystemState) => {
    if (next.mode === state.mode && next.selected === state.selected && next.hovered === state.hovered && next.epoch === state.epoch) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    select: (id) => set({ ...state, selected: id === state.selected ? null : id }),
    hover: (id) => set({ ...state, hovered: id }),
    setMode: (mode) => set({ ...state, mode }),
    toggleArchitecture: () => set({ ...state, mode: state.mode === 'architecture' ? 'overview' : 'architecture' }),
    reset: () => set({ ...INITIAL_STATE, epoch: state.epoch + 1 }),
  };
}
