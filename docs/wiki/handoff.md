# Handoff: starting a new session

Written 2026-11-21 when the user moved to a new chat because this one grew too long.

**Branch:** `claude/magical-darwin-72prnm` on `ixtiyoruc-eng/Cloud` (not merged into `master`). Check it out first.

**State as of 2026-11-21:** the Atlet reel is at v5 (see [project page](project-atlet-reel-2026-11-15.md)). Delivered files are in `videos/` via Git LFS: `Atlet_reel_v5.mp4`, `Atlet_reel_cover.jpg`, `Atlet_reel_izoh.txt` (and the older `Atlet_reel_v3.mp4`).

**What a new container does not have** (the old session's scratchpad is gone):
- Footage, brief and music: re-download the user's Google Drive folder with `pip install gdown` then `gdown --folder <link>`; the link is in the user's first message about the reel (ask the user if it is not in the new chat).
- The 11-sound ElevenLabs SFX pack and `mix.wav`: not in the repo. Regenerate with the ElevenLabs key saved on the "Gym" environment, or ask the user to re-send the final video and work from it.
- Whisper and MediaPipe models: re-download as `video-setup.sh` and `tools/atlet-reel/README.md` describe.
- LFS files arrive as pointers because the container skips LFS downloads; fetch them with `git lfs pull` or the raw GitHub links.

**Code:** `tools/atlet-reel/` (analysis, plate, face filter, mix) and `tools/atlet-reel/remotion/` (composition). Its `public/` symlink pointed into the old scratchpad; recreate it.

**Open with the user on 2026-11-21:** cover font choice (A Montserrat / B Unbounded / C Oswald, C used), whether captions should switch font, whether to delete v3 from `videos/`.

**Rules to keep:** [alphabet](preference-uzbek-alphabet.md), [safe zones](preference-safe-zones.md); motion style follows the user's references A and B (see [reference styles](../research/reference-styles-2026-11-15.md)); show a short test clip before a full render; prefer cheap inline work over subagents to save the user's usage limit.
