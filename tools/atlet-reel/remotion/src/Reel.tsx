import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile} from 'remotion';
import {Edl} from './types';
import {Captions} from './Captions';
import {MotionGraphic} from './MotionGraphic';
import {UiLayer} from './UiCards';
import {Guide} from './Guide';
import {CutWipes, Flashes, Plate} from './Fx';
import {buildTimeline} from './timeline';

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

// layer order: plate (cut fx) > UI cards > blob wipes > full-screen MG > captions > guide > flash
export const Reel: React.FC<ReelProps> = ({edl}) => {
  useFont();
  const tl = useMemo(() => buildTimeline(edl), [edl]);
  return (
    <AbsoluteFill style={{backgroundColor: '#050C1F'}}>
      <Plate tl={tl} />
      <UiLayer cards={edl.ui_cards} tl={tl} />
      <CutWipes tl={tl} />
      {tl.mg.map((m) => <MotionGraphic key={m.slot.id} info={m} captions={edl.captions} tl={tl} />)}
      <Captions captions={edl.captions} tl={tl} />
      <Guide tl={tl} />
      <Flashes tl={tl} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
