# Project: Atlet supplements reel (2026-11-15)

- On 2026-11-15 the user shared a Google Drive folder: 5 talking-head shots (4032x3024 .mov, stored rotated −90°), a 100 s phonk track, a reference video and a brief (`Claude_Video_Editing_Prompt.txt`: 9:16, aggressive jump cuts, full-screen motion graphics over phone-look moments, premium soft-glow blue, 3D dumbbell, glass UI, SFX locked to phonk drops). Footage and music are the user's private material and are not committed.
- On 2026-11-15 a subagent built the edit plan: 78.8 s, 25 segments, 24 cuts, 2 full-screen graphic slots, 107 caption chunks, 41 SFX; music 132 BPM with a 15.22 s offset so drop 1 lands on "Kreatin". Speech is Uzbek, Khorezm dialect; whisper auto-detect said Kazakh, so force `-l uz` on short chunks.
- On 2026-11-15 the user asked for original SFX instead of overused stock sounds and provided an ElevenLabs key (saved as a network secret on environment "Gym"). 40 generations made an 11-category pack modelled on reference B.
- On 2026-11-15 the plan and a 540x960 rough cut were published as a private artifact: https://claude.ai/artifact/9BYv1AZGYRq2KmsiPbaHjr
- Open as of 2026-11-15: caption wording check by the speaker, two music loops to check by ear, the full render (dumbbell, glass UI, grade, blur) not done.

Related: [reference styles](../research/reference-styles-2026-11-15.md), [editing skills](decision-2026-11-15-editing-skills.md), [goal](goal.md).

## Revision 2 (2026-11-15)

- On 2026-11-15 the user gave the ground-truth script (Khorezm dialect, Cyrillic) and asked: captions word for word from it (in Uzbek Latin, keeping the dialect wording — chief-of-staff choice, easy to change), remove the duplicate "kunlik 5 gram" near 1:05, smooth face tracking on the hook shot, then a full render with graphics.
- A render subagent was started on 2026-11-15. Expected outputs: scratchpad `edit/v2/` (edl.json, final_1080x1920.mp4, preview_540.mp4, changes.md); Remotion source in `tools/atlet-reel/remotion/`.
- Handoff note (2026-11-15): the user may switch the session model when the current model's limit runs out. Everything needed to continue is in this page, `tools/atlet-reel/`, and the session scratchpad (`edit/`, `sfx/pack/`, `drive/f/`, `art/atlet-reel.html` = the published artifact source). If the scratchpad is lost, re-download the Drive folder with `gdown --folder` (link in the user's message of 2026-11-15).
