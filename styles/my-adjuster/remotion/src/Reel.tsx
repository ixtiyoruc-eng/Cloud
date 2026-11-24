import React from 'react';
import {AbsoluteFill, OffthreadVideo, Audio, Img, staticFile, useCurrentFrame, interpolate, Easing, delayRender, continueRender} from 'remotion';
import {BLOCKS, ICONS, PUNCH, TAGS, VEND, END, LOWER, HANDLE, PHONE} from './cues';

export const FPS = 30;
export const TOTAL = Math.round(END * FPS);

// ---------- MY ADJUSTER palette (navy uniform + gold brand) ----------
export const C = {
  navy: '#0A1430', navy2: '#101F45', navyDeep: '#050A1A', gold: '#F6C445', goldHi: '#FFDD7A', goldDeep: '#C9962A',
  white: '#FFFFFF', mist: '#D9DEEA', red: '#E5484D',
};
export const F = {big: 'MAArchivo', small: 'MAInter', serif: 'MASerif', mono: 'MAMono'};
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const useT = () => useCurrentFrame() / FPS;
const prog = (t: number, a: number, d: number, e = ease) => interpolate(t, [a, a + d], [0, 1], {...cl, easing: e});

export const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    const list: [string, string, string][] = [
      [F.big, 'ArchivoBlack-Regular.ttf', '400'], [F.small, 'InterDisplay-Bold.otf', '700'], [F.small, 'InterDisplay-Black.otf', '900'],
      [F.serif, 'InstrumentSerif-Italic.ttf', '400'], [F.mono, 'SpaceMono-Bold.ttf', '700'],
    ];
    Promise.all(list.map(([n, f, w]) => new FontFace(n, `url(${staticFile(f)})`, {weight: w}).load().then((ff) => (document as any).fonts.add(ff))))
      .then(() => continueRender(h));
  }, [h]);
};

// ---------- kinetic caption block (reference grammar: small words + one huge glowing keyword) ----------
type Wd = {w: string; t: number};
type Line = {k: 'small' | 'big' | 'serif' | 'white'; words: Wd[]; align?: 'l' | 'c' | 'r'};
export type Block = {out: number; lines: Line[]; strike?: {t: number; line: number}; y?: number};

const fit = (text: string, size: number, k: string) => {
  const per = k === 'big' || k === 'white' ? 0.74 : k === 'serif' ? 0.46 : 0.56;
  return Math.min(size, 980 / Math.max(1, text.length * per));
};
const SIZE = {small: 62, big: 168, serif: 128, white: 150};

const Word: React.FC<{wd: Wd; k: Line['k']; size: number}> = ({wd, k, size}) => {
  const t = useT();
  const p = prog(t, wd.t - 0.06, k === 'small' ? 0.32 : 0.45, k === 'small' ? ease : back);
  const pb = prog(t, wd.t - 0.06, 0.35);
  const big = k !== 'small';
  const col = k === 'small' ? C.white : k === 'white' ? C.white : C.gold;
  const glow = k === 'small' ? '0 2px 14px rgba(5,10,26,0.85)' :
    k === 'white' ? '0 0 30px rgba(255,255,255,0.35), 0 6px 26px rgba(5,10,26,0.8)' :
    `0 0 22px rgba(246,196,69,0.75), 0 0 60px rgba(246,196,69,0.40), 0 6px 26px rgba(5,10,26,0.75)`;
  return (
    <span style={{display: 'inline-block', margin: `0 ${size * (big ? 0.09 : 0.14)}px`, color: col, opacity: pb,
      transform: big ? `translateY(${(1 - p) * size * 0.35}px) scale(${0.55 + 0.45 * p})` : `translateY(${(1 - p) * size * 0.6}px)`,
      textShadow: glow, transformOrigin: '50% 80%'}}>{wd.w}</span>
  );
};

const Strike: React.FC<{t0: number; width: number}> = ({t0, width}) => {
  const t = useT();
  const p = prog(t, t0, 0.35, easeIO);
  return (
    <svg style={{position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%) rotate(-4deg)', overflow: 'visible', filter: 'drop-shadow(0 0 10px rgba(229,72,77,0.8))'}} width={width} height={30}>
      <path d={`M0,22 Q${width * 0.5},6 ${width},12`} stroke={C.red} strokeWidth={13} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
    </svg>
  );
};

export const Caption: React.FC<{b: Block}> = ({b}) => {
  const t = useT();
  const first = b.lines[0].words[0].t;
  if (t < first - 0.06 || t >= b.out) return null;
  const o = 0;
  const y = b.y ?? 1240;
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
      {b.lines.map((ln, i) => {
        const text = ln.words.map((w) => w.w).join(' ');
        const size = fit(text, SIZE[ln.k], ln.k);
        const fam = ln.k === 'small' ? F.small : ln.k === 'serif' ? F.serif : F.big;
        const al = ln.align === 'l' ? 'flex-start' : ln.align === 'r' ? 'flex-end' : 'center';
        return (
          <div key={i} style={{position: 'relative', alignSelf: 'stretch', display: 'flex', justifyContent: al, padding: '0 70px',
            fontFamily: fam, fontWeight: ln.k === 'small' ? 900 : 400, fontSize: size, lineHeight: ln.k === 'small' ? 1.0 : 0.98,
            letterSpacing: ln.k === 'small' ? -1 : ln.k === 'serif' ? -1 : -size * 0.035, whiteSpace: 'nowrap',
            marginTop: ln.k === 'small' && i > 0 ? 4 : 0, marginBottom: ln.k === 'small' ? -4 : 0}}>
            <span style={{position: 'relative'}}>
              {ln.words.map((wd, j) => <Word key={j} wd={wd} k={ln.k} size={size} />)}
              {b.strike && b.strike.line === i ? <Strike t0={b.strike.t} width={text.length * size * 0.72} /> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- gold outline icons (pop + float, like the paper plane in the reference) ----------
const PATHS: Record<string, string[]> = {
  car: ['M5 17h14v-4l-2-5H7l-2 5v4z', 'M5 13h14', 'M7.5 17v2M16.5 17v2', 'M8 15h.01M16 15h.01'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z', 'M8.5 12l2.5 2.5 4.5-5'],
  doc: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M9.5 12h6M9.5 15.5h6M9.5 8.5h3'],
  money: ['M3 7h18v10H3z', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', 'M6 10v4M18 10v4'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  check: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8 12.5l3 3 5-6'],
  crash: ['M12 3l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z'],
  arrow: ['M4 12h15', 'M13 6l6 6-6 6'],
  warn: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
};
export type Ico = {t0: number; out: number; x: number; y: number; s?: number; rot?: number; type: string};
export const Icon: React.FC<{i: Ico}> = ({i}) => {
  const t = useT();
  if (t < i.t0 || t > i.out + 0.4) return null;
  const p = prog(t, i.t0, 0.55, back);
  const d = prog(t, i.t0, 0.7, easeIO);
  const o = prog(t, i.out, 0.35, easeIO);
  const s = i.s ?? 150;
  const fl = Math.sin(t * 2.2 + i.x) * 8;
  return (
    <svg style={{position: 'absolute', left: i.x - s / 2, top: i.y - s / 2, overflow: 'visible', opacity: Math.min(1, p * 2) * (1 - o),
      transform: `translateY(${fl - o * 30}px) rotate(${(i.rot ?? -10) + (1 - p) * -25}deg) scale(${0.3 + 0.7 * p})`, filter: `drop-shadow(0 0 10px ${C.gold}) drop-shadow(0 0 26px ${C.gold}88)`}}
      width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[i.type].map((pp, k) => <path key={k} d={pp} pathLength={1} strokeDasharray={`${d} 2`} />)}
    </svg>
  );
};

// ---------- brand chrome ----------
const Shield: React.FC<{s: number; c?: string}> = ({s, c = C.navy}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
);
const TopBar: React.FC = () => {
  const t = useT();
  const p = prog(t, 0.1, 0.7);
  const o = prog(t, VEND - 0.2, 0.4, easeIO);
  return (
    <div style={{position: 'absolute', left: 48, right: 48, top: 92, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      opacity: p * (1 - o), transform: `translateY(${(1 - p) * -40}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px 12px 14px', borderRadius: 40, background: 'rgba(10,20,48,0.78)',
        border: '1.5px solid rgba(246,196,69,0.55)', fontFamily: F.mono, fontSize: 26, color: C.white, backdropFilter: 'blur(8px)'}}>
        <div style={{width: 40, height: 40, borderRadius: 20, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Shield s={26} /></div>
        {HANDLE}
      </div>
      <div style={{fontFamily: F.mono, fontSize: 22, color: C.gold, letterSpacing: 3, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>MY ADJUSTER</div>
    </div>
  );
};
const Tag: React.FC<{t0: number; out: number; text: string; y?: number}> = ({t0, out, text, y = 1130}) => {
  const t = useT();
  if (t < t0 || t > out + 0.4) return null;
  const p = prog(t, t0, 0.5);
  const o = prog(t, out, 0.35, easeIO);
  const bar = prog(t, t0, 0.45, easeIO);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
      opacity: p * (1 - o), filter: `blur(${o * 8}px)`, fontFamily: F.mono, fontSize: 28, letterSpacing: 4, color: C.gold, textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>
      <span style={{width: 60 * bar, height: 3, background: C.gold, boxShadow: `0 0 10px ${C.gold}`}} />{text}
    </div>
  );
};
const Lower: React.FC = () => {
  const t = useT();
  const {t0, out, name, role} = LOWER;
  if (t < t0 || t > out + 0.6) return null;
  const p = prog(t, t0, 0.7);
  const bar = prog(t, t0 + 0.1, 0.5, easeIO);
  const o = prog(t, out, 0.45, easeIO);
  return (
    <div style={{position: 'absolute', left: 60, top: 300, opacity: (1 - o), transform: `translateX(${(1 - p) * -80 - o * 60}px)`}}>
      <div style={{display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{width: 14 * bar + 2, background: C.gold}} />
        <div style={{background: 'linear-gradient(120deg, rgba(10,20,48,0.95), rgba(16,31,69,0.88))', padding: '22px 34px 22px 28px'}}>
          <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.gold}}>{role}</div>
          <div style={{fontFamily: F.big, fontSize: 52, color: C.white, letterSpacing: -1, marginTop: 4}}>{name}</div>
        </div>
      </div>
    </div>
  );
};
const Progress: React.FC = () => {
  const t = useT();
  return <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${Math.min(1, t / VEND) * 100}%`, background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`, boxShadow: `0 0 14px ${C.gold}`}} />;
};

// ---------- video with smooth punch-ins ----------
const zoomAt = (t: number) => {
  let z = 1;
  for (const [a, b, s] of PUNCH) {
    const pin = prog(t, a, 0.5, easeIO), pout = prog(t, b, 0.6, easeIO);
    z *= 1 + (s - 1) * pin * (1 - pout);
  }
  return z * (1 + 0.025 * Math.sin(t * 0.25));
};
const Video: React.FC = () => {
  const t = useT();
  const z = zoomAt(Math.min(t, VEND));
  const endBlur = prog(t, VEND - 0.5, 0.7, easeIO);
  return (
    <AbsoluteFill style={{transform: `scale(${z * (1 + 0.06 * endBlur)})`, transformOrigin: '50% 38%', filter: endBlur > 0 ? `brightness(${1 - endBlur * 0.6})` : undefined}}>
      {t < VEND ? <OffthreadVideo src={staticFile('talk.mp4')} muted style={{width: '100%', height: '100%'}} />
        : <Img src={staticFile('last.jpg')} style={{width: '100%', height: '100%'}} />}
    </AbsoluteFill>
  );
};

// ---------- end card ----------
const EndCard: React.FC = () => {
  const t = useT();
  const a = VEND - 0.1;
  if (t < a) return null;
  const bg = prog(t, a, 0.6, easeIO);
  const l1 = prog(t, a + 0.25, 0.6, back), l2 = prog(t, a + 0.55, 0.6), l3 = prog(t, a + 0.85, 0.6, back), l4 = prog(t, a + 1.15, 0.6);
  const pulse = 1 + 0.03 * Math.max(0, Math.sin((t - a - 1.4) * 5)) * (t > a + 1.4 ? 1 : 0);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(16,31,69,${0.55 * bg}) 0%, rgba(5,10,26,${0.9 * bg}) 80%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: l1, transform: `scale(${0.5 + 0.5 * l1})`, width: 150, height: 150, borderRadius: 40, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${C.gold}88`}}><Shield s={96} /></div>
      <div style={{marginTop: 40, fontFamily: F.mono, fontSize: 30, letterSpacing: 6, color: C.gold, opacity: l2}}>— TEKIN KONSULTATSIYA</div>
      <div style={{fontFamily: F.big, fontSize: 132, color: C.white, letterSpacing: -4, lineHeight: 1, marginTop: 18, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)`}}>Qo‘ng‘iroq</div>
      <div style={{fontFamily: F.serif, fontSize: 140, color: C.gold, lineHeight: 1, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)`, textShadow: `0 0 40px ${C.gold}66`}}>qiling</div>
      <div style={{marginTop: 50, display: 'flex', alignItems: 'center', gap: 20, padding: '26px 48px', borderRadius: 70, background: C.gold, opacity: l3,
        transform: `scale(${(0.6 + 0.4 * l3) * pulse})`, boxShadow: `0 0 50px ${C.gold}99, 0 20px 50px rgba(0,0,0,0.5)`, fontFamily: F.big, fontSize: 64, color: C.navy, letterSpacing: -1}}>
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d={PATHS.phone[0]} /></svg>{PHONE}
      </div>
      <div style={{marginTop: 46, fontFamily: F.mono, fontSize: 30, color: C.mist, opacity: l4, letterSpacing: 1}}>{HANDLE} · 24/7</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  useFonts();
  const t = useT();
  return (
    <AbsoluteFill style={{background: C.navyDeep}}>
      <Video />
      {/* navy grade for legibility */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,10,26,0.55) 0%, rgba(5,10,26,0) 14%, rgba(5,10,26,0) 50%, rgba(5,10,26,0.55) 72%, rgba(5,10,26,0.82) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 55%, rgba(5,10,26,0.45) 100%)'}} />
      <Progress />
      {/* TopBar olib tashlandi */}
      <Lower />
      {/* teglar olib tashlandi */}
      {ICONS.map((i, k) => <Icon key={k} i={i} />)}
      {BLOCKS.map((b, i) => { const nx = BLOCKS[i + 1]?.lines[0].words[0].t ?? b.out; const out = nx - b.out < 1.2 ? nx - 0.06 : b.out; return <Caption key={i} b={{...b, out}} />; })}
      <EndCard />
      <Audio src={staticFile('talk.wav')} />
      {t < 0 ? null : null}
    </AbsoluteFill>
  );
};
