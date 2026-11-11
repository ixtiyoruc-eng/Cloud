---
name: "zuhra-parfum-dizayn"
description: "Use when the user says \"Zuhra Parfum dizaynda qil\" / \"Zuhra parfum dizayni\" / \"Zuhra uslubida\": apply the saved Zuhra Parfum brand design (bordo-gold colours, Playfair + Montserrat type, liquid-glass motion graphics, captions and effects) to any reel, cover or visual."
---

# Zuhra Parfum — design system

The Zuhra Parfum brand look: colours, typography, animations, captions and effects. It is a DESIGN kit, not tied to any one video: use it for any reel, cover, story or post the user asks for "Zuhra Parfum dizaynda". Talk to the user in Uzbek (Latin).

Ready code: `components/zuhra-kit.tsx` (Remotion 4, 1080×1920, 30 fps — tokens + every component below), `components/KitDemo.tsx` (all elements on one screen), preview `assets/kit_preview.png`. Fonts and logos are in `assets/`.

## 1. Colours
| Token | Hex | Use |
|---|---|---|
| bordo | #4A0E1C | main text on light glass, dark glass, buttons |
| dark | #2B0610 | deepest shadow, vignette, text on gold |
| vino | #8C3A4B | italic accent words, secondary labels |
| gold | #C9A45C | borders, icons, check circles |
| light gold | #E6CF97 | text on bordo, active caption word |
| cream | #F6EBDD | text on video, light surfaces |

- GOLD gradient: `linear-gradient(135deg,#F3E2B3 0%,#C9A45C 45%,#9E7A36 100%)` — on text via background-clip, on buttons and blobs.
- BORDO gradient: `radial-gradient(120% 140% at 25% 15%,#8C3A4B 0%,#4A0E1C 50%,#2B0610 100%)` — number circles, logo badge, dark buttons.
- Big title gradient on video: `180deg #FFF6DE → #E6CF97 → #C9A45C → #9E7A36` + dark drop shadow.
- Video grade: contrast 1.05, saturate 1.06, brightness 1.02, sepia .05 + bordo vignette `rgba(43,6,16,.45)` at the edges.

## 2. Typography
- **Playfair Display** 900 — titles, big words, numbers. One emphasis word per title in *italic* (vino on light, gold gradient on dark/video).
- **Montserrat** 700–800 — labels, chips, buttons, captions. Labels UPPERCASE, letter-spacing .12–.5em.
- Sizes (u = 1% of width = 10.8 px): depth title 20–30u, card title 9–10u, card heading 4.4–5.2u, body 3–3.5u, labels 2.6–3.6u.
- Brand line: "ZUHRA" Playfair + "PARFUM" small Montserrat, thin gold lines on both sides.

## 3. Elements (all in zuhra-kit.tsx)
- **Glass** — liquid glass card (Apple style). Light: white gradient .80/.56/.64, `backdrop-filter: blur(32px) saturate(180%) brightness(1.08)`, white inner highlight, soft bordo shadow, radius 4.6u, light sheen sweep on entry. Dark: bordo glass .72/.58/.68 with light-gold border, cream text. Animate opacity/transform/blur ON the glass element itself (never on a parent) or the backdrop blur breaks.
- **Depth** — depth title BEHIND the person: small Montserrat label + huge Playfair word; the person cutout is layered on top so the head covers part of it. Place at top 10–15%.
- **Chip** — chapter pill top-left: light glass, bordo circle with gold border and number "01", UPPERCASE text.
- **LogoBadge** — round bordo "Z" badge top-right with gold border.
- **Item** — list row with gold ✓ circle or cream ✕ circle.
- **Swatch** — round colour sample with white ring + label.
- **Blob** — soft gold / bordo rounded shapes slowly drifting behind cards (depth and life).
- **Words** — text that rises word by word with blur.
- **Gold** — gold-gradient italic text span.
- **Outro** — big glass card: logo with rotating gold ring, "ZUHRA / PARFUM · URGANCH", gold "OBUNA BO'LING" button pressed by a cursor → bordo "✓ OBUNA BO'LDINGIZ".
- Comparison layout: light glass card (positive) next to dark bordo card (other option), linked by a thin drawn gold line.

## 4. Captions (subtitles) — `Captions` component
- Words come from speech timestamps; pages of 3–5 words, max 2 lines.
- Variant `glass` (default): dark bordo glass pill; variant `clean`: no box, cream text with a bordo shadow.
- Montserrat 800, 5.2u, cream. Not-yet-spoken words at 45% opacity; the spoken word turns light gold, lifts and scales 1.06.
- Keywords (`em: true`): Playfair italic 800, gold gradient, slightly bigger.
- Page enters with a soft spring (rise 3u + scale .94 → 1).
- Position: ~68–72% height — below the face, above products. Text must match the speech exactly, literary Uzbek Latin.

## 5. Animation (After Effects feel)
- Entry: spring with small overshoot (damping 12, mass .75, stiffness 120); soft version damping 20 / mass .9 / stiffness 110.
- Motion blur in: blur 2.2u → 0 in 12 frames (expo ease `0.16,1,0.3,1`), opacity up fast.
- Exit: last 9 frames — scale down 12%, blur 1.6u, fade out.
- Kinds: pop (scale .35 → 1), up, down, left, right (slide 8–14u).
- Stagger: 0.08–0.15 s between items / words.
- Depth title: slow spring (damping 22), letter-spacing closes from .28em to 0, very slow upward drift.
- Camera: one transform for footage + depth layer + person; new scale on every cut (1.0 / 1.08 / 1.02 / 1.1…), punch-in on the first shot, tiny continuous push-in.

## 6. Effects
- **Sheen** — diagonal white light sweep across glass on entry.
- **Sparkles** — small gold star glints floating up (cosmetics/perfume feel).
- **Flash** — warm light streak across the screen on chapter changes.
- **Vignette** — bordo edge darkening.
- Person cutout mask fades out around 66–76% height so cards over the table stay clean.
- Sound design that goes with it: soft pops on cards, whoosh on chapters, click on the subscribe button, light pop/house bed ducked under voice.

## 7. Layout rules
- Never cover the face (face zone ≈ y 24–48%). Cards at ≥53% height or in the top 5% band.
- Safe margins 5–8% left/right; for covers keep text inside the 4:5 grid crop (y 15–85%).
- One clear message per screen; generous padding (3.4–4.4u) inside glass.

## 8. Cover (muqova)
- Best frame (eyes open, looking at camera), same grade + vignette.
- Depth title behind the head (gold gradient + dark shadow) with small label above.
- Light glass card at ~59%: bordo pill label, Playfair title with one italic vino word, optional comparison pills (light vs bordo with gold "vs" circle), brand line. "Z" badge top-right.

## Usage
Copy `components/zuhra-kit.tsx` into the Remotion `src/`, fonts + logos into `public/` (hard links, not symlinks), `import {Glass, Depth, Captions, ...} from './zuhra-kit'`, put `<style>{fontCss}</style>` at the top of each composition. Show the animations to the user first (Artifact preview), render after approval.
