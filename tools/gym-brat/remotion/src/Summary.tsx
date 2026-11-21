// Full-screen summary MG over the first half of the CTA line: the whole list sorted into OZIŞ / SAMIRIŞ columns,
// one row per half beat (each touched by the guide), "Saqlab qöying" at the end. Rises in from below, whips out left.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {SUM, sumPlace} from './layout';
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
  const lastRow = tl.rowAt[tl.rowAt.length - 1];
  const pinT = tl.snap(lastRow + 0.3, 0.2);
  const pin = popScale(t, pinT, 0, 0.1, 0.3);
  const bx = (1 - rise) * 0 + out * 60, by = (1 - rise) * 50;
  const ring = (t - tl.mgIn.a) * 25;
  return (
    <>
      <MBlur id="sum-mb" sx={bx} sy={by} />
      <AbsoluteFill style={{translate: `${-out * 1100}px ${(1 - rise) * 1920}px`, filter: bx > 0.5 || by > 0.5 ? 'url(#sum-mb)' : undefined}}>
        <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 30%, #12307A 0%, #0A1B3D 55%, #050C1F 100%)'}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {[380, 560, 760].map((r, k) => <circle key={r} cx={540} cy={820} r={r} fill="none" stroke="rgba(111,168,255,0.16)" strokeWidth={k === 1 ? 3 : 2} strokeDasharray={k === 1 ? '14 22' : undefined} transform={`rotate(${ring * (k % 2 ? -1 : 1)} 540 820)`} />)}
          <circle cx={540} cy={820} r={300} fill="url(#sumGlow)" />
          <defs><radialGradient id="sumGlow"><stop offset="0" stopColor="#3D7BFF" stopOpacity="0.35" /><stop offset="1" stopColor="#3D7BFF" stopOpacity="0" /></radialGradient></defs>
        </svg>
        {/* title with ghost copies */}
        <div style={{position: 'absolute', left: 0, right: 0, top: SUM.titleY - 50, display: 'flex', justifyContent: 'center', opacity: titleP, translate: `0px ${(1 - titleP) * 40}px`}}>
          <div style={{position: 'relative', ...txt(84, 900)}}>
            {[-1, 1].map((d) => <div key={d} style={{position: 'absolute', inset: 0, color: 'transparent', WebkitTextStroke: '2px rgba(156,203,255,0.35)', translate: `0px ${d * titleP * 70}px`}}>Ozişda vs Samirişda</div>)}
            <span style={{position: 'relative', textShadow: '0 0 40px rgba(90,150,255,0.7)'}}>Ozişda vs Samirişda</span>
          </div>
        </div>
        {/* column heads */}
        {(['oz', 'sam'] as const).map((s, k) => {
          const p = popScale(t, headAt + k * 0.08, 0.2, 0.12, 0.28); const light = s === 'oz';
          return (
            <div key={s} style={{position: 'absolute', left: colX[s], top: SUM.colTop, width: SUM.colW, height: 86, borderRadius: 43, background: light ? LIGHT_BG : BLUE_BG,
              border: '2px solid rgba(220,235,255,0.8)', boxShadow: '0 0 40px rgba(90,150,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(50, 900, light ? C.ink : C.white),
              scale: String(p), opacity: prog(t, headAt + k * 0.08, 2 * F, (q) => q)}}>{light ? 'OZIŞ' : 'SAMIRIŞ'}</div>);
        })}
        {/* rows */}
        {rows.map((r, i) => {
          const a = tl.rowAt[i]; if (t < a - 2 * F) return null;
          const p = popScale(t, a - 2 * F, 0.3, 0.12, 0.28); const g = hit(t, a, 0.14);
          const fromX = r.side === 'oz' ? -80 : r.side === 'sam' ? 80 : 0;
          const ex = prog(t, a - 2 * F, 0.22, EASE_EXPO);
          const both = r.side === 'both';
          return (
            <div key={i} style={{position: 'absolute', left: r.left, top: r.top, width: r.w, height: 100, scale: String(p), opacity: prog(t, a - 2 * F, 2 * F, (q) => q), translate: `${(1 - ex) * fromX}px 0px`,
              ...glass(30, true), boxShadow: `0 0 ${24 + 40 * g}px rgba(80,145,255,${0.35 + 0.5 * g}), 0 14px 30px rgba(2,8,28,0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: both ? 'center' : 'flex-start', gap: 16, padding: '0 30px'}}>
              <span style={{width: 16, height: 16, borderRadius: 8, background: g > 0.4 ? '#fff' : C.soft, boxShadow: '0 0 14px rgba(111,168,255,0.95)', flex: 'none'}} />
              <span style={txt(50, 800)}>{r.name}</span>
              {r.sub ? <span style={txt(34, 600, C.icy)}>{r.sub}</span> : null}
              {both ? <span style={{...txt(34, 700, C.icy)}}>— ikkalasida ham</span> : null}
            </div>);
        })}
        {/* save prompt */}
        {t >= pinT - 2 * F ? (() => { const w = textW('Saqlab qöying', 46, 800) + 110; const last = rows[rows.length - 1]; const top = Math.max(...rows.map((r) => r.top)) + 130;
          void last;
          return <div style={{position: 'absolute', left: 540 - w / 2, top, width: w, height: 84, borderRadius: 42, background: LIGHT_BG, scale: String(pin), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            boxShadow: `0 0 ${30 + 40 * hit(t, pinT, 0.14)}px rgba(207,227,255,0.8)`, ...txt(46, 800, C.ink)}}>
            <svg width={34} height={34} viewBox="0 0 24 24"><path d="M14 3 L21 10 L18 11 L13 16 L13 20 L11 20 L4 13 L4 11 L8 11 L13 6 L14 3 Z M7 17 L3 21" fill={C.cobalt} stroke={C.cobalt} strokeWidth={1.5} strokeLinejoin="round" /></svg>Saqlab qöying</div>; })() : null}
      </AbsoluteFill>
    </>
  );
};
