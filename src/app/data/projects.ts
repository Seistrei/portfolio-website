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
    slug: 'nykta',
    name: 'Nykta',
    category: 'AI Systems',
    tagline: 'An autonomous AI companion built on event-driven microservices',
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
        label: 'Public source on GitHub',
        url: 'https://github.com/Seistrei/nykta-discord-bot',
      },
    ],
    featured: true,
  },
  {
    slug: 'overwatch-draft-mode',
    name: 'OW2 Roguelite Draft Mode',
    category: 'Game Systems',
    tagline: 'A 4v4 mode where teams draft escalating upgrades between every round',
    summary: `A custom Overwatch 2 game mode: after every round, each team drafts three upgrades
      from a catalog of 41, ranging from rideable sky dragons to turret-building bots, and the
      picks persist as teams swap sides throughout the match. About 3,800 lines of OverPy
      compiling to 147 Workshop rules.`,
    overview: [
      `A 4v4 attack/defense mode built on Assault. Captures are fast, respawns are faster, and
       when the point falls the teams swap sides and draft again. Each team picks a world upgrade
       (a large gameplay gadget), a utility upgrade, and a stat upgrade from an in-world,
       cursor-driven three-card menu. Every pick persists and stacks across rounds and side
       swaps, so the final rounds play out with both teams heavily upgraded.`,
      `The platform is the interesting constraint. The Overwatch Workshop has no functions, no
       objects, and no additive stat stacking; there are only rules, arrays, and effect
       primitives, with variables mapped to numbered engine slots. The mode is written in OverPy,
       a Python-like language that compiles to Workshop rules, with a Dockerized build toolchain.`,
      `Many upgrades are powered by scripted dummy bots: Ana turrets, a jumping Reinhardt, a
       wall-building Mei, a D.Va that shadows you, a Mauga you can drive like a vehicle, and a
       three-bot conga line that pulls nearby attackers into the dance.`,
    ],
    highlights: [
      `Sky Dragon: a rideable flying serpent built entirely from effect spheres. A nine-segment
       body is rebuilt every 50 ms with sine-wave animation, flight is velocity-based, and a
       collision trick defeats the map's invisible air ceiling in both directions.`,
      `Delta-tracked buff handlers: dedicated rules track applied-versus-target percentages and
       apply only the difference, which emulates additive stat stacking on a platform that has
       none and eliminated a family of double-apply bugs.`,
      `A team-swap engine that snapshots both rosters before moving anyone (moving players
       mutates the live arrays) and guards the capture-versus-timeout race with an explicit
       reentrancy flag.`,
      `Draft state is replayed from player variables at round start, and non-stackable upgrades
       are automatically removed from future draws once owned.`,
      `Concurrency discipline throughout: barriers hold the draft menu closed until both teams
       finish re-applying upgrades, and ability loops abort the moment a player swaps teams.`,
      `An adapted in-world cursor-menu engine renders the three-card draft interface with hover
       feedback, drawn from positioned world text.`,
    ],
    tech: ['OverPy', 'Overwatch 2 Workshop', 'Docker', 'PowerShell', 'Git'],
    stats: [
      { value: '41', label: 'draftable upgrades' },
      { value: '147', label: 'compiled Workshop rules' },
      { value: '~3.8k', label: 'lines of OverPy' },
      { value: '135', label: 'source rules' },
    ],
    links: [],
    featured: false,
  },
  {
    slug: 'chess-losebot',
    name: 'Chess LoseBot',
    category: 'Game AI',
    tagline: 'A misère chess engine that plays to be checkmated',
    summary: `A chess engine with the win condition inverted: it tries to force the opponent to
      checkmate it. It combines an exact forced-selfmate proof search with a misère-tuned
      negamax, benchmarked against a clone of a mate-avoidant opponent that simpler approaches
      like Worstfish cannot break.`,
    overview: [
      `Misère chess uses standard rules with the goal inverted: you win by being checkmated.
       Avoiding wins is easy; the hard problem is forcing a reluctant opponent to deliver mate.
       LoseBot targets exactly that case, benchmarked against a clone of Chess.com's Zach bot,
       which shuffles pieces, avoids captures, and never mates unless forced to.`,
      `Move selection runs in three tiers. A hard filter discards any move that would checkmate
       or stalemate the opponent while an alternative exists. An exact AND/OR proof search then
       looks for forced self-mates: lines where every opponent reply still leads to LoseBot being
       mated within a bounded number of moves. When no proof is found, a misère-tuned negamax
       with inverted terminal values chooses the move.`,
      `Games run in a local Docker arena under PyPy against bundled sparring partners, including
       a Worstfish baseline driven by real Stockfish over UCI. Every engine iteration is recorded
       in a tuning log with versioned, frozen configuration profiles so results stay
       reproducible.`,
    ],
    highlights: [
      `A tri-state proof search (proven, disproven, unknown) in which budget exhaustion is never
       memoized as a refutation, a correctness subtlety covered by the self-test suite.`,
      `Draw-rule-aware memoization: transposition keys deliberately include the halfmove clock
       and repetition history, because merging positions without them can turn a draw into a
       false proof.`,
      `Draw avoidance as a first-class concern, with stalemate filters, draw contempt at terminal
       nodes, repetition penalties, and fifty-move-clock urgency, since the goal is to lose
       rather than draw.`,
      `The opponent model lives only in the exact proof search, not in the general negamax. An
       earlier version that modeled capture-aversion everywhere learned to build cages out of
       hanging pieces, which the opponent simply captured.`,
      `Evaluation counts men rather than material points, so promotion gains nothing and
       queen-farming branch explosions are avoided.`,
      `A documented tuning history across nine versions, including reconstructing a lost
       configuration from the log after a pre-git mistake.`,
    ],
    tech: ['Python', 'python-chess', 'PyPy', 'Stockfish (UCI)', 'Docker'],
    stats: [
      { value: '3', label: 'move-selection tiers' },
      { value: '9', label: 'documented tuning versions' },
      { value: '~1.4k', label: 'lines of Python' },
    ],
    links: [{ label: 'Source on GitHub', url: 'https://github.com/Seistrei/chess-losebot' }],
    featured: false,
  },
  {
    slug: 'portfolio',
    name: 'This Website',
    category: 'Web',
    tagline: 'This site, built as a working sample of modern Angular',
    summary: `Designed and built from scratch on Angular 22 with zoneless change detection,
      signals for every piece of state, deferred views, view transitions, and a canvas starfield
      that honors reduced-motion preferences.`,
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
      `A canvas starfield with twinkling parallax stars and occasional shooting stars. It is
       DPR-aware, paused while the tab is hidden, and static when reduced motion is preferred.`,
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
