# Subsystem: video-setup.sh

As of `ixtiyoruc-eng/Cloud@999f61c` (2026-11-15), `video-setup.sh` (16 lines) installs Python libraries (opencv, moviepy, librosa, scenedetect, …), downloads Google Fonts into `~/.fonts` from jsDelivr, and creates a Remotion 4 project in `~/motion`.

As of the same commit, `videos/*.mp4` are stored with Git LFS (`.gitattributes`).

Open questions (2026-11-15): is the script used as the cloud environment's setup script, and does it run cleanly? An audit was started on 2026-11-15.

Related: [goal](goal.md).
