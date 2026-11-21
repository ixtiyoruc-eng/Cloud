// Summary MG over the first half of the CTA line. v2 (2026-11-21): the speaker stays visible - the footage shrinks into a
// round face window at the top (framed on the tracked face) and the OZIŞ / SAMIRIŞ table sits below it, inside the safe zone.
// Rows pop on half beats (each touched by the guide); "Saqlab qöying" pins beside the window. Rises in, whips out left.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SUM, WIN, sumPlace} from './layout';
import {C, EASE_EXPO, F, FONT, glass, hit, popScale, prog, textW} from './theme';
import {TL} from './timeline';
import {MBlur} from './Fx';

const txt = (size: number, weight = 800, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: -0.02 * size, lineHeight: 1.05, whiteSpace: 'nowrap'});
const LIGHT_BG = 'linear-gradient(180deg, #FFFFFF 0%, #D3E3FF 100%)';
const BLUE_BG = 'linear-gradient(180deg, #4C8DFF 0%, #2457D6 100%)';

export const Summary: React.FC<{tl: TL}> = ({tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < tl.mgIn.a || t >= tl.mgOut.b) return null;
  const rise = EASE_EXPO(prog(t, tl.mgIn.a, tl.mgIn.b - tl.mgIn.a + 0.1, (q) => q));
  const out = prog(t, tl.mgOut.a, tl.mgOut.b - tl.mgOut.a, (q) => q * q);
  const {rows, colX} = sumPlace();
  const headAt = tl.mgIn.b + 0.02;
  const titleP = prog(t, tl.mgIn.b - 0.05, 0.3, EASE_EXPO);
  const pinT = tl.snap(tl.rowAt[tl.rowAt.length - 1] + 0.3, 0.2);
  const pin = popScale(t, pinT, 0, 0.1, 0.3);
  const bx = out * 60, by = (1 - rise) * 50;
  const ring = (t - tl.mgIn.a) * 25;
  // face window: scale the plate so the tracked face fills ~80% of the circle, centred
  const f = tl.face.at(t); const fw = Math.max(f.x1 - f.x0, (f.y1 - f.y0) * 0.8);
  const k = (WIN.r * 2 * 0.86) / fw; const fcx = (f.x0 + f.x1) / 2, fcy = (f.y0 + f.y1) / 2 + (f.y1 - f.y0) * 0.04;
  const winP = popScale(t, tl.mgIn.b - 0.04, 0.3, 0.1, 0.32);
  const wg = hit(t, tl.mgIn.b, 0.2);
  return (
    <>
      <MBlur id="sum-mb" sx={bx} sy={by} />
      <AbsoluteFill style={{translate: `${-out * 1100}px ${(1 - rise) * 1920}px`, filter: bx > 0.5 || by > 0.5 ? 'url(#sum-mb)' : undefined}}>
        <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 30%, #12307A 0%, #0A1B3D 55%, #050C1F 100%)'}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <defs><radialGradient id="sumGlow"><stop offset="0" stopColor="#3D7BFF" stopOpacity="0.4" /><stop offset="1" stopColor="#3D7BFF" stopOpacity="0" /></radialGradient></defs>
          <circle cx={WIN.cx} cy={WIN.cy} r={WIN.r * 2.2} fill="url(#sumGlow)" />
          {[WIN.r + 30, WIN.r + 70, WIN.r + 130].map((r, i) => <circle key={r} cx={WIN.cx} cy={WIN.cy} r={r} fill="none" stroke="rgba(111,168,255,0.22)" strokeWidth={i === 1 ? 3 : 2}
            strokeDasharray={i === 1 ? '14 22' : undefined} transform={`rotate(${ring * (i % 2 ? -1 : 1)} ${WIN.cx} ${WIN.cy})`} />)}
        </svg>
        {/* the speaker, framed in a round window */}
        <div style={{position: 'absolute', left: WIN.cx - WIN.r, top: WIN.cy - WIN.r, width: WIN.r * 2, height: WIN.r * 2, borderRadius: WIN.r, overflow: 'hidden', scale: String(winP),
          border: '5px solid rgba(220,235,255,0.9)', boxShadow: `0 0 ${40 + 60 * wg}px rgba(90,150,255,0.9), 0 20px 50px rgba(2,8,28,0.6)`}}>
          <div style={{position: 'absolute', left: WIN.r - fcx * k, top: WIN.r - fcy * k, width: 1080, height: 1920, scale: String(k), transformOrigin: '0 0'}}>
            <OffthreadVideo src={staticFile('plate.mp4')} muted />
          </div>
        </div>
        {/* save pin beside the window */}
        {t >= pinT - 2 * F ? (() => { const w = textW('Saqlab qöying', 32, 800) + 90; return (
          <div style={{position: 'absolute', left: WIN.cx + WIN.r - 20, top: WIN.cy + WIN.r - 44, width: w, height: 64, borderRadius: 32, background: LIGHT_BG, scale: String(pin), transformOrigin: '0% 50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: `0 0 ${30 + 40 * hit(t, pinT, 0.14)}px rgba(207,227,255,0.8)`, ...txt(32, 800, C.ink)}}>
            <svg width={26} height={26} viewBox="0 0 24 24"><path d="M14 3 L21 10 L18 11 L13 16 L13 20 L11 20 L4 13 L4 11 L8 11 L13 6 L14 3 Z M7 17 L3 21" fill={C.cobalt} stroke={C.cobalt} strokeWidth={1.5} strokeLinejoin="round" /></svg>Saqlab qöying</div>); })() : null}
        {/* title */}
        <div style={{position: 'absolute', left: colX.oz, width: colX.sam + SUM.colW - colX.oz, top: SUM.titleY - 36, display: 'flex', justifyContent: 'center', opacity: titleP, translate: `0px ${(1 - titleP) * 30}px`}}>
          <span style={{...txt(64, 900), textShadow: '0 0 40px rgba(90,150,255,0.7)'}}>Ozişda vs Samirişda</span>
        </div>
        {/* column heads */}
        {(['oz', 'sam'] as const).map((s, i) => {
          const p = popScale(t, headAt + i * 0.08, 0.2, 0.12, 0.28); const light = s === 'oz';
          return (
            <div key={s} style={{position: 'absolute', left: colX[s], top: SUM.colTop, width: SUM.colW, height: 70, borderRadius: 35, background: light ? LIGHT_BG : BLUE_BG,
              border: '2px solid rgba(220,235,255,0.8)', boxShadow: '0 0 40px rgba(90,150,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(44, 900, light ? C.ink : C.white),
              scale: String(p), opacity: prog(t, headAt + i * 0.08, 2 * F, (q) => q)}}>{light ? 'OZIŞ' : 'SAMIRIŞ'}</div>);
        })}
        {/* rows */}
        {rows.map((r, i) => {
          const a = tl.rowAt[i]; if (t < a - 2 * F) return null;
          const p = popScale(t, a - 2 * F, 0.3, 0.12, 0.28); const g = hit(t, a, 0.14);
          const fromX = r.side === 'oz' ? -80 : r.side === 'sam' ? 80 : 0;
          const ex = prog(t, a - 2 * F, 0.22, EASE_EXPO);
          const both = r.side === 'both';
          return (
            <div key={i} style={{position: 'absolute', left: r.left, top: r.top, width: r.w, height: SUM.rowCard, scale: String(p), opacity: prog(t, a - 2 * F, 2 * F, (q) => q), translate: `${(1 - ex) * fromX}px 0px`,
              ...glass(26, true), boxShadow: `0 0 ${24 + 40 * g}px rgba(80,145,255,${0.35 + 0.5 * g}), 0 14px 30px rgba(2,8,28,0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: both ? 'center' : 'flex-start', gap: 14, padding: '0 26px'}}>
              <span style={{width: 14, height: 14, borderRadius: 7, background: g > 0.4 ? '#fff' : C.soft, boxShadow: '0 0 14px rgba(111,168,255,0.95)', flex: 'none'}} />
              <span style={txt(44, 800)}>{r.name}</span>
              {r.sub ? <span style={txt(30, 600, C.icy)}>{r.sub}</span> : null}
              {both ? <span style={txt(32, 700, C.icy)}>— ikkalasida ham</span> : null}
            </div>);
        })}
      </AbsoluteFill>
    </>
  );
};
