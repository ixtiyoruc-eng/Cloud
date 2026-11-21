// OZIŞ vs SAMIRIŞ layer: the hook slams the two words over the chest, they fly up and become the tracker pills; every
// verdict sends a glass chip (carried by the guide) from under the hero word into its pill and bumps the counter;
// info chips open beside the head during the explanation lines; CTA pills at the end.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Edl, Info} from './types';
import {CHIP_FROM, HOOK, PILL, PILL_X, chipTargets, counts, infoPlace} from './layout';
import {C, EASE_EXPO, EASE_SOFT, F, FONT, glass, hit, lerp, popScale, prog, textW} from './theme';
import {TL} from './timeline';

const txt = (size: number, weight = 800, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: -0.02 * size, lineHeight: 1, whiteSpace: 'nowrap'});
// OZIŞ = light world (paper pill, ink text), SAMIRIŞ = cobalt world (solid blue pill, white text)
const LIGHT_BG = 'linear-gradient(180deg, #FFFFFF 0%, #D3E3FF 100%)';
const BLUE_BG = 'linear-gradient(180deg, #4C8DFF 0%, #2457D6 100%)';

const Icon: React.FC<{k: Info['icon']; s?: number}> = ({k, s = 30}) => (
  <svg width={s} height={s} viewBox="0 0 30 30" style={{flex: 'none'}}>
    {k === 'up' ? <path d="M15 25 V6 M7 13 L15 5 L23 13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {k === 'down' ? <path d="M15 5 V24 M7 17 L15 25 L23 17" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {k === 'bolt' ? <path d="M17 3 L7 17 H14 L12 27 L23 12 H16 Z" fill="#fff" /> : null}
    {k === 'check' ? <path d="M6 16 L12 22 L24 8" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
  </svg>
);

const HookWord: React.FC<{word: string; x: number; y: number; size: number; t: number; t0: number; light: boolean; fly: number; to: {x: number; y: number}}> = ({word, x, y, size, t, t0, light, fly, to}) => {
  if (t < t0 - 2 * F) return null;
  const p = popScale(t, t0 - 2 * F, 1.9, -0.08, 0.3);
  const op = prog(t, t0 - 2 * F, 2 * F, (q) => q);
  const g = hit(t, t0, 0.12);
  const ghost = prog(t, t0 + 2 * F, 0.35, EASE_EXPO) * (1 - fly);
  const cx = lerp(x, to.x, fly), cy = lerp(y, to.y, fly), sz = lerp(size, 50, fly);
  const w = textW(word, sz, 900);
  const bg = prog(fly, 0.5, 0.5, (q) => q);
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top: cy - sz * 0.55, height: sz * 1.1, width: w, opacity: op * (1 - prog(fly, 0.85, 0.15, (q) => q)), scale: String(p), transformOrigin: '50% 50%'}}>
      {[-1, 1].map((d) => (
        <div key={d} style={{position: 'absolute', inset: 0, ...txt(sz, 900, 'transparent'), WebkitTextStroke: `3px rgba(156,203,255,${0.55 * ghost})`, translate: `0px ${d * ghost * sz * 0.82}px`, opacity: ghost}}>{word}</div>
      ))}
      {bg > 0 ? <div style={{position: 'absolute', left: -30, right: -30, top: -14, bottom: -14, borderRadius: 60, background: light ? LIGHT_BG : BLUE_BG, opacity: bg}} /> : null}
      <div style={{position: 'absolute', inset: 0, ...txt(sz, 900, light && fly > 0.5 ? C.ink : C.white),
        textShadow: fly > 0.5 ? 'none' : `0 6px 30px rgba(0,8,32,0.7), 0 0 ${30 + 60 * g}px rgba(${light ? '207,227,255' : '61,123,255'},${0.6 + 0.4 * g})`}}>{word}</div>
    </div>
  );
};

const TrackerPill: React.FC<{side: 'oz' | 'sam'; t: number; n: number; land: number; born: number}> = ({side, t, n, land, born}) => {
  const light = side === 'oz';
  const g = hit(t, land, 0.16);
  const cp = popScale(t, land, 1.8, -0.1, 0.3);
  const name = side === 'oz' ? 'OZIŞ' : 'SAMIRIŞ';
  const w = PILL.w, x = PILL_X[side];
  const op = prog(t, born, 3 * F, (q) => q);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: PILL.y - PILL.h / 2, width: w, height: PILL.h, opacity: op, scale: String(1 + 0.08 * g), transformOrigin: light ? '100% 50%' : '0% 50%'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: PILL.h / 2, background: light ? LIGHT_BG : BLUE_BG, border: '2px solid rgba(220,235,255,0.8)',
        boxShadow: `0 16px 40px rgba(2,8,28,0.5), 0 0 ${30 + 60 * g}px rgba(${light ? '207,227,255' : '61,123,255'},${0.45 + 0.5 * g})`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexDirection: light ? 'row' : 'row-reverse'}}>
        <span style={txt(50, 900, light ? C.ink : C.white)}>{name}</span>
        <span style={{width: 62, height: 62, borderRadius: 31, background: light ? C.cobalt : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...txt(38, 900, light ? C.white : C.cobalt), scale: String(n ? cp : 1), boxShadow: `0 0 ${10 + 30 * g}px rgba(255,255,255,${0.3 + 0.6 * g})`}}>{n}</span>
      </div>
    </div>
  );
};

export const Versus: React.FC<{edl: Edl; tl: TL}> = ({edl, tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const els: React.ReactNode[] = [];
  const h0 = edl.captions[0].words[0].t, hv = edl.captions[1].words[0].t, hs = edl.captions[1].words[edl.captions[1].words.length - 1].t;
  const fly = prog(t, tl.hookEnd - 0.08, 0.38, EASE_EXPO);
  const trackerOn = t < tl.mgIn.a + 0.05;

  // ---------------- hook ----------------
  if (t < tl.hookEnd + 0.4) {
    els.push(<HookWord key="hz" word="OZIŞ" x={HOOK.oz.x} y={HOOK.oz.y} size={HOOK.oz.size} t={t} t0={h0} light fly={fly} to={{x: PILL_X.oz - 30, y: PILL.y}} />);
    els.push(<HookWord key="hs" word="SAMIRIŞ" x={HOOK.sam.x} y={HOOK.sam.y} size={HOOK.sam.size} t={t} t0={hs} light={false} fly={fly} to={{x: PILL_X.sam + 30, y: PILL.y}} />);
    if (t >= hv - 2 * F) {
      const p = popScale(t, hv - 2 * F, 0.2, 0.2, 0.3); const o = 1 - fly;
      const cy = lerp(HOOK.vs.y, PILL.y, fly);
      els.push(
        <div key="vs" style={{position: 'absolute', left: 540 - 62, top: cy - 62, width: 124, height: 124, borderRadius: 62, background: 'radial-gradient(circle at 35% 30%, #9CCBFF, #2457D6 70%)',
          boxShadow: `0 0 ${40 + 50 * hit(t, hv, 0.14)}px rgba(90,150,255,0.95)`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(58, 900), scale: String(p * lerp(1, 0.55, fly)), opacity: Math.max(o, 0.001) > 0.02 || fly < 1 ? 1 : 0}}>VS</div>);
    }
  }
  // ---------------- tracker ----------------
  if (t >= tl.hookEnd + 0.18 && trackerOn) {
    const out = prog(t, tl.mgIn.a - 0.1, 0.15, (q) => q);
    const c = counts(edl, t);
    const lastLand = (s: 'oz' | 'sam') => { let L = -9; for (const v of edl.verdicts) chipTargets(v.side).forEach((q, k) => { const ta = v.t + 0.42 + k * 0.36; if (q === s && ta <= t) L = ta; }); return L; };
    els.push(
      <div key="trk" style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
        <TrackerPill side="oz" t={t} n={c.oz} land={lastLand('oz')} born={tl.hookEnd + 0.18} />
        <TrackerPill side="sam" t={t} n={c.sam} land={lastLand('sam')} born={tl.hookEnd + 0.18} />
        <div style={{position: 'absolute', left: 540 - 34, top: PILL.y - 34, width: 68, height: 68, borderRadius: 34, background: 'radial-gradient(circle at 35% 30%, #9CCBFF, #2457D6 70%)',
          border: '2px solid rgba(220,235,255,0.8)', boxShadow: '0 0 30px rgba(90,150,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(30, 900)}}>VS</div>
      </div>);
  }
  // ---------------- verdict chips ----------------
  for (const v of edl.verdicts) {
    chipTargets(v.side).forEach((s, k) => {
      const a = v.t, land = v.t + 0.42 + k * 0.36;
      if (t < a - 2 * F || t > land + 0.05) return;
      const fu = EASE_SOFT(prog(t, land - 0.32, 0.32, (q) => q));
      const tx = PILL_X[s], ty = PILL.y;
      const mx = (CHIP_FROM.x + tx) / 2 + (s === 'oz' ? -160 : 160), my = (CHIP_FROM.y + ty) / 2;
      const x = (1 - fu) * (1 - fu) * CHIP_FROM.x + 2 * (1 - fu) * fu * mx + fu * fu * tx;
      const y = (1 - fu) * (1 - fu) * CHIP_FROM.y + 2 * (1 - fu) * fu * my + fu * fu * ty;
      const sc = popScale(t, a - 2 * F, 0.2, 0.12, 0.28) * lerp(1, 0.4, fu);
      const w = textW(v.label, 52, 800) + 84;
      const light = s === 'oz';
      els.push(
        <div key={`ch${v.t}-${k}`} style={{position: 'absolute', left: x - w / 2, top: y - 46, width: w, height: 92, scale: String(sc), opacity: 1 - prog(fu, 0.85, 0.15, (q) => q),
          ...glass(46, true), background: light ? LIGHT_BG : BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(52, 800, light ? C.ink : C.white),
          filter: fu > 0.2 && fu < 0.9 ? 'blur(1.5px)' : undefined}}>{v.label}</div>);
    });
  }
  // ---------------- info chips ----------------
  for (const x of edl.info) {
    if (t < x.t - 2 * F || t > x.out_end + 0.01) continue;
    const p = infoPlace(edl.info, x);
    const u = popScale(t, x.t - 2 * F, 0, 0.08, 0.3); const o = prog(t, x.out_end - 5 * F, 5 * F, (q) => q);
    const tx = prog(t, x.t, 0.22, EASE_EXPO); const g = hit(t, x.t, 0.12);
    els.push(
      <div key={'in' + x.t} style={{position: 'absolute', left: p.left, top: p.top, width: p.w, height: p.h, opacity: (1 - o) * prog(t, x.t - 2 * F, 2 * F, (q) => q), filter: o > 0.05 ? `blur(${o * 8}px)` : undefined}}>
        <div style={{...glass(p.h / 2, true), position: 'absolute', inset: 0, transformOrigin: x.side === 'L' ? '0% 50%' : '100% 50%', scale: `${Math.max(0.001, u)} ${0.7 + 0.3 * Math.min(1, u)}`,
          boxShadow: `0 0 ${30 + 40 * g}px rgba(80,145,255,${0.4 + 0.5 * g}), 0 18px 40px rgba(2,8,28,0.5)`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px', flexDirection: x.side === 'L' ? 'row' : 'row-reverse', ...txt(44, 700)}}>
          <span style={{width: 50, height: 50, borderRadius: 25, background: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 ${12 + 24 * g}px rgba(110,170,255,0.9)`}}><Icon k={x.icon} /></span>
          <span style={{opacity: tx, translate: `${(1 - tx) * (x.side === 'L' ? -24 : 24)}px 0px`}}>{x.label}</span>
        </div>
      </div>);
  }
  // ---------------- CTA pills ----------------
  const cta = [{t: tl.cta.obuna, label: 'Obuna · Atlet.uz Xorazm', top: 262, dot: true}, {t: tl.cta.layk, label: '♥  Layk', top: 372, dot: false}];
  for (const c of cta) {
    if (t < c.t - 2 * F) continue;
    const w = textW(c.label, 46, 800) + (c.dot ? 120 : 80); const left = 540 - w / 2;
    const u = popScale(t, c.t - 2 * F, 0, 0.08, 0.3); const g = hit(t, c.t, 0.14); const tx = prog(t, c.t, 0.22, EASE_EXPO);
    els.push(
      <div key={'cta' + c.t} style={{position: 'absolute', left, top: c.top, width: w, height: 92}}>
        <div style={{...glass(46, true), position: 'absolute', inset: 0, background: c.dot ? BLUE_BG : LIGHT_BG, transformOrigin: '0% 50%', scale: `${Math.max(0.001, u)} 1`, boxShadow: `0 0 ${30 + 50 * g}px rgba(80,145,255,${0.5 + 0.5 * g})`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, ...txt(46, 800, c.dot ? C.white : C.ink), opacity: tx}}>
          {c.dot ? <span style={{width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 0 16px #fff'}} /> : null}{c.label}
        </div>
      </div>);
  }
  return <>{els}</>;
};
