# Dinamik fon musiqasi (97 s, loop). Chiqish: mix.wav (48 kHz stereo).
# 48 takt x 4 hissa = 192 hissa / 97 s  ->  ~118.8 BPM, shuning uchun oxiri boshiga takt bo'yicha ulanadi.
import numpy as np, wave
from scipy.signal import butter, lfilter, lfilter_zi

SR = 48000; DUR = 97.0; N = int(SR * DUR)
BARS = 48; bar = DUR / BARS; beat = bar / 4; s16 = beat / 4
rng = np.random.default_rng(7)
mf = lambda m: 440 * 2 ** ((m - 69) / 12)

def bus(): return np.zeros((N, 2))
B = {k: bus() for k in ('kick', 'perc', 'bass', 'pad', 'arp', 'lead', 'fx')}

def add(name, sig, t0, pan=0.0, gain=1.0):
    i0 = int(round(t0 * SR)) % N; idx = (np.arange(len(sig)) + i0) % N
    gl = np.cos((pan + 1) * np.pi / 4) * gain; gr = np.sin((pan + 1) * np.pi / 4) * gain
    np.add.at(B[name][:, 0], idx, sig * gl); np.add.at(B[name][:, 1], idx, sig * gr)

def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e

def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2)); return lfilter(b, a, x)

def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)

# ---- Bo'limlar (taktlar), sahnalarga mos ----
# 0-1 intro (logo) | 2-5 bit kiradi | 6-12 tunnel, to'liq | 13-16 qorong'i sahna, yarim tezlik
# 17-25 oldin/keyin, to'liq + melodiya | 26-36 muruvvat, iliq/yengil | 37-44 cho'qqi | 45-47 outro (intro bilan ulanadi)
def section(b):
    if b < 2: return 'intro'
    if b < 6: return 'build'
    if b < 13: return 'full'
    if b < 17: return 'dark'
    if b < 26: return 'hook'
    if b < 37: return 'warm'
    if b < 45: return 'peak'
    return 'outro'

# Am9 - Fmaj7 - C(add9) - G6, har biri 2 takt
CH = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 64, 74], [55, 59, 62, 64, 67]]
chord = lambda b: CH[(b // 2) % 4]

# ---- Asboblar ----
def kick(g=1.0):
    n = int(.42 * SR); t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t * 38)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    s[:int(.004 * SR)] += rng.standard_normal(int(.004 * SR)) * .25  # klik
    return np.tanh(s * 1.6) * g

def clap():
    n = int(.32 * SR); t = np.arange(n) / SR; nz = rng.standard_normal(n)
    e = np.zeros(n)
    for d in (0, .011, .022):
        i = int(d * SR); e[i:] += np.exp(-(t[:n - i]) * (60 if d < .02 else 18))
    return hp(lp(nz * e, 6000), 900) * .7

def hat(open_=False):
    n = int((.22 if open_ else .05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * (14 if open_ else 90))

def bass_note(m, d):
    n = int(d * SR); t = np.arange(n) / SR; f = mf(m)
    s = np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2 * f * t) + .2 * np.sign(np.sin(2 * np.pi * f * t)) * .5
    return lp(s, 900) * env(n, .004, min(.06, d * .4))

def supersaw(freqs, d, fc):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in freqs:
        for det in (-.14, -.05, .05, .14):
            ff = f * 2 ** (det / 12); ph = rng.uniform(0, 1)
            s += 2 * ((ff * t + ph) % 1) - 1
    return lp(s / (len(freqs) * 4), fc) * env(n, .25, .8)

def pluck(f, d=.5, bright=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** (1.6 - .4 * bright) for k in range(1, 7)) * np.exp(-t * 9)
    s[:120] *= np.linspace(0, 1, 120); return s

def lead_note(m, d):
    n = int(d * SR); t = np.arange(n) / SR; f = mf(m)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1)
    ph = np.cumsum(f * vib) / SR
    s = sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, 9)) * .6
    return lp(s, 3800) * env(n, .015, min(.25, d * .5))

def riser(d):
    n = int(d * SR); x = np.linspace(0, 1, n); s = rng.standard_normal(n)
    out = np.zeros(n); blk = 2048; zi = None
    for i in range(0, n, blk):
        fc = 300 + 9000 * x[i] ** 2; b, a = butter(2, fc / (SR / 2))
        if zi is None: zi = lfilter_zi(b, a) * 0
        out[i:i + blk], zi = lfilter(b, a, s[i:i + blk], zi=zi)
    return out * x ** 2.2 * .6

def impact():
    n = int(1.6 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 3)
    cr = hp(rng.standard_normal(n), 4000) * np.exp(-t * 2.2) * .35
    return sub * .9 + cr

# ---- Ketma-ketlik ----
pump_times = []
HOOK = [(0, 4, 1.5), (1.5, 3, .5), (2, 2, 1), (3, 3, .5), (3.5, 4, .5), (4, 1, 2.5), (6.5, 2, 1.5)]  # (hissa, akkord tovushi, davomiylik)
ARP = [0, 2, 4, 2, 1, 3, 4, 3]

for b in range(BARS):
    sec = section(b); t0 = b * bar; ch = chord(b)
    # PAD (har 2 taktda)
    if b % 2 == 0:
        fc = {'intro': 1400, 'dark': 900, 'warm': 1800, 'outro': 1400}.get(sec, 2600)
        add('pad', supersaw([mf(m) for m in ch[:4]], 2 * bar + .6, fc), t0, 0, .55 * (2.6 if sec in ('intro', 'outro') else 1))
    # ARPEGGIO
    step = s16 if sec in ('full', 'hook', 'peak') else beat / 2
    cnt = int(round(bar / step))
    for k in range(cnt):
        m = ch[ARP[k % 8] % len(ch)] + 12 + (12 if (k // 8) % 2 and sec == 'peak' else 0)
        bright = .4 if sec in ('intro', 'outro', 'dark') else 1.0
        g = .16 if k % 4 == 0 else .11
        if sec == 'warm': g *= .9
        if sec in ('intro', 'outro'): g *= 2.4
        add('arp', pluck(mf(m), .45, bright), t0 + k * step, .45 * (1 if k % 2 else -1), g)
    # BAS
    root = ch[0] - 24 if ch[0] >= 52 else ch[0] - 12
    if sec in ('build', 'full', 'hook', 'peak', 'warm'):
        for k in range(8):  # 8-taliklar, sidechain bilan "pompalanadi"
            if sec == 'warm' and b < 30 and k % 2 == 0: continue
            m = root + (12 if sec in ('hook', 'peak') and k in (3, 7) else 0)
            add('bass', bass_note(m, beat / 2 * .92), t0 + k * beat / 2, 0, .55)
    elif sec == 'dark':
        add('bass', bass_note(root, bar * .95), t0, 0, .5)
    # BARABANLAR
    if sec in ('build', 'full', 'hook', 'peak') or (sec == 'warm' and b >= 30) or sec == 'dark':
        kicks = [0, 2] if sec == 'dark' else [0, 1, 2, 3]
        for k in kicks:
            g = .75 if sec == 'warm' else 1.0
            add('kick', kick(g), t0 + k * beat); pump_times.append(t0 + k * beat)
        if sec in ('full', 'hook', 'peak') or (sec == 'warm' and b >= 32):
            for k in (1, 3): add('perc', clap(), t0 + k * beat, .05, .55 if sec != 'warm' else .35)
        if sec == 'dark' and b % 2 == 1: add('perc', clap(), t0 + 2 * beat, 0, .4)
        hats = 16 if sec in ('full', 'hook', 'peak') else 8
        for k in range(hats):
            tt = t0 + k * bar / hats
            if hats == 8 and k % 2 == 0: continue
            acc = .22 if (k % 4 == 2 and hats == 16) or hats == 8 else .12
            add('perc', hat(), tt, .3, acc)
        if sec in ('hook', 'peak'):
            for k in range(4): add('perc', hat(True), t0 + k * beat + beat / 2, -.3, .12)
    # LEAD melodiya
    if sec in ('hook', 'peak') and b % 2 == 0:
        for (bp, ci, d) in HOOK:
            m = ch[ci % len(ch)] + 12
            while m < 72: m += 12
            add('lead', lead_note(m, d * beat), t0 + bp * beat, .1, .23)

# Riser va zarb: bo'limlar o'zgaradigan joylarda
for b in range(1, BARS):
    s0, s1 = section(b - 1), section(b)
    if s0 == s1: continue
    tb = b * bar
    if s1 in ('build', 'full', 'hook', 'peak'):
        add('fx', riser(bar * (2 if s1 in ('hook', 'peak') else 1)), tb - bar * (2 if s1 in ('hook', 'peak') else 1), 0, .5)
        add('fx', impact(), tb, 0, .7 if s1 in ('hook', 'peak') else .45)
    else:
        add('fx', impact()[: int(.9 * SR)] * env(int(.9 * SR), .002, .6), tb, 0, .3)
# Oxirgi takt -> loop boshiga yumshoq riser
add('fx', riser(bar), DUR - bar, 0, .25)

# ---- Sidechain "pompa" (kick bilan pad/bas/arp pasayadi) ----
pump = np.ones(N); t = np.arange(int(beat * SR)) / SR
shape = 1 - .62 * np.exp(-t / .09) * np.clip(t / .004, 0, 1) - .0
shape = np.minimum(shape, 1)
for tk in pump_times:
    i0 = int(round(tk * SR)) % N; idx = (np.arange(len(shape)) + i0) % N
    pump[idx] = np.minimum(pump[idx], shape)
for k in ('bass', 'pad', 'arp'):
    B[k] *= pump[:, None]

# ---- Aralash ----
G = {'kick': .9, 'perc': .55, 'bass': .8, 'pad': .5, 'arp': .55, 'lead': .55, 'fx': .5}
music = sum(B[k] * g for k, g in G.items())
# kick va bas uchun past chastota tozaligi
music = np.stack([hp(music[:, c], 28) for c in range(2)], 1)

# ---- SFX (sahna o'tishlari, eski versiyadagidek, biroz kuchliroq) ----
S = np.zeros((N, 2))
def addS(sig, t0, g=1.0, pan=0):
    i0 = int(t0 * SR) % N; idx = (np.arange(len(sig)) + i0) % N
    S[idx, 0] += sig * g * np.cos((pan + 1) * np.pi / 4); S[idx, 1] += sig * g * np.sin((pan + 1) * np.pi / 4)
def whoosh(d=.9):
    n = int(d * SR); x = np.linspace(0, 1, n); s = rng.standard_normal(n); e = np.sin(np.pi * x) ** 2
    out = (lp(s, 1200) * (1 - x) + hp(s, 3000) * x * .5) * e; return out / np.max(np.abs(out))
def chime(f):
    n = int(1.2 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 4)
def click():
    n = int(.05 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 2400 * t) * .6 + rng.standard_normal(n) * .3) * np.exp(-t * 140)
for c in [4.2, 12.6, 25.7, 34.9, 52.0, 74.0, 80.2, 90.2]: addS(whoosh(), c - .45, .16)
for i in range(3): addS(chime(1567.98), 27.6 + i * .9, .05)
for i in range(3): addS(whoosh(.5), 38.3 + i * 4.5 + 1.4, .07); addS(chime(1318.5), 38.3 + i * 4.5 + 2.2, .05)
for i in range(4): addS(click(), 83.6 + i * .18, .12)
addS(chime(1046.5), 91.6, .09); addS(chime(1568), 91.8, .06)

music /= np.max(np.abs(music)) * 1.1
mix = music * .8 + S
mix = np.tanh(mix * 1.15) / np.tanh(1.15)  # yumshoq limiter
mix /= np.max(np.abs(mix)) * 1.02
pcm = (mix * 32767).astype(np.int16)
w = wave.open('mix.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', round(60 / beat, 2), 'BPM')
