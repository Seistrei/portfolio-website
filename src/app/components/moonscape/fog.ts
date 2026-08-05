/**
 * The living darkness of Rim, as seen from inside it: a domain-warped fog of
 * near-black that curls as it rolls past the viewer. The field is evaluated
 * on the CPU at very low resolution (a few thousand samples) into an offscreen
 * buffer, then upscaled with bilinear smoothing so it reads as soft volume
 * rather than pixels. Colors never rise above a faint blue-grey wisp, so the
 * page's text keeps its contrast.
 */

const PERM_SIZE = 256;
/** Approximate sample budget for the low-res field. */
const TARGET_SAMPLES = 14000;
/** Spatial frequency of the largest billows, across the viewport width. */
const BASE_FREQUENCY = 3.0;
/** How hard the warp twists the field. */
const WARP_STRENGTH = 2.6;
/**
 * Coherent wind, in noise-units per second. In-place churn alone reads as a
 * static image; sliding the whole field past the viewer is what makes the
 * motion legible. Negative x rolls the billows rightward across the screen;
 * positive y lets them climb slowly.
 */
const DRIFT_X = -0.04;
const DRIFT_Y = 0.014;

/** Palette stops from crushed black to the palest wisp: [n, r, g, b]. */
const STOPS: readonly [number, number, number, number][] = [
  [0, 1, 2, 4],
  [0.42, 3, 6, 11],
  [0.66, 10, 16, 28],
  [0.85, 18, 25, 42],
  [1, 27, 37, 60],
];

export class FogField {
  private readonly perm = new Uint8Array(PERM_SIZE * 2);
  private readonly palette = new Uint8ClampedArray(256 * 3);
  private readonly buffer = document.createElement('canvas');
  private readonly bufferCtx = this.buffer.getContext('2d');
  private image: ImageData | null = null;
  private bw = 0;
  private bh = 0;

  constructor() {
    const p = Array.from({ length: PERM_SIZE }, (_, i) => i);
    for (let i = PERM_SIZE - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < PERM_SIZE * 2; i++) {
      this.perm[i] = p[i & (PERM_SIZE - 1)];
    }

    for (let i = 0; i < 256; i++) {
      const n = i / 255;
      let s = 0;
      while (s < STOPS.length - 2 && n > STOPS[s + 1][0]) {
        s++;
      }
      const [n0, r0, g0, b0] = STOPS[s];
      const [n1, r1, g1, b1] = STOPS[s + 1];
      const k = (n - n0) / (n1 - n0);
      this.palette[i * 3] = r0 + (r1 - r0) * k;
      this.palette[i * 3 + 1] = g0 + (g1 - g0) * k;
      this.palette[i * 3 + 2] = b0 + (b1 - b0) * k;
    }
  }

  resize(width: number, height: number): void {
    const scale = Math.max(1, Math.sqrt((width * height) / TARGET_SAMPLES));
    this.bw = Math.max(48, Math.round(width / scale));
    this.bh = Math.max(32, Math.round(height / scale));
    this.buffer.width = this.bw;
    this.buffer.height = this.bh;
    this.image = this.bufferCtx?.createImageData(this.bw, this.bh) ?? null;
  }

  private noise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const p = this.perm;
    const a = p[(xi & 255) + p[yi & 255]];
    const b = p[((xi + 1) & 255) + p[yi & 255]];
    const c = p[(xi & 255) + p[(yi + 1) & 255]];
    const d = p[((xi + 1) & 255) + p[(yi + 1) & 255]];
    const ab = a + (b - a) * u;
    const cd = c + (d - c) * u;
    return (ab + (cd - ab) * v) / 255;
  }

  private fbm(x: number, y: number, octaves: number): number {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise(x * freq, y * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum / norm;
  }

  /**
   * Re-evaluate the field for time `t` (seconds). `px`/`py` nudge the sample
   * window with the pointer parallax, so looking around shifts the murk.
   */
  update(t: number, px: number, py: number): void {
    const image = this.image;
    const ctx = this.bufferCtx;
    if (!image || !ctx) {
      return;
    }
    const data = image.data;
    const { bw, bh, palette } = this;
    const aspect = bw / bh;
    const t1 = t * 0.04;
    const t2 = t * 0.028;
    const t3 = t * 0.022;
    const wx = px + t * DRIFT_X;
    const wy = py + t * DRIFT_Y;
    let idx = 0;
    for (let j = 0; j < bh; j++) {
      const y = (j / bh) * (BASE_FREQUENCY / aspect) + wy;
      for (let i = 0; i < bw; i++) {
        const x = (i / bw) * BASE_FREQUENCY + wx;
        // Two low-octave queries bend the space; the third reads the fog.
        const qx = this.fbm(x + t1, y + t1 * 0.6, 3);
        const qy = this.fbm(x + 5.2 - t2, y + 1.3 + t2 * 0.8, 3);
        let n = this.fbm(
          x + WARP_STRENGTH * qx + 1.7 - t3,
          y + WARP_STRENGTH * qy + 9.2 + t3 * 0.5,
          4,
        );
        n = n * n * (3 - 2 * n);
        const ci = (n * 255) | 0;
        data[idx++] = palette[ci * 3];
        data[idx++] = palette[ci * 3 + 1];
        data[idx++] = palette[ci * 3 + 2];
        data[idx++] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  /** Upscale the low-res field over the whole canvas. */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.bw > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.buffer, 0, 0, width, height);
    }
  }
}
