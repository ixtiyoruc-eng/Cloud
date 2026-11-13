"""Grab one frame at full source resolution, retouch it, save as the cover photo.
usage: python3 cover_frame.py SRC.mov SECONDS OUT.jpg"""
import sys, os, subprocess, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import retouch as R
src, t, dst = sys.argv[1], sys.argv[2], sys.argv[3]
tmp = dst + '.png'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', src, '-frames:v', '1', tmp], check=True)
im = cv2.imread(tmp); lm = R.make_lm()
p = R.detect(lm, cv2.resize(im, None, fx=0.5, fy=0.5))
im = R.retouch(im, p * 2 if p is not None else None)
cv2.imwrite(dst, im, [cv2.IMWRITE_JPEG_QUALITY, 96]); os.remove(tmp)
if p is not None:
    print('face centre (x,y as 0..1):', (p[R.OVAL].mean(0) * 2 / [im.shape[1], im.shape[0]]).round(3))
