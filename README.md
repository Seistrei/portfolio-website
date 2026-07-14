# Heath Rohlman · Portfolio

**Live site: https://seistrei.github.io/portfolio-website/**

My personal portfolio, designed and built from scratch with **Angular 22**. Beyond describing my
work, the site is a sample of it: the same modern Angular I use professionally, applied to a
small codebase that can be read end to end.

## Technical highlights

- **Zoneless change detection.** No `zone.js`. All state is held in signals (`signal`,
  `computed`, signal `input()`s) with `OnPush` on every component.
- **Current Angular syntax throughout:** built-in control flow (`@if` / `@for`), and `@defer`
  for the decorative starfield.
- **Lazy routing.** The project detail page loads on demand, `withComponentInputBinding` binds
  the `:slug` route parameter directly to a signal input, and a functional guard redirects
  unknown slugs home.
- **View transitions** between routes.
- **Hand-written SCSS design system.** No UI framework. CSS custom properties drive the dark and
  light themes, and a pre-boot script applies the saved (or system) theme before Angular loads so
  there is no flash.
- **Canvas starfield** with twinkling parallax stars and occasional shooting stars. It is
  DPR-aware, pauses while the tab is hidden, and renders static under `prefers-reduced-motion`.
- **IntersectionObserver directives** for scroll-spy navigation and reveal-on-scroll animations.
- **Typed content model.** Everything the site says (profile, experience, projects, skills)
  lives in `src/app/data/` as typed TypeScript, fully separated from the components that render
  it.
- **Self-hosted variable fonts** (Space Grotesk, Inter, JetBrains Mono) and unit tests with
  **Vitest**.

## Project structure

```
src/app/
├── core/          # Theme service, scroll-spy + section directive, reveal directive
├── data/          # Typed site content: profile, experience, projects, skills
├── components/    # Header, footer, starfield, icon registry, project card
└── pages/
    ├── home/      # Hero, about, experience, projects, skills, contact sections
    └── project-detail/   # Lazy-loaded page for each project (/projects/:slug)
```

## Running locally

```bash
npm install
npm start        # dev server on http://localhost:4200
npm test         # unit tests (Vitest)
npm run build    # production build
```

## Deployment

Every push to `main` runs the test suite, builds the site, and deploys it to GitHub Pages through
[GitHub Actions](.github/workflows/deploy.yml), with a single-page-app fallback so project deep
links resolve.
