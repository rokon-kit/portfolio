'use client';

import { useEffect } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/** Route-level error boundary: keeps the header and footer, replaces only the page content. */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="state-screen">
      <div className="state-plate" role="alert">
        <CornerFrame />
        <p className="state-code">{'// SOMETHING WENT WRONG'}</p>
        <h1 className="state-title">This section failed to load.</h1>
        <p className="state-text">
          An unexpected error interrupted the page. You can try again, or return to the overview.
        </p>
        <div className="state-actions">
          <button type="button" className="btn-primary" onClick={reset}>
            <span>TRY AGAIN</span>
          </button>
          <ButtonLink href="/" variant="secondary">
            <span>BACK TO OVERVIEW</span>
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
