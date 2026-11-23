import React from 'react';
import {AbsoluteFill, Img, staticFile, delayRender, continueRender} from 'remotion';
const C = {cream: '#FBF5EF', ink: '#2B0D16', wine: '#8E2A45', deep: '#1B0A10', gold: '#F1C97B', goldDeep: '#C9963F', white: '#FFF7EE'};
export const Cover: React.FC = () => {
  const [h] = React.useState(() => delayRender('font'));
  React.useEffect(() => {
    const f = new FontFace('Outfit', `url(${staticFile('Outfit.ttf')})`, {weight: '100 900'});
    f.load().then((ff) => { (document as any).fonts.add(ff); continueRender(h); });
  }, [h]);
  const Z = 1.22; const vw = 1080 * Z, vh = 1920 * Z;
  return (
    <AbsoluteFill style={{background: C.deep, fontFamily: 'Outfit'}}>
      <Img src={staticFile('cover.jpg')} style={{position: 'absolute', width: vw, height: vh, left: 540 - 0.5 * vw, top: 640 - 0.385 * vh, maxWidth: 'none', filter: 'contrast(1.05) saturate(1.06) brightness(1.04)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 45% at 50% 33%, rgba(27,10,16,0) 55%, rgba(27,10,16,0.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(27,10,16,0.55) 0%, rgba(27,10,16,0) 14%, rgba(27,10,16,0) 46%, rgba(70,16,34,0.80) 62%, rgba(27,10,16,0.97) 80%, #1B0A10 100%)'}} />
      <div style={{position: 'absolute', left: -200, top: 1050, width: 900, height: 900, background: 'radial-gradient(closest-side, rgba(142,42,69,0.75), rgba(142,42,69,0))'}} />
      <div style={{position: 'absolute', left: 520, top: 1250, width: 800, height: 800, background: 'radial-gradient(closest-side, rgba(201,150,63,0.28), rgba(201,150,63,0))'}} />
      {/* tag */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 38px', borderRadius: 40, fontWeight: 600, fontSize: 44, letterSpacing: 6, color: C.white,
          background: 'linear-gradient(135deg, rgba(60,16,30,0.92), rgba(110,27,51,0.9))', border: '2px solid rgba(241,201,123,0.65)', boxShadow: '0 18px 50px rgba(0,0,0,0.45)'}}>
          <span style={{width: 16, height: 16, borderRadius: 8, background: C.gold, boxShadow: `0 0 16px ${C.gold}`}} />KOSMETOLOG MASLAHATI
        </div>
      </div>
      {/* title */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 1150, textAlign: 'center', fontWeight: 800, fontSize: 150, lineHeight: 1.12, letterSpacing: -3, color: C.white, textShadow: '0 8px 40px rgba(0,0,0,0.55)'}}>
        <div>
          <span style={{position: 'relative', display: 'inline-block', padding: '0 34px', color: C.gold, textShadow: '0 0 40px rgba(241,201,123,0.55)'}}>
            <span style={{position: 'absolute', inset: '10px 0', borderRadius: 16, background: 'linear-gradient(90deg, rgba(241,201,123,0.30), rgba(241,201,123,0.10))', borderLeft: `6px solid ${C.gold}`, borderRight: `6px solid ${C.gold}`}} />
            <span style={{position: 'relative'}}>Qalb</span>
          </span>{' '}go’zal
        </div>
        <div>bo’lishi kerak</div>
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 1530, textAlign: 'center', fontWeight: 500, fontSize: 50, lineHeight: 1.25, color: 'rgba(255,247,238,0.86)'}}>
        Mijozga tashqi ko’rinishiga qarab<br />baho bermang
      </div>
      {/* glow strokes */}
      <svg style={{position: 'absolute', left: 850, top: 850, overflow: 'visible', filter: `drop-shadow(0 0 14px ${C.gold}) drop-shadow(0 0 34px ${C.gold}AA)`}} width="240" height="200" viewBox="0 0 240 200">
        <path d="M10,170 C60,40 150,30 170,100 C182,150 120,170 115,120 C110,70 180,40 230,50" fill="none" stroke={C.gold} strokeWidth="11" strokeLinecap="round" />
      </svg>
      <svg style={{position: 'absolute', left: 50, top: 950, overflow: 'visible', filter: `drop-shadow(0 0 12px ${C.gold}) drop-shadow(0 0 30px ${C.gold}AA)`}} width="160" height="80" viewBox="0 0 160 80">
        <path d="M5,40 C40,5 90,75 155,25" fill="none" stroke={C.gold} strokeWidth="9" strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};
