import { ArrowHead, FigureSvg, FigureText, STROKE } from './primitives';

/**
 * Client -> Spring Boot (Spring Security + JWT RBAC; events, teams, impact) -> PostgreSQL.
 * Every label comes from docs/CONTENT.md §3.1; no protocols, versions or metrics beyond that.
 */
export function VolunteeringFigure({ description }: { readonly description: string }) {
  return (
    <FigureSvg description={description}>
      {[40, 140, 240].map((y) => (
        <line key={y} x1="16" y1={y} x2="444" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
      ))}

      {/* Client */}
      <rect x="16" y="72" width="104" height="64" rx="4" fill="var(--color-surface)" stroke={STROKE.cyan} strokeWidth="1.5" />
      <FigureText x={68} y={99} size={11} tone="primary" bold anchor="middle">CLIENT</FigureText>
      <FigureText x={68} y={118} size={10.5} family="sans" anchor="middle">React</FigureText>

      <path d="M120 104H170" stroke={STROKE.cyan} strokeWidth="1.5" strokeDasharray="4 3" />
      <ArrowHead x={176} y={104} color={STROKE.cyan} />
      <FigureText x={148} y={94} size={10} tone="dim" anchor="middle">JWT</FigureText>

      {/* Backend */}
      <rect x="176" y="52" width="132" height="104" rx="4" fill="var(--color-surface)" stroke={STROKE.blue} strokeWidth="1.5" />
      <FigureText x={242} y={78} size={11} tone="primary" bold anchor="middle">SPRING BOOT</FigureText>
      <FigureText x={242} y={97} size={10} tone="cyan" anchor="middle">Security · RBAC</FigureText>
      <FigureText x={242} y={118} size={10.5} family="sans" anchor="middle">Event discovery</FigureText>
      <FigureText x={242} y={135} size={10.5} family="sans" anchor="middle">Teams · Impact</FigureText>

      <path d="M308 104H350" stroke={STROKE.blue} strokeWidth="1.5" strokeDasharray="4 3" />
      <ArrowHead x={356} y={104} color={STROKE.blue} />
      <FigureText x={330} y={94} size={10} tone="dim" anchor="middle">SQL</FigureText>

      {/* Database */}
      <rect x="356" y="72" width="88" height="64" rx="4" fill="var(--color-surface)" stroke={STROKE.amber} strokeWidth="1.5" />
      <FigureText x={400} y={99} size={11} tone="primary" bold anchor="middle">DATABASE</FigureText>
      <FigureText x={400} y={118} size={10.5} tone="amber" anchor="middle">PostgreSQL</FigureText>

      {/* Notes */}
      <rect x="16" y="176" width="428" height="86" rx="4" fill="var(--color-canvas)" stroke={STROKE.hairline} />
      <FigureText x={30} y={198} size={10.5} tone="cyan" bold>{'// FEATURES (FROM THE PROJECT BRIEF)'}</FigureText>
      <FigureText x={30} y={219} size={10}>Event discovery · Volunteer team formation · Impact tracking</FigureText>
      <FigureText x={30} y={237} size={10} tone="dim">Volunteer sign-ups modelled relationally in PostgreSQL</FigureText>
      <FigureText x={30} y={252} size={10} tone="dim">for transactional consistency.</FigureText>
    </FigureSvg>
  );
}
