# Technical Architecture Specification

## 1. High-Level Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, Server Components + selective Client Components
- **Language:** TypeScript 5.9 (`strict` + `noUncheckedIndexedAccess`, zero `any` policy enforced by ESLint)
- **Styling:** Tailwind CSS with custom editorial design tokens (CSS variables for theming, typography, spacing, and transitions)
- **Animation Engine:** GSAP (GreenSock Animation Platform) + ScrollTrigger, managed via `gsap.context()` / `@gsap/react`
- **3D / WebGL:** Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`
- **Icons & Visual Assets:** Lucide React / Custom SVG vectors, optimized WebP/AVIF imagery

---

## 2. Directory & Component Architecture

```
rokon-portfolio/
├── AGENTS.md                  # Permanent project governance and rules
├── docs/                      # Architectural & project documentation
│   ├── DESIGN_DECISIONS.md    # ADRs and design records
│   ├── PROGRESS.md            # Roadmap, milestone progress, and issue tracking
│   ├── RESEARCH.md            # Research, benchmarks, and creative guidelines
│   ├── CONTENT.md             # Content strategy and case study templates
│   ├── ARCHITECTURE.md        # Technical architecture specifications
│   └── QA_REPORTS.md          # QA criteria, verification logs, test plans
├── public/                    # Static assets, fonts, models, images
└── src/                       # Application source code
    ├── app/                   # Next.js App Router routes and layouts
    │   ├── layout.tsx         # Root layout with fonts, metadata, providers
    │   ├── page.tsx           # Main editorial experience
    │   └── globals.css        # Global CSS, theme variables, reset
    ├── components/            # Reusable UI components
    │   ├── canvas/            # Three.js scenes, shaders, 3D models (dynamic/client)
    │   ├── motion/            # GSAP wrappers, smooth scroll providers, revealers
    │   ├── layout/            # Navigation, footer, container grids, page framing
    │   ├── sections/          # Feature sections (Hero, About, Works, Skills, Contact)
    │   └── ui/                # Base design system primitives (Buttons, Badges, Modals)
    ├── hooks/                 # Custom React hooks (useWindowSize, usePrefersReducedMotion, etc.)
    ├── lib/                   # Utilities, constants, GSAP registration, 3D helpers
    └── types/                 # Shared TypeScript interfaces and domain models
```

---

## 3. WebGL & 3D Lifecycle Architecture

### Client-Side Isolation
Three.js and React Three Fiber rely on browser-only WebGL APIs (`window`, `HTMLCanvasElement`, `WebGLRenderingContext`). To prevent SSR hydration mismatches:
- All 3D scenes are strictly isolated in dedicated client components (`'use client'`).
- Canvas views are loaded using `dynamic(() => import(...), { ssr: false })` with smooth fallback loaders.

### Performance Budgets for 3D
1. **Target Framerate:** Consistent 60 FPS on desktop; 30–60 FPS on mobile.
2. **Draw Calls:** Keep active scene draw calls under 30 per frame.
3. **Geometry & Textures:** Use compressed glTF/GLB models (Draco / Meshopt compression) and optimized texture maps (max 1024x1024 or 2048x2048).
4. **Mobile Graceful Degradation:** Detect low-tier hardware / mobile viewports; downgrade anti-aliasing, reduce particle counts, or switch to lightweight 2D interactive canvas or CSS-rendered representations.
5. **Memory Management:** Ensure full disposal of geometries, materials, and textures when scenes unmount.

---

## 4. GSAP Animation Architecture

### Safe Context Management
To prevent memory leaks and zombie event listeners during React component re-renders:
- All animations must be scoped within `gsap.context()` or `useGSAP()` hooks.
- ScrollTrigger instances must be killed and refreshed on page transitions and responsive resize events.

### Accessibility & Reduced Motion
- Respect `prefers-reduced-motion`: When detected, disable parallax and complex position shifts; provide immediate visual states or subtle alpha-only fades.

---

## 5. Performance, SEO & Core Web Vitals Strategy

1. **LCP (Largest Contentful Paint) < 2.0s:**
   - Critical editorial text and hero heading must be rendered in server components directly in initial HTML.
   - 3D canvas loads progressively without blocking initial text render.
2. **CLS (Cumulative Layout Shift) = 0:**
   - All dynamic components, images, and canvas containers must specify fixed aspect ratios or reserved heights.
3. **INP (Interaction to Next Paint) < 100ms:**
   - Heavy 3D calculations are offloaded or decoupled from main thread click handlers.
4. **Metadata & OpenGraph:**
   - Comprehensive OpenGraph and Twitter Card metadata configured in `layout.tsx`.

---

## 6. As-Built Structure (Milestone 3)

The sections above describe the target architecture. This section records what exists after Milestone 3 (see ADR-007 to ADR-014). GSAP, Three.js and React Three Fiber are **not installed yet** (ADR-008).

```
rokon-portfolio/
├── AGENTS.md · CLAUDE.md          # governance / working instructions
├── docs/                          # documentation; docs/qa/m3/ holds M3 verification evidence
├── prototype/                     # M2 static design reference (unchanged; excluded from TS/ESLint/build)
├── public/                        # favicon.svg, monogram.svg
├── scripts/
│   ├── check-content.mjs          # content-integrity guard (npm run check:content)
│   └── qa/                        # browser-audit.mjs (real-input audit + regression guards) · prototype-parity.mjs (style diff vs prototype)
├── package.json · tsconfig.json · next.config.ts · eslint.config.mjs · postcss.config.mjs · .env.example
└── src/
    ├── app/                       # App Router
    │   ├── layout.tsx             # fonts (next/font), metadata, JSON-LD, skip link, header/footer
    │   ├── page.tsx               # home: Hero · Works · Background · Topology · Contact
    │   ├── work/[slug]/page.tsx   # statically generated case studies (dynamicParams = false)
    │   ├── not-found.tsx · loading.tsx · error.tsx · global-error.tsx
    │   ├── robots.ts · sitemap.ts
    │   └── globals.css            # Tailwind + token + layered component CSS imports
    ├── styles/                    # tokens.css (@theme static) · base · layout · ui · hero · works · background · topology · contact · states
    ├── content/                   # typed, presentation-free copy: profile · projects · background · layers · contact
    ├── types/content.ts           # domain types for all content
    ├── components/
    │   ├── layout/                # Header (server) · HeaderNav (client: nav + drawer) · Footer · SkipLink
    │   ├── ui/                    # Button · CornerFrame · LiveClock · Monogram · RichText · SectionHeader · SchematicPlate
    │   ├── sections/              # Hero (+ HeroViewport client, scene-model) · works/ · Background · Topology (+ LayerInspector client) · Contact (+ ContactForm client)
    │   ├── figures/               # per-project SVG schematics + shared primitives
    │   └── seo/JsonLd.tsx
    ├── hooks/useActiveSection.ts  # scroll-spy
    └── lib/                       # site.ts (canonical URL) · cn.ts · contact.ts (+ contact.test.ts)
```

**Conventions**
- Content is data (`src/content`); components render it. Facts must be traceable to `docs/CONTENT.md`; `npm run check:content` blocks known-bad claim patterns.
- Server Components by default. Client components (`'use client'`): `HeaderNav`, `HeroViewport`, `LayerInspector`, `ContactForm`, `LiveClock`, and the `useActiveSection` hook — each needs state or browser APIs.
- `HeroViewport` renders the resting view on the server, then progressively enhances it: pointer drag / touch drag rotate the model (`buildScene(rotation)` in `scene-model.ts`), the mouse tilts it while on screen, and it eases back. The rAF loop runs only while moving; reduced motion disables tilt and easing.
- Everything is prerendered; the site works with JavaScript disabled (all sections render, all layers visible, links function).
- Every interactive control is a native element (`a`, `button`, `input`); state is exposed with `aria-pressed`, `aria-current`, `aria-expanded`, and polite live regions.
- Colour and type come from tokens; SVG figures use design-system classes/variables, never hard-coded hex.

**Scripts**

| Script | Purpose |
|---|---|
| `npm run dev` | Development server (use `http://localhost:3000`, not `127.0.0.1`) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + jsx-a11y; `prototype/` and `docs/` ignored) |
| `npm run check:content` | Banned-claim scan of `src/` |
| `npm test` | Node's built-in test runner (`src/**/*.test.ts`) |
| `npm run verify` | typecheck → lint → check:content → test → build |

**Where later milestones plug in**
- M4: real R3F scene in `components/canvas/` (created then), loaded with `dynamic(..., { ssr: false })`; `sections/hero/scene-model.ts` + `HeroViewport` static SVG become the WebGL-unavailable fallback.
- M5/M8: GSAP registered once in `lib/`, animations scoped with `useGSAP` in `components/motion/`; reduced motion via `gsap.matchMedia`.
- M6: richer `content/projects.ts` entries and `work/[slug]` sections; M7: `content/` additions and a real contact pipeline.

