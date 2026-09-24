/**
 * Domain types for all portfolio content.
 *
 * Content lives in `src/content/*` and is validated by these types; presentation
 * components in `src/components/*` only consume them. Every factual claim in the
 * content layer must be traceable to `docs/CONTENT.md`.
 */

export type Tone = 'cyan' | 'amber' | 'green';

/** Inline emphasis used inside headlines and summaries. */
export type RichSegment =
  | string
  | { readonly text: string; readonly tone: 'italic' | 'highlight' | 'strong' };

export type RichText = readonly RichSegment[];

export interface NavItem {
  /** DOM id of the target section on the home page. */
  readonly id: string;
  /** Two-digit index shown in the navigation ("01"). */
  readonly index: string;
  readonly label: string;
  /** Longer label used in the mobile drawer. */
  readonly drawerLabel: string;
}

export interface Location {
  readonly city: string;
  readonly country: string;
  readonly timezone: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface Profile {
  readonly name: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly location: Location;
  readonly eyebrow: string;
  readonly headline: RichText;
  readonly summary: RichText;
  readonly ethos: {
    readonly quote: string;
    readonly focus: string;
  };
  readonly ribbon: {
    readonly tag: string;
    readonly note: string;
  };
  readonly availability: {
    readonly open: boolean;
    readonly label: string;
    readonly description: string;
  };
}

export interface Metric {
  readonly value: string;
  readonly label: string;
}

export interface ContactChannel {
  readonly id: 'email' | 'linkedin' | 'github' | 'phone';
  readonly icon: string;
  readonly title: string;
  readonly value: string;
  readonly href: string;
  /** Opens in a new tab (external profiles). */
  readonly external: boolean;
}

export interface ContactDetails {
  readonly email: string;
  readonly channels: readonly ContactChannel[];
  readonly resume: {
    readonly title: string;
    readonly description: string;
    readonly href: string;
  };
}

export interface InquiryOption {
  readonly value: string;
  readonly label: string;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type FigureId = 'volunteering' | 'courseflow' | 'chemistry';

export interface RepoLink {
  readonly label: string;
  readonly href: string;
  readonly kind: 'primary' | 'secondary';
}

export interface ProjectFact {
  readonly key: string;
  readonly value: string;
}

export interface ProjectFigure {
  readonly id: FigureId;
  /** Plate tag, e.g. "FIGURE 01.A". */
  readonly tag: string;
  readonly title: string;
  /** Two short plate-footer readouts. */
  readonly footer: readonly [string, string];
  /** Accessible text alternative describing the diagram. */
  readonly description: string;
}

export interface Project {
  readonly slug: string;
  /** e.g. "SYSTEM 01 // CIVIC TECH". */
  readonly systemCode: string;
  readonly title: string;
  /** Compact name for chips and breadcrumbs. */
  readonly shortTitle: string;
  readonly role: string;
  readonly roleTone: Tone;
  readonly stack: readonly string[];
  /** Problem space, from docs/CONTENT.md. */
  readonly challenge: string;
  /** One-paragraph engineering summary shown on the dossier card. */
  readonly approachSummary: string;
  /** Full engineering-solution bullets shown on the case-study page. */
  readonly approach: readonly string[];
  readonly humanDimension: string;
  /** Exactly three key/value readouts for the dossier card. */
  readonly facts: readonly [ProjectFact, ProjectFact, ProjectFact];
  readonly repos: readonly RepoLink[];
  readonly figure: ProjectFigure;
  /** Meta description for the case-study page. */
  readonly summary: string;
}

/* ------------------------------------------------------------------ */
/* Background                                                          */
/* ------------------------------------------------------------------ */

export interface Experience {
  readonly organization: string;
  readonly role: string;
  readonly period: string;
  readonly duration: string;
  readonly location: string;
  readonly focus: string;
  readonly contributions: readonly string[];
}

export interface Education {
  readonly institution: string;
  readonly degree: string;
  readonly cgpa: string;
  readonly period: string;
  readonly certifications: readonly {
    readonly title: string;
    readonly issuer: string;
    readonly period: string;
  }[];
}

/* ------------------------------------------------------------------ */
/* Architecture layers                                                 */
/* ------------------------------------------------------------------ */

export type LayerId = 'client' | 'api' | 'security' | 'storage';
export type LayerViewId = 'dataflow' | 'security' | 'persistence';

export interface LayerReadout {
  readonly name: string;
  readonly value: string;
  readonly tone?: 'cyan' | 'green';
}

export interface Layer {
  readonly id: LayerId;
  readonly view: LayerViewId;
  readonly title: string;
  readonly blurb: string;
  /** Short name used in the inspector header. */
  readonly shortName: string;
  readonly readouts: readonly LayerReadout[];
  /** Slugs of projects (see `projects`) that use this layer. */
  readonly usedIn: readonly string[];
}

export interface LayerView {
  readonly id: LayerViewId;
  readonly label: string;
  readonly defaultLayer: LayerId;
}
