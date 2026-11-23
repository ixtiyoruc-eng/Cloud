import React from 'react';
import {AbsoluteFill, OffthreadVideo, Audio, staticFile, useCurrentFrame, interpolate, Easing, delayRender, continueRender} from 'remotion';
import {CUES, FACE, ZOOM, SEG, END} from './cues';

export const FPS = 30;
export const TOTAL = Math.round(END * FPS);
const W = 1080, H = 1920;

// ---------- palette (taken from the footage: wine knit, black leather, gold earring) ----------
const C = {
  cream: '#FBF5EF', ink: '#2B0D16', wine: '#8E2A45', wineDeep: '#1B0A10', rose: '#E9B7AE',
  blush: '#F4D6CE', gold: '#F1C97B', goldDeep: '#C9963F', white: '#FFF7EE',
};
const FONT = 'Outfit';
const ease = Easing.bezier(0.22, 1, 0.36, 1); // smooth out
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const useT = () => useCurrentFrame() / FPS;
const prog = (t: number, a: number, d: number, e = ease) => interpolate(t, [a, a + d], [0, 1], {...cl, easing: e});

// ---------- background ----------
const Blob: React.FC<{x: number; y: number; s: number; c: string; o: number}> = ({x, y, s, c, o}) => (
  <div style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: o,
    background: `radial-gradient(closest-side, ${c} 0%, ${c}CC 22%, ${c}55 52%, ${c}00 100%)`}} />
);
const Bg: React.FC<{dark: number}> = ({dark}) => {
  const t = useT();
  const m = (a: number, b: number, sp: number, ph: number) => a + b * Math.sin(t * sp + ph);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.cream}}>
        <Blob x={m(820, 160, 0.5, 0)} y={m(180, 120, 0.4, 1)} s={1250} c={C.rose} o={0.95} />
        <Blob x={m(160, 140, 0.45, 2)} y={m(1650, 130, 0.5, 0.5)} s={1300} c={'#B8475F'} o={0.62} />
        <Blob x={m(900, 120, 0.6, 3)} y={m(1250, 160, 0.35, 2)} s={900} c={C.gold} o={0.5} />
        <Blob x={m(250, 100, 0.55, 4)} y={m(520, 120, 0.45, 3)} s={800} c={C.blush} o={0.9} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: C.wineDeep, opacity: dark}}>
        <Blob x={m(260, 170, 0.5, 1)} y={m(380, 140, 0.4, 0)} s={1300} c={'#6E1B33'} o={0.9} />
        <Blob x={m(880, 150, 0.45, 2)} y={m(1500, 150, 0.5, 1.5)} s={1400} c={'#8E2A45'} o={0.75} />
        <Blob x={m(200, 120, 0.6, 3)} y={m(1380, 130, 0.38, 2.2)} s={800} c={'#3A0E1C'} o={0.9} />
        <Blob x={m(860, 100, 0.52, 4)} y={m(520, 120, 0.47, 3.1)} s={700} c={C.goldDeep} o={0.22} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(8,2,5,0.55) 100%)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- glow squiggle (travelling neon stroke, like the reference) ----------
const Squig: React.FC<{d: string; t0: number; dur?: number; x: number; y: number; s?: number; color?: string; w?: number}> = ({d, t0, dur = 0.9, x, y, s = 1, color = C.gold, w = 14}) => {
  const t = useT();
  if (t < t0 || t > t0 + dur) return null;
  const p = prog(t, t0, dur, easeIO);
  const len = 0.32;
  return (
    <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible', filter: `drop-shadow(0 0 14px ${color}) drop-shadow(0 0 34px ${color}AA)`}} width={300 * s} height={300 * s} viewBox="0 0 300 300">
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1}
        strokeDasharray={`${len} 2`} strokeDashoffset={interpolate(p, [0, 1], [len, -1])} />
    </svg>
  );
};
const P1 = 'M20,220 C60,60 180,40 200,140 C215,220 120,250 110,170 C100,90 220,60 280,90';
const P2 = 'M20,60 C120,20 240,80 200,170 C170,240 80,230 60,280';
const P3 = 'M10,150 C80,40 160,260 290,120';

// ---------- kinetic text ----------
type Wd = {w: string; t: number; hl?: boolean};
const Word: React.FC<{wd: Wd; dark: boolean; size: number; out: number}> = ({wd, dark, size, out}) => {
  const t = useT();
  const p = prog(t, wd.t, 0.42);
  const base = dark ? C.white : C.ink;
  const hlCol = dark ? C.gold : C.wine;
  const box = prog(t, wd.t - 0.04, 0.38, easeIO);
  return (
    <span style={{display: 'inline-block', position: 'relative', margin: `0 ${size * 0.13}px`, padding: wd.hl ? `${size * 0.04}px ${size * 0.2}px` : 0}}>
      {wd.hl ? (
        <>
          <span style={{position: 'absolute', inset: 0, transformOrigin: 'left center', transform: `scaleX(${box})`, borderRadius: size * 0.1,
            background: dark ? 'linear-gradient(90deg, rgba(241,201,123,0.30), rgba(241,201,123,0.12))' : 'linear-gradient(90deg, rgba(142,42,69,0.20), rgba(233,183,174,0.55))',
            boxShadow: dark ? '0 0 40px rgba(241,201,123,0.25)' : '0 0 40px rgba(142,42,69,0.15)'}} />
          <span style={{position: 'absolute', left: 0, top: -size * 0.04, bottom: -size * 0.04, width: 4, borderRadius: 2, background: hlCol, opacity: box}} />
          <span style={{position: 'absolute', left: `${box * 100}%`, top: -size * 0.04, bottom: -size * 0.04, width: 4, marginLeft: -4, borderRadius: 2, background: hlCol, opacity: box}} />
        </>
      ) : null}
      <span style={{display: 'inline-block', position: 'relative', color: wd.hl ? hlCol : base, opacity: p,
        transform: `translateY(${(1 - p) * size * 0.55}px) scale(${0.92 + 0.08 * p})`, filter: `blur(${(1 - p) * 10}px)`,
        textShadow: dark ? (wd.hl ? '0 0 26px rgba(241,201,123,0.55)' : '0 0 22px rgba(255,240,225,0.28)') : 'none'}}>{wd.w}</span>
    </span>
  );
};
const Lines: React.FC<{lines: Wd[][]; out: number; y: number; size?: number; dark?: boolean; weight?: number; shadow?: boolean}> = ({lines, out, y, size = 92, dark = false, weight = 600, shadow = false}) => {
  const t = useT();
  const first = lines[0][0].t;
  if (t < first - 0.1 || t > out + 0.45) return null;
  const o = prog(t, out, 0.4, easeIO);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.22, letterSpacing: -size * 0.012,
      opacity: 1 - o, transform: `translateY(${-o * 46}px)`, filter: `blur(${o * 12}px) ${shadow ? 'drop-shadow(0 6px 22px rgba(20,4,9,0.75))' : ''}`}}>
      {lines.map((ln, i) => (
        <div key={i} style={{whiteSpace: 'nowrap'}}>{ln.map((wd, j) => <Word key={j} wd={wd} dark={dark} size={size} out={out} />)}</div>
      ))}
    </div>
  );
};

// ---------- floating chip / bubble / stat ----------
const Chip: React.FC<{t0: number; out: number; x: number; y: number; rot?: number; text: string; dark?: boolean; size?: number; ph?: number}> = ({t0, out, x, y, rot = 0, text, dark = false, size = 46, ph = 0}) => {
  const t = useT();
  if (t < t0 || t > out + 0.5) return null;
  const p = prog(t, t0, 0.6);
  const o = prog(t, out, 0.45, easeIO);
  const fl = Math.sin(t * 1.6 + ph) * 9;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - p) * 90 + fl - o * 40}px) rotate(${rot + (1 - p) * 10}deg) scale(${0.6 + 0.4 * p})`,
      opacity: p * (1 - o), filter: `blur(${(1 - p) * 8 + o * 10}px)`, fontFamily: FONT, fontWeight: 600, fontSize: size, color: dark ? C.white : C.ink,
      padding: `${size * 0.36}px ${size * 0.7}px`, borderRadius: size * 0.6, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: size * 0.32,
      background: dark ? 'linear-gradient(135deg, rgba(60,16,30,0.92), rgba(110,27,51,0.88))' : 'linear-gradient(135deg, rgba(255,250,244,0.97), rgba(250,232,224,0.94))',
      border: `2px solid ${dark ? 'rgba(241,201,123,0.55)' : 'rgba(255,255,255,0.9)'}`, boxShadow: '0 22px 60px rgba(30,6,14,0.38)'}}>
      <span style={{width: size * 0.36, height: size * 0.36, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${C.gold}, ${C.goldDeep})`, boxShadow: `0 0 16px ${C.gold}`}} />
      {text}
    </div>
  );
};
const Bubble: React.FC<{t0: number; out: number; x: number; y: number; rot: number; from: number; text: string}> = ({t0, out, x, y, rot, from, text}) => {
  const t = useT();
  if (t < t0 || t > out + 0.5) return null;
  const p = prog(t, t0, 0.7);
  const o = prog(t, out, 0.45, easeIO);
  const fl = Math.sin(t * 1.4 + x) * 7;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translateX(${(1 - p) * from}px) translateY(${fl - o * 50}px) rotate(${rot + (1 - p) * from * 0.02}deg)`,
      opacity: Math.min(1, p * 1.6) * (1 - o), filter: `blur(${(1 - p) * 10 + o * 10}px)`, display: 'flex', alignItems: 'center', gap: 22,
      padding: '24px 40px 24px 26px', borderRadius: 44, background: 'linear-gradient(135deg, rgba(255,251,246,0.97), rgba(246,232,226,0.95))',
      border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 26px 70px rgba(20,4,9,0.5)', whiteSpace: 'nowrap'}}>
      <div style={{width: 70, height: 70, borderRadius: 24, background: `linear-gradient(135deg, ${C.wine}, #B8475F)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.2 1 1.4 1 2.6M12 3c0 1.2 1 1.4 1 2.6"/></svg>
      </div>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 50, color: C.ink, letterSpacing: -0.5}}>{text}</div>
    </div>
  );
};
const Stat: React.FC<{t0: number; out: number}> = ({t0, out}) => {
  const t = useT();
  if (t < t0 || t > out + 0.5) return null;
  const p = prog(t, t0, 0.7);
  const o = prog(t, out, 0.45, easeIO);
  const ring = prog(t, t0 + 0.15, 1.5, easeIO);
  const R = 92, CIRC = 2 * Math.PI * R;
  const num = Math.max(1, Math.round(ring * 3));
  return (
    <div style={{position: 'absolute', left: 540, top: 1330, transform: `translate(-50%,-50%) translateY(${(1 - p) * 140 - o * 50 + Math.sin(t * 1.5) * 6}px) scale(${0.8 + 0.2 * p}) rotate(${(1 - p) * -4}deg)`,
      opacity: p * (1 - o), filter: `blur(${(1 - p) * 10 + o * 10}px)`, display: 'flex', alignItems: 'center', gap: 40, padding: '38px 56px 38px 40px', borderRadius: 60,
      background: 'linear-gradient(135deg, rgba(255,251,246,0.97), rgba(247,231,224,0.95))', border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 30px 90px rgba(20,4,9,0.55)'}}>
      <div style={{position: 'relative', width: 220, height: 220}}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 10px ${C.gold}99)`}}>
          <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(142,42,69,0.14)" strokeWidth="18" />
          <circle cx="110" cy="110" r={R} fill="none" stroke={C.wine} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${CIRC * ring} ${CIRC}`} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 108, color: C.wine}}>{num}</div>
      </div>
      <div style={{fontFamily: FONT, color: C.ink, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
        <div style={{fontWeight: 800, fontSize: 92, letterSpacing: -2}}>yildan beri</div>
        <div style={{fontWeight: 500, fontSize: 50, opacity: 0.72, marginTop: 8}}>mening mijozim</div>
      </div>
    </div>
  );
};
const Heart: React.FC<{t0: number; x: number; y: number; s: number}> = ({t0, x, y, s}) => {
  const t = useT();
  if (t < t0) return null;
  const p = prog(t, t0, 1.3, easeIO);
  const beat = 1 + 0.05 * Math.max(0, Math.sin((t - t0 - 1.2) * 5.2)) * (t > t0 + 1.2 ? 1 : 0);
  return (
    <svg style={{position: 'absolute', left: x - s / 2, top: y - s / 2, overflow: 'visible', transform: `scale(${beat})`, filter: `drop-shadow(0 0 16px ${C.gold}) drop-shadow(0 0 40px ${C.gold}88)`}} width={s} height={s} viewBox="0 0 100 100">
      <path d="M50 86 C20 62 8 46 8 30 C8 17 18 9 29 9 C38 9 46 14 50 22 C54 14 62 9 71 9 C82 9 92 17 92 30 C92 46 80 62 50 86 Z" fill={`rgba(142,42,69,${0.12 * p})`} stroke={C.wine} strokeWidth={4.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
    </svg>
  );
};

// ---------- video layer ----------
type L = {x: number; y: number; w: number; h: number; r: number; o: number; fy: number};
const LAY: Record<string, L> = {
  full: {x: 0, y: 0, w: W, h: H, r: 0, o: 1, fy: 0.36},
  card: {x: 90, y: 170, w: 900, h: 1090, r: 70, o: 1, fy: 0.42},
  cardS: {x: 170, y: 190, w: 740, h: 900, r: 70, o: 1, fy: 0.42},
  hidden: {x: 290, y: 420, w: 500, h: 620, r: 90, o: 0, fy: 0.42},
};
const KEYS: [number, string][] = CUES.layout as any;
const lerpL = (a: L, b: L, p: number): L => ({x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p, r: a.r + (b.r - a.r) * p, o: a.o + (b.o - a.o) * p, fy: a.fy + (b.fy - a.fy) * p});
const layoutAt = (t: number): L => {
  let cur = LAY[KEYS[0][1]];
  for (let i = 1; i < KEYS.length; i++) {
    const [kt, name] = KEYS[i];
    const p = interpolate(t, [kt - 0.15, kt + 0.6], [0, 1], {...cl, easing: easeIO});
    if (p <= 0) break;
    cur = lerpL(cur, LAY[name], p);
  }
  return cur;
};
const segAt = (t: number) => { let i = 0; while (i < SEG.length - 2 && t >= SEG[i + 1]) i++; return i; };
const VideoLayer: React.FC = () => {
  const t = useT();
  const l = layoutAt(t);
  const si = segAt(Math.min(t, SEG[SEG.length - 1] - 0.01));
  const local = (Math.min(t, SEG[SEG.length - 1]) - SEG[si]) / (SEG[si + 1] - SEG[si]);
  const fullness = (l.w - 500) / (W - 500);
  const zoom = (1 + (ZOOM[si] - 1) * Math.max(0, Math.min(1, (fullness - 0.6) / 0.4))) * (1 + 0.035 * local);
  const [fx, fyv] = FACE[si];
  const s = Math.max(l.w / W, l.h / H) * zoom;
  const vw = W * s, vh = H * s;
  const left = Math.min(0, Math.max(l.w - vw, 0.5 * l.w - fx * vw));
  const top = Math.min(0, Math.max(l.h - vh, l.fy * l.h - fyv * vh));
  const isCard = 1 - Math.max(0, Math.min(1, (fullness - 0.75) / 0.25));
  const fl = Math.sin(t * 1.3) * 7 * isCard;
  if (l.o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: l.x, top: l.y + fl, width: l.w, height: l.h, borderRadius: l.r, overflow: 'hidden', opacity: l.o,
      transform: `scale(${0.9 + 0.1 * l.o})`, filter: l.o < 1 ? `blur(${(1 - l.o) * 14}px)` : undefined,
      boxShadow: `0 ${50 * isCard}px ${130 * isCard}px rgba(30,6,14,${0.5 * isCard})`}}>
      <OffthreadVideo src={staticFile('talk.mp4')} muted style={{position: 'absolute', left, top, width: vw, height: vh, maxWidth: 'none'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: l.r, border: `${3 * isCard}px solid rgba(241,201,123,${0.7 * isCard})`}} />
      <div style={{position: 'absolute', inset: 0, opacity: 1 - isCard, background: 'linear-gradient(180deg, rgba(27,10,16,0.30) 0%, rgba(27,10,16,0) 16%, rgba(27,10,16,0) 52%, rgba(40,8,18,0.50) 78%, rgba(27,10,16,0.74) 100%)'}} />
    </div>
  );
};

// ---------- main ----------
export const Reel: React.FC = () => {
  const t = useT();
  const [h] = React.useState(() => delayRender('font'));
  React.useEffect(() => {
    const f = new FontFace('Outfit', `url(${staticFile('Outfit.ttf')})`, {weight: '100 900'});
    f.load().then((ff) => { (document as any).fonts.add(ff); continueRender(h); });
  }, [h]);
  const TH: [number, number][] = CUES.theme as any;
  let dark = TH[0][1];
  for (let i = 1; i < TH.length; i++) dark += (TH[i][1] - TH[i - 1][1]) * prog(t, TH[i][0] - 0.1, 0.6, easeIO);
  const isDark = dark > 0.5;
  const c = CUES as any;
  const endFade = prog(t, END - 0.35, 0.35, easeIO);
  return (
    <AbsoluteFill style={{background: C.wineDeep}}>
      <Bg dark={dark} />
      <VideoLayer />
      {/* A1 card + type */}
      <Lines lines={c.a1} out={c.a1out} y={1330} size={96} />
      <Squig d={P1} t0={0.25} x={760} y={1180} s={1.1} color={C.wine} w={10} />
      <Squig d={P3} t0={1.4} x={60} y={1500} s={1.0} color={C.goldDeep} w={10} />
      <Chip t0={0.2} out={2.15} x={540} y={172} text={'Maslahat'} dark size={50} />
      {/* A2 full + captions + worries */}
      {c.caps.map((blk: any, i: number) => <Lines key={i} lines={blk.lines} out={blk.out} y={1300} size={84} dark shadow />)}
      {c.a2chips.map((k: any, i: number) => <Chip key={i} {...k} out={c.a2out - 0.1} dark={false} ph={i * 2} />)}
      {/* B type dark */}
      <Lines lines={c.b} out={c.bout} y={760} size={128} dark weight={700} />
      <Squig d={P1} t0={c.b[0][0].t + 0.1} x={640} y={470} s={1.3} />
      <Squig d={P2} t0={c.b[1][0].t + 0.1} dur={1.0} x={90} y={1150} s={1.3} />
      <Squig d={P3} t0={c.b[2][0].t + 0.2} x={520} y={1250} s={1.5} />
      {/* C full captions */}
      {/* D card dark + chips */}
      {c.d.map((blk: any, i: number) => <Lines key={i} lines={blk.lines} out={blk.out} y={1400} size={88} dark />)}
      {c.dchips.map((k: any, i: number) => <Chip key={i} {...k} out={c.dout} ph={i * 1.7} />)}
      <Squig d={P2} t0={SEG[3] + 0.3} x={820} y={1230} s={1.0} />
      {/* E full + bubbles */}
      {c.ebub.map((k: any, i: number) => <Bubble key={i} {...k} />)}
      {/* F card light */}
      {c.f.map((blk: any, i: number) => <Lines key={i} lines={blk.lines} out={blk.out} y={blk.y} size={blk.size} />)}
      <Squig d={P1} t0={c.f[0].lines[0][0].t + 0.3} x={780} y={1180} s={1.0} color={C.wine} w={10} />
      {/* G full + stat */}
      <Stat t0={c.g} out={c.gout} />
      {/* H */}
      <Lines lines={c.h2} out={c.h2out} y={720} size={104} dark weight={700} />
      <Squig d={P2} t0={c.h2[0][0].t + 0.1} x={760} y={430} s={1.3} />
      <Squig d={P3} t0={c.h2[2][0].t + 0.1} dur={1.0} x={120} y={1180} s={2.4} w={8} />
      <Squig d={P1} t0={c.h2[1][0].t + 0.2} x={60} y={420} s={1.0} />
      {/* I end */}
      <Lines lines={c.i} out={999} y={1170 - 470 * prog(t, SEG[SEG.length - 1] + 0.12, 0.8, easeIO)} size={112} weight={700} />
      <Heart t0={c.i[0][0].t + 0.2} x={540} y={1590 - 470 * prog(t, SEG[SEG.length - 1] + 0.12, 0.8, easeIO)} s={170} />
      <Squig d={P3} t0={c.i[1][0].t + 0.2} x={700} y={1050} s={1.1} color={C.wine} w={10} />
      <AbsoluteFill style={{background: C.cream, opacity: endFade}} />
      <Audio src={staticFile('talk.wav')} />
    </AbsoluteFill>
  );
};
