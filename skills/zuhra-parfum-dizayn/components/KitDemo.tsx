import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, BORDO, u, fontCss, Glass, Depth, Gold, Chip, LogoBadge, Blob, Words, Item, Swatch, Sparkles, Flash, Captions, Vignette, CapWord} from './zuhra-kit';

const W: CapWord[] = [
  {w: 'Bu', s: 0.2, e: 0.4}, {w: 'atir', s: 0.4, e: 0.8, em: true}, {w: 'kun', s: 0.8, e: 1.0}, {w: "bo'yi", s: 1.0, e: 1.4},
  {w: 'saqlanadi', s: 1.4, e: 2.0}, {w: 'va', s: 2.0, e: 2.2}, {w: 'juda', s: 2.2, e: 2.5}, {w: 'nafis', s: 2.5, e: 3.0, em: true},
];
// Neutral demo background (no footage) to show every element of the kit
export const KitDemo: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg,#d9c7b8 0%,#b99a86 50%,#8a6b5e 100%)'}}>
    <style>{fontCss}</style>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 40% 26% at 50% 36%,rgba(246,235,221,.55),rgba(0,0,0,0) 70%)'}} />
    <Depth start={0} end={99} top={12} size={20} small="DEPTH SARLAVHA">NEGA?</Depth>
    <Chip start={0} end={99} n="01" text="BO'LIM NOMI" />
    <LogoBadge start={0} end={99} />
    <Blob start={0} end={99} gold x={4} y={52} w={28} h={8} />
    <Blob start={0} end={99} x={72} y={80} w={24} h={9} ph={2} />
    <Glass start={0} end={99} kind="up" style={{left: '6%', width: '42%', top: '55%', padding: `${3.4 * u}px`}}>
      <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 4.4 * u, letterSpacing: '0.12em'}}>YORUG' SHISHA</div>
      <Item start={0.2} end={99} ok text="Afzallik" />
      <Item start={0.3} end={99} ok={false} text="Kamchilik" />
    </Glass>
    <Glass start={0} end={99} dark kind="up" style={{right: '6%', width: '42%', top: '55%', padding: `${3.4 * u}px`}}>
      <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 4.4 * u, letterSpacing: '0.12em', color: C.lgold}}>BORDO SHISHA</div>
      <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 3 * u, marginTop: u}}>qorong'i variant</div>
    </Glass>
    <div style={{position: 'absolute', left: '8%', right: '8%', top: '45%', textAlign: 'center', fontFamily: 'Playfair', fontWeight: 900, fontSize: 7 * u, color: C.bordo}}>
      <Words text="So'zma-so'z chiqadi" start={0} /> <Gold>oltin</Gold>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: '82%', display: 'flex', justifyContent: 'center', gap: 10 * u}}>
      <Swatch start={0} end={99} color="#C89B7B" label="RANG 1" /><Swatch start={0} end={99} color="#EFE2D6" label="RANG 2" />
    </div>
    <Captions words={W} top={71} />
    <Sparkles n={18} area={{x: 60, y: 900, w: 960, h: 800}} />
    <Vignette />
  </AbsoluteFill>
);
