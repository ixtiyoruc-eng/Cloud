// UI cards over the talking head (B-style snappy pops, A-style hero words). Every card opens from the point
// where the guide lands (uiPlaces().ax/ay), so the dumbbell "knocks it open".
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {UiCard} from './types';
import {BADGE_COMPACT_TOP, Place, uiPlaces} from './layout';
import {C, EASE_EXPO, EASE_SOFT, F, FONT, glass, hit, popScale, prog, textW} from './theme';
import {TL} from './timeline';

const txt = (size: number, weight = 700, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: -0.3, lineHeight: 1.1, whiteSpace: 'nowrap'});
const Dot: React.FC<{g: number}> = ({g}) => (
  <span style={{width: 16, height: 16, borderRadius: 8, background: g > 0.3 ? '#fff' : C.soft, boxShadow: `0 0 ${12 + 20 * g}px rgba(111,168,255,0.95)`, display: 'inline-block', flex: 'none'}} />
);

/** snappy pop envelope: in = overshoot scale from the guide's landing point; out = 5-frame shrink + blur */
const pop = (t: number, a: number, b: number, from = 0.25) => {
  const o = prog(t, b - 5 * F, 5 * F, (x) => x);
  const sc = popScale(t, a, from, 0.12, 0.28) * (1 - 0.15 * o);
  const op = prog(t, a, 2 * F, (x) => x) * (1 - o);
  const bl = (1 - prog(t, a, 3 * F, (x) => x)) * 8 + o * 8;
  return {v: op, style: {opacity: op, scale: String(sc), filter: bl > 0.3 ? `blur(${bl}px)` : undefined} as React.CSSProperties};
};

const at = (p: Place, extra: React.CSSProperties = {}): React.CSSProperties => ({position: 'absolute', left: p.left, top: p.top, width: p.w, ...extra});

export const UiLayer: React.FC<{cards: UiCard[]; tl: TL}> = ({cards, tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const P = uiPlaces(cards);
  const T0 = tl.cardAt;
  const live = (i: number) => t >= T0[i] - 2 * F && t < cards[i].out_end + 0.01;
  const els: React.ReactNode[] = [];

  cards.forEach((c, i) => {
    if (!live(i)) return;
    const p = P[i], a = T0[i], b = c.out_end;
    const g = hit(t, a, 0.12);
    if (c.kind === 'glass_pill') {
      // pill unrolls from its bullet (where the guide lands) to the right
      const u = popScale(t, a, 0, 0.08, 0.3); const o = prog(t, b - 5 * F, 5 * F, (x) => x);
      const tx = prog(t, a + 2 * F, 0.22, EASE_EXPO);
      const cta = p.group === 'cta';
      els.push(
        <div key={'p' + i} style={at(p, {height: p.h, opacity: (1 - o) * prog(t, a, 2 * F, (x) => x), filter: o > 0.05 ? `blur(${o * 8}px)` : undefined})}>
          <div style={{...glass(p.h / 2, true), position: 'absolute', inset: 0, transformOrigin: `${p.ax - p.left}px 50%`, scale: `${Math.max(0.001, u)} ${0.7 + 0.3 * Math.min(1, u)}`,
            boxShadow: `0 0 ${30 + 40 * g}px rgba(80,145,255,${0.4 + 0.5 * g}), 0 18px 40px rgba(2,8,28,0.5)`}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: cta ? 34 : 34, ...txt(cta ? 60 : 44, 800)}}>
            {cta ? <span style={{width: 86, flex: 'none'}} /> : <Dot g={g} />}
            <span style={{opacity: tx, translate: `${(1 - tx) * -30}px 0px`, filter: tx < 0.9 ? `blur(${(1 - tx) * 6}px)` : undefined}}>{c.label}</span>
          </div>
        </div>);
    } else if (c.kind === 'section_badge') {
      els.push(<SectionHero key={'s' + i} c={c} a={a} t={t} tl={tl} next={cards.find((k, j) => j > i && T0[j] > a && T0[j] < b) ? T0[cards.findIndex((k, j) => j > i && T0[j] > a && T0[j] < b)] : b} />);
    } else if (c.kind === 'icon_chip') {
      const e = pop(t, a, b, 0.2);
      els.push(
        <div key={'c' + i} style={at(p, {height: p.h, ...e.style, transformOrigin: '30px 50%'})}>
          <div style={{...glass(35, true), height: p.h, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', ...txt(36, 700)}}><Dot g={g} />{c.label}</div>
        </div>);
    } else if (c.kind === 'analytics_card') {
      const an = cards.map((k, j) => [k, j] as const).filter(([k]) => k.kind === 'analytics_card');
      if (an[0][1] !== i) return;
      const handoffI = cards.findIndex((k, j) => k.kind === 'glass_card' && T0[j] > a && T0[j] < b);
      const end = handoffI >= 0 ? T0[handoffI] + 0.1 : b;
      if (t >= end) return;
      const e = pop(t, a, end, 0.2);
      const a2 = an[1] ? T0[an[1][1]] : 1e9;
      const r2 = popScale(t, a2, 0.3, 0.12, 0.28); const r2o = prog(t, a2, 2 * F, (x) => x);
      const line = prog(t, a2 + 0.1, 0.8, EASE_SOFT); const g2 = hit(t, a2, 0.12);
      const n3 = Math.min(3, Math.floor(prog(t, a, 0.36, (x) => x) * 3) + 1);
      els.push(
        <div key="an" style={at(p, {...e.style, transformOrigin: '92% 6%'})}>
          <div style={{...glass(44, true), padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 18}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}><span style={{...txt(92, 900), textShadow: `0 0 ${20 + 30 * g}px rgba(120,180,255,${0.4 + 0.5 * g})`}}>{n3}×</span><span style={txt(40, 600, C.icy)}>zal / hafta</span></div>
            <div style={{height: 2, background: 'rgba(175,210,255,0.3)', transformOrigin: '0 50%', scale: `${prog(t, a + 0.1, 0.3, EASE_EXPO)} 1`}} />
            <div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: r2o, scale: String(r2), transformOrigin: '10% 50%'}}>
              <span style={{...txt(84, 900), color: C.white, background: g2 > 0.5 ? '#fff' : 'linear-gradient(180deg,#4C8DFF,#2457D6)', ...(g2 > 0.5 ? {color: C.cobalt} : {}), borderRadius: 22, padding: '0 18px', boxShadow: '0 0 30px rgba(61,123,255,0.7)'}}>2 g</span>
              <span style={txt(40, 600, C.icy)}>oqsil × 1 kg vazn</span>
              <svg width={150} height={60} style={{marginLeft: 'auto'}}><path d="M5 52 L55 40 L95 24 L145 8" fill="none" stroke={C.soft} strokeWidth={6} strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - line)} /></svg>
            </div>
          </div>
        </div>);
    } else if (c.kind === 'glass_card') {
      const u = popScale(t, a, 0, 0.06, 0.3); const o = prog(t, b - 5 * F, 5 * F, (x) => x);
      const tx = prog(t, a + 2 * F, 0.2, EASE_EXPO);
      els.push(
        <div key={'g' + i} style={at(p, {height: p.h, opacity: (1 - o) * prog(t, a, 2 * F, (x) => x), filter: o > 0.05 ? `blur(${o * 8}px)` : undefined})}>
          <div style={{...glass(40, true), position: 'absolute', inset: 0, transformOrigin: '0% 50%', scale: `${Math.max(0.001, u)} 1`, boxShadow: `0 0 ${30 + 40 * g}px rgba(80,145,255,${0.4 + 0.5 * g})`}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(48, 700), opacity: tx, translate: `${(1 - tx) * -40}px 0px`}}>{c.label}</div>
        </div>);
    } else if (c.kind === 'donut_card') {
      const dn = cards.map((k, j) => [k, j] as const).filter(([k]) => k.kind === 'donut_card');
      if (dn[0][1] !== i) return;
      const e = pop(t, a, b, 0.2); const R = 62, L = 2 * Math.PI * R; const share = [0.4, 0.45, 0.15];
      const cols = ['#CFE3FF', '#6FA8FF', '#2457D6']; let acc = 0;
      els.push(
        <div key="dn" style={at(p, {...e.style, transformOrigin: '25% 50%', width: undefined})}>
          <div style={{...glass(40, true), padding: '22px 36px', display: 'flex', alignItems: 'center', gap: 30}}>
            <svg width={160} height={160} viewBox="0 0 160 160" style={{rotate: '-90deg', overflow: 'visible'}}>
              <circle cx={80} cy={80} r={R} fill="none" stroke="rgba(175,210,255,0.15)" strokeWidth={22} />
              {dn.map(([, j], k) => { const q = prog(t, T0[j], 0.28, EASE_EXPO); const len = L * share[k] * q; const off = acc; acc += L * share[k]; const gk = hit(t, T0[j], 0.1);
                return <circle key={k} cx={80} cy={80} r={R} fill="none" stroke={gk > 0.5 ? '#fff' : cols[k]} strokeWidth={22 + 8 * gk} strokeDasharray={`${Math.max(0, len - 4)} ${L}`} strokeDashoffset={-off} />; })}
            </svg>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {dn.map(([k2, j], k) => { const q = popScale(t, T0[j], 0.3, 0.12, 0.26); const qo = prog(t, T0[j], 2 * F, (x) => x); return (
                <div key={k} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: qo, scale: String(q), transformOrigin: '0 50%', ...txt(38, 700)}}>
                  <span style={{width: 18, height: 18, borderRadius: 9, background: cols[k]}} />{k2.label}</div>); })}
            </div>
          </div>
        </div>);
    } else if (c.kind === 'graph_card') {
      const e = pop(t, a, b, 0.2); const d = prog(t, a + 0.12, 0.9, EASE_SOFT);
      els.push(
        <div key={'gr' + i} style={at(p, {...e.style, transformOrigin: '10% 85%'})}>
          <div style={{...glass(40, true), padding: '24px 32px'}}>
            <div style={txt(44, 800)}>{c.label}</div>
            <svg width={376} height={120} style={{marginTop: 10, overflow: 'visible'}}>
              <line x1={0} y1={60} x2={376} y2={60} stroke="rgba(175,210,255,0.35)" strokeWidth={2} strokeDasharray="6 8" />
              <path d="M4 100 C 90 96, 150 80, 210 58 S 320 18, 372 10" fill="none" stroke={C.soft} strokeWidth={7} strokeLinecap="round" strokeDasharray={420} strokeDashoffset={420 * (1 - d)} style={{filter: 'drop-shadow(0 0 8px rgba(110,170,255,0.9))'}} />
            </svg>
          </div>
        </div>);
    } else if (c.kind === 'bar_card') {
      const bars = cards.map((k, j) => [k, j] as const).filter(([k]) => k.kind === 'bar_card');
      if (bars[0][1] !== i) return;
      const e = pop(t, a, b, 0.2);
      els.push(
        <div key="bars" style={at(p, {...e.style, transformOrigin: '50% 30%'})}>
          <div style={{...glass(40, true), padding: '24px 36px', display: 'flex', flexDirection: 'column', gap: 16}}>
            {bars.map(([k2, j], k) => { const q = popScale(t, T0[j], 0, 0.1, 0.4); const qo = prog(t, T0[j] - 2 * F, 2 * F, (x) => x); return (
              <div key={k} style={{opacity: qo}}>
                <div style={txt(38, 700)}>{k2.label}</div>
                <div style={{height: 18, borderRadius: 9, background: 'rgba(175,210,255,0.15)', marginTop: 8}}>
                  <div style={{height: 18, borderRadius: 9, width: `${Math.max(0, q) * (k ? 78 : 88)}%`, background: 'linear-gradient(90deg,#2457D6,#9CCBFF)', boxShadow: '0 0 16px rgba(110,170,255,0.8)'}} />
                </div>
              </div>); })}
          </div>
        </div>);
    } else if (c.kind === 'equation_card') {
      const eq = cards.map((k, j) => [k, j] as const).filter(([k]) => k.kind === 'equation_card');
      if (eq[0][1] !== i) return;
      const e = pop(t, a, b, 0.2); const a2 = eq[1] ? T0[eq[1][1]] : 1e9;
      const r = prog(t, a2 - 2 * F, 0.22, EASE_EXPO); const g2 = hit(t, a2, 0.12);
      els.push(
        <div key="eq" style={{position: 'absolute', left: 0, right: 0, top: p.top, display: 'flex', justifyContent: 'center', ...e.style, transformOrigin: `${p.left}px 50%`}}>
          <div style={{...glass(44, true), padding: '26px 40px', display: 'flex', alignItems: 'center', gap: 22, boxShadow: `0 0 ${30 + 40 * g2}px rgba(80,145,255,${0.4 + 0.5 * g2})`}}>
            <span style={txt(58, 800)}>{eq[0][0].label}</span>
            <span style={{...txt(58, 900), color: C.accent, opacity: r, translate: `${(1 - r) * 160}px 0px`, filter: r < 0.95 ? `blur(${(1 - r) * 10}px)` : undefined}}>{eq[1]?.[0].label}</span>
          </div>
        </div>);
    }
  });
  return <>{els}</>;
};

/** A-style hero: giant word assembling letter by letter behind the guide, outline copies above/below;
 *  morphs to a compact badge before the next card in the section arrives */
const SectionHero: React.FC<{c: UiCard; a: number; t: number; tl: TL; next: number}> = ({c, a, t, tl, next}) => {
  const [num, name] = c.label.split(' · ');
  const size = 150; const w = textW(name, size, 900) + name.length * 2; const left = 540 - w / 2 + 50;
  // reveal time per letter = first time the guide passes it
  const xs: number[] = []; let x = left; for (const ch of name) { xs.push(x + textW(ch, size, 900) / 2); x += textW(ch, size, 900) + 2; }
  const rev = xs.map((lx) => { for (let tt = a - 0.1; tt < a + 0.8; tt += 1 / 90) if (tl.guide(tt).x >= lx - 10) return tt; return a + 0.5; });
  const comp = prog(t, Math.min(a + 1.7, next - 0.35), 0.32, EASE_EXPO);
  const out = prog(t, c.out_end - 5 * F, 5 * F, (x) => x);
  const ghost = prog(t, a + 0.35, 0.4, EASE_EXPO) * (1 - comp);
  const numP = popScale(t, rev[0], 0.2, 0.12, 0.26);
  const y = 300 + (BADGE_COMPACT_TOP + 34 - 300) * comp;
  const sc = 1 - 0.58 * comp;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.6, height: size * 1.2, opacity: 1 - out, scale: String(sc), transformOrigin: '50% 50%', filter: out > 0.05 ? `blur(${out * 8}px)` : undefined}}>
      {[-1, 1].map((d) => (
        <div key={d} style={{position: 'absolute', left: left, top: 0, height: size * 1.2, display: 'flex', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 2,
          color: 'transparent', WebkitTextStroke: '2px rgba(156,203,255,0.4)', opacity: ghost, translate: `0px ${d * ghost * size * 0.8}px`}}>{name}</div>
      ))}
      <div style={{position: 'absolute', left: left - 120, top: size * 0.6 - 40, width: 84, height: 84, borderRadius: 42, background: 'linear-gradient(160deg,#5f9bff,#2457d6)', boxShadow: '0 0 30px rgba(90,150,255,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(38, 800), opacity: prog(t, rev[0], 2 * F, (q) => q), scale: String(numP)}}>{num}</div>
      <div style={{position: 'absolute', left, top: 0, height: size * 1.2, display: 'flex', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 2, color: C.white}}>
        {name.split('').map((ch, k) => {
          const p = popScale(t, rev[k], 0.2, 0.18, 0.26); const o = prog(t, rev[k], 2 * F, (q) => q); const gk = hit(t, rev[k] + 2 * F, 0.12);
          return <span key={k} style={{display: 'inline-block', opacity: o, scale: String(p), translate: `0px ${(1 - prog(t, rev[k], 0.16, EASE_EXPO)) * 40}px`,
            textShadow: `0 6px 24px rgba(0,8,32,0.6), 0 0 ${20 + 40 * gk}px rgba(110,170,255,${0.45 + 0.5 * gk})`, color: gk > 0.6 ? C.icy : C.white}}>{ch}</span>;
        })}
      </div>
    </div>
  );
};
