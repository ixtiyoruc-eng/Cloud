# Atlet reel tools

Analysis and rough-cut scripts written on 2026-11-15 for the Atlet supplements reel (see `docs/wiki/project-atlet-reel-2026-11-15.md`).
`edl.v1.json` is the first edit plan. Footage and music are not in the repo: they come from the user's Google Drive folder and are read from the session scratchpad.

## v2 (2026-11-16): caption fix, duplicate removed, hook tracking, full render

Run in order (EDIT = scratchpad `edit/`, DRIVE = the Drive folder, MODELS = whisper + MediaPipe models):

1. `asr_v2.py EDIT whisper-cli ggml-large-v3 OUT` - re-transcribes the kept ranges with the user's script as prompt (used only as a cross-check: prompted runs hallucinate on long chunks).
2. `words_v2.py` - caption words (speaker's dialect, Uzbek Latin) with source onsets; `new_alphabet()` applies sh->ş, ch->ç, o'->ö, g'->ğ.
3. `build_v2.py EDIT` - v2 timeline from `edl.json` (v1): restores two script lines, drops the duplicate "kunlik 5 gram", re-snaps music edits/MG/SFX/camera to the beat grid -> `EDIT/v2/edl.json`.
4. `plate.py EDIT DRIVE MODELS WORK` - graded 1080x1920 footage plate (face-tracked hook, camera moves, segmentation background blur).
5. `mix_v2.py EDIT MUSIC SFX OUT.wav` - voice + beat-locked music + SFX, mastered to -15 LUFS / -1.5 dBTP.
6. `remotion/` - composition over plate + mix (see its README).

## v3 (2026-11-16): guide character, reference-A/B motion, no background blur

- `plate.py ... --no-blur` - same plate as v2 without the segmentation background blur (grade, tracking, crops, camera moves unchanged).
- `mix_v2.py ... --edl EDIT/v3/pub/edl.json` - v2 mix plus SFX for the new whip / blob / streak / punch transitions.
- `remotion/` - rewritten motion layer (see its README): continuous dumbbell guide, B-style captions, A-style MG scenes.
