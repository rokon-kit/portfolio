# CLAUDE.md — Working Instructions for Claude Code

Project: Md. Rokonuzzaman's portfolio, *"The Human Side of Engineering"* — Full-Stack Software Engineer, Dhaka, Bangladesh.

This file is loaded every session. `AGENTS.md` (permanent governance, 16 rules, completion-report format) still applies in full and is **not** replaced by this file. Read `docs/PROGRESS.md` first for current status, limitations and next steps; `docs/CLAUDE_HANDOFF.md` is the pre-M3 audit snapshot and holds the roadmap and owner-decision list.

## Where things stand
- Milestones 0–3 are done and verified (governance, research, design system + prototype, **production application foundation**). Current tracker: `docs/PROGRESS.md`. **Milestone 4 has not started and must not start until the owner explicitly asks.**
- The Next.js app exists (`src/`). GSAP, Three.js and React Three Fiber are **not installed yet** by design (ADR-008) — install them in the milestone that uses them.
- `prototype/` is the M2 static design reference — keep it, never edit it, never ship its copy. `public/` holds the monogram and favicon SVGs.
- Roadmap M3–M10 is in `docs/CLAUDE_HANDOFF.md` §10 and ADR-007. As-built structure: `docs/ARCHITECTURE.md` §6.

## Non-negotiable working rules

1. **Preserve approved design decisions.** The approved identity is **The Living Blueprint** (`docs/DESIGN_SYSTEM.md` + `prototype/`). Do not change the palette, typography, layout language, monogram, or motion language without an ADR in `docs/DESIGN_DECISIONS.md` and explicit owner approval. Do not introduce other directions (e.g. "SYSTEMS / HUMAN" does not exist in this repo). Where `DESIGN_SYSTEM.md` and `prototype/styles.css` disagree, the prototype CSS wins — see handoff §1.2.
2. **One milestone at a time.** Work only on the milestone the owner has requested. Never start, scaffold, or "pre-build" a later one. If a task seems to need later-milestone work, stop and say so.
3. **No unrelated refactoring.** Change only what the current task requires. Do not reformat, rename, or restructure existing files, docs, or assets outside scope. Before modifying existing behaviour, read the current implementation and preserve what was approved.
4. **Accurate professional content only.** Facts come from `docs/CONTENT.md`. Never invent or embellish experience, titles, metrics, latencies, versions, deployment status, outcomes, screenshots, or credentials. If a claim is unsourced, remove it or ask — do not soften it into plausible-sounding copy. Illustrative code/diagrams must be labelled illustrative. Do not confuse the owner with anyone else; contact details and identities are confirmed by the owner, not inferred.
5. **Production-quality TypeScript and React.** Strict TS, no `any`, no `@ts-ignore` without a written reason. Server Components by default; `'use client'` only where interaction or browser APIs require it. Small, typed, single-purpose modules matching the structure in `docs/ARCHITECTURE.md`. Match surrounding code style, naming, and comment density.
6. **Performance and accessibility first.** WCAG 2.1 AA, keyboard operability, visible focus, semantic landmarks, ≥44px touch targets, contrast ≥ AA (recompute; don't trust documented numbers), `prefers-reduced-motion` honoured, CLS 0, LCP < 2.0s, INP < 100ms, 60fps animation. Three.js: client-only, dynamic import, dispose on unmount, pause off-screen, mobile tiering, WebGL-unavailable fallback. GSAP: scoped in `useGSAP`/`gsap.context`, register once, kill triggers on cleanup. Avoid the banned clichés (purple gradients, floating laptops, random particle fields, skill-percentage bars).
7. **Verify in a real browser.** Type-checking and a green build are necessary, not sufficient. Render the actual page (headless Chrome is installed) at 375 / 768 / 1024 / 1440, check the console, exercise the interactions with real input, and look at the screenshots yourself. Say explicitly what was *not* tested.
8. **Report actual results.** Quote real command output, real numbers, real failures. Never write "should work", "looks good", or "verified" for something not run. If a check was skipped or a test fails, say so plainly.
9. **Keep documentation current.** Update `docs/PROGRESS.md`, `docs/DESIGN_DECISIONS.md` (ADRs), `docs/QA_REPORTS.md`, and `docs/ARCHITECTURE.md` when the work changes them. Preserve existing documentation; correct inaccuracies through explicit, explained edits, never silent rewrites.
10. **Never claim completion without verification.** A milestone is complete only when its exit criteria were run and observed. Then deliver the six-part report defined in `AGENTS.md` §3 (implemented / verified / browser evidence / files changed / remaining issues / Git checkpoint) and make the Git checkpoint.

## Guardrails
- Do not delete or overwrite existing work (`docs/`, `prototype/`, `public/`, `AGENTS.md`). `AGENTS.md` changes only through an explicit, reviewed edit. Explain and get approval before replacing anything approved.
- Do not install packages unnecessarily. Check current versions before choosing them, record stack decisions in an ADR, prefer deferring heavy dependencies (GSAP, Three.js, R3F) to the milestone that uses them.
- All copy lives in `src/content/` and must trace to `docs/CONTENT.md`; `npm run check:content` blocks known-bad claim patterns. Never re-introduce the prototype's unverified claims (handoff §8.C).
- No secrets, tokens, private employer data, or internal infrastructure details in the repo. Use environment variables; commit `.env.example` only.
- Confirm before anything outward-facing or hard to reverse (pushing, publishing, deploying, sending messages, deleting). Commit only when asked or at a verified milestone checkpoint.
- Ask, don't guess, on items listed in handoff §12 (hosting target, colour fix, content facts, phone visibility, etc.).

## Commands
- `npm run dev` — dev server. Open **`http://localhost:3000`, not `127.0.0.1`**: Next 16 blocks cross-origin dev resources, so React will not hydrate and every interactive control will silently do nothing.
- `npm run build` · `npm run start` — production build / serve (audit against this; it has no dev-server noise).
- `npm run typecheck` · `npm run lint` · `npm run check:content` · `npm test` — individual checks. **`npm run verify`** runs all of them plus the build; run it before declaring anything done.
- Browser audit: `npm i --no-save axe-core`, start the production server, then `node scripts/qa/browser-audit.mjs --base http://localhost:3100 --out docs/qa/<milestone>`. It drives real mouse/keyboard input through headless Chrome and writes screenshots + `audit-results.json`. Assert `hydrated: true` before trusting any interaction result.
- Tooling on this machine: Node 22, npm 10, Google Chrome (headless), Firefox, Python 3 (PIL). pnpm/yarn are not installed. Use `/bin/ls` rather than bare `ls` (it may be aliased and can hang in scripted commands).
- Stopping a server: find the PID from the port — `ss -ltnp | grep ':3100'` — and `kill` it. **Do not use `pkill -f` or `pgrep -f`** with a pattern that also appears in your own command text; it matches and kills the shell running it.
- `next.config.ts` sets `agentRules: false` because Next 16.3's dev server otherwise appends a generated block to `AGENTS.md`. If `git status` ever shows `AGENTS.md` modified, restore it with `git checkout -- AGENTS.md` and check that setting.

## Documentation map (`docs/`)
`CLAUDE_HANDOFF.md` status/plan/issues · `DESIGN_SYSTEM.md` tokens & components · `DESIGN_DECISIONS.md` ADRs · `CONTENT.md` verified facts · `ARCHITECTURE.md` target + as-built structure · `PROGRESS.md` tracker · `QA_REPORTS.md` verification logs · `RESEARCH.md` benchmarks · `CREATIVE_DIRECTIONS.md` the three concepts.
