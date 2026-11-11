import React from 'react';
import {Composition} from 'remotion';
import {Reel, Cover} from './Reel';
import {ReelA, ReelB} from './Tonal';
import {CoverA, CoverB} from './Covers';
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={1428} fps={30} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="ReelA" component={ReelA} durationInFrames={2697} fps={30} width={1080} height={1920} />
    <Composition id="ReelB" component={ReelB} durationInFrames={1755} fps={30} width={1080} height={1920} />
    <Composition id="CoverA" component={CoverA} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CoverB" component={CoverB} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
