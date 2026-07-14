import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { Theme } from '../core/theme';

interface Star {
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

const DARK_PALETTE = ['#cdd8ff', '#ecc45f', '#a78bfa'];
const LIGHT_PALETTE = ['#41508a', '#9a6c14', '#6d5bd0'];
const METEOR_LIFE_MS = 900;

/**
 * Decorative night-sky canvas: twinkling stars with gentle drift, pointer
 * parallax, and the occasional shooting star. Static under
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
      background:
        radial-gradient(48rem 34rem at 12% -8%, var(--glow-a), transparent 65%),
        radial-gradient(56rem 40rem at 88% 112%, var(--glow-b), transparent 68%);
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
  private stars: Star[] = [];
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
      this.scheduleMeteor(performance.now());
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

    const count = Math.min(320, Math.round((this.width * this.height) / 8500));
    this.stars = Array.from({ length: count }, () => this.makeStar());
  }

  private makeStar(): Star {
    const roll = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      radius: 0.4 + Math.random() * 1.1,
      baseAlpha: 0.25 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.3 + Math.random() * 1.1,
      depth: 0.25 + Math.random() * 0.75,
      palette: roll < 0.8 ? 0 : roll < 0.92 ? 1 : 2,
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
    this.nextMeteorAt = now + 7000 + Math.random() * 10000;
  }

  private draw(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const t = time / 1000;
    const palette = this.theme.current() === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;

    // Ease the parallax toward the pointer for a floaty feel.
    this.parallax.x += (this.pointer.x - this.parallax.x) * 0.04;
    this.parallax.y += (this.pointer.y - this.parallax.y) * 0.04;

    ctx.clearRect(0, 0, this.width, this.height);

    for (const star of this.stars) {
      const twinkle = this.reducedMotion
        ? 1
        : 0.62 + 0.38 * Math.sin(star.phase + t * star.twinkleSpeed);
      const drift = this.reducedMotion ? 0 : (t * 0.004 * star.depth) % 1;
      const x = star.x * this.width - this.parallax.x * star.depth * 26;
      const y = (((star.y - drift) % 1) + 1) % 1;

      ctx.globalAlpha = star.baseAlpha * twinkle;
      ctx.fillStyle = palette[star.palette];
      ctx.beginPath();
      ctx.arc(x, y * this.height - this.parallax.y * star.depth * 16, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!this.reducedMotion) {
      this.drawMeteor(ctx, time, palette[0]);
    }
    ctx.globalAlpha = 1;
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
