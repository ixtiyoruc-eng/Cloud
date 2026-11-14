---
name: "sohiba-opa"
description: "Use when the user says \"Sohiba opa\" / \"Sohiba opa dizaynda qil\" / \"kosmetolog opa videosi\", or sends another talking-head video of the cosmetologist Sohiba opa (woman with glasses talking in a car): cut it into a tight advice reel, colour-correct it to the approved look, retouch lightly, add smooth kinetic-type motion graphics in colours taken from the footage, and make a cover. Saved from the approved \"Qalb go'zal bo'lishi kerak\" reel."
---

# Sohiba opa — kosmetolog maslahat reel

The user's saved style, built and approved on the reel "Qalb go'zal bo'lishi kerak" (cosmetologist Sohiba opa, filmed in her car, 4K HEVC iPhone, Khorezm dialect). When the user sends another of her videos, reproduce this process and look. Always talk to the user in Uzbek (Latin), short and plain.

## The user's rules (learned on the first reel)
1. **It is advice, not an interview.** Label it "Maslahat" / "Kosmetolog maslahati", never "Intervyu".
2. **Cut hard ("cutham qilish kerak").** Remove off-camera questions from the person filming (e.g. "Nima bilan? Aytingchi?"), repeats, false starts, "e-e", long pauses, side stories. Keep: hook → problem → her story → turn → moral. Target 40–50 s from ~2 min. Nothing extra may stay in the speech ("gapda ortiqcha narsa bo'lmasin").
3. **Colours come from her footage**, not from the reference. First reel: wine knit #8E2A45 / deep #1B0A10, black leather, gold earring #F1C97B / #C9963F, cream #FBF5EF, blush #F4D6CE, rose #E9B7AE, ink #2B0D16. If she wears different colours next time, re-derive the palette the same way (outfit main colour = dark theme, jewellery/accent = highlight, cream = light theme).
4. **Rangni to'g'irlash (colour correction) — always.** Every new video is automatically matched to the approved reel's colour: white balance (no blue/green cast), exposure, contrast and saturation, separately for shadows, mids and highlights. `scripts/colormatch.py` builds one 3-channel LUT per kept segment from 8 sampled frames and maps them onto `references/color_target.json` (fingerprint of the approved video), strength 0.95, slope-clamped (0.3–3.2), so a correct video is left almost unchanged and there is no flicker. It runs inside `build_talk.py` and `cover_frame.py` before retouch; the retouch grade then adds the house warmth. Always show the user a before/after frame (`colormatch.py test SRC.mov <sec> out.jpg` → raw | retouch | colour+retouch).
5. **Light retouch with makeup** — smooth skin, de-shine, a little blush and lip colour, slightly warmer and brighter grade. Natural face: **no face slimming by default.** (A client once asked to slim her double chin and soften the car; the user rejected that version — "Bo'ldi, kerak emas". `--slim` exists only if the user asks again.)
6. **Animations must be smooth** — ease-out curves, blur-in/blur-out, no hard pops.
7. **Deliver high quality via GitHub**: commit the MP4 + cover to `videos/` (Git LFS) on the session branch and give the raw link `https://github.com/<owner>/<repo>/raw/<branch>/videos/<file>`. The user asks for this link for full quality ("Github linkni ber kachestvinisini"). Also send the file with SendUserFile.
8. **Always make a cover ("obloshka")** from the approved (un-slimmed) version.
9. Captions in literary Uzbek Latin (o', g', sh, ch), matching the meaning exactly. Flag dialect words you could not make out instead of guessing.
10. Keep the user posted in one short Uzbek line while long renders run.

## Look of the reel (what "zo'r" meant here)
Reference was a "finqube" SaaS promo: animated mesh-gradient backgrounds, word-by-word kinetic type with highlighted keywords inside a box with vertical bars, glowing neon squiggle strokes, floating UI cards. Same grammar, her colours:
- **Backgrounds:** two themes that crossfade — light (cream with drifting rose/wine/gold blobs) and dark (deep wine with drifting wine/burgundy blobs + vignette). Switch theme on story beats.
- **Video layer** morphs between layouts: `full` (full-bleed, bottom gradient for captions), `card` (rounded 70 px card with thin gold border, floating, big shadow), `cardS` (smaller card), `hidden` (video gone → full-screen typography beat). Morph over ~0.75 s, ease-in-out. Slow 3.5 % push-in per segment; punch-in ×1.10–1.12 on emotional segments.
- **Kinetic words:** each word rises 0.55 em + un-blurs over 0.42 s, timed to its spoken word; keyword gets a highlight box that wipes in from the left with bars at both ends (gold on dark, wine on light). Blocks leave by fading, rising 46 px and blurring.
- **Captions** on `full` shots at y≈1300 (84 px, white, soft shadow); **big type beats** on `hidden` (104–128 px, weight 700) for the hook/turn/moral lines.
- **Glow squiggles:** a short neon dash travelling along a curve (gold on dark, wine on light), 0.9 s, 2–3 per type beat.
- **Chips** (pill + glowing gold dot) for listed things (e.g. "Uy ishlari / Tashvishlar / Charchoq", "Ro'mol / Ko'ylak / Ishton"); **chat bubbles** with a cup icon for quoted offers ("Kofe ichasizmi?"); **stat card** with an animated ring + count-up ("3 yildan beri mening mijozim"); **heart** stroke-draw + gentle beat under the final moral; end on cream with the moral, then a soft fade.
- Font: **Outfit** (weights 500–800). Tag pill "Maslahat" in the first 2 s.

## Pipeline
WORK=~/sohiba (models + intermediates). Scripts are in this skill's `scripts/`, the Remotion composition in `remotion/src/`.

1. **Setup** (once per session): `bash <skill>/scripts/setup.sh`. Also build whisper.cpp + the large-v3 q8 model exactly as in the `uzbek-transcribe` skill.
2. **Get the video.** Google Drive links: the first `uc?export=download&id=…` returns a virus-scan page; read `id/confirm/uuid` from its form and fetch `https://drive.usercontent.google.com/download?id=…&export=download&confirm=t&uuid=…` with the cookie jar. Source is 3840×2160 HEVC with −90° rotation (ffmpeg auto-rotates to 2160×3840).
3. **Transcribe with word times:** `whisper-cli -l uz -ml 1 -sow -oj`. Whisper **gets stuck repeating** a phrase on her long takes after ~50 s: transcribe in ~50 s chunks with `-mc 0 -bs 2 -bo 2` and add the chunk offset.
4. **Choose cuts.** Compute a 20 ms RMS envelope and put cut points inside quiet gaps (≥0.12 s below ~20th percentile + 4 dB). **Verify:** concatenate the chosen segments with 1.2 s silences and re-transcribe — every segment must start and end on whole words. Write `cuts.json` = `[[start,end], …]` in source seconds.
5. **Render talking head:** `WORK=~/sohiba python3 <skill>/scripts/build_talk.py SRC.mov cuts.json ~/sohiba/out` (run in background, ~12 min for 47 s). Colour correction runs automatically per segment (prints the shift; `--no-color` to skip). Gives `talk.mp4` (colour-corrected + retouched, 1296×2304), `talk.wav` (cleaned voice: HP 85 Hz, denoise, EQ, compressor, −15 LUFS, +3 s pad), `talk16.wav`, `segs.json`, and `FACE = [...]` per segment.
   - If one segment still has a hesitation at its start, drop frames from `talk.mp4` with `select` and re-cut audio rather than re-rendering everything.
6. **Word timings on the edit:** run whisper on `talk16.wav` (`-ml 1 -sow -mc 0 -bs 2 -bo 2 -oj`). These are the `t` values for every word in `cues.ts`.
7. **Graphics (Remotion):** copy `talk.mp4`/`talk.wav` to `~/motion/reel/public/`. Edit `src/cues.ts`: `SEG` (each segment's start on the edit timeline + final end, from segs.json), `END` (= last + ~2 s), `FACE`, `ZOOM`, `layout`, `theme`, and the text blocks with per-word times. `Reel.tsx` keeps the reusable components (Bg, VideoLayer, Lines/Word, Chip, Bubble, Stat, Heart, Squig); rewrite only the scene list at the bottom of `Reel` for the new story. 30 fps, 1080×1920.
   - Preview first: `remotion still src/index.tsx Reel out/fN.jpg --frame=N --scale=0.33 --public-dir=$HOME/motion/reel/public` for ~15 frames; tile them and check layout/overlaps before the full render.
   - **Always pass `--public-dir`** (otherwise fonts/videos 404).
   - Final: `remotion render src/index.tsx Reel out/reel.mp4 --public-dir=… --codec=h264 --crf=16 --pixel-format=yuv420p --concurrency=4 --audio-codec=aac --audio-bitrate=256k` (~5 min).
8. **Cover:** pick a frame with a soft smile, eyes visible, mouth nearly closed (tile numbered face crops to choose). `python3 <skill>/scripts/cover_frame.py SRC.mov <sec> ~/motion/reel/public/cover.jpg` (full 4K, colour-corrected + retouched). Edit `src/Cover.tsx` text (tag "KOSMETOLOG MASLAHATI", 150 px two-line title with the key word in a gold highlight box, 50 px subline), render `remotion still … Cover out/cover.png`, export JPG. Keep face + title inside the centre 1080×1350 so the profile grid crop works.
9. **Check** a tiled overview of the final (fps 1/2.6) and loudness (`volumedetect`, mean ≈ −19 dB, max ≤ −1.5 dB) before sending.
10. **Deliver:** SendUserFile + commit to `videos/` + push + raw GitHub link. Short Uzbek summary: length, what was cut, look, open questions (music? brand name? unclear words?).

## Pitfalls already hit
- Colour: LAB mean/skin-tone matching was too weak (left the blue cast); per-channel quantile LUT matching is what works. If she films in a very different place (not the car), lower strength to ~0.5 or rebuild the target from an approved video of that place: `colormatch.py target APPROVED.mov references/color_target.json`.
- mediapipe 1.x has no `mp.solutions`; use the Tasks API (`FaceLandmarker`, `ImageSegmenter`). Needs `libEGL.so.1` → `apt-get update && apt-get install -y libegl1`.
- Its `__del__` prints a harmless `TypeError: 'NoneType' object is not callable` at exit — ignore it.
- Don't pass two inputs to one `ffprobe` call; don't chain `sleep` to wait — run long jobs with `run_in_background` and wait with an `until` loop that does not match its own command line.
- Retouch strength: bilateral ×2, 55 % pore texture back, 62 % mix; lip saturation +15 % (at +22 % lips looked painted).
