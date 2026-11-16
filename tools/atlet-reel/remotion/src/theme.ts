import {Easing, interpolate} from 'remotion';

export const C = {
  midnight: '#0A1B3D',
  deep: '#050C1F',
  cobalt: '#2457D6',
  electric: '#3D7BFF',
  soft: '#6FA8FF',
  icy: '#CFE3FF',
  accent: '#9CCBFF',
  white: '#FFFFFF',
  // light world (A-style dark <-> light flips)
  paper: '#EEF4FF',
  paper2: '#D3E3FF',
  ink: '#0A1B3D',
};
export const FONT = "'Inter Tight', 'Inter', sans-serif";
export const FPS = 30;
export const F = 1 / FPS;

export const EASE_TEXT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_OUT = Easing.bezier(0.4, 0, 0.2, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.55, 1);
export const EASE_ACC = Easing.bezier(0.7, 0, 0.84, 0); // expo-ish in (things rushing at camera)
export const EASE_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** 0..1 progress between t0 and t0+dur (seconds) at time t */
export const prog = (t: number, t0: number, dur: number, easing = EASE_IN) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** B-style pop: 0 before t0, overshoots to ~1.12 around 3 frames, settles to 1 by ~7 frames. Returns scale-ish curve. */
export const popScale = (t: number, t0: number, from = 0.45, over = 0.14, dur = 0.24) => {
  const u = (t - t0) / dur;
  if (u <= 0) return from;
  if (u >= 1) return 1;
  // damped spring shaped by hand: rise to 1+over at u~0.35, dip to 1-over*0.3 at u~0.7, settle
  const k = 1 - Math.exp(-7 * u) * Math.cos(u * Math.PI * 2.2);
  const r = from + (1 - from) * k;
  return r + over * Math.sin(Math.PI * Math.min(u / 0.7, 1)) * Math.exp(-2 * u) * 0.6;
};

/** impulse that jumps to 1 at t0 and decays (tau seconds) */
export const hit = (t: number, t0: number, tau = 0.08) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));

/** standard glass surface (no backdrop blur: v3 keeps the background as shot) */
export const glass = (radius = 36, strong = false): React.CSSProperties => ({
  borderRadius: radius,
  background: strong
    ? 'linear-gradient(155deg, rgba(40,90,210,0.78) 0%, rgba(14,36,96,0.86) 60%, rgba(8,20,58,0.9) 100%)'
    : 'linear-gradient(155deg, rgba(30,70,170,0.62) 0%, rgba(12,30,82,0.72) 55%, rgba(6,16,46,0.78) 100%)',
  border: '2px solid rgba(175,210,255,0.5)',
  boxShadow: '0 24px 60px rgba(2,8,28,0.5), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 42px rgba(70,135,255,0.35)',
});

/** rough advance widths (em) of Inter Tight ExtraBold, used to place the guide next to words */
const NARROW = new Set('iljtfrI.,:;!|ʼ\''.split(''));
const WIDE = new Set('mwMWŞ'.split(''));
export const textW = (s: string, size: number, weight = 800) => {
  let w = 0;
  for (const ch of s) {
    if (ch === ' ') w += 0.24;
    else if (NARROW.has(ch)) w += 0.3;
    else if (WIDE.has(ch)) w += 0.88;
    else if (ch >= 'A' && ch <= 'Z') w += 0.68;
    else if (ch >= '0' && ch <= '9') w += 0.6;
    else w += 0.57;
  }
  return w * size * (weight >= 800 ? 1 : 0.94);
};
