// Cut transitions on the footage plate (whip with motion blur, punch-in), ring bursts, light streaks, flashes.
// Same look as the Atlet reel (../../atlet-reel/remotion/src/Fx.tsx); the MG portal moves are replaced by a rise-in / whip-out.
// v2: blob wipes -> ring bursts; wipes, streaks and flashes render inside FaceSafe so they never cover the face.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TL} from './timeline';
import {EASE_ACC, EASE_EXPO, F, clamp01, popScale, prog} from './theme';

export const MBlur: React.FC<{id: string; sx: number; sy: number}> = ({id, sx, sy}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}><defs><filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${sx} ${sy}`} /></filter></defs></svg>
);

export const Plate: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let x = 0, y = 0, sc = 1, bx = 0, by = 0;
  for (const c of tl.cuts) {
    const d = t - c.t;
    if (d < -0.2 || d > 0.4) continue;
    if (c.kind === 'whipL' || c.kind === 'whipR') {
      const dir = c.kind === 'whipL' ? -1 : 1;
      if (d < 0 && d >= -4 * F) { const u = (d + 4 * F) / (4 * F); x += dir * u * u * 160; bx += u * 55; sc *= 1 + 0.04 * u; }
      if (d >= 0 && d < 6 * F) { const v = EASE_EXPO(clamp01(d / (6 * F))); x += -dir * (1 - v) * 160; bx += (1 - v) * 55; sc *= 1 + 0.04 * (1 - v); }
    }
    if (c.kind === 'punch' && d >= 0) sc *= popScale(t, c.t, 1.14, -0.025, 0.32);
    if (c.kind === 'streak' && d >= 0) sc *= popScale(t, c.t, 1.06, -0.01, 0.26);
    if (c.kind === 'ring' && d >= 0) sc *= popScale(t, c.t, 1.1, -0.02, 0.34);
  }
  // into the summary MG: the plate accelerates up and away; out of it: lands back from the right
  if (t >= tl.mgIn.a && t < tl.mgIn.b) { const e = EASE_ACC(clamp01((t - tl.mgIn.a) / (tl.mgIn.b - tl.mgIn.a))); y -= e * 700; by += e * 60; sc *= 1 + 0.15 * e; }
  if (t >= tl.mgOut.b && t < tl.mgOut.b + 0.3) { const v = EASE_EXPO(clamp01((t - tl.mgOut.b) / 0.3)); x += (1 - v) * 420; bx += (1 - v) * 50; }
  const blur = bx > 0.5 || by > 0.5;
  return (
    <>
      {blur ? <MBlur id="plate-mb" sx={bx} sy={by} /> : null}
      <AbsoluteFill style={{translate: `${x}px ${y}px`, scale: String(sc), transformOrigin: '540px 760px', filter: blur ? 'url(#plate-mb)' : undefined}}>
        <OffthreadVideo src={staticFile('plate.mp4')} muted />
      </AbsoluteFill>
    </>
  );
};

/** wraps effect layers so they never draw over the face: an elliptical hole (feathered) follows the face box */
export const FaceSafe: React.FC<{tl: TL; children: React.ReactNode}> = ({tl, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = tl.faceAt(frame / fps);
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2, rx = (f.x1 - f.x0) / 2 + 60, ry = (f.y1 - f.y0) / 2 + 60;
  const m = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, transparent 0%, transparent 88%, black 100%)`;
  return <AbsoluteFill style={{WebkitMaskImage: m, maskImage: m}}>{children}</AbsoluteFill>;
};

export const CutWipes: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const els: React.ReactNode[] = [];
  tl.cuts.forEach((c, i) => {
    const d = t - c.t;
    if (c.kind === 'ring' && d >= -0.06 && d < 0.5) {
      // ring burst from the chest: three glowing rings race outwards, a soft glow pulses behind them
      const cx = c.x!, cy = c.y!;
      const g = d < 0 ? 0.4 : Math.exp(-d / 0.12);
      els.push(
        <svg key={'r' + i} width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
          <defs><radialGradient id={'rg' + i}><stop offset="0" stopColor="#9CCBFF" stopOpacity={0.55 * g} /><stop offset="1" stopColor="#3D7BFF" stopOpacity="0" /></radialGradient></defs>
          <circle cx={cx} cy={cy} r={520} fill={`url(#rg${i})`} />
          {[0, 0.06, 0.12].map((lag, k) => {
            const u = clamp01((d - lag + 0.06) / 0.44); if (u <= 0 || u >= 1) return null;
            const r = 60 + 1300 * EASE_EXPO(u); const o = (1 - u) * (k === 0 ? 1 : 0.6);
            return <circle key={k} cx={cx} cy={cy} r={r} fill="none" stroke={k === 0 ? '#FFFFFF' : '#9CCBFF'} strokeOpacity={o} strokeWidth={(k === 0 ? 16 : 8) * (1 - u) + 2}
              style={{filter: 'drop-shadow(0 0 14px rgba(110,170,255,0.95))'}} />;
          })}
        </svg>);
    }
    if (c.kind === 'streak' && d >= -3 * F && d < 6 * F) {
      const u = clamp01((d + 3 * F) / (3 * F)); const o = 1 - prog(t, c.t, 6 * F, (x) => x);
      els.push(<div key={'s' + i} style={{position: 'absolute', left: (c.x ?? 120) - 9, width: 18, bottom: 0, height: 1920 * u, opacity: o, borderRadius: 9,
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
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${best.col} 0%, ${best.col} 45%, rgba(110,160,255,0.6) 100%)`, opacity: best.o, mixBlendMode: 'screen'}} />;
};
