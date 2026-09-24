'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveSection } from '@/hooks/useActiveSection';
import type { NavItem } from '@/types/content';

interface HeaderNavProps {
  readonly items: readonly NavItem[];
  readonly availability: {
    readonly open: boolean;
    readonly label: string;
    readonly description: string;
  };
  readonly email: string;
  readonly locationLabel: string;
}

const DESKTOP_QUERY = '(min-width: 1100px)';
const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Desktop navigation, availability badge, and the mobile drawer.
 *
 * The drawer is a modal dialog: it is `inert` while closed, traps Tab while open,
 * closes on Escape (returning focus to the toggle), locks page scroll, and closes
 * itself when the viewport grows into the desktop layout.
 */
export function HeaderNav({ items, availability, email, locationLabel }: HeaderNavProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const active = useActiveSection(ids, isHome);

  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Scroll lock and initial focus while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Escape to close, Tab / Shift+Tab trapped inside the drawer.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestoreFocus();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeAndRestoreFocus]);

  // Close when the layout switches to the desktop navigation.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const currentFor = (id: string) => (active === id ? ({ 'aria-current': 'location' } as const) : {});

  return (
    <>
      <nav className="desktop-nav" aria-label="Main navigation">
        {items.map((item) => (
          <Link key={item.id} href={`/#${item.id}`} className="nav-item" {...currentFor(item.id)}>
            <span className="nav-num">{item.index}</span> {item.label}
          </Link>
        ))}
      </nav>

      {availability.open && (
        <div className="status-indicator" title={availability.description}>
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">{availability.label}</span>
          <span className="sr-only">{availability.description}</span>
        </div>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="mobile-toggle"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="toggle-bar" aria-hidden="true" />
        <span className="toggle-bar" aria-hidden="true" />
      </button>

      <div className="drawer-scrim" data-open={open} onClick={closeAndRestoreFocus} aria-hidden="true" />
      <div
        id="site-drawer"
        ref={drawerRef}
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        data-open={open}
        inert={!open}
      >
        <div className="drawer-header">
          <span className="drawer-label">{'// NAVIGATION DOCK'}</span>
          <button ref={closeRef} type="button" className="drawer-close" onClick={closeAndRestoreFocus}>
            CLOSE [X]
          </button>
        </div>
        <nav className="drawer-links" aria-label="Mobile navigation">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/#${item.id}`}
              className="drawer-item"
              onClick={() => setOpen(false)}
              {...currentFor(item.id)}
            >
              <span className="nav-num">{item.index}</span> {item.drawerLabel}
            </Link>
          ))}
        </nav>
        <div className="drawer-footer">
          {availability.open && (
            <p className="drawer-availability">
              <span className="status-dot" aria-hidden="true" />
              <span>{availability.label}</span>
            </p>
          )}
          <p>{locationLabel}</p>
          <a href={`mailto:${email}`} className="drawer-email">
            {email}
          </a>
        </div>
      </div>
    </>
  );
}
