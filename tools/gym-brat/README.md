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
3. `plate.py W/gb/edl.json DRIVE MODELS/face_landmarker.task W/gb --no-grade` - face-following 9:16 plate, colours as shot
   (v2: the user asked for no colour work), light skin smoothing, plus `face.json` (face box per frame). Needs `mediapipe` and `libegl1`.
4. `mix.py W/gb/edl.json W/gb/audio MUSIC.mp3 SFX_DIR W/gb/mix/mix.wav` - speech-first mix (v2): music ducks under speech and
   partly loses its 300 Hz-5 kHz band there, voice gets presence; prints voice-over-music level (v3: about 12 dB; v2's 22 dB
   hid the music). -14 LUFS. To swap only the audio: `ffmpeg -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k`.
5. `remotion/`: copy (not symlink) `edl.json`, `plate.mp4`, `face.json`, `mix.wav`, `InterTight.ttf` into `public/`, then
   `npx remotion render src/index.ts GymBrat out.mp4 --codec h264 --crf 16 --audio-codec aac --audio-bitrate 256k`.
   `node stills.mjs OUT t1 t2 ...` renders check stills from one bundle.
6. `check_face.py out.mp4 W/gb/plate.mp4 W/gb/face.json W/gb/edl.json` - proves no graphic lands on the face (render vs plate
   inside the face box; frames where the plate itself moves are skipped). No colour pass after the render (v2).
7. `cover.py FRAME.png cover.jpg` - cover with text in the centre 4:5 area, below the chin.

Rules from the user (2026-11-21): no colour grading; Instagram safe zone (top 260, bottom 480, right column x > 940 in the
lower half, see `remotion/src/layout.ts` `SAFE`); no animation over the face (`remotion/src/face.ts`: the guide is pushed out
of the face every frame, chips and hook words fly round the head, effects are masked off the face, the summary keeps the face
in a round window).
