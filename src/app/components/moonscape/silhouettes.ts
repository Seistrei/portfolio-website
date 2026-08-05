/**
 * Silhouette tracing for the creatures of the two moons. Each function only
 * appends path segments; the caller owns the transform (translate to the
 * anchor, scale, flip) and the fill. Ground-dwellers are authored with their
 * feet at y = 0 and their bodies in negative y; fliers are authored around
 * their center of mass.
 */

/** Design-space height of the wolf, foot line to ear tip. */
export const WOLF_HEIGHT = 147;
/** Design-space length of the wolf, nose to tail. */
export const WOLF_LENGTH = 238;

/**
 * Eye anchors for the wolf, in its design space. Slightly asymmetric so the
 * head reads as turned a few degrees toward the viewer.
 */
export const WOLF_EYES: readonly { x: number; y: number; r: number }[] = [
  { x: 36, y: -114, r: 2.6 },
  { x: 47, y: -116, r: 2.2 },
];

/**
 * One of Rim's wolves, in profile, standing alert. Larger and heavier than
 * any wolf of the planet below: tall hackles over the shoulder, deep chest,
 * a thick tail swept low behind the hind legs.
 */
export function traceWolf(p: CanvasRenderingContext2D | Path2D): void {
  p.moveTo(8, -104); // nose
  p.quadraticCurveTo(20, -113, 34, -116); // bridge of the muzzle
  p.quadraticCurveTo(42, -120, 46, -127); // brow
  p.lineTo(50, -145); // near ear
  p.lineTo(60, -131);
  p.lineTo(65, -133);
  p.lineTo(72, -147); // far ear
  p.lineTo(81, -129);
  p.quadraticCurveTo(90, -123, 98, -118); // back of the skull
  p.quadraticCurveTo(112, -112, 130, -118); // neck
  p.quadraticCurveTo(146, -124, 158, -118); // hackles over the shoulder
  p.quadraticCurveTo(176, -113, 190, -112); // back
  p.quadraticCurveTo(202, -110, 206, -98); // croup
  p.quadraticCurveTo(208, -84, 202, -70); // rump
  p.quadraticCurveTo(204, -48, 196, -32); // thigh to the hock
  p.quadraticCurveTo(199, -14, 196, 0); // cannon to the foot
  p.lineTo(184, 0);
  p.lineTo(185, -28);
  p.quadraticCurveTo(183, -42, 177, -50); // groin
  p.quadraticCurveTo(179, -34, 179, -26); // near hind leg
  p.lineTo(179, 0);
  p.lineTo(167, 0);
  p.lineTo(165, -36);
  p.quadraticCurveTo(163, -48, 161, -52);
  p.quadraticCurveTo(148, -63, 134, -62); // belly
  p.lineTo(134, -26); // rear front leg
  p.lineTo(133, 0);
  p.lineTo(121, 0);
  p.lineTo(120, -44);
  p.quadraticCurveTo(119, -56, 114, -62);
  p.lineTo(112, -34); // near front leg
  p.lineTo(112, 0);
  p.lineTo(99, 0);
  p.lineTo(101, -48);
  p.quadraticCurveTo(99, -60, 96, -68);
  p.quadraticCurveTo(91, -82, 91, -93); // deep chest
  p.quadraticCurveTo(91, -102, 72, -104); // throat
  p.quadraticCurveTo(48, -102, 28, -97); // jaw
  p.quadraticCurveTo(14, -97, 8, -104);
  p.closePath();
  // The tail is its own subpath so it hangs clear of the legs.
  p.moveTo(200, -98);
  p.quadraticCurveTo(220, -92, 228, -74);
  p.quadraticCurveTo(238, -46, 234, -20);
  p.quadraticCurveTo(231, -6, 222, -10);
  p.quadraticCurveTo(220, -34, 212, -56);
  p.quadraticCurveTo(204, -76, 198, -90);
  p.closePath();
}

/**
 * One of Rim's fliers: broad membranous wings with fingered trailing edges,
 * small eared head, short tail point. `span` is one wing in local units;
 * `flap` in [-1, 1] raises or lowers the wingtips.
 */
export function traceFlyer(p: CanvasRenderingContext2D | Path2D, span: number, flap: number): void {
  const tipY = -flap * span * 0.42;
  p.moveTo(-3, -10);
  p.lineTo(-5, -17); // left ear
  p.lineTo(-1, -12);
  p.lineTo(1, -12);
  p.lineTo(5, -17); // right ear
  p.lineTo(3, -10);
  p.quadraticCurveTo(6, -8, 6, -5); // head into right shoulder
  p.quadraticCurveTo(span * 0.4, tipY - span * 0.18, span, tipY); // leading edge
  p.quadraticCurveTo(span * 0.8, tipY + span * 0.14, span * 0.62, tipY + span * 0.3); // first finger
  p.quadraticCurveTo(span * 0.3, tipY + span * 0.34, 5, 11); // membrane to the body
  p.quadraticCurveTo(2, 14, 0, 18); // tail point
  p.quadraticCurveTo(-2, 14, -5, 11);
  p.quadraticCurveTo(-span * 0.3, tipY + span * 0.34, -span * 0.62, tipY + span * 0.3);
  p.quadraticCurveTo(-span * 0.8, tipY + span * 0.14, -span, tipY);
  p.quadraticCurveTo(-span * 0.4, tipY - span * 0.18, -6, -5);
  p.quadraticCurveTo(-6, -8, -3, -10);
  p.closePath();
}

/** Design-space height of the watcher. */
export const WATCHER_HEIGHT = 38;

/**
 * A distant figure that looks like a person, standing perfectly still.
 * Deliberately featureless: a long coat, a head, nothing more.
 */
export function traceWatcher(p: CanvasRenderingContext2D | Path2D): void {
  p.moveTo(-3, -31.5); // neck
  p.quadraticCurveTo(-7.6, -30, -8.6, -27); // left shoulder
  p.quadraticCurveTo(-8.4, -16, -6.4, -6); // long coat taper
  p.lineTo(-5.8, 0);
  p.lineTo(-1.4, 0);
  p.lineTo(-1, -7); // hint of legs
  p.lineTo(1, -7);
  p.lineTo(1.4, 0);
  p.lineTo(5.8, 0);
  p.lineTo(6.4, -6);
  p.quadraticCurveTo(8.4, -16, 8.6, -27);
  p.quadraticCurveTo(7.6, -30, 3, -31.5);
  p.closePath();
  p.moveTo(5, -32.5); // head, seated on the shoulders
  p.arc(0, -32.5, 5, 0, Math.PI * 2);
}

/** Design-space half wingspan of the eagle. */
export const EAGLE_HALF_SPAN = 58;

/**
 * Rikt's great eagle in distant profile, soaring: wings lifted in a shallow
 * vee with fingered tips, head and beak leading, a small fanned tail below.
 * Faces +x; wingtips reach roughly ±EAGLE_HALF_SPAN.
 */
export function traceEagle(p: CanvasRenderingContext2D | Path2D): void {
  p.moveTo(-58, -24); // left wingtip
  p.lineTo(-52, -30); // fingered primaries
  p.lineTo(-49, -24);
  p.lineTo(-44, -28);
  p.lineTo(-41, -22);
  p.quadraticCurveTo(-26, -12, -8, -8); // left wing upper edge
  p.quadraticCurveTo(0, -7, 8, -8); // across the back
  p.quadraticCurveTo(26, -12, 41, -22); // right wing upper edge
  p.lineTo(44, -28); // fingered primaries
  p.lineTo(49, -24);
  p.lineTo(52, -30);
  p.lineTo(58, -24); // right wingtip
  p.quadraticCurveTo(30, -6, 18, -2); // right wing underside
  p.quadraticCurveTo(23, -1, 27, 0); // head and beak, leading the glide
  p.quadraticCurveTo(22, 3, 16, 3);
  p.quadraticCurveTo(10, 4, 6, 4); // body
  p.quadraticCurveTo(6, 5, 4, 11); // fanned tail
  p.quadraticCurveTo(0, 15, -4, 11);
  p.quadraticCurveTo(-6, 5, -2, 4);
  p.quadraticCurveTo(-20, 0, -41, -22); // left wing underside
  p.closePath();
}
