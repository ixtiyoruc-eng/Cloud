"""Colour correction: make any new Sohiba opa video match the approved reel's colour.

Approach (stable, no flicker): per segment, sample ~8 frames, measure per-channel quantiles and
build ONE 3-channel LUT per segment that maps them onto references/color_target.json (taken from
the approved reel's source). Then retouch.py applies the house grade (lift, soft S-curve, warmth,
+10 % saturation) on top.

usage as module:  cm = ColorMatch(target_json); cm.fit(list_of_bgr_frames); out = cm.apply(frame)
usage CLI:        python3 colormatch.py target SRC.mov OUT.json   # (re)build a target from an approved video
                  python3 colormatch.py test   SRC.mov SECONDS OUT.jpg [target.json]  # before/after
"""
import sys, os, json, subprocess, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
DEF_TARGET = os.path.join(HERE, '..', 'references', 'color_target.json')

Q = [0.5, 2, 5, 10, 20, 35, 50, 65, 80, 90, 95, 98, 99.5]

def stats(frames):
    """Per-channel (B,G,R) quantiles over sampled frames = the colour 'fingerprint' of a shot."""
    px = np.concatenate([cv2.resize(f, (270, 480), interpolation=cv2.INTER_AREA).reshape(-1, 3) for f in frames]).astype(np.float32)
    return {'q': Q, 'bgr': [np.percentile(px[:, c], Q).round(2).tolist() for c in range(3)]}

class ColorMatch:
    """Quantile (histogram) matching per channel -> one 256-entry LUT per channel.
    Fixes white balance in shadows/mids/highlights separately, exposure and contrast, all at once.
    Same car / same outfit => content is comparable, so matching is safe; strength + slope clamps keep it gentle."""
    def __init__(self, target=DEF_TARGET, strength=0.95):
        self.t = json.load(open(target)) if isinstance(target, str) else target
        self.k = strength; self.lut = None
    def fit(self, frames):
        s = stats(frames); x = np.arange(256, dtype=np.float32); luts = []; info = []
        for c in range(3):
            sq = np.array([0] + s['bgr'][c] + [255], np.float32); tq = np.array([0] + self.t['bgr'][c] + [255], np.float32)
            sq = np.maximum.accumulate(sq + np.arange(len(sq)) * 1e-3)
            m = np.interp(x, sq, tq)
            # clamp local slope (no posterising / crushed blacks), then smooth
            d = np.clip(np.diff(m, prepend=m[0]), 0.3, 3.2); d[0] = m[0]; m = np.cumsum(d)
            m = np.convolve(np.pad(m, 4, mode="edge"), np.ones(9) / 9, mode='valid')
            m = x + (m - x) * self.k
            luts.append(np.clip(m, 0, 255).astype(np.uint8)); info.append(round(float(m[128] - 128), 1))
        self.lut = np.stack(luts, 1).reshape(256, 1, 3)
        return {'mid_shift_BGR': info}
    def apply(self, img):
        return img if self.lut is None else cv2.LUT(img, self.lut)

def sample(src, t0=0, t1=None, n=8, w=540, h=960):
    if t1 is None:
        t1 = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
    out = []
    for t in np.linspace(t0 + 0.1, max(t0 + 0.2, t1 - 0.1), n):
        r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
        if len(r.stdout) == w * h * 3: out.append(np.frombuffer(r.stdout, np.uint8).reshape(h, w, 3))
    return out

if __name__ == '__main__':
    if sys.argv[1] == 'target':
        json.dump(stats(sample(sys.argv[2], n=24)), open(sys.argv[3], 'w'), indent=1); print(open(sys.argv[3]).read())
    elif sys.argv[1] == 'test':
        src, t, dst = sys.argv[2], float(sys.argv[3]), sys.argv[4]
        cm = ColorMatch(sys.argv[5] if len(sys.argv) > 5 else DEF_TARGET)
        print(cm.fit(sample(src, max(0, t - 3), t + 3)))
        f = sample(src, t, t + 0.05, n=1, w=1080, h=1920)[0]
        sys.path.insert(0, HERE); import retouch as R
        lm = R.make_lm(); p = R.detect(lm, f)
        a = R.retouch(f, p); b = R.retouch(cm.apply(f), p)
        cv2.imwrite(dst, cv2.resize(np.hstack([f, a, b]), None, fx=0.5, fy=0.5), [cv2.IMWRITE_JPEG_QUALITY, 92])
