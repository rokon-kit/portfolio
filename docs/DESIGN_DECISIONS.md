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
