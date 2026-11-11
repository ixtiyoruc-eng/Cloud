---
name: "zuhra-parfum-dizayn"
description: "Use when the user says \"Zuhra Parfum dizaynda qil\" / \"Zuhra parfum dizayni\" / \"Zuhra uslubida\": edit a talking-head cosmetics reel (open-gate 4:3 phone footage) in the saved Zuhra Parfum bordo-gold liquid-glass motion style, with depth titles behind the person, light makeup, cover and Instagram caption."
---

# Zuhra Parfum (cosmetics reel style)

The user's saved style, built and approved on the Zuhra Parfum reels "Tonalnik nega yuzda yaxshi turmaydi?" and "Qalin yoki suyuq?" (shop: Zuhra Parfum, Urganch). When the user says "Zuhra Parfum dizaynda qil", reproduce this look and process. Talk to the user in Uzbek (Latin), short and clear.

## Working rules (the user's own)
1. First understand the video: transcribe (Uzbek), find the structure (hook, points, CTA), cut silences and slips.
2. BEFORE rendering: show the animations as an Artifact (HTML preview with stills / animated mockups). Render only after the user approves.
3. Animations must NEVER cover the face. Face zone is roughly y 24–48% of the frame: put glass cards at ≥53% height or in the top 5% band.
4. Titles use the Depth effect: big serif word BEHIND the person (person cutout layered on top).
5. Strong stabilization.
6. Makeup: VERY light — final approved level is **10%** (see Look). Do not make the face look edited.
7. Do NOT hide or blur shop signs in the background (e.g. "SAGNA") unless the user asks.
8. Voice must sound natural, exactly like the original — no denoise/EQ/compressor (the user rejected it as "ovoz boshqacha").
9. Delivery: Instagram size **1080×1920**, ~40–70 MB (4K files did not download for the user). Always give two versions: `_musiqa_bilan` and `_musiqasiz`.
10. Finish with a cover (muqova) JPG for each video and a ready-to-copy Instagram caption (izoh) in a code block + .txt file.
11. Long renders: run in background with a long timeout, report progress; send files as soon as each one is ready.

## Brand kit
- Colours: bordo #4A0E1C, dark #2B0610, gold #C9A45C, light gold #E6CF97, cream #F6EBDD, vino #8C3A4B.
- Gradients: GOLD `135deg #F3E2B3 → #C9A45C → #9E7A36`; BORDO radial `#8C3A4B → #4A0E1C → #2B0610`.
- Fonts: Playfair Display (900 for titles, italic for emphasis words in vino or gold) + Montserrat (700–800, UPPERCASE labels, letter-spacing .12–.5em). Files in `assets/`.
- Logo: `assets/logo_avatar.svg` (round), `assets/logo_wordmark_transparent.svg`. Small round "Z" badge (bordo, gold border) top-right.
- Brand line: "ZUHRA PARFUM · URGANCH".

## Elements (see `templates/Tonal.tsx`)
- **Liquid glass cards** (Apple-like): white gradient rgba(255,255,255,.80/.56/.64), `backdrop-filter: blur(32px) saturate(180%) brightness(1.08)`, white inner highlight, soft bordo drop shadow, radius ~4.6% width, a light sheen sweep on entry. Dark variant: bordo glass with light-gold border. IMPORTANT: animate opacity/transform/blur ON the glass element itself, never on a parent, or backdrop blur breaks.
- **Depth title**: small Montserrat label (bordo with cream glow, or cream) + huge Playfair 900 word in cream / gold gradient at top ~10–15%, the head overlaps it (e.g. "TONALNIK / NEGA?", "SUYUQ YOKI / QALIN?").
- **Chapter chip** top-left: glass pill with bordo number circle "01" + UPPERCASE text ("IKKI XIL TONALNIK", "KO'P UCHRAYDIGAN XATO", "MOS TON").
- Comparison pairs: SUYUQ (light glass, checks) vs QALIN (dark bordo glass, ✕), connected by a drawn gold line; colour swatches "Teringiz ≠ Oq tonalnik"; shade slider "Teringizga mos ton" with a "MOS" knob.
- Floating gold / bordo blobs drifting slowly behind cards.
- Words rise one by one with blur (Words component).
- Outro: big glass card with rotating gold ring around the logo, "ZUHRA / PARFUM · URGANCH", gold "OBUNA BO'LING" button tapped by a cursor → bordo "✓ OBUNA BO'LDINGIZ".

## Motion (After-Effects-like)
- Spring with small overshoot (damping 12, mass .75, stiffness 120); soft variant damping 20.
- Motion-blur in (blur 2.2% width → 0 over 12 frames, expo ease) and blur + scale-down out (9 frames).
- Camera: one transform for base video + depth layer + person layer; scale changes on every jump cut (1.0/1.08/1.02/1.1…), punch-in 0.12 on the first shot, slow drift; transform origin 50% 33%.
- Person layer mask fades out at 66–76% height so cards/products below are not cut.
- Subtle grade: contrast 1.05, saturate 1.06, brightness 1.02, sepia .05; bordo vignette.

## Look (scripts/beauty.py, scripts/process_video.py)
- Face: YuNet detect + LBF 68 landmarks with adaptive EMA smoothing.
- Retouch on the face crop only: guided filter (eps .0015), 70% detail back, skin mask ×0.6, lift .04, under-eye .08, lip tint BGR [.42,.36,.62] at .28, soft glow .10.
- Final approved strength = **10%** of that. Practical way: process at STRENGTH=0.65, then blend `orig + (ret − orig) × 0.154`, or run directly with STRENGTH=0.10.
- Person matte: RVM mobilenetv3 ONNX (downsample 0.125 for 4K, 0.25 for 1080) → VP9 alpha webm for the depth layer.

## Sound
- Voice: natural (scripts/mix.sh): only high-pass 60 Hz + linear loudnorm −14 LUFS, mono → stereo, 48 kHz.
- Music: synthesized soft pop/house bed (~104 BPM, Am7–Fmaj7–Cmaj7–G7), breakdowns at chapter changes, whooshes on chapters, pops on cards, click on the subscribe button (scripts/music2.py + a JSON of times, example in templates/). Music volume .26, sidechain-ducked.

## Export
- Instagram: 1080×1920, 30 fps, H.264 High, CRF 20, maxrate 6M, AAC 256k 48 kHz, +faststart.
- Names: `Zuhra_<mavzu>_musiqa_bilan.mp4`, `Zuhra_<mavzu>_musiqasiz.mp4`, `Zuhra_<mavzu>_muqova.jpg`, `Zuhra_<mavzu>_izoh.txt`.

## Cover (templates/Covers.tsx)
- Best frame: eyes open, looking at camera, mouth nearly closed, holding the product if possible.
- Same depth title behind the head (top ~14.5%, gold gradient, dark drop shadow), light-glass card at ~59–60% with: bordo pill ("SABABI VA YECHIMI") or small label, Playfair title with one italic vino word, optional SUYUQ vs QALIN pills, gold-line "ZUHRA PARFUM" brand line; "Z" badge top-right. Keep text inside the 4:5 grid crop (y 15–85%).

## Caption (izoh)
- Hook question + 🤍, 1–2 lines of problem, 👇, 2–3 bullet lines (✨ / 💧 / 🫧) that match exactly what is said in the video, CTA (saqlab qo'ying 📌, izohda yozing, do'konimizga keling), "📍 Zuhra Parfum · Urganch", hashtags: #makiyaj #kosmetika #gozallik #makiyajmaslahat #zuhraparfum #urganch #xorazm #uzbekistan (+ topic tag). No invented phone numbers, prices or addresses.

## Pipeline notes
- Transcribe: whisper.cpp large-v3 q8, `-l uz`, word timestamps.
- Stabilize: ffmpeg vidstab two-pass (shakiness high, smoothing=45, optzoom=1), crop 4:3 open-gate to 9:16.
- Cut silences with a keep-list (scripts/cut.py); jump cuts hidden by camera scale changes.
- Remotion 4 project: put media in `public/` as HARD links (symlinks give 404). OffthreadVideo `transparent` for the person webm. Render: `npx remotion render src/index.ts ReelX out.mp4 --concurrency=3 --muted` (use the preinstalled headless shell via `--browser-executable`).
- Process 1080 assets for renders (4K sources inside Remotion caused 500 errors and timeouts).
