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
import { Theme } from '../core/theme';

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

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/** Rim: memory-sand — grains of softly glowing white with a cold cyan trace. */
const RIM_SAND = ['#f2f7fb', '#cfdcea', '#8fd8ea'];
/** Rikt: warm ember motes — the lightmoon's colors, gold and crimson. */
const RIKT_EMBERS = ['#d97742', '#e0a83c', '#b5442f'];
/** Rim: black snow, barely darker than the sky behind it. */
const SNOW_COLOR = '#03060b';
const METEOR_LIFE_MS = 900;
const SPLATTER_SHIFT_MS = 5200;
/** Content column: keep in sync with `.container` in styles.scss. */
const CONTAINER_MAX_PX = 1088;
const CONTAINER_GUTTER_PX = 40;

/**
 * Decorative sky canvas for the two moons of "Memory's Hourglass".
 *
 * Rim (dark): the darkmoon itself hangs upper-right — dark disc, silver limb,
 * cold halo — while memory-sand (sparse glowing grains) drifts slowly down
 * over a subtler layer of black snow, plus one splatterstar whose hue wanders
 * between red and yellow (and, rarely, colors that don't exist). Still and
 * quiet; no meteors under the darkmoon.
 *
 * Rikt (light): the red lightmoon rises in the right gutter — always outside
 * the content column so text never scrolls across the bright disc; on narrow
 * viewports only its glow remains — with warm ember motes rising like heat
 * and the occasional shooting star. Pointer parallax in both skies; static
 * under prefers-reduced-motion, paused while the tab is hidden.
 */
@Component({
  selector: 'app-starfield',
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      display: block;
      pointer-events: none;
      opacity: var(--starfield-opacity);
      transition: opacity 0.5s ease;
      background: var(--sky);
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Starfield {
  private readonly theme = inject(Theme);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx: CanvasRenderingContext2D | null = null;
  private motes: Mote[] = [];
  private snow: Mote[] = [];
  private splatter = { x: 0.72, y: 0.18 };
  private excursion: { until: number; hue: number } | null = null;
  private nextExcursionAt = 0;
  private meteor: Meteor | null = null;
  private nextMeteorAt = 0;
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
      const now = performance.now();
      this.scheduleMeteor(now);
      this.scheduleExcursion(now);
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

    // Sparser than a classic star field; the sky should feel hushed.
    const count = Math.min(240, Math.round((this.width * this.height) / 10500));
    this.motes = Array.from({ length: count }, () => this.makeMote());
    this.snow = Array.from({ length: Math.min(90, Math.round(count * 0.45)) }, () => {
      const flake = this.makeMote();
      flake.radius = 1.2 + Math.random() * 1.5;
      flake.baseAlpha = 0.35 + Math.random() * 0.45;
      return flake;
    });
    // Upper-left sky, clear of the moon that hangs on the right.
    this.splatter = { x: 0.12 + Math.random() * 0.3, y: 0.07 + Math.random() * 0.19 };
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

  private scheduleMeteor(now: number): void {
    this.nextMeteorAt = now + 9000 + Math.random() * 12000;
  }

  private scheduleExcursion(now: number): void {
    this.nextExcursionAt = now + 12000 + Math.random() * 18000;
  }

  private draw(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const t = time / 1000;
    const rim = this.theme.current() === 'rim';
    const palette = rim ? RIM_SAND : RIKT_EMBERS;

    // Ease the parallax toward the pointer for a floaty feel.
    this.parallax.x += (this.pointer.x - this.parallax.x) * 0.04;
    this.parallax.y += (this.pointer.y - this.parallax.y) * 0.04;

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawMoon(ctx, rim);

    if (rim) {
      this.drawSnow(ctx, t);
    }

    for (const [index, mote] of this.motes.entries()) {
      // Daylight thins the field: under Rikt only two of three motes show.
      if (!rim && index % 3 === 2) {
        continue;
      }
      const twinkle = this.reducedMotion
        ? 1
        : 0.62 + 0.38 * Math.sin(mote.phase + t * mote.twinkleSpeed * (rim ? 0.45 : 1));
      const drift = this.reducedMotion ? 0 : (t * 0.0045 * mote.depth) % 1;
      // Cold sand falls; warm embers rise.
      const y = (((rim ? mote.y + drift : mote.y - drift) % 1) + 1) % 1;
      const x = mote.x * this.width - this.parallax.x * mote.depth * 26;
      const cy = y * this.height - this.parallax.y * mote.depth * 16;
      // The Rikt canvas is no longer dimmed by the host, so embers dim here.
      const alpha = mote.baseAlpha * twinkle * (rim ? 1 : 0.6);
      const color = palette[mote.palette];

      // Soft halo, then the grain itself.
      ctx.globalAlpha = alpha * (rim ? 0.2 : 0.14);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, cy, mote.radius * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, cy, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (rim) {
      this.drawSplatterstar(ctx, time, t);
    } else if (!this.reducedMotion) {
      this.drawMeteor(ctx, time, palette[0]);
    }
    ctx.globalAlpha = 1;
  }

  /** The resident moon of the current sky, drawn behind every particle. */
  private drawMoon(ctx: CanvasRenderingContext2D, rim: boolean): void {
    const w = this.width;
    const h = this.height;
    const r = Math.min(Math.max(Math.min(w, h) * 0.15, 48), 150);

    if (rim) {
      // The darkmoon may hang over the content column: pale text keeps AA
      // contrast against its near-background disc.
      this.drawRimMoon(ctx, w * 0.8 - this.parallax.x * 9, h * 0.2 - this.parallax.y * 6, r);
      return;
    }

    // The lightmoon is bright, so it rises in the right gutter, outside the
    // content column. With no gutter room, the corner glow carries it alone.
    const containerRight = w / 2 + Math.min(w - CONTAINER_GUTTER_PX, CONTAINER_MAX_PX) / 2;
    const x = containerRight + r + 12 - this.parallax.x * 9;
    if (w - (x - r) < 36) {
      return;
    }
    this.drawRiktMoon(ctx, x, h * 0.3 - this.parallax.y * 6, r);
  }

  /** Rim: dark disc, silver limb toward the darkest-day glow, faint craters. */
  private drawRimMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.globalAlpha = 1;
    let g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 2.4);
    g.addColorStop(0, 'rgba(210, 226, 242, 0.09)');
    g.addColorStop(1, 'rgba(210, 226, 242, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);

    // Lit sliver: a pale backing disc peeking past the offset dark disc.
    ctx.fillStyle = 'rgba(203, 222, 240, 0.55)';
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

  /** Rikt: radiant disc, wide warm halo, and the thin ring of its barrier. */
  private drawRiktMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.globalAlpha = 1;
    let g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3.1);
    g.addColorStop(0, 'rgba(199, 82, 47, 0.3)');
    g.addColorStop(0.45, 'rgba(217, 119, 66, 0.12)');
    g.addColorStop(1, 'rgba(224, 168, 60, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 3.1, y - r * 3.1, r * 6.2, r * 6.2);

    g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#efa068');
    g.addColorStop(0.55, '#cd5c35');
    g.addColorStop(0.9, '#b5442f');
    g.addColorStop(1, 'rgba(181, 68, 47, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(168, 62, 43, 0.14)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Near-black flakes sinking against the faint "darkest day" glow. */
  private drawSnow(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.fillStyle = SNOW_COLOR;
    for (const flake of this.snow) {
      const drift = this.reducedMotion ? 0 : (t * 0.0028 * flake.depth) % 1;
      const sway = this.reducedMotion ? 0 : Math.sin(flake.phase + t * 0.18) * 10 * flake.depth;
      const y = ((flake.y + drift) % 1) * this.height - this.parallax.y * flake.depth * 12;
      const x = flake.x * this.width + sway - this.parallax.x * flake.depth * 18;

      ctx.globalAlpha = flake.baseAlpha;
      ctx.beginPath();
      ctx.arc(x, y, flake.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * The splatterstar: one distant star whose color wanders between red and
   * yellow, and once in a long while somewhere stranger.
   */
  private drawSplatterstar(ctx: CanvasRenderingContext2D, time: number, t: number): void {
    let hue = 28 + 26 * Math.sin(t * 0.21);
    if (!this.reducedMotion) {
      if (!this.excursion && time >= this.nextExcursionAt) {
        this.excursion = { until: time + SPLATTER_SHIFT_MS, hue: 170 + Math.random() * 160 };
      }
      if (this.excursion) {
        if (time >= this.excursion.until) {
          this.excursion = null;
          this.scheduleExcursion(time);
        } else {
          const progress = 1 - (this.excursion.until - time) / SPLATTER_SHIFT_MS;
          const blend = Math.sin(progress * Math.PI); // ease out and back
          hue = hue + (this.excursion.hue - hue) * blend;
        }
      }
    }

    const x = this.splatter.x * this.width - this.parallax.x * 10;
    const y = this.splatter.y * this.height - this.parallax.y * 6;
    const radius = 2.4 + (this.reducedMotion ? 0 : 0.5 * Math.sin(t * 0.8));

    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
    halo.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.45)`);
    halo.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(x - radius * 7, y - radius * 7, radius * 14, radius * 14);

    // Four-point diffraction spikes make it read as one deliberate star.
    const len = radius * 4.2;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const [dx, dy] of [
      [len, 0],
      [0, len],
    ]) {
      const spike = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
      spike.addColorStop(0, 'transparent');
      spike.addColorStop(0.5, `hsl(${hue}, 92%, 72%)`);
      spike.addColorStop(1, 'transparent');
      ctx.strokeStyle = spike;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = `hsl(${hue}, 90%, 66%)`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMeteor(ctx: CanvasRenderingContext2D, time: number, color: string): void {
    if (!this.meteor && time >= this.nextMeteorAt) {
      const angle = Math.PI * (0.62 + Math.random() * 0.18); // down-left-ish
      const speed = 520 + Math.random() * 260;
      this.meteor = {
        x: this.width * (0.3 + Math.random() * 0.65),
        y: this.height * Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: time,
      };
    }
    if (!this.meteor) {
      return;
    }

    const elapsed = time - this.meteor.life;
    if (elapsed > METEOR_LIFE_MS) {
      this.meteor = null;
      this.scheduleMeteor(time);
      return;
    }

    const progress = elapsed / METEOR_LIFE_MS;
    const fade = Math.sin(progress * Math.PI); // in-out
    const x = this.meteor.x + (this.meteor.vx * elapsed) / 1000;
    const y = this.meteor.y + (this.meteor.vy * elapsed) / 1000;
    const tail = 90;
    const tx =
      x - (this.meteor.vx / 1000) * (tail / (Math.hypot(this.meteor.vx, this.meteor.vy) / 1000));
    const ty =
      y - (this.meteor.vy / 1000) * (tail / (Math.hypot(this.meteor.vx, this.meteor.vy) / 1000));

    const gradient = ctx.createLinearGradient(tx, ty, x, y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, color);

    ctx.globalAlpha = 0.45 * fade;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
