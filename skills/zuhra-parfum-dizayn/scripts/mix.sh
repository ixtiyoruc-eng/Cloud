#!/bin/bash
# usage: mix.sh DIR NAME DUR   (needs NAME_cut.mov, NAME_music.wav, NAME_sfx.wav, NAME_gfx.mp4 in DIR)
# Voice is kept NATURAL: no denoise / EQ / compressor (the user rejected the processed sound).
cd "$1"; V=$2; D=$3
ffmpeg -v error -y -i ${V}_cut.mov -vn -af "pan=mono|c0=c0,highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=11:linear=true,pan=stereo|c0=c0|c1=c0" -ar 48000 ${V}_voice.wav
ffmpeg -v error -y -i ${V}_voice.wav -i ${V}_music.wav -i ${V}_sfx.wav -filter_complex "[1]aresample=48000,volume=0.26[m];[2]aresample=48000[s];[0]asplit[v][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=350[md];[v][md][s]amix=inputs=3:normalize=0:weights=1 1 0.8,atrim=0:$D,alimiter=limit=0.95" -ar 48000 ${V}_mixm.wav
ffmpeg -v error -y -i ${V}_voice.wav -i ${V}_sfx.wav -filter_complex "[1]aresample=48000[s];[0][s]amix=inputs=2:normalize=0:weights=1 0.7,atrim=0:$D,alimiter=limit=0.95" -ar 48000 ${V}_mixn.wav
for s in musiqa_bilan:m musiqasiz:n; do n=${s%:*}; k=${s#*:}
  ffmpeg -v error -y -i ${V}_gfx.mp4 -i ${V}_mix${k}.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -maxrate 6M -bufsize 12M -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest ${V}_${n}.mp4
done
