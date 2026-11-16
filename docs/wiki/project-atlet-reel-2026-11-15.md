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

## Result v2 (2026-11-16)

- On 2026-11-16 the v2 render finished: `edit/v2/final_1080x1920.mp4`, 80.6 s, 25 segments, 24 cuts, 94 caption chunks, 41 SFX, −15.0 LUFS, true peak −1.7 dBFS. Remotion render took 12 min on CPU.
- The render subagent hit the model's usage limit while writing `changes.md`; the render itself had completed. The chief of staff checked it (16-frame contact sheet, loudness, captions) and finished the hand-off.
- Checked on 2026-11-16: captions follow the user's script with ş ç ö ğ; "kunlik 5 gram" appears once; both MG slots, glass UI, dumbbell and grade are visible in the frames.
- On 2026-11-16 artifact version 2 was published with the 540x960 preview and the v2 timeline; the 1080x1920 file was sent to the user.
- Lesson (2026-11-16): long renders in subagents can be cut off by usage limits. Keep each step's output on disk (plates, mix, render log) so the next session or model can resume.

## Revision 3 (2026-11-16)

- On 2026-11-16 the user said v2's animations and text effects were weak and the dumbbell "just sits there" and wasn't needed. They chose: remove the dumbbell; captions in reference-B style (word-by-word punchy pop, accent pill, text reacts on cuts/drops) in the blue palette; graphics more dynamic, B-style (zoom-through, whip, flash, punches). Plate, cuts and mix are reused.
- Lesson (2026-11-16): the brief asked for slow Apple-style fades, but the user's taste follows reference B. When the brief and the user's favourite reference disagree on motion, show a short test clip before the full render.
- On 2026-11-16, later, the user clarified: the dumbbell should work like reference A's small lime "flower/star" — a guide character on screen from first frame to last, flying on curved paths with a trail, leading every transition, landing in the typography and opening cards. Effects from both A and B; transitions varied and locked to the music. This supersedes "remove the dumbbell".
