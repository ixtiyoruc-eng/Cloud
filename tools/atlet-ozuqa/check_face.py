# Checks the user's rule "no animation over the face": compares the final render with the plate inside the tracked face box,
# frame by frame. Frames where the plate itself is moved (cut transitions, the summary MG) are skipped.
# usage: check_face.py RENDER.mp4 PLATE.mp4 face.json edl.json   -> prints flagged frames (mean |diff| inside the face > limit)
import sys, json, subprocess, numpy as np
R, P, FJ, EJ = sys.argv[1:5]
face = json.load(open(FJ)); edl = json.load(open(EJ)); W, H, FPS = 540, 960, 30
skip = []
for c in edl['cuts']: skip.append((c['at'] - 0.2, c['at'] + 0.45))
skip.append((edl['mg']['a'] - 0.2, edl['mg']['b'] + 0.35))
def frames(f):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H: break
        yield np.frombuffer(b, np.uint8).astype(np.float32)
bad = []; n = 0; worst = 0
for i, (a, b) in enumerate(zip(frames(R), frames(P))):
    t = i / FPS
    if any(s <= t < e for s, e in skip) or i >= len(face) or face[i] is None: continue
    x0, y0, x1, y1 = [v / 2 for v in face[i]]
    mx, my = (x1 - x0) * 0.08, (y1 - y0) * 0.08     # inner part of the box (the box includes hair)
    sl = (slice(int(max(0, y0 + my)), int(min(H, y1 - my))), slice(int(max(0, x0 + mx)), int(min(W, x1 - mx))))
    d = float(np.abs(a.reshape(H, W)[sl] - b.reshape(H, W)[sl]).mean()); n += 1; worst = max(worst, d)
    if d > 6: bad.append((round(t, 2), round(d, 1)))
print('checked', n, 'frames; worst mean diff', round(worst, 1), '; flagged', len(bad))
for x in bad[:60]: print('  t', x[0], 'diff', x[1])
