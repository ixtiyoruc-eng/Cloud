import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';
import {Edl} from './types';
import {Captions} from './Captions';
import {MotionGraphic} from './MotionGraphic';
import {UiLayer} from './UiCards';
import {Dumbbell} from './Dumbbell';

export type ReelProps = {edl: Edl};

const useFont = () => {
  const [handle] = useState(() => delayRender('font'));
  useEffect(() => {
    const f = new FontFace('Inter Tight', `url(${staticFile('InterTight.ttf')})`, {weight: '100 900'});
    f.load().then((ff) => {
      document.fonts.add(ff);
      continueRender(handle);
    });
  }, [handle]);
};

export const Reel: React.FC<ReelProps> = ({edl}) => {
  useFont();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#050C1F'}}>
      <OffthreadVideo src={staticFile('plate.mp4')} muted />
      {edl.dumbbell.map((d, i) => (
        <Sequence key={i} from={Math.round(d.t * fps)} durationInFrames={Math.round((d.out_end - d.t) * fps)} name={`Dumbbell ${i + 1}`}>
          <Dumbbell cue={d} index={i} last={i === edl.dumbbell.length - 1} />
        </Sequence>
      ))}
      <UiLayer cards={edl.ui_cards} />
      {edl.mg_slots.map((m) => (
        <Sequence key={m.id} from={Math.round(m.out_start * fps)} durationInFrames={Math.round((m.out_end - m.out_start) * fps)} name={m.id}>
          <MotionGraphic slot={m} captions={edl.captions} />
        </Sequence>
      ))}
      <Captions captions={edl.captions} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
