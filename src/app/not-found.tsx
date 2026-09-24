import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { CornerFrame } from '@/components/ui/CornerFrame';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="state-screen">
      <div className="state-plate">
        <CornerFrame />
        <p className="state-code">{'// ERROR 404 — NOT FOUND'}</p>
        <h1 className="state-title">This page is not on the blueprint.</h1>
        <p className="state-text">
          The address may be mistyped, or the page may have moved. Head back to the overview or jump
          straight to the selected work.
        </p>
        <div className="state-actions">
          <ButtonLink href="/" variant="primary">
            <span>BACK TO OVERVIEW</span>
          </ButtonLink>
          <ButtonLink href="/#selected-works" variant="secondary">
            <span>SELECTED WORKS</span>
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
