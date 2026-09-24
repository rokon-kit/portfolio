# Quality Assurance (QA) & Verification Protocols

## 1. Quality Assurance Philosophy
Every milestone in this project must undergo explicit, rigorous verification before being marked complete. No code is approved on assumption alone; visual inspection, interactive testing, and console/build diagnostics are mandatory.

---

## 2. Core QA Verification Checklist

### A. Code Quality & Build Verification
- [ ] TypeScript compilation succeeds with zero errors under strict mode (`tsc --noEmit`).
- [ ] ESLint passes with zero warnings or errors.
- [ ] Production build (`next build` or equivalent) compiles cleanly with no bundle size anomalies.
- [ ] Zero unhandled console errors or runtime warnings in browser developer tools.

### B. Visual & Interaction Design
- [ ] Typography adheres strictly to defined hierarchy, font scale, and line heights.
- [ ] Colors and contrast ratios satisfy WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text).
- [ ] GSAP animations run smoothly (aiming for 60 FPS) without stutter, layout jumps, or ghost triggers.
- [ ] Three.js / WebGL canvases initialize without WebGL context loss warnings and cleanly dispose on unmount.
- [ ] Micro-interactions (hover, active, focus states) provide crisp, responsive tactile feedback.

### C. Responsiveness & Cross-Device Compatibility
- [ ] Mobile Viewport (375px - 430px): Layout adapts gracefully; touch interactions work fluidly; no horizontal scroll leaks.
- [ ] Tablet Viewport (768px - 1024px): Grid structures reflow cleanly; navigation remains accessible.
- [ ] Desktop / Large Displays (1280px - 1920px+): Content max-widths prevent uncomfortable scanning distances; 3D scenes scale appropriately.

### D. Accessibility & Ergonomics
- [ ] Full keyboard navigation supported (logical tab order, visible focus rings).
- [ ] Semantic HTML tags (`<main>`, `<header>`, `<nav>`, `<section>`, `<h1>`-`<h6>`, `<button>`).
- [ ] `prefers-reduced-motion` media query respected across all animations and 3D camera shifts.
- [ ] Descriptive alt attributes for images and ARIA labels for non-text interactive elements.

---

## 3. Milestone Verification Logs

### Milestone 0: Governance, Rules & Initial Documentation
- **Date:** 2026-09-24
- **Reviewer:** Antigravity (Creative Director & Technical Lead)
- **Status:** Verified & Approved
- **Items Verified:**
  1. `AGENTS.md` established at project root containing all permanent project rules and instructions.
  2. `docs/` suite established with required functional documentation:
     - `docs/DESIGN_DECISIONS.md` (ADRs)
     - `docs/PROGRESS.md` (Roadmap and progress tracking)
     - `docs/RESEARCH.md` (Research, concept, benchmarks, anti-patterns)
     - `docs/CONTENT.md` (Content strategy and storytelling framework)
     - `docs/ARCHITECTURE.md` (Technical architecture, Next.js, GSAP, Three.js)
     - `docs/QA_REPORTS.md` (QA protocols and logs)
  3. Git repository state confirmed clean and ready for initial governance commit.
  4. Project constraints checked: No website implementation code introduced prematurely, in accordance with scope discipline.
- **Git Checkpoint:** `2755362`

### Milestone 1: Creative Research, Content Discovery & Identity Concepts
- **Date:** 2026-09-24
- **Reviewer:** Antigravity (Creative Director & Technical Lead)
- **Status:** Verified & Complete (Pending User Direction Selection)
- **Items Verified:**
  1. Content Discovery: Live site `https://rokonuzzaaman.web.app/` rendered with headless Chrome; official resume (`Rokonuzzaman.pdf`) downloaded and cross-referenced; GitHub profile (`rokon-rabbi`) inspected (39 public repos).
  2. Inconsistencies and missing details documented in `docs/CONTENT.md` without fabricating data.
  3. Creative research benchmarks evaluated and documented in `docs/RESEARCH.md`.
  4. Three distinct creative directions created and documented in `docs/CREATIVE_DIRECTIONS.md`.
- **Git Checkpoint:** `dee5aa3`

### Milestone 2: Design System & High-Fidelity Visual Prototypes
- **Date:** 2026-09-24
- **Reviewer:** Antigravity (Creative Director & Technical Lead)
- **Status:** Verified & Complete (Awaiting User Visual Approval)
- **Items Verified:**
  1. Design system specification delivered in `docs/DESIGN_SYSTEM.md` including custom monogram (`public/monogram.svg`), favicon (`public/favicon.svg`), color tokens, typography scale, grid guidelines, and component patterns.
  2. Architectural decision records updated with ADR-004, ADR-005, and ADR-006 in `docs/DESIGN_DECISIONS.md`.
  3. Five high-fidelity visual prototypes built in `prototype/`: Desktop Hero, Mobile Hero, Selected Works (3 System Dossiers with schematics), Interactive Engineering Topology Matrix, and Contact Section.
  4. Local testing: Prototypes served on local HTTP server; headless Chrome used to capture Desktop (1440px), Tablet (768px), and Mobile (375px) screenshots.
  5. Accessibility & Contrast: Body text contrast ratio of 14.8:1 verified against WCAG AAA standard; touch targets >= 44px on mobile; zero horizontal overflow.
  6. Scope discipline verified: Full Next.js application construction withheld until visual prototype approval.

### Milestone 3: Production Application Foundation
- **Date:** 2026-09-24
- **Reviewer:** Claude Code (Sonnet 5)
- **Status:** Verified & Complete (Awaiting Owner Review)
- **Environment:** Node v22.22.1 · npm 10.9.4 · Next.js 16.3.6 (Turbopack) · Google Chrome 151.0.7922.169 (headless, `--headless=new`) on Linux. Audited against the **production build** (`npm run build && npm run start`); the development server (`npm run dev`) was audited separately at 1440px.
- **Evidence:** `docs/qa/m3/` — viewport and full-page screenshots, drawer / form-error states, case-study and 404 pages, the approved prototype captured at the same widths (`baseline-prototype/`), and machine-readable `audit-results.json`. Reproduce with `npm i --no-save axe-core && node scripts/qa/browser-audit.mjs --base http://localhost:3100 --out docs/qa/m3`.

**Commands run (all executed; results are real)**

| Command | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run check:content` | Pass. Negative test: planting 6 known-bad claims made it fail (exit 1); removing them restored a pass. Comments are ignored. |
| `npm test` | 8 tests, 8 pass (validation rules, `mailto:` encoding, header-injection resistance, Unicode) |
| `npm run build` | Pass — routes: `/`, `/_not-found`, `/robots.txt`, `/sitemap.xml`, `/work/{volunteering-platform,courseflow,chemistry-calculator}` all prerendered |
| `npm run verify` | Pass (chain of the five above) |

**Browser results — production build, real mouse/keyboard input through the DevTools protocol**

| Viewport | Hydrated | Doc scrollWidth / viewport | Overflowing elements | axe-core violations (A/AA/2.1/2.2/best-practice) | Hit targets below minimum¹ | Contrast failures² | Console msgs / exceptions / failed requests / HTTP ≥400 |
|---|---|---|---|---|---|---|---|
| 320 | yes | 320 / 320 | 0 | 0 | 0 | 0 of 311 | 0 / 0 / 0 / 0 |
| 390 | yes | 390 / 390 | 0 | 0 | 0 | 0 of 311 | 0 / 0 / 0 / 0 |
| 768 | yes | 768 / 768 | 0 | 0 | 0 | 0 of 312 | 0 / 0 / 0 / 0 |
| 1024 | yes | 1009 / 1024³ | 0 | 0 | 0 | 0 of 312 | 0 / 0 / 0 / 0 |
| 1440 | yes | 1425 / 1440³ | 0 | 0 | 0 | 0 of 329 | 0 / 0 / 0 / 0 |

¹ Minimum 44px below 1024px, 32px at ≥1024px. ² Computed WCAG contrast over every visible text node (composited backgrounds). Excludes two decorative `aria-hidden` glyphs (`[ ]` ribbon brackets 2.64:1, `/` separator 2.22:1). ³ Difference is the vertical scrollbar, not overflow.
Also: case-study page (390 & 1440) and the 404 page — axe 0 violations, no overflow, no console errors (the 404 request itself returns HTTP 404 by design).

**Interactions verified with real input** (at every width where the control exists)
- Skip link: first Tab stop, visible, activation focuses `<main>`.
- Desktop nav click → section lands under the header (84px = 68px rail + 16px scroll padding); scroll-spy marks *Works* on click, *Contact* at page bottom, *Overview* at top.
- Mobile drawer (320/390/768/1024): opens; focus moves to *Close*; 12 Tab/Shift+Tab presses never leave the drawer; page scroll locked; Escape closes, restores scroll, returns focus to the toggle; a drawer link closes it and scrolls to the section; scrim click closes; drawer/toggle are `inert`/hidden on desktop.
- Hero layer filter: *Backend* hides the other two layers and updates the badge (`aria-pressed` correct).
- Architecture inspector: selecting a layer updates the readout, the "used in" links and the highlighted view; a view button selects that view's layer; a "used in" link navigates to the correct case study.
- Contact form: empty submit → 3 field errors, focus on the first invalid field, `aria-invalid` + `aria-describedby`; partial input keeps typed values and moves focus to the next invalid field.
- Case-study pager navigates; unknown URLs render the styled 404 with `noindex`.
- `prefers-reduced-motion: reduce`: smooth scroll off, looping animations stopped; default: smooth scroll on, hero float animation running.
- JavaScript disabled: h1, all 3 dossiers and the hero SVG (all layers visible) render.
- Links: 9 distinct internal links (4 routes) all return 200; every `#anchor` resolves; every `target="_blank"` has `noopener noreferrer`; the GitHub profile, all 4 repositories and the resume link return 200. **LinkedIn returned HTTP 999 (its bot block) — not machine-verifiable.**

**Visual comparison with the approved prototype** (screenshots in `docs/qa/m3/`): composition, typography, palette, hero model, dossier cards, schematic plates and console layout match at 1440 / 768 / 390 / 320. Differences are deliberate and logged: honest metric tiles and HUD labels, added Background section and 5-item nav, redrawn schematics with larger text, working mobile drawer, fixed tablet header, replaced fake form.

**Defects found during verification and fixed in this milestone**
1. Footer links narrower than the 44px minimum (`min-width: 44px`).
2. Contact card had ~240px of dead space — `.form-disclaimer { flex: 1 1 220px }` (meant for a row) applied a 220px flex-basis to a status paragraph in the column form. Scoped the rule; card height 822px → 582px.
3. Figure 02.B: "submits anonymous" overran its box; student box now uses three lines.
4. Mobile ribbon brackets `[ ]` orphaned on their own lines (flex → inline flow).
5. Drawer email focus ring clipped the text (added inset padding).
6. Diagrams looked cropped on phones with no cue — added a swipe hint.
7. Inquiry option truncated in the 390px select — shortened the label.
8. Next dev warning about `scroll-behavior: smooth` and route transitions — added `data-scroll-behavior` to `<html>`.
9. Next 16.3's dev server appended a generated block to `AGENTS.md` — reverted and disabled with `agentRules: false`; verified unchanged across restarts.

**Verification process notes (for transparency)**
- An early audit run reported interactions as "not working". Cause: the page was opened via `127.0.0.1`, which Next 16's dev server blocks for dev resources, so React did not hydrate. The harness now asserts hydration and uses `localhost`. A second false negative was the harness clicking controls outside the viewport; the click helper now scrolls targets into view. Neither was an application defect.
- A single failed `Script` request that appears in the raw totals is caused by the harness's own JavaScript-disabled step; the reported figures are captured *before* that step.

**Not tested / known gaps**
- Browsers other than Chromium (Firefox, Safari/WebKit) and real touch devices; screen readers (NVDA/JAWS/VoiceOver); Lighthouse / Core Web Vitals; frame-rate profiling; forced-colors mode; zoom/text-resize to 200–400%.
- The contact form's valid-submit path was not run live (it would launch the local mail client); its URL building and validation are unit-tested.
- axe reports `color-contrast` as "incomplete" for ~74 nodes (translucent backgrounds); covered by the computed contrast check above rather than by axe.

**Corrections to earlier logs (from the Milestone 3 audit of the M2 prototype)**
- The M2 log's "touch targets ≥ 44px on mobile" and clean tablet verification were not accurate for the prototype (mobile toggle 38×27px, layer buttons 28px tall, tablet header clipped at 768px). Both are fixed in the application.
- M2 contrast figures were inaccurate; corrected in `docs/DESIGN_SYSTEM.md` (ADR-010).
- M2 screenshots were not committed; M3 evidence is.

