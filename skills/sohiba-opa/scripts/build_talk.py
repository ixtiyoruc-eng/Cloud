"""Cut + retouch the talking head and build the cleaned voice track.

usage: python3 build_talk.py SRC.mov CUTS.json OUTDIR [--slim]
  CUTS.json = [[start_s, end_s], ...] in SOURCE seconds, in play order.
Writes OUTDIR/talk.mp4 (1296x2304, source fps, CRF 12), OUTDIR/talk.wav (48 kHz, -15 LUFS, +3 s pad),
OUTDIR/talk16.wav (16 kHz mono, for re-transcribing the edit), OUTDIR/segs.json (frame-exact segment table).
--slim: also slim jaw/double chin + soften the car background (OFF by default: the user prefers the natural face).
"""
import subprocess, numpy as np, cv2, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import retouch as R

src, cuts, out = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3]
SLIM = '--slim' in sys.argv
os.makedirs(out, exist_ok=True)
W, H = 1296, 2304
fps_s = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=avg_frame_rate', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip()
n_, d_ = fps_s.split('/'); FPS = round(int(n_) / int(d_))
segs = []; t = 0
for a, b in cuts:
    fa = round(a * FPS); n = round((b - a) * FPS)
    segs.append(dict(src=fa / FPS, n=n, start=t, start_s=round(t / FPS, 4))); t += n
json.dump(dict(fps=FPS, segs=segs, total=t, total_s=t / FPS), open(f'{out}/segs.json', 'w'), indent=1)
print('fps', FPS, 'edit length', round(t / FPS, 2), 's', flush=True)

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '12', '-g', '12', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', f'{out}/talk.mp4'], stdin=subprocess.PIPE)
lm = R.make_lm(); faces = []
if SLIM:
    import slim as SL
    lm2 = R.make_lm(); seg = SL.make_seg()
# scale to 1296 wide; crop/pad to 9:16 (SLIM adds a tiny 6% width squeeze for a slimmer body)
vf = f'scale={W}:2442:flags=lanczos,crop={W}:{H}:0:40' if SLIM else f'scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}'
for s in segs:
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f"{s['src']:.4f}", '-i', src, '-frames:v', str(s['n']), '-vf', vf,
        '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    prev = None; p2 = None; mk = None; miss = 0; last = None
    for i in range(s['n']):
        buf = dec.stdout.read(W * H * 3)
        frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3) if len(buf) == W * H * 3 else last
        last = frame
        p = R.detect(lm, cv2.resize(frame, (W // 2, H // 2), interpolation=cv2.INTER_AREA))
        if p is not None:
            p = p * 2; prev = p if prev is None else prev * 0.4 + p * 0.6; miss = 0
        else:
            miss += 1
            if miss > 6: prev = None
        if SLIM:
            img = SL.warp(frame, prev) if prev is not None else frame
            d = R.detect(lm2, cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA))
            if d is not None: d *= 2; p2 = d if p2 is None else p2 * 0.45 + d * 0.55
            res = R.retouch(img, p2)
            if p2 is not None: res = SL.contour(res, p2)
            m = SL.person_mask(seg, img); mk = m if mk is None else mk * 0.45 + m * 0.55
            res = SL.bg_soft(res, mk); track = p2
        else:
            res = R.retouch(frame, prev); track = prev
        if track is not None:
            o = track[R.OVAL]; faces.append([float(o[:, 0].mean() / W), float(o[:, 1].mean() / H), float((o[:, 0].max() - o[:, 0].min()) / W)])
        else: faces.append(None)
        enc.stdin.write(res.tobytes())
    dec.wait(); print('segment done', s['start_s'], flush=True)
enc.stdin.close(); enc.wait()
# per-segment average face centre -> paste into cues.ts FACE
face_seg = []
for s in segs:
    a = np.array([f for f in faces[s['start']:s['start'] + s['n']] if f]); face_seg.append([round(float(x), 3) for x in a.mean(0)[:2]] if len(a) else [0.5, 0.38])
json.dump(face_seg, open(f'{out}/face_seg.json', 'w'))
print('FACE =', json.dumps(face_seg))

def audio(dst, chain, extra):
    parts = []; fl = []
    for k, s in enumerate(segs):
        d = s['n'] / FPS
        parts += ['-ss', f"{s['src']:.4f}", '-t', f"{d:.4f}", '-i', src]
        fl.append(f"[{k}:a]aresample=48000,afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.4f}:d=0.03,apad=whole_dur={d:.4f},atrim=0:{d:.4f}[a{k}]")
    fl.append(''.join(f'[a{k}]' for k in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1{chain}[o]")
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + parts + ['-filter_complex', ';'.join(fl), '-map', '[o]'] + extra + [dst], check=True)
audio(f'{out}/talk.wav', ',highpass=f=85,afftdn=nr=10:nf=-45,equalizer=f=200:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1:g=2.5,'
      'acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=9,apad=pad_dur=3', ['-ar', '48000', '-c:a', 'pcm_s16le'])
audio(f'{out}/talk16.wav', '', ['-ar', '16000', '-ac', '1'])
print('done')
