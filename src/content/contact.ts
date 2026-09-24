import type { ContactDetails, InquiryOption } from '@/types/content';

/**
 * Contact channels. Source: docs/CONTENT.md §1 — email, LinkedIn, GitHub and phone
 * as verified from the resume audit. Only verified channels are listed; the old
 * site's placeholder social links are intentionally excluded.
 */
export const contact: ContactDetails = {
  email: 'rokonrabbi21@gmail.com',
  channels: [
    {
      id: 'email',
      icon: '✉',
      title: 'PRIMARY EMAIL',
      value: 'rokonrabbi21@gmail.com',
      href: 'mailto:rokonrabbi21@gmail.com',
      external: false,
    },
    {
      id: 'linkedin',
      icon: 'in',
      title: 'LINKEDIN PROFILE',
      value: 'linkedin.com/in/rokon1',
      href: 'https://www.linkedin.com/in/rokon1/',
      external: true,
    },
    {
      id: 'github',
      icon: 'gh',
      title: 'GITHUB REPOSITORIES',
      value: 'github.com/rokon-rabbi',
      href: 'https://github.com/rokon-rabbi',
      external: true,
    },
    {
      id: 'phone',
      icon: '☎',
      title: 'PHONE',
      value: '+880 1902 978060',
      href: 'tel:+8801902978060',
      external: false,
    },
  ],
  resume: {
    title: 'RESUME (PDF)',
    description: 'Career history, education and technical skills.',
    href: 'https://drive.google.com/file/d/1bnyD5ny00ZIAhz9msLT40ACmzdwyeXQW/view?usp=sharing',
  },
};

export const inquiryOptions: readonly InquiryOption[] = [
  { value: 'Full-time or contract role', label: 'Full-Time / Contract Role' },
  { value: 'Project collaboration', label: 'Project Collaboration' },
  { value: 'General conversation', label: 'General Discussion' },
];
