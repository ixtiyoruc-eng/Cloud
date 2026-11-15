#!/usr/bin/env bash
# Video montaj muhiti: Python kutubxonalari, shriftlar, Remotion (motion grafika).
# Safe to re-run: finished steps are skipped. Ends with a self-check that exits non-zero on failure.
set -euo pipefail

log() { printf '\n== %s\n' "$*"; }
die() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
SUDO=""; [ "$(id -u)" -eq 0 ] || SUDO="sudo"

# ---- Python libraries (system Python, pinned) -------------------------------
# moviepy is dropped: its 2.x needs pillow<12 and no skill script imports it (ffmpeg covers it).
# scenedetect is installed --no-deps because it depends on opencv-python (GUI build), which
# would clash with opencv-python-headless over the same cv2 module.
log "pip"
export PIP_ROOT_USER_ACTION=ignore
PIP=(python3 -m pip install --break-system-packages -q --disable-pip-version-check)
"${PIP[@]}" \
  numpy==2.5.3 pillow==12.3.0 opencv-python-headless==5.0.0.93 \
  librosa==1.0.1 soundfile==0.14.0 scikit-image==0.26.0 colour-science==0.4.7 \
  matplotlib==3.11.2 click==8.5.1 platformdirs==4.14.5 tqdm==4.70.1
"${PIP[@]}" --no-deps scenedetect==0.7.3
if python3 -m pip show -q opencv-python >/dev/null 2>&1; then
  python3 -m pip uninstall --break-system-packages -y -q opencv-python
fi

# ---- Fonts ------------------------------------------------------------------
# google/fonts pinned to one commit so renders do not drift.
log "fonts"
GF_COMMIT=cc39c4c2c304bc368c9b7c311ea2bcc6013299fe
FONT_DIR="$HOME/.fonts"
mkdir -p "$FONT_DIR"
for f in \
  montserrat/Montserrat%5Bwght%5D.ttf bebasneue/BebasNeue-Regular.ttf anton/Anton-Regular.ttf \
  poppins/Poppins-SemiBold.ttf poppins/Poppins-Bold.ttf poppins/Poppins-ExtraBold.ttf poppins/Poppins-Black.ttf \
  oswald/Oswald%5Bwght%5D.ttf playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf \
  outfit/Outfit%5Bwght%5D.ttf intertight/InterTight%5Bwght%5D.ttf intertight/InterTight-Italic%5Bwght%5D.ttf \
  instrumentserif/InstrumentSerif-Regular.ttf instrumentserif/InstrumentSerif-Italic.ttf; do
  name="$(basename "$f" | sed 's/%5B/[/;s/%5D/]/')"
  [ -s "$FONT_DIR/$name" ] && continue
  curl -sSfL --retry 3 -m 60 -o "$FONT_DIR/$name.part" \
    "https://cdn.jsdelivr.net/gh/google/fonts@$GF_COMMIT/ofl/$f" || die "font download $f"
  mv "$FONT_DIR/$name.part" "$FONT_DIR/$name"
done
# Inter Display is not in google/fonts; Debian/Ubuntu ship it in fonts-inter.
if ! fc-list : family | grep -F 'Inter Display' >/dev/null; then
  $SUDO apt-get install -y -q fonts-inter || { $SUDO apt-get update -q && $SUDO apt-get install -y -q fonts-inter; }
fi
fc-cache -f >/dev/null

# ---- Remotion ---------------------------------------------------------------
log "remotion"
REMOTION_VERSION=4.0.543
MOTION_DIR="$HOME/motion"
mkdir -p "$MOTION_DIR"
cd "$MOTION_DIR"
[ -f package.json ] || npm init -y >/dev/null
installed="$(node -p "require('./node_modules/@remotion/cli/package.json').version" 2>/dev/null || true)"
if [ "$installed" != "$REMOTION_VERSION" ]; then
  npm install --save-exact --no-audit --no-fund \
    remotion@$REMOTION_VERSION @remotion/cli@$REMOTION_VERSION @remotion/renderer@$REMOTION_VERSION \
    react@18.3.1 react-dom@18.3.1
fi
# Use the preinstalled headless shell instead of a 100 MB download into every project's .remotion/.
BROWSER="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "$BROWSER" ] && [ -x "$BROWSER" ]; then
  cat > remotion.config.ts <<EOF
// Written by video-setup.sh. Other project dirs: pass --browser-executable=$BROWSER
import {Config} from '@remotion/cli/config';
Config.setBrowserExecutable('$BROWSER');
EOF
else
  echo "No preinstalled headless shell under /opt/pw-browsers; downloading once."
  npx --yes remotion browser ensure
fi

# ---- Self-check -------------------------------------------------------------
log "self-check"
fail=0
check() { if "$@" >/dev/null 2>&1; then echo "ok   $*"; else echo "FAIL $*"; fail=1; fi; }
check python3 -c "import cv2, numpy, PIL, scenedetect, librosa, soundfile, skimage, colour, matplotlib"
check bash -c "! python3 -m pip show -q opencv-python"
check ffmpeg -hide_banner -version
check ffprobe -hide_banner -version
for fam in Montserrat "Bebas Neue" Anton Poppins Oswald "Playfair Display" Outfit "Inter Tight" "Instrument Serif" "Inter Display"; do
  check bash -c "fc-list : family | grep -qF '$fam'"
done
# U+02BB (Uzbek oʻ/gʻ). Bebas Neue and Poppins lack it; use one of these for captions.
for fam in Montserrat "Inter Tight" "Inter Display"; do
  check bash -c "fc-list ':charset=2bb' family | grep -qF '$fam'"
done
check test -d "$MOTION_DIR/node_modules/@remotion/cli"
[ -z "$BROWSER" ] || check test -x "$BROWSER"
[ "$fail" -eq 0 ] || die "self-check"
echo "video-setup: all checks passed"
