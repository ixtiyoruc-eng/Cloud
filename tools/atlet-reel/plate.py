# Footage plate for the Remotion comp: per-segment 9:16 crop from the 3024x4032 (display) source,
# smooth face-follow on the hook, camera push-in / pulse / micro-shake from edl.json, blue grade,
# mild sharpening, person-segmented subtle background blur + gentle vignette. Writes plate.mp4 (1080x1920@30, no audio).
# usage: plate.py EDIT_DIR DRIVE_DIR MODELS_DIR OUT_DIR [--only S01,S02] [--frames-only]
import json, sys, os, subprocess, math, numpy as np, cv2
from multiprocessing import Pool
E, DRV, MOD, O = sys.argv[1:5]
ONLY = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else None
EDL = json.load(open(f'{E}/v2/edl.json')); FPS = 30; W, H = 1080, 1920; SW, SH = 3024, 4032
os.makedirs(O + '/segs', exist_ok=True)

# ---------------- hook face tracking ----------------
def one_euro(x, fps, mincut=0.25, beta=0.004, dcut=1.0):
    a = lambda c: 1 / (1 + fps / (2 * math.pi * c)); y = [x[0]]; dx = 0.0
    for i in range(1, len(x)):
        d = (x[i] - x[i - 1]) * fps; dx = dx + a(dcut) * (d - dx); c = mincut + beta * abs(dx)
        y.append(y[-1] + a(c) * (x[i] - y[-1]))
    return np.array(y)
def speed_limit(x, vmax, fps):
    y = [x[0]]
    for v in x[1:]: y.append(y[-1] + np.clip(v - y[-1], -vmax / fps, vmax / fps))
    return np.array(y)
def track(clip_file, t0, t1, cache):
    if os.path.exists(cache): return json.load(open(cache))
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=f'{MOD}/face_landmarker.task'), running_mode=vision.RunningMode.VIDEO, num_faces=1))
    w, h = 756, 1008
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', clip_file, '-t', f'{t1 - t0:.3f}', '-vf', f'scale={w}:{h}',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    rows = []; i = 0
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3: break
        fr = np.frombuffer(b, np.uint8).reshape(h, w, 3)
        r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=fr.copy()), int(i * 1000 / FPS))
        if r.face_landmarks:
            L = r.face_landmarks[0]; xs = [q.x for q in L]
            rows.append([round(t0 + i / FPS, 4), (min(xs) + max(xs)) / 2 * SW, (L[33].y + L[263].y) / 2 * SH])
        else: rows.append([round(t0 + i / FPS, 4), None, None])
        i += 1
    json.dump(rows, open(cache, 'w')); return rows
def smooth_path(rows):
    t = np.array([r[0] for r in rows]); out = []
    for k in (1, 2):
        v = np.array([np.nan if r[k] is None else r[k] for r in rows], float); ok = ~np.isnan(v)
        v = np.interp(t, t[ok], v[ok])
        from scipy.signal import savgol_filter
        v = savgol_filter(v, 31, 2, mode='interp')     # kill landmark jitter (~1 s window)
        v = one_euro(v, FPS)                            # adaptive low-pass: still when still, follows real moves
        v = speed_limit(v, 90.0, FPS)                   # max pan 90 source px/s (~3% of frame width per second)
        out.append(v)
    return t, out[0], out[1]

# ---------------- grade ----------------
def smoothstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)
YY = np.linspace(0, 1, H)[:, None]; XX = np.linspace(-1, 1, W)[None, :]
VIG = (1 - 0.20 * np.clip(((XX * 0.9) ** 2 + ((YY - 0.45) * 1.7) ** 2) ** 1.25, 0, 1.5)).astype(np.float32)[..., None]
SHADOW = np.array([61, 27, 10], np.float32) / 255     # BGR of #0A1B3D midnight
ICY = np.array([255, 238, 222], np.float32) / 255     # icy highlight (BGR)
def grade(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV_FULL).astype(np.float32)
    h, s, v = hsv[..., 0] * (360 / 256), hsv[..., 1] / 255, hsv[..., 2] / 255
    # harmonise the electric-blue shelf LEDs: pull hue 232-255 deg toward cobalt (~222), -25% sat on the hottest ones, soften peak
    blue = smoothstep(195, 215, h) * (1 - smoothstep(262, 280, h)) * smoothstep(0.45, 0.8, s)
    h = h - blue * np.clip(h - 222, 0, 30) * 0.45
    s = s * (1 - 0.25 * blue); v = v * (1 - 0.10 * blue * smoothstep(0.6, 1.0, v))
    hsv = np.dstack([h * (256 / 360), s * 255, v * 255]).clip(0, 255).astype(np.uint8)
    x = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR_FULL).astype(np.float32) / 255
    L = (0.114 * x[..., 0] + 0.587 * x[..., 1] + 0.299 * x[..., 2])[..., None]
    skin = (smoothstep(0, 18, h) * (1 - smoothstep(40, 55, h)) * smoothstep(0.15, 0.3, s) * smoothstep(0.15, 0.3, v))[..., None]
    # gentle S-curve, lifted midnight shadows, icy highlights; skin keeps most of its warmth
    x = x + 0.10 * (x - x * x) * (2 * x - 1) * -1          # soft contrast
    sh = (1 - L) ** 3 * 0.55; x = x * (1 - sh * 0.35) + SHADOW * sh * 0.35
    hi = smoothstep(0.65, 1.0, L) * 0.10 * (1 - skin); x = x * (1 - hi) + ICY * hi
    cool = 0.04 * (1 - skin); x[..., 0] += cool[..., 0] * (1 - L[..., 0]) * 0.5; x[..., 2] -= cool[..., 0] * (1 - L[..., 0]) * 0.25
    return np.clip(x, 0, 1)
def halation(x):
    small = cv2.resize(x, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    br = np.clip((small - 0.85) / 0.15, 0, 1); br = cv2.GaussianBlur(br, (0, 0), 6)
    tint = np.array([1.0, 0.85, 0.65], np.float32)
    return np.clip(x + 0.045 * cv2.resize(br, (W, H)) * tint, 0, 1)
def sharpen(x):
    b = cv2.GaussianBlur(x, (0, 0), 1.3); return np.clip(x + 0.45 * (x - b), 0, 1)

# ---------------- segmentation ----------------
_seg = None
def person_mask(bgr8):
    global _seg
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    if _seg is None:
        _seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=f'{MOD}/selfie_multiclass.tflite'), output_confidence_masks=True))
    small = cv2.resize(bgr8, (512, 910), interpolation=cv2.INTER_AREA)
    r = _seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(small, cv2.COLOR_BGR2RGB)))
    cm = [np.squeeze(c.numpy_view()).astype(np.float32) for c in r.confidence_masks]
    m = cm[1] + cm[2] + cm[3] + cm[4]                 # hair, body skin, face skin, clothes
    near = cv2.dilate((m > 0.3).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32)
    m = np.clip(m + cm[5] * near, 0, 1)               # accessories (watch, mic) only when attached to the person
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
DESK = smoothstep(0.80, 0.88, YY).astype(np.float32)   # foreground desk stays sharp (H,1)
DESK_H = np.repeat(smoothstep(0.80, 0.88, np.linspace(0, 1, H // 2)[:, None]), W // 2, 1).astype(np.float32)

def cam_scale_shift(t_out, s):
    """returns (scale>1 = tighter, dx, dy (fraction of crop w), rot deg) for output time t_out."""
    a, b = s['out_start'], s['out_end']; u = (t_out - a) / max(b - a, 1e-3)
    sc = 1 + 0.02 * (0.5 - 0.5 * math.cos(math.pi * min(max(u, 0), 1)))
    dx = dy = rot = 0.0
    for c in EDL['camera']:
        d = t_out - c['t']
        if c['type'] == 'pulse' and 0 <= d < 0.30:
            sc *= 1 + 0.015 * (math.sin(math.pi * min(d / 0.06, 1) / 2) if d < 0.06 else (1 - (d - 0.06) / 0.24) ** 2)
        if c['type'] == 'micro_shake' and 0 <= d < 0.25:
            env = math.exp(-d / 0.07)
            dx += 0.012 * env * math.sin(d * 2 * math.pi * 13); dy += 0.008 * env * math.sin(d * 2 * math.pi * 17 + 1)
            rot += 0.4 * env * math.sin(d * 2 * math.pi * 11 + 0.5)
    return sc, dx, dy, rot

def render_seg(idx):
    s = EDL['segments'][idx]; c = s['crop']; clip = EDL['sources']['clips'][s['clip']]
    f0, f1 = round(s['out_start'] * FPS), round(s['out_end'] * FPS); N = f1 - f0
    out_f = f"{O}/segs/{s['id']}.mp4"
    if os.path.exists(out_f) and not ONLY: return s['id']
    ts = [(f0 + i) / FPS for i in range(N)]
    src_t = [s['src_in'] + (t - s['out_start']) for t in ts]
    cw = c['w']; ch = cw * 16 / 9
    cx = np.full(N, c['x'] + c['w'] / 2); cy = np.full(N, c['y'] + c['h'] / 2)
    if s.get('tracking'):
        rows = track(f'{DRV}/{clip}', 0.8, 8.9, f'{O}/hook_track.json')
        tt, fx, fy = smooth_path(rows)
        cx = np.interp(src_t, tt, fx); cy = np.interp(src_t, tt, fy) + (0.5 - c['eyes_y_in_crop']) * ch
        json.dump(dict(t=list(map(float, src_t)), cx=list(map(float, cx)), cy=list(map(float, cy))), open(f'{O}/hook_path_{s["id"]}.json', 'w'))
    # union window (display px) to decode at reduced size, then warp per frame
    m = 0.06 * cw
    ux0 = max(0, int(cx.min() - cw / 2 - m)); ux1 = min(SW, int(cx.max() + cw / 2 + m))
    uy0 = max(0, int(cy.min() - ch / 2 - m)); uy1 = min(SH, int(cy.max() + ch / 2 + m))
    k = min(1.0, 1.08 * W / (cw / 1.035)); uw = int((ux1 - ux0) * k) // 2 * 2; uh = int((uy1 - uy0) * k) // 2 * 2
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f"{s['src_in']:.4f}", '-i', f'{DRV}/{clip}', '-frames:v', str(N),
        '-vf', f'crop={ux1 - ux0}:{uy1 - uy0}:{ux0}:{uy0},scale={uw}:{uh}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
        stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-colorspace', 'bt709', out_f], stdin=subprocess.PIPE)
    last = None; mprev = None
    for i in range(N):
        b = p.stdout.read(uw * uh * 3)
        if len(b) == uw * uh * 3: last = np.frombuffer(b, np.uint8).reshape(uh, uw, 3)
        fr = last
        sc, dx, dy, rot = cam_scale_shift(ts[i], s)
        w_ = cw / sc; scl = W / (w_ * k)                                # dest px per decoded px
        ccx = (cx[i] - ux0 + dx * cw) * k; ccy = (cy[i] - uy0 + dy * cw) * k
        M = cv2.getRotationMatrix2D((ccx, ccy), rot, scl); M[0, 2] += W / 2 - ccx; M[1, 2] += H / 2 - ccy
        img = cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        x = sharpen(grade(img))
        if True:
            mk = person_mask(img)
            mk = mk if mprev is None else 0.55 * mk + 0.45 * mprev; mprev = mk
            keep = np.maximum(cv2.GaussianBlur(mk, (0, 0), 2.0), DESK)[..., None]
            hs = cv2.resize(x, (W // 2, H // 2), interpolation=cv2.INTER_AREA); ks = cv2.resize(keep, (W // 2, H // 2))[..., None]
            hard = cv2.dilate((cv2.resize(mk, (W // 2, H // 2)) > 0.25).astype(np.float32), np.ones((15, 15), np.uint8))
            bgw = (1 - np.maximum(hard, DESK_H))[..., None]   # sample bg only well away from the person
            num = cv2.GaussianBlur(hs * bgw, (0, 0), 3.0); den = cv2.GaussianBlur(bgw, (0, 0), 3.0)[..., None]
            bg = num / np.maximum(den, 1e-3)[..., None] if den.ndim == 2 else num / np.maximum(den, 1e-3); bg = np.where(den > 0.02, bg, hs)
            bg = cv2.resize(bg, (W, H), interpolation=cv2.INTER_LINEAR)
            x = x * keep + bg * (1 - keep)
        x = halation(x) * VIG
        enc.stdin.write((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
    p.stdout.close(); p.wait(); enc.stdin.close(); enc.wait()
    return s['id']

if __name__ == '__main__':
    ids = [i for i, s in enumerate(EDL['segments']) if not ONLY or s['id'] in ONLY]
    # hook tracking first (single process), then segments in parallel
    if any(EDL['segments'][i].get('tracking') for i in ids):
        track(f"{DRV}/{EDL['sources']['clips']['c1']}", 0.8, 8.9, f'{O}/hook_track.json')
    with Pool(int(os.environ.get('JOBS', '3'))) as pool:
        for r in pool.imap_unordered(render_seg, ids): print('done', r, flush=True)
    if not ONLY:
        open(f'{O}/segs/list.txt', 'w').write(''.join(f"file '{O}/segs/{s['id']}.mp4'\n" for s in EDL['segments']))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{O}/segs/list.txt', '-c', 'copy', f'{O}/plate.mp4'], check=True)
        print('plate written')
