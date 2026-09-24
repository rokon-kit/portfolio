import type { NavItem, Profile } from '@/types/content';

/** Source: docs/CONTENT.md §1 and the approved Milestone 2 hero copy. */
export const profile: Profile = {
  name: 'Md. Rokonuzzaman',
  title: 'Full-Stack Software Engineer',
  shortTitle: 'Full-Stack Engineer',
  location: {
    city: 'Dhaka',
    country: 'Bangladesh',
    timezone: 'UTC+6',
    latitude: 23.8103,
    longitude: 90.4125,
  },
  eyebrow: 'THE HUMAN SIDE OF ENGINEERING',
  headline: [
    'Architecting ',
    { text: 'resilient', tone: 'italic' },
    ' systems where robust code serves ',
    { text: 'human purpose', tone: 'highlight' },
    '.',
  ],
  summary: [
    'I am ',
    { text: 'Md. Rokonuzzaman', tone: 'strong' },
    ', a full-stack software engineer based in Dhaka, Bangladesh. With a formal Software Engineering degree from NSTU, I build end-to-end digital architectures—from type-safe backends in ',
    { text: 'Java & Spring Boot', tone: 'strong' },
    ' to precision frontends in ',
    { text: 'TypeScript, React & Next.js', tone: 'strong' },
    '.',
  ],
  ethos: {
    quote: 'In every experience, from the grandest to the smallest, lies an opportunity to learn and grow.',
    focus: 'FOCUS: SCALABLE ARCHITECTURE · EMPATHETIC DESIGN · ZERO BLOAT',
  },
  ribbon: {
    tag: 'ARCHITECTURAL SPECIFICATION 2026 // PERSONAL DOSSIER',
    // The degree start year (2018 vs 2019) is unresolved in docs/CONTENT.md, so no year is stated here.
    note: 'NSTU SOFTWARE ENGINEERING · DHAKA, BD',
  },
  /**
   * Owner-controlled statement. The approved design specifies an availability
   * badge; flip `open` to false to remove it. Confirm wording before launch.
   */
  availability: {
    open: true,
    label: 'AVAILABLE',
    description: 'Open to full-stack engineering roles and collaborations',
  },
};

/** Home-page sections in reading order. Ids match the section `id` attributes. */
export const navItems: readonly NavItem[] = [
  { id: 'hero', index: '01', label: 'Overview', drawerLabel: 'Overview & Blueprint' },
  { id: 'selected-works', index: '02', label: 'Works', drawerLabel: 'Selected Works (Dossiers)' },
  { id: 'background', index: '03', label: 'Background', drawerLabel: 'Experience & Education' },
  { id: 'systems-topology', index: '04', label: 'Architecture', drawerLabel: 'Full-Stack Layers' },
  { id: 'contact-dossier', index: '05', label: 'Contact', drawerLabel: 'Contact & Direct Connection' },
];
