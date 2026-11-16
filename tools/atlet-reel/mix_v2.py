# Audio for v2: voice stem (segments, 6 ms fades, HPF + gentle compression), beat-locked music edits from
# edl.music.pieces (12 ms crossfades), ducking under speech, SFX picks from the pack manifest, then a
# two-pass loudnorm master to -15 LUFS / -1.5 dBTP. usage: mix_v2.py EDIT_DIR MUSIC_MP3 SFX_DIR OUT_WAV [--edl EDL.json]
# (v3 passes --edl edit/v3/pub/edl.json, which adds SFX for the new whip/blob/streak transitions)
import json, sys, os, subprocess, numpy as np, soundfile as sf, librosa, scipy.signal as ss
E, MP3, SFX, OUT = sys.argv[1:5]
edl = json.load(open(sys.argv[sys.argv.index('--edl') + 1] if '--edl' in sys.argv else E + '/v2/edl.json')); T = edl['output']['duration']; sr = 48000; N = int(round(T * sr))
tmp = os.path.dirname(OUT)
# ---- voice
voice = np.zeros(N); cache = {}; fd = int(0.006 * sr)
for s in edl['segments']:
    c = s['clip']
    if c not in cache:
        a, _ = sf.read(f"{E}/audio/{c}_48k.wav"); cache[c] = a.mean(1) if a.ndim > 1 else a
    a = cache[c][int(round(s['src_in'] * sr)):int(round(s['src_out'] * sr))].copy()
    a[:fd] *= np.linspace(0, 1, fd); a[-fd:] *= np.linspace(1, 0, fd)
    o = int(round(s['out_start'] * sr)); n = min(len(a), N - o); voice[o:o + n] += a[:n]
sf.write(f'{tmp}/voice_raw.wav', voice, sr)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{tmp}/voice_raw.wav', '-af',
    'highpass=f=85,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=4200:t=q:w=1.5:g=1.5,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=2',
    '-ar', str(sr), f'{tmp}/voice.wav'], check=True)
voice, _ = sf.read(f'{tmp}/voice.wav'); voice = voice[:N] if len(voice) >= N else np.pad(voice, (0, N - len(voice)))
sp = np.abs(voice) > 1e-4; voice *= 10 ** (-19 / 20) / max(np.sqrt(np.mean(voice[sp] ** 2)), 1e-6)
# ---- music edits
mu = edl['music']; m, _ = librosa.load(MP3, sr=sr, mono=False); m = m if m.ndim > 1 else np.vstack([m, m])
music = np.zeros((2, N)); xf = int(0.012 * sr)
for p in mu['pieces']:
    o0 = int(round(p['out_start'] * sr)); o1 = min(N, int(round(p['out_end'] * sr)))
    if o0 >= N: break
    a0 = int(round(p['track_in'] * sr)) - xf // 2
    seg = m[:, max(0, a0):max(0, a0) + (o1 - o0) + xf].copy()
    L = seg.shape[1]; w = np.ones(L); w[:xf] = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2; w[-xf:] = np.cos(np.linspace(0, np.pi / 2, xf)) ** 2
    st = o0 - xf // 2; i0 = max(0, -st); st = max(0, st); n = min(L - i0, N - st)
    music[:, st:st + n] += (seg * w)[:, i0:i0 + n]
env = np.ones(N) * 10 ** (mu['bed_gain_db'] / 20)
mask = np.zeros(N)
for a0, b0 in edl['speech_mask']: mask[int(a0 * sr):int(b0 * sr)] = 1
win = ss.windows.hann(int(0.25 * sr)); win /= win.sum(); sm = np.clip(ss.fftconvolve(mask, win, 'same') * 1.6, 0, 1)
env *= 10 ** ((-mu['duck_db'] * sm) / 20)
fi = int(mu['fade_in_s'] * sr); fo = int(1.6 * sr); env[:fi] *= np.linspace(0, 1, fi); env[-fo:] *= np.linspace(1, 0, fo) ** 1.5
mix = np.vstack([voice, voice]) + music * env
# ---- SFX
man = json.load(open(SFX + '/manifest.json')); picks = {}
for cat, v in man.items():
    if isinstance(v, list):
        for it in v:
            if it.get('pick'): picks[cat] = it
        if cat not in picks and v: picks[cat] = v[0]
used = []
for ev in edl['sfx']:
    it = picks.get(ev['category'])
    if not it: print('no pick for', ev['category']); continue
    a, _ = librosa.load(SFX + '/' + it['file'], sr=sr, mono=False); a = a if a.ndim > 1 else np.vstack([a, a])
    a = a * 10 ** (ev.get('gain_db', -12) / 20); en = np.abs(a).max(0); al = ev.get('align', 'onset')
    if al == 'peak': k0 = int(np.argmax(ss.fftconvolve(en, np.ones(240) / 240, 'same')))
    elif al == 'end': k0 = a.shape[1]
    else: k0 = int(np.argmax(en > en.max() * 0.03))
    o = int(round(ev['t'] * sr)) - k0
    if o < 0: a = a[:, -o:]; o = 0
    n = min(a.shape[1], N - o)
    if n > 0: mix[:, o:o + n] += a[:, :n]; used.append(ev['category'])
pk = np.abs(mix).max(); mix *= 0.5 / pk
sf.write(f'{tmp}/premaster.wav', mix.T, sr, subtype='FLOAT')
# ---- master: two-pass loudnorm (linear) + true-peak limiter
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{tmp}/premaster.wav', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.82:attack=2:release=40:level=false,aresample=48000")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{tmp}/premaster.wav', '-af', af, '-ar', '48000', '-c:a', 'pcm_s24le', OUT], check=True)
print('sfx', len(used), 'premaster', j['input_i'], 'LUFS')
