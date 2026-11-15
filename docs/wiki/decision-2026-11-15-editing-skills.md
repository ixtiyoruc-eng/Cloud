# Decision: video-editing skills (2026-11-15)

Source: [skills search 2026-11-15](../research/skills-search-2026-11-15.md). Installed in `ixtiyoruc-eng/Cloud@2d4c6ca`.

- On 2026-11-15 the user asked for montage skills found with `find-skills`. Installed: `remotion-best-practices` (remotion-dev, official), `sound-effects` (103 CC0 SFX + beat-sync and loudness method), `taste-distillation` (reference → LUT + cut rhythm), `ffmpeg-analyse-video`.
- Caveats found 2026-11-15: `sound-effects`' script drops the voice track, so on talking-head reels use only its library and method. `taste-distillation`'s fal.ai step needs a key; don't use it. Remotion's built-in transcription needs a GPU; use whisper.cpp.
- Rejected 2026-11-15: HeyGen hyperframes (telemetry, paid sign-in), video-use (ElevenLabs key), and copies of video-generation skills under unknown owners with suspicious install counts.
- SFX sources as of 2026-11-15: bundled CC0 library; Mixkit downloads worked (commercial use OK, not CC0 — never commit its files); Freesound, Kenney and Pixabay returned 403.

Related: [goal](goal.md), [skills setup](decision-2026-11-15-skills-setup.md).
