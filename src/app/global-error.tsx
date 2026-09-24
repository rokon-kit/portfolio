'use client';

import './globals.css';

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/** Last-resort boundary used only if the root layout itself fails; renders its own <html>. */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="state-screen">
          <div className="state-plate" role="alert">
            <p className="state-code">{'// CRITICAL ERROR'}</p>
            <h1 className="state-title">The site could not be displayed.</h1>
            <p className="state-text">Please reload the page. If the problem continues, try again shortly.</p>
            <div className="state-actions">
              <button type="button" className="btn-primary" onClick={reset}>
                <span>RELOAD</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
