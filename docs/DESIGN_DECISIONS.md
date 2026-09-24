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
- **Status:** Accepted
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

