# Project Progress & Roadmap

## 1. Project Overview
- **Project:** Md. Rokonuzzaman Portfolio ("The Human Side of Engineering")
- **Status:** Milestone 3 complete and verified, including a prototype-parity regression review — **awaiting owner review**
- **Current milestone:** Milestone 3 — Production Application Foundation (done)
- **Next milestone:** Milestone 4 — Signature Three.js Experience (**not started**; begins only on explicit request)

---

## 2. Milestone Roadmap

Numbering follows the owner's Milestone 3 handoff and is recorded in ADR-007. It supersedes the milestone lists in ADR-003 and in earlier versions of this file.

| Milestone | Title | Status | Git Checkpoint | Date |
|---|---|---|---|---|
| **M0** | Governance, Permanent Rules & Documentation Setup | **Completed** | `2755362` | 2026-09-24 |
| **M1** | Creative Research, Content Discovery & 3 Identity Concepts | **Completed** | `dee5aa3` | 2026-09-24 |
| **M2** | Design System, Custom Monogram & High-Fidelity Prototypes | **Completed** | `41cec5f` | 2026-09-24 |
| **M3** | Production Application Foundation | **Completed — awaiting review** | `1797edf` (tag `milestone-3`) + parity-review fixes (tag `milestone-3-parity-review`) | 2026-09-24 |
| **M4** | Signature Three.js Experience | Planned | - | - |
| **M5** | Cinematic Hero Integration | Planned | - | - |
| **M6** | Selected Work & Project Case Studies | Planned | - | - |
| **M7** | Professional & Personal Content | Planned | - | - |
| **M8** | Complete GSAP Motion Experience | Planned | - | - |
| **M9** | Comprehensive QA | Planned | - | - |
| **M10** | Final Refinement & Production Preparation | Planned | - | - |

---

## 3. Milestone 3 — What Was Delivered

The Next.js application now exists and reproduces the approved Living Blueprint design from the M2 prototype, without advanced motion or WebGL.

- **Stack:** Next.js 16.3 (App Router, Turbopack) · React 19.3 · TypeScript 5.9 (`strict`, `noUncheckedIndexedAccess`) · Tailwind CSS 4.3 · ESLint 9. GSAP, Three.js and React Three Fiber are intentionally **not installed yet** (ADR-008).
- **Design system:** all tokens ported to `src/styles/tokens.css` (`@theme static`); component CSS ported from the prototype into layered files under `src/styles/`; fonts self-hosted through `next/font` (Newsreader, Inter, JetBrains Mono).
- **Layout & navigation:** Precision Rail header, footer, skip link, scroll-spy, and an accessible mobile drawer (dialog semantics, `inert`, focus trap, Escape, scroll lock, focus return). The prototype's broken tablet header is fixed.
- **Homepage sections:** Hero (server-rendered text + static isometric SVG model with a working layer filter) · Selected Works (3 System Dossiers with rebuilt schematics) · Background (Barcodetech internship, NSTU degree, certifications — required by `docs/CONTENT.md`, absent from the prototype) · Architecture (layer inspector) · Contact (channels, resume, working `mailto:` form).
- **Routing:** `/work/[slug]` case-study pages (statically generated, 404 for unknown slugs), `not-found`, `loading`, `error`, `global-error`, `robots.txt`, `sitemap.xml`.
- **Content layer:** typed, presentation-free modules in `src/content/`; every claim traced to `docs/CONTENT.md`. The prototype's unverifiable claims (see `docs/CLAUDE_HANDOFF.md` §8.C) were removed, and an automated guard (`npm run check:content`) prevents their return.
- **SEO baseline:** `metadataBase`, title template, description, canonical, Open Graph, Twitter card, robots/sitemap, Person JSON-LD, theme colour.
- **Tooling:** `npm run dev | build | start | lint | typecheck | test | check:content | verify`; 8 unit tests for the contact logic; a reusable browser audit (`scripts/qa/browser-audit.mjs`).

Approved-token amendment: `--color-text-dim` `#64748B` → `#7C8BA1` to meet WCAG AA (ADR-010).

### Prototype-parity regression review (follow-up, same milestone)
A computed-style/state/pseudo-element diff plus side-by-side captures found and fixed eight regressions (details and evidence in `docs/QA_REPORTS.md` and `docs/qa/m3-review/`): the frosted-glass header (stripped by the CSS optimizer), the hero model's drag / touch / cursor-tilt interaction, restored approved copy in the hero and contact sections, the architecture readout's code-block element and live timestamp (now honest content), callout behaviour, quote/label drift, and the resume-plate layout. ADR-015 defines what is restored versus deliberately changed. New guards: the audit asserts each fix, and `scripts/qa/prototype-parity.mjs` reproduces the diff.

---

## 4. Verification Summary (Milestone 3)

Full detail, method and limitations: `docs/QA_REPORTS.md` → Milestone 3 and Milestone 3 — Prototype-Parity Regression Review. Evidence: `docs/qa/m3/` (initial) and `docs/qa/m3-review/` (final; the figures below are from the final audit).

| Check | Result |
|---|---|
| `npm run typecheck` | Pass (0 errors) |
| `npm run lint` | Pass (0 errors, 0 warnings) |
| `npm run check:content` | Pass (guard also proven to fail on planted claims) |
| `npm test` | 8/8 pass |
| `npm run build` | Pass; 8 routes prerendered as static |
| Browser, production build, 320 / 390 / 768 / 1024 / 1440 px | Hydrated; **0** horizontal overflow; **0** axe violations; **0** hit targets under minimum; **0** real contrast failures (of ~311 text nodes); **0** console messages / exceptions / failed requests |
| Real-input interactions | Skip link, nav + scroll-spy, drawer (focus trap, Escape, scroll lock, link close, scrim close), hero layer filter, **hero drag / touch drag / cursor tilt**, inspector + view sync + code block + live clock, "used in" navigation, form validation, case-study pager, 404 |
| Prototype parity (143 selectors × 3 widths, states, pseudo-elements, 22 side-by-side captures) | No unintended style drift after fixes; all remaining differences listed in ADR-015 |
| Reduced motion; JS disabled | Honoured; SSR content renders |
| Links | Internal routes all 200; all in-page anchors resolve; GitHub repos, profile and resume link 200 |

---

## 5. Remaining Issues, Limitations & Technical Debt

**By design (later milestones)**
- Hero scene is a static SVG stand-in; the real React Three Fiber scene is Milestone 4 (this SVG becomes its WebGL-unavailable fallback).
- No GSAP or scroll choreography (Milestone 5 / 8). The hero's drag/tilt is plain pointer-event code on the SVG model; the prototype's imperceptible ambient "breathing" drift was not restored.
- Case-study pages contain only documented content; depth, trade-offs and more projects (Scribble, Tier-2) are Milestone 6 / 7.
- Contact form hands off to the visitor's email app; a real submission pipeline is Milestone 7.
- No Open Graph image, apple-touch icon or PNG/ICO favicons (Milestone 10).

**Verification gaps (Milestone 9)**
- Verified in Chromium (headless Chrome) only. Firefox, Safari/WebKit, real touch devices and screen readers are **not** tested.
- No Lighthouse / Core Web Vitals measurements yet.
- The contact form's valid-submit path (opening the mail client) is covered by unit tests of the URL builder, not by a live run.
- axe-core reports `color-contrast` as "incomplete" (translucent backgrounds); contrast was instead verified with a computed check. Two decorative `aria-hidden` glyphs (`[ ]` ribbon brackets, `/` telemetry separator) are below 4.5:1 and are exempt as decoration.
- LinkedIn returns a bot-block (HTTP 999) to scripted requests, so that one link could not be machine-verified.

**Owner decisions still open** (see `docs/CLAUDE_HANDOFF.md` §12 — items marked ✔ were resolved with a safe default this milestone)
- ✔ Availability badge ("AVAILABLE"): kept as approved, driven by `profile.availability` in `src/content/profile.ts`; **confirm wording**.
- ✔ Phone number: still shown as in the approved prototype (now a `tel:` link); **confirm you want it public** (scraping risk).
- ✔ Resume: still the Google Drive link; decide whether to self-host the PDF.
- ✔ Degree start year (2018 vs 2019): no year stated on the site; only "Completed 2024".
- ✔ Hosting target: undecided; the build stays compatible with `output: 'export'` (Firebase Hosting) — no route handlers or middleware.
- Canonical URL defaults to `https://rokonuzzaaman.web.app`; set `NEXT_PUBLIC_SITE_URL` when the final domain is known.
- "39 public GitHub repositories" is the count recorded in the 2026-09-24 audit and is hard-coded; update it when it changes.
- Git identity is `rokon-kit` while `docs/CONTENT.md` lists GitHub `rokon-rabbi`; confirm which is canonical.
- Stray empty `test.txt` (from the first commit) left untouched.

**Technical debt / maintenance notes**
- ESLint is pinned to v9 (npm flags it as past support) because `eslint-config-next` 16's plugins do not yet support ESLint 10. Revisit when they do.
- TypeScript is pinned to 5.9: Next drives TypeScript through its JavaScript API, which the TypeScript 7 native compiler does not provide.
- Next.js 16.3's dev server tries to append a generated block to `AGENTS.md`; this is disabled with `agentRules: false` in `next.config.ts` so the governance file only changes through reviewed edits.
- Use `http://localhost:3000` (not `127.0.0.1`) in development: Next 16 blocks cross-origin dev resources, which prevents React from hydrating.

---

## 6. Completed Documentation & Asset Touchpoints
- `docs/DESIGN_SYSTEM.md`: tokens and components (corrected in M3 — see ADR-010).
- `docs/DESIGN_DECISIONS.md`: ADR-001 through ADR-015.
- `docs/CONTENT.md`: verified career history and project catalog (source of truth for all copy).
- `docs/ARCHITECTURE.md`: target architecture plus the as-built M3 structure.
- `docs/QA_REPORTS.md`: verification logs through Milestone 3.
- `docs/CLAUDE_HANDOFF.md`: Antigravity → Claude Code handoff audit.
- `docs/qa/m3/`: initial M3 screenshots, prototype baseline, audit results. `docs/qa/m3-review/`: parity composites, final audit and screenshots after the regression review.
- `public/favicon.svg`, `public/monogram.svg`; `prototype/` retained unchanged as the visual reference.

---

## 7. Next Steps
- Await owner review of Milestone 3.
- **Do not start Milestone 4 until explicitly requested.** Milestone 4 (per `docs/CLAUDE_HANDOFF.md` §5.3 and §10): build the real React Three Fiber scene in isolation first, install `three` / `@react-three/fiber` / `@react-three/drei` then, and keep the static SVG as the fallback.
