import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile} from 'remotion';
import {Edl} from './types';
import {Captions} from './Captions';
import {Versus} from './Versus';
import {Summary} from './Summary';
import {Guide} from './Guide';
import {CutWipes, FaceSafe, Flashes, Plate} from './Fx';
import {FaceTrack, makeFace} from './face';
import {buildTimeline} from './timeline';

export type ReelProps = {edl: Edl; face: FaceTrack};

const useFont = () => {
  const [handle] = useState(() => delayRender('font'));
  useEffect(() => {
    const f = new FontFace('Inter Tight', `url(${staticFile('InterTight.ttf')})`, {weight: '100 900'});
    f.load().then((ff) => { document.fonts.add(ff); continueRender(handle); });
  }, [handle]);
};

// layer order: plate (cut fx) > ring bursts (face-safe) > OZIŞ/SAMIRIŞ layer > summary MG > captions > guide > flash (face-safe)
export const Reel: React.FC<ReelProps> = ({edl, face}) => {
  useFont();
  const tl = useMemo(() => buildTimeline(edl, makeFace(face, edl.output.fps)), [edl, face]);
  return (
    <AbsoluteFill style={{backgroundColor: '#050C1F'}}>
      <Plate tl={tl} />
      <FaceSafe tl={tl}><CutWipes tl={tl} /></FaceSafe>
      <Versus edl={edl} tl={tl} />
      <Summary tl={tl} />
      <Captions captions={edl.captions} tl={tl} />
      <Guide tl={tl} />
      <FaceSafe tl={tl}><Flashes tl={tl} /></FaceSafe>
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
