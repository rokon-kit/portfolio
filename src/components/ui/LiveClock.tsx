'use client';

import { useSyncExternalStore } from 'react';

interface LiveClockProps {
  /** IANA time zone, e.g. "Asia/Dhaka". */
  readonly timeZone: string;
  /** Short zone label appended to the time, e.g. "UTC+6". */
  readonly label: string;
}

const subscribe = (onTick: () => void) => {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
};

/**
 * Real, ticking local time (restores the approved prototype's telemetry timestamp, with
 * true data). Renders empty on the server and first paint, then fills in on the client,
 * so there is never a hydration mismatch. Decorative: hidden from assistive technology so
 * it is not announced every second.
 */
export function LiveClock({ timeZone, label }: LiveClockProps) {
  const formatter = getFormatter(timeZone);
  const time = useSyncExternalStore(
    subscribe,
    () => formatter.format(new Date()).replace(', ', ' '),
    () => '',
  );

  return (
    <span className="live-clock" aria-hidden="true">
      {time ? `${time} ${label}` : ''}
    </span>
  );
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}
