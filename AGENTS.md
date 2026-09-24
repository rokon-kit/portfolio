# AGENTS.md — Project Governance & Engineering Guidelines

## 1. Project Context & Roles
- **Project Name:** Md. Rokonuzzaman Portfolio ("The Human Side of Engineering")
- **Project Owner:** Md. Rokonuzzaman
- **Professional Identity:** Full-Stack Software Engineer
- **Existing Website:** [https://rokonuzzaaman.web.app/](https://rokonuzzaaman.web.app/)
- **Project Concept:** *"The Human Side of Engineering"*
- **Vision:** Combine distinctive editorial design, exceptional frontend engineering, meaningful Three.js interactions, cinematic GSAP animations, and authentic personal storytelling.
- **Role Assignment:** Creative Director, Principal Frontend Engineer, and Technical Lead.
- **Workflow:** Phased, approval-gated milestones. Work only on the currently requested milestone; do not jump ahead.

---

## 2. Permanent Project Rules

1. **Originality:** Build a genuinely original personal portfolio, not a generic developer template.
2. **Human-Centered Credibility:** Prioritize human-centered storytelling and professional credibility over hollow gimmicks.
3. **Core Technology Stack:** Use Next.js App Router, TypeScript, GSAP, Three.js, React Three Fiber, and Tailwind CSS unless a justified technical decision requires a change.
4. **Content Integrity:** Use accurate professional content. Never fabricate experience, achievements, project metrics, screenshots, or credentials.
5. **Intellectual Property Respect:** Never copy an existing website's distinctive visual design or proprietary assets.
6. **Design Consistency:** Maintain consistent typography, colors, spacing, interaction patterns, and animation principles across all views and viewports.
7. **Accessibility, Mobile & Performance First:** Treat mobile design, accessibility (WCAG 2.1 AA), and performance (Core Web Vitals, 60fps animations) as core requirements, not afterthoughts.
8. **Anti-Cliche Aesthetic Directive:** Avoid generic purple-gradient developer aesthetics, floating laptops, random particle fields, and unnecessary decoration or animation for animation's sake.
9. **Engineering Standards:** Use modular, maintainable, production-quality TypeScript and React code with clear separation of concerns.
10. **Data Privacy & Security:** Never expose private employer data, internal infrastructure details, API secrets, private credentials, or production records.
11. **Scope Discipline:** Work only on the currently requested milestone. Do not independently start later milestones.
12. **Regression Prevention:** Before modifying existing functionality, inspect the current implementation and preserve previously approved behavior.
13. **Verification Standard:** Before declaring a milestone complete, run relevant tests, inspect actual browser output, and report verified results with concrete evidence.
14. **Design Decision Logging:** Document important design decisions in `docs/DESIGN_DECISIONS.md`.
15. **Progress & Issue Tracking:** Maintain `docs/PROGRESS.md` with completed work, remaining work, known issues, and the next milestone.
16. **Version Control & Checkpointing:** Create a Git checkpoint after each successfully verified milestone. Do not overwrite approved work without explaining why. Report failures and unfinished work accurately.

---

## 3. Mandatory Milestone Completion Report Format

At the conclusion of every milestone, provide a comprehensive report adhering strictly to this format:

1. **What was implemented:** Detailed breakdown of features, components, and assets delivered.
2. **What was verified:** Testing procedures, build validation, linting, visual and interaction verifications, and performance checks.
3. **Screenshots or browser evidence:** Visual/recording confirmation of browser rendering and interactions where applicable.
4. **Files created or modified:** Complete list of touchpoints in the repository.
5. **Remaining issues / Technical debt:** Unresolved bugs, limitations, or future considerations.
6. **Git checkpoint identifier:** Commit hash and message.

---

## 4. Documentation Architecture

All project documentation lives in the `docs/` directory:
- [DESIGN_DECISIONS.md](file:///home/rokon/Downloads/rokon-portfolio/docs/DESIGN_DECISIONS.md): Architectural Decision Records (ADRs) and design system rationales.
- [PROGRESS.md](file:///home/rokon/Downloads/rokon-portfolio/docs/PROGRESS.md): Current status, milestone tracker, and known issues.
- [RESEARCH.md](file:///home/rokon/Downloads/rokon-portfolio/docs/RESEARCH.md): Conceptual research, creative direction benchmarks, and existing site audit.
- [CONTENT.md](file:///home/rokon/Downloads/rokon-portfolio/docs/CONTENT.md): Authentic narrative, career progression, project case studies, and voice/tone guidelines.
- [ARCHITECTURE.md](file:///home/rokon/Downloads/rokon-portfolio/docs/ARCHITECTURE.md): Technical architecture, directory conventions, animation pipelines, 3D scene lifecycles, and performance budget.
- [QA_REPORTS.md](file:///home/rokon/Downloads/rokon-portfolio/docs/QA_REPORTS.md): Test plans, verification logs, cross-browser/device checks, and accessibility audits.
