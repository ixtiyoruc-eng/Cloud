# Skills search for video montage (2026-11-15)

Commit `2d4c6ca` on `claude/magical-darwin-72prnm` (pushed). Installed with `npx -y skills add <repo> -s <skill> -a claude-code --copy -y` into `.claude/skills/`. Each installed folder was byte-identical to the clone I vetted (`diff -rq`). The `skills-lock.json` the CLI created was deleted, because the earlier skills don't use one.

Searched: video editing, ffmpeg, remotion, motion graphics, subtitles, captions, transcription, whisper, reels, shorts, color grading, thumbnail, video analysis, sound effects, sfx, audio editing, whoosh, foley, sound design, beat detection, music sync, audio ducking. Also checked anthropics/skills, which has nothing for video.

## Installed (4)

| Skill | Source | Why | Tools needed |
|---|---|---|---|
| remotion-best-practices | remotion-dev/skills@7e541aa (official, ~830K installs) | The official Remotion guide, with sub-guides for captions, render, studio, markup (including the @remotion/sfx list) and multimedia. Its version, 4.0.543, matches the pinned Remotion. | None new. Its captions transcription uses @remotion/whisper-webgpu, which needs a GPU. Keep using whisper.cpp (uzbek-transcribe) and the skill's "import SRT" path. The maps sub-guide mentions a MapTiler key, but only for maps. |
| sound-effects | Barty-Bart/motion-graphics@3d83d98 (3.4K installs, solo author) | 103 bundled CC0 SFX (Kenney and Freesound previews, each with a source URL in LICENSES.md and manifest.json): whoosh, pop, click, riser, impact, tick, ding, glitch, transition, typing, ambience. It also gives a cue-type→SFX map, a beat grid checked against the kick drum, and a -16 LUFS / true-peak < -4 dBFS check measured on the exported MP4. Scripts read in full: the only network call is curl for Mixkit runtime URLs listed in the manifest. | librosa, soundfile, scipy, matplotlib, numpy and ffmpeg: all already present. **Caveat:** `sound_pass.py` maps only `0:v` plus the SFX/music mix, so it **drops the original voice track**. It also requires `--music`. For talking-head reels, use the library and method, not the script as it is, or add the voice track to the mix (voice > SFX > music). Not run here. |
| taste-distillation | affaan-m/ecc@d2ef268 (everything-claude-code, large reputable repo) | Measures reference videos into a style pack: the colour grade as a .cube LUT (chroma by luminance zone), cut cadence (shot-length distribution, cuts/min), stills and overlay plates. This fits the coming reference videos. `mint.py` is offline. I read mint.py in full and every subprocess call (ffmpeg/ffprobe, plus blender for 3D props only). | numpy, opencv-headless, scenedetect: present (scenedetect 0.7.3). `distill.py` (VLM spec) uses fal.ai and needs FAL_KEY plus an explicit `TASTE_FORGE_ALLOW_LIVE=1`. It is optional, so don't use it. Not smoke-tested: running mint.py on a synthetic clip was denied by the permission classifier. |
| ffmpeg-analyse-video | fabriqaai/ffmpeg-analyse-video-skill@8d2e377 (1.8K installs, no scripts) | Analyses a reference video with little context: ffprobe, frame/scene extraction, subagents describe frame batches, then a timestamped timeline. This complements taste-distillation (layout, text and motion beats rather than grade). | ffmpeg only. |

Vetting depth: SKILL.md files were read in full. For taste-distillation, I read mint.py and every exec/network call site; I did not read all ~4.5K lines line by line.

## Rejected

- heygen-com/hyperframes (reverse-any-video, style-sampling, media-use, talking-head-recut, embedded-captions, motion-graphics; 0.4–1.5M installs): it uses a different framework (HyperFrames, not Remotion). Each skill starts with a telemetry "usage beacon" (`npx hyperframes events`, linked to the account), and reverse/style-sampling are paid Pro features that need sign-in. It also re-shoots people with HeyGen.
- remotion-dev/remotion@add-sfx: this is for maintainers adding SFX to the @remotion/sfx package, not for users.
- browser-use/video-use: a good talking-head cut workflow, but transcription needs ELEVENLABS_API_KEY (paid, credentials). Its 12 "hard rules" (30 ms audio fades at cuts, subtitles last, per-segment extract plus `-c copy` concat, snap cuts to word boundaries) are worth borrowing by hand.
- affaan-m/ecc@video-editing, taste, taste-application: a generic pipeline built on ElevenLabs, fal.ai and Descript/CapCut. taste is an opinionated angelcore/hyperpop music-video aesthetic. taste-application centres on fal.ai generation and is large (~90 files).
- Barty-Bart/motion-graphics@motion-broll: one fixed "one morphing shape + cursor" style, with its own Playwright engine that duplicates Remotion.
- varnan-tech/opendirectory@openverse-sfx: the same Vox sound-pass method as sound-effects, and it allows CC-BY (attribution needed). Openverse is listed under SFX sources instead.
- elevenlabs/skills@sound-effects, sonilo-ai/* (video-to-sfx, audio-ducking, video-analysis), calesthio/*: paid generation APIs or keys.
- `*/superpowers@ai-video-generation` and `*/superpowers@seedance`: near-identical copies across many unknown owners (101-skills, magentosh, skills-shell, qu-skills, bankai-skills, …) with implausible install counts (0.6–1M). Untrusted.
- digitalsamba ffmpeg (14.9K), josiahsiegel ffmpeg-* (100–600 installs), kajisho5, sundial-org ffmpeg-video-editor: generic ffmpeg cheat sheets that add little over the model's own knowledge.
- vercel-labs/json-render@remotion*, google-labs-code stitch@remotion, haidrrrry/liamrjohnston remotion-motion-graphics: these duplicate the official Remotion skill.
- Thumbnail skills (higgsfield, muapi, social-media-skills): generative-API or YouTube-landscape oriented. The existing personal style skills already make covers.
- Whisper skills (openclaw openai-whisper*, faster-whisper, etc.): duplicate the existing uzbek-transcribe (whisper.cpp), or use the OpenAI API.

## SFX sources

| Source | URL | License | Direct curl from this container |
|---|---|---|---|
| Remotion SFX (@remotion/sfx) | `https://remotion.media/<name>.wav` (list in remotion-best-practices/remotion-markup/sfx.md; attribution at `remotion.dev/docs/sfx/<name>`) | Generic ones are CC0 (e.g. whoosh: "Woosh by 1bob", freesound 831936). **Meme sounds (vine-boom, spongebob-fail, windows-xp-error, minecraft-hurt…) are NOT CC0.** Remotion's docs say "not explicitly released under a free license". Avoid those for commercial use. | Yes: whoosh.wav 200, 13.6 KB, 16-bit mono WAV |
| Bundled sound-effects library | `.claude/skills/sound-effects/sfx/` | CC0 1.0 (Kenney and Freesound, listed per file) | Already in the repo, no fetch needed |
| Openverse API (Freesound CC0 index) | `https://api.openverse.org/v1/audio/?q=whoosh&license=cc0&source=freesound` | Filter `license=cc0`. No key needed, about 200 anonymous searches a day. | API: yes, 200 with JSON results. The audio files themselves live on cdn.freesound.org (next row). |
| Freesound CC0 HQ previews | `https://cdn.freesound.org/previews/...-hq.mp3` | CC0 per sound (check each sound's page) | **No: 403** from the origin to plain curl. Retrying with a browser User-Agent was denied by the permission classifier, so it was not pursued. |
| Kenney audio packs | `https://kenney.nl/assets/category:Audio` | CC0 | **No: 403** to plain curl (page) |
| Mixkit SFX | `https://assets.mixkit.co/active_storage/sfx/<id>/<id>-preview.mp3` | Mixkit Free License: commercial and social use allowed with no attribution, but NOT CC0 and no redistribution, so never commit the files | Yes: 200, 505 KB MP3 (#1392) |
| Pixabay sound effects | `https://pixabay.com/sound-effects/` | Pixabay Content License (no attribution, no standalone redistribution) | **No: 403** |
| BigSoundBank | `https://bigsoundbank.com/` | Free-of-rights / CC0-like (see its licenses page) | Site 200; a file download was not tested |

No audio was committed. The test files are in the scratchpad (`sfxtest/`).

## Permission denials (not worked around)

1. curl to Freesound/Kenney with a browser User-Agent.
2. Running taste-distillation `mint.py` on a synthetic test clip.
