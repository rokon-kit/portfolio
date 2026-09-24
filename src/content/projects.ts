import type { Project } from '@/types/content';

/**
 * Selected projects.
 *
 * Source of truth: docs/CONTENT.md §3 (Tier 1). Problem statements, approach
 * bullets, stacks, roles and repository URLs are taken from that document.
 * No latency figures, versions, deployment claims or outcome metrics are stated
 * because none are documented. Do not add any without a verifiable source.
 */
export const projects: readonly Project[] = [
  {
    slug: 'volunteering-platform',
    systemCode: 'SYSTEM 01 // CIVIC TECH',
    title: 'A Community-Driven Social Volunteering Platform',
    shortTitle: 'Volunteering Platform',
    role: 'Full-Stack Lead Engineer',
    roleTone: 'cyan',
    stack: ['Spring Boot', 'React', 'Tailwind CSS', 'PostgreSQL', 'Spring Security', 'JWT'],
    challenge:
      'Communities frequently face disconnected relief efforts, unstructured volunteer recruitment, and a lack of accountability in community help requests.',
    approachSummary:
      'Role-based access control with Spring Security and JWT, event discovery and volunteer team formation, impact tracking, and a PostgreSQL relational schema that keeps volunteer sign-ups transactionally consistent.',
    approach: [
      'Designed robust role-based access control (RBAC) via Spring Security and JWT tokens.',
      'Implemented event discovery, volunteer team formation, and real-time impact tracking.',
      'Relational schema modeling in PostgreSQL ensuring transactional consistency for volunteer sign-ups.',
    ],
    humanDimension:
      'Facilitates tangible grassroots aid, connecting individuals in need with local organizers.',
    facts: [
      { key: 'AUTH:', value: 'Spring Security · JWT · RBAC' },
      { key: 'DATA STORE:', value: 'PostgreSQL (relational)' },
      { key: 'HUMAN DIMENSION:', value: 'Connects people in need with local organizers' },
    ],
    repos: [
      {
        label: 'SOURCE REPO',
        href: 'https://github.com/rokon-rabbi/hands-on-volunteering-platform',
        kind: 'primary',
      },
    ],
    figure: {
      id: 'volunteering',
      tag: 'FIGURE 01.A',
      title: '// ARCHITECTURAL TOPOLOGY SCHEMATIC',
      footer: ['STACK: SPRING BOOT + REACT', 'AUTH: JWT + RBAC'],
      description:
        'Architecture diagram. A React client talks to a Spring Boot service, which enforces Spring Security with JWT-based role access and hosts event, team and impact features, and persists data in a PostgreSQL database.',
    },
    summary:
      'A full-stack platform connecting community organizers and volunteers, built with Spring Boot, React and PostgreSQL, with JWT authentication and role-based access control.',
  },
  {
    slug: 'courseflow',
    systemCode: 'SYSTEM 02 // INSTITUTIONAL WORKFLOW',
    title: 'CourseFlow — University Attendance & Academic Management System',
    shortTitle: 'CourseFlow',
    role: 'Full-Stack Software Engineer',
    roleTone: 'cyan',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'MySQL'],
    challenge:
      'University academic bureaucracy: attendance tracking, course evaluations, and exam clearances are traditionally paper-heavy, error-prone, and bottlenecked at administrative approvals.',
    approachSummary:
      'A multi-tier approval workflow across five roles — chairman, coordinators, course teachers, students and provost — with type-safe TypeScript domain models across the approval flow.',
    approach: [
      'Multi-tier hierarchical workflow engine: Chairman assigns coordinators; coordinators assign course teachers; teachers manage attendance matrices; students submit anonymous course feedback; provost verifies eligibility and issues digital exam clearances.',
      'Type-safe domain models in TypeScript preventing runtime state anomalies across complex approval flows.',
    ],
    humanDimension:
      'Replaces weeks of manual physical stamp queues with an intuitive, transparent digital workflow for faculty and students.',
    facts: [
      { key: 'ROLES:', value: 'Chairman to Provost (5 roles)' },
      { key: 'DATA STORE:', value: 'MySQL (relational)' },
      { key: 'HUMAN DIMENSION:', value: 'Transparent digital workflow instead of paper stamp queues' },
    ],
    repos: [
      {
        label: 'FRONTEND REPO (TS)',
        href: 'https://github.com/rokon-rabbi/university-project',
        kind: 'primary',
      },
      {
        label: 'BACKEND SERVER',
        href: 'https://github.com/rokon-rabbi/university-project-server',
        kind: 'secondary',
      },
    ],
    figure: {
      id: 'courseflow',
      tag: 'FIGURE 02.B',
      title: '// HIERARCHICAL APPROVAL WORKFLOW',
      footer: ['WORKFLOW: 5 ROLES', 'MODELS: TYPESCRIPT'],
      description:
        'Workflow diagram in five steps: the chairman assigns coordinators, coordinators assign course teachers, teachers manage attendance, students submit anonymous feedback, and the provost verifies eligibility and issues digital exam clearance.',
    },
    summary:
      'A university attendance and academic management system with a multi-role approval workflow, built with React, TypeScript, Node.js and MySQL.',
  },
  {
    slug: 'chemistry-calculator',
    systemCode: 'SYSTEM 03 // SCIENTIFIC DESKTOP COMPUTING',
    title: 'Chemistry Calculator — Scientific Desktop Computing Suite',
    shortTitle: 'Chemistry Calculator',
    role: 'Software Engineer',
    roleTone: 'amber',
    stack: ['Java', 'Java Swing', 'JavaFX'],
    challenge:
      'Students and laboratory researchers waste valuable calculation time balancing chemical reactions, calculating stoichiometric ratios, and modeling molarity and titration curves by hand.',
    approachSummary:
      'Chemical equations are balanced with matrix methods and linear system solvers in pure Java, behind a JavaFX / Swing desktop GUI that flags invalid formulas and computes molarity in real time.',
    approach: [
      'Algorithmic balancing of chemical equations using matrix balancing and linear system solvers in pure Java.',
      'Desktop GUI built with JavaFX / Swing providing immediate error highlighting for invalid chemical formulas and real-time molarity calculation.',
    ],
    humanDimension:
      'Enhances STEM educational accessibility and lab safety by reducing manual calculation errors.',
    facts: [
      { key: 'METHOD:', value: 'Matrix balancing · linear solvers' },
      { key: 'INTERFACE:', value: 'JavaFX / Swing desktop GUI' },
      { key: 'HUMAN DIMENSION:', value: 'Fewer manual calculation errors' },
    ],
    repos: [
      {
        label: 'JAVA REPOSITORY',
        href: 'https://github.com/rokon-rabbi/chemistry-calculator',
        kind: 'primary',
      },
    ],
    figure: {
      id: 'chemistry',
      tag: 'FIGURE 03.C',
      title: '// EQUATION BALANCING MATRIX',
      footer: ['METHOD: MATRIX BALANCING', 'RUNTIME: JAVA'],
      description:
        'Illustrative example of the method. The reaction Fe plus O2 yields Fe2O3 is written as two element-balance equations, and solving the linear system gives the balanced reaction 4 Fe plus 3 O2 yields 2 Fe2O3.',
    },
    summary:
      'A Java desktop suite that balances chemical equations with matrix and linear-system solvers and computes molarity, built with JavaFX and Swing.',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Previous and next projects in list order, wrapping around. */
export function getAdjacentProjects(slug: string): { previous: Project; next: Project } | undefined {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return undefined;
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  if (!previous || !next) return undefined;
  return { previous, next };
}
