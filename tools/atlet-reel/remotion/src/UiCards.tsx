import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {UiCard} from './types';
import {C, EASE_IN, EASE_OUT, EASE_SOFT, FONT, glass, prog} from './theme';

/** glide-in (blur 10->0, +28px, 0.4 s) / glide-out (blur 0->8, fade, 0.25 s) envelope */
const env = (t: number, a: number, b: number) => {
  const i = prog(t, a, 0.4, EASE_IN), o = prog(t, b - 0.25, 0.25, EASE_OUT);
  return {v: i * (1 - o), style: {opacity: i * (1 - o), translate: `0px ${(1 - i) * 28}px`, filter: `blur(${(1 - i) * 10 + o * 8}px)`} as React.CSSProperties};
};
const txt = (size: number, weight = 600, color = C.white): React.CSSProperties => ({fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: -0.3, lineHeight: 1.1});
const Dot = () => <span style={{width: 14, height: 14, borderRadius: 7, background: C.soft, boxShadow: '0 0 14px rgba(111,168,255,0.95)', display: 'inline-block'}} />;

const Pill: React.FC<{c: UiCard; t: number; style: React.CSSProperties}> = ({c, t, style}) => {
  const e = env(t, c.t, c.out_end);
  if (e.v <= 0) return null;
  return (
    <div style={{position: 'absolute', ...style, ...e.style}}>
      <div style={{...glass(40), padding: '18px 34px', display: 'flex', alignItems: 'center', gap: 16, ...txt(40, 600)}}><Dot />{c.label}</div>
    </div>
  );
};

export const UiLayer: React.FC<{cards: UiCard[]}> = ({cards}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const live = (c: UiCard) => t >= c.t - 0.01 && t < c.out_end + 0.01;
  const els: React.ReactNode[] = [];
  const pills = cards.filter((c) => c.kind === 'glass_pill');
  // product / effect pills: right column; CTA pills: centred column
  const groupPills = (grp: UiCard[], cta: boolean) => grp.forEach((c, i) => {
    if (!live(c)) return;
    els.push(<Pill key={'p' + c.label} c={c} t={t} style={cta ? {left: 0, right: 0, top: 250 + i * 112, display: 'flex', justifyContent: 'center'} : {right: 56, top: 236 + i * 104}} />);
  });
  groupPills(pills.filter((c) => c.t < 10), false);
  groupPills(pills.filter((c) => c.t > 40 && c.t < 70), false);
  groupPills(pills.filter((c) => c.t >= 70), true);

  cards.filter((c) => c.kind === 'section_badge').forEach((c) => {
    if (!live(c)) return; const e = env(t, c.t, c.out_end); const [num, name] = c.label.split(' · ');
    els.push(
      <div key={c.label} style={{position: 'absolute', left: 0, right: 0, top: 196, display: 'flex', justifyContent: 'center', ...e.style}}>
        <div style={{...glass(44), padding: '14px 36px 14px 16px', display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(160deg,#5f9bff,#2457d6)', boxShadow: '0 0 24px rgba(90,150,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(30, 700)}}>{num}</div>
          <div style={{...txt(46, 600), letterSpacing: 4}}>{name}</div>
        </div>
      </div>);
  });
  const chips = cards.filter((c) => c.kind === 'icon_chip');
  if (chips.some(live)) {
    els.push(
      <div key="chips" style={{position: 'absolute', left: 0, right: 0, top: 322, display: 'flex', justifyContent: 'center', gap: 20}}>
        {chips.map((c) => { const e = env(t, c.t, c.out_end); return (
          <div key={c.label} style={{...glass(34), padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, ...txt(36, 500), ...e.style}}><Dot />{c.label}</div>); })}
      </div>);
  }
  // analytics card (3x / hafta, then 2 g / kg); hands over to the 'shart emas' card
  const an = cards.filter((c) => c.kind === 'analytics_card');
  const gcards = cards.filter((c) => c.kind === 'glass_card');
  if (an.length && t >= an[0].t && t < an[0].out_end) {
    const handoff = gcards.find((g) => g.t > an[0].t && g.t < an[0].out_end);
    const end = handoff ? handoff.t + 0.15 : an[0].out_end; const e = env(t, an[0].t, end);
    if (e.v > 0) {
      const r2 = prog(t, an[1]?.t ?? 1e9, 0.45);
      const line = prog(t, (an[1]?.t ?? 1e9) + 0.1, 0.9, EASE_SOFT);
      els.push(
        <div key="an" style={{position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center', ...e.style}}>
          <div style={{...glass(44), width: 700, padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 18}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}><span style={txt(84, 700)}>3×</span><span style={txt(40, 500, C.icy)}>zal / hafta</span></div>
            <div style={{height: 2, background: 'rgba(175,210,255,0.25)'}} />
            <div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: r2, filter: `blur(${(1 - r2) * 8}px)`}}>
              <span style={{...txt(84, 700), color: C.accent}}>2 g</span><span style={txt(40, 500, C.icy)}>oqsil × 1 kg vazn</span>
              <svg width={150} height={60} style={{marginLeft: 'auto'}}><path d="M5 52 L55 40 L95 24 L145 8" fill="none" stroke={C.soft} strokeWidth={5} strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - line)} /></svg>
            </div>
          </div>
        </div>);
    }
  }
  gcards.forEach((c) => {
    if (!live(c)) return; const e = env(t, c.t, c.out_end);
    els.push(
      <div key={c.label} style={{position: 'absolute', left: 0, right: 0, top: 220, display: 'flex', justifyContent: 'center', ...e.style}}>
        <div style={{...glass(40), padding: '24px 42px', ...txt(48, 600)}}>{c.label}</div>
      </div>);
  });
  // donut: composition ring, segments land on each word
  const dn = cards.filter((c) => c.kind === 'donut_card');
  if (dn.some(live)) {
    const e = env(t, dn[0].t, dn[0].out_end); const R = 62, L = 2 * Math.PI * R; const share = [0.4, 0.45, 0.15];
    const cols = ['#CFE3FF', '#6FA8FF', '#2457D6']; let acc = 0;
    els.push(
      <div key="dn" style={{position: 'absolute', left: 0, right: 0, top: 316, display: 'flex', justifyContent: 'center', ...e.style}}>
        <div style={{...glass(40), padding: '22px 36px', display: 'flex', alignItems: 'center', gap: 30}}>
          <svg width={160} height={160} viewBox="0 0 160 160" style={{rotate: '-90deg'}}>
            <circle cx={80} cy={80} r={R} fill="none" stroke="rgba(175,210,255,0.15)" strokeWidth={20} />
            {dn.map((c, i) => { const p = prog(t, c.t, 0.5); const len = L * share[i] * p; const off = acc; acc += L * share[i];
              return <circle key={i} cx={80} cy={80} r={R} fill="none" stroke={cols[i]} strokeWidth={20} strokeDasharray={`${Math.max(0, len - 4)} ${L}`} strokeDashoffset={-off} />; })}
          </svg>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {dn.map((c, i) => { const p = prog(t, c.t, 0.35); return (
              <div key={c.label} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: p, filter: `blur(${(1 - p) * 6}px)`, ...txt(38, 500)}}>
                <span style={{width: 18, height: 18, borderRadius: 9, background: cols[i]}} />{c.label}</div>); })}
          </div>
        </div>
      </div>);
  }
  cards.filter((c) => c.kind === 'graph_card').forEach((c) => {
    if (!live(c)) return; const e = env(t, c.t, c.out_end); const d = prog(t, c.t + 0.15, 1.1, EASE_SOFT);
    els.push(
      <div key={c.label} style={{position: 'absolute', left: 56, top: 236, ...e.style}}>
        <div style={{...glass(40), padding: '24px 32px', width: 440}}>
          <div style={txt(44, 600)}>{c.label}</div>
          <svg width={376} height={120} style={{marginTop: 10}}>
            <line x1={0} y1={60} x2={376} y2={60} stroke="rgba(175,210,255,0.3)" strokeWidth={2} strokeDasharray="6 8" />
            <path d="M4 100 C 90 96, 150 80, 210 58 S 320 18, 372 10" fill="none" stroke={C.soft} strokeWidth={6} strokeLinecap="round" strokeDasharray={420} strokeDashoffset={420 * (1 - d)} />
          </svg>
        </div>
      </div>);
  });
  const bars = cards.filter((c) => c.kind === 'bar_card');
  if (bars.some(live)) {
    const e = env(t, bars[0].t, bars[0].out_end);
    els.push(
      <div key="bars" style={{position: 'absolute', left: 0, right: 0, top: 316, display: 'flex', justifyContent: 'center', ...e.style}}>
        <div style={{...glass(40), padding: '24px 36px', width: 600, display: 'flex', flexDirection: 'column', gap: 16}}>
          {bars.map((c, i) => { const p = prog(t, c.t, 0.9, EASE_SOFT); const a = prog(t, c.t, 0.3); return (
            <div key={c.label} style={{opacity: a}}>
              <div style={txt(36, 500)}>{c.label}</div>
              <div style={{height: 16, borderRadius: 8, background: 'rgba(175,210,255,0.15)', marginTop: 8}}>
                <div style={{height: 16, borderRadius: 8, width: `${p * (i ? 78 : 88)}%`, background: 'linear-gradient(90deg,#2457D6,#9CCBFF)', boxShadow: '0 0 16px rgba(110,170,255,0.7)'}} />
              </div>
            </div>); })}
        </div>
      </div>);
  }
  const eq = cards.filter((c) => c.kind === 'equation_card');
  if (eq.some(live)) {
    const e = env(t, eq[0].t, eq[0].out_end); const r = prog(t, eq[1]?.t ?? 1e9, 0.45);
    els.push(
      <div key="eq" style={{position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', justifyContent: 'center', ...e.style}}>
        <div style={{...glass(44), padding: '26px 40px', display: 'flex', alignItems: 'center', gap: 22}}>
          <span style={txt(58, 700)}>{eq[0].label}</span>
          <span style={{...txt(58, 700), color: C.accent, opacity: r, filter: `blur(${(1 - r) * 8}px)`, translate: `${(1 - r) * 20}px 0px`}}>{eq[1]?.label}</span>
        </div>
      </div>);
  }
  return <>{els}</>;
};
