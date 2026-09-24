interface MonogramProps {
  readonly size?: number;
  readonly className?: string;
}

/**
 * Compact "Architectural R" monogram for small sizes (nav, footer).
 * The full-detail plate lives in public/monogram.svg; the favicon in public/favicon.svg.
 */
export function Monogram({ size = 34, className }: MonogramProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" fill="#0B0E14" stroke="#38BDF8" strokeOpacity="0.4" />
      <path d="M10 9V23" stroke="#F1F5F9" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M10 9H17C19.8 9 21.5 10.8 21.5 13.5C21.5 16.2 19.8 18 17 18H10"
        stroke="#F1F5F9"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M15.5 18L21.5 23" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="17" cy="13.5" r="1.2" fill="#38BDF8" />
    </svg>
  );
}
