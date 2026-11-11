"""Face retouch ("makiyaj") + person matte helpers. Used for stills and for full video."""
import cv2, numpy as np, onnxruntime as ort, os

MODELS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')


class FaceTools:
    def __init__(self):
        self.det = cv2.FaceDetectorYN.create(os.path.join(MODELS, 'yunet.onnx'), '', (320, 320), 0.7)
        self.lm = cv2.face.createFacemarkLBF()
        self.lm.loadModel(os.path.join(MODELS, 'lbfmodel.yaml'))
        self.prev = None  # smoothed landmarks

    def landmarks(self, img, smooth=0.0):
        h, w = img.shape[:2]
        s = 0.5
        small = cv2.resize(img, (int(w * s), int(h * s)))
        self.det.setInputSize((small.shape[1], small.shape[0]))
        _, faces = self.det.detect(small)
        if faces is None or len(faces) == 0:
            return self.prev
        f = max(faces, key=lambda r: r[2] * r[3])
        box = np.array([[f[0] / s, f[1] / s, f[2] / s, f[3] / s]], dtype=np.float64)
        ok, pts = self.lm.fit(img, box)
        if not ok:
            return self.prev
        p = np.asarray(pts[0], np.float32).reshape(-1, 2)[:68]
        if self.prev is not None and smooth > 0:
            # adaptive EMA: smooth jitter, follow real motion
            d = np.linalg.norm(p - self.prev, axis=1).mean()
            a = smooth if d < 6 else smooth * 0.3
            p = self.prev * a + p * (1 - a)
        self.prev = p
        return p


def _poly_mask(shape, pts, blur):
    m = np.zeros(shape[:2], np.float32)
    cv2.fillPoly(m, [pts.astype(np.int32)], 1.0, lineType=cv2.LINE_AA)
    if blur > 0:
        k = int(blur) * 2 + 1
        m = cv2.GaussianBlur(m, (k, k), 0)
    return m


def masks(shape, p):
    jaw = p[0:17]
    brows = p[17:27]
    face_h = np.linalg.norm(p[8] - p[27])
    # forehead: lift brow points upward
    up = np.array([0, -0.55 * face_h], np.float32)
    forehead = (brows[::-1] + up)
    face_poly = np.vstack([jaw, forehead])
    fw = np.linalg.norm(p[16] - p[0])
    b = fw * 0.04
    skin = _poly_mask(shape, cv2.convexHull(face_poly).reshape(-1, 2), b)
    # holes: eyes, brows, lips, nostrils
    def hull(ix, grow=1.0):
        q = p[ix]
        c = q.mean(0)
        return c + (q - c) * grow
    hole = np.zeros(shape[:2], np.float32)
    for ix, g in ((list(range(36, 42)), 1.9), (list(range(42, 48)), 1.9), (list(range(48, 60)), 1.15),
                  (list(range(17, 22)), 1.35), (list(range(22, 27)), 1.35)):
        cv2.fillPoly(hole, [cv2.convexHull(hull(ix, g)).astype(np.int32)], 1.0, lineType=cv2.LINE_AA)
    hole = cv2.GaussianBlur(hole, (0, 0), b * 0.5)
    skin = np.clip(skin - hole, 0, 1)
    lips = _poly_mask(shape, cv2.convexHull(p[48:60]).reshape(-1, 2), 0)
    inner = _poly_mask(shape, cv2.convexHull(p[60:68]).reshape(-1, 2), 0)
    lips = cv2.GaussianBlur(np.clip(lips - inner * 0.9, 0, 1), (0, 0), fw * 0.008)
    # under-eye zones
    ue = np.zeros(shape[:2], np.float32)
    for e in (range(36, 42), range(42, 48)):
        q = p[list(e)]
        c = q.mean(0)
        wdt = np.ptp(q[:, 0])
        cv2.ellipse(ue, (int(c[0]), int(c[1] + wdt * 0.55)), (int(wdt * 0.62), int(wdt * 0.3)), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
    ue = cv2.GaussianBlur(ue, (0, 0), wdt * 0.25) * skin
    return skin, lips, ue, fw


def retouch(img, p, strength=1.0):
    if p is None:
        return img
    skin, lips, ue, fw = masks(img.shape, p)
    f = img.astype(np.float32) / 255.0
    r = max(4, int(fw * 0.035))
    base = cv2.ximgproc.guidedFilter(guide=f, src=f, radius=r, eps=0.0015)
    det = f - cv2.GaussianBlur(f, (0, 0), max(1.5, fw * 0.006))
    smooth = np.clip(base + det * 0.7, 0, 1)
    m = (skin * 0.6 * strength)[..., None]
    out = f * (1 - m) + smooth * m
    # even, luminous skin: gentle lift + slight warmth
    lift = (skin * 0.04 * strength)[..., None]
    out = out + (1 - out) * lift
    out[..., 2] += skin * 0.008 * strength  # tiny warmth (BGR: red)
    # under-eye brighten
    u = (ue * 0.08 * strength)[..., None]
    out = out + (1 - out) * u
    # lips: rosy tint (soft-light toward berry rose)
    tint = np.array([0.42, 0.36, 0.62], np.float32)  # BGR
    sl = np.where(out < 0.5, 2 * out * tint + out * out * (1 - 2 * tint), 2 * out * (1 - tint) + np.sqrt(out) * (2 * tint - 1))
    lm = (lips * 0.28 * strength)[..., None]
    out = out * (1 - lm) + sl * lm
    return np.clip(out * 255, 0, 255).astype(np.uint8)


def glow(img, amount=0.12):
    f = img.astype(np.float32) / 255
    b = cv2.GaussianBlur(f, (0, 0), 18)
    out = 1 - (1 - f) * (1 - b * amount)  # screen
    return np.clip(out * 255, 0, 255).astype(np.uint8)


class Matter:
    def __init__(self, model='rvm_mobilenetv3_fp32.onnx', ratio=0.25):
        so = ort.SessionOptions()
        so.intra_op_num_threads = int(os.environ.get('ORT_THREADS', os.cpu_count()))
        self.s = ort.InferenceSession(os.path.join(MODELS, model), so, providers=['CPUExecutionProvider'])
        self.rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
        self.ratio = np.array([ratio], np.float32)

    def reset(self):
        self.rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4

    def __call__(self, img_bgr):
        x = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2, 0, 1)[None] / 255
        fgr, pha, *self.rec = self.s.run(None, {'src': x, 'r1i': self.rec[0], 'r2i': self.rec[1], 'r3i': self.rec[2], 'r4i': self.rec[3], 'downsample_ratio': self.ratio})
        return pha[0, 0]
