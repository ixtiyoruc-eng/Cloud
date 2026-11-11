import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, Img} from 'remotion';
// ZUHRA PARFUM design kit — brand tokens + reusable motion components (Remotion 4, 1080x1920, 30 fps)

// ===== Zuhra Parfum brand =====
const C = {bordo: '#4A0E1C', dark: '#2B0610', gold: '#C9A45C', lgold: '#E6CF97', cream: '#F6EBDD', vino: '#8C3A4B'};
const GOLD = 'linear-gradient(135deg,#F3E2B3 0%,#C9A45C 45%,#9E7A36 100%)';
const BORDO = 'radial-gradient(120% 140% at 25% 15%,#8C3A4B 0%,#4A0E1C 50%,#2B0610 100%)';
const SANS = 'Montserrat';
const SERIF = 'Playfair';
const FPS = 30;
const u = 10.8; // 1% of width in px
const T = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const expo = Easing.bezier(0.16, 1, 0.3, 1);

const fontCss = `
@font-face{font-family:'Montserrat';src:url('${staticFile('Montserrat[wght].ttf')}') format('truetype');font-weight:100 900;}
@font-face{font-family:'Playfair';src:url('${staticFile('PlayfairDisplay[wght].ttf')}') format('truetype');font-weight:400 900;}
`;

// ===== animation core (After-Effects-like: overshoot spring + motion blur in, blur out) =====
type Kind = 'pop' | 'up' | 'left' | 'right' | 'down';
const useAnim = (start: number, end: number, kind: Kind = 'pop', soft = false) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f0 = T(start), f1 = T(end);
  if (frame < f0 - 1 || frame > f1 + 1) return null;
  const p = spring({frame: frame - f0, fps, config: soft ? {damping: 20, mass: 0.9, stiffness: 110} : {damping: 12, mass: 0.75, stiffness: 120}});
  const lin = interpolate(frame - f0, [0, 12], [0, 1], {...clamp, easing: expo});
  const e = interpolate(frame, [f1 - 9, f1], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  let tr = '';
  if (kind === 'pop') tr = `scale(${0.35 + 0.65 * p})`;
  if (kind === 'up') tr = `translateY(${(1 - p) * 8 * u}px) scale(${0.96 + 0.04 * p})`;
  if (kind === 'down') tr = `translateY(${(p - 1) * 8 * u}px)`;
  if (kind === 'left') tr = `translateX(${(1 - p) * -14 * u}px) scale(${0.9 + 0.1 * p})`;
  if (kind === 'right') tr = `translateX(${(1 - p) * 14 * u}px) scale(${0.9 + 0.1 * p})`;
  tr += ` scale(${1 - e * 0.12})`;
  const blur = (1 - lin) * 2.2 * u + e * 1.6 * u;
  const op = Math.min(1, lin * 1.6) * (1 - e);
  return {transform: tr, opacity: op, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined, local: frame - f0, p} as const;
};

const glassBase = (dark = false): React.CSSProperties => ({
  position: 'absolute', overflow: 'hidden', borderRadius: 4.6 * u,
  background: dark
    ? 'linear-gradient(140deg,rgba(140,58,75,.72) 0%,rgba(74,14,28,.58) 55%,rgba(43,6,16,.68) 100%)'
    : 'linear-gradient(140deg,rgba(255,255,255,.80) 0%,rgba(255,255,255,.56) 45%,rgba(255,255,255,.64) 100%)',
  backdropFilter: 'blur(32px) saturate(180%) brightness(1.08)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.08)',
  border: `${0.28 * u}px solid ${dark ? 'rgba(230,207,151,.6)' : 'rgba(255,255,255,.65)'}`,
  boxShadow: dark
    ? `inset 0 ${0.5 * u}px ${u}px rgba(255,240,215,.35), inset 0 -${0.8 * u}px ${1.6 * u}px rgba(0,0,0,.25), 0 ${3 * u}px ${7 * u}px rgba(30,4,12,.45)`
    : `inset 0 ${0.5 * u}px ${u}px rgba(255,255,255,.7), inset 0 -${0.8 * u}px ${1.6 * u}px rgba(74,14,28,.16), 0 ${3 * u}px ${7 * u}px rgba(30,4,12,.38)`,
  color: dark ? C.cream : C.bordo,
});

const Sheen: React.FC<{local: number}> = ({local}) => {
  const x = interpolate(local, [10, 34], [-60, 280], {...clamp, easing: expo});
  if (local > 36) return null;
  return <div style={{position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: '35%', transform: 'skewX(-18deg)',
    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)', pointerEvents: 'none'}} />;
};

// Glass card: animation applied on the glass element itself (keeps backdrop blur working)
const Glass: React.FC<{start: number; end: number; kind?: Kind; dark?: boolean; style: React.CSSProperties; children?: React.ReactNode; soft?: boolean}> =
({start, end, kind = 'pop', dark, style, children, soft}) => {
  const a = useAnim(start, end, kind, soft);
  if (!a) return null;
  return <div style={{...glassBase(dark), ...style, transform: a.transform, opacity: a.opacity, filter: a.filter}}>
    {children}<Sheen local={a.local} />
  </div>;
};

const Blob: React.FC<{start: number; end: number; gold?: boolean; x: number; y: number; w: number; h: number; ph?: number}> = ({start, end, gold, x, y, w, h, ph = 0}) => {
  const frame = useCurrentFrame();
  const a = useAnim(start, end, 'pop');
  if (!a) return null;
  const dx = Math.sin((frame + ph * 40) / 38) * 0.7 * u, dy = Math.cos((frame + ph * 40) / 44) * 0.9 * u;
  return <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, borderRadius: 3.2 * u,
    background: gold ? GOLD : 'linear-gradient(135deg,#A2495C,#4A0E1C)', boxShadow: `0 ${2 * u}px ${5 * u}px rgba(30,4,12,.35)`,
    transform: `translate(${dx}px,${dy}px) ${a.transform}`, opacity: a.opacity, filter: a.filter}} />;
};

// words that rise one by one
const Words: React.FC<{text: string; start: number; step?: number; style?: React.CSSProperties; em?: boolean}> = ({text, start, step = 0.09, style, em}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <>{text.split(' ').map((w, i) => {
    const s = spring({frame: frame - T(start + i * step), fps, config: {damping: 16, mass: 0.6}});
    const bl = (1 - Math.min(1, s)) * 1.4 * u;
    return <span key={i} style={{display: 'inline-block', marginRight: '0.26em', transform: `translateY(${(1 - s) * 6 * u}px)`, opacity: Math.min(1, s * 1.5),
      filter: bl > 0.3 ? `blur(${bl}px)` : undefined, ...(em ? {fontStyle: 'italic', color: C.vino} : {}), ...style}}>{w}</span>;
  })}</>;
};

// Depth title: lives BEHIND the person layer
const Depth: React.FC<{start: number; end: number; top: number; size: number; small?: string; children: React.ReactNode}> = ({start, end, top, size, small, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f0 = T(start), f1 = T(end);
  if (frame < f0 || frame > f1) return null;
  const p = spring({frame: frame - f0, fps, config: {damping: 22, mass: 1.1, stiffness: 90}});
  const e = interpolate(frame, [f1 - 10, f1], [0, 1], clamp);
  const ls = interpolate(p, [0, 1], [0.28, 0]);
  const drift = (frame - f0) * 0.02; // very slow push
  return <div style={{position: 'absolute', left: 0, right: 0, top: `${top}%`, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: size * u, lineHeight: 0.86,
    color: C.cream, letterSpacing: `${ls}em`, transform: `translateY(${(1 - p) * 12 * u - drift}px) scale(${1.12 - 0.12 * p + e * 0.05})`,
    opacity: Math.min(1, p * 1.4) * (1 - e), filter: `blur(${((1 - Math.min(1, p)) * 2 + e * 1.5) * u}px)`, textShadow: `0 ${1.2 * u}px ${5 * u}px rgba(43,6,16,.35)`}}>
    {small && <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 3.4 * u, fontWeight: 800, letterSpacing: '0.5em', color: C.bordo, textShadow: '0 0 12px rgba(255,245,230,.9)', marginBottom: 2 * u, lineHeight: 1}}>{small}</div>}
    {children}
  </div>;
};
const Gold: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <span style={{fontStyle: 'italic', backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...style}}>{children}</span>;

// Chapter chip top-left + logo top-right
const Chip: React.FC<{start: number; end: number; n: string; text: string}> = ({start, end, n, text}) => (
  <Glass start={start} end={end} kind="left" style={{left: '5%', top: '5.2%', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 2 * u, padding: `${1.6 * u}px ${3.6 * u}px ${1.6 * u}px ${1.6 * u}px`,
    fontFamily: SANS, fontWeight: 700, fontSize: 3 * u, letterSpacing: '0.14em', whiteSpace: 'nowrap'}}>
    <span style={{width: 7 * u, height: 7 * u, borderRadius: '50%', background: BORDO, color: C.lgold, display: 'grid', placeItems: 'center', fontSize: 3 * u, fontWeight: 800, border: `${0.3 * u}px solid ${C.gold}`}}>{n}</span>{text}
  </Glass>
);
const LogoBadge: React.FC<{start: number; end: number}> = ({start, end}) => (
  <Glass start={start} end={end} dark style={{right: '5%', top: '5.2%', width: 10 * u, height: 10 * u, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 5 * u, color: C.lgold}}>Z</Glass>
);

// ===== icons =====
const Drop: React.FC<{c: string; thick?: boolean; s?: number}> = ({c, thick, s = 12}) => (
  <svg width={s * u} height={s * u} viewBox="0 0 64 64" style={{display: 'block', margin: `0 auto ${1.2 * u}px`}}>
    <path d="M32 6C24 18 14 28 14 40a18 18 0 0 0 36 0C50 28 40 18 32 6z" fill={thick ? 'rgba(185,138,98,.9)' : 'none'} stroke={c} strokeWidth="3.4" />
    {!thick && <path d="M24 42a8 8 0 0 0 8 8" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />}
  </svg>
);
const Ico: React.FC<{k: 'moon' | 'sun' | 'spot' | 'hand' | 'chat' | 'check' | 'x'; c: string; s: number}> = ({k, c, s}) => {
  const p = {fill: 'none', stroke: c, strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return <svg width={s * u} height={s * u} viewBox="0 0 64 64" style={{flex: `0 0 ${s * u}px`}}>
    {k === 'moon' && <><path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z" {...p} /><path d="M48 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill={c} /></>}
    {k === 'sun' && <><circle cx="32" cy="32" r="11" {...p} /><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M13 51l6-6M45 19l6-6" {...p} /></>}
    {k === 'spot' && <><circle cx="32" cy="32" r="24" {...p} /><circle cx="24" cy="26" r="3.4" fill={c} /><circle cx="38" cy="36" r="2.6" fill={c} /><circle cx="30" cy="42" r="2" fill={c} /></>}
    {k === 'chat' && <path d="M10 14a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H28l-12 10V42a6 6 0 0 1-6-6z" {...p} />}
    {k === 'check' && <path d="M14 34l12 12 24-26" {...p} strokeWidth={6} />}
    {k === 'x' && <path d="M18 18l28 28M46 18L18 46" {...p} strokeWidth={6} />}
    {k === 'hand' && <path d="M22 34V14a4 4 0 0 1 8 0v16M30 28V10a4 4 0 0 1 8 0v18M38 28v-14a4 4 0 0 1 8 0v18M46 30v-6a4 4 0 0 1 8 0v14c0 12-8 20-18 20h-4c-6 0-10-3-13-8l-8-12a4 4 0 0 1 6-5l5 5" {...p} />}
  </svg>;
};

// small pop-in element (non-glass)
const Pop: React.FC<{start: number; end: number; kind?: Kind; style?: React.CSSProperties; children?: React.ReactNode}> = ({start, end, kind = 'pop', style, children}) => {
  const a = useAnim(start, end, kind);
  if (!a) return null;
  return <div style={{...style, transform: `${style?.transform ?? ''} ${a.transform}`, opacity: a.opacity, filter: a.filter}}>{children}</div>;
};

// ===== camera: stabilised footage + depth layer + person cutout share one transform =====
const Camera: React.FC<{src: string; person: string; cuts: number[]; depth: React.ReactNode}> = ({src, person, cuts, depth}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pts = [0, ...cuts, 9999];
  let i = 0; while (i < pts.length - 2 && t >= pts[i + 1]) i++;
  const scales = [1.0, 1.08, 1.02, 1.1, 1.0, 1.07, 1.03];
  const base = scales[i % scales.length];
  const local = t - pts[i];
  const punch = i === 0 ? interpolate(local, [0, 1.4], [0.12, 0], {...clamp, easing: expo}) : interpolate(local, [0, 0.35], [0.035, 0], {...clamp, easing: expo});
  const drift = Math.min(local, 12) * 0.0035;
  const s = base + punch + drift;
  const grade: React.CSSProperties = {width: '100%', height: '100%', filter: 'contrast(1.05) saturate(1.06) brightness(1.02) sepia(0.05)'};
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '50% 33%'}}>
    <OffthreadVideo src={staticFile(src)} muted style={grade} />
    <AbsoluteFill>{depth}</AbsoluteFill>
    <AbsoluteFill style={{WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 66%,transparent 76%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 66%,transparent 76%)'}}>
      <OffthreadVideo src={staticFile(person)} muted transparent style={grade} />
    </AbsoluteFill>
  </AbsoluteFill>;
};

const Vignette = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 40%,rgba(0,0,0,0) 58%,rgba(43,6,16,.45) 100%)'}} />;

// ===== shared UI blocks =====
const pairCard = (dark: boolean): React.CSSProperties => ({width: '43%', padding: `${4 * u}px ${3.4 * u}px`, textAlign: 'center'});
const nm: React.CSSProperties = {fontFamily: SANS, fontWeight: 800, fontSize: 5.2 * u, letterSpacing: '0.12em'};
const dsS: React.CSSProperties = {fontFamily: SANS, fontWeight: 600, fontSize: 3 * u, lineHeight: 1.35, marginTop: 1.2 * u};

const Item: React.FC<{start: number; end: number; ok: boolean; text: string}> = ({start, end, ok, text}) => (
  <Pop start={start} end={end} kind="up" style={{display: 'flex', gap: 1.8 * u, alignItems: 'flex-start', fontFamily: SANS, fontWeight: 700, fontSize: 3.5 * u, lineHeight: 1.25, marginTop: 1.8 * u}}>
    <span style={{flex: `0 0 ${5.4 * u}px`, height: 5.4 * u, borderRadius: '50%', display: 'grid', placeItems: 'center', background: ok ? GOLD : 'rgba(246,235,221,.92)'}}>
      <Ico k={ok ? 'check' : 'x'} c={ok ? C.dark : C.vino} s={3.4} /></span>{text}
  </Pop>
);

const Outro: React.FC<{start: number; end: number}> = ({start, end}) => {
  const frame = useCurrentFrame();
  const f0 = T(start);
  const clickF = f0 + T(1.7);
  const cur = interpolate(frame, [clickF - 24, clickF - 2], [0, 1], {...clamp, easing: expo});
  const press = interpolate(frame, [clickF - 2, clickF + 2, clickF + 7], [1, 0.9, 1], clamp);
  const done = frame >= clickF + 2;
  const ring = (frame * 1.6) % 360;
  return <>
    <Blob start={start + 0.1} end={end} gold x={5} y={45} w={30} h={10} />
    <Blob start={start + 0.25} end={end} x={70} y={82} w={26} h={11} ph={2} />
    <Glass start={start} end={end} style={{left: '8%', right: '8%', top: '48%', height: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 * u}}>
      <Pop start={start + 0.1} end={end} style={{width: 24 * u, height: 24 * u, position: 'relative'}}>
        <div style={{position: 'absolute', inset: -1.4 * u, borderRadius: '50%', background: `conic-gradient(from ${ring}deg, ${C.gold}, #FFF3D0, ${C.gold}, #8A6A2C, ${C.gold})`}} />
        <Img src={staticFile('logo_avatar.svg')} style={{position: 'absolute', inset: 0, width: 24 * u, height: 24 * u}} />
      </Pop>
      <Pop start={start + 0.3} end={end} kind="up" style={{textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 7.6 * u, letterSpacing: '0.3em', color: C.bordo, lineHeight: 1}}>
        ZUHRA<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 2.6 * u, letterSpacing: '0.4em', color: C.vino, marginTop: 1.4 * u}}>PARFUM · URGANCH</div>
      </Pop>
      <Pop start={start + 0.5} end={end} style={{position: 'relative'}}>
        <div style={{position: 'relative', whiteSpace: 'nowrap', padding: `${3 * u}px ${6 * u}px`, borderRadius: 99, fontFamily: SANS, fontWeight: 800, fontSize: 3.8 * u, letterSpacing: '0.08em',
          color: done ? C.cream : C.dark, background: done ? BORDO : GOLD, boxShadow: `0 ${2 * u}px ${5 * u}px rgba(30,4,12,.4)`, transform: `scale(${press})`}}>
          {done ? "✓ OBUNA BO'LDINGIZ" : "OBUNA BO'LING"}
        </div>
        <svg width={10 * u} height={11.6 * u} viewBox="0 0 24 28" style={{position: 'absolute', right: -5 * u + (1 - cur) * -18 * u, bottom: -8 * u + (1 - cur) * -18 * u, opacity: Math.min(1, cur * 2) * interpolate(frame, [clickF + 20, clickF + 30], [1, 0], clamp), transform: `scale(${press})`}}>
          <path d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12l.5-.1V9.5a1.5 1.5 0 0 1 3 0v2.6l.5.1v-1.7a1.5 1.5 0 0 1 3 0V13l.5.1v-1a1.5 1.5 0 0 1 3 0V18c0 4-2.7 7-6.5 7h-2c-2.3 0-3.8-1-5-2.8L4.6 17.4a1.6 1.6 0 0 1 2.4-2z" fill="#fff" stroke="#2B0610" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </Pop>
    </Glass>
  </>;
};

const Swatch: React.FC<{start: number; end: number; color: string; label: string; x?: boolean}> = ({start, end, color, label, x}) => (
  <Pop start={start} end={end} style={{width: 18 * u, height: 18 * u, borderRadius: '50%', background: color, border: `${0.6 * u}px solid rgba(255,255,255,.95)`, boxShadow: `0 ${1.4 * u}px ${3 * u}px rgba(0,0,0,.25)`, position: 'relative'}}>
    <div style={{position: 'absolute', left: '50%', bottom: -6.4 * u, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 800, fontSize: 2.6 * u, letterSpacing: '0.1em'}}>{label}</div>
    {x && <Pop start={start + 0.0001} end={end} style={{}}><span /></Pop>}
  </Pop>
);

const Sparkles: React.FC<{n?: number; seed?: number; area?: {x: number; y: number; w: number; h: number}; startFrame?: number; strength?: number}> =
({n = 22, seed = 1, area = {x: 0, y: 0, w: 1080, h: 1920}, startFrame = 0, strength = 1}) => {
  const frame = useCurrentFrame() - startFrame;
  const rnd = (k: number) => {const x = Math.sin(k * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x);};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, k) => {
        const period = 70 + rnd(k) * 80;
        const ph = ((frame + rnd(k + 9) * period) % period) / period;
        const x = area.x + rnd(k + 3) * area.w;
        const y = area.y + rnd(k + 5) * area.h - ph * 60;
        const o = Math.sin(ph * Math.PI) * (0.35 + rnd(k + 7) * 0.65) * strength;
        const sz = 6 + rnd(k + 11) * 14;
        return (
          <div key={k} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, opacity: o,
            transform: `rotate(45deg) scale(${0.6 + Math.sin(ph * Math.PI) * 0.6})`}}>
            <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle, #FFF6DA 0%, ${C.lgold} 35%, rgba(201,164,92,0) 70%)`}} />
            <div style={{position: 'absolute', left: '45%', top: -sz * 0.6, width: '10%', height: sz * 2.2, background: '#FFF3D0', borderRadius: 4}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- header: PREMIUM vs BYUDJET ----------

const Flash: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const a = T(at);
  const o = interpolate(frame, [a - 4, a, a + 10], [0, 0.75, 0], clamp);
  if (o <= 0) return null;
  const x = interpolate(frame, [a - 4, a + 10], [-30, 130], clamp);
  return <AbsoluteFill style={{opacity: o, mixBlendMode: 'screen',
    background: `radial-gradient(ellipse 60% 90% at ${x}% 40%, rgba(255,238,200,1) 0%, rgba(230,180,120,0.6) 35%, rgba(140,58,75,0) 70%)`}} />;
};

// ---------- CTA: question + comment ----------

// ===== CAPTIONS (subtitles) =====
// words: [{w: 'Tonalnik', s: 1.20, e: 1.62, em?: true}] in seconds (from whisper word timestamps)
// Pages of up to `per` words; the spoken word turns gold and lifts; `em` words are Playfair italic gold.
export type CapWord = {w: string; s: number; e: number; em?: boolean};
const Captions: React.FC<{words: CapWord[]; per?: number; top?: number; variant?: 'clean' | 'glass'}> = ({words, per = 4, top = 68, variant = 'glass'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pages: CapWord[][] = [];
  for (let i = 0; i < words.length; i += per) pages.push(words.slice(i, i + per));
  const pg = pages.find((p, k) => t >= p[0].s - 0.05 && t < (pages[k + 1]?.[0].s ?? p[p.length - 1].e + 0.4) - 0.05);
  if (!pg) return null;
  const p0 = T(pg[0].s - 0.05);
  const inS = spring({frame: frame - p0, fps, config: {damping: 16, mass: 0.6}});
  const box: React.CSSProperties = variant === 'glass'
    ? {...glassBase(true), position: 'relative', borderRadius: 3.2 * u, padding: `${1.6 * u}px ${3.4 * u}px`}
    : {position: 'relative'};
  return <div style={{position: 'absolute', left: '7%', right: '7%', top: `${top}%`, display: 'flex', justifyContent: 'center'}}>
    <div style={{...box, transform: `translateY(${(1 - inS) * 3 * u}px) scale(${0.94 + 0.06 * inS})`, opacity: Math.min(1, inS * 1.5), textAlign: 'center', lineHeight: 1.18}}>
      {pg.map((w, k) => {
        const on = t >= w.s - 0.03;
        const cur = on && t < w.e + 0.05;
        const ws = spring({frame: frame - T(w.s - 0.03), fps, config: {damping: 14, mass: 0.5}});
        const base: React.CSSProperties = w.em
          ? {fontFamily: SERIF, fontStyle: 'italic', fontWeight: 800, fontSize: 6.6 * u, backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}
          : {fontFamily: SANS, fontWeight: 800, fontSize: 5.2 * u, color: cur ? C.lgold : C.cream, textTransform: 'none'};
        return <span key={k} style={{display: 'inline-block', margin: `0 ${0.9 * u}px`, ...base,
          opacity: on ? 1 : 0.45, transform: `translateY(${on ? (1 - Math.min(1, ws)) * 1.6 * u : 0}px) scale(${cur ? 1.06 : 1})`,
          textShadow: variant === 'clean' && !w.em ? `0 ${0.4 * u}px ${1.6 * u}px rgba(43,6,16,.85)` : undefined,
          filter: variant === 'clean' && w.em ? `drop-shadow(0 ${0.4 * u}px ${1.2 * u}px rgba(43,6,16,.8))` : undefined}}>{w.w}</span>;
      })}
    </div>
  </div>;
};

export {C, GOLD, BORDO, SANS, SERIF, FPS, u, T, clamp, expo, fontCss, useAnim, glassBase, Sheen, Glass, Blob, Words, Depth, Gold, Chip, LogoBadge,
  Drop, Ico, Pop, Camera, Vignette, Item, Outro, Swatch, Sparkles, Flash, Captions};
