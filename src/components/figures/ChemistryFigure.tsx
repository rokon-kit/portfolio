import { FigureSvg, FigureText, STROKE } from './primitives';

/**
 * Illustrative example of the matrix-balancing method (docs/CONTENT.md §3.3).
 * The chemistry is correct: Fe + O2 -> Fe2O3 balances as 4 Fe + 3 O2 -> 2 Fe2O3
 * (a = 4, b = 3, c = 2 satisfies a - 2c = 0 and 2b - 3c = 0). It is an
 * illustration of the approach, not output captured from the application.
 */
export function ChemistryFigure({ description }: { readonly description: string }) {
  return (
    <FigureSvg description={description}>
      <path d="M50 30H30V250H50" stroke={STROKE.cyan} strokeWidth="2" />
      <path d="M410 30H430V250H410" stroke={STROKE.cyan} strokeWidth="2" />

      <FigureText x={230} y={44} size={10} tone="dim" anchor="middle">ILLUSTRATIVE EXAMPLE</FigureText>
      <FigureText x={230} y={72} size={13} tone="primary" bold anchor="middle">Fe + O₂ → Fe₂O₃</FigureText>

      <FigureText x={70} y={104} size={10} tone="dim">a Fe + b O₂ → c Fe₂O₃ — one equation per element:</FigureText>
      <FigureText x={70} y={128} size={11} tone="cyan">[ Fe:  1a + 0b − 2c = 0 ]</FigureText>
      <FigureText x={70} y={150} size={11} tone="cyan">[  O:  0a + 2b − 3c = 0 ]</FigureText>

      <rect x="70" y="172" width="320" height="70" rx="4" fill="var(--color-canvas)" stroke={STROKE.amber} strokeWidth="1.2" />
      <FigureText x={90} y={196} size={10.5} tone="amber" bold>LINEAR-SYSTEM SOLVER</FigureText>
      <FigureText x={90} y={222} size={13} tone="primary" bold>4 Fe + 3 O₂ → 2 Fe₂O₃</FigureText>
    </FigureSvg>
  );
}
