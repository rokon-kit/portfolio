/** First focusable element on every page; jumps past the header to the main landmark. */
export function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      Skip to main content
    </a>
  );
}
