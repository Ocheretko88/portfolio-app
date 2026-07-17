import { Resume } from '../models/resume.models';

/**
 * Single source of truth for CV content.
 *
 * Sourced from Iryna Ocheretko's 2026 CV. Client and product names beyond the
 * named employers are intentionally omitted per confidentiality obligations —
 * the work is described by domain and scope only.
 */
export const RESUME: Resume = {
  profile: {
    name: 'Iryna Ocheretko',
    title: 'Full-Stack Developer',
    location: 'Ukraine · Remote',
    summary:
      'Full-stack developer with 4.5 years of commercial software experience — three of them ' +
      'full-stack — building and maintaining complex, multi-tenant web applications end to end, ' +
      'from single-page interfaces through backend APIs, relational data models and deployment. ' +
      'I own features across the whole stack: shipping new functionality, integrating third-party ' +
      'services, hardening authentication and access control, optimising performance, and ' +
      'diagnosing and fixing bugs in live systems.',
    email: 'iryna.ocheretko@gmail.com',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/Ocheretko88',
        handle: 'Ocheretko88',
        icon: 'pi pi-github',
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/ocheretko/',
        handle: 'in/ocheretko',
        icon: 'pi pi-linkedin',
      },
      {
        label: 'Telegram',
        href: 'https://t.me/irynaocher',
        handle: '@irynaocher',
        icon: 'pi pi-telegram',
      },
      {
        label: 'Email',
        href: 'mailto:iryna.ocheretko@gmail.com',
        handle: 'iryna.ocheretko@gmail.com',
        icon: 'pi pi-envelope',
      },
    ],
  },

  stats: [
    { value: '4.5 yrs', label: 'Commercial development (3 full-stack)' },
    { value: '700+', label: 'Development tasks delivered' },
    { value: '4', label: 'Production platforms' },
    { value: '~97%', label: 'Task completion rate' },
  ],

  skillGroups: [
    {
      name: 'Frontend',
      items: [
        'Angular 21',
        'TypeScript',
        'Signals',
        'NgRx Signals',
        'PrimeNG',
        'RxJS',
        'Responsive UI',
        'PWA & Service Workers',
        'Data visualisation',
        'WCAG AA / a11y',
      ],
    },
    {
      name: 'Backend',
      items: [
        'Python (FastAPI)',
        'PHP (Laravel)',
        'Go',
        'REST API design',
        'Business logic',
        'Request validation',
        'Webhooks & callbacks',
        'Scheduled jobs',
      ],
    },
    {
      name: 'Data',
      items: [
        'PostgreSQL',
        'MySQL',
        'MongoDB',
        'SQLAlchemy',
        'Alembic',
        'Schema design & migrations',
        'Query optimisation',
        'Caching',
        'CSV export',
      ],
    },
    {
      name: 'Security',
      items: [
        'Cloud identity providers',
        'Token / session management',
        'Sanctum',
        'Role & permission access control',
        'Route guards',
        'Securing middleware',
        'Data encryption',
      ],
    },
    {
      name: 'Platform & tooling',
      items: [
        'Docker',
        'Multi-tenant architecture',
        'Split-database design',
        'HTML-to-PDF generation',
        'Deployment (staging & prod)',
        'Git',
        'Postman',
        'DBeaver',
      ],
    },
  ],

  experience: [
    {
      company: 'Patternica',
      title: 'Senior Full-Stack Developer',
      period: 'Jun 2023 – Present',
      track: 'Python & Angular · Jun 2025 – Present',
      highlights: [
        'Built a multi-tenant SaaS application from scratch on a split-database setup: one shared database for authentication and routing, and separate database instances per client, linked via UUIDs.',
        'Implemented token-based authentication with a cloud identity provider, writing custom frontend route guards and backend permission checks to secure API endpoints.',
        'Isolated user sessions by hosting the client-facing app on a separate subdomain, preventing auth-state collisions for users holding administrative roles.',
        'Developed analytics dashboards for ad impressions and financial metrics, including interactive 7-day trend graphs and custom time-zone-aware calculation logic.',
        'Built secure document workflows: single-use token URLs for public access, webhooks for automated messaging, and dynamic HTML-to-PDF invoice generation.',
      ],
      stack: [
        'Python (FastAPI)',
        'Angular 21',
        'PrimeNG',
        'Signals',
        'PostgreSQL',
        'SQLAlchemy',
        'Alembic',
        'Docker',
      ],
    },
    {
      company: 'Patternica',
      title: 'Full-Stack Developer',
      period: 'Jun 2023 – Present',
      track: 'PHP & Angular · Jun 2023 – Present',
      highlights: [
        'Added production-ready features across backend and frontend for live web applications.',
        'Optimised performance by refactoring heavy database queries and minimising API payloads.',
        'Migrated legacy customer applications to modern Laravel and Angular setups with no data loss or downtime.',
      ],
      stack: ['PHP (Laravel)', 'Angular', 'Nebular', 'PostgreSQL', 'MySQL'],
    },
    {
      company: 'Axon',
      title: 'GoLang & PHP Developer',
      period: 'Nov 2022 – May 2023',
      highlights: [
        'Maintained backend REST APIs in PHP/Laravel and concurrent microservices in Go.',
        'Containerised local and production setups with Docker to keep environments consistent across teams.',
        'Managed data persistence and wrote queries across relational (PostgreSQL) and non-relational (MongoDB) stores.',
      ],
      stack: ['Go', 'PHP 8', 'Laravel 8', 'Docker', 'PostgreSQL', 'MongoDB'],
    },
    {
      company: 'Axon',
      title: 'Trainee PHP Developer',
      period: 'Mar 2022 – Nov 2022',
      highlights: [
        'Added core CRUD features and endpoints to existing RESTful API services.',
        'Debugged SQL queries and verified API behaviour with DBeaver and Postman.',
      ],
      stack: ['PHP 8', 'Laravel 8/9', 'PostgreSQL', 'Docker'],
    },
  ],

  education: [
    {
      institution: 'Beetroot Academy',
      qualification: 'Back-End (PHP, Laravel) Developer',
      period: 'Aug 2021 – Dec 2021',
    },
    {
      institution: 'National Dragomanov State Pedagogical University',
      qualification: "Master's degree — Teaching English as a Foreign Language",
    },
    {
      institution: 'Uman State Pedagogical University',
      qualification: "Bachelor's degree — Teaching English as a Foreign Language",
    },
  ],

  certifications: [
    {
      name: "Go: The Complete Developer's Guide (Golang)",
      issuer: 'Udemy',
      issued: 'Oct 2022',
      credentialUrl: 'https://www.udemy.com/certificate/UC-80a362c1-f87f-4d4f-b6c5-59e63f0b1e9d/',
    },
    {
      name: 'Back-End (PHP, Laravel) Developer',
      issuer: 'Beetroot Academy',
      issued: 'Dec 2021',
      credentialUrl: 'https://lms.beetroot.academy/diploma/ckrdibu7jsawj0724v4rjcixv',
    },
    {
      name: 'CAE — Cambridge English: Advanced',
      issuer: 'British Council Ukraine',
      issued: 'Mar 2012',
    },
  ],
};
