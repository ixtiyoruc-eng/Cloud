# Improvement backlog

Ranked on 2026-11-15 from [audit 2026-11-15](../research/audit-2026-11-15.md) (section 4). Status is dated per line.

1. Fix the pip step and make failures loud (S). 2026-11-15: done in `ixtiyoruc-eng/Cloud@a2a5e5b`.
2. Save setup as the cloud environment's setup script, idempotent (S). 2026-11-15: open; needs user approval.
3. Build whisper.cpp and download its model in setup (M). 2026-11-15: open.
4. Point Remotion at the installed browser (S). 2026-11-15: done in `@a2a5e5b`.
5. Move the Remotion project and Python helpers into the repo, with lockfiles (M). 2026-11-15: open.
6. Add mediapipe, libEGL and all style fonts (S). 2026-11-15: fonts done in `@a2a5e5b`; mediapipe and libEGL open.
7. `.gitignore`, broader `.gitattributes`, LFS checkout fix (S). 2026-11-15: `.gitignore` done in `@a2a5e5b`; `.gitattributes` and LFS open.
8. Decide where outputs go and how long they stay (S/M). 2026-11-15: open; user decision.
9. README and CLAUDE.md that orient an agent in one read (S). 2026-11-15: README and CLAUDE.md pointer done in `@a2a5e5b`.
10. Smoke test and minimal CI (M). 2026-11-15: open.
11. Consolidate the three graphics stacks; update stale skill guidance (L). 2026-11-15: open.

Related: [goal](goal.md), [video-setup.sh](subsystem-video-setup.md).
