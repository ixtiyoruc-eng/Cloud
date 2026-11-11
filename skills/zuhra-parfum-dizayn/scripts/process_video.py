"""Per-frame: face retouch (makeup) + person matte. Writes retouched video and matte video."""
import sys, os, subprocess, time
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from beauty import FaceTools, retouch, Matter

src, out_rgb, out_matte, threads = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
cv2.setNumThreads(threads)
W_, H_ = int(os.environ.get('VW', 1080)), int(os.environ.get('VH', 1920))
STR = float(os.environ.get('STRENGTH', 1.0))
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W_}x{H_}', '-r', '24', '-i', '-',
                        '-c:v', 'libx264', '-crf', '13', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', out_rgb], stdin=subprocess.PIPE)
encm = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W_}x{H_}', '-r', '24', '-i', '-',
                         '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', out_matte], stdin=subprocess.PIPE)
ft = FaceTools()
mt = Matter(ratio=float(os.environ.get('RVM_RATIO', 0.25)))
n = 0; t0 = time.time()
fsz = W_ * H_ * 3
while True:
    buf = dec.stdout.read(fsz)
    if len(buf) < fsz:
        break
    img = np.frombuffer(buf, np.uint8).reshape(H_, W_, 3).copy()
    p = ft.landmarks(img, smooth=0.6)
    out = img
    if p is not None:
        fw = np.ptp(p[:, 0]); x0 = int(max(0, p[:, 0].min() - fw * 0.5)); x1 = int(min(W_, p[:, 0].max() + fw * 0.5))
        y0 = int(max(0, p[:, 1].min() - fw * 0.9)); y1 = int(min(H_, p[:, 1].max() + fw * 0.4))
        crop = img[y0:y1, x0:x1]
        out = img.copy()
        out[y0:y1, x0:x1] = retouch(crop, p - np.array([x0, y0], np.float32), STR)
    # soft glow (half-res)
    f = out.astype(np.float32) / 255
    b = cv2.resize(cv2.GaussianBlur(cv2.resize(f, (540, 960)), (0, 0), 9), (W_, H_))
    gl = 0.10 * STR
    out = np.clip((1 - (1 - f) * (1 - b * gl)) * 255, 0, 255).astype(np.uint8)
    a = mt(out)
    enc.stdin.write(out.tobytes())
    encm.stdin.write(np.clip(a * 255, 0, 255).astype(np.uint8).tobytes())
    n += 1
    if n % 200 == 0:
        print(f'{os.path.basename(src)} {n} frames {n / (time.time() - t0):.2f} fps', flush=True)
enc.stdin.close(); encm.stdin.close(); enc.wait(); encm.wait()
print('done', n, flush=True)
