export interface ExperienceGroup {
  /** Optional sub-heading within a role, e.g. a program or product. */
  readonly title?: string;
  readonly bullets: readonly string[];
}

export interface Experience {
  readonly company: string;
  readonly role: string;
  readonly period: string;
  readonly groups: readonly ExperienceGroup[];
  readonly tech: readonly string[];
}

export const EXPERIENCE: readonly Experience[] = [
  {
    company: 'Raytheon Technologies (RTX)',
    role: 'Software Engineer II',
    period: 'June 2023 – Present',
    groups: [
      {
        title: 'Reusable Ground-Systems Visualization Framework',
        bullets: [
          `Develop and maintain a reusable Angular 20 visualization framework with 20+ reusable
           components and APIs used across 10+ RTX programs to build browser-based satellite
           data displays.`,
          `Reduced Largest Contentful Paint by 55% across production applications built with the
           framework by introducing lazy loading for components previously loaded at startup.`,
          `Led the framework's migration from Angular 18 to Angular 20, including adoption of
           zoneless change detection in its reference application and automated test environment.`,
        ],
      },
      {
        title: 'James Webb Space Telescope',
        bullets: [
          `Modernized seven legacy operational displays, originally developed for desktop
           systems in the 2000s, into browser-based Angular applications used by JWST operators.`,
          `Delivered end-to-end data-viewing features across Angular and Java-based Windows
           services, adding backend interfaces required by the browser applications.`,
          `Redesigned communication between the application and its Web Workers to eliminate
           race conditions that left displays stuck loading or produced inconsistent data.`,
          `Refactored a high-volume plotting component to reduce unnecessary chart updates and
           improve responsiveness during bursts of JWST telemetry.`,
        ],
      },
    ],
    tech: ['Angular', 'TypeScript', 'RxJS', 'Java', 'Web Workers'],
  },
  {
    company: 'Curve-10',
    role: 'Software Engineer · Senior Capstone',
    period: 'August 2022 – May 2023',
    groups: [
      {
        bullets: [
          `Led the frontend modernization of a legacy AngularJS application, rebuilding its
           primary interfaces in React.`,
          `Integrated the React frontend with Node.js APIs and a MongoDB data layer while
           coordinating development with company engineers and a student team.`,
        ],
      },
    ],
    tech: ['React', 'Node.js', 'MongoDB'],
  },
  {
    company: 'Raytheon Technologies (RTX)',
    role: 'Software Engineering Intern',
    period: 'May 2022 – August 2022',
    groups: [
      {
        bullets: [
          `Developed unit tests for an Angular/TypeScript application.`,
          `Implemented Java services and PostgreSQL queries to supply satellite data to a
           Cesium-based frontend viewer.`,
        ],
      },
    ],
    tech: ['Angular', 'Java', 'PostgreSQL', 'Cesium'],
  },
];

export const EDUCATION = {
  school: 'University of Colorado Boulder',
  degree: 'B.S. in Computer Science',
  period: 'August 2019 – May 2023',
} as const;
