import { Fragment } from 'react';
import type { RichText as RichTextContent } from '@/types/content';

interface RichTextProps {
  readonly content: RichTextContent;
}

/** Renders content segments with the approved editorial emphasis styles. */
export function RichText({ content }: RichTextProps) {
  return (
    <>
      {content.map((segment, index) => {
        if (typeof segment === 'string') return <Fragment key={index}>{segment}</Fragment>;
        switch (segment.tone) {
          case 'italic':
            return (
              <em key={index} className="headline-italic">
                {segment.text}
              </em>
            );
          case 'highlight':
            return (
              <span key={index} className="headline-highlight">
                {segment.text}
              </span>
            );
          case 'strong':
            return <strong key={index}>{segment.text}</strong>;
        }
      })}
    </>
  );
}
