/** Four drafting-crosshair corners. The parent must be `position: relative`. */
export function CornerFrame() {
  return (
    <>
      <span className="corner-crosshair top-left" aria-hidden="true" />
      <span className="corner-crosshair top-right" aria-hidden="true" />
      <span className="corner-crosshair bottom-left" aria-hidden="true" />
      <span className="corner-crosshair bottom-right" aria-hidden="true" />
    </>
  );
}
