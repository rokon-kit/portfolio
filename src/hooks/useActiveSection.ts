'use client';

import { useEffect, useState } from 'react';

/**
 * Scroll-spy: returns the id of the section currently under a reading line at
 * 35% of the viewport height, or the last section once the page bottom is reached.
 * Passive, rAF-throttled, and inert when `enabled` is false (e.g. off the home page).
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;

    const compute = () => {
      frame = 0;
      const readingLine = window.innerHeight * 0.35;
      let current = sections[0]?.id ?? null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= readingLine) current = section.id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections[sections.length - 1]?.id ?? current;
      setActive((previous) => (previous === current ? previous : current));
    };

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(compute);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids, enabled]);

  return enabled ? active : null;
}
