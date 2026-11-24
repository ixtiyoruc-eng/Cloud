import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F, useFonts} from './Reel';
export const Cover: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.navyDeep}}>
      <Img src={staticFile('cover.jpg')} style={{width: '100%', height: '100%'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,10,26,0.55) 0%, rgba(5,10,26,0) 22%, rgba(5,10,26,0) 46%, rgba(10,20,48,0.85) 64%, rgba(5,10,26,0.97) 100%)'}} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 300, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 26, color: C.white, letterSpacing: 2}}>
        <span style={{padding: '8px 18px', borderRadius: 30, background: 'rgba(10,20,48,0.8)', border: '1.5px solid rgba(246,196,69,0.6)'}}>@yevroprotokol_xorazm</span>
        <span style={{color: C.gold, paddingTop: 10}}>MY ADJUSTER</span>
      </div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 1110}}>
        <div style={{fontFamily: F.mono, fontSize: 30, letterSpacing: 6, color: C.gold, display: 'flex', alignItems: 'center', gap: 16}}><span style={{width: 60, height: 3, background: C.gold}} />YTH BO‘LDIMI?</div>
        <div style={{fontFamily: F.big, fontSize: 138, color: C.white, letterSpacing: -5, lineHeight: 0.98, marginTop: 18}}>Mendan pul</div>
        <div style={{fontFamily: F.serif, fontSize: 158, color: C.gold, lineHeight: 0.95, textShadow: `0 0 40px ${C.gold}66`}}>chiqadimi?</div>
        <div style={{fontFamily: F.small, fontWeight: 700, fontSize: 40, color: C.mist, marginTop: 26, lineHeight: 1.25}}>Yevroprotokol, baholash va<br/>sug‘urtadan to‘lov — boshidan oxirigacha.</div>
      </div>
    </AbsoluteFill>
  );
};
