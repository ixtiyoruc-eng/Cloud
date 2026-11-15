# Problem: LFS checkout and committed outputs

Source: [audit 2026-11-15](../research/audit-2026-11-15.md).

- On 2026-11-15 `videos/*.mp4` in cloud containers were 134-byte LFS pointers, because the container's git config skipped LFS downloads. The real files were on GitHub (146 MB fetched in 8.5 s).
- On 2026-11-15 about 293 MB of finished output was committed per reel. The repo had no `.gitignore`, README or CI.
- On 2026-11-15 `CLAUDE.md` pointed to `GLOSSARY.md` and `docs/adr/`, which did not exist. Per `docs/agents/domain.md`, they are created lazily.

Related: [video-setup.sh](subsystem-video-setup.md), [backlog](backlog.md).
