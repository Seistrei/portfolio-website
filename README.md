# Heath Rohlman — Portfolio

Personal portfolio site, designed and built from scratch on **Angular 22** as a working sample of
the modern Angular I use daily.

**Live dev server:** `npm start` → http://localhost:4200

## How it's built

- **Zoneless change detection.** No `zone.js`; all state lives in **signals** (`signal`,
  `computed`, signal `input()`s), with `OnPush` on every component.
- **New control flow** (`@if` / `@for`) and **`@defer`** (the decorative starfield loads on idle).
- **Lazy routes.** The project detail page is `loadComponent`-lazy, `withComponentInputBinding`
  binds the `:slug` param straight to a signal input, and a functional `CanActivateFn` guard
  redirects unknown slugs home.
- **View transitions** between routes (`withViewTransitions`, initial transition skipped).
- **Hand-written SCSS design system.** No UI framework. CSS custom properties drive a dark/light
  theme, and a pre-boot script in `index.html` applies the saved (or system) theme before Angular
  loads so there is never a flash.
- **Canvas starfield** with twinkling parallax stars and occasional shooting stars. DPR-aware,
  paused while the tab is hidden, and rendered static under `prefers-reduced-motion`.
- **IntersectionObserver directives** for scroll-spy nav highlighting and reveal-on-scroll
  animations.
- **Self-hosted variable fonts** (Space Grotesk, Inter, JetBrains Mono via Fontsource).
- **Vitest** unit tests (`npm test`).

## Structure

```
src/app/
├── core/          # Theme service, scroll-spy + section directive, reveal directive
├── data/          # Typed content: profile, experience, projects, skills
├── components/    # Header, footer, starfield, icon registry, project card, ...
└── pages/
    ├── home/      # Hero, about, experience, projects, skills, contact sections
    └── project-detail/   # Lazy-loaded per-project page (/projects/:slug)
```

All site content lives in `src/app/data/`. Edit those files to update copy, projects, or skills
without touching components.

## Commands

```bash
npm start        # dev server on :4200
npm run build    # production build → dist/portfolio-website
npm test         # vitest unit tests
```

## Deployment

Every push to `main` deploys automatically to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml): the workflow runs the unit tests,
builds with `--base-href /portfolio-website/`, copies `index.html` to `404.html` so deep links
(`/projects/...`) resolve, and publishes the artifact.

Live at: https://seistrei.github.io/portfolio-website/

If a custom domain is added later, update `--base-href` to `/`, the `canonical`/`og:url` tags in
`src/index.html`, and the custom domain in the repository's Pages settings.
