import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Theme, ThemeName } from '../../core/theme';
import { FogField } from './fog';
import {
  EAGLE_HALF_SPAN,
  WATCHER_HEIGHT,
  WOLF_EYES,
  WOLF_HEIGHT,
  WOLF_LENGTH,
  traceEagle,
  traceFlyer,
  traceWatcher,
  traceWolf,
} from './silhouettes';

interface Mote {
  x: number; // 0..1 of canvas width
  y: number; // 0..1 of canvas height
  radius: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  depth: number; // 0..1, drives parallax + drift
  palette: number; // index into the theme palette
}

/** A current of liquid light in Rikt's sky. */
interface Band {
  y: number; // fraction of height
  amp: number; // fraction of height
  wavelength: number; // fraction of width
  phase: number;
  drift: number; // radians per second
  thickness: number; // fraction of height
  alpha: number;
  warm: boolean;
}

/** Rikt's eagle, crossing the light overhead. */
interface FlightVisit {
  start: number;
  duration: number;
  y: number; // fraction of height
  amp: number; // fraction of height
  dir: number; // travel direction, +1 rightward
  seed: number;
}

/** Something in Rim's murk, never more than half-seen. */
type EncounterKind = 'eyes' | 'wolf' | 'watcher' | 'flier' | 'fire';

interface Encounter {
  kind: EncounterKind;
  start: number;
  duration: number;
  x: number; // anchor, fraction of width
  y: number; // anchor, fraction of height
  scale: number; // meaning varies by kind; see spawnEncounter
  flip: boolean;
  glints: boolean; // whether eyes ignite during a wolf encounter
  seed: number;
}

/** Rikt: warm motes suspended in the liquid light, gold and crimson. */
const RIKT_MOTES = ['#d97742', '#e0a83c', '#b5442f'];
/** Content column: keep in sync with `.container` in styles.scss. */
const CONTAINER_MAX_PX = 1088;
const CONTAINER_GUTTER_PX = 40;
/** The cold sheen a shape carries when the darkness thins around it. */
const HINT_SHEEN = 'rgb(158, 184, 214)';

/** Visit cadence in ms: a short first wait after arriving, then rare. */
const SCHEDULES = {
  encounter: { first: [4000, 9000], rest: [12000, 28000] },
  converge: { first: [9000, 18000], rest: [20000, 45000], duration: [5000, 7500] },
  eagle: { first: [5000, 11000], rest: [40000, 80000], duration: [26000, 40000] },
  surge: { first: [9000, 18000], rest: [22000, 45000], duration: [5200, 8000] },
} as const;

/** Relative odds of what surfaces from the dark. */
const ENCOUNTER_WEIGHTS: readonly [EncounterKind, number][] = [
  ['eyes', 0.28],
  ['wolf', 0.24],
  ['watcher', 0.2],
  ['fire', 0.15],
  ['flier', 0.13],
];

const ENCOUNTER_DURATION: Record<EncounterKind, readonly [number, number]> = {
  eyes: [7000, 12000],
  wolf: [10000, 16000],
  watcher: [12000, 18000],
  flier: [2400, 3400],
  fire: [16000, 24000],
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * First-person view from whichever moon of "Memory's Hourglass" the current
 * theme lives on. You are standing on the moon, seeing what Sei would see.
 *
 * Rim (dark): you are inside the living darkness. No stars, no horizon, no
 * sky — the elua here swallows light like heavy fog, and it moves: a slow,
 * twisted churn (domain-warped noise) with the black pressing in at the
 * edges of what little you can see. Rarely, something is half-glimpsed and
 * swallowed again: a pair of pale eyes; the suggestion of a wolf's shoulder;
 * a still figure that might be a person; a vast wing passing close; once in
 * a while, the far-off bloom of a campfire.
 *
 * Rikt (light): the elua here is nearly liquid. Currents of light drift
 * overhead with motes suspended in the flow, Rim's dark disc rides the right
 * gutter, and rarely the great eagle glides through the light. Kept faint on
 * purpose: this is the readable theme.
 *
 * Pointer parallax in both scenes; static under prefers-reduced-motion (no
 * encounters), paused while the tab is hidden.
 */
@Component({
  selector: 'app-moonscape',
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      display: block;
      pointer-events: none;
      background: var(--sky);
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Moonscape {
  private readonly theme = inject(Theme);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx: CanvasRenderingContext2D | null = null;
  private readonly fog = new FogField();
  private fogUpdatedAt = 0;
  private fogReady = false;
  private readonly scratch = document.createElement('canvas');
  private readonly scratchCtx = this.scratch.getContext('2d');

  private motes: Mote[] = [];
  private bands: Band[] = [];

  private encounter: Encounter | null = null;
  private nextEncounterAt = 0;
  private converge: { start: number; duration: number } | null = null;
  private nextConvergeAt = 0;
  private eagle: FlightVisit | null = null;
  private nextEagleAt = 0;
  private surge: { start: number; duration: number; band: number; dir: number } | null = null;
  private nextSurgeAt = 0;
  private sceneTheme: ThemeName | null = null;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private frame = 0;
  private reducedMotion = false;
  private pointer = { x: 0, y: 0 }; // -0.5..0.5
  private parallax = { x: 0, y: 0 };

  constructor() {
    afterNextRender(() => this.init());
    // The animation loop reads the theme every frame; under reduced motion
    // there is no loop, so repaint the single static frame on theme change.
    effect(() => {
      this.theme.current();
      if (this.reducedMotion && this.ctx) {
        this.draw(performance.now());
      }
    });
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }

    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.bands = Array.from({ length: 3 }, (_, i) => ({
      y: 0.14 + 0.21 * i + rand(-0.03, 0.03),
      amp: rand(0.014, 0.034),
      wavelength: rand(0.55, 0.9),
      phase: rand(0, Math.PI * 2),
      drift: rand(0.04, 0.09),
      thickness: rand(0.05, 0.085),
      // Bright currents read as light; the dim ones as refraction shadow.
      alpha: i % 2 === 0 ? rand(0.07, 0.1) : rand(0.035, 0.05),
      warm: i % 2 === 0,
    }));

    const resizeObserver = new ResizeObserver(() => {
      this.resize(canvas);
      if (this.reducedMotion) {
        this.draw(performance.now());
      }
    });
    resizeObserver.observe(canvas);
    this.resize(canvas);

    const onPointerMove = (event: PointerEvent) => {
      this.pointer.x = event.clientX / window.innerWidth - 0.5;
      this.pointer.y = event.clientY / window.innerHeight - 0.5;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !this.reducedMotion) {
        this.startLoop();
      } else {
        cancelAnimationFrame(this.frame);
      }
    };

    if (!this.reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      this.startLoop();
    } else {
      this.draw(performance.now());
    }

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  private resize(canvas: HTMLCanvasElement): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.fog.resize(this.width, this.height);
    this.fogUpdatedAt = 0;
    this.fogReady = false;

    // Rikt's suspended motes: sparser than a star field, hushed. Rim gets
    // no particles at all; in that dark the fog is the whole scene.
    const count = Math.min(240, Math.round((this.width * this.height) / 10500));
    this.motes = Array.from({ length: count }, () => this.makeMote());
  }

  private makeMote(): Mote {
    const roll = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      radius: 0.4 + Math.random() * 1.1,
      baseAlpha: 0.25 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.3 + Math.random() * 1.1,
      depth: 0.25 + Math.random() * 0.75,
      palette: roll < 0.72 ? 0 : roll < 0.92 ? 1 : 2,
    };
  }

  private startLoop(): void {
    cancelAnimationFrame(this.frame);
    const tick = (time: number) => {
      this.draw(time);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  /** New theme, new moon underfoot: clear visitors and restart their clocks. */
  private enterScene(theme: ThemeName, time: number): void {
    this.sceneTheme = theme;
    this.encounter = null;
    this.converge = null;
    this.eagle = null;
    this.surge = null;
    this.nextEncounterAt = time + rand(...SCHEDULES.encounter.first);
    this.nextConvergeAt = time + rand(...SCHEDULES.converge.first);
    this.nextEagleAt = time + rand(...SCHEDULES.eagle.first);
    this.nextSurgeAt = time + rand(...SCHEDULES.surge.first);
  }

  /** Smoothstep fade-in/out envelope for a timed visit. */
  private visitEnv(elapsed: number, duration: number, fade: number): number {
    const k = clamp(Math.min(elapsed / fade, (duration - elapsed) / fade), 0, 1);
    return k * k * (3 - 2 * k);
  }

  private draw(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const t = time / 1000;
    const theme = this.theme.current();
    if (theme !== this.sceneTheme && !this.reducedMotion) {
      this.enterScene(theme, time);
    }

    // Ease the parallax toward the pointer for a floaty feel.
    this.parallax.x += (this.pointer.x - this.parallax.x) * 0.04;
    this.parallax.y += (this.pointer.y - this.parallax.y) * 0.04;

    ctx.clearRect(0, 0, this.width, this.height);

    if (theme === 'rim') {
      this.drawRimScene(ctx, time, t);
    } else {
      this.drawRiktScene(ctx, time, t);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------- Rim: inside the dark

  private drawRimScene(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    // The fog is the world. Re-evaluated at ~30fps; the upscale blurs it.
    if (!this.fogReady || (!this.reducedMotion && time - this.fogUpdatedAt >= 33)) {
      this.fog.update(t, this.parallax.x * 0.3, this.parallax.y * 0.2);
      this.fogUpdatedAt = time;
      this.fogReady = true;
    }
    this.fog.draw(ctx, this.width, this.height);

    this.drawFooting(ctx);

    if (!this.reducedMotion) {
      this.updateEncounter(time);
      this.drawEncounterBody(ctx, time, t);
    }

    this.drawConvergingDark(ctx, time, t);

    if (!this.reducedMotion) {
      this.drawEncounterGlints(ctx, time, t);
      this.drawFlierPass(ctx, time);
    }
  }

  /** The one thing you can be sure of: stone, just visible at your feet. */
  private drawFooting(ctx: CanvasRenderingContext2D): void {
    const cx = this.width * 0.5 - this.parallax.x * 14;
    const cy = this.height * 1.04;
    const r = Math.min(this.width, this.height) * 0.34;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(126, 146, 176, 0.055)');
    g.addColorStop(1, 'rgba(126, 146, 176, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  /**
   * The dark pressing in at the edge of sight. It breathes; now and then it
   * converges, and the pocket you can see through shrinks for a few seconds.
   */
  private drawConvergingDark(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    let factor = 1;
    if (!this.reducedMotion) {
      if (!this.converge && time >= this.nextConvergeAt) {
        this.converge = { start: time, duration: rand(...SCHEDULES.converge.duration) };
      }
      if (this.converge) {
        const p = (time - this.converge.start) / this.converge.duration;
        if (p >= 1) {
          this.converge = null;
          this.nextConvergeAt = time + rand(...SCHEDULES.converge.rest);
        } else {
          factor = 1 - 0.14 * Math.sin(p * Math.PI);
        }
      }
    }
    const breath = 1 + 0.05 * Math.sin(t * 0.13);
    const cx = this.width * 0.5 - this.parallax.x * 30;
    const cy = this.height * 0.6 - this.parallax.y * 20;
    const inner = 0.44 * Math.min(this.width, this.height) * breath * factor;
    const outer = Math.hypot(this.width, this.height) * 0.62;
    const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    g.addColorStop(0, 'rgba(0, 1, 4, 0)');
    g.addColorStop(0.55, 'rgba(0, 1, 4, 0.3)');
    g.addColorStop(1, 'rgba(0, 1, 4, 0.62)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Weighted choice of what, if anything, is out there this time. */
  private spawnEncounter(time: number): Encounter {
    let roll = Math.random();
    let kind: EncounterKind = ENCOUNTER_WEIGHTS[0][0];
    for (const [k, weight] of ENCOUNTER_WEIGHTS) {
      kind = k;
      roll -= weight;
      if (roll <= 0) {
        break;
      }
    }

    const base = {
      kind,
      start: time,
      duration: rand(...ENCOUNTER_DURATION[kind]),
      flip: Math.random() < 0.5,
      glints: kind === 'eyes' || Math.random() < 0.55,
      seed: rand(0, 100),
    };
    switch (kind) {
      case 'eyes':
        return { ...base, x: rand(0.2, 0.8), y: rand(0.3, 0.6), scale: rand(0.8, 1.5) };
      case 'wolf': {
        const x = rand(0.18, 0.72);
        return {
          ...base,
          x,
          y: rand(0.38, 0.68),
          scale: clamp(this.height * 0.34, 180, 340) / WOLF_HEIGHT,
          flip: x < 0.5, // half-seen, but still facing you
        };
      }
      case 'watcher':
        return {
          ...base,
          x: rand(0.2, 0.8),
          y: rand(0.4, 0.68),
          scale: clamp(this.height * 0.28, 130, 250) / WATCHER_HEIGHT,
        };
      case 'flier':
        return { ...base, x: 0, y: rand(0.15, 0.45), scale: rand(0.18, 0.26) };
      default:
        return { ...base, x: rand(0.2, 0.8), y: rand(0.45, 0.7), scale: rand(0.12, 0.2) };
    }
  }

  private updateEncounter(time: number): void {
    if (this.encounter && time - this.encounter.start >= this.encounter.duration) {
      this.encounter = null;
      this.nextEncounterAt = time + rand(...SCHEDULES.encounter.rest);
    }
    if (!this.encounter && time >= this.nextEncounterAt) {
      this.encounter = this.spawnEncounter(time);
    }
  }

  /** The half-seen mass of a visitor, or the far bloom of a fire. */
  private drawEncounterBody(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    const e = this.encounter;
    if (!e) {
      return;
    }
    if (e.kind === 'wolf' || e.kind === 'watcher') {
      this.drawMassHint(ctx, e, time, t);
    } else if (e.kind === 'fire') {
      this.drawFireBloom(ctx, e, time, t);
    }
  }

  /**
   * A silhouette that the darkness only partly gives up: the shape is drawn
   * whole offscreen, then masked to a soft, slowly wandering patch — a
   * shoulder here, a haunch there — and never all at once.
   */
  private drawMassHint(ctx: CanvasRenderingContext2D, e: Encounter, time: number, t: number): void {
    const sctx = this.scratchCtx;
    if (!sctx) {
      return;
    }
    const env = this.visitEnv(time - e.start, e.duration, 3000);
    const s = e.scale;
    const pad = 24;
    const bodyW = (e.kind === 'wolf' ? WOLF_LENGTH : 24) * s;
    const bodyH = (e.kind === 'wolf' ? WOLF_HEIGHT : WATCHER_HEIGHT) * s;
    const w = Math.ceil(bodyW + pad * 2);
    const h = Math.ceil(bodyH + pad * 2);
    if (this.scratch.width !== w || this.scratch.height !== h) {
      this.scratch.width = w;
      this.scratch.height = h;
    }

    sctx.clearRect(0, 0, w, h);
    sctx.save();
    if (e.kind === 'wolf') {
      sctx.translate(pad + (e.flip ? bodyW : 0), pad + bodyH);
      sctx.scale(e.flip ? -s : s, s);
      sctx.fillStyle = HINT_SHEEN;
      sctx.beginPath();
      traceWolf(sctx);
      sctx.fill();
    } else {
      sctx.translate(w / 2, pad + bodyH);
      sctx.scale(s, s);
      sctx.fillStyle = HINT_SHEEN;
      sctx.beginPath();
      traceWatcher(sctx);
      sctx.fill();
    }
    sctx.restore();

    // Keep only the patch the fog is thin over, and let it wander. Biased
    // toward the upper body so a whole limb never surfaces at once.
    const rx = w * 0.5 + Math.sin(t * 0.13 + e.seed) * w * 0.2;
    const ry = h * 0.34 + Math.cos(t * 0.09 + e.seed * 1.7) * h * 0.14;
    const reveal = sctx.createRadialGradient(rx, ry, 0, rx, ry, Math.max(w, h) * 0.27);
    reveal.addColorStop(0, 'rgba(0, 0, 0, 1)');
    reveal.addColorStop(0.4, 'rgba(0, 0, 0, 0.5)');
    reveal.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.globalCompositeOperation = 'destination-in';
    sctx.fillStyle = reveal;
    sctx.fillRect(0, 0, w, h);
    sctx.globalCompositeOperation = 'source-over';

    ctx.globalAlpha = (e.kind === 'wolf' ? 0.1 : 0.085) * env;
    ctx.drawImage(this.scratch, e.x * this.width - w / 2, e.y * this.height - h / 2);
    ctx.globalAlpha = 1;
  }

  /**
   * A comforting fire, somewhere out in the dark: through this much murk it
   * is only a soft breathing bloom, with someone kneeling beside it.
   */
  private drawFireBloom(
    ctx: CanvasRenderingContext2D,
    e: Encounter,
    time: number,
    t: number,
  ): void {
    const env = this.visitEnv(time - e.start, e.duration, 3000);
    const flick =
      0.7 + 0.3 * (0.6 * Math.sin(t * 9.7 + e.seed * 7) + 0.4 * Math.sin(t * 15.3 + e.seed * 13));
    const cx = e.x * this.width - this.parallax.x * 18;
    const cy = e.y * this.height - this.parallax.y * 12;
    const r = e.scale * Math.min(this.width, this.height) * (1 + 0.04 * Math.sin(t * 1.7 + e.seed));

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(226, 146, 78, ${0.2 * flick * env})`);
    g.addColorStop(0.4, `rgba(198, 100, 50, ${0.09 * flick * env})`);
    g.addColorStop(1, 'rgba(198, 100, 50, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // The unfamiliar man, kneeling: a dark lump against the glow.
    if (r > 90) {
      ctx.globalAlpha = 0.1 * flick * env;
      ctx.fillStyle = '#02040a';
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.2, cy + r * 0.08, r * 0.062, r * 0.088, -0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.166, cy - r * 0.015, r * 0.034, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /** Eyes in the dark: the one part of a visitor that light comes back from. */
  private drawEncounterGlints(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    const e = this.encounter;
    if (!e || !e.glints || (e.kind !== 'eyes' && e.kind !== 'wolf')) {
      return;
    }
    const elapsed = time - e.start;
    const env = this.visitEnv(elapsed, e.duration, e.kind === 'eyes' ? 1400 : 3000);
    const blink = (time + e.seed * 4700) % 4600 < 180;
    if (blink || env <= 0) {
      return;
    }

    let eyes: { x: number; y: number; r: number; env: number }[];
    if (e.kind === 'eyes') {
      // The second eye opens a beat after the first, as if turning to look.
      const drift = Math.sin(t * 0.06 + e.seed) * 10;
      const cx = e.x * this.width + drift;
      const cy = e.y * this.height;
      const late = clamp((elapsed - 700) / 900, 0, 1);
      eyes = [
        { x: cx - 14 * e.scale, y: cy, r: 3 * e.scale, env },
        { x: cx + 14 * e.scale, y: cy + 2 * e.scale, r: 2.7 * e.scale, env: env * late },
      ];
    } else {
      // Ignite partway through the wolf's visit, on its masked head.
      const ignite = clamp((elapsed / e.duration - 0.35) / 0.08, 0, 1);
      if (ignite <= 0) {
        return;
      }
      const s = e.scale;
      const pad = 24;
      const bodyW = WOLF_LENGTH * s;
      const bodyH = WOLF_HEIGHT * s;
      const w = bodyW + pad * 2;
      const h = bodyH + pad * 2;
      const left = e.x * this.width - w / 2;
      const top = e.y * this.height - h / 2;
      eyes = WOLF_EYES.map((eye) => ({
        x: left + pad + (e.flip ? bodyW - eye.x * s : eye.x * s),
        y: top + pad + bodyH + eye.y * s,
        r: eye.r * s * 0.55,
        env: env * ignite,
      }));
    }

    for (const eye of eyes) {
      if (eye.env <= 0) {
        continue;
      }
      const halo = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, eye.r * 3.4);
      halo.addColorStop(0, 'rgba(143, 216, 234, 0.4)');
      halo.addColorStop(1, 'rgba(143, 216, 234, 0)');
      ctx.globalAlpha = eye.env;
      ctx.fillStyle = halo;
      ctx.fillRect(eye.x - eye.r * 3.4, eye.y - eye.r * 3.4, eye.r * 6.8, eye.r * 6.8);
      ctx.globalAlpha = 0.9 * eye.env;
      ctx.fillStyle = '#dceefc';
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eye.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** A vast wing passing close: seconds of shadow, then nothing. */
  private drawFlierPass(ctx: CanvasRenderingContext2D, time: number): void {
    const e = this.encounter;
    if (!e || e.kind !== 'flier') {
      return;
    }
    const p = (time - e.start) / e.duration;
    const dir = e.flip ? -1 : 1;
    const along = dir > 0 ? p : 1 - p;
    const x = (-0.25 + along * 1.5) * this.width;
    const y = e.y * this.height - Math.sin(p * Math.PI) * 0.1 * this.height;
    const span = e.scale * this.width;
    const flap = Math.sin(p * Math.PI * 2 * 1.1 + e.seed) * 0.9;
    const env = Math.sin(p * Math.PI);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir * (0.15 - 0.3 * p));
    ctx.fillStyle = '#010207';
    // Three nested passes fake a motion-soft edge.
    for (const [grow, alpha] of [
      [1.18, 0.05],
      [1.08, 0.09],
      [1, 0.14],
    ]) {
      ctx.save();
      ctx.scale(grow, grow);
      ctx.globalAlpha = alpha * env;
      ctx.beginPath();
      traceFlyer(ctx, span, flap);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ Rikt scene

  private drawRiktScene(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    const hy = this.horizonY();

    this.drawBands(ctx, t);
    if (!this.reducedMotion) {
      this.drawSurge(ctx, time, t);
    }
    this.drawRimDisc(ctx);
    this.drawLiquidMotes(ctx, t, hy);
    if (!this.reducedMotion) {
      this.drawEagle(ctx, time, t);
    }
    this.drawRiktGround(ctx, t, hy);
  }

  /** The horizon: everything below is the smooth stone you are standing on. */
  private horizonY(): number {
    return this.height - clamp(this.height * 0.13, 64, 148);
  }

  /** Top edge of a current of liquid light, at time t. */
  private bandTop(band: Band, x: number, t: number): number {
    const k = (Math.PI * 2 * x) / (band.wavelength * this.width);
    const phase = band.phase + t * band.drift;
    return (
      band.y * this.height +
      band.amp * this.height * Math.sin(k + phase) +
      band.amp * 0.45 * this.height * Math.sin(2.3 * k - phase * 0.7)
    );
  }

  /** Currents of liquid light drifting through the sky. */
  private drawBands(ctx: CanvasRenderingContext2D, t: number): void {
    const step = 24;
    for (const band of this.bands) {
      const thickness = band.thickness * this.height;
      ctx.globalAlpha = band.alpha;
      ctx.fillStyle = band.warm ? '#fffaf0' : '#c8845a';
      ctx.beginPath();
      for (let x = -step; x <= this.width + step; x += step) {
        const y = this.bandTop(band, x, t) - this.parallax.y * 8;
        if (x === -step) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      for (let x = this.width + step; x >= -step; x -= step) {
        const wobble =
          1 +
          0.18 *
            Math.sin((Math.PI * 2 * x) / (band.wavelength * this.width * 0.6) + band.phase * 1.3);
        ctx.lineTo(x, this.bandTop(band, x, t) - this.parallax.y * 8 + thickness * wobble);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  /** A brighter pulse that travels down one of the currents. */
  private drawSurge(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    if (!this.surge && time >= this.nextSurgeAt) {
      this.surge = {
        start: time,
        duration: rand(...SCHEDULES.surge.duration),
        band: Math.floor(rand(0, this.bands.length)),
        dir: Math.random() < 0.5 ? -1 : 1,
      };
    }
    if (!this.surge) {
      return;
    }
    const p = (time - this.surge.start) / this.surge.duration;
    if (p >= 1) {
      this.surge = null;
      this.nextSurgeAt = time + rand(...SCHEDULES.surge.rest);
      return;
    }

    const band = this.bands[this.surge.band];
    const along = this.surge.dir > 0 ? p : 1 - p;
    const x = (-0.1 + along * 1.2) * this.width;
    const y = this.bandTop(band, x, t) + (band.thickness * this.height) / 2;
    const r = band.thickness * this.height * 2.2;
    const env = Math.sin(p * Math.PI);

    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255, 250, 240, ${0.1 * env})`);
    g.addColorStop(1, 'rgba(255, 250, 240, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /**
   * Rim seen from Rikt: a dark disc with a silver limb, kept to the right
   * gutter so the light theme's text never crosses it. With no gutter room
   * it simply stays below the horizon.
   */
  private drawRimDisc(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const r = clamp(Math.min(w, this.height) * 0.075, 26, 56);
    const containerRight = w / 2 + Math.min(w - CONTAINER_GUTTER_PX, CONTAINER_MAX_PX) / 2;
    const x = containerRight + r + 12 - this.parallax.x * 9;
    if (w - (x - r) < 36) {
      return;
    }
    const y = this.height * 0.24 - this.parallax.y * 6;

    ctx.globalAlpha = 1;
    let g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(90, 110, 140, 0.1)');
    g.addColorStop(1, 'rgba(90, 110, 140, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);

    // Lit sliver: a pale backing disc peeking past the offset dark disc.
    ctx.fillStyle = 'rgba(230, 240, 250, 0.75)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.35, r * 0.15, x, y, r);
    g.addColorStop(0, '#1a2334');
    g.addColorStop(0.7, '#111a2b');
    g.addColorStop(1, '#0c1322');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + r * 0.035, y + r * 0.035, r * 0.985, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(6, 10, 19, 0.55)';
    for (const [cx, cy, cr] of [
      [x - r * 0.3, y + r * 0.22, r * 0.16],
      [x + r * 0.24, y - r * 0.08, r * 0.1],
      [x - r * 0.05, y - r * 0.42, r * 0.08],
    ]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Warm motes suspended in the liquid light, drifting with the current. */
  private drawLiquidMotes(ctx: CanvasRenderingContext2D, t: number, hy: number): void {
    for (const [index, mote] of this.motes.entries()) {
      // Daylight thins the field: only two of three motes show.
      if (index % 3 === 2) {
        continue;
      }
      const twinkle = this.reducedMotion
        ? 1
        : 0.62 + 0.38 * Math.sin(mote.phase + t * mote.twinkleSpeed * 0.6);
      const drift = this.reducedMotion ? 0 : (t * 0.006 * (0.4 + 0.6 * mote.depth)) % 1;
      const sway = this.reducedMotion ? 0 : Math.sin(mote.phase + t * 0.35) * 0.012 * mote.depth;
      const x = ((((mote.x + drift) % 1) + 1) % 1) * this.width - this.parallax.x * mote.depth * 26;
      const cy = (mote.y + sway) * this.height - this.parallax.y * mote.depth * 16;
      let alpha = mote.baseAlpha * twinkle * 0.6;
      if (cy > hy) {
        alpha *= clamp(1 - (cy - hy) / 50, 0, 1);
      }
      if (alpha <= 0.01) {
        continue;
      }
      const color = RIKT_MOTES[mote.palette];

      ctx.globalAlpha = alpha * 0.14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, cy, mote.radius * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, cy, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** The great eagle, hazy through the light, gliding as if swimming. */
  private drawEagle(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    if (!this.eagle && time >= this.nextEagleAt) {
      this.eagle = {
        start: time,
        duration: rand(...SCHEDULES.eagle.duration),
        y: rand(0.09, 0.3),
        amp: rand(0.015, 0.04),
        dir: Math.random() < 0.5 ? -1 : 1,
        seed: rand(0, 100),
      };
    }
    const visit = this.eagle;
    if (!visit) {
      return;
    }
    const p = (time - visit.start) / visit.duration;
    if (p >= 1) {
      this.eagle = null;
      this.nextEagleAt = time + rand(...SCHEDULES.eagle.rest);
      return;
    }

    const along = visit.dir > 0 ? p : 1 - p;
    const x = (-0.12 + along * 1.24) * this.width;
    const wave = p * Math.PI * 2 * 1.4 + visit.seed;
    const y = (visit.y + visit.amp * Math.sin(wave)) * this.height - this.parallax.y * 10;
    const sc = clamp(this.width * 0.065, 55, 108) / EAGLE_HALF_SPAN;
    const env = clamp(Math.min(p / 0.08, (1 - p) / 0.08), 0, 1);
    const flex = 1 + 0.05 * Math.sin(t * 0.8 + visit.seed);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.1 * Math.cos(wave) * visit.dir);
    ctx.scale(visit.dir, 1);
    ctx.fillStyle = 'rgba(122, 63, 38, 1)';

    // A wider, softer pass first: the blur of something seen through liquid.
    ctx.save();
    ctx.scale(sc * 1.09, sc * 1.09 * flex);
    ctx.globalAlpha = 0.05 * env;
    ctx.beginPath();
    traceEagle(ctx);
    ctx.fill();
    ctx.restore();

    ctx.scale(sc, sc * flex);
    ctx.globalAlpha = 0.12 * env;
    ctx.beginPath();
    traceEagle(ctx);
    ctx.fill();
    ctx.restore();
  }

  /** Warm stone underfoot, with pools of light sliding slowly across it. */
  private drawRiktGround(ctx: CanvasRenderingContext2D, t: number, hy: number): void {
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, hy, 0, this.height);
    g.addColorStop(0, '#eedcc4');
    g.addColorStop(0.5, '#e7d2b3');
    g.addColorStop(1, '#e0c8a4');
    ctx.fillStyle = g;
    ctx.fillRect(0, hy, this.width, this.height - hy);

    // Light pools cast by the currents overhead, drifting with them.
    const groundH = this.height - hy;
    for (let i = 0; i < 3; i++) {
      const x = (((0.33 * i + (this.reducedMotion ? 0 : t * 0.007)) % 1) * 1.2 - 0.1) * this.width;
      const pool = ctx.createRadialGradient(
        x,
        hy + groundH * 0.4,
        0,
        x,
        hy + groundH * 0.4,
        this.width * 0.13,
      );
      pool.addColorStop(0, 'rgba(255, 247, 232, 0.055)');
      pool.addColorStop(1, 'rgba(255, 247, 232, 0)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, hy, this.width, groundH);
    }

    ctx.fillStyle = 'rgba(146, 84, 48, 0.14)';
    ctx.fillRect(0, hy - 0.5, this.width, 1);
  }
}
