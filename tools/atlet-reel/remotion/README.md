# Atlet reel v3 (Remotion)

Composition `AtletReel` (1080x1920, 30 fps) = pre-graded footage plate + cut transitions + UI cards + full-screen MG scenes + captions + dumbbell guide + pre-mixed audio.

`public/` (not committed) must hold: `edl.json` (v3: v2 without the static `dumbbell` cues, plus v3 SFX), `plate.mp4` (`../plate.py --no-blur`), `mix.wav` (`../mix_v2.py ... --edl public/edl.json`), `InterTight.ttf`.
`node_modules` is a symlink to `~/motion/node_modules` (set up by `video-setup.sh`).

    npx remotion render src/index.ts AtletReel out/final.mp4 --codec h264 --crf 16 --audio-codec aac --audio-bitrate 256k

Source map:
- `timeline.ts` - beat grid, cut transition plan (whip / punch / streak / blob), flashes, caption hits, and the guide path (keys from cards, accents, cuts and MG scenes, conflict-resolved, gaps filled with drift hops on beats). Pure function of edl.json.
- `Guide.tsx` - the 2.5D glowing dumbbell (squash/stretch, beat bounce, comet trail, end-on plate ring for the zoom-through).
- `mgPlan.ts` + `MotionGraphic.tsx` - MG1/MG2 as reference-A scenes (tilted 3D panels, light flip with giant word + outline copies, ring framing a card); entries/exits = zoom-through the guide's plate hole, whip, wipe-up.
- `Captions.tsx` - reference-B word pop, accent pill, hero words with outline copies; `layout.ts` - caption and card geometry shared with the guide.
- `UiCards.tsx` - cards open from where the guide lands; section badges are giant words written by the guide.
- `Fx.tsx` - plate transforms (whip motion blur, punch-in, portal push), blob wipes, light streaks, flashes.
