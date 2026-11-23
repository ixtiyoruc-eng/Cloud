#!/bin/bash
# One-time setup per cloud session (~5 min). WORK defaults to ~/sohiba.
set -e
WORK=${WORK:-$HOME/sohiba}; mkdir -p "$WORK/models"
apt-get update -q >/dev/null 2>&1 || true
apt-get install -y -q libegl1 libgles2 libgl1 >/dev/null 2>&1 || true      # mediapipe needs libEGL.so.1
pip install --break-system-packages -q opencv-python-headless numpy mediapipe
cd "$WORK/models"
[ -s face_landmarker.task ] || curl -sSfL -o face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
[ -s selfie_multiclass.tflite ] || curl -sSfL -o selfie_multiclass.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
mkdir -p ~/.fonts
[ -s ~/.fonts/Outfit.ttf ] || curl -sSfL -o ~/.fonts/Outfit.ttf "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/outfit/Outfit%5Bwght%5D.ttf"
fc-cache -f >/dev/null 2>&1 || true
# Remotion project
SK="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p ~/motion && cd ~/motion
[ -d node_modules/@remotion/cli ] || { npm init -y >/dev/null; npm i -s remotion@4 @remotion/cli@4 @remotion/renderer@4 react@18 react-dom@18 >/dev/null; }
mkdir -p ~/motion/reel/public ~/motion/reel/src
cp --update=none "$SK"/remotion/src/* ~/motion/reel/src/ 2>/dev/null || true
cp ~/.fonts/Outfit.ttf ~/motion/reel/public/Outfit.ttf
echo "setup ok: WORK=$WORK, remotion project ~/motion/reel"
