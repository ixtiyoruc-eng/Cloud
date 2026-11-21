// OZIŞ vs SAMIRIŞ layer: the hook slams the two words over the chest, they fly up round the sides of the head and become
// the tracker pills in the top corners; every verdict sends a glass chip (carried by the guide) from under the hero word
// into its pill and bumps the counter; info chips open under the chin (or beside the face); CTA pills at the end.
// v2 (2026-11-21): nothing passes over the face (paths go round the sides, boxes are pushed off the face box) and
// everything sits inside the stricter safe zone of layout.ts.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Edl, Info} from './types';
import {CHIP_FROM, HOOK, PILL, PILL_X, SAFE, chipTargets, counts} from './layout';
import {C, EASE_EXPO, EASE_SOFT, F, FONT, glass, hit, lerp, popScale, prog, textW} from './theme';
import {TL} from './timeline';
import {avoidBox, overlaps} from './face';

const txt = (size: number, weight = 800, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: -0.02 * size, lineHeight: 1, whiteSpace: 'nowrap'});
// OZIŞ = light world (paper pill, ink text), SAMIRIŞ = cobalt world (solid blue pill, white text)
const LIGHT_BG = 'linear-gradient(180deg, #FFFFFF 0%, #D3E3FF 100%)';
const BLUE_BG = 'linear-gradient(180deg, #4C8DFF 0%, #2457D6 100%)';

const Icon: React.FC<{k: Info['icon']; s?: number}> = ({k, s = 28}) => (
  <svg width={s} height={s} viewBox="0 0 30 30" style={{flex: 'none'}}>
    {k === 'up' ? <path d="M15 25 V6 M7 13 L15 5 L23 13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {k === 'down' ? <path d="M15 5 V24 M7 17 L15 25 L23 17" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {k === 'bolt' ? <path d="M17 3 L7 17 H14 L12 27 L23 12 H16 Z" fill="#fff" /> : null}
    {k === 'check' ? <path d="M6 16 L12 22 L24 8" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
  </svg>
);

/** quadratic path from a to b that bows out to the side of the frame (so it goes round the head, not across it) */
const sidePath = (a: {x: number; y: number}, b: {x: number; y: number}, side: -1 | 1, u: number) => {
  const c = {x: side < 0 ? -260 : 1340, y: (a.y + b.y) / 2 + 80};
  return {x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y};
};

export const Versus: React.FC<{edl: Edl; tl: TL}> = ({edl, tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const face = tl.faceAt(t);
  const els: React.ReactNode[] = [];
  const h0 = edl.captions[0].words[0].t, hv = edl.captions[1].words[0].t, hs = edl.captions[1].words[edl.captions[1].words.length - 1].t;
  const fly = prog(t, tl.hookEnd - 0.08, 0.42, EASE_EXPO);
  const born = tl.hookEnd + 0.3;

  // ---------------- hook: giant words over the chest, then they fly round the head into the corner pills ----------------
  if (t < born + 0.05) {
    ([['oz', 'OZIŞ', h0, -1], ['sam', 'SAMIRIŞ', hs, 1]] as const).forEach(([k, word, t0, side]) => {
      if (t < t0 - 2 * F) return;
      const H = HOOK[k];
      const p = popScale(t, t0 - 2 * F, 1.9, -0.08, 0.3); const g = hit(t, t0, 0.12);
      const q = sidePath({x: H.x, y: H.y}, {x: PILL_X[k], y: PILL.y}, side, fly);
      const sz = lerp(H.size, 46, fly); const w = textW(word, sz, 900);
      const light = k === 'oz';
      els.push(
        <div key={'h' + k} style={{position: 'absolute', left: q.x - w / 2, top: q.y - sz * 0.55, width: w, height: sz * 1.1, scale: String(p), opacity: 1 - prog(fly, 0.8, 0.2, (x) => x),
          ...txt(sz, 900, C.white), filter: fly > 0.1 && fly < 0.9 ? 'blur(2px)' : undefined,
          textShadow: `0 6px 30px rgba(0,8,32,0.7), 0 0 ${30 + 60 * g}px rgba(${light ? '207,227,255' : '61,123,255'},${0.6 + 0.4 * g})`}}>{word}</div>);
    });
    if (t >= hv - 2 * F && fly < 1) {
      const p = popScale(t, hv - 2 * F, 0.2, 0.2, 0.3) * (1 - fly);
      els.push(
        <div key="vs" style={{position: 'absolute', left: HOOK.vs.x - 50, top: HOOK.vs.y - 50, width: 100, height: 100, borderRadius: 50, background: 'radial-gradient(circle at 35% 30%, #9CCBFF, #2457D6 70%)',
          boxShadow: `0 0 ${40 + 50 * hit(t, hv, 0.14)}px rgba(90,150,255,0.95)`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(46, 900), scale: String(p)}}>VS</div>);
    }
  }
  // ---------------- tracker pills (top corners) ----------------
  if (t >= born && t < tl.mgIn.a + 0.05) {
    const out = prog(t, tl.mgIn.a - 0.1, 0.15, (q) => q);
    const c = counts(edl, t);
    const lastLand = (s: 'oz' | 'sam') => { let L = -9; edl.verdicts.forEach((v) => chipTargets(v.side).forEach((q, k) => { const ta = v.t + 0.42 + k * 0.36; if (q === s && ta <= t) L = ta; })); return L; };
    (['oz', 'sam'] as const).forEach((s) => {
      const light = s === 'oz'; const land = lastLand(s); const g = hit(t, land, 0.16); const cp = popScale(t, land, 1.8, -0.1, 0.3);
      const pin = popScale(t, born, 0.3, 0.12, 0.3);
      els.push(
        <div key={'p' + s} style={{position: 'absolute', left: PILL_X[s] - PILL.w / 2, top: PILL.y - PILL.h / 2, width: PILL.w, height: PILL.h, opacity: 1 - out, scale: String(pin * (1 + 0.08 * g)), transformOrigin: light ? '0% 50%' : '100% 50%'}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: PILL.h / 2, background: light ? LIGHT_BG : BLUE_BG, border: '2px solid rgba(220,235,255,0.8)',
            boxShadow: `0 16px 40px rgba(2,8,28,0.5), 0 0 ${30 + 60 * g}px rgba(${light ? '207,227,255' : '61,123,255'},${0.45 + 0.5 * g})`}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexDirection: light ? 'row' : 'row-reverse'}}>
            <span style={txt(44, 900, light ? C.ink : C.white)}>{light ? 'OZIŞ' : 'SAMIRIŞ'}</span>
            <span style={{width: 56, height: 56, borderRadius: 28, background: light ? C.cobalt : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...txt(34, 900, light ? C.white : C.cobalt), scale: String(c[s] ? cp : 1), boxShadow: `0 0 ${10 + 30 * g}px rgba(255,255,255,${0.3 + 0.6 * g})`}}>{c[s]}</span>
          </div>
        </div>);
    });
    // small VS between the pills, only when the head is clear of it
    const vsBox = {x0: 540 - 34, y0: PILL.y - 34, x1: 540 + 34, y1: PILL.y + 34};
    const vsO = overlaps(vsBox, tl.faceAt(t)) ? 0 : 1;
    if (vsO) els.push(<div key="vss" style={{position: 'absolute', left: vsBox.x0, top: vsBox.y0, width: 68, height: 68, borderRadius: 34, background: 'radial-gradient(circle at 35% 30%, #9CCBFF, #2457D6 70%)',
      border: '2px solid rgba(220,235,255,0.8)', boxShadow: '0 0 30px rgba(90,150,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(28, 900), opacity: 1 - out}}>VS</div>);
  }
  // ---------------- verdict chips: under the hero word -> round the head -> into the pill ----------------
  for (const v of edl.verdicts) {
    chipTargets(v.side).forEach((s, k) => {
      const a = v.t, land = v.t + 0.42 + k * 0.36;
      if (t < a - 2 * F || t > land + 0.05) return;
      const fu = EASE_SOFT(prog(t, land - 0.32, 0.32, (q) => q));
      const q = sidePath(CHIP_FROM, {x: PILL_X[s], y: PILL.y}, s === 'oz' ? -1 : 1, fu);
      const sc = popScale(t, a - 2 * F, 0.2, 0.12, 0.28) * lerp(1, 0.35, Math.pow(fu, 0.6));
      const w0 = textW(v.label, 50, 800) + 80, w = w0 * sc, h = 88 * sc;
      let b = {x0: q.x - w / 2, y0: q.y - h / 2, x1: q.x + w / 2, y1: q.y + h / 2};
      b = avoidBox(b, {x0: face.x0 - 16, y0: face.y0 - 16, x1: face.x1 + 16, y1: face.y1 + 16}, s === 'oz' ? -1 : 1);
      const light = s === 'oz';
      els.push(
        <div key={`ch${v.t}-${k}`} style={{position: 'absolute', left: (b.x0 + b.x1) / 2 - w0 / 2, top: (b.y0 + b.y1) / 2 - 44, width: w0, height: 88, scale: String(sc), opacity: 1 - prog(fu, 0.85, 0.15, (x) => x),
          ...glass(44, true), background: light ? LIGHT_BG : BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(50, 800, light ? C.ink : C.white),
          filter: fu > 0.2 && fu < 0.9 ? 'blur(1.5px)' : undefined}}>{v.label}</div>);
    });
  }
  // ---------------- info chips ----------------
  for (const x of edl.info) {
    if (t < x.t - 2 * F || t > x.out_end + 0.01) continue;
    const p = tl.info.get(x)!;
    const u = popScale(t, x.t - 2 * F, 0, 0.08, 0.3); const o = prog(t, x.out_end - 5 * F, 5 * F, (q) => q);
    const tx = prog(t, x.t, 0.22, EASE_EXPO); const g = hit(t, x.t, 0.12);
    els.push(
      <div key={'in' + x.t} style={{position: 'absolute', left: p.left, top: p.top, width: p.w, height: p.h, opacity: (1 - o) * prog(t, x.t - 2 * F, 2 * F, (q) => q), filter: o > 0.05 ? `blur(${o * 8}px)` : undefined}}>
        <div style={{...glass(p.h / 2, true), position: 'absolute', inset: 0, transformOrigin: '0% 50%', scale: `${Math.max(0.001, u)} ${0.7 + 0.3 * Math.min(1, u)}`,
          boxShadow: `0 0 ${30 + 40 * g}px rgba(80,145,255,${0.4 + 0.5 * g}), 0 18px 40px rgba(2,8,28,0.5)`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px', ...txt(42, 700)}}>
          <span style={{width: 46, height: 46, borderRadius: 23, background: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 ${12 + 24 * g}px rgba(110,170,255,0.9)`}}><Icon k={x.icon} /></span>
          <span style={{opacity: tx, translate: `${(1 - tx) * -24}px 0px`}}>{x.label}</span>
        </div>
      </div>);
  }
  // ---------------- CTA pills: one row at the top ----------------
  const ctaDef = [{t: tl.cta.obuna, label: 'Obuna · Atlet.uz Xorazm', blue: true}, {t: tl.cta.layk, label: '♥ Layk', blue: false}];
  const ws = ctaDef.map((c) => textW(c.label, 40, 800) + (c.blue ? 100 : 70));
  let left = (SAFE.left + SAFE.right) / 2 - (ws[0] + ws[1] + 16) / 2;
  ctaDef.forEach((c, k) => {
    const w = ws[k]; const x0 = left; left += w + 16;
    if (t < c.t - 2 * F) return;
    const u = popScale(t, c.t - 2 * F, 0, 0.08, 0.3); const g = hit(t, c.t, 0.14); const tx = prog(t, c.t, 0.22, EASE_EXPO);
    els.push(
      <div key={'cta' + k} style={{position: 'absolute', left: x0, top: SAFE.top + 4, width: w, height: 80}}>
        <div style={{...glass(40, true), position: 'absolute', inset: 0, background: c.blue ? BLUE_BG : LIGHT_BG, transformOrigin: '0% 50%', scale: `${Math.max(0.001, u)} 1`, boxShadow: `0 0 ${30 + 50 * g}px rgba(80,145,255,${0.5 + 0.5 * g})`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, ...txt(40, 800, c.blue ? C.white : C.ink), opacity: tx}}>
          {c.blue ? <span style={{width: 16, height: 16, borderRadius: 8, background: '#fff', boxShadow: '0 0 16px #fff'}} /> : null}{c.label}
        </div>
      </div>);
  });
  return <>{els}</>;
};
