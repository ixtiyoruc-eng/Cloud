// Reference-B captions (same engine as the Atlet reel): word-by-word pop with overshoot on the spoken onset, accent word in a
// cobalt pill that wipes in from the left with a white flash, single accent words as hero words with outline ghost copies.
// The block jumps on cuts and drops. The hook line is not captioned here: Versus.tsx sets it as giant type.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from './types';
import {CAP, CAP_CX, capLayout} from './layout';
import {C, EASE_EXPO, F, FONT, hit, popScale, prog} from './theme';
import {TL} from './timeline';

const Word: React.FC<{cap: Caption; i: number; t: number; size: number; accent: boolean; hero: boolean}> = ({cap, i, t, size, accent, hero}) => {
  const w = cap.words[i];
  const t0 = w.t - 2 * F;
  if (t < t0) return <span style={{display: 'inline-block', opacity: 0}}>{w.w}</span>;
  const op = prog(t, t0, 2 * F, (x) => x);
  const sc = popScale(t, t0, accent ? 1.7 : 0.45, accent ? -0.1 : 0.14, 0.26);
  const y = (1 - prog(t, t0, 0.14, EASE_EXPO)) * (accent ? -10 : 38);
  const bl = (1 - prog(t, t0, 3 * F, (x) => x)) * 9;
  const g = hit(t, t0 + 3 * F, 0.12);
  const pillP = prog(t, t0, 5 * F, EASE_EXPO);
  const shadow = `0 4px 18px rgba(0,8,32,0.65), 0 0 ${16 + 34 * g}px rgba(90,150,255,${0.25 + 0.65 * g})`;
  const ghost = hero && accent ? prog(t, t0 + 4 * F, 0.32, EASE_EXPO) : 0;
  return (
    <span style={{display: 'inline-block', position: 'relative', opacity: op, scale: String(sc), translate: `0px ${y}px`, filter: bl > 0.3 ? `blur(${bl}px)` : undefined, transformOrigin: '50% 60%'}}>
      {accent ? (
        <span style={{position: 'absolute', left: 0, right: 0, top: '0.06em', bottom: '0.02em', borderRadius: '0.3em', transformOrigin: '0% 50%', scale: `${pillP} 1`,
          background: g > 0.5 ? 'linear-gradient(180deg, #FFFFFF, #CFE3FF)' : 'linear-gradient(180deg, #4C8DFF 0%, #2457D6 100%)',
          boxShadow: `0 0 ${24 + 40 * g}px rgba(61,123,255,${0.55 + 0.4 * g}), inset 0 2px 0 rgba(255,255,255,0.45)`}} />
      ) : null}
      {ghost ? [-1, 1].map((d) => (
        <span key={d} style={{position: 'absolute', left: `${CAP.padEm}em`, top: 0, color: 'transparent', WebkitTextStroke: `3px rgba(156,203,255,${0.5 - 0.15 * ghost})`,
          translate: `0px ${d * ghost * size * 0.86}px`, opacity: ghost, whiteSpace: 'nowrap'}}>{w.w}</span>
      )) : null}
      <span style={{position: 'relative', padding: accent ? `0 ${CAP.padEm}em` : 0, color: accent ? (g > 0.5 ? C.cobalt : C.white) : C.white, textShadow: accent ? '0 2px 10px rgba(0,10,50,0.35)' : shadow, whiteSpace: 'nowrap'}}>{w.w}</span>
    </span>
  );
};

export const Captions: React.FC<{captions: Caption[]; tl: TL}> = ({captions, tl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let bump = 0;
  for (const h of tl.hits) { const d = t - h.t; if (d >= 0 && d < 0.3) bump += h.k * Math.sin((Math.PI / 2) * Math.min(d / 0.05, 1)) * Math.exp(-d / 0.09); }
  const live = captions.filter((c, i) => {
    if (c.role === 'hook') return false;
    const nx = captions[i + 1];
    const tight = nx && nx.out_start - c.out_end < 0.05;
    const outEnd = tight ? nx.words[0].t - F : c.out_end + 5 * F;
    return t >= c.words[0].t - 2 * F && t < outEnd;
  });
  return (
    <div style={{position: 'absolute', inset: 0, scale: String(1 + 0.07 * Math.min(bump, 1.2)), translate: `0px ${-16 * Math.min(bump, 1.2)}px`, transformOrigin: '50% 1260px'}}>
      {live.map((cap) => {
        const idx = captions.indexOf(cap); const nx = captions[idx + 1];
        const tight = nx && nx.out_start - cap.out_end < 0.05;
        const xs = tight ? prog(t, nx.words[0].t - 3 * F, 2 * F, (x) => x) : prog(t, cap.out_end, 5 * F, (x) => x);
        const L = capLayout(cap, tl.inMg(cap.words[0].t));
        const lh = L.size * CAP.lh;
        const lines = Array.from({length: L.lines}, (_, li) => L.boxes.filter((b) => b.line === li));
        return (
          <div key={idx} style={{position: 'absolute', inset: 0, opacity: 1 - xs, scale: String(1 - 0.1 * xs), translate: `0px ${-14 * xs}px`,
            filter: xs > 0.05 ? `blur(${xs * 7}px)` : undefined, transformOrigin: `50% ${L.top + lh}px`}}>
            {lines.map((bs, li) => (
              <div key={li} style={{position: 'absolute', left: 0, right: 0, translate: `${CAP_CX - 540}px 0px`, top: L.top + li * lh, height: lh, display: 'flex', justifyContent: 'center', alignItems: 'center',
                columnGap: CAP.gapEm * L.size, fontFamily: FONT, fontWeight: 800, fontSize: L.size, letterSpacing: -0.02 * L.size, lineHeight: 1}}>
                {bs.map((b) => <Word key={b.i} cap={cap} i={b.i} t={t} size={L.size} accent={b.accent} hero={L.hero} />)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
