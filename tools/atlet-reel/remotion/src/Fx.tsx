// Cut transitions on the footage plate (whip with motion blur, punch-in, zoom pushes for the MG portals),
// blob shape wipes grown from the guide, light streaks and flashes.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TL} from './timeline';
import {EASE_ACC, EASE_EXPO, F, clamp01, popScale, prog} from './theme';
import {MBlur} from './MotionGraphic';

export const Plate: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let x = 0, y = 0, sc = 1, bx = 0, by = 0, ox = 540, oy = 960;
  for (const c of tl.cuts) {
    const d = t - c.t;
    if (d < -0.2 || d > 0.4) continue;
    if (c.kind === 'whipL' || c.kind === 'whipR') {
      const dir = c.kind === 'whipL' ? -1 : 1;
      if (d < 0 && d >= -4 * F) { const u = (d + 4 * F) / (4 * F); x += dir * u * u * 160; bx += u * 55; sc *= 1 + 0.04 * u; }
      if (d >= 0 && d < 6 * F) { const v = EASE_EXPO(clamp01(d / (6 * F))); x += -dir * (1 - v) * 160; bx += (1 - v) * 55; sc *= 1 + 0.04 * (1 - v); }
    }
    if (c.kind === 'punch' && d >= 0) sc *= popScale(t, c.t, 1.16, -0.025, 0.32);
    if (c.kind === 'streak' && d >= 0) sc *= popScale(t, c.t, 1.06, -0.01, 0.26);
    if (c.kind === 'blob' && d >= 0) sc *= popScale(t, c.t, 1.1, -0.02, 0.34);
  }
  for (const p of tl.portals) {
    if (p.dir === 'in' && t >= p.a && t < p.b) { sc *= 1 + 0.4 * EASE_ACC(clamp01((t - p.a) / (p.b - p.a))); ox = p.cx; oy = p.cy; }
    if (p.dir === 'out' && t >= p.a && t < p.b + 0.35) { sc *= 1.3 - 0.3 * EASE_EXPO(clamp01((t - p.a) / (p.b + 0.35 - p.a))); ox = p.cx; oy = p.cy; }
  }
  for (const m of tl.mg) {
    if (m.entry.kind === 'whipL' && t >= m.entry.a && t < m.entry.b) { const e = EASE_EXPO(clamp01((t - m.entry.a) / (m.entry.b - m.entry.a))); x -= e * 420; bx += e * 50; }
    if (m.exit.kind === 'whipUp' && t >= m.exit.a && t < m.exit.b + 0.25) {
      const v = EASE_EXPO(clamp01((t - m.exit.a) / (m.exit.b + 0.25 - m.exit.a))); y += (1 - v) * 360; by += (1 - v) * 40;
    }
  }
  const blur = bx > 0.5 || by > 0.5;
  return (
    <>
      {blur ? <MBlur id="plate-mb" sx={bx} sy={by} /> : null}
      <AbsoluteFill style={{translate: `${x}px ${y}px`, scale: String(sc), transformOrigin: `${ox}px ${oy}px`, filter: blur ? 'url(#plate-mb)' : undefined}}>
        <OffthreadVideo src={staticFile('plate.mp4')} muted />
      </AbsoluteFill>
    </>
  );
};

const blob = (cx: number, cy: number, r: number, t: number, inner = 0) => {
  const ring = (rr: number, rev: boolean) => {
    let s = ''; const n = 32;
    for (let k = 0; k <= n; k++) {
      const a = ((rev ? n - k : k) / n) * Math.PI * 2; const w = 1 + 0.1 * Math.sin(a * 3 + t * 6) + 0.05 * Math.sin(a * 5 - t * 8);
      s += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr * w).toFixed(1)} ${(cy + Math.sin(a) * rr * w).toFixed(1)} `;
    }
    return s + 'Z ';
  };
  return ring(r, false) + (inner > 0 ? ring(inner, true) : '');
};

export const CutWipes: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const els: React.ReactNode[] = [];
  tl.cuts.forEach((c, i) => {
    const d = t - c.t;
    if (c.kind === 'blob' && d >= -0.22 && d < 0.28) {
      const cx = c.x!, cy = c.y!;
      const R = d < 0 ? 2300 * Math.pow(clamp01((d + 0.22) / 0.22), 2) + 6 : 2400;
      const inner = d < 0 ? 0 : 2400 * EASE_EXPO(clamp01(d / 0.28));
      els.push(
        <svg key={'b' + i} width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <defs><radialGradient id={'bg' + i} cx={cx} cy={cy} r={1400} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#E6F1FF" /><stop offset="0.35" stopColor="#6FA8FF" /><stop offset="1" stopColor="#1B3F9E" /></radialGradient></defs>
          <path d={blob(cx, cy, R, t, inner)} fill={`url(#bg${i})`} fillRule="evenodd" />
          {inner > 0 ? <path d={blob(cx, cy, inner + 14, t)} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.8} /> : null}
          {[0.55, 0.8].map((k) => <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} />)}
        </svg>);
    }
    if (c.kind === 'streak' && d >= -3 * F && d < 6 * F) {
      const u = clamp01((d + 3 * F) / (3 * F)); const o = 1 - prog(t, c.t, 6 * F, (x) => x);
      els.push(<div key={'s' + i} style={{position: 'absolute', left: (c.x ?? 952) - 9, width: 18, bottom: 0, height: 1920 * u, opacity: o, borderRadius: 9,
        background: 'linear-gradient(0deg, rgba(255,255,255,0.2), #fff 30%, #fff 80%, rgba(255,255,255,0))', boxShadow: '0 0 40px 14px rgba(110,170,255,0.85)'}} />);
    }
  });
  return <>{els}</>;
};

export const Flashes: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let best: {o: number; col: string} | null = null;
  for (const f of tl.flashes) {
    const d = t - f.t; const dur = f.dur ?? 0.12;
    if (d < -F || d > dur) continue;
    const o = f.k * (d < 0 ? 0.5 : Math.pow(1 - d / dur, 2));
    if (!best || o > best.o) best = {o, col: f.col};
  }
  if (!best || best.o < 0.01) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, ${best.col} 0%, ${best.col} 40%, rgba(110,160,255,0.6) 100%)`, opacity: best.o, mixBlendMode: 'screen'}} />;
};
