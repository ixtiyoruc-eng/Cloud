// Full-screen MG slots as reference-A scenes in the blue palette: tilted 3D panel clusters that assemble piece by
// piece, dark <-> light flips, giant words with outline copies, a big ring sweeping round a framed card.
// The guide drives every reveal: titles assemble behind it, panels pop where it lands, blobs grow from it.
// Entry/exit: MG1 = zoom-through the guide's plate hole (in and out); MG2 = whip led by the guide, wipe up out.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from './types';
import {MgInfo, Panel, RING, SUB, SUB0_Y, SUB1_Y, SUB2_Y, Scene, TITLE_Y, subLeft} from './mgPlan';
import {C, EASE_ACC, EASE_EXPO, EASE_SOFT, F, FONT, clamp01, hit, popScale, prog, textW} from './theme';
import {TL} from './timeline';
import {GSCALE, HOLE} from './Guide';

// ---------- helpers ----------
export const MBlur: React.FC<{id: string; sx: number; sy: number}> = ({id, sx, sy}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}><defs><filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${sx} ${sy}`} /></filter></defs></svg>
);
const blobPath = (cx: number, cy: number, r: number, t: number, inner = 0) => {
  const pts = 28; let d = '';
  const ring = (rr: number, rev: boolean) => {
    let s = '';
    for (let k = 0; k <= pts; k++) {
      const a = ((rev ? pts - k : k) / pts) * Math.PI * 2;
      const w = 1 + 0.09 * Math.sin(a * 3 + t * 5) + 0.05 * Math.sin(a * 5 - t * 7);
      s += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr * w).toFixed(1)} ${(cy + Math.sin(a) * rr * w).toFixed(1)} `;
    }
    return s + 'Z ';
  };
  d += ring(r, false); if (inner > 0) d += ring(inner, true);
  return d;
};

const Backdrop: React.FC<{t: number; light: boolean}> = ({t, light}) => {
  const a = Math.sin(t * 0.5) * 70, b = Math.cos(t * 0.4) * 60;
  if (light) return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 40%, #FFFFFF 0%, ${C.paper} 45%, ${C.paper2} 100%)`}}>
      <div style={{position: 'absolute', width: 900, height: 900, left: -300 + a, top: -200 + b, borderRadius: '50%', background: 'radial-gradient(circle, rgba(111,168,255,0.45) 0%, rgba(111,168,255,0) 65%)'}} />
      <div style={{position: 'absolute', width: 800, height: 800, right: -280 - a, top: 1100 - b, borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,123,255,0.30) 0%, rgba(61,123,255,0) 65%)'}} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 38%, #10295f 0%, ${C.midnight} 42%, ${C.deep} 100%)`}}>
      {/* big soft glowing rings (A) */}
      <div style={{position: 'absolute', width: 1300, height: 1300, left: -560 + a, top: -260 + b, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 46%, rgba(61,123,255,0.42) 56%, rgba(61,123,255,0) 68%)'}} />
      <div style={{position: 'absolute', width: 1100, height: 1100, right: -520 - a, top: 1000 - b, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 44%, rgba(140,190,255,0.28) 55%, rgba(140,190,255,0) 66%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {[0, 1].map((k) => <circle key={k} cx={540 + (k ? 380 : -380)} cy={800} r={620} fill="none" stroke="rgba(160,200,255,0.16)" strokeWidth={2} transform={`rotate(${t * 6 * (k ? -1 : 1)} 540 800)`} />)}
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(100% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,6,18,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** line of text whose letters pop as the guide passes them (window w0..w1) */
const Assemble: React.FC<{text: string; t: number; tl: TL; w0: number; w1: number; y: number; size: number; weight?: number; color?: string; ghost?: number; ghostCol?: string; glow?: string}> =
  ({text, t, tl, w0, w1, y, size, weight = 800, color = C.white, ghost = 0, ghostCol = 'rgba(156,203,255,0.4)', glow = 'rgba(110,170,255,'}) => {
  const W = textW(text, size, weight); const left = 540 - W / 2;
  const xs: number[] = []; let x = left; for (const ch of text) { const cw = textW(ch, size, weight); xs.push(x + cw / 2); x += cw; }
  const rev = xs.map((lx, k) => { for (let tt = w0; tt < w1; tt += 1 / 90) if (tl.guide(tt).x >= lx - 8) return tt; return w0 + (k / xs.length) * (w1 - w0); });
  const gp = prog(t, rev[rev.length - 1] + 0.05, 0.4, EASE_EXPO) * ghost;
  const row = (st: React.CSSProperties, k: string, kids: React.ReactNode) => (
    <div key={k} style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.62, height: size * 1.24, display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: FONT, fontWeight: weight, fontSize: size, letterSpacing: -0.01 * size, whiteSpace: 'pre', ...st}}>{kids}</div>
  );
  return (
    <>
      {gp > 0 ? [-1, 1].map((d) => row({color: 'transparent', WebkitTextStroke: `2px ${ghostCol}`, opacity: gp, translate: `0px ${d * gp * size * 1.02}px`}, 'g' + d, text)) : null}
      {row({}, 'm', text.split('').map((ch, k) => {
        const p = popScale(t, rev[k], 0.2, 0.18, 0.26); const o = prog(t, rev[k], 2 * F, (q) => q); const g = hit(t, rev[k] + 2 * F, 0.12);
        return <span key={k} style={{display: 'inline-block', opacity: o, scale: String(p), translate: `0px ${(1 - prog(t, rev[k], 0.16, EASE_EXPO)) * 36}px`, color,
          textShadow: `0 0 ${18 + 36 * g}px ${glow}${0.35 + 0.55 * g})`}}>{ch}</span>;
      }))}
    </>
  );
};

/** cobalt pill that wipes in from its left end (where the guide lands) */
const SubPill: React.FC<{text: string; t: number; at: number; y: number}> = ({text, t, at, y}) => {
  if (t < at - F) return null;
  const w = textW(text, SUB.size, 800) + 2 * SUB.pad; const left = subLeft(text);
  const u = popScale(t, at, 0, 0.06, 0.3); const tx = prog(t, at + 2 * F, 0.22, EASE_EXPO); const g = hit(t, at, 0.12);
  return (
    <div style={{position: 'absolute', left, top: y - 40, width: w, height: 80}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 40, transformOrigin: '0% 50%', scale: `${Math.max(0.001, u)} 1`,
        background: g > 0.5 ? '#FFFFFF' : 'linear-gradient(180deg,#4C8DFF,#2457D6)', boxShadow: `0 0 ${30 + 40 * g}px rgba(61,123,255,${0.6 + 0.4 * g}), inset 0 2px 0 rgba(255,255,255,0.45)`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: SUB.size, color: C.white,
        opacity: tx, translate: `${(1 - tx) * -30}px 0px`}}>{text}</div>
    </div>
  );
};

const stroke = {fill: 'none', stroke: C.icy, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
const pcard = (light = false): React.CSSProperties => ({
  position: 'absolute', borderRadius: 30, overflow: 'hidden',
  background: light ? 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(214,230,255,0.9))' : 'linear-gradient(160deg, rgba(70,130,255,0.75) 0%, rgba(30,70,180,0.8) 55%, rgba(12,32,92,0.9) 100%)',
  border: '3px solid rgba(200,225,255,0.75)', boxShadow: '0 30px 60px rgba(0,4,20,0.55), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 40px rgba(61,123,255,0.35)',
});
const lbl = (size = 36, col = 'rgba(225,238,255,0.9)'): React.CSSProperties => ({fontFamily: FONT, fontWeight: 600, fontSize: size, color: col, letterSpacing: 1});

// ---------- panel contents ----------
const PanelBody: React.FC<{p: Panel; t: number; tl: TL; info: MgInfo}> = ({p, t, tl, info}) => {
  const lt = t - p.at; const bts = tl.beatsAfter(p.at + 0.2, 8);
  switch (p.id) {
    case 'main': {
      const d = prog(lt, 0.1, 1.2, EASE_SOFT);
      return (<div style={{padding: '26px 30px'}}><div style={lbl()}>vazn</div>
        <svg width={460} height={220}><line x1={10} y1={180} x2={450} y2={180} stroke="rgba(207,227,255,0.25)" strokeWidth={3} />
          <line x1={10} y1={70} x2={450} y2={70} stroke="rgba(207,227,255,0.35)" strokeWidth={3} strokeDasharray="10 12" />
          <path d="M10 150 C 110 146, 190 154, 260 149 S 400 146, 450 148" {...stroke} stroke={C.soft} strokeWidth={8} strokeDasharray={460} strokeDashoffset={460 * (1 - d)} style={{filter: 'drop-shadow(0 0 8px rgba(110,170,255,0.9))'}} />
          <circle cx={10 + 440 * d} cy={149} r={10} fill="#fff" opacity={d > 0.02 ? 1 : 0} /></svg></div>);
    }
    case 'dots': return (<div style={{display: 'flex', gap: 18, padding: '34px 28px'}}>{[0, 1, 2, 3, 4].map((k) => { const on = t >= (bts[k] ?? 1e9); const g = hit(t, bts[k] ?? 1e9, 0.1);
      return <div key={k} style={{width: 30, height: 30, borderRadius: 15, background: on ? '#fff' : 'rgba(175,210,255,0.25)', boxShadow: on ? `0 0 ${14 + 20 * g}px rgba(120,180,255,0.95)` : undefined, scale: String(1 + 0.4 * g)}} />; })}</div>);
    case 'bars': return (<div style={{display: 'flex', alignItems: 'flex-end', gap: 26, padding: '30px 40px', height: 240, boxSizing: 'border-box'}}>{[0.55, 0.8, 0.4, 0.95].map((h, k) => { const q = popScale(t, bts[k] ?? 1e9, 0, 0.1, 0.36);
      return <div key={k} style={{width: 44, height: `${Math.max(0, q) * h * 100}%`, borderRadius: 12, background: 'linear-gradient(0deg,#2457D6,#9CCBFF)', boxShadow: '0 0 16px rgba(110,170,255,0.7)'}} />; })}</div>);
    case 'plate': {
      const at = info.times.sub0 ?? p.at + 2; const tilt = prog(t, at, 0.35, EASE_EXPO); const g = hit(t, at, 0.12);
      return (<div style={{padding: '20px 24px'}}><svg width={270} height={250} viewBox="0 0 560 300" style={{overflow: 'visible'}}>
        {[0, 1, 2].map((k) => (<g key={k} transform={k === 2 ? `translate(${280 + tilt * 40} ${210 - k * 60 - tilt * 30}) rotate(${-tilt * 16})` : `translate(280 ${210 - k * 60})`}>
          <ellipse rx={190} ry={48} fill={k === 2 && g > 0.4 ? 'rgba(255,255,255,0.6)' : 'rgba(150,195,255,0.18)'} stroke={C.icy} strokeWidth={6} />
          <ellipse rx={120} ry={26} fill="none" stroke="rgba(207,227,255,0.5)" strokeWidth={4} /></g>))}</svg></div>);
    }
    case 'pie': {
      const R = 70, L = 2 * Math.PI * R; const sh = [0.5, 0.3, 0.2]; const cols = ['#CFE3FF', '#6FA8FF', '#2457D6']; let acc = 0;
      return (<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><svg width={190} height={190} viewBox="0 0 190 190" style={{rotate: '-90deg'}}>
        {sh.map((s, k) => { const q = prog(t, bts[k] ?? 1e9, 0.3, EASE_EXPO); const off = acc; acc += L * s;
          return <circle key={k} cx={95} cy={95} r={R} fill="none" stroke={cols[k]} strokeWidth={34} strokeDasharray={`${Math.max(0, L * s * q - 3)} ${L}`} strokeDashoffset={-off} />; })}</svg></div>);
    }
    case 'spark': { const d = prog(lt, 0.05, 0.6, EASE_SOFT); return (<svg width={260} height={110}><path d="M20 80 L70 64 L110 72 L160 40 L200 50 L240 22" {...stroke} stroke={C.soft} strokeWidth={6} strokeDasharray={260} strokeDashoffset={260 * (1 - d)} /></svg>); }
    case 'battery': return (<div style={{display: 'flex', justifyContent: 'center', paddingTop: 30}}><svg width={260} height={360} viewBox="0 0 260 360">
      <rect x={40} y={40} width={180} height={300} rx={30} fill="rgba(150,195,255,0.10)" stroke={C.icy} strokeWidth={6} /><rect x={95} y={14} width={70} height={30} rx={8} fill={C.icy} opacity={0.85} />
      {[0, 1, 2, 3, 4].map((k) => { const q = popScale(t, bts[k] ?? 1e9, 0, 0.12, 0.26); const g = hit(t, bts[k] ?? 1e9, 0.1);
        return <rect key={k} x={62} y={290 - k * 54} width={136} height={40} rx={10} fill={g > 0.5 ? '#fff' : C.soft} opacity={Math.max(0.12, Math.min(1, q))} style={{filter: q > 0.5 ? 'drop-shadow(0 0 10px rgba(120,180,255,0.9))' : undefined}} transform={`translate(${130 * (1 - Math.min(1, Math.max(0, q)))} 0) scale(${Math.min(1.1, Math.max(0, q))} 1)`} />; })}
    </svg></div>);
    case 'atf': {
      const at = info.times.sub0 ?? p.at + 1; const g = hit(t, at, 0.14); const up = prog(t, at, 0.4, EASE_EXPO);
      return (<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, height: '100%'}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 120, color: g > 0.5 ? C.icy : C.white, textShadow: `0 0 ${20 + 40 * g}px rgba(110,170,255,${0.4 + 0.5 * g})`}}>ATF</span>
        <svg width={80} height={120} style={{translate: `0px ${(1 - up) * 40}px`, opacity: up}}><path d="M40 110 L40 20 M12 48 L40 18 L68 48" {...stroke} strokeWidth={12} stroke={C.soft} /></svg></div>);
    }
    case 'line': { const d = prog(lt, 0.05, 0.9, EASE_SOFT); return (<div style={{padding: '22px 26px'}}><div style={lbl(26)}>energiya</div><svg width={400} height={120}>
      <path d="M10 110 C 90 106, 150 90, 210 70 S 330 20, 390 12" {...stroke} stroke={C.soft} strokeWidth={7} strokeDasharray={430} strokeDashoffset={430 * (1 - d)} style={{filter: 'drop-shadow(0 0 8px rgba(110,170,255,0.9))'}} /></svg></div>); }
    default: return null;
  }
};

const Cluster: React.FC<{info: MgInfo; sc: Scene; t: number; tl: TL}> = ({info, sc, t, tl}) => {
  const T = info.tilt; const push = 1 + 0.04 * prog(t, sc.a, sc.b - sc.a, EASE_SOFT);
  return (
    <div style={{position: 'absolute', left: T.cx, top: T.cy, width: 0, height: 0, perspective: T.persp, scale: String(push)}}>
      <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateX(${T.rx}deg) rotateY(${T.ry}deg) scale(${T.scale})`}}>
        {info.panels[0].map((p) => {
          const q = popScale(t, p.at, 0.3, 0.12, 0.3); const o = prog(t, p.at, 2 * F, (x) => x); const g = hit(t, p.at, 0.14);
          const z = (1 - prog(t, p.at, 0.3, EASE_EXPO)) * -260;
          return (
            <div key={p.id} style={{...pcard(), left: p.x, top: p.y, width: p.w, height: p.h, opacity: o, transform: `translateZ(${z}px) scale(${q})`, transformOrigin: '90% 10%',
              boxShadow: `0 30px 60px rgba(0,4,20,0.55), 0 0 ${30 + 50 * g}px rgba(80,150,255,${0.35 + 0.55 * g}), inset 0 1px 0 rgba(255,255,255,0.35)`}}>
              <PanelBody p={p} t={t} tl={tl} info={info} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** big ring arc sweeping round a framed card (A: ring framing the image) */
const RingFrame: React.FC<{info: MgInfo; t: number; children: React.ReactNode}> = ({info, t, children}) => {
  const a = info.times.ringA, b = info.times.ringB; const u = prog(t, a, b - a, EASE_SOFT);
  const L = 2 * Math.PI * RING.r; const rot = -200 + (t - a) * 8;
  const card = popScale(t, a + 0.12, 0.2, 0.1, 0.32); const co = prog(t, a + 0.12, 2 * F, (x) => x);
  return (
    <>
      <div style={{...pcard(), left: RING.cx - 200, top: RING.cy - 200, width: 400, height: 400, opacity: co, scale: String(card), display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{children}</div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs><linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2457D6" /><stop offset="0.6" stopColor="#6FA8FF" /><stop offset="1" stopColor="#E6F1FF" /></linearGradient></defs>
        <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="url(#ringG)" strokeWidth={46} strokeLinecap="round"
          strokeDasharray={`${L * (300 / 360) * u} ${L}`} transform={`rotate(${rot} ${RING.cx} ${RING.cy})`} style={{filter: 'drop-shadow(0 0 22px rgba(61,123,255,0.7))'}} />
        <circle cx={RING.cx} cy={RING.cy} r={RING.r + 60} fill="none" stroke="rgba(160,200,255,0.25)" strokeWidth={2} strokeDasharray={`${L * 1.2 * u} ${L * 2}`} transform={`rotate(${rot * -0.6} ${RING.cx} ${RING.cy})`} />
      </svg>
    </>
  );
};

const Shaker: React.FC<{lt: number; chipAt: number}> = ({lt, chipAt}) => {
  const rot = interpolate(lt, [0, 5], [-28, 18], {extrapolateRight: 'clamp', easing: EASE_SOFT});
  const fill = prog(lt, 0.2, 1.6, EASE_SOFT); const sw = Math.sin(lt * 2.2) * 6; const g = hit(lt, chipAt, 0.12);
  return (
    <div style={{transform: `perspective(900px) rotateY(${rot}deg)`, width: 170, height: 300, scale: String(1 + 0.12 * g)}}>
      <svg width={170} height={300} viewBox="0 0 170 300">
        <defs><linearGradient id="liq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fb2ff" /><stop offset="1" stopColor="#1f4fc9" /></linearGradient>
          <clipPath id="body"><path d="M28 70 L142 70 L132 285 Q85 296 38 285 Z" /></clipPath></defs>
        <rect x={44} y={18} width={82} height={46} rx={12} fill="rgba(180,210,255,0.25)" stroke={C.icy} strokeWidth={4} />
        <g clipPath="url(#body)"><path d={`M0 ${290 - 190 * fill + sw} Q 45 ${280 - 190 * fill - sw} 85 ${290 - 190 * fill + sw} T 170 ${290 - 190 * fill} L170 300 L0 300 Z`} fill="url(#liq)" opacity={0.95} /></g>
        <path d="M28 70 L142 70 L132 285 Q85 296 38 285 Z" fill="rgba(160,200,255,0.10)" stroke={C.icy} strokeWidth={4} />
        <line x1={52} y1={95} x2={46} y2={250} stroke="rgba(255,255,255,0.35)" strokeWidth={6} strokeLinecap="round" />
      </svg>
    </div>
  );
};
const Steak: React.FC<{lt: number}> = ({lt}) => {
  const p = popScale(lt, 0.2, 0.3, 0.12, 0.3);
  return (
    <svg width={340} height={240} viewBox="-170 -120 340 240">
      <g transform={`scale(${p})`}>
        <path d="M-150 -20 C -150 -95, -40 -110, 40 -90 C 130 -70, 165 -10, 140 50 C 115 105, 10 110, -60 90 C -125 72, -150 30, -150 -20 Z" fill="rgba(150,195,255,0.18)" stroke={C.icy} strokeWidth={6} />
        <path d="M-95 -15 C -80 -55, -10 -60, 30 -45" fill="none" stroke="rgba(207,227,255,0.55)" strokeWidth={5} strokeLinecap="round" />
        <circle cx={70} cy={10} r={22} fill="none" stroke={C.icy} strokeWidth={6} />
      </g>
    </svg>
  );
};
const Ribbons: React.FC<{t: number; a: number}> = ({t, a}) => {
  const paths = ['M-100 700 C 200 520, 420 820, 640 640 S 980 520, 1200 600', 'M-100 820 C 240 980, 480 640, 720 800 S 1000 900, 1200 760', 'M-100 600 C 300 640, 520 480, 760 560 S 1040 700, 1200 520'];
  const u = (lt: number) => (lt * 0.55) % 1;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs><linearGradient id="rib" x1="0" x2="1"><stop offset="0" stopColor="#0A1B3D" /><stop offset="0.5" stopColor="#2457D6" /><stop offset="1" stopColor="#9CCBFF" /></linearGradient>
        <linearGradient id="pulse"><stop offset={Math.max(0, u(t - a) - 0.1)} stopColor="#6FA8FF" stopOpacity={0} /><stop offset={u(t - a)} stopColor="#ffffff" stopOpacity={1} /><stop offset={Math.min(1, u(t - a) + 0.1)} stopColor="#6FA8FF" stopOpacity={0} /></linearGradient></defs>
      {paths.map((d, k) => { const q = prog(t, a + 0.08 + k * 0.12, 0.6, EASE_EXPO);
        return <path key={k} d={d} fill="none" stroke="url(#rib)" strokeWidth={[64, 40, 26][k]} strokeLinecap="round" strokeDasharray={1500} strokeDashoffset={1500 * (1 - q)} opacity={[1, 0.8, 0.55][k]} />; })}
      <path d={paths[0]} fill="none" stroke="url(#pulse)" strokeWidth={18} strokeLinecap="round" opacity={prog(t, a + 0.6, 0.2)} />
    </svg>
  );
};

// ---------- scenes ----------
const SceneView: React.FC<{info: MgInfo; sc: Scene; t: number; tl: TL; caps: Caption[]}> = ({info, sc, t, tl}) => {
  const card = info.slot.cards[sc.i]; const isMg1 = info.slot.id === 'MG1';
  const ti = info.times;
  if (sc.i === 0) return (
    <AbsoluteFill>
      <Backdrop t={t} light={false} />
      <Cluster info={info} sc={sc} t={t} tl={tl} />
      <Assemble text={card.title} t={t} tl={tl} w0={ti.titleA - 0.1} w1={ti.titleB + 0.3} y={TITLE_Y} size={112} weight={900} ghost={1} />
      {card.subtitle && ti.sub0 ? <SubPill text={card.subtitle} t={t} at={ti.sub0} y={SUB0_Y} /> : null}
    </AbsoluteFill>
  );
  if (sc.i === 1) {
    const pIn = popScale(t, sc.a + sc.inDur, 1.25, -0.06, 0.3);
    if (isMg1) {
      const [l1, l2] = card.title.split(' — ');
      return (
        <AbsoluteFill>
          <Backdrop t={t} light />
          <div style={{position: 'absolute', inset: 0, scale: String(pIn)}}>
            <Assemble text={l1 + ' —'} t={t} tl={tl} w0={sc.a} w1={sc.a + 0.12} y={660} size={88} weight={800} color={C.ink} glow="rgba(61,123,255," />
            <Assemble text={l2} t={t} tl={tl} w0={sc.a + 0.06} w1={sc.a + 0.2} y={850} size={230} weight={900} color={C.cobalt} ghost={1} ghostCol="rgba(36,87,214,0.28)" glow="rgba(61,123,255," />
          </div>
        </AbsoluteFill>
      );
    }
    const words = card.title.split(' ');
    return (
      <AbsoluteFill>
        <Backdrop t={t} light />
        <Ribbons t={t} a={sc.a + sc.inDur * 0.5} />
        <Assemble text={words[0]} t={t} tl={tl} w0={sc.a + 0.2} w1={sc.a + 0.45} y={300} size={110} weight={800} color={C.ink} glow="rgba(61,123,255," />
        <Assemble text={words.slice(1).join(' ')} t={t} tl={tl} w0={sc.a + 0.35} w1={sc.a + 0.9} y={450} size={140} weight={900} color={C.cobalt} ghost={1} ghostCol="rgba(36,87,214,0.26)" glow="rgba(61,123,255," />
        {card.subtitle && ti.sub1 ? <SubPill text={card.subtitle} t={t} at={ti.sub1} y={SUB1_Y} /> : null}
      </AbsoluteFill>
    );
  }
  // scene 2
  if (isMg1) {
    const [pre, hero] = card.title.split(': ');
    const ha = ti.hero2 ?? sc.a + 1;
    return (
      <AbsoluteFill>
        <Backdrop t={t} light={false} />
        <RingFrame info={info} t={t}><Shaker lt={t - sc.a} chipAt={ha - sc.a} /></RingFrame>
        <Assemble text={pre + ':'} t={t} tl={tl} w0={sc.a + 0.05} w1={sc.a + 0.25} y={190} size={72} weight={700} color={C.icy} />
        <Assemble text={hero} t={t} tl={tl} w0={ha - 0.05} w1={ha + 0.55} y={335} size={170} weight={900} ghost={1} />
        {card.subtitle && ti.sub2 ? <SubPill text={card.subtitle} t={t} at={ti.sub2} y={SUB2_Y} /> : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Backdrop t={t} light={false} />
      <RingFrame info={info} t={t}><Steak lt={t - sc.a} /></RingFrame>
      <Assemble text={card.title} t={t} tl={tl} w0={sc.a + 0.1} w1={sc.a + 0.45} y={300} size={112} weight={900} ghost={1} />
    </AbsoluteFill>
  );
};

export const MotionGraphic: React.FC<{info: MgInfo; captions: Caption[]; tl: TL}> = ({info, captions, tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {slot, scenes, entry, exit} = info;
  if (t < slot.out_start || t >= slot.out_end) return null;
  const g = tl.guide(t);
  // ---- outer entry / exit
  const outer: React.CSSProperties = {};
  let blurId: string | null = null, bx = 0, by = 0;
  if (t < entry.b) {
    const u = (t - entry.a) / (entry.b - entry.a);
    if (entry.kind === 'portalIn') {
      const r = HOLE * g.s * GSCALE * 0.98;
      outer.WebkitMaskImage = outer.maskImage = `radial-gradient(circle at ${g.x}px ${g.y}px, #000 ${r}px, transparent ${r + 1.5}px)`;
      outer.scale = String(1.5 - 0.5 * EASE_EXPO(clamp01(u))); outer.transformOrigin = `${g.x}px ${g.y}px`;
    } else {
      const e = EASE_EXPO(clamp01(u)); outer.translate = `${(1 - e) * 1080}px 0px`; blurId = 'mg-in'; bx = (1 - e) * 70;
    }
  }
  if (t >= exit.a) {
    const u = clamp01((t - exit.a) / (exit.b - exit.a));
    if (exit.kind === 'portalOut') {
      const r = HOLE * g.s * GSCALE * 0.98;
      outer.WebkitMaskImage = outer.maskImage = `radial-gradient(circle at ${g.x}px ${g.y}px, transparent ${r}px, #000 ${r + 1.5}px)`;
      outer.scale = String(1 + 0.6 * EASE_ACC(u)); outer.transformOrigin = `${g.x}px ${g.y}px`;
    } else { const e = EASE_ACC(u); outer.translate = `0px ${-e * 1920}px`; blurId = 'mg-out'; by = e * 80; }
  }
  if (blurId && (bx > 0.5 || by > 0.5)) outer.filter = `url(#${blurId})`;
  // ---- scenes with their transitions
  const layers: React.ReactNode[] = [];
  scenes.forEach((sc, i) => {
    const nx = scenes[i + 1];
    const visEnd = nx ? nx.a + nx.inDur + F : slot.out_end;
    if (t < sc.a - 0.001 || t >= visEnd) return;
    const st: React.CSSProperties = {};
    let sid: string | null = null, sx = 0;
    // incoming transition
    if (i > 0 && t < sc.a + sc.inDur) {
      const u = clamp01((t - sc.a) / sc.inDur);
      if (sc.inT === 'blob') {
        const c0 = tl.guide(sc.a);
        const r = 1500 * EASE_ACC(u) + 10;
        st.clipPath = `path('${blobPath(c0.x, c0.y, r, t)}')`;
      } else { const e = EASE_EXPO(u); st.translate = `${(1 - e) * 1080}px 0px`; sid = `sc-in-${i}`; sx = (1 - e) * 60; }
    }
    // outgoing whip (when the next scene whips in, this one whips out to the left)
    if (nx && nx.inT.startsWith('whip') && t >= nx.a) {
      const u = clamp01((t - nx.a) / nx.inDur); const e = EASE_EXPO(u); st.translate = `${-e * 1080}px 0px`; sid = `sc-out-${i}`; sx = e * 60;
    }
    if (sid && sx > 0.5) st.filter = `url(#${sid})`;
    layers.push(
      <React.Fragment key={i}>{sid ? <MBlur id={sid} sx={sx} sy={0} /> : null}<AbsoluteFill style={st}>
        <SceneView info={info} sc={sc} t={t} tl={tl} caps={captions} />
      </AbsoluteFill></React.Fragment>
    );
  });
  return (
    <>
      {blurId ? <MBlur id={blurId} sx={bx} sy={by} /> : null}
      <AbsoluteFill style={outer}>{layers}</AbsoluteFill>
    </>
  );
};
