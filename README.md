# Cloud

Workspace for editing short talking-head reels (cuts, retouch, motion graphics, covers) with Claude Code. The editing styles live in personal skills; this repo holds the environment setup, the docs, and the delivered videos.

## Setup

```bash
bash video-setup.sh
```

Installs pinned Python media libraries (OpenCV headless, librosa, scenedetect, scikit-image, ...), the style fonts into `~/.fonts`, and Remotion 4 into `~/motion` (configured to use the preinstalled headless Chrome under `/opt/pw-browsers`). Safe to re-run; it ends with a self-check and exits non-zero if anything is missing. For a Remotion project outside `~/motion`, pass `--browser-executable=<path from ~/motion/remotion.config.ts>`.

For Uzbek oʻ/gʻ (U+02BB) use Montserrat, Inter Tight or Inter Display; Bebas Neue and Poppins lack that glyph.

## Layout

- `video-setup.sh`: environment setup and self-check.
- `videos/`: delivered reels and covers (MP4 via Git LFS; run `git lfs pull -I videos/<file>` to get the real file).
- `docs/wiki/`: goal, decisions, backlog (`docs/wiki/index.md` is the entry point).
- `docs/research/`: dated audits.
- `docs/agents/`: issue tracker and domain-doc conventions for agents.
