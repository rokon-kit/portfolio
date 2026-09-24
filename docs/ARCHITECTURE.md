# Technical Architecture Specification

## 1. High-Level Technology Stack

- **Framework:** Next.js (App Router, React 19 / 18, Server Components + Selective Client Components)
- **Language:** TypeScript (Strict mode enabled, zero `any` policy)
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
