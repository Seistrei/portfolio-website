export interface SocialLink {
  readonly id: 'github' | 'linkedin' | 'email';
  readonly label: string;
  readonly url: string;
}

export const PROFILE = {
  name: 'Heath Rohlman',
  role: 'Software Engineer II · RTX',
  email: 'heath.rohlman@gmail.com',
  resumeUrl: 'resume.pdf',
  sourceUrl: 'https://github.com/Seistrei/portfolio-website',
  tagline:
    'I build the web software that satellite operators rely on. At RTX I develop a reusable ' +
    'Angular visualization framework for browser-based ground-system displays, and I previously ' +
    'modernized the operational displays used by James Webb Space Telescope operators. Outside ' +
    'of work I build complete systems of my own, most recently an autonomous AI companion for ' +
    'Discord.',
  links: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/Seistrei' },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/heath-rohlman-7a00741b8/',
    },
    { id: 'email', label: 'Email', url: 'mailto:heath.rohlman@gmail.com' },
  ] as readonly SocialLink[],
} as const;

export const ABOUT_PARAGRAPHS: readonly string[] = [
  `I graduated from CU Boulder with a B.S. in Computer Science in 2023 and joined Raytheon (RTX)
   as a software engineer. I work on a reusable Angular visualization framework that multiple RTX
   programs use to build browser-based satellite data displays. I led the framework's migration
   from Angular 18 to Angular 20, including the adoption of zoneless change detection, and
   reduced a production application's Largest Contentful Paint by 55% by introducing lazy
   loading.`,
  `Earlier at RTX I worked on the James Webb Space Telescope, modernizing operational displays
   originally written for 2000s-era desktop systems into browser-based Angular applications used
   by JWST operators. The work spanned the full stack: building data-viewing features across the
   Angular frontend and Java services, eliminating Web Worker race conditions that caused
   displays to load inconsistently, and keeping a high-volume plotting component responsive
   during large bursts of telemetry.`,
  `Outside of work I build substantial personal projects. The largest is Nykta, an autonomous AI
   companion for Discord built as six event-driven microservices, with long-term memory, a
   permission-gated autonomy system, and an Angular monitoring dashboard. I also design complex
   Overwatch 2 game modes, and I write fiction.`,
];
