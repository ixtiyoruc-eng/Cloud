import React, {useLayoutEffect} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {DumbbellCue} from './types';
import {EASE_IN, EASE_OUT, prog} from './theme';

const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    (scene as unknown as {environmentIntensity: number}).environmentIntensity = 1.0;
    return () => { tex.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
};

const steel = {color: '#cfd9ea', metalness: 1, roughness: 0.2};
const plate = {color: '#4a5b7c', metalness: 0.9, roughness: 0.28};
const Side: React.FC<{s: 1 | -1}> = ({s}) => (
  <group>
    <mesh position={[s * 0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.15, 0.08, 48]} /><meshStandardMaterial {...steel} /></mesh>
    {[[0.56, 0.1], [0.5, 0.09], [0.43, 0.08]].map(([r, w], i) => (
      <mesh key={i} position={[s * (0.7 + i * 0.1 + w / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, w, 64]} /><meshStandardMaterial {...plate} />
      </mesh>
    ))}
    <mesh position={[s * 1.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.11, 0.11, 0.08, 40]} /><meshStandardMaterial {...steel} /></mesh>
  </group>
);

const PLACE = [
  {left: 10, top: 70, size: 440},   // hook: pills sit top-right
  {left: 724, top: 20, size: 360},   // beside 01 badge
  {left: 724, top: 20, size: 360},   // 02
  {left: 724, top: 20, size: 360},   // 03
  {left: 260, top: 40, size: 560},   // CTA: behind the centred pills
];

export const Dumbbell: React.FC<{cue: DumbbellCue; index: number; last: boolean}> = ({cue, index, last}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lt = frame / fps; const T = cue.out_end - cue.t; const abs = cue.t + lt;
  const pin = prog(lt, 0, 0.8, EASE_IN);
  const pout = last ? prog(lt, T - 1.4, 1.4, EASE_OUT) : prog(lt, T - 0.35, 0.35, EASE_OUT);
  const pl = PLACE[Math.min(index, PLACE.length - 1)];
  const push = last ? 1 + 0.08 * (lt / T) : 1;
  const z = -3 * (1 - pin);
  return (
    <div style={{position: 'absolute', left: pl.left, top: pl.top, width: pl.size, height: pl.size, opacity: pin * (1 - pout),
      filter: `blur(${(1 - pin) * 6 + pout * 6}px) drop-shadow(0 0 28px rgba(80,140,255,0.45))`}}>
      <ThreeCanvas width={pl.size} height={pl.size} camera={{position: [0, 0, 4.2], fov: 32}} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}>
        <Env />
        <ambientLight intensity={0.25} color="#9db8ff" />
        <directionalLight position={[2.5, 3.5, 4]} intensity={1.5} color="#eef4ff" />
        <directionalLight position={[-3.5, 1.5, -4]} intensity={4.2} color="#4d8dff" />
        <directionalLight position={[3.5, -1.0, -3]} intensity={2.2} color="#7fb0ff" />
        <pointLight position={[0, -2, 2.5]} intensity={6} color="#2f63ff" distance={8} />
        <group position={[0, Math.sin((abs * 2 * Math.PI) / 2.7) * 0.05, z]} scale={(0.75 + 0.25 * pin) * push}
          rotation={[0.42, (abs * 12 * Math.PI) / 180 + index * 0.9, -0.32]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.075, 0.075, 1.2, 40]} /><meshStandardMaterial {...steel} roughness={0.35} /></mesh>
          <Side s={1} /><Side s={-1} />
        </group>
      </ThreeCanvas>
    </div>
  );
};
