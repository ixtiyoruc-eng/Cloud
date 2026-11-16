# Atlet reel v2 (Remotion)

Composition `AtletReel` (1080x1920, 30 fps) = pre-graded footage plate + captions + full-screen MG + glass UI + 3D dumbbell + pre-mixed audio.

`public/` (not committed) must hold: `edl.json` (v2), `plate.mp4` (from `../plate.py`), `mix.wav` (from `../mix_v2.py`), `InterTight.ttf`.
`node_modules` is a symlink to `~/motion/node_modules` (set up by `video-setup.sh`, plus `@remotion/three three @react-three/fiber`).

    npx remotion render src/index.ts AtletReel out/final.mp4 --codec h264 --crf 16 --audio-codec aac --audio-bitrate 256k
