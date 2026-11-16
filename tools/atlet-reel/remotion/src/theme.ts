import {Easing, interpolate} from 'remotion';

export const C = {
  midnight: '#0A1B3D',
  deep: '#050C1F',
  cobalt: '#2457D6',
  soft: '#6FA8FF',
  icy: '#CFE3FF',
  accent: '#9CCBFF',
  white: '#FFFFFF',
};
export const FONT = "'Inter Tight', 'Inter', sans-serif";
// brief: text in = ease-out (0.16,1,0.3,1); MG in = (0.22,1,0.36,1); MG out = (0.4,0,0.2,1)
export const EASE_TEXT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_OUT = Easing.bezier(0.4, 0, 0.2, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.55, 1);

/** 0..1 progress between t0 and t0+dur (seconds) at time t */
export const prog = (t: number, t0: number, dur: number, easing = EASE_IN) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** standard glass surface */
export const glass = (radius = 36): React.CSSProperties => ({
  borderRadius: radius,
  background: 'linear-gradient(155deg, rgba(140,185,255,0.20) 0%, rgba(40,85,190,0.12) 55%, rgba(12,30,80,0.22) 100%)',
  border: '1.5px solid rgba(175,210,255,0.38)',
  boxShadow:
    '0 24px 60px rgba(2,8,28,0.45), inset 0 1px 0 rgba(255,255,255,0.28), 0 0 42px rgba(70,135,255,0.28)',
  backdropFilter: 'blur(18px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
});
