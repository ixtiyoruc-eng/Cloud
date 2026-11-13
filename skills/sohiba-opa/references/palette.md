# Sohiba opa — doimiy ranglar (approved palette)

Always use exactly these colours. Do NOT re-derive from new footage. Values are the ones in `remotion/src/Reel.tsx` (const C) and `Cover.tsx`.

## Asosiy ranglar
| Nomi | HEX | Qayerda |
|---|---|---|
| cream (krem) | #FBF5EF | light theme base, end card, cover light |
| white (iliq oq) | #FFF7EE | text on dark |
| ink (siyoh) | #2B0D16 | text on light |
| wine (vino) | #8E2A45 | highlight on light, stat ring, heart, chips border tone |
| wineDeep (to'q vino) | #1B0A10 | dark theme base, cover bottom |
| gold (tilla) | #F1C97B | highlight on dark, glow strokes, chip dot |
| goldDeep (to'q tilla) | #C9963F | dot gradient, blobs, light squiggles |
| rose (pushti) | #E9B7AE | light blobs, highlight box on light |
| blush (och pushti) | #F4D6CE | light blobs |

## Fon blob ranglari (harakatlanuvchi gradient)
- Light theme: rose #E9B7AE (0.95), raspberry #B8475F (0.62), gold #F1C97B (0.50), blush #F4D6CE (0.90) on cream #FBF5EF.
- Dark theme: burgundy #6E1B33 (0.90), wine #8E2A45 (0.75), near-black wine #3A0E1C (0.90), goldDeep #C9963F (0.22) on #1B0A10 + vignette rgba(8,2,5,0.55).

## Element ranglari
- Highlight box on dark: linear-gradient(90deg, rgba(241,201,123,0.30), rgba(241,201,123,0.12)), bars #F1C97B, text #F1C97B with glow 0 0 26px rgba(241,201,123,0.55).
- Highlight box on light: linear-gradient(90deg, rgba(142,42,69,0.20), rgba(233,183,174,0.55)), bars + text #8E2A45.
- Light cards/chips/bubbles: linear-gradient(135deg, rgba(255,250,244,0.97), rgba(250,232,224,0.94)), border 2px rgba(255,255,255,0.9), shadow 0 22px 60px rgba(30,6,14,0.38).
- Dark chips/tag: linear-gradient(135deg, rgba(60,16,30,0.92), rgba(110,27,51,0.88)), border 2px rgba(241,201,123,0.55–0.65).
- Bubble icon tile: linear-gradient(135deg, #8E2A45, #B8475F).
- Video card border: 3px rgba(241,201,123,0.7); full-shot caption gradient: rgba(27,10,16,0.30) top → 0 at 16–52% → rgba(40,8,18,0.50) 78% → rgba(27,10,16,0.74) bottom.
- Glow squiggles: gold #F1C97B (drop-shadow 14px + 34px) on dark; wine #8E2A45 or goldDeep #C9963F (width 10) on light.
- Cover: bottom gradient → rgba(70,16,34,0.80) 62% → rgba(27,10,16,0.97) 80% → #1B0A10; wine glow rgba(142,42,69,0.75), gold glow rgba(201,150,63,0.28).

## Video rang ishlovi (grade, retouch.py)
Gamma 0.88 (lift), mild S-curve, warm: R ×1.035, B ×0.975, saturation ×1.10. Skin: +foundation warmth, blush rose (0.42,0.40,0.86 BGR) 8.5 %, lips saturation +15 %.
