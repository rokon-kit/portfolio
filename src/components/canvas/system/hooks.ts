'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { SystemState, SystemStore } from './store.ts';
import { pickQuality, type Quality, type QualityPreference } from './quality.ts';

/** Subscribes a component to one primitive slice of the interaction store. */
export function useSystemSelector<T extends string | number | boolean | null>(
  store: SystemStore,
  selector: (state: SystemState) => T,
): T {
  const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export type MotionPreference = 'auto' | 'reduce' | 'full';

/** OS setting by default; the lab can override it to test both paths. */
export function useReducedMotion(preference: MotionPreference): boolean {
  const os = useMediaQuery('(prefers-reduced-motion: reduce)');
  return preference === 'auto' ? os : preference === 'reduce';
}

export function useQuality(preference: QualityPreference): Quality {
  const narrow = useMediaQuery('(max-width: 767px)');
  const coarse = useMediaQuery('(pointer: coarse)');
  const nav = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { deviceMemory?: number });
  return pickQuality({
    preference,
    viewportWidth: narrow ? 375 : 1280,
    coarsePointer: coarse,
    cores: nav?.hardwareConcurrency,
    memoryGb: nav?.deviceMemory,
  });
}

/** True while the element is on screen and the tab is visible — gates all rendering work. */
export function useRenderGate(ref: React.RefObject<HTMLElement | null>): boolean {
  const state = useRef({ inView: true, tabVisible: true });
  const listeners = useRef(new Set<() => void>());

  const subscribe = useCallback((onChange: () => void) => {
    listeners.current.add(onChange);
    return () => listeners.current.delete(onChange);
  }, []);

  useEffect(() => {
    const notify = () => listeners.current.forEach((fn) => fn());
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      state.current.inView = entry?.isIntersecting ?? true;
      notify();
    });
    if (el) observer.observe(el);
    const onVisibility = () => {
      state.current.tabVisible = document.visibilityState !== 'hidden';
      notify();
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref]);

  const getSnapshot = useCallback(() => state.current.inView && state.current.tabVisible, []);
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
