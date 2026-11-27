# Atlet.uz "4 ta sport ozuqa" reel (Gym brat style)

Third Atlet.uz reel (2026-11-27): one take, `IMG_1020.MOV` (1080x1920, 23 s), Q&A: L-karnitin? / protein? / geyner? / BCAA? + CTA.
Built from `../gym-brat/` on branch `claude/upbeat-hopper-2ful91` (same look, same rules: no colour grade, nothing over the face,
safe zone top 260 / bottom 480 / right column, on-screen letters ş ç ö ğ). Changes from Gym brat:
- OZIŞ vs SAMIRIŞ tracker -> left pill "OZUQA n/4", right pill = current product; each product name flies into it.
- Summary MG: one column "Qaysi biri nima uçun?" with four rows.
- No hook words (the take opens on "L-karnitin?"); music drop 1 lands on the first word.
- CTA pills sit under the chin (the head is high in this take).
- `plate.py` rewritten for a 9:16 source (digital zoom wide 1.04 / med 1.14 / close 1.26 that follows the face).
- `mix.py` uses the repo SFX pack (`.claude/skills/sound-effects/sfx`, on the Gym brat branch) instead of the ElevenLabs pack.

Run (W = scratch dir): `build_edl.py W/edl.json`; `plate.py W/edl.json IMG_1020.MOV face_landmarker.task W`
(needs mediapipe + libegl1 libgles2); `mix.py W/edl.json DIR_WITH_voice_48k.wav MUSIC.mp3 SFX_DIR W/mix.wav`;
copy edl.json, plate.mp4, face.json, mix.wav, InterTight.ttf into `remotion/public/`, `npm install` in `remotion/`, then
`npx remotion render src/index.ts GymBrat out.mp4 --codec h264 --crf 16 --audio-codec aac --audio-bitrate 256k`
(add `--browser-executable` for the pre-installed headless shell); `check_face.py`; `cover.py FRAME.png cover.jpg`.
Music: "Na Reliquia Dos Favela - DJ Biel Divulga.mp3" from the user's "Gym brat" Drive folder (not in the repo).
