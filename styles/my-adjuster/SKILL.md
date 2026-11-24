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

**Approved caption format (user: "captionsni 1 1 qil", "siliq qil"):** ONE word on screen at a time, every spoken word captioned 1:1 in literary Uzbek (`words.ts`: `[start, word, highlight?]`, `PAUSES` hide text in long pauses). Normal words white Inter Display Black ~118 px, key words gold Archivo Black ~150 px with glow; centred at y≈1300–1520. Word swaps instantly with a soft 0.16 s fade/scale 0.94→1 — no blur, no overshoot. **No top progress line**, no handle/labels/tags. Punch-ins gentle (×1.04). Icons ease in without bounce.

## Pipeline
1. Drive folder: list with `https://drive.google.com/embeddedfolderview?id=<ID>` (grep `file/d/` + titles), download each with `scripts/gdrive_dl.sh <id> <out>`.
2. `bash scripts/setup.sh` (Remotion + fonts into `~/motion/adj`). Remotion can't download its browser here: always pass `--browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (check the folder name) and `--public-dir=$HOME/motion/adj/public`.
3. Proxy: `scale=1080:1920,eq=contrast=1.06:saturation=1.08:gamma=0.98,unsharp=5:5:0.4` → `public/talk.mp4` (crf 14); audio `highpass 80, afftdn -25, +2 dB @3 kHz, compressor, loudnorm -15 LUFS` → `public/talk.wav`; `public/last.jpg` = a frame ~1 s before the source fade-out.
4. Transcribe with the `uzbek-transcribe` skill: `-l uz -ml 1 -sow -mc 0 -bs 2 -bo 2 -osrt` in ~42 s chunks, add offsets. Khorezm dialect: whisper sometimes skips the tail — re-run the missing range separately (`-bs 5 -bo 5`, prompt with expected words).
5. Write `cues.ts`: `BLOCKS` (word times from SRT), `TAGS`, `ICONS` (crash/money/doc/check/shield/car/warn/arrow/clock/phone at x≈190 or 880, y≈1080), `PUNCH`, `LOWER`, `VEND`, `END = VEND + 3.6`. Rewrite dialect into literary Uzbek Latin (o', g', sh, ch); flag unclear words to the user.
6. Preview ~15 stills at `--scale=0.33`, tile, check; then render `--codec=h264 --crf=16 --concurrency=4 --audio-codec=aac --audio-bitrate=256k`.
7. Deliver: SendUserFile + commit MP4/cover to `videos/` (Git LFS) + GitHub raw link.
