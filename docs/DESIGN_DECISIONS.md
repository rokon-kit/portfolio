# Architecture & Design Decision Records (ADRs)

This document tracks all significant architectural, technological, visual, and interaction design decisions for Md. Rokonuzzaman's portfolio ("The Human Side of Engineering").

Each decision follows the lightweight ADR structure:
- **ID & Title**
- **Date & Author**
- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Context:** The context, problem statement, or constraint.
- **Decision:** What was decided and why.
- **Consequences:** Positive and negative impacts, trade-offs, and downstream effects.
- **Alternatives Considered:** What other options were evaluated and why they were rejected.

---

## ADR-001: Core Technology Stack Selection

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  The portfolio requires high-end editorial presentation, cinematic animations, interactive 3D elements, fast initial page loads, and excellent SEO capabilities.
- **Decision:**
  Adopt Next.js (App Router) with TypeScript, Tailwind CSS, GSAP (GreenSock Animation Platform) + ScrollTrigger, and Three.js with React Three Fiber (R3F) / `@react-three/drei`.
- **Consequences:**
  - *Positive:* Industry-standard tooling for modern creative web development. Server components enable fast initial content delivery while client components isolate heavy 3D canvases. Strong typing prevents runtime issues.
  - *Negative:* Requires careful hydration management between SSR and WebGL/Canvas contexts; bundle size must be managed with dynamic imports and lazy loading.
- **Alternatives Considered:**
  - *Vanilla Vite + React SPA:* Lacks built-in SSR/SSG and metadata management for optimal SEO.
  - *Astro:* Excellent for static content, but full-page seamless WebGL/canvas transitions and heavy React-based interactive canvas state are easier to coordinate natively in Next.js App Router.

---

## ADR-002: Creative Direction — "The Human Side of Engineering"

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  Most software engineer portfolios rely on identical tropes: dark purple/blue cyber glow backgrounds, floating 3D low-poly laptops or cubes, skill bars with arbitrary percentages, and template card grids. These fail to communicate senior engineering thinking, empathy, problem-solving, or distinct personality.
- **Decision:**
  Center the creative concept on *"The Human Side of Engineering"*:
  1. High-contrast, refined editorial typography and curated color palette (warm neutrals, deep obsidian/charcoal, rich accent tones).
  2. Grounded, meaningful 3D interactions that serve narrative purpose (e.g., tactile engineering systems, architectural structures, human-machine touchpoints) rather than decorative floating debris.
  3. Cinematic GSAP scroll choreographies that guide reader attention through case studies and narrative milestones.
  4. Genuine personal storytelling detailing the "why" and "how" behind engineering decisions, real user impacts, and team collaboration.
- **Consequences:**
  - *Positive:* Instantly differentiates Rokon from generic developer portfolios; positions him as a thoughtful, mature technical leader.
  - *Negative:* Demands higher design craft, custom assets, and tighter writing instead of dropping in pre-built UI components.
- **Alternatives Considered:**
  - *Cyberpunk / Terminal / Neon Hacker theme:* Overdone, immature, and distracting from professional credibility.
  - *Ultra-minimalist monochrome blog:* Fails to showcase high-level frontend engineering capabilities and visual interactive craft.

---

## ADR-003: Phased Milestone Development Strategy

- **Date:** 2026-09-24
- **Status:** Superseded by ADR-007 (the phased, approval-gated approach itself still applies; only the milestone list changed)
- **Context:**
  Building a complex creative engineering website with 3D and GSAP can easily lead to scope bloat, regressions, and unverified assumptions if attempted all at once.
- **Decision:**
  Execute the project strictly through approval-gated milestones:
  - Milestone 0: Governance, Project Architecture & Documentation (Current)
  - Milestone 1: Baseline Project Scaffolding & Design System Foundation
  - Milestone 2: Core Layout, Navigation & Editorial Typography System
  - Milestone 3: Hero Experience & Narrative Intro (including Three.js / WebGL baseline)
  - Milestone 4: Career Journey & Narrative Milestones ("The Human Side")
  - Milestone 5: Selected Works & Case Studies
  - Milestone 6: Interactive Engineering Playground / Deep-Dive Showcase
  - Milestone 7: Contact, Resume & Final Polish (A11y, Performance, Mobile, QA)
- **Consequences:**
  - *Positive:* High quality control, clear checkpoints, testable increments, and zero scope drift.
  - *Negative:* Requires discipline to complete verification and approval before moving forward.

---

## ADR-004: Visual Identity & Color System ("The Living Blueprint")

- **Date:** 2026-09-24
- **Status:** Accepted
- **Amended by:** ADR-010 (`--color-text-dim` value and corrected contrast figures)
- **Context:**
  The portfolio requires a distinctive visual system that reflects Rokon's Software Engineering background while adhering to WCAG 2.1 AA accessibility standards and avoiding developer clichés.
- **Decision:**
  Adopt "The Living Blueprint" color system:
  1. Base canvas: Architectural Slate (`#0B0E14`) providing deep, calm contrast.
  2. Structural hairlines and borders: Translucent Slate (`rgba(255, 255, 255, 0.08)` and active `rgba(56, 189, 248, 0.35)`).
  3. Typography: Drafting Paper White (`#F1F5F9`, 14.8:1 contrast) and Slate Ash (`#94A3B8`, 7.2:1 contrast).
  4. Precision accents: Blueprint Cyan (`#38BDF8`) for interactive focus and Tactical Amber (`#F59E0B`) for human storytelling callouts.
- **Consequences:**
  - *Positive:* Exceeds WCAG AAA contrast for body copy; feels architectural, disciplined, and bespoke.
  - *Negative:* Requires disciplined restraint to avoid overusing cyan accent lights.

---

## ADR-005: Architectural Monogram & Typography Hierarchy

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  A memorable personal brand needs a distinct monogram and an editorial typography pairing that bridges technical precision with literary warmth.
- **Decision:**
  1. Design a custom geometric monogram for Rokon: An architectural capital "R" fused with coordinate drafting crosshairs and structural code brackets.
  2. Pair editorial serif display headlines (`Newsreader` / `Playfair Display`) with an ultra-clean system body font (`Inter`) and a monospaced telemetry font (`JetBrains Mono`).
- **Consequences:**
  - *Positive:* Conveys senior technical maturity and human warmth; distinct from standard developer portfolios.
  - *Negative:* External font assets must be preloaded and optimized to avoid FOUT (Flash of Unstyled Text).

---

## ADR-006: Visual Prototype Architecture

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  Milestone 2 requires high-fidelity visual prototypes of the Hero, Selected Works, Engineering Visualization, and Contact sections to validate design decisions across desktop, tablet, and mobile before initializing the full application.
- **Decision:**
  Construct an isolated, high-fidelity interactive prototype in `prototype/` utilizing pure standards-based HTML5, modern CSS custom properties, and vanilla JS with art-directed SVG/Canvas placeholders. Validate locally using headless Chrome across viewports (1440px desktop, 768px tablet, 375px mobile).
- **Consequences:**
  - *Positive:* Fast iteration, zero dependency baggage during design validation, and directly inspectable in any browser.
  - *Negative:* Prototype code will be translated into Next.js App Router components in subsequent milestones.


---

## ADR-007: Milestone Roadmap Renumbering (M3–M10)

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  Three incompatible milestone lists existed: ADR-003, the roadmap in `docs/PROGRESS.md`, and the owner's handoff message. Work actually executed did not follow ADR-003.
- **Decision:**
  The owner's handoff numbering governs: M3 production foundation · M4 signature Three.js · M5 cinematic hero integration · M6 selected work & case studies · M7 professional & personal content · M8 complete GSAP motion · M9 comprehensive QA · M10 final refinement & production prep. ADR-003 is marked superseded; `PROGRESS.md` follows this list.
- **Consequences:**
  - *Positive:* One unambiguous plan; layout, navigation and tokens have an owner (M3), which the earlier lists left implicit.
  - *Negative:* Older references to "Milestone 4 = layout" etc. in historical commits no longer match.
- **Alternatives Considered:**
  - *Keep the PROGRESS.md list:* rejected — it predates the owner's explicit plan and merges GSAP and content work.

---

## ADR-008: Application Stack, Versions and Deferred Dependencies

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  ADR-001 chose Next.js App Router + TypeScript + Tailwind + GSAP + Three.js/R3F. Current registry versions were checked before installing: TypeScript is at 7.x (native compiler) and ESLint at 10.x.
- **Decision:**
  - Next.js **16.3** (App Router, Turbopack), React **19.3**, Tailwind CSS **4.3** (`@tailwindcss/postcss`), TypeScript **5.9** (`strict` + `noUncheckedIndexedAccess`), ESLint **9** with `eslint-config-next`.
  - TypeScript stays on 5.9 because Next drives TypeScript through its JavaScript API, which the TypeScript 7 native compiler does not provide. ESLint stays on 9 because `eslint-config-next` 16's bundled plugins (react, jsx-a11y, import) do not yet support ESLint 10.
  - **GSAP, Three.js and React Three Fiber are not installed in M3.** They are installed in the milestone that uses them (M4 for Three/R3F, M5/M8 for GSAP) so the M3 bundle contains only what ships.
  - `"type": "module"`; no `output: 'export'` yet, but no route handlers or middleware are used, so a static export remains possible (hosting undecided — see ADR-014).
  - `agentRules: false` in `next.config.ts`: Next 16.3's dev server otherwise appends a generated block to `AGENTS.md`, the project's governance file.
- **Consequences:**
  - *Positive:* Lean install (0 vulnerabilities); reproducible builds; governance file protected.
  - *Negative:* Two dependencies are held back from latest and must be revisited (tracked in `PROGRESS.md`).
- **Alternatives Considered:**
  - *Install the full stack now:* rejected — unused dependencies contradict "no unnecessary dependencies".
  - *TypeScript 7 / ESLint 10 now:* rejected — verified incompatibilities with Next's tooling.

---

## ADR-009: Styling Architecture — Tokens in Tailwind, Ported Component CSS in Layers

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  The approved prototype is ~1,800 lines of hand-written CSS with distinctive, carefully tuned component styling. Rewriting it as utility classes would risk visual drift; keeping it as one file would not be maintainable.
- **Decision:**
  Design tokens live in `src/styles/tokens.css` as `@theme static` (single source; also exposed as Tailwind utilities). The prototype's component CSS is ported, class names preserved, into per-concern files (`layout`, `ui`, `hero`, `works`, `background`, `topology`, `contact`, `states`) imported into the `components` cascade layer so Tailwind utilities can still override it. Tailwind is used for tokens and new layout; custom CSS carries the bespoke component look. Approved type-scale values follow the prototype CSS (`docs/DESIGN_SYSTEM.md` corrected). Breakpoints: 640 (status pill), 768, 1024 (single-column), 1100 (desktop nav), 1360 (header coordinates).
- **Consequences:**
  - *Positive:* Visual parity with the approved prototype (verified side-by-side at four widths); clear file ownership.
  - *Negative:* Two styling idioms coexist; discipline needed to keep new work token-based.
- **Alternatives Considered:**
  - *Utility-only rewrite:* rejected — high drift risk, no user benefit.
  - *CSS Modules per component:* deferred — would mean renaming ~150 approved classes for little gain now.

---

## ADR-010: Amendment to an Approved Token — `--color-text-dim`

- **Date:** 2026-09-24
- **Status:** Accepted (owner review requested)
- **Context:**
  The design system documents `--color-text-dim` `#64748B` as 4.6:1 (AA). Recomputed with the WCAG formula it is **4.06:1** on canvas, 3.80:1 on surface and 3.55:1 on elevated surfaces — it fails AA for the 12px metadata text it colours. WCAG 2.1 AA is a permanent project requirement (AGENTS.md rule 7). The documented 14.8:1 and 7.2:1 for primary/secondary text were also inaccurate (actual 17.63:1 and 7.53:1).
- **Decision:**
  Lighten `--color-text-dim` to **`#7C8BA1`** (5.58:1 canvas, 5.23:1 surface, 4.88:1 elevated). Hue and role are unchanged; only lightness moves. `docs/DESIGN_SYSTEM.md` is corrected. Reversible by editing one token.
- **Consequences:**
  - *Positive:* AA compliant everywhere; the change is visually subtle.
  - *Negative:* Deviates from an approved value; owner should confirm.
- **Alternatives Considered:**
  - *Keep `#64748B` and enlarge the text:* rejected — changes the approved typographic scale.

---

## ADR-011: Typed Content Layer, Claim Removal and an Integrity Guard

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  The prototype hard-coded copy that included figures and guarantees with no source (project counts, latency percentiles, "100% authentic data", "deployed", invented code shown as "verified", a false "R3F simulator" label, transport-security claims on a form that sent nothing). AGENTS.md rule 4 forbids fabricated content. `docs/CONTENT.md` also requires the Barcodetech internship to be prominent, which the prototype omitted.
- **Decision:**
  All copy lives in typed, presentation-free modules under `src/content/`, each fact traceable to `docs/CONTENT.md`. Unverifiable claims were removed or replaced with documented facts (e.g. hero tiles now show the internship length, CGPA, repository count and featured-system count). Illustrative diagrams are labelled illustrative. A **Background** section (experience + education) was added, and the nav renumbered 01–05. `scripts/check-content.mjs` (`npm run check:content`, part of `npm run verify`) fails the build chain if banned claim patterns re-enter `src/`; it was proven to fail on planted claims.
- **Consequences:**
  - *Positive:* Content is auditable and separable from presentation; regression of fabricated claims is caught automatically.
  - *Negative:* Copy is plainer where the prototype was vivid; the pattern list needs occasional maintenance.
- **Alternatives Considered:**
  - *Port the prototype copy verbatim:* rejected — violates rule 4.
  - *Manual review only:* rejected — does not scale across milestones.

---

## ADR-012: Hero Scene Is a Static SVG in M3

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  The prototype's "3D" hero was an animated Canvas-2D projection labelled as an R3F simulator. M3 must ship a site that works without WebGL, and must not build the final Three.js experience.
- **Decision:**
  The isometric geometry is ported into a pure TypeScript model (`scene-model.ts`) that pre-computes SVG polygons, rendered on the server with a working layer filter and callouts. The idle "float" is a CSS animation that stops under `prefers-reduced-motion`. The frame reserves its aspect ratio (no layout shift). In M4 the R3F scene replaces it and this SVG becomes the WebGL-unavailable fallback.
- **Consequences:**
  - *Positive:* Zero JavaScript required for the hero; LCP unaffected; a ready-made fallback.
  - *Negative:* No orbit/drag interaction until M4 (the prototype's drag was a 2D illusion).
- **Alternatives Considered:**
  - *Port the canvas loop:* rejected — perpetual rAF with no pause, misleading label, no fallback.

---

## ADR-013: Accessibility Patterns for Navigation and Interactive Widgets

- **Date:** 2026-09-24
- **Status:** Accepted
- **Context:**
  Audit of the prototype (docs/CLAUDE_HANDOFF.md §8.A) found div click targets, ARIA tab roles without tabs, an unlabelled and unreachable drawer, no skip link, no focus styles, and no reduced-motion support.
- **Decision:**
  - Mobile drawer: `role="dialog"` `aria-modal`, `inert` + `visibility:hidden` when closed, focus moves in, Tab/Shift+Tab trapped, Escape closes and returns focus, body scroll locked, closes on link, scrim, or growth to desktop width. The desktop navigation appears from 1100px.
  - Layer / view / inspector controls are real `<button aria-pressed>` groups (toggle groups), not ARIA tabs — the "tabs" in the prototype were shortcuts, so a toggle-group is the honest pattern; the selected layer drives which view is highlighted.
  - Skip link, global `:focus-visible` ring, `aria-current` scroll-spy, polite live regions for state changes.
  - Hit areas ≥44px on touch/narrow layouts (≥32px on desktop pointers); decorative glyphs are `aria-hidden`.
  - Schematic diagrams have a text alternative and, on narrow screens, scroll horizontally inside a labelled, focusable region (with a visual hint) instead of shrinking text below legibility.
  - `prefers-reduced-motion` disables smooth scroll, looping and positional transitions.
- **Consequences:**
  - *Positive:* 0 axe violations and full keyboard operability verified at five widths.
  - *Negative:* Diagram regions add a tab stop each.
- **Alternatives Considered:**
  - *Keep ARIA tabs:* rejected — no real panel switching exists to describe.

---

## ADR-014: Contact via `mailto:` Until M7; Hosting Left Open, Build Export-Compatible

- **Date:** 2026-09-24
- **Status:** Accepted (hosting: owner decision pending)
- **Context:**
  The prototype form only showed an `alert()` while claiming "SSL/TLS" and confidentiality. A real pipeline needs a hosting decision (Firebase static export forbids route handlers; Node hosting allows them) and secrets management — both out of scope for M3.
- **Decision:**
  The form validates client-side (pure, unit-tested logic) and composes a `mailto:` message in the visitor's own email app, stating plainly that nothing is stored or transmitted by the site. No route handlers or middleware exist, so `output: 'export'` remains available. The canonical URL comes from `NEXT_PUBLIC_SITE_URL` (default: the existing portfolio host).
- **Consequences:**
  - *Positive:* Honest, functional, no backend or secrets; export-compatible.
  - *Negative:* Depends on the visitor having a configured mail client.
- **Alternatives Considered:**
  - *Disabled form:* rejected — removes an approved element.
  - *Third-party form service now:* rejected — adds a dependency and data-handling decision before hosting is chosen.
