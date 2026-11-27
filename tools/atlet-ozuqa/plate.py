# Footage plate for the Atlet.uz "4 ta sport ozuqa" reel. The take is already 1080x1920 (9:16), so framings are digital
# zooms of it that follow the face: wide 1.04x / med 1.14x / close 1.26x, alternating on jump cuts, slow push-in per shot.
# Colours as shot (user rule 2026-11-21: no grade), light skin smoothing only (face_filter.py, LIFT/DESAT off), mild sharpen.
# Writes plate.mp4 (1080x1920@30, no audio) and face.json (per output frame face box [x0, y0, x1, y1] incl. hair, or null).
# usage: plate.py EDL.json SOURCE.mov FACE_LANDMARKER.task OUT_DIR
import json, sys, os, subprocess, math, numpy as np, cv2
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import face_filter
from face_filter import face_mask, retouch
face_filter.LIFT, face_filter.DESAT = 0.0, 0.0

EDLF, SRC, MODEL, O = sys.argv[1:5]
EDL = json.load(open(EDLF)); FPS = 30; W, H = 1080, 1920
ZOOM = {'wide': 1.04, 'med': 1.14, 'close': 1.26}
EYE_Y = {'wide': None, 'med': 0.30, 'close': 0.31}
lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=MODEL),
     running_mode=vision.RunningMode.IMAGE, num_faces=1))
def detect(bgr): return lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))).face_landmarks
def frames(a, n):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{a:.4f}', '-i', SRC, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    last = None
    for _ in range(n):
        b = p.stdout.read(W * H * 3)
        if len(b) == W * H * 3: last = np.frombuffer(b, np.uint8).reshape(H, W, 3)
        yield last
    p.stdout.close(); p.wait()
def sharpen(x): b = cv2.GaussianBlur(x, (0, 0), 1.3); return np.clip(x + 0.25 * (x - b), 0, 1)

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '13', '-pix_fmt', 'yuv420p', f'{O}/plate.mp4'], stdin=subprocess.PIPE)
boxes = []
for s in EDL['segments']:
    N = round((s['out_end'] - s['out_start']) * FPS)
    src = list(frames(s['src_in'], N))
    # eye centre per frame (every 3rd frame detected), smoothed so the framing drifts, never jitters
    ex, ey = np.full(N, np.nan), np.full(N, np.nan)
    for i in range(0, N, 3):
        L = detect(src[i])
        if L: L = L[0]; ex[i] = (L[33].x + L[263].x) / 2 * W; ey[i] = (L[33].y + L[263].y) / 2 * H
    t = np.arange(N); ok = ~np.isnan(ex)
    ex = np.interp(t, t[ok], ex[ok]) if ok.any() else np.full(N, W / 2); ey = np.interp(t, t[ok], ey[ok]) if ok.any() else np.full(N, H * 0.3)
    for v in (ex, ey):
        for i in range(1, N): v[i] = v[i - 1] + 0.12 * (v[i] - v[i - 1])
    z = ZOOM[s['zoom']]; mlast = None; miss = 0
    for i in range(N):
        u = i / max(N - 1, 1); sc = z * (1 + 0.025 * (0.5 - 0.5 * math.cos(math.pi * u)))
        cw, ch = W / sc, H / sc
        cx = np.clip(ex[i], cw / 2, W - cw / 2)
        cy = H / 2 if EYE_Y[s['zoom']] is None else np.clip(ey[i] + (0.5 - EYE_Y[s['zoom']]) * ch, ch / 2, H - ch / 2)
        M = np.float32([[sc, 0, W / 2 - cx * sc], [0, sc, H / 2 - cy * sc]])
        img = cv2.warpAffine(src[i], M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        L = detect(img)
        if L:
            L = L[0]; xs = [q.x * W for q in L]; ys = [q.y * H for q in L]; fh = max(ys) - min(ys)
            boxes.append([round(min(xs) - 0.12 * fh), round(min(ys) - 0.38 * fh), round(max(xs) + 0.12 * fh), round(max(ys) + 0.04 * fh)])
            m, pts = face_mask(L, W, H)
            if mlast is not None and miss == 0: m = 0.6 * m + 0.4 * mlast[0]
            mlast = (m, pts); miss = 0
        else: miss += 1; boxes.append(None)
        if mlast is not None and miss < 6: img = retouch(img, *mlast)
        x = sharpen(img.astype(np.float32) / 255)
        enc.stdin.write((x * 255 + 0.5).astype(np.uint8).tobytes())
    print('done', s['id'], s['zoom'], flush=True)
enc.stdin.close(); enc.wait()
json.dump(boxes, open(f'{O}/face.json', 'w')); print('plate written', len(boxes), 'face boxes')
