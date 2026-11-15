# Subsystem: video-setup.sh

As of `ixtiyoruc-eng/Cloud@999f61c` (2026-11-15), `video-setup.sh` (16 lines) installs Python libraries (opencv, moviepy, librosa, scenedetect, …), downloads Google Fonts into `~/.fonts` from jsDelivr, and creates a Remotion 4 project in `~/motion`.

As of the same commit, `videos/*.mp4` are stored with Git LFS (`.gitattributes`).

Open questions (2026-11-15): is the script used as the cloud environment's setup script, and does it run cleanly? An audit was started on 2026-11-15.

Related: [goal](goal.md).

## Audit findings (2026-11-15)

Source: [audit 2026-11-15](../research/audit-2026-11-15.md), run against `ixtiyoruc-eng/Cloud@3545d5c`. Supersedes the open questions above.

- On 2026-11-15 the script exited 0 in 36 s but its pip step installed nothing. `pillow>=12.2` conflicts with moviepy 2.2.1, which needs `pillow<12`. With no `set -e` and `|| true` on curl, the failure was silent.
- On 2026-11-15 no cloud environment used the script as its setup script. All dependencies were unpinned.
- On 2026-11-15, after setup: ffmpeg 6.1, the 9 fonts and a trivial Remotion render worked. Missing: whisper.cpp and its model, mediapipe and libEGL, and the style fonts the skills use (Outfit, Inter Tight, Instrument Serif, Inter Display). Bebas Neue and Poppins lack U+02BB (ʻ) for Uzbek oʻ/gʻ.
- On 2026-11-15 Remotion downloaded a 102 MB browser per project. Using `/opt/pw-browsers` rendered in 5 s instead of 17.5 s.

Related: [LFS and outputs](problem-lfs-and-outputs.md), [improvement backlog](backlog.md).
