import type { ReactNode } from 'react';
import type { RichText as RichTextContent } from '@/types/content';
import { RichText } from './RichText';

interface SectionHeaderProps {
  readonly index: string;
  readonly label: string;
  readonly headingId: string;
  readonly headline: RichTextContent;
  readonly children?: ReactNode;
}

/** Numbered section badge + serif headline + intro paragraph. */
export function SectionHeader({ index, label, headingId, headline, children }: SectionHeaderProps) {
  return (
    <div className="section-header-block">
      <p className="section-index-badge">
        <span className="index-num">{index}</span>
        <span className="index-title">{label}</span>
      </p>
      <h2 className="section-headline" id={headingId}>
        <RichText content={headline} />
      </h2>
      {children && <p className="section-intro">{children}</p>}
    </div>
  );
}
