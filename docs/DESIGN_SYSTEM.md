# Design System & Visual Specification: "The Living Blueprint"

*Project: Md. Rokonuzzaman Portfolio — "The Human Side of Engineering"*
*Approved Creative Direction: Direction 1 — The Living Blueprint (Architectural Swiss Grid & Systems Graph)*

---

## 1. Visual Identity & Brand Concept

### A. The Core Metaphor
Software engineering is the architecture of the digital era. Just as architectural blueprints balance mathematical rigor, materials science, structural integrity, and human habitation, full-stack software balances relational data models, concurrency, server architecture, and human ergonomics.

### B. Custom Monogram & Favicon
- **Concept:** The **"Architectural R"** ligature.
- **Visual Structure:** A bespoke geometric letterform combining the capital letter **"R"** (for Rokonuzzaman) constructed from architectural drafting lines, coordinate crosshairs (`+`), and an open structural bracket (`[` `]`).
- **Favicon Implementation:** Scalable SVG with high-contrast drafting white (`#F1F5F9`) stroke on an architectural slate square (`#0B0E14`) with a precision cyan focal dot (`#38BDF8`).
- **Asset Locations:**
  - Favicon: `public/favicon.svg`
  - Brand Monogram: `public/monogram.svg`

---

## 2. Color Palette & Token Architecture

The color system rejects generic purple/neon gradients in favor of an architectural drafting palette: high-contrast dark slate substrates, warm drafting paper tones, precision blueprint cyan, and tactical amber status lights.

### Primary Palette (Tokens)
| Token Name | Hex Value | Semantic Role | Contrast Ratio against #0B0E14 |
|---|---|---|---|
| `--color-canvas` | `#0B0E14` | Primary viewport background (Architectural Slate) | N/A (Base) |
| `--color-surface` | `#12161F` | Sub-surface panels, headers, and section containers | 1.15:1 |
| `--color-surface-elevated` | `#181D27` | Dossier cards, modals, and telemetry containers | 1.35:1 |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.08)` | Structural grid hairlines and divider rules | N/A |
| `--color-border-active` | `rgba(56, 189, 248, 0.35)` | Interactive hover borders and active module focus | N/A |
| `--color-text-primary` | `#F1F5F9` | Display headlines and primary narrative text (Drafting Paper White) | **14.8:1** (WCAG AAA) |
| `--color-text-secondary` | `#94A3B8` | Body paragraphs, article descriptions, and sub-headings | **7.2:1** (WCAG AAA) |
| `--color-text-dim` | `#64748B` | System metadata, timestamps, and architectural coordinates | **4.6:1** (WCAG AA) |

### Accent & Telemetry Palette
| Token Name | Hex Value | Role & Usage |
|---|---|---|
| `--color-accent-cyan` | `#38BDF8` | Blueprint Precision Cyan — primary interactive highlights, active tabs, buttons |
| `--color-accent-blue` | `#2563EB` | Architectural Cobalt — structural node connectors, diagram paths |
| `--color-accent-amber` | `#F59E0B` | Tactical Amber — status highlights, human insight callouts, warning states |
| `--color-accent-green` | `#10B981` | Phosphor Green — live operational indicators ("Open to Opportunities", API 200 OK) |

---

## 3. Typography & Type Scale

### Font Family Roles
1. **Display & Editorial Headlines:** `Newsreader` / `Playfair Display` (High-contrast editorial serif, 700 / italic)
   - *Purpose:* Evokes classic architectural monographs, technical publications, and thoughtful human voice.
2. **Body & Interface Text:** `Inter` / `Geist Sans` (System sans-serif, 400, 500, 600)
   - *Purpose:* High-legibility UI text, article paragraphs, and form elements.
3. **Telemetry, Code & Coordinates:** `JetBrains Mono` / `Geist Mono` (Precision monospace, 400, 500)
   - *Purpose:* Architectural coordinates (`LAT 23.81° N / LON 90.41° E`), tech stack tags, database schema properties, and telemetry metrics.

### Fluid Modular Type Scale
All sizes use fluid CSS `clamp()` to scale proportionally across mobile (375px), tablet (768px), and desktop (1440px+):

```css
:root {
  --font-display: 'Newsreader', 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace;

  --text-display: clamp(2.5rem, 5vw + 1rem, 4.5rem);       /* Hero headline */
  --text-h1:      clamp(2.0rem, 3.5vw + 0.75rem, 3.25rem);  /* Section titles */
  --text-h2:      clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem);   /* Subsection headers */
  --text-h3:      clamp(1.2rem, 1.5vw + 0.5rem, 1.5rem);    /* Card / Dossier titles */
  --text-body-lg: clamp(1.0625rem, 1vw + 0.5rem, 1.25rem);  /* Hero subheadings */
  --text-body:    1rem;                                     /* Standard body copy (16px) */
  --text-sm:      0.875rem;                                 /* Supporting text (14px) */
  --text-meta:    0.75rem;                                  /* Monospace telemetry (12px) */
}
```

---

## 4. Editorial Layout & Swiss Grid System

### Grid Principles
- **Asymmetric 12-Column Grid:** Allows flexible composition between wide narrative text columns and narrow architectural telemetry rails.
- **Architectural Hairlines:** Subtle 1px borders (`rgba(255, 255, 255, 0.08)`) frame content containers like architectural drafting plates.
- **Corner Brackets:** Interactive cards feature subtle L-shaped drafting crosshairs in corners, accentuating the blueprint motif.
- **Fluid Container Margins:** `clamp(1.25rem, 4vw, 4rem)` padding ensures generous whitespace on large monitors and clean edge padding on mobile devices.

### Spacing Rhythm (8pt Baseline)
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px
- `space-12` = 48px
- `space-16` = 64px
- `space-24` = 96px
- `space-32` = 128px

---

## 5. UI Components & Interactive States

### A. Primary Action Button ("Blueprint CTA")
- **Default:** Precision Cyan background (`#38BDF8`), dark slate text (`#0B0E14`), monospace label, subtle 1px border.
- **Hover:** Elevation with 2px translateY, ambient cyan drop-shadow (`box-shadow: 0 0 20px rgba(56, 189, 248, 0.35)`).
- **Active / Pressed:** 1px depress with tactile recoil.

### B. Secondary Action Button ("Drafting Outline")
- **Default:** Transparent background, hairline border (`1px solid rgba(255, 255, 255, 0.16)`), drafting paper white text.
- **Hover:** Border shifts to Cyan (`#38BDF8`), subtle background wash (`rgba(56, 189, 248, 0.08)`).

### C. System Dossier Card
- **Structure:**
  - Header: System index (`SYSTEM 01 // CORE PLATFORM`), status badge, and tech stack tags.
  - Body: Project title in serif, architectural description, and human problem/solution cards.
  - Telemetry Bar: Database schema type, role-based auth spec, and real-world impact metric.
  - Actions: Interactive "Inspect Architecture" tab and repository/demo links.
- **Interactive States:** Corner crosshairs illuminate cyan on hover; preview image expands with subtle zoom (1.03).

### D. Navigation Bar ("The Precision Rail")
- **Desktop:** Sticky top bar with architectural glassmorphism (`backdrop-filter: blur(16px)`), Monogram on the left, coordinate telemetry in center, nav links and status badge ("Available for New Challenges") on right.
- **Mobile:** Fixed compact bar with Monogram, status badge, and clean drawer toggle with full-screen architectural overlay.

---

## 6. Three.js & WebGL Art Direction

### Hero Scene Specification
- **Object:** Isometric 3D Architectural Node Graph / Digital Building.
- **Visual Style:** Clean wireframe blueprint transitioning into solid frosted glass and dark obsidian structural pillars.
- **Lighting:**
  - Ambient base: Deep cool slate (`#0B132B`, intensity 0.6).
  - Key light: Blueprint cyan directional light (`#38BDF8`, intensity 1.8) casting long geometric shadows.
  - Rim light: Subtle warm amber accent (`#F59E0B`, intensity 0.8) highlighting edge geometry.
- **Interaction:**
  - Passive: Slow, elegant floating oscillation (3 degrees pitch/yaw).
  - Active: Cursor tracking tilts the isometric plane smoothly.
  - Scroll scrub: Layers assemble sequentially as the user reads down the page.
- **Performance Budget:** Maximum 20,000 polygons, instanced buffer geometry, mobile fallbacks with reduced DPR (1.0).

---

## 7. GSAP Motion Language

- **Core Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (equivalent to `power3.out` with strong initial impulse and silky deceleration).
- **Text Entrances:** Masked vertical reveal (`y: '100%' -> '0%'`) with 0.03s stagger per line.
- **Hairline Dividers:** SVG `stroke-dashoffset` draws left-to-right on viewport entry (`expo.inOut`, duration 0.8s).
- **Telemetry Counters:** Numeric tickers rapidly counting up to target metrics (e.g. `00` -> `15+` projects, `100%` type safety).
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is active, all position shifts and zooms are replaced with subtle instant opacity transitions.

---

## 8. Mobile & Responsive Composition Principles

- **Single-Column Fluidity:** Double-column editorial spreads collapse into a sequential narrative stack.
- **Touch-First Hit Targets:** All buttons and interactive tabs maintain a minimum 44x44px touch bounding box.
- **Zero Horizontal Overflow:** Strict `overflow-x: hidden` enforcement with reserved widths for monospace coordinates.
- **Battery & Thermal Consideration:** Canvas frame rates throttled when out of viewport; heavy post-processing disabled on mobile devices.
