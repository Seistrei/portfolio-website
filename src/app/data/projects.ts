export interface ProjectStat {
  readonly value: string;
  readonly label: string;
}

export interface ProjectLink {
  readonly label: string;
  readonly url: string;
}

export interface Project {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly tagline: string;
  /** Short card copy for the projects grid. */
  readonly summary: string;
  /** Longer paragraphs for the detail page. */
  readonly overview: readonly string[];
  readonly highlights: readonly string[];
  readonly tech: readonly string[];
  readonly stats: readonly ProjectStat[];
  readonly links: readonly ProjectLink[];
  readonly featured: boolean;
}

export const PROJECTS: readonly Project[] = [
  {
    slug: 'jwst-operational-displays',
    name: 'JWST Operational Displays',
    category: 'Mission Operations',
    tagline: 'Browser-based displays used by James Webb Space Telescope operators',
    summary: `Professional work at RTX: modernizing the operational displays used by James Webb
      Space Telescope operators, from desktop software originally written in the 2000s into
      browser-based Angular applications. Seven legacy displays modernized and three new
      operational components built, delivered end to end across Angular frontends and Java
      services.`,
    overview: [
      `The James Webb Space Telescope is operated through a suite of operational displays, much
       of it first written for desktop systems in the 2000s, when JWST was still in its planning
       phase. That software was still in service when the telescope launched in 2021. At RTX I
       worked on the effort replacing it, modernizing the displays into browser-based Angular
       applications used by JWST operators.`,
      `I modernized seven legacy displays and built three new major operational components: a
       monitor for activity events from the observatory, a viewer for a queue of commands, and a
       display operators use to watch the health of the application's connection to its server.
       The work regularly crossed the stack boundary: the browser applications needed backend
       interfaces that did not exist yet, so I added them to the Java-based Windows services
       that supply the data.`,
      `The hardest problems were reliability problems. JWST telemetry arrives in bursts, and a
       single display is expected to keep up with roughly a thousand new table entries per
       second. I redesigned the communication between the application and its Web Workers to
       eliminate race conditions that could leave displays stuck loading or showing inconsistent
       data, and refactored a high-volume plotting component to drop unnecessary chart updates
       so displays stay responsive during those bursts.`,
      `This is professional work on an operational program, so unlike the personal projects on
       this site there is no public repository or live demo. Everything here is described at the
       same level of detail as my resume.`,
    ],
    highlights: [
      `Modernized seven operational displays, originally desktop applications from the 2000s,
       into browser-based Angular applications used by JWST operators.`,
      `Designed and built three new major operational components: an activity-event monitor, a
       command-queue viewer, and a connection-health display operators use to confirm the
       application's link to its server.`,
      `Redesigned communication between the application and its Web Workers to eliminate race
       conditions that left displays stuck loading or produced inconsistent data.`,
      `Refactored a high-volume plotting component to reduce unnecessary chart updates and keep
       displays responsive during bursts of telemetry.`,
      `Delivered data-viewing features end to end, adding the backend interfaces the browser
       applications required to the Java-based Windows services behind them.`,
    ],
    tech: ['Angular', 'TypeScript', 'RxJS', 'Web Workers', 'Java'],
    stats: [
      { value: '7', label: 'legacy displays modernized' },
      { value: '3', label: 'new operational components' },
      { value: '~1,000', label: 'new table rows per second' },
      { value: '2000s', label: 'era of the software replaced' },
    ],
    links: [],
    featured: true,
  },
  {
    slug: 'ground-systems-framework',
    name: 'Ground-Systems Visualization Framework',
    category: 'Angular Framework',
    tagline: 'A reusable Angular framework behind satellite data displays across RTX',
    summary: `Professional work at RTX, and my current focus: a reusable Angular 20 framework of
      20+ components and APIs that 10+ RTX programs use to build browser-based satellite data
      displays. I develop and maintain the framework, led its migration from Angular 18 to
      Angular 20, and cut Largest Contentful Paint by 55% across the production applications
      built on it.`,
    overview: [
      `Satellite ground systems across RTX need browser-based data displays, and rather than
       every program building its own, more than ten of them build on a shared visualization
       framework of 20+ reusable components and APIs. I develop and maintain that framework.
       The appeal of framework work is leverage: every new component, fix, and optimization
       lands in every application built on it.`,
      `Most of my time in the framework goes to optimization, reworks, and modernization. I
       introduced lazy loading for components that were previously loaded at startup, which
       reduced Largest Contentful Paint by 55% across production applications built with the
       framework, moved its Web Worker layer onto Angular's first-class worker tooling, and
       landed a series of smaller optimizations across the component catalog.`,
      `I led the framework's migration from Angular 18 to Angular 20, including adopting
       zoneless change detection in its reference application and automated test environment. A
       framework migration is different from an application migration: every consuming program
       inherits the change, so it has to land without breaking any of them.`,
      `This is proprietary professional software, so there is no public repository. It is
       described here at the same level of detail as my resume.`,
    ],
    highlights: [
      `Reduced Largest Contentful Paint by 55% across production applications built with the
       framework by introducing lazy loading for components that were previously loaded at
       startup.`,
      `Led the framework's migration from Angular 18 to Angular 20, including the adoption of
       zoneless change detection in its reference application and automated test environment.`,
      `Moved the framework's Web Worker layer onto Angular's official worker tooling, including
       the webWorkerTsConfig build integration and the extra handling a reusable library needs
       compared to an application.`,
      `Added new UI components to the catalog, including overlay, autocomplete, and dialog
       components, plus features delivered inside larger ones, such as searchable component
       lists.`,
    ],
    tech: ['Angular 20', 'TypeScript', 'RxJS', 'Web Workers', 'Zoneless Change Detection'],
    stats: [
      { value: '20+', label: 'components and APIs' },
      { value: '10+', label: 'RTX programs served' },
      { value: '55%', label: 'LCP reduction' },
      { value: '18→20', label: 'Angular migration led' },
    ],
    links: [],
    featured: false,
  },
  {
    slug: 'nykta',
    name: 'Nykta',
    category: 'AI Systems',
    tagline: 'An autonomous AI agent built on event-driven microservices',
    summary: `A persistent AI persona for Discord. It maintains long-term memory, initiates
      conversations through a permission-gated autonomy system, plays chess on Lichess, and
      speaks in voice channels. Built as six Dockerized microservices communicating over NATS,
      with an Angular 22 dashboard for monitoring its state.`,
    overview: [
      `Nykta is not a request/response chatbot. The model sees each channel as one continuous
       conversation shared by everyone in it, and a background autonomy loop decides when to
       check in on someone, follow up on a conversation that went quiet, or deliver a promised
       reminder. Every autonomous action is gated by per-user permissions and recorded in an
       audited decision log.`,
      `Its defining architectural rule is that free-form text is private thought and tools are
       the only actions. Anything the model writes outside a tool call is appended to an internal
       thoughts log and is never sent to Discord. Talking, reacting, remembering, and playing
       chess all happen through 23 typed tools, which keeps the persona's reasoning separate from
       its observable behavior.`,
      `This is the second generation of the project. The original grew into a hub-and-spoke
       system with roughly 95 hand-wired tools spanning Discord, voice, Minecraft embodiment, and
       a dual vector-memory system. Nykta 2 is a ground-up rewrite organized around typed message
       contracts, a plugin system, and crash-consistent state.`,
      `A read-only Angular 22 dashboard runs alongside the bot, with a live WebSocket feed of
       Discord traffic, a Server-Sent-Events view of the thoughts log, full-text search over the
       message archive, and inspectors for conversation state, memories, and autonomy decisions.
       A sanitized public version of the codebase is available on GitHub.`,
    ],
    highlights: [
      `Context compaction with a rolling summary: token budgets are measured from the provider's
       reported usage, cut points never split a tool call from its result, and the summary lives
       in the prompt-cached prefix so recall stays inexpensive.`,
      `Six Dockerized services (Discord gateway, AI core, Lichess gateway, FastAPI monitor,
       Angular dashboard, and the NATS bus) that communicate only through strictly typed Pydantic
       message contracts, validated on every publish.`,
      `A provider-agnostic LLM layer with Claude and OpenAI clients behind one protocol, each
       owning its own conversation-state export and import.`,
      `A plugin system with conditional tool exposure: chess tools exist only while a game is
       live, with a one-turn grace period so the bot can react to the result.`,
      `Single-writer crash consistency: the AI service owns all state (SQLite with FTS5,
       atomic-replace JSON, append-only logs), and the dashboard reads the same files strictly
       read-only.`,
      `Resilience throughout: automatic NATS reconnection with backoff, tool-round budgets that
       stop runaway loops, and history repair for orphaned tool calls after a crash.`,
      `A 196-test pytest suite covering handlers, autonomy, memory, plugins, and the chess path,
       run in a dedicated Docker profile in CI.`,
    ],
    tech: [
      'Python',
      'NATS',
      'Pydantic',
      'Claude API',
      'OpenAI API',
      'FastAPI',
      'SQLite FTS5',
      'Docker Compose',
      'Angular 22',
      'Angular Material',
      'WebSockets',
      'SSE',
      'ElevenLabs',
      'pytest',
    ],
    stats: [
      { value: '6', label: 'microservices' },
      { value: '23', label: 'model-facing tools' },
      { value: '2', label: 'swappable LLM providers' },
      { value: '196', label: 'automated tests' },
    ],
    links: [
      {
        label: 'Source on GitHub',
        url: 'https://github.com/Seistrei/nykta-discord-bot',
      },
    ],
    featured: false,
  },
  {
    slug: 'chess-losebot',
    name: 'Chess LoseBot',
    category: 'Game AI',
    tagline: 'A misère chess engine that models its opponent and plays to be checkmated',
    summary: `A chess engine with the win condition inverted: it must force a reluctant opponent
      to checkmate it. Originally a hand-tuned specialist, it was rebuilt around a learned
      opponent model: expectimax search over exact per-move probabilities, Bayesian inference of
      the opponent mid-game, maximum-likelihood fits from recorded games, and an exact
      forced-selfmate prover. It plays live on Lichess.`,
    overview: [
      `Misère chess uses standard rules with the goal inverted: you win by being checkmated.
       Avoiding wins is easy; the hard problem is forcing a reluctant opponent to deliver mate.
       LoseBot targets exactly that case, and it now plays live on Lichess as a bot account
       that accepts casual challenges at rapid speeds and slower.`,
      `The first generation was a hand-built specialist: exact proof search against one modeled
       opponent, misère negamax, and a library of hand-derived endgame plans. It converted the
       scenarios it drilled, but measurement exposed the wall: from one benchmark position, one
       opponent style converted ten out of ten while another converted zero out of ten, and the
       plans the two styles demand are opposite with no board feature to say which one you are
       facing. That information lives in the opponent's move distribution, so the engine was
       rebuilt around one. The complete first era survives in the repository as a frozen
       benchmark anchor, a source of training positions, and a reference implementation.`,
      `Every opponent is now a point in a parametric family of behavioral urges (greed,
       checking, king hunting, corner homing, mercy lapses, and others) over a mate-avoidant
       core, and each model exposes exact per-move probabilities. Expectimax search puts that
       distribution directly in the tree, a Bayesian posterior re-infers the opponent from
       every observed move, and an offline maximum-likelihood fitter estimates urge parameters
       from recorded games, with archived Lichess games as the growing corpus. A separate
       oracle proves forced selfmates that hold against any reply, with no opponent model
       anywhere in the proof.`,
      `Progress is measured by a frozen league run in Docker under PyPy. Three development
       families are fair game for tuning; four held-out families were frozen the day the
       rebuild began and are never tuned against. Every game lands in a ten-label outcome
       taxonomy, a mate counts fully only if the opponent had no legal alternative, and the
       worst held-out family is reported as prominently as the mean.`,
    ],
    highlights: [
      `A parametric opponent family in urge space: every opponent is a set of behavioral
       weights over a mate-avoidant core, so newly observed behavior updates parameters
       instead of spawning another hand-written doctrine.`,
      `Expectimax steering with the opponent in the tree: engine nodes maximize, opponent
       nodes take the expectation over the model's move distribution, and replies are trimmed
       by probability-class coverage rather than rank so the truncation stays unbiased.`,
      `Bayesian in-game inference: a posterior over opponent hypotheses updated from each
       observed move through the family's exact likelihoods, reading only the moves themselves
       and never the name of the family it is playing.`,
      `An offline maximum-likelihood fitter that estimates opponent parameters from game
       records, self-tested by requiring it to recover known parameters from games the models
       generated themselves.`,
      `A two-prover forced-selfmate oracle: an exhaustive prover entitled to refutations, and
       a deeper forcing-restricted prover whose failures are reported as ignorance and never
       laundered into disproofs.`,
      `Evaluation discipline borrowed from machine learning: held-out opponent families with
       frozen parameters, generalization claims that cite held-out rows only, and equal
       billing for the worst family and the mean.`,
    ],
    tech: ['Python', 'python-chess', 'PyPy', 'Docker', 'Lichess Bot API'],
    stats: [
      { value: '7', label: 'parametric opponent families' },
      { value: '10', label: 'outcome labels in the ledger' },
      { value: '~20k', label: 'lines of Python' },
      { value: '8.4k', label: 'lines of tuning-log notes' },
    ],
    links: [
      { label: 'Source on GitHub', url: 'https://github.com/Seistrei/chess-losebot' },
      { label: 'Challenge it on Lichess', url: 'https://lichess.org/@/LoseBotAI' },
    ],
    featured: false,
  },
  {
    slug: 'portfolio',
    name: 'This Website',
    category: 'Web',
    tagline: 'This site, built as a working sample of modern Angular',
    summary: `Designed and built from scratch on Angular 22 with zoneless change detection,
      signals for every piece of state, deferred views, view transitions, and a canvas scene
      set on the two moons of the novel I am writing.`,
    overview: [
      `A small site, but built the way I build large ones: zoneless change detection with signals
       as the only state primitive, the current control-flow syntax throughout, lazy routes with
       input-bound parameters, deferred loading for decorative work, and view transitions between
       pages.`,
      `There is no UI framework. The design system is hand-written SCSS with custom properties
       driving a dark and light theme that persists your preference and honors your system
       default before the app boots.`,
    ],
    highlights: [
      `Zoneless with OnPush everywhere; state lives exclusively in signals and computed values.`,
      `A canvas moonscape that renders each theme from the surface of one of the two moons
       from my novel: procedural living darkness on one, currents of liquid light on the
       other, with rare, half-seen wildlife. It is DPR-aware, paused while the tab is hidden,
       and static when reduced motion is preferred.`,
      `Scroll-spy navigation and reveal-on-scroll animations built on IntersectionObserver
       directives.`,
      `Self-hosted variable fonts, theme-aware meta tags, and a no-flash theme bootstrap script.`,
    ],
    tech: ['Angular 22', 'TypeScript', 'Signals', 'SCSS', 'Vitest'],
    stats: [
      { value: '0', label: 'runtime dependencies beyond Angular' },
      { value: '2', label: 'themes, no flash' },
    ],
    links: [{ label: 'Source on GitHub', url: 'https://github.com/Seistrei/portfolio-website' }],
    featured: false,
  },
];

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
