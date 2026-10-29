#!/bin/bash
# Video montaj muhiti: Python kutubxonalari, shriftlar, Remotion (motion grafika)
pip install --break-system-packages -q opencv-python-headless numpy "pillow>=12.2" moviepy \
  "scenedetect[opencv]" librosa soundfile scikit-image colour-science matplotlib

mkdir -p ~/.fonts
for f in montserrat/Montserrat%5Bwght%5D.ttf bebasneue/BebasNeue-Regular.ttf anton/Anton-Regular.ttf \
  poppins/Poppins-SemiBold.ttf poppins/Poppins-Bold.ttf poppins/Poppins-ExtraBold.ttf poppins/Poppins-Black.ttf \
  oswald/Oswald%5Bwght%5D.ttf playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf; do
  curl -sSfL -m 30 -o ~/.fonts/"$(basename "$f" | sed 's/%5B/[/;s/%5D/]/')" \
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/$f" || true
done
fc-cache -f >/dev/null

mkdir -p ~/motion && cd ~/motion && npm init -y >/dev/null && \
  npm i -s remotion@4 @remotion/cli@4 @remotion/renderer@4 react@18 react-dom@18
