#!/usr/bin/env python3
"""Face retouch pass on the graded plate: brighten and even the face, light skin smoothing, clearer eyes.
usage: face_filter.py PLATE_IN FACE_LANDMARKER.task PLATE_OUT [--test T1,T2,... OUT.jpg]"""
import sys, subprocess, numpy as np, cv2, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
LIFT, SMOOTH, DESAT = 0.16, 0.45, 0.10   # strength of brighten, skin smoothing, blue-cast removal

def make_landmarker(model):
    o = vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=model),
                                     running_mode=vision.RunningMode.IMAGE, num_faces=1)
    return vision.FaceLandmarker.create_from_options(o)

def face_mask(lm, w, h):
    pts = np.array([[lm[i].x * w, lm[i].y * h] for i in OVAL], np.float32)
    c = pts.mean(0); pts = c + (pts - c) * 1.04
    m = np.zeros((h, w), np.float32); cv2.fillPoly(m, [pts.astype(np.int32)], 1.0)
    k = int(max(15, (pts[:, 0].max() - pts[:, 0].min()) * 0.16)) | 1
    return cv2.GaussianBlur(m, (k, k), 0), pts

def retouch(bgr, m, pts):
    x0, y0 = np.maximum(pts.min(0).astype(int) - 60, 0); x1, y1 = pts.max(0).astype(int) + 60
    roi = bgr[y0:y1, x0:x1]; mm = m[y0:y1, x0:x1, None]
    if roi.size == 0: return bgr
    f = roi.astype(np.float32) / 255
    soft = cv2.bilateralFilter(f, 9, 0.08, 7)                       # skin smoothing, edges kept
    detail = f - cv2.GaussianBlur(f, (0, 0), 2.2)
    g = soft * SMOOTH + f * (1 - SMOOTH) + detail * 0.35            # smooth, then add fine detail back (clarity)
    lum = g.mean(2, keepdims=True)
    g = g + (lum - g) * DESAT                                       # pull the blue cast off the skin
    g = g * (1 + LIFT) + LIFT * 0.25 * (1 - g)                      # brighten, lift shadows a little
    g = np.clip(g, 0, 1)
    out = bgr.copy(); out[y0:y1, x0:x1] = np.clip((f * (1 - mm) + g * mm) * 255, 0, 255).astype(np.uint8)
    return out

def main():
    src, model, dst = sys.argv[1:4]
    lmk = make_landmarker(model); cap = cv2.VideoCapture(src)
    w, h, fps, n = int(cap.get(3)), int(cap.get(4)), cap.get(5), int(cap.get(7))
    if len(sys.argv) > 4 and sys.argv[4] == '--test':
        rows = []
        for t in map(float, sys.argv[5].split(',')):
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
            r = lmk.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
            out = retouch(fr, *face_mask(r.face_landmarks[0], w, h)) if r.face_landmarks else fr
            rows.append(np.hstack([fr, out])[300:1100])
        cv2.imwrite(sys.argv[6], cv2.resize(np.hstack(rows), None, fx=0.45, fy=0.45)); return
    ff = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', str(fps),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst], stdin=subprocess.PIPE)
    last = None; miss = 0; i = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        r = lmk.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
        if r.face_landmarks:
            m, pts = face_mask(r.face_landmarks[0], w, h)
            if last is not None and miss == 0: m = 0.6 * m + 0.4 * last[0]   # temporal smoothing of the mask
            last = (m, pts); miss = 0
        else: miss += 1
        if last is not None and miss < 6: fr = retouch(fr, *last)
        ff.stdin.write(fr.tobytes()); i += 1
        if i % 300 == 0: print(i, n, flush=True)
    ff.stdin.close(); ff.wait(); print('done', i)

if __name__ == '__main__': main()
