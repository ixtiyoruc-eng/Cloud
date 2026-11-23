import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {Reel, TOTAL} from './Reel';
import {Cover} from './Cover';
const Root: React.FC = () => (
  <>
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
