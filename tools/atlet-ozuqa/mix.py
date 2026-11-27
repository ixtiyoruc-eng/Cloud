# Speech-first mix for the Gym brat reel (v2, user: "the speech is not clear").
# Voice: segments with 8 ms fades, HPF, de-mud, presence and air lift, gentle compression, levelled.
# Music: beat-locked bed that ducks only a little under speech (-4 dB; v2 had -9 and the user could not hear the music) and also loses its 300 Hz-5 kHz band there (where speech lives),
# so the 808 stays but nothing masks the words. SFX: -4 dB when they land inside speech. Master -14 LUFS / -1.5 dBTP.
# usage: mix.py EDL.json AUDIO_DIR MUSIC.mp3 SFX_DIR OUT.wav   (AUDIO_DIR holds <clip>_48k.wav)
import json, sys, os, subprocess, numpy as np, soundfile as sf, librosa, scipy.signal as ss
EDLF, AUD, MP3, SFX, OUT = sys.argv[1:6]
edl = json.load(open(EDLF)); T = edl['output']['duration']; sr = 48000; N = int(round(T * sr)); tmp = os.path.dirname(OUT)
# ---- voice
voice = np.zeros(N); cache = {}; fd = int(0.008 * sr)
for s in edl['segments']:
    c = s['clip']
    if c not in cache: a, _ = sf.read(f'{AUD}/{c}_48k.wav' if os.path.exists(f'{AUD}/{c}_48k.wav') else f'{AUD}/voice_48k.wav'); cache[c] = a.mean(1) if a.ndim > 1 else a
    i0 = int(round(s['src_in'] * sr)); a = cache[c][max(0, i0):int(round(s['src_out'] * sr))].copy()
    if i0 < 0: a = np.concatenate([np.zeros(-i0), a])   # first segment may start a hair before 0
    a[:fd] *= np.linspace(0, 1, fd); a[-fd:] *= np.linspace(1, 0, fd)
    o = int(round(s['out_start'] * sr)); n = min(len(a), N - o); voice[o:o + n] += a[:n]
sf.write(f'{tmp}/voice_raw.wav', voice, sr)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{tmp}/voice_raw.wav', '-af',
    'highpass=f=90,equalizer=f=320:t=q:w=1.0:g=-3,equalizer=f=3200:t=q:w=1.2:g=3.5,equalizer=f=7500:t=q:w=1.0:g=2,'
    'acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=3,alimiter=limit=0.9:attack=3:release=50:level=false',
    '-ar', str(sr), f'{tmp}/voice.wav'], check=True)
voice, _ = sf.read(f'{tmp}/voice.wav'); voice = voice[:N] if len(voice) >= N else np.pad(voice, (0, N - len(voice)))
sp = np.abs(voice) > 1e-4; voice *= 10 ** (-16 / 20) / max(np.sqrt(np.mean(voice[sp] ** 2)), 1e-6)
# ---- speech envelope (smooth, with a little look-ahead so the music is already down when a word starts)
mask = np.zeros(N)
for a0, b0 in edl['speech_mask']: mask[max(0, int((a0 - 0.08) * sr)):int((b0 + 0.12) * sr)] = 1
win = ss.windows.hann(int(0.2 * sr)); win /= win.sum(); sm = np.clip(ss.fftconvolve(mask, win, 'same') * 1.4, 0, 1)
# ---- music
mu = edl['music']; m, _ = librosa.load(MP3, sr=sr, mono=False); m = m if m.ndim > 1 else np.vstack([m, m])
p = mu['pieces'][0]; a0 = int(round(p['track_in'] * sr)); music = m[:, a0:a0 + N]
if music.shape[1] < N: music = np.pad(music, ((0, 0), (0, N - music.shape[1])))
band = ss.sosfiltfilt(ss.butter(2, [300, 5000], 'band', fs=sr, output='sos'), music, axis=1)
music = music - band * (0.45 * sm)                                  # carve the speech band out of the music under words
env = 10 ** (-13 / 20) * 10 ** ((-4 * sm) / 20)
fi = int(0.2 * sr); fo = int(1.6 * sr); env[:fi] *= np.linspace(0, 1, fi); env[-fo:] *= np.linspace(1, 0, fo) ** 1.5
mix = np.vstack([voice, voice]) + music * env
# ---- SFX
# SFX_DIR = .claude/skills/sound-effects/sfx (repo pack); categories of the Gym brat EDL mapped onto it
SFXMAP = {'hook_boom': 'impact/fs-177242-cinematic-impact.ogg', 'drop_hit': 'impact/kenney-impact-impactpunch-heavy-000.ogg',
          'riser': 'kit/riser.ogg', 'whip_whoosh': 'whoosh/fs-683101-quick-woosh.ogg', 'air_whoosh': 'transition/fs-683096-woosh.ogg',
          'shimmer_transition': 'transition/fs-856168-cyberpunk-glitch-hologram-tran.ogg', 'sub_punch': 'impact/kenney-impact-impactsoft-heavy-000.ogg',
          'glitch_click': 'glitch/kenney-interface-glitch-002.ogg', 'zip_up': 'riser/kenney-digital-phaserup1.ogg',
          'soft_chime': 'ding/kenney-interface-confirmation-001.ogg', 'caption_tick': 'kit/tick.ogg'}
picks = {k: {'file': v} for k, v in SFXMAP.items()}
for ev in edl['sfx']:
    it = picks.get(ev['category'])
    if not it: continue
    a, _ = librosa.load(SFX + '/' + it['file'], sr=sr, mono=False); a = a if a.ndim > 1 else np.vstack([a, a])
    k = int(min(max(ev['t'], 0), T - 0.01) * sr); g = ev.get('gain_db', -12) - 4 * sm[k]
    a = a * 10 ** (g / 20); en = np.abs(a).max(0); al = ev.get('align', 'onset')
    k0 = int(np.argmax(ss.fftconvolve(en, np.ones(240) / 240, 'same'))) if al == 'peak' else a.shape[1] if al == 'end' else int(np.argmax(en > en.max() * 0.03))
    o = int(round(ev['t'] * sr)) - k0
    if o < 0: a = a[:, -o:]; o = 0
    n = min(a.shape[1], N - o)
    if n > 0: mix[:, o:o + n] += a[:, :n]
mix *= 0.5 / np.abs(mix).max()
sf.write(f'{tmp}/premaster.wav', mix.T, sr, subtype='FLOAT')
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{tmp}/premaster.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.84:attack=2:release=40:level=false,aresample=48000")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{tmp}/premaster.wav', '-af', af, '-ar', '48000', '-c:a', 'pcm_s24le', OUT], check=True)
# speech-to-music check: level of the music bed alone under speech vs the voice
vm = sp[:N] & (sm > 0.9); print('voice vs music under speech (dB):', round(20 * np.log10(np.sqrt(np.mean(voice[vm] ** 2)) / max(np.sqrt(np.mean((music[0] * env)[vm] ** 2)), 1e-9)), 1))
