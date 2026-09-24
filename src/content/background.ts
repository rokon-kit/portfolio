import type { Education, Experience, Metric } from '@/types/content';
import { projects } from './projects';

/** Source: docs/CONTENT.md §4 (Verified Professional Experience). */
export const experience: Experience = {
  organization: 'Barcodetech Automation',
  role: 'Software Engineer Intern',
  period: 'July 2023 – November 2023',
  duration: '5 months',
  location: 'Dhaka, Bangladesh',
  focus:
    'Frontend engineering, component architecture, and GrapesJS drag-and-drop web builder integration.',
  contributions: [
    'Developed custom block components and layout presets within GrapesJS.',
    'Integrated front-end editing interfaces into internal automation systems.',
    'Collaborated with senior engineers on component reusability and responsive UI design.',
  ],
};

/**
 * Source: docs/CONTENT.md §2. The degree start year is unresolved between the
 * resume (Dec 2018) and the existing site (2019), so only the end year is stated.
 */
export const education: Education = {
  institution: 'Institute of Information Technology (IIT), Noakhali Science and Technology University (NSTU)',
  degree: 'B.Sc. in Software Engineering',
  cgpa: '3.34',
  period: 'Completed 2024',
  certifications: [
    { title: 'Web Development', issuer: 'Programming Hero', period: '2022–2023' },
    { title: 'Web Design', issuer: 'IIT, NSTU', period: '2019–2020' },
    { title: 'Graphic Design', issuer: 'ICT Division, LEDP', period: '2019–2021' },
  ],
};

/**
 * Hero telemetry tiles. Every value is either documented in docs/CONTENT.md or
 * derived from the content itself; nothing here is an estimate.
 * The repository count is the figure recorded in the 2026-09-24 GitHub audit.
 */
export const heroMetrics: readonly Metric[] = [
  { value: '5 MO', label: 'ENGINEERING INTERNSHIP // 2023' },
  { value: education.cgpa, label: 'CGPA // B.SC. SWE (NSTU)' },
  { value: '39', label: 'PUBLIC GITHUB REPOSITORIES' },
  { value: String(projects.length), label: 'FEATURED SYSTEMS BELOW' },
];
