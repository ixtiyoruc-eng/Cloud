import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from './types';
import {C, EASE_TEXT, EASE_OUT, FONT, prog} from './theme';

const EXIT = 0.12;
const norm = (s: string) => s.replace(/[.,?!:—]/g, '').trim().toLowerCase();

export const Captions: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cap = captions.find((c) => t >= c.out_start - 0.001 && t < c.out_end + EXIT);
  if (!cap) return null;
  const out = prog(t, cap.out_end, EXIT, EASE_OUT);
  return (
    <div
      style={{
        position: 'absolute', left: 70, right: 70, top: 1250, display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        columnGap: 18, rowGap: 6, fontFamily: FONT, fontWeight: 600, fontSize: 68, lineHeight: 1.12, letterSpacing: -0.6,
        opacity: 1 - out, filter: `blur(${out * 6}px)`,
      }}
    >
      {cap.words.map((w, i) => {
        const p = prog(t, w.t, 0.18, EASE_TEXT);
        const acc = cap.accent && norm(w.w) === norm(cap.accent);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', color: acc ? C.accent : C.white, opacity: p, filter: `blur(${(1 - p) * 8}px)`,
              scale: String(interpolate(p, [0, 1], [0.96, 1])),
              textShadow: acc
                ? '0 0 22px rgba(95,160,255,0.55), 0 2px 14px rgba(0,8,32,0.6)'
                : '0 2px 14px rgba(0,8,32,0.62), 0 0 2px rgba(0,8,32,0.4)',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
