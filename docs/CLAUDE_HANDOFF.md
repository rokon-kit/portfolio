# Claude Code Handoff — Antigravity → Claude Code

*Written 2026-09-24 by Claude Code (Sonnet 5) after a read-only audit of the repository at commit `41cec5f`. No source, asset, or existing documentation file was modified during the audit.*

This document is the single entry point for anyone (human or agent) picking up the project. It records what actually exists, what does not, what is wrong with what exists, and the plan for what comes next. Where it contradicts an older document, the audit evidence in §7 is the reason.

> **Status update — Milestone 3 (2026-09-24):** this document is the *pre-M3 snapshot* taken at handoff, and is kept unchanged as the audit record. Its "there is no application yet" statements are now historical: the application foundation was built and verified in Milestone 3. Current status, decisions and limitations are in `docs/PROGRESS.md`, `docs/DESIGN_DECISIONS.md` (ADR-007–014) and `docs/QA_REPORTS.md`. Items in §8 that M3 fixed are listed in the M3 defect log in `QA_REPORTS.md`.

---

## 0. TL;DR

- **There is no application yet.** No `package.json`, no Next.js, no `node_modules`, no `src/`, no build/lint/test commands. The repository is **governance + documentation + a static HTML/CSS/JS design prototype + two SVG brand assets**.
- The **approved creative direction is "The Living Blueprint"** (Direction 1 in `docs/CREATIVE_DIRECTIONS.md`, specified in `docs/DESIGN_SYSTEM.md`, rendered in `prototype/`). The label "SYSTEMS / HUMAN" that appears in the handoff message **does not exist anywhere in the repo** and is not used.
- The prototype is visually strong and is the visual source of truth, but it contains **fabricated or unverifiable content claims**, **accessibility gaps**, **a broken tablet header**, and **no real Three.js or GSAP** (the "3D" hero is a 2D canvas).
- **Milestone 3 has not been started.** It must not start until explicitly requested.

---

## 1. Source of truth and known document conflicts

Precedence when documents disagree (highest first):

1. Explicit instructions from the project owner in the current conversation.
2. `AGENTS.md` (permanent project rules) and `CLAUDE.md` (working instructions).
3. `docs/DESIGN_SYSTEM.md` + the rendered `prototype/` (visual identity). Where the two differ numerically, the **prototype CSS** wins because it is what was actually rendered and reviewed — see §1.2.
4. `docs/CONTENT.md` (verified professional facts).
5. Other docs.

### 1.1 Identity and palette

| Item | Repo reality |
|---|---|
| Identity name | **The Living Blueprint** (architectural Swiss grid + systems graph). "SYSTEMS / HUMAN" appears nowhere in the repo. |
| Concept line | "The Human Side of Engineering" (unchanged). |
| Palette | Architectural Slate `#0B0E14`, surfaces `#12161F` / `#181D27`, Drafting White `#F1F5F9`, Slate Ash `#94A3B8`, Blueprint Cyan `#38BDF8`, Cobalt `#2563EB`, Tactical Amber `#F59E0B`, Phosphor Green `#10B981`. |
| Stale palette | `docs/CREATIVE_DIRECTIONS.md` Direction 1 lists a cream `#F2EFE9` and panel `#141923`. These were **not** carried into the design system or prototype. Ignore them. |

### 1.2 Design-system doc vs prototype CSS (type scale)

`docs/DESIGN_SYSTEM.md` §3 and `prototype/styles.css` `:root` disagree slightly. **Use the prototype values** (they were rendered and reviewed), then correct the doc in Milestone 3.

| Token | DESIGN_SYSTEM.md | prototype/styles.css |
|---|---|---|
| `--text-display` | `clamp(2.5rem, 5vw + 1rem, 4.5rem)` | `clamp(2.5rem, 4.5vw + 1rem, 4.25rem)` |
| `--text-h1` | `…3.5vw + 0.75rem…` | `…3.2vw + 0.75rem…` |
| `--text-h2` | `…2.5vw + 0.5rem…` | `…2.2vw + 0.5rem…` |
| `--text-h3` | `…1.5vw + 0.5rem, 1.5rem` | `…1.4vw + 0.5rem, 1.65rem` |
| `--text-body-lg` | `…1vw + 0.5rem…` | `…0.9vw + 0.5rem…` |
| `--font-display` | includes `Playfair Display` fallback | `Newsreader, Georgia, serif` only |

CSS also defines three tokens the doc omits: `--color-surface-translucent`, `--color-border-medium`, `--color-accent-cyan-glow`, plus `--container-max: 1360px`, `--pad-gutter`, radii, and `--ease-blueprint` / `--ease-tactile`.

### 1.3 Three conflicting milestone plans

| Source | Plan |
|---|---|
| `docs/DESIGN_DECISIONS.md` ADR-003 (status still "Accepted") | M1 scaffolding → M2 layout → M3 hero → M4 career → M5 works → M6 playground → M7 contact/polish. **Superseded by what actually happened; never marked so.** |
| `docs/PROGRESS.md` roadmap | M3 scaffolding/tooling/tokens → M4 layout/nav/type → M5 hero + R3F → M6 works → M7 contact/a11y/perf/launch. |
| **Handoff message (governs)** | M3 production foundation → M4 signature Three.js → M5 cinematic hero → M6 selected work/case studies → M7 professional & personal content → M8 complete GSAP → M9 comprehensive QA → M10 final refinement/production prep. |

**Action (part of Milestone 3 close-out):** record the renumbering as ADR-007, mark ADR-003 *Superseded*, and update `PROGRESS.md`. Until then, this document's §9 is the working roadmap.

---

## 2. Actual project structure

```
rokon-portfolio/
├── AGENTS.md                    # Permanent governance (16 rules, completion-report format) — preserve
├── CLAUDE.md                    # Working instructions for Claude Code (created with this handoff)
├── docs/
│   ├── ARCHITECTURE.md          # Target stack + src/ layout + 3D/GSAP/perf architecture (aspirational)
│   ├── CONTENT.md               # Verified professional facts + project catalog + skill taxonomy
│   ├── CREATIVE_DIRECTIONS.md   # 3 concepts; Direction 1 approved
│   ├── DESIGN_DECISIONS.md      # ADR-001 … ADR-006
│   ├── DESIGN_SYSTEM.md         # Tokens, type, grid, components, Three.js art direction, GSAP language
│   ├── PROGRESS.md              # Roadmap + M2 deliverables (partly stale — see §8.E)
│   ├── QA_REPORTS.md            # QA checklist + M0–M2 verification logs (partly inaccurate — see §8.E)
│   ├── RESEARCH.md              # Benchmarks + anti-cliché audit
│   └── CLAUDE_HANDOFF.md        # This file
├── prototype/                   # Static design prototype (the visual source of truth)
│   ├── index.html               # 919 lines: nav, hero, 3 dossiers, topology console, contact, footer
│   ├── styles.css               # 1,824 lines: tokens + all component styles; only 2 breakpoints
│   └── app.js                   # 382 lines: 2D-canvas iso scene, topology inspector, drawer, clock
├── public/
│   ├── favicon.svg              # 64×64 monogram favicon
│   └── monogram.svg             # 120×120 architectural "R" monogram plate
└── test.txt                     # Empty stray file from the initial commit (see §11)
```

Not present: `package.json`, lockfile, `tsconfig.json`, `next.config.*`, `tailwind.config.*`, ESLint/Prettier config, `.gitignore`, `README.md`, `src/`, tests, CI.

**Git history (4 commits, all on `main`, clean tree at audit start):**
`7ef4774` first commit → `2755362` M0 governance/docs → `dee5aa3` M1 research + 3 directions → `41cec5f` M2 design system + prototype + SVG assets.

---

## 3. Implementation status

| Area | Status |
|---|---|
| Governance, docs suite | ✅ Complete (with inaccuracies, §8.E) |
| Creative research + 3 directions | ✅ Complete |
| Design system (documented) | ✅ Documented; ⚠️ minor doc/CSS drift (§1.2), one failing colour token (§8.A) |
| Design system (implemented) | ❌ Only as prototype CSS. Nothing in Tailwind/Next. |
| Brand assets | ✅ `monogram.svg`, `favicon.svg` (favicon has no PNG/ICO/apple-touch fallbacks; no OG image) |
| Visual prototype (5 views) | ✅ Renders, no console errors — but see §8 |
| Next.js application | ❌ Not started |
| TypeScript / Tailwind / ESLint | ❌ Not started |
| Real Three.js / R3F | ❌ None. The hero "3D" is a Canvas-2D isometric projection (`initIsometricCanvas`). Its HUD label "ENGINE: R3F SIMULATOR" is false. |
| GSAP / ScrollTrigger | ❌ None. Zero GSAP, zero scroll choreography, zero `IntersectionObserver`. (The word "GSAP" appears once in marketing copy.) |
| Reduced-motion support | ❌ None in CSS or JS |
| Content layer / data model | ❌ None. All copy is hard-coded in `index.html`. |
| Working contact form | ❌ Fake. `onsubmit` shows `alert('Transmission simulated…')`; nothing is sent. |
| Tests / CI | ❌ None |

---

## 4. Approved visual identity — "The Living Blueprint"

- **Metaphor:** software as digital architecture — foundations (data) → structure (services) → interface (glass). Swiss asymmetric 12-column grid, 1px hairlines, corner drafting crosshairs, monospace coordinate telemetry (`LOC: DHAKA 23.81°N 90.41°E`).
- **Typography:** `Newsreader` (editorial serif display, italic accents) · `Inter` (body/UI) · `JetBrains Mono` (telemetry, labels, code). Fluid `clamp()` scale. Verified rendering: serif display + italic cyan/amber emphasis in the hero headline.
- **Colour roles:** cyan = interactive focus; amber = human-storytelling callouts (e.g. "human purpose", ethos card); green = live/operational; cobalt = diagram connectors only.
- **Layout language:** "Precision Rail" sticky glass nav; "System Dossier" cards with corner crosshairs; "Schematic Plate" figures with `// TITLE` HUD strips and `FIGURE 0X.Y` tags; console-style tabbed inspector.
- **Motion language (specified, not implemented):** `cubic-bezier(0.16, 1, 0.3, 1)`; masked vertical text reveals (0.03s stagger); SVG hairlines draw on entry (`expo.inOut`, 0.8s); numeric counters; reduced-motion → instant opacity only.
- **Three.js art direction (specified, not implemented):** isometric architectural node graph; wireframe → frosted glass/obsidian; ambient `#0B132B`@0.6, key cyan `#38BDF8`@1.8, rim amber `#F59E0B`@0.8; ±3° float; cursor tilt; scroll-scrubbed layer assembly; ≤20k polys, instancing, DPR 1.0 on mobile.
- **Anti-cliché rules:** no purple gradients, floating laptops, random particle fields, or skill-percentage bars.

Do not alter any of the above without an ADR and owner approval (`AGENTS.md` rules 6, 8, 12).

---

## 5. Reusable components and assets

### 5.1 Assets (reuse as-is)
- `public/monogram.svg`, `public/favicon.svg`.
- Inline monogram glyph in the prototype nav (32×32) and footer (24×24) — simplified variants of the same "R"; consolidate into one `<Monogram />` React component.

### 5.2 Prototype → Next.js component map

| Prototype (class / function) | Target component (per `docs/ARCHITECTURE.md`) | Notes |
|---|---|---|
| `.precision-rail`, `.mobile-drawer` | `components/layout/Header`, `MobileNav` | Rebuild with real a11y (§8.A). Add scroll-spy (prototype's `.active` never updates). |
| `.blueprint-footer` | `components/layout/Footer` | |
| `.section-container`, `.section-header-block`, `.section-index-badge` | `components/layout/Section`, `SectionHeader` | |
| `.corner-crosshair` ×4 | `components/ui/CornerFrame` | Used on ethos box, dossiers, console, contact card. |
| `.btn-primary/-secondary/-ghost`, `.btn-dossier-*` | `components/ui/Button` | Fix hit areas ≥44px. |
| `.tech-pill`, `.sys-status`, `.hud-badge`, `.status-indicator` | `components/ui/Badge`, `Pill` | |
| `.hero-*`, `.human-ethos-box`, `.blueprint-ribbon` | `components/sections/Hero` | Headline/summary must be server-rendered for LCP. |
| `.blueprint-viewport-frame`, `.layer-pills`, `.blueprint-callout` | `components/sections/hero/ViewportFrame` + `components/canvas/*` | Layer controls become a proper toggle group. |
| `.hero-telemetry-grid` / `.telemetry-metric-tile` | `components/ui/MetricTile` | Only with verified numbers (§8.C). |
| `.system-dossier-card`, `.schematic-plate`, `.challenge-solution-grid`, `.impact-metrics-row` | `components/sections/works/Dossier*` | Data-driven from a typed content module. |
| Inline SVG figures 01.A / 02.B / 03.C | `components/sections/works/figures/*` | Reusable as real SVG components. Text inside them needs verification (§8.C). |
| `.topology-console-deck`, `.interactive-node`, `.node-readout-panel`, `nodeSpecs` | `components/sections/Topology` | `nodeSpecs` is currently unverified content. |
| `.contact-dossier-card`, `.channel-item`, `.resume-download-plate`, `.blueprint-form` | `components/sections/Contact` | Needs a real submit path (§11). |
| `initIsometricCanvas` geometry | `components/canvas/HeroScene` (M4) | **Reuse the layout numbers, not the code** — see §5.3. |

### 5.3 Hero scene blueprint to carry into Milestone 4
The 2D prototype encodes the intended composition (units arbitrary, z up). Use as the R3F starting geometry:

| Layer | Colour | Geometry |
|---|---|---|
| L1 Data (bottom) | amber | slab 180×180×16 @ z=−60; two storage blocks 50×50×24 @ z=−38 (x = ±45) |
| L2 Services (middle) | cyan core, cobalt towers | core 120×120×45 @ z=0; two towers 30×30×60 @ z=45 (x = ±35) |
| L3 Interface (top) | cyan glass, white pane | canopy 150×150×18 @ z=120; floating pane 90×90×8 @ z=150 with ±6 sine bob |
| Floor | faint cyan/white | ring r=140 + crosshair lines |
| Callouts | | `L3: CLIENT INTERFACE (REACT/TS)`, `L2: SPRING BOOT / REST APIS`, `L1: POSTGRESQL / PERSISTENCE` |

---

## 6. Completed milestones

| Milestone | Delivered | Checkpoint | Owner approval on record? |
|---|---|---|---|
| M0 — Governance & docs | `AGENTS.md`, 6 docs | `2755362` | Yes (per QA log) |
| M1 — Research & 3 directions | RESEARCH, CONTENT audit, CREATIVE_DIRECTIONS | `dee5aa3` | Direction 1 selected (per DESIGN_SYSTEM.md) |
| M2 — Design system & prototype | DESIGN_SYSTEM, ADR-004–006, monogram/favicon, `prototype/` | `41cec5f` | **Not recorded.** `PROGRESS.md` still says "Awaiting User Visual Approval" and lists the checkpoint as "Pending Review". The handoff message treats M2 as complete; that is accepted here, but the docs should be reconciled. |

---

## 7. Audit verification log (2026-09-24)

What was run, with results. Nothing below required installing packages.

**Environment:** Node v22.22.1, npm 10.9.4, Google Chrome and Firefox installed. pnpm/yarn not installed. No project scripts exist to run.

**Prototype serving:** `python3 -m http.server 4173` from the repo root; `/prototype/index.html`, `/prototype/app.js`, `/public/favicon.svg` all HTTP 200. (The prototype references `/public/favicon.svg`, so it must be served from the repo root.)

**Headless Chrome via DevTools Protocol at 1440×900, 768×1024, 375×812 (mobile emulation):**

| Check | Result |
|---|---|
| Console errors / warnings | **None** at all three viewports |
| Failed network requests | **None** (Google Fonts CSS loaded live — a runtime external dependency) |
| Document-level horizontal scroll | None (`scrollWidth` = viewport at 768 and 375; 1425 at 1440 = scrollbar) |
| Serif/sans/mono fonts | Render correctly (visually confirmed) |
| Layer buttons (`FULL STACK`/`FRONTEND`/`BACKEND`/`DATABASE`) | Work (programmatic click updates state + tag) |
| Topology node inspector | Works |
| Mobile drawer open | Works |
| Mobile drawer close on `Escape` | **Does not work** |
| Nav scroll-spy | **Does not exist** — "01 Overview" stays active at the Contact section |
| Topology tabs (Dataflow/Security/Performance) | **Cosmetic** — they just click the Client/Security/Storage node; there is no dataflow or performance view |

Interactions were driven with programmatic `.click()`, not real pointer/touch/keyboard input. **Not tested:** real touch-drag on the canvas, real Tab-key traversal, screen readers, Firefox/Safari, throttled-CPU frame rate, Lighthouse.

**Contrast (WCAG formula, computed):**

| Token | Documented | Measured on canvas / surface / elevated |
|---|---|---|
| `--color-text-primary` `#F1F5F9` | 14.8:1 | 17.63 / 16.52 / 15.41 ✅ |
| `--color-text-secondary` `#94A3B8` | 7.2:1 | 7.53 / 7.06 / 6.58 ✅ |
| `--color-text-dim` `#64748B` | **4.6:1 "AA"** | **4.06 / 3.80 / 3.55 ❌ fails 4.5:1** |
| `--color-accent-cyan` `#38BDF8` | — | 9.02 / 8.45 / 7.88 ✅ |
| `--color-accent-blue` `#2563EB` | — | 3.74 / 3.50 / 3.27 (OK for graphics ≥3:1, **not** for text) |

Candidate fix (needs owner approval as a design change): `--color-text-dim: #7C8BA1` → 5.58 / 5.23 / 4.88 ✅ on all three surfaces.

---

## 8. Known issues

### A. Accessibility (WCAG 2.1 AA is a permanent project requirement)
1. `--color-text-dim` fails AA (§7). It is used for 12px monospace metadata (ribbon coordinates, plate footers, timestamps, labels).
2. `.interactive-node` items are `<div>` click targets: not focusable, no role, no keyboard operation.
3. `layer-pills` and `console-tabs` declare `role="tablist"` but their buttons have no `role="tab"`, `aria-selected`, or `aria-controls`.
4. Mobile drawer: no `aria-expanded` on the toggle, no `aria-hidden`/`inert` when closed, no focus trap, no `Escape` handling, no focus return. Its links are not `visibility:hidden`, so they appear to remain in the tab order while off-canvas (inferred from computed styles; not verified with real Tab presses).
5. No skip link. No visible `:focus-visible` styles for buttons/links (only form controls have `:focus` styling).
6. The hero `<canvas>` has no accessible name/description.
7. No `prefers-reduced-motion` handling anywhere; `scroll-behavior: smooth` is unconditional; the canvas `requestAnimationFrame` loop always runs.
8. Project rule (design system §8): all touch targets ≥44×44px. **Not met.** At 375px, 25 measured interactive elements are under 44px in at least one dimension (e.g. menu toggle 38×27, layer buttons 28px tall, drawer close 65×16, brand link 196×38). Desktop nav items are 33px tall.

### B. Responsive / layout
1. **Tablet (768px) header is broken:** `.rail-actions` extends to x=784 (viewport 768) so the "AVAILABLE" pill is clipped, and the brand name wraps ("MD. / ROKONUZZAMAN") and collides with the nav. Only two breakpoints exist (≤1024, ≤767). `body { overflow-x: hidden }` hides overflow rather than preventing it.
2. Desktop hero HUD header wraps ("60 / FPS", "LAYER: / BACKEND") and callout badges overlap the model.
3. Mobile ribbon: `[` `]` bracket glyphs are orphaned on their own lines.

### C. Content integrity (`AGENTS.md` rule 4 — never fabricate)
The prototype presents the following as fact. None is supported by `docs/CONTENT.md`; each must be removed, sourced from the actual repositories/owner, or clearly labelled illustrative before it ships:

| Prototype content | Problem |
|---|---|
| Hero tile **"15+ PROJECTS BUILT"** | Unsourced. CONTENT.md verifies 39 public repos and 7 catalogued projects. |
| Hero tile **"100% AUTHENTIC DATA"** | Meta-claim, not a metric. |
| HUD badge **"60 FPS"** | Hard-coded text; nothing measures it. |
| HUD **"ENGINE: R3F SIMULATOR"** | False — it is Canvas 2D. |
| Ribbon **"EST. 2018"** | CONTENT.md flags 2018 (resume) vs 2019 (existing site) as unresolved. |
| **"DEPLOYED ARCHITECTURE"** status on the Volunteering Platform | No deployment documented. |
| **"LATENCY: <45MS P99"**, "<45ms Latency (P99)", "B-Tree Indexed Queries (<8ms)", "latency: '<16ms'" | No measurements exist. |
| "PostgreSQL 16", "Spring Security 6.x", "BCrypt (12 rounds)", "Java 17 Records", "TypeScript 5.x", "REPEATABLE READ", "3NF" | Specific versions/configs not documented; verify against the repos. |
| "ACID compliance guarantees **zero race conditions**" | Overclaim. |
| "**Replaced 100% Paper Queues**", "**Zero Lab Formula Calculation Errors**", "TAMPER-RESISTANT WORKFLOW", "TYPE-COVERAGE: STRICT" | Overclaims/unmeasured outcomes. CONTENT.md's own wording is softer ("Replaces weeks of manual physical stamp queues"). |
| Volunteering "human challenge" mentions **disaster relief, emergency requests, duplicated signups** | Embellished beyond CONTENT.md ("disconnected relief efforts, unstructured volunteer recruitment"). |
| Code/SQL/Java snippets labelled **"Verified Architecture Guarantee/Contract/Schema Definition"** (`ClearanceToken`, `registrations` table, `SystemController`, `verifyNodeIntegrity`) | Invented illustrative code presented as verified. |
| "**Gaussian elimination**" for the Chemistry Calculator | CONTENT.md says "matrix balancing and linear system solvers"; the algorithm name is unconfirmed. (The Fe + O₂ → Fe₂O₃ example itself is chemically correct: 4Fe + 3O₂ → 2Fe₂O₃.) |
| Contact form: "**ENCRYPTION: SSL / TLS**", "Zero spam policy. Your contact data remains confidential." | Form sends nothing; these are unearned assurances. |
| Nav badge **"AVAILABLE"** / "Open to full-stack engineering roles" | Availability is the owner's statement to make. |

Verified and consistent with CONTENT.md: name, title, Dhaka location, NSTU degree, CGPA 3.34, 39 repos, ethos quote, the three dossier projects' repo URLs and stacks, LinkedIn/GitHub/email/phone/resume link. (Contact details were taken from Antigravity's audit of the resume/site and were **not independently re-verified** in this audit.)

**Content that CONTENT.md says must exist but the prototype omits:** the **Barcodetech Automation internship** (CONTENT.md: "must be featured prominently"), education section, Scribble (Tier-1 project #4), Tier-2 projects, certifications, skills taxonomy, personal storytelling.

### D. Prototype engineering (only matters where code is ported)
- Fonts load from the Google Fonts CDN (`<link>`), not self-hosted → in Next.js use `next/font`.
- Canvas loop never pauses when off-screen or tab hidden; `mousemove` on `window` unthrottled; no cleanup.
- Inline `onsubmit` + `alert()`; `innerHTML` templating in the inspector (safe today only because content is static).
- Clock initial markup says "BST" but JS overwrites with UTC.
- Favicon path `/public/favicon.svg` only resolves when served from the repo root; in Next.js it becomes `/favicon.svg`.

### E. Documentation inaccuracies (do not rewrite existing docs silently — fix via M3 doc pass + ADR)
- `PROGRESS.md`: M2 checkpoint "Pending Review" although `41cec5f` exists; claims 14.8:1 / 7.2:1 / 4.6:1 contrast (measured 17.63 / 7.53 / 4.06).
- `QA_REPORTS.md` M2 log claims "touch targets ≥ 44px on mobile" and clean tablet verification — not borne out (§8.A.8, §8.B.1). It also says screenshots were captured, but **no screenshot files are committed**, so M2's evidence cannot be reproduced from the repo.
- `ADR-004` repeats the incorrect contrast numbers.
- `ARCHITECTURE.md`: says "React 19 / 18" (pick one); its tree omits `DESIGN_SYSTEM.md`, `CREATIVE_DIRECTIONS.md`, `prototype/`.
- ADR-003 and the `PROGRESS.md` roadmap are superseded by §1.3.

---

## 9. Missing requirements (everything in `AGENTS.md` not yet met)

Whole application; typed content layer; Three.js/R3F scene; GSAP/ScrollTrigger system; reduced-motion strategy; WebGL-unavailable fallback; accessible navigation; real contact pipeline; SEO/OpenGraph/Twitter metadata + OG image; favicon set beyond SVG; performance budget enforcement (LCP <2.0s, CLS 0, INP <100ms); cross-browser QA; automated tests; screenshot evidence stored in-repo; `.gitignore`; README.

---

## 10. Adapted roadmap (M3–M10)

Adapted to the real codebase: nothing beyond documentation and a prototype exists, so M3 is a true from-zero foundation. Each milestone is approval-gated and ends with the `AGENTS.md` §3 report and a Git checkpoint.

| # | Milestone | Scope (adapted) | Depends on |
|---|---|---|---|
| **3** | **Production application foundation** | Scaffold Next.js App Router + strict TS + Tailwind + lint; design tokens; `next/font`; accessible layout shell (header, mobile nav, footer, skip link, focus states); UI primitives; typed content layer; **static, motion-free port** of the five prototype sections as server components with a static SVG stand-in for the hero scene; unverified claims removed; tooling + verification harness; doc/ADR reconciliation. Details in §11. | Owner decisions in §12 |
| 4 | Signature Three.js experience | Real R3F scene from the §5.3 blueprint: instanced geometry, ≤20k polys, DPR caps/mobile tier, lighting per design system, pointer tilt, layer toggle, `dynamic(..., {ssr:false})`, context-loss + dispose handling, pause off-screen, reduced-motion static frame, WebGL-unavailable SVG fallback, accessible description. Built in isolation first (sandbox route) so the hero isn't destabilised. | 3 |
| 5 | Cinematic hero integration | Compose hero: server-rendered headline for LCP, canvas loaded after first paint, GSAP intro timeline (masked reveals), scroll-scrubbed layer assembly (pinned), callouts synced to layers. Measure LCP/CLS/INP with real numbers. | 3, 4 |
| 6 | Selected work & case studies | Data-driven dossiers → per-project case-study pages (`problem → architecture → trade-offs → human impact`). Rebuild schematics as SVG components; **every technical claim sourced from the actual repos** or removed; decide on Scribble; real repo links. | 3, content facts from owner |
| 7 | Professional & personal content | Barcodetech internship, NSTU education, certifications, capability taxonomy (no % bars), Tier-2 projects, "human side" storytelling, resolved open facts (§12), working contact pipeline with spam protection and env-based secrets. | 3, owner input |
| 8 | Complete GSAP motion experience | `lib/gsap` registered once; `useGSAP`/`gsap.context` everywhere; hairline draws, counters (verified numbers only), section transitions, `gsap.matchMedia` for reduced motion and mobile; ScrollTrigger refresh on resize; no scroll-jacking beyond the specified pins. | 3, 5 |
| 9 | Comprehensive QA | Full `QA_REPORTS.md` checklist: tsc/lint/build; Lighthouse + CWV; axe + manual keyboard/screen-reader; Chrome/Firefox/WebKit; 375/768/1024/1440/1920+; reduced motion; WebGL fallback matrix; GPU-memory/leak checks; bundle analysis; evidence committed. | 3–8 |
| 10 | Final refinement & production prep | OG image/metadata, sitemap/robots, deployment target config, error/404 pages, README, final content pass, last perf tuning, release checkpoint. | 9 |

---

## 11. Proposed Milestone 3 plan (do not start until requested)

**Goal:** a production-quality, deployable, accessible, fast Next.js foundation that reproduces the approved Living Blueprint design — without motion or WebGL — and that removes fabricated content.

**Ground rules:** scaffold *into* the existing repo without touching `docs/`, `AGENTS.md`, `prototype/`, `public/*.svg`. `prototype/` stays as the reference and must be excluded from `tsconfig`, ESLint, and the Next build.

1. **Pre-flight (before any code):** get the §12 decisions; check current stable versions with `npm view` (Next, React, Tailwind, ESLint) and record the choice in ADR-007. No package is installed before this.
2. **Scaffold:** Next.js App Router, `src/` layout per `ARCHITECTURE.md`, TypeScript `strict` + `noUncheckedIndexedAccess`, path alias `@/*`, Tailwind, ESLint (next + a11y plugin), Prettier, `.gitignore`, npm scripts (`dev`, `build`, `start`, `lint`, `typecheck`). Created manually or in a temp dir and merged — not via a generator that could clobber existing files.
3. **Dependencies:** core only. **Defer** `gsap`, `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei` to M4/M8 (rule: no unnecessary installs; keeps the M3 bundle honest). Confirm in §12.
4. **Tokens:** port prototype `:root` into `globals.css` + Tailwind theme (colours, radii, spacing, type scale, easing). Apply the approved `text-dim` fix; log in ADR; correct `DESIGN_SYSTEM.md` drift (§1.2).
5. **Fonts:** `next/font` for Newsreader, Inter, JetBrains Mono (self-hosted, `display: swap`, subset, preload) — resolves ADR-005's FOUT risk and removes the CDN dependency.
6. **Layout shell (accessible):** `Header` (Precision Rail, scroll-spy, ≥44px targets), `MobileNav` (dialog semantics, `aria-expanded`, focus trap or `inert`, `Escape`, focus return), `Footer`, skip link, global `:focus-visible` ring, `Section`/`SectionHeader`, `CornerFrame`. Fix the 768px header. Add breakpoints beyond the prototype's two.
7. **UI primitives:** `Button` (3 variants), `Badge`/`Pill`, `MetricTile`, `Monogram`, `SchematicPlate`.
8. **Typed content layer:** `src/content/*` (profile, projects, contact, nav) derived from `CONTENT.md`; a `verified: boolean`/`source` discipline for any claim; no fabricated metrics (§8.C table applied).
9. **Static port of all five sections** as server components; hero scene → static SVG of the §5.3 composition (no canvas, no JS). Topology console becomes a real accessible tabs/disclosure component using only verified content. Contact form: real `<form>` with validation UI and an honest "not yet wired" state or a disabled submit — the actual pipeline is M7 (avoids shipping another fake).
10. **Metadata baseline:** `layout.tsx` metadata, favicon wiring, `lang`, viewport, theme-color. (OG image → M10.)
11. **Verification harness:** `tsc --noEmit`, `next lint`, `next build`; browser checks at 375/768/1024/1440 with screenshots stored under `docs/qa/m3/`; axe scan; keyboard walkthrough; contrast script; reduced-motion emulation; zero console errors.
12. **Docs & close-out:** ADR-007 (roadmap renumbering, stack versions, hosting), mark ADR-003 superseded, update `PROGRESS.md`/`QA_REPORTS.md`/`ARCHITECTURE.md`, Git checkpoint, `AGENTS.md` §3 completion report.

**Exit criteria:** build/type/lint clean; no console errors; no horizontal overflow at 320–1920px; all interactive targets ≥44px; full keyboard operability; contrast ≥ AA everywhere; no unverified claims in shipped copy; visual parity with the prototype reviewed side-by-side at 3 viewports; evidence committed.

---

## 12. Decisions needed from the project owner

1. **Hosting target.** The current site is on Firebase Hosting (`web.app`). Static export (`output: 'export'`) works there but forbids route handlers, which changes how the contact form works (M7). Vercel/Node hosting keeps route handlers. This affects M3 config — decide first.
2. **Approve or veto the `text-dim` fix** (`#64748B` → `#7C8BA1`) — a colour change to an approved token.
3. **Content corrections** in §8.C: confirm removal/rewording of unverifiable metrics; confirm or supply real figures for "projects built", deployment status, availability wording, "EST." year (2018 vs 2019).
4. **Public phone number.** The prototype prints `+880 1902 978060` in plain text (scrapable). Keep, or route through the contact form / reveal-on-click?
5. **Resume link.** Keep the Google Drive link, or self-host the PDF in `public/`?
6. **Formal M2 approval** so `PROGRESS.md` can be reconciled.
7. **Dependency timing:** defer GSAP/Three to M4/M8 (recommended) or install in M3.
8. **Test tooling:** Playwright + axe-core (recommended for the browser-verification rule) — this adds dev dependencies.
9. **Stray `test.txt`** (empty, from the first commit): delete, or leave? (Left untouched.)
10. **Identity check.** The local Git identity is `rokon-kit`; CONTENT.md lists GitHub `rokon-rabbi`. Confirm both are yours and which is canonical for public links.

---

## 13. Build and run commands

**Application:** none exist yet (no `package.json`). Milestone 3 will add `dev`, `build`, `start`, `lint`, `typecheck`.

**Prototype (the only runnable artifact):**
```bash
cd /home/rokon/Downloads/rokon-portfolio
python3 -m http.server 4173 --bind 127.0.0.1     # serve from repo root (favicon path requires it)
# open http://127.0.0.1:4173/prototype/index.html
```
Requires internet for Google Fonts. Antigravity's docs say it used port 3000; its exact command was not recorded.

**Toolchain present on this machine:** Node 22.22.1, npm 10.9.4, Google Chrome (headless works), Firefox, Python 3.
