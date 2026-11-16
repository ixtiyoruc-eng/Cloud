import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption, MgSlot} from './types';
import {C, EASE_IN, EASE_OUT, EASE_SOFT, FONT, glass, prog} from './theme';

/** absolute time of the first caption word matching re inside [t0,t1) */
const wordTime = (caps: Caption[], re: RegExp, t0: number, t1: number) => {
  for (const c of caps) for (const w of c.words) if (w.t >= t0 && w.t < t1 && re.test(w.w)) return w.t;
  return null;
};

const Backdrop: React.FC<{t: number}> = ({t}) => {
  const a = Math.sin(t * 0.35) * 60, b = Math.cos(t * 0.28) * 50;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 38%, #12306f 0%, ${C.midnight} 42%, ${C.deep} 100%)`}}>
      <div style={{position: 'absolute', width: 900, height: 900, left: -220 + a, top: 180 + b, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,98,230,0.55) 0%, rgba(46,98,230,0) 65%)'}} />
      <div style={{position: 'absolute', width: 760, height: 760, right: -260 - a, top: 980 - b, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(140,190,255,0.30) 0%, rgba(140,190,255,0) 65%)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(100% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,6,18,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

const stroke = {fill: 'none', stroke: C.icy, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

// ---- per-card visuals (all driven by local time lt and absolute key times) ----
const WeightGraph: React.FC<{lt: number; plateAt: number}> = ({lt, plateAt}) => {
  const d = prog(lt, 0.2, 1.4, EASE_SOFT); const pl = prog(lt, plateAt, 0.6);
  return (
    <svg width={560} height={300} viewBox="0 0 560 300">
      <line x1={40} y1={250} x2={520} y2={250} stroke="rgba(207,227,255,0.25)" strokeWidth={3} />
      <path d="M40 200 C 140 196, 220 204, 300 199 S 440 196, 520 198" {...stroke} stroke={C.soft} strokeDasharray={520} strokeDashoffset={520 * (1 - d)} />
      <text x={40} y={60} fill="rgba(207,227,255,0.65)" fontFamily="Inter Tight" fontSize={30} fontWeight={500}>vazn</text>
      <g transform={`translate(${interpolate(pl, [0, 1], [640, 430])} 105)`} opacity={pl}>
        <circle r={62} fill="rgba(160,200,255,0.12)" stroke={C.icy} strokeWidth={4} />
        <circle r={40} fill="none" stroke="rgba(207,227,255,0.55)" strokeWidth={3} />
        <line x1={-92} y1={-40} x2={-92} y2={45} {...stroke} strokeWidth={5} />
        <line x1={92} y1={-40} x2={92} y2={45} {...stroke} strokeWidth={5} />
      </g>
    </svg>
  );
};
const Plates: React.FC<{lt: number}> = ({lt}) => {
  const tilt = prog(lt, 0.1, 0.35);
  return (
    <svg width={560} height={300} viewBox="0 0 560 300">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={i === 2 ? `translate(${280 + tilt * 40} ${170 - i * 46 - tilt * 18}) rotate(${-tilt * 14})` : `translate(280 ${170 - i * 46})`}>
          <ellipse rx={170} ry={42} fill="rgba(150,195,255,0.14)" stroke={C.icy} strokeWidth={4} />
          <ellipse rx={110} ry={24} fill="none" stroke="rgba(207,227,255,0.45)" strokeWidth={3} />
        </g>
      ))}
      <circle cx={470} cy={70} r={34} fill="none" stroke="rgba(207,227,255,0.35)" strokeWidth={4} />
      <line x1={470} y1={70} x2={470 + 22 * Math.sin(tilt * 2.4)} y2={70 - 22 * Math.cos(tilt * 2.4)} {...stroke} strokeWidth={4} />
    </svg>
  );
};
const Shaker: React.FC<{lt: number; chipAt: number}> = ({lt, chipAt}) => {
  const rot = interpolate(lt, [0, 5], [-28, 18], {extrapolateRight: 'clamp', easing: EASE_SOFT});
  const fill = prog(lt, 0.2, 1.6, EASE_SOFT); const chip = prog(lt, chipAt, 0.45);
  const sw = Math.sin(lt * 2.2) * 6;
  return (
    <div style={{position: 'relative', width: 560, height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `perspective(900px) rotateY(${rot}deg)`, width: 170, height: 300}}>
        <svg width={170} height={300} viewBox="0 0 170 300">
          <defs>
            <linearGradient id="liq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fb2ff" /><stop offset="1" stopColor="#1f4fc9" /></linearGradient>
            <clipPath id="body"><path d="M28 70 L142 70 L132 285 Q85 296 38 285 Z" /></clipPath>
          </defs>
          <rect x={44} y={18} width={82} height={46} rx={12} fill="rgba(180,210,255,0.25)" stroke={C.icy} strokeWidth={4} />
          <g clipPath="url(#body)">
            <path d={`M0 ${290 - 190 * fill + sw} Q 45 ${280 - 190 * fill - sw} 85 ${290 - 190 * fill + sw} T 170 ${290 - 190 * fill} L170 300 L0 300 Z`} fill="url(#liq)" opacity={0.9} />
          </g>
          <path d="M28 70 L142 70 L132 285 Q85 296 38 285 Z" fill="rgba(160,200,255,0.10)" stroke={C.icy} strokeWidth={4} />
          <line x1={52} y1={95} x2={46} y2={250} stroke="rgba(255,255,255,0.35)" strokeWidth={6} strokeLinecap="round" />
        </svg>
      </div>
      <div style={{position: 'absolute', right: 40, top: 40 + (1 - chip) * 26, opacity: chip, filter: `blur(${(1 - chip) * 8}px)`,
        ...glass(30), padding: '12px 28px', fontFamily: FONT, fontWeight: 600, fontSize: 36, color: C.white, letterSpacing: 2}}>GEYNER</div>
    </div>
  );
};
const Battery: React.FC<{lt: number}> = ({lt}) => (
  <svg width={560} height={300} viewBox="0 0 560 300">
    <rect x={190} y={30} width={180} height={250} rx={28} fill="rgba(150,195,255,0.10)" stroke={C.icy} strokeWidth={5} />
    <rect x={245} y={10} width={70} height={24} rx={8} fill={C.icy} opacity={0.8} />
    {[0, 1, 2, 3, 4].map((i) => {
      const p = prog(lt, 0.35 + i * 0.28, 0.4);
      return <rect key={i} x={212} y={242 - i * 46} width={136} height={34} rx={10} fill={C.soft} opacity={0.15 + 0.85 * p}
        style={{filter: p > 0.5 ? 'drop-shadow(0 0 10px rgba(120,180,255,0.8))' : undefined}} />;
    })}
    <text x={420} y={170} fill={C.icy} fontFamily="Inter Tight" fontWeight={600} fontSize={64}>ATF</text>
  </svg>
);
const Fibre: React.FC<{lt: number}> = ({lt}) => {
  const path = 'M30 160 C 120 60, 200 260, 280 160 S 440 60, 530 160';
  const u = (lt * 0.55) % 1;
  return (
    <svg width={560} height={300} viewBox="0 0 560 300">
      <defs><linearGradient id="pulse"><stop offset={Math.max(0, u - 0.12)} stopColor={C.soft} stopOpacity={0.25} /><stop offset={u} stopColor="#ffffff" stopOpacity={1} /><stop offset={Math.min(1, u + 0.12)} stopColor={C.soft} stopOpacity={0.25} /></linearGradient></defs>
      {[-34, -12, 12, 34].map((o, i) => <path key={i} d={path} transform={`translate(0 ${o})`} fill="none" stroke="rgba(150,195,255,0.22)" strokeWidth={10} strokeLinecap="round" />)}
      <path d={path} fill="none" stroke="url(#pulse)" strokeWidth={12} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 12px rgba(120,180,255,0.9))'}} />
    </svg>
  );
};
const Steak: React.FC<{lt: number}> = ({lt}) => {
  const p = prog(lt, 0.15, 0.6);
  return (
    <svg width={560} height={300} viewBox="0 0 560 300">
      <g transform={`translate(280 150) scale(${0.9 + 0.1 * p})`} opacity={p}>
        <path d="M-150 -20 C -150 -95, -40 -110, 40 -90 C 130 -70, 165 -10, 140 50 C 115 105, 10 110, -60 90 C -125 72, -150 30, -150 -20 Z" fill="rgba(150,195,255,0.14)" stroke={C.icy} strokeWidth={5} />
        <path d="M-95 -15 C -80 -55, -10 -60, 30 -45" fill="none" stroke="rgba(207,227,255,0.5)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={70} cy={10} r={22} fill="none" stroke={C.icy} strokeWidth={5} />
      </g>
    </svg>
  );
};

export const MotionGraphic: React.FC<{slot: MgSlot; captions: Caption[]}> = ({slot, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lt = frame / fps; const t = slot.out_start + lt;
  const dur = slot.out_end - slot.out_start;
  const inP = prog(lt, 0, 0.35, EASE_IN);
  const outP = prog(lt, dur - 0.25, 0.25, EASE_OUT);
  return (
    <AbsoluteFill style={{opacity: inP * (1 - outP), filter: `blur(${(1 - inP) * 12 + outP * 10}px)`, scale: String(1 + outP * 0.04)}}>
      <Backdrop t={t} />
      {slot.cards.map((c, i) => {
        const nxt = slot.cards[i + 1];
        const cIn = i === 0 ? prog(lt, 0.05, 0.45, EASE_IN) : prog(t, c.t - 0.05, 0.4, EASE_IN);
        const cOut = nxt ? prog(t, nxt.t - 0.2, 0.22, EASE_OUT) : 0;
        if (cIn <= 0 || cOut >= 1) return null;
        const clt = t - c.t;
        let vis: React.ReactNode = null;
        if (slot.id === 'MG1' && i === 0) vis = <WeightGraph lt={clt} plateAt={(wordTime(captions, /^köp$/i, c.t, c.out_end) ?? c.t + 3) - c.t} />;
        if (slot.id === 'MG1' && i === 1) vis = <Plates lt={clt} />;
        if (slot.id === 'MG1' && i === 2) vis = <Shaker lt={clt} chipAt={(wordTime(captions, /geyner/i, c.t, c.out_end) ?? c.t + 2) - c.t} />;
        if (slot.id === 'MG2' && i === 0) vis = <Battery lt={clt} />;
        if (slot.id === 'MG2' && i === 1) vis = <Fibre lt={clt} />;
        if (slot.id === 'MG2' && i === 2) vis = <Steak lt={clt} />;
        return (
          <AbsoluteFill key={i} style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 380,
            opacity: cIn * (1 - cOut), translate: `0px ${(1 - cIn) * 40 - cOut * 18}px`, filter: `blur(${(1 - cIn) * 10 + cOut * 8}px)`}}>
            <div style={{...glass(56), width: 860, padding: '56px 56px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              translate: `0px ${Math.sin(t * 1.1) * 6}px`}}>
              {vis}
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 84, letterSpacing: -1.5, color: C.white, textAlign: 'center', marginTop: 28,
                textShadow: '0 0 26px rgba(110,170,255,0.35)'}}>{c.title}</div>
              {c.subtitle ? <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 46, color: C.accent, marginTop: 10}}>{c.subtitle}</div> : null}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
