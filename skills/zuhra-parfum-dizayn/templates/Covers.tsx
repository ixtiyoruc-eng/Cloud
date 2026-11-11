import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const C = {bordo: '#4A0E1C', dark: '#2B0610', gold: '#C9A45C', lgold: '#E6CF97', cream: '#F6EBDD', vino: '#8C3A4B'};
const GOLD = 'linear-gradient(135deg,#F3E2B3 0%,#C9A45C 45%,#9E7A36 100%)';
const BORDO = 'radial-gradient(120% 140% at 25% 15%,#8C3A4B 0%,#4A0E1C 50%,#2B0610 100%)';
const u = 10.8;
const fontCss = `
@font-face{font-family:'Montserrat';src:url('${staticFile('Montserrat[wght].ttf')}') format('truetype');font-weight:100 900;}
@font-face{font-family:'Playfair';src:url('${staticFile('PlayfairDisplay[wght].ttf')}') format('truetype');font-weight:400 900;}
`;
const glass: React.CSSProperties = {
  position: 'absolute', overflow: 'hidden', borderRadius: 5 * u,
  background: 'linear-gradient(140deg,rgba(255,255,255,.82) 0%,rgba(255,255,255,.58) 45%,rgba(255,255,255,.68) 100%)',
  backdropFilter: 'blur(34px) saturate(180%) brightness(1.08)', WebkitBackdropFilter: 'blur(34px) saturate(180%) brightness(1.08)',
  border: `${0.3 * u}px solid rgba(255,255,255,.7)`,
  boxShadow: `inset 0 ${0.5 * u}px ${u}px rgba(255,255,255,.75), inset 0 -${0.8 * u}px ${1.6 * u}px rgba(74,14,28,.16), 0 ${3 * u}px ${8 * u}px rgba(30,4,12,.42)`,
  color: C.bordo,
};
const grade: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'contrast(1.06) saturate(1.06) brightness(1.03) sepia(0.05)'};
const Gold: React.FC<{children: React.ReactNode}> = ({children}) =>
  <span style={{fontStyle: 'italic', backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{children}</span>;

const Shell: React.FC<{v: 'A' | 'B'; small: string; big: string; bigSize: number; children: React.ReactNode}> = ({v, small, big, bigSize, children}) => (
  <AbsoluteFill style={{background: C.dark}}>
    <style>{fontCss}</style>
    <AbsoluteFill style={{transform: 'scale(1.1)', transformOrigin: '50% 30%'}}>
      <Img src={staticFile(`cov${v}_bg.png`)} style={grade} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(43,6,16,.6) 0%,rgba(43,6,16,.18) 26%,rgba(43,6,16,0) 50%,rgba(43,6,16,.55) 100%)'}} />
      {/* depth title behind the person */}
      <div style={{position: 'absolute', left: 0, right: 0, top: '14.5%', textAlign: 'center'}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 3.6 * u, letterSpacing: '0.55em', color: C.cream, textShadow: '0 2px 18px rgba(43,6,16,.7)', marginBottom: 1.4 * u}}>{small}</div>
        <div style={{fontFamily: 'Playfair', fontWeight: 900, fontSize: bigSize * u, lineHeight: 0.9, letterSpacing: '-0.01em', backgroundImage: 'linear-gradient(180deg,#FFF6DE 0%,#E6CF97 40%,#C9A45C 75%,#9E7A36 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 6px rgba(43,6,16,.45)) drop-shadow(0 10px 28px rgba(43,6,16,.55))'}}>{big}</div>
      </div>
      <Img src={staticFile(`cov${v}_person.png`)} style={{...grade, WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 62%,transparent 72%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 62%,transparent 72%)'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 40%,rgba(0,0,0,0) 60%,rgba(43,6,16,.45) 100%)'}} />
    {/* logo */}
    <div style={{position: 'absolute', right: '5%', top: '4.5%', width: 11 * u, height: 11 * u, borderRadius: '50%', display: 'grid', placeItems: 'center', background: BORDO, border: `${0.35 * u}px solid ${C.gold}`,
      fontFamily: 'Playfair', fontWeight: 800, fontSize: 5.4 * u, color: C.lgold, boxShadow: '0 10px 30px rgba(30,4,12,.4)'}}>Z</div>
    {children}
  </AbsoluteFill>
);

const Brand = () => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 * u, marginTop: 3.4 * u}}>
    <div style={{height: 0.3 * u, width: 9 * u, background: GOLD}} />
    <div style={{fontFamily: 'Playfair', fontWeight: 700, fontSize: 3.6 * u, letterSpacing: '0.32em', color: C.bordo}}>ZUHRA <span style={{fontFamily: 'Montserrat', fontSize: 2.3 * u, letterSpacing: '0.4em', color: C.vino}}>PARFUM</span></div>
    <div style={{height: 0.3 * u, width: 9 * u, background: GOLD}} />
  </div>
);

export const CoverA: React.FC = () => (
  <Shell v="A" small="TONALNIK" big="NEGA?" bigSize={23}>
    <div style={{...glass, left: '6%', right: '6%', top: '59%', padding: `${4.4 * u}px ${4 * u}px ${4 * u}px`, textAlign: 'center'}}>
      <div style={{display: 'inline-block', padding: `${1.2 * u}px ${3.4 * u}px`, borderRadius: 99, background: BORDO, color: C.lgold, fontFamily: 'Montserrat', fontWeight: 800, fontSize: 2.9 * u, letterSpacing: '0.18em', border: `${0.25 * u}px solid ${C.gold}`}}>SABABI VA YECHIMI</div>
      <div style={{fontFamily: 'Playfair', fontWeight: 900, fontSize: 9.6 * u, lineHeight: 1.04, marginTop: 2.6 * u, color: C.bordo}}>
        Tonalnik nega<br />yuzda <span style={{fontStyle: 'italic', color: C.vino}}>yaxshi</span><br />turmaydi?
      </div>
      <Brand />
    </div>
  </Shell>
);

const Pill: React.FC<{dark?: boolean; children: React.ReactNode}> = ({dark, children}) => (
  <div style={{flex: 1, padding: `${2.2 * u}px 0`, borderRadius: 99, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 4.4 * u, letterSpacing: '0.14em',
    background: dark ? BORDO : 'rgba(255,255,255,.75)', color: dark ? C.lgold : C.bordo, border: `${0.3 * u}px solid ${dark ? C.gold : 'rgba(74,14,28,.25)'}`, boxShadow: '0 8px 22px rgba(30,4,12,.25)'}}>{children}</div>
);

export const CoverB: React.FC = () => (
  <Shell v="B" small="SUYUQ YOKI" big="QALIN?" bigSize={21}>
    <div style={{...glass, left: '6%', right: '6%', top: '60%', padding: `${4.4 * u}px ${4.4 * u}px ${4 * u}px`, textAlign: 'center'}}>
      <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 3.2 * u, letterSpacing: '0.3em', color: C.vino}}>TONALNIK TANLASH</div>
      <div style={{fontFamily: 'Playfair', fontWeight: 900, fontSize: 9.4 * u, lineHeight: 1.05, marginTop: 1.6 * u, color: C.bordo}}>
        Qaysi biri <span style={{fontStyle: 'italic', color: C.vino}}>sizga</span><br />mos keladi?
      </div>
      <div style={{display: 'flex', gap: 2.4 * u, alignItems: 'center', marginTop: 3.4 * u}}>
        <Pill>SUYUQ</Pill>
        <div style={{width: 9 * u, height: 9 * u, borderRadius: '50%', background: GOLD, display: 'grid', placeItems: 'center', fontFamily: 'Playfair', fontWeight: 900, fontStyle: 'italic', fontSize: 4 * u, color: C.bordo, flex: 'none', border: `${0.3 * u}px solid ${C.cream}`}}>vs</div>
        <Pill dark>QALIN</Pill>
      </div>
      <Brand />
    </div>
  </Shell>
);
