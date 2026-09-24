import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'repo'
  | 'subrepo'
  | 'case'
  | 'resume';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  repo: 'btn-dossier-repo',
  subrepo: 'btn-dossier-subrepo',
  case: 'btn-dossier-case',
  resume: 'btn-resume-download',
};

interface ButtonLinkProps {
  readonly href: string;
  readonly variant: ButtonVariant;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ariaLabel?: string;
}

/**
 * Link styled as a button. Internal paths use next/link; http(s) links open in a
 * new tab with `noopener noreferrer` and announce that to assistive technology.
 */
export function ButtonLink({ href, variant, children, className, ariaLabel }: ButtonLinkProps) {
  const classes = cn(variantClass[variant], className);

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  const opensNewTab = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={classes}
      aria-label={ariaLabel}
      {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {opensNewTab && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
