# Videoga moslangan dinamik fon musiqasi (97 s, loop). Chiqish: mix.wav (48 kHz stereo).
# Har bir sahna almashinuvi kuchli hissaga (downbeat) tushadi: sahnalar orasida tempo ~117-123 BPM
# oralig'ida biroz o'zgaradi, shunda ekrandagi kesishlar aynan zarb bilan mos keladi.
# Ekrandagi har bir so'z chiqishiga arpeggio notasi, ikonkalarga "pop", kartochka/hisoblagich/logo
# harakatlariga alohida tovushlar qo'yilgan. Vaqtlar index.html dagi render() dan olingan.
import numpy as np, wave
from scipy.signal import butter, lfilter, lfilter_zi

SR = 48000; DUR = 97.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
mf = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- Tempo xaritasi: (boshlanish, tugash, hissalar soni, bo'lim) ----------
SEG = [(0.0, 4.5, 9, 'intro'),     # logo
       (4.5, 8.5, 8, 'build'),     # "Oyoq va tirnoq salomatligi"
       (8.5, 12.6, 8, 'build2'),   # "Mutaxassis qo'lida..."
       (12.6, 25.7, 26, 'full'),   # 3D tunnel + xizmatlar
       (25.7, 35.2, 19, 'dark'),   # "Sizda shu belgilar bormi?"
       (35.2, 38.3, 6, 'lift'),    # "Natijalar o'zi gapiradi"
       (38.3, 52.0, 27, 'hook'),   # oldin/keyin kartochkalar (har biri 9 hissa)
       (52.0, 74.0, 44, 'warm'),   # muruvvat
       (74.0, 80.6, 13, 'peak'),   # 14 700+ obunachi
       (80.6, 90.4, 20, 'peak2'),  # kontaktlar
       (90.4, 97.0, 13, 'outro')]  # logo yig'iladi -> boshiga ulanadi
BEATS = []  # (vaqt, hissa uzunligi, bo'lim, segment ichidagi indeks, segment indeksi)
for si, (a, b, n, sec) in enumerate(SEG):
    bl = (b - a) / n
    for j in range(n): BEATS.append((a + j * bl, bl, sec, j, si))

def seg_at(t):
    for si, (a, b, n, sec) in enumerate(SEG):
        if a <= t < b: return si, a, (b - a) / n
    return len(SEG) - 1, SEG[-1][0], (SEG[-1][1] - SEG[-1][0]) / SEG[-1][2]

def q16(t):  # mahalliy 16-talik to'rga yaqinlashtirish
    si, a, bl = seg_at(t); s = bl / 4
    return a + round((t - a) / s) * s

# ---------- Asosiy funksiyalar ----------
def bus(): return np.zeros((N, 2))
B = {k: bus() for k in ('kick', 'perc', 'bass', 'pad', 'arp', 'lead', 'fx', 'hit')}
def add(name, sig, t0, pan=0.0, gain=1.0):
    i0 = int(round(t0 * SR)) % N; idx = (np.arange(len(sig)) + i0) % N
    np.add.at(B[name][:, 0], idx, sig * np.cos((pan + 1) * np.pi / 4) * gain)
    np.add.at(B[name][:, 1], idx, sig * np.sin((pan + 1) * np.pi / 4) * gain)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e
def lp(x, fc, o=2): b, a = butter(o, min(fc, SR / 2 - 100) / (SR / 2)); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)

# ---------- Asboblar ----------
def kick(g=1.0):
    n = int(.42 * SR); t = np.arange(n) / SR; f = 46 + 110 * np.exp(-t * 38)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    s[:190] += rng.standard_normal(190) * .25; return np.tanh(s * 1.6) * g
def clap():
    n = int(.32 * SR); t = np.arange(n) / SR; nz = rng.standard_normal(n); e = np.zeros(n)
    for d in (0, .011, .022):
        i = int(d * SR); e[i:] += np.exp(-(t[:n - i]) * (60 if d < .02 else 18))
    return hp(lp(nz * e, 6000), 900) * .7
def snare16():
    n = int(.12 * SR); t = np.arange(n) / SR
    return hp(lp(rng.standard_normal(n), 7000), 1200) * np.exp(-t * 30) * .6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * .3
def hat(open_=False):
    n = int((.22 if open_ else .05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * (14 if open_ else 90))
def bass_note(m, d):
    n = int(d * SR); t = np.arange(n) / SR; f = mf(m)
    s = np.sin(2 * np.pi * f * t) + .45 * np.sin(4 * np.pi * f * t) + .1 * np.sign(np.sin(2 * np.pi * f * t))
    return lp(s, 900) * env(n, .004, min(.06, d * .4))
def supersaw(freqs, d, fc):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in freqs:
        for det in (-.14, -.05, .05, .14):
            ff = f * 2 ** (det / 12); s += 2 * ((ff * t + rng.uniform()) % 1) - 1
    return lp(s / (len(freqs) * 4), fc) * env(n, .2, .6)
def pluck(f, d=.5, bright=1.0, decay=9):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** (1.6 - .4 * bright) for k in range(1, 7)) * np.exp(-t * decay)
    s[:120] *= np.linspace(0, 1, 120); return s
def bell(f, d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + .3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)) * np.exp(-t * 3.2)
def pop():  # ikonka chiqishi
    n = int(.25 * SR); t = np.arange(n) / SR; f = 300 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
def lead_note(m, d):
    n = int(d * SR); t = np.arange(n) / SR; f = mf(m)
    ph = np.cumsum(f * (1 + .004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1))) / SR
    return lp(sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, 9)) * .6, 3800) * env(n, .015, min(.25, d * .5))
def riser(d):
    n = int(d * SR); x = np.linspace(0, 1, n); s = rng.standard_normal(n); out = np.zeros(n); zi = None
    for i in range(0, n, 2048):
        b, a = butter(2, (300 + 9000 * x[i] ** 2) / (SR / 2))
        if zi is None: zi = lfilter_zi(b, a) * 0
        out[i:i + 2048], zi = lfilter(b, a, s[i:i + 2048], zi=zi)
    return out * x ** 2.2 * .6
def impact(long=1.6):
    n = int(long * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 3)
    return sub * .9 + hp(rng.standard_normal(n), 4000) * np.exp(-t * 2.2) * .35
def tick():
    n = int(.03 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 3200 * t) * .5 + hp(rng.standard_normal(n), 5000) * .5) * np.exp(-t * 200)
def whoosh(d=.9):
    n = int(d * SR); x = np.linspace(0, 1, n); s = rng.standard_normal(n); e = np.sin(np.pi * x) ** 2
    o = (lp(s, 1200) * (1 - x) + hp(s, 3000) * x * .5) * e; return o / np.max(np.abs(o))

# ---------- Garmoniya ----------
CH = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 64, 74], [55, 59, 62, 64, 67]]  # Am9 Fmaj7 Cadd9 G6
def chord_at(si, j):
    if SEG[si][3] == 'dark': return [CH[0], CH[1]][(j // 8) % 2]
    return CH[(j // 8) % 4]

# ---------- Ritm bo'limi ----------
DRUMS = {'build', 'build2', 'full', 'dark', 'lift', 'hook', 'peak', 'peak2'}
FULL = {'full', 'hook', 'peak', 'peak2'}
pump_times = []
ARP = [0, 2, 4, 2, 1, 3, 4, 3]
HOOK = [(0, 4, 1.5), (1.5, 3, .5), (2, 2, 1), (3, 3, .5), (3.5, 4, .5), (4, 1, 2.5), (6.5, 2, 1.5)]
for (tb, bl, sec, j, si) in BEATS:
    n_seg = SEG[si][2]; ch = chord_at(si, j); left = n_seg - j  # anchorgacha qolgan hissalar
    warm_drums = sec == 'warm' and j >= 8
    # PAD: akkord almashganda yoki segment boshida
    if j % 8 == 0:
        d = min(8, n_seg - j) * bl + .5
        fc = {'intro': 1400, 'dark': 900, 'warm': 1900, 'outro': 1400, 'build': 1800}.get(sec, 2600)
        add('pad', supersaw([mf(m) for m in ch[:4]], d, fc), tb, 0, .55 * (2.6 if sec in ('intro', 'outro') else 1))
    # ARPEGGIO
    steps = 4 if sec in FULL or sec == 'lift' else 2
    for k in range(steps):
        idx = (j * steps + k)
        m = ch[ARP[idx % 8] % len(ch)] + 12 + (12 if sec in ('peak', 'peak2') and (idx // 8) % 2 else 0)
        g = (.16 if k == 0 else .11) * (2.4 if sec in ('intro', 'outro') else 1)
        add('arp', pluck(mf(m), .45, .4 if sec in ('intro', 'outro', 'dark') else 1.0), tb + k * bl / steps, .45 * (1 if idx % 2 else -1), g)
    # BAS
    root = ch[0] - 24 if ch[0] >= 52 else ch[0] - 12
    if sec in DRUMS - {'dark'} or warm_drums or (sec == 'warm' and j >= 4):
        for k in range(2):
            if sec == 'warm' and j < 16 and k == 0: continue
            m = root + (12 if sec in ('hook', 'peak', 'peak2') and k == 1 and j % 2 == 1 else 0)
            add('bass', bass_note(m, bl / 2 * .92), tb + k * bl / 2, 0, .55)
    elif sec == 'dark' and j % 4 == 0:
        add('bass', bass_note(root, min(4, left) * bl * .95), tb, 0, .5)
    # BARABANLAR
    if sec in DRUMS or warm_drums:
        fill = left == 1 and sec != 'dark' and si + 1 < len(SEG) and SEG[si + 1][3] in FULL | {'lift', 'build2'}
        if sec == 'dark':
            if j % 2 == 0: add('kick', kick(), tb); pump_times.append(tb)
            if j % 4 == 2: add('perc', clap(), tb, 0, .4)
        elif not fill:
            g = .75 if sec == 'warm' else (.85 if sec == 'build' else 1.0)
            add('kick', kick(g), tb); pump_times.append(tb)
            if (sec != 'build' and not (sec == 'warm' and j < 16)) and j % 2 == 1:
                add('perc', clap(), tb, .05, .35 if sec == 'warm' else .55)
        else:  # anchor oldidan 16-talik snare drobi
            for k in range(4): add('perc', snare16(), tb + k * bl / 4, 0, .25 + .1 * k)
        hats = 4 if sec in FULL else 2
        for k in range(hats):
            if hats == 2 and k == 0: continue
            add('perc', hat(), tb + k * bl / hats, .3, .22 if (hats == 2 or k == 2) else .12)
        if sec in ('hook', 'peak', 'peak2'): add('perc', hat(True), tb + bl / 2, -.3, .12)
    # LEAD melodiya (8 hissalik motiv)
    if sec in ('hook', 'peak2') and j % 8 == 0 and left >= 6:
        for (bp, ci, d) in HOOK:
            if bp >= left: break
            m = ch[ci % len(ch)] + 12
            while m < 72: m += 12
            add('lead', lead_note(m, d * bl), tb + bp * bl, .1, .22)

# ---------- Anchorlar: riser + zarb ----------
for si in range(1, len(SEG)):
    a, _, _, sec = SEG[si]
    big = sec in ('full', 'lift', 'hook', 'peak', 'warm')
    prev_bl = (SEG[si - 1][1] - SEG[si - 1][0]) / SEG[si - 1][2]
    rl = (4 if big else 2) * prev_bl
    add('fx', riser(rl), a - rl, 0, .5 if big else .3)
    add('fx', impact(1.6 if big else .9), a, 0, .7 if big else .4)
add('fx', riser(4 * SEG[-1][1] / 1 / SEG[-1][2] * 1.0 / 1), DUR - 4 * (SEG[-1][1] - SEG[-1][0]) / SEG[-1][2], 0, .25)  # loop boshiga

# ---------- Ekrandagi harakatlarga mos "hit"lar ----------
# kinetik qatorlar: (boshlanish, so'zlar soni, gap, ikonka indekslari)
LINES = [(4.5, 5, .13, [3]), (8.5, 5, .13, []), (13.3, 4, .13, [0]), (17.5, 5, .13, [0]), (21.7, 5, .13, [0]),
         (26.2, 4, .13, []), (31.0, 3, .13, []), (35.2, 3, .13, []), (37.8, 3, .06, []),
         (52.9, 1, .13, []), (53.2, 1, .13, []), (53.5, 2, .13, []), (53.9, 1, .13, []), (54.6, 3, .1, []),
         (75.2, 4, .12, [3]), (80.6, 2, .13, []), (81.4, 5, .16, [])]
for (a, n, gap, icons) in LINES:
    si, _, _ = seg_at(a); ch = chord_at(si, 0)
    tones = sorted(set([m + 24 for m in ch] + [m + 36 for m in ch[:2]]))
    for i in range(n):
        tt = q16(a + i * gap + .05)
        if i in icons:
            add('hit', pop(), tt, 0, .45); add('hit', bell(mf(ch[0] + 36), 1.0), tt, 0, .12)
        else:
            add('hit', pluck(mf(tones[(i * 2) % len(tones)]), .6, 1.0, 7), tt, .5 * (-1 if i % 2 else 1), .14)
# shisha kartochkalar (27.0/27.9/28.8) va yulduzchalar
for i, t0 in enumerate([27.0, 27.9, 28.8]): add('hit', bell(mf(76 + [0, 3, 7][i]), 1.6), q16(t0 + .1), (i - 1) * .4, .13)
for t0 in (27.4, 28.6): add('hit', bell(mf(88), .8), q16(t0 + .15), .6, .06)
# oldin/keyin: kartochka chiqishi (a) va aylanishi (a+1.5..2.8)
for i in range(3):
    a = 38.3 + i * 4.5
    add('hit', pop(), q16(a + .1), 0, .3)
    add('hit', whoosh(.8), a + 1.5, 0, .10)
    add('hit', bell(mf(81 + [0, 2, 4][i]), 1.6), q16(a + 2.2), 0, .15)
# muruvvat telefon ramkasi kirishi
add('hit', bell(mf(69 + 12), 2.0), q16(52.2), 0, .12)
# 14 700 hisoblagich: 74.6 -> 77.4 tez tiqillash, oxirida zarb
for k in range(28):
    x = k / 27; tt = 74.6 + 2.8 * (1 - (1 - x) ** 2)
    add('hit', tick(), tt, .2 * np.sin(k), .10 + .06 * x)
add('hit', bell(mf(84), 1.6), q16(77.4), 0, .16); add('hit', impact(.7), q16(77.4), 0, .25)
# kontakt tugmalari (83.6 + i*0.18)
for i in range(4): add('hit', pop(), 83.6 + i * .18, (i - 1.5) * .3, .28); add('hit', pluck(mf(84 + [0, 4, 7, 12][i]), .5), 83.6 + i * .18, 0, .1)
# logo yig'ilishi: barmoq nuqtalari, iz chizig'i, harflar, chiziq, halqa
for i in range(5): add('hit', pluck(mf(88 + [0, 2, 4, 7, 9][i]), .5, 1.0, 10), 90.5 + i * .09, (i - 2) * .2, .12)
add('hit', riser(1.3) * .5, 90.9, 0, .3)
for i in range(11): add('hit', tick(), 91.6 + i * .06, (i - 5) * .08, .08)
add('hit', bell(mf(69 + 24), 2.0), 92.6, 0, .15); add('hit', bell(mf(76 + 24), 2.0), 92.9, 0, .1)
add('hit', bell(mf(57 + 24), 2.5), 94.0, 0, .12)
# sahna o'tish whooshlari
for c in [4.2, 12.6, 25.7, 34.9, 52.0, 74.0, 80.2, 90.2]: add('hit', whoosh(), c - .45, 0, .14)

# ---------- Sidechain pompa ----------
pump = np.ones(N)
for tk in pump_times:
    _, _, bl = seg_at(tk); t = np.arange(int(bl * SR)) / SR
    shape = 1 - .62 * np.exp(-t / .09) * np.clip(t / .004, 0, 1)
    idx = (np.arange(len(shape)) + int(round(tk * SR))) % N; pump[idx] = np.minimum(pump[idx], shape)
for k in ('bass', 'pad', 'arp'): B[k] *= pump[:, None]

# ---------- Aralash ----------
G = {'kick': .9, 'perc': .55, 'bass': .8, 'pad': .5, 'arp': .5, 'lead': .55, 'fx': .5, 'hit': .9}
mix = sum(B[k] * g for k, g in G.items())
mix = np.stack([hp(mix[:, c], 28) for c in range(2)], 1)
mix /= np.max(np.abs(mix)) * .9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) * 1.02
w = wave.open('mix.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
print('ok; tempo:', ', '.join(f"{s[3]}={60 * s[2] / (s[1] - s[0]):.0f}" for s in SEG))
