#!/bin/bash
# My Adjuster stili: Remotion loyihasi ~/motion/adj (shriftlar bilan). Chromium: /opt/pw-browsers.
set -e
SK="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p ~/motion && cd ~/motion
[ -d node_modules/@remotion/cli ] || { npm init -y >/dev/null; npm i -s remotion@4 @remotion/cli@4 @remotion/renderer@4 react@18 react-dom@18 >/dev/null; }
mkdir -p ~/motion/adj/public ~/motion/adj/src
cp "$SK"/remotion/src/* ~/motion/adj/src/
cp "$SK"/fonts/* ~/motion/adj/public/
echo "ok: ~/motion/adj"
