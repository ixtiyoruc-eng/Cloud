# User preference: Instagram safe zones

On 2026-11-16 the user said "know the safe zones" after text on the v4 reel and cover sat under Instagram's interface. Rules adopted that day for 1080x1920:

- Reel video: text and UI stay out of the top 220 px, the bottom 450 px and the right 120 px of the lower half. As of `tools/atlet-reel/remotion/src/layout.ts` (`SAFE`) on 2026-11-16; captions start at y=1120, MG titles at y=300.
- Cover: all text inside the centre 4:5 area (y 285–1635), which also fits the 3:4 profile-grid crop (y 240–1680).
- Check every render with guide lines drawn on a contact sheet before sending.

Related: [Atlet reel](project-atlet-reel-2026-11-15.md), [alphabet](preference-uzbek-alphabet.md).
