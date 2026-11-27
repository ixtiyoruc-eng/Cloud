import React from 'react';
import {Composition, staticFile, CalculateMetadataFunction} from 'remotion';
import {Reel, ReelProps} from './Reel';
import {Edl} from './types';

const calc: CalculateMetadataFunction<ReelProps> = async () => {
  const edl: Edl = await fetch(staticFile('edl.json')).then((r) => r.json());
  const face = await fetch(staticFile('face.json')).then((r) => r.json());
  const fps = edl.output.fps;
  return {durationInFrames: Math.round(edl.output.duration * fps), fps, width: 1080, height: 1920, props: {edl, face}};
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="GymBrat"
    component={Reel}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={2400}
    defaultProps={{edl: null, face: []} as unknown as ReelProps}
    calculateMetadata={calc}
  />
);
