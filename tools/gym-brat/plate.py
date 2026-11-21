# Footage plate for the Gym brat reel: per-segment 9:16 crop from the 3024x4032 (display) source that follows the face
# (smoothed), three framings (wide / med / close) alternating on jump cuts, slow push-in, Atlet blue grade (from
# ../atlet-reel/plate.py), face retouch (from ../atlet-reel/face_filter.py). Writes plate.mp4 (1080x1920@30, no audio)
# and face.json (per output frame: face box [x0, y0, x1, y1] in output px incl. hair, or null) so graphics can avoid the face.
# usage: plate.py EDL.json DRIVE_DIR FACE_LANDMARKER.task OUT_DIR [--only S01,S02] [--no-grade]
# --no-grade (v2, user: "no colour at all"): colours as shot - no grade, halation or vignette; face retouch only smooths skin.
import json, sys, os, subprocess, math, numpy as np, cv2
from multiprocessing import Pool
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'atlet-reel'))
EDLF, DRV, MODEL, O = sys.argv[1:5]
NOGRADE = '--no-grade' in sys.argv
ONLY = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else None
EDL = json.load(open(EDLF)); FPS = 30; W, H = 1080, 1920; SW, SH = 3024, 4032
ZOOM = {'wide': 2268, 'med': 1850, 'close': 1480}   # crop width in source px
EYE_Y = {'wide': None, 'med': 0.31, 'close': 0.33}    # eye line as a fraction of output height (wide = full height)
os.makedirs(O + '/segs', exist_ok=True)

def smoothstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)
YY = np.linspace(0, 1, H)[:, None]; XX = np.linspace(-1, 1, W)[None, :]
VIG = (1 - 0.22 * np.clip(((XX * 0.9) ** 2 + ((YY - 0.42) * 1.6) ** 2) ** 1.25, 0, 1.5)).astype(np.float32)[..., None]
SHADOW = np.array([61, 27, 10], np.float32) / 255; ICY = np.array([255, 238, 222], np.float32) / 255
def grade(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV_FULL).astype(np.float32)
    h, s, v = hsv[..., 0] * (360 / 256), hsv[..., 1] / 255, hsv[..., 2] / 255
    blue = smoothstep(195, 215, h) * (1 - smoothstep(262, 280, h)) * smoothstep(0.45, 0.8, s)
    h = h - blue * np.clip(h - 222, 0, 30) * 0.45; s = s * (1 - 0.22 * blue); v = v * (1 - 0.10 * blue * smoothstep(0.6, 1.0, v))
    hsv = np.dstack([h * (256 / 360), s * 255, v * 255]).clip(0, 255).astype(np.uint8)
    x = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR_FULL).astype(np.float32) / 255
    L = (0.114 * x[..., 0] + 0.587 * x[..., 1] + 0.299 * x[..., 2])[..., None]
    skin = (smoothstep(0, 18, h) * (1 - smoothstep(40, 55, h)) * smoothstep(0.15, 0.3, s) * smoothstep(0.15, 0.3, v))[..., None]
    x = x - 0.10 * (x - x * x) * (2 * x - 1)
    sh = (1 - L) ** 3 * 0.55; x = x * (1 - sh * 0.35) + SHADOW * sh * 0.35
    hi = smoothstep(0.65, 1.0, L) * 0.10 * (1 - skin); x = x * (1 - hi) + ICY * hi
    cool = 0.04 * (1 - skin); x[..., 0] += cool[..., 0] * (1 - L[..., 0]) * 0.5; x[..., 2] -= cool[..., 0] * (1 - L[..., 0]) * 0.25
    return np.clip(x, 0, 1)
def halation(x):
    small = cv2.resize(x, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    br = cv2.GaussianBlur(np.clip((small - 0.85) / 0.15, 0, 1), (0, 0), 6)
    return np.clip(x + 0.045 * cv2.resize(br, (W, H)) * np.array([1.0, 0.85, 0.65], np.float32), 0, 1)
def sharpen(x): b = cv2.GaussianBlur(x, (0, 0), 1.3); return np.clip(x + (0.25 if NOGRADE else 0.4) * (x - b), 0, 1)

_lm = {}
def landmarker(video):
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    k = 'v' if video else 'i'
    if k not in _lm:
        _lm[k] = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=MODEL),
            running_mode=vision.RunningMode.VIDEO if video else vision.RunningMode.IMAGE, num_faces=1))
    return _lm[k]

def face_path(s):
    """eye-centre (x, y) in source px for every output frame of the segment, smoothed"""
    import mediapipe as mp
    N = round((s['out_end'] - s['out_start']) * FPS); w, h = 504, 672
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f"{s['src_in']:.3f}", '-i', f"{DRV}/{s['clip']}.mov", '-frames:v', str(N), '-vf', f'scale={w}:{h}',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    lm = landmarker(False); xs, ys = [], []
    for i in range(N):
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3: xs.append(np.nan); ys.append(np.nan); continue
        if i % 3: xs.append(np.nan); ys.append(np.nan); continue
        r = lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(b, np.uint8).reshape(h, w, 3).copy()))
        if r.face_landmarks:
            L = r.face_landmarks[0]; xs.append((L[33].x + L[263].x) / 2 * SW); ys.append((L[33].y + L[263].y) / 2 * SH)
        else: xs.append(np.nan); ys.append(np.nan)
    p.stdout.close(); p.wait()
    t = np.arange(N); out = []
    for v in (np.array(xs), np.array(ys)):
        ok = ~np.isnan(v); v = np.interp(t, t[ok], v[ok]) if ok.any() else np.full(N, SW / 2 if v is xs else SH * 0.22)
        k = min(N // 2 * 2 - 1, 21)
        if k >= 5:
            from scipy.signal import savgol_filter
            v = savgol_filter(v, k, 1, mode='interp')
        # heavy smoothing: the frame drifts with the speaker, never jitters
        a = 0.12; y = [v[0]]
        for q in v[1:]: y.append(y[-1] + a * (q - y[-1]))
        out.append(np.array(y))
    return out

# face retouch (same recipe as atlet-reel/face_filter.py)
import face_filter
from face_filter import face_mask, retouch
if NOGRADE: face_filter.LIFT, face_filter.DESAT = 0.0, 0.0   # smoothing only, no brightness or colour change

def render_seg(idx):
    s = EDL['segments'][idx]; out_f = f"{O}/segs/{s['id']}.mp4"
    if os.path.exists(out_f) and not ONLY: return s['id']
    N = round((s['out_end'] - s['out_start']) * FPS)
    fx, fy = face_path(s)
    cw = ZOOM[s['zoom']]; ch = cw * 16 / 9
    cx = np.clip(fx, cw / 2, SW - cw / 2)
    cy = np.full(N, SH / 2) if EYE_Y[s['zoom']] is None else np.clip(fy + (0.5 - EYE_Y[s['zoom']]) * ch, ch / 2, SH - ch / 2)
    k = W / cw * 1.06; uw, uh = int(SW * k) // 2 * 2, int(SH * k) // 2 * 2
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f"{s['src_in']:.4f}", '-i', f"{DRV}/{s['clip']}.mov", '-frames:v', str(N),
        '-vf', f'scale={uw}:{uh}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '13', '-pix_fmt', 'yuv420p', out_f], stdin=subprocess.PIPE)
    import mediapipe as mp
    lm = landmarker(False); last = None; fr = None; mlast = None; miss = 0; boxes = []
    for i in range(N):
        b = p.stdout.read(uw * uh * 3)
        if len(b) == uw * uh * 3: fr = np.frombuffer(b, np.uint8).reshape(uh, uw, 3)
        u = i / max(N - 1, 1); sc = 1 + 0.025 * (0.5 - 0.5 * math.cos(math.pi * u))   # slow push-in per shot
        scl = W / (cw / sc) / k; ccx, ccy = cx[i] * k, cy[i] * k
        M = np.float32([[scl, 0, W / 2 - ccx * scl], [0, scl, H / 2 - ccy * scl]])
        img = cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        r = lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))
        if r.face_landmarks:
            L = r.face_landmarks[0]; xs = [q.x * W for q in L]; ys = [q.y * H for q in L]; fh = max(ys) - min(ys)
            boxes.append([round(min(xs) - 0.12 * fh), round(min(ys) - 0.38 * fh), round(max(xs) + 0.12 * fh), round(max(ys) + 0.04 * fh)])
            m, pts = face_mask(r.face_landmarks[0], W, H)
            if mlast is not None and miss == 0: m = 0.6 * m + 0.4 * mlast[0]
            mlast = (m, pts); miss = 0
        else: miss += 1; boxes.append(None)
        if mlast is not None and miss < 6: img = retouch(img, *mlast)
        x = np.clip(sharpen(img.astype(np.float32) / 255), 0, 1) if NOGRADE else halation(sharpen(grade(img))) * VIG
        enc.stdin.write((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
    p.stdout.close(); p.wait(); enc.stdin.close(); enc.wait()
    json.dump(boxes, open(f"{O}/segs/{s['id']}.face.json", 'w'))
    return s['id']

if __name__ == '__main__':
    ids = [i for i, s in enumerate(EDL['segments']) if not ONLY or s['id'] in ONLY]
    with Pool(int(os.environ.get('JOBS', '4'))) as pool:
        for r in pool.imap_unordered(render_seg, ids): print('done', r, flush=True)
    if not ONLY:
        open(f'{O}/segs/list.txt', 'w').write(''.join(f"file '{O}/segs/{s['id']}.mp4'\n" for s in EDL['segments']))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{O}/segs/list.txt', '-c', 'copy', f'{O}/plate.mp4'], check=True)
        face = sum((json.load(open(f"{O}/segs/{s['id']}.face.json")) for s in EDL['segments']), [])
        json.dump(face, open(f'{O}/face.json', 'w')); print('plate written', len(face), 'face boxes')
