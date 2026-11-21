# Gym brat reel ("Ozişda vs samirişda")

Second Atlet.uz reel (2026-11-21): which supplement for cutting (oziş) vs bulking (samiriş). Same look as the Atlet reel
(`../atlet-reel/`): blue grade, face retouch, reference-B word-pop captions, dumbbell guide, blob/whip/punch/streak cuts.
New: OZIŞ vs SAMIRIŞ tracker (hook words fly up into two counter pills; every verdict chip is carried into its pill),
info chips beside the head, full-screen summary table over the CTA.

Footage, music and SFX are not in the repo (user's Google Drive folder "Gym brat"; SFX generated with ElevenLabs).

Run in order (W = scratch dir):

1. whisper.cpp on each clip (`uzbek-transcribe` skill) -> `W/asr/<clip>.wav` (16 kHz mono). Captions follow the user's
   script plus what the speaker says; takes are picked by hand in `build_edl.py` (`SEGS`).
2. `build_edl.py W/asr W/gb/edl.json` - segments, captions with per-word onsets, items/verdicts/info chips, cuts, SFX,
   music offset (drop 1 lands on "Geyner").
3. `plate.py W/gb/edl.json DRIVE MODELS/face_landmarker.task W/gb` - graded, face-following 9:16 plate with face retouch.
   Needs `mediapipe` and `libegl1`.
4. `../atlet-reel/mix_v2.py W/gb MUSIC.mp3 SFX_DIR W/gb/mix/mix.wav --edl W/gb/edl.json` (voice from `W/gb/audio/<clip>_48k.wav`).
5. `remotion/`: copy (not symlink) `edl.json`, `plate.mp4`, `mix.wav`, `InterTight.ttf` into `public/`, then
   `npx remotion render src/index.ts GymBrat out.mp4 --codec h264 --crf 16 --audio-codec aac --audio-bitrate 256k`.
   `node stills.mjs OUT t1 t2 ...` renders check stills from one bundle.
6. Final colour pass (same as Atlet v4/v5): `ffmpeg -i out.mp4 -vf "eq=contrast=1.07:saturation=1.14:gamma=1.03,colorbalance=rm=0.03:gm=0.01:bm=-0.03" -c:a copy`.
7. `cover.py FRAME.png cover.jpg` - cover with text in the centre 4:5 area.
