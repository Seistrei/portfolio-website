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
const SPLATTER_SHIFT_MS = 4200;

/**
 * Decorative sky canvas for the two moons of "Memory's Hourglass".
 *
 * Rim (dark): memory-sand — sparse glowing grains drifting slowly downward —
 * over a subtler layer of black snow, plus one splatterstar whose hue wanders
 * between red and yellow (and, rarely, colors that don't exist). Still and
 * quiet; no meteors under the darkmoon.
 *
 * Rikt (light): warm ember motes rising like heat, with the occasional
 * shooting star. Pointer parallax in both skies; static under
 * prefers-reduced-motion, paused while the tab is hidden.
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
    this.splatter = { x: 0.55 + Math.random() * 0.35, y: 0.06 + Math.random() * 0.24 };
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
    this.nextExcursionAt = now + 22000 + Math.random() * 26000;
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
      const alpha = mote.baseAlpha * twinkle;
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
    let hue = 28 + 26 * Math.sin(t * 0.12);
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
    const radius = 1.7 + (this.reducedMotion ? 0 : 0.3 * Math.sin(t * 0.9));

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = `hsl(${hue}, 88%, 74%)`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
    ctx.fill();
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

    ctx.globalAlpha = 0.75 * fade;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
