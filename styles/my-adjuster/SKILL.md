---
name: "my-adjuster"
description: "Use when the user says \"My Adjuster\" / \"my ajaster stilida qil\" / \"yevroprotokol videosi\", or sends another video of Davlat Abdullayev (@yevroprotokol_xorazm, Yevroprotokol / sug'urta, navy uniform): add kinetic captions in the reference style (small white words + one huge glowing gold keyword), brand chrome, icons, punch-ins, end card with phone, and a cover in the My Adjuster navy-gold look."
---

# My Adjuster — yevroprotokol reel stili

Brand: **MY ADJUSTER · Yevroprotokol Xorazm**, Davlat Abdullayev, Instagram `@yevroprotokol_xorazm`, phone `+998 91 858-28-28`.
Talk to the user in Uzbek (Latin), short.

## Look (approved reference: "Captions referens text shunday bo'lsin.mp4")
Reference grammar: a short line of **small bold white words** above/below **one huge keyword** that pops in (scale 0.55→1 with overshoot, un-blur), glowing; word-by-word timed to speech; block leaves by blurring out; red hand-drawn **strike-through** on a negated word; small **outline icons** that pop, draw and float (paper-plane in the reference).

Brand palette (from the Instagram grid + navy uniform) — fixed:
- navy `#0A1430`, navy2 `#101F45`, navyDeep `#050A1A`
- gold `#F6C445` (keywords, glow, icons), goldHi `#FFDD7A`, goldDeep `#C9962A`
- white `#FFFFFF`, mist `#D9DEEA`, red `#E5484D` (strike only)

Fonts (in `fonts/`, register with names prefixed `MA…` — never a family called "Serif"/"Mono", CSS treats them as generic):
- **Archivo Black** — big keyword (168 px, auto-fit to 980 px), headlines
- **Inter Display Black** — small caption words (62 px)
- **Instrument Serif Italic** — gold accent lines (128 px), like "so'm undiramiz" on the posts
- **Space Mono Bold** — labels: "— MUTAXASSIS JAVOBI", "MY ADJUSTER", handle

Line kinds in `cues.ts`: `small` (white), `big` (gold glow), `white` (huge white), `serif` (gold italic). Mix 1 big or serif per block; captions centred at y≈1240 (lower third, above IG UI).

Chrome: gold progress bar on top. **No handle pill / "MY ADJUSTER" label at the top and no section tags ("MUTAXASSIS JAVOBI" etc.) — the user asked to remove them ("bu joylarini olib tashla").** Keep: lower-third name card when Davlat first speaks; navy gradients top/bottom; smooth punch-ins (×1.05–1.10) on key numbers/words; end card 3.5 s: gold shield, "— TEKIN KONSULTATSIYA", "Qo'ng'iroq" + serif "qiling", pulsing gold phone pill, handle · 24/7.

Cover: 4K frame (prefer him holding the yevroprotokol form), navy gradient bottom, mono "— YTH BO'LDIMI?", Archivo white line + gold serif line (question hook), Inter subline. Keep text inside centre 1080×1350.

**No blur filters on text ("Textlar o'chib yonyapti, filter berma"):** words appear with scale/opacity only, no blur-in/out; each caption block stays until the next one starts (gaps < 1.2 s are bridged) and swaps instantly — no fade-out between blocks. No blur on icons, name card, end card.

**Approved caption format (user: "animatsiyani referensdagidek 1 ga 1 qil"):** copy the reference exactly. Blocks from `words.ts` `GROUPS` (one per short phrase, every spoken word, exactly ONE big word marked `1`). Layout: words before the big word = small white line top-LEFT; first word after it = top-RIGHT (same line, space-between); the rest = small line bottom-RIGHT. Big word: Archivo Black, gold `#F6C445`, capitalised, up to 190 px (fit 940 px), glow via text-shadow; small: Inter Display Black 52–70 px, overlapping the big word slightly. Animation: small words fade in individually (0.12 s) on their spoken time; big word drops in from scale 1.2→1 with fade (0.16 s); block disappears by HARD CUT when the next block starts (no fade-out, no blur — blur made text "o'chib yonyapti"). Reference animations too ("animatsiyalarini ham ol"): a gold outline icon (paper plane / money / check / phone …, chosen by the big word in `BIG_ICON`) flies in from bottom-left with rotation and stroke-draw, sitting just left of the bottom small line; a short whole-frame blur whip (±0.17 s, scale 1.04) on speaker/scene changes (`WHIP`). Red strike draws across a negated big word (e.g. "chala"). No top progress line, no handle/labels/tags. Gentle punch-ins ×1.04, icons ease in.

## Pipeline
1. Drive folder: list with `https://drive.google.com/embeddedfolderview?id=<ID>` (grep `file/d/` + titles), download each with `scripts/gdrive_dl.sh <id> <out>`.
2. `bash scripts/setup.sh` (Remotion + fonts into `~/motion/adj`). Remotion can't download its browser here: always pass `--browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (check the folder name) and `--public-dir=$HOME/motion/adj/public`.
3. Proxy: `scale=1080:1920,eq=contrast=1.06:saturation=1.08:gamma=0.98,unsharp=5:5:0.4` → `public/talk.mp4` (crf 14); audio `highpass 80, afftdn -25, +2 dB @3 kHz, compressor, loudnorm -15 LUFS` → `public/talk.wav`; `public/last.jpg` = a frame ~1 s before the source fade-out.
4. Transcribe with the `uzbek-transcribe` skill: `-l uz -ml 1 -sow -mc 0 -bs 2 -bo 2 -osrt` in ~42 s chunks, add offsets. Khorezm dialect: whisper sometimes skips the tail — re-run the missing range separately (`-bs 5 -bo 5`, prompt with expected words).
5. Write `cues.ts`: `BLOCKS` (word times from SRT), `TAGS`, `ICONS` (crash/money/doc/check/shield/car/warn/arrow/clock/phone at x≈190 or 880, y≈1080), `PUNCH`, `LOWER`, `VEND`, `END = VEND + 3.6`. Rewrite dialect into literary Uzbek Latin (o', g', sh, ch); flag unclear words to the user.
6. Preview ~15 stills at `--scale=0.33`, tile, check; then render `--codec=h264 --crf=16 --concurrency=4 --audio-codec=aac --audio-bitrate=256k`.
7. Deliver: SendUserFile + commit MP4/cover to `videos/` (Git LFS) + GitHub raw link.
