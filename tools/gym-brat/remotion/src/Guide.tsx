// The guide: a small glowing 2.5D dumbbell that is on screen from the first frame to the last (reference-A "star").
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {TL} from './timeline';
import {clamp01} from './theme';

export const HOLE = 11;
export const GSCALE = 1.4; // base on-screen size of the guide // plate hole radius at scale 1 (px); the zoom-through mask uses the same number

const Plates: React.FC<{phi: number}> = ({phi}) => {
  const c = Math.cos((phi * Math.PI) / 180), s = Math.sin((phi * Math.PI) / 180);
  const plate = (x: number, R: number, th: number, k: string, fill: string) => (
    <g key={k}>
      <ellipse cx={x * c} cy={0} rx={Math.max(th * c * 0.5, R * s + th * c * 0.5)} ry={R} fill={fill} stroke="#EAF3FF" strokeWidth={1.6} />
      {s > 0.3 ? <ellipse cx={x * c + (x > 0 ? 1 : -1) * th * c * 0.5} cy={0} rx={R * s * 0.36} ry={R * 0.36} fill="#0B1F52" opacity={clamp01((s - 0.3) * 3)} /> : null}
    </g>
  );
  const side = (d: 1 | -1) => [
    plate(d * 31, 24, 9, 'a' + d, 'url(#gPlate)'),
    plate(d * 42, 18, 7, 'b' + d, 'url(#gPlate2)'),
    <rect key={'c' + d} x={Math.min(d * 49 * c, d * 53 * c)} y={-6} width={Math.max(1, 4 * c)} height={12} rx={2} fill="#EAF3FF" />,
  ];
  return (
    <g>
      <rect x={-27 * c} y={-4.5} width={54 * c} height={9} rx={4.5} fill="url(#gBar)" />
      {phi > 0 ? [...side(-1), ...side(1)] : [...side(1), ...side(-1)]}
    </g>
  );
};

export const Guide: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const g = tl.guide(t);
  // trail (sub-frame samples of the same path)
  const trail: React.ReactNode[] = [];
  const N = 16;
  let prev = g;
  for (let j = 1; j <= N; j++) {
    const q = tl.guide(t - j / 110);
    const k = 1 - j / (N + 1);
    const vis = clamp01((q.speed - 250) / 900);
    if (vis > 0.01 && g.endOn < 0.2) {
      trail.push(<line key={'o' + j} x1={prev.x} y1={prev.y} x2={q.x} y2={q.y} stroke="#6FA8FF" strokeOpacity={0.55 * k * vis} strokeWidth={34 * k * g.s * GSCALE} strokeLinecap="round" />);
      trail.push(<line key={'i' + j} x1={prev.x} y1={prev.y} x2={q.x} y2={q.y} stroke="#F2F7FF" strokeOpacity={0.85 * k * vis} strokeWidth={11 * k * g.s * GSCALE} strokeLinecap="round" />);
    }
    prev = q;
  }
  // squash & stretch along velocity, bounce on beats when idle
  const st = Math.min(g.speed / 4200, 0.5) * (1 - g.endOn);
  const ang = (Math.atan2(g.vy, g.vx) * 180) / Math.PI;
  let lb = -1; for (const b of tl.beats) { if (b <= t) lb = b; else break; }
  const isDown = tl.downbeats.some((d) => Math.abs(d - lb) < 0.01);
  const e = lb >= 0 ? Math.exp(-(t - lb) / 0.07) * (1 - clamp01(g.speed / 900)) * (1 - g.endOn) : 0;
  const bx = 1 + (isDown ? 0.16 : 0.1) * e, by = 1 - (isDown ? 0.22 : 0.14) * e;
  const s = g.s * GSCALE;
  const ringO = clamp01(g.endOn * 2 - 0.4);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="gPlate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F1FF" /><stop offset="0.45" stopColor="#7FB0FF" /><stop offset="1" stopColor="#2457D6" /></linearGradient>
        <linearGradient id="gPlate2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#6FA8FF" /></linearGradient>
        <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#8DB8F5" /></linearGradient>
        <radialGradient id="gGlow"><stop offset="0" stopColor="#7FB4FF" stopOpacity="0.75" /><stop offset="1" stopColor="#3D7BFF" stopOpacity="0" /></radialGradient>
      </defs>
      <g style={{mixBlendMode: 'screen'}}>{trail}</g>
      <g transform={`translate(${g.x} ${g.y}) rotate(${ang}) scale(${1 + st} ${1 / (1 + st)}) rotate(${-ang}) scale(${bx * s} ${by * s})`}>
        <circle r={70} fill="url(#gGlow)" opacity={0.85 * (1 - ringO)} />
        <g transform={`rotate(${g.rot})`} opacity={1 - ringO} style={{filter: 'drop-shadow(0 0 6px rgba(120,175,255,0.95))'}}><Plates phi={g.phi} /></g>
        {ringO > 0 ? (
          <g opacity={ringO}>
            <path d={`M ${-26} 0 a 26 26 0 1 0 52 0 a 26 26 0 1 0 -52 0 Z M ${-HOLE} 0 a ${HOLE} ${HOLE} 0 1 1 ${2 * HOLE} 0 a ${HOLE} ${HOLE} 0 1 1 ${-2 * HOLE} 0 Z`}
              fill="url(#gPlate)" fillRule="evenodd" stroke="#EAF3FF" strokeWidth={0.8} />
            <circle r={HOLE + 1.2} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.9} />
            <circle r={19} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={0.8} />
          </g>
        ) : null}
      </g>
    </svg>
  );
};
