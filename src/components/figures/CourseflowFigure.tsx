import { ArrowHead, FigureSvg, FigureText, STROKE } from './primitives';

interface Step {
  readonly x: number;
  readonly title: string;
  readonly lines: readonly string[];
}

/** The five-role approval workflow, from docs/CONTENT.md §3.2. */
const STEPS: readonly Step[] = [
  { x: 12, title: '1. CHAIRMAN', lines: ['assigns', 'coordinators'] },
  { x: 126, title: '2. COORDINATOR', lines: ['assigns', 'course teachers'] },
  { x: 240, title: '3. TEACHER', lines: ['manages', 'attendance'] },
  { x: 354, title: '4. STUDENT', lines: ['submits', 'anonymous', 'course feedback'] },
];

export function CourseflowFigure({ description }: { readonly description: string }) {
  return (
    <FigureSvg description={description}>
      {STEPS.map((step, index) => (
        <g key={step.title}>
          <rect x={step.x} y="20" width="94" height="80" rx="4" fill="var(--color-surface)" stroke={STROKE.cyan} strokeWidth="1.2" />
          <FigureText x={step.x + 47} y={42} size={9.5} tone="primary" bold anchor="middle">{step.title}</FigureText>
          {step.lines.map((line, lineIndex) => (
            <FigureText key={line} x={step.x + 47} y={60 + lineIndex * 13} size={9.5} family="sans" tone="cyan" anchor="middle">
              {line}
            </FigureText>
          ))}
          {index < STEPS.length - 1 && (
            <>
              <line x1={step.x + 94} y1="60" x2={step.x + 114} y2="60" stroke={STROKE.cyan} strokeWidth="1.2" />
              <ArrowHead x={step.x + 120} y={60} color={STROKE.cyan} />
            </>
          )}
        </g>
      ))}

      {/* Teacher and student outputs feed the provost's verification. */}
      <path d="M287 100V118H230V136" stroke={STROKE.green} strokeDasharray="3 3" />
      <path d="M401 100V118H230" stroke={STROKE.green} strokeDasharray="3 3" />

      <rect x="110" y="136" width="240" height="62" rx="4" fill="var(--color-surface-elevated)" stroke={STROKE.green} strokeWidth="1.5" />
      <FigureText x={230} y={158} size={11} tone="primary" bold anchor="middle">5. PROVOST</FigureText>
      <FigureText x={230} y={176} size={10} tone="green" anchor="middle">verifies eligibility,</FigureText>
      <FigureText x={230} y={190} size={10} tone="green" anchor="middle">issues digital exam clearance</FigureText>

      <rect x="12" y="214" width="436" height="54" rx="4" fill="var(--color-canvas)" stroke={STROKE.hairline} />
      <FigureText x={26} y={236} size={10.5} tone="cyan" bold>{'// TYPE-SAFE DOMAIN MODELS'}</FigureText>
      <FigureText x={26} y={254} size={10}>TypeScript models the approval states across the workflow.</FigureText>
    </FigureSvg>
  );
}
