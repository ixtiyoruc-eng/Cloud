# Gym brat reel ("Ozişda vs samirişda"): edit decision list from hand-picked takes.
# usage: build_edl.py ASR_DIR OUT_JSON
# ASR_DIR holds 16 kHz mono wavs named like the clips (A001_..._C644.wav). Word onsets inside each speech island are
# spread by syllable count and snapped to the nearest energy dip, which is close enough for per-word caption pops.
import json, sys, re, numpy as np, soundfile as sf, scipy.signal as ss

ASR, OUT = sys.argv[1:3]
CLIPS = {'C636': 'A001_11151945_C636', 'C637': 'A001_11151946_C637', 'C639': 'A001_11151946_C639',
         'C641': 'A001_11151947_C641', 'C642': 'A001_11151947_C642', 'C644': 'A001_11151950_C644'}
PRE, POST = 0.07, 0.10

# (clip, speech_a, speech_b, caption chunks; '*' marks the accent word of a chunk, '|' splits chunks)
# item / verdict tags drive the OZIŞ vs SAMIRIŞ tracker
SEGS = [
    dict(clip='C644', a=7.12, b=8.10, text='*Ozişda | va *samirişda', role='hook', zoom='close'),
    dict(clip='C644', a=8.14, b=8.81, text='*Geyner', item='Geyner', zoom='med'),
    dict(clip='C644', a=9.61, b=10.06, text='*Samirişda.', verdict=('Geyner', 'sam'), zoom='close'),
    dict(clip='C636', a=13.55, b=16.56, text='Köproq *kaloriya | olsa, | *muskullarni | va *vaznni | östiriş uçun.', info='geyner', zoom='wide'),
    dict(clip='C644', a=10.76, b=11.42, text='*L-karnitin', item='L-karnitin', zoom='med'),
    dict(clip='C644', a=11.91, b=12.34, text='*Ozişda.', verdict=('L-karnitin', 'oz'), zoom='close'),
    dict(clip='C637', a=5.54, b=8.86, text='Tanadagi | *yoğ foizini | *kamaytiriş | va vaznni | tezroq *yöqotiş | uçun.', info='karnitin', zoom='wide'),
    dict(clip='C644', a=14.55, b=15.06, text='*BCAA', item='BCAA', zoom='med'),
    dict(clip='C644', a=19.74, b=21.44, text='*Samirjakdam, | *oriqlijakdam | içsa böladi.', verdict=('BCAA', 'both'), zoom='close'),
    dict(clip='C641', a=1.68, b=6.16, text='Trenirovkadan keyin | *muskullarni | tezroq *tiklab, | ertangi trenirovkaga | tezroq *tayyor | böliş uçun.', info='bcaa', zoom='wide'),
    dict(clip='C644', a=22.11, b=22.54, text='*Kreatin', item='Kreatin', zoom='med'),
    dict(clip='C644', a=23.44, b=27.28, text='Oriqlayotgan | bölsangiz | *gidroxlorid, | vazn olmoqçi | bölsangiz | *monogidrat.', split=('Kreatin', 'Gidroxlorid', 'Monogidrat'), zoom='close'),
    dict(clip='C644', a=27.75, b=28.27, text='*Yoximbe', item='Yoximbe', zoom='med'),
    dict(clip='C644', a=28.65, b=29.30, text='Vazn *taşlaşda.', verdict=('Yoximbe', 'oz'), zoom='close'),
    dict(clip='C644', a=30.08, b=30.54, text='*Protein', item='Protein', zoom='med'),
    dict(clip='C644', a=31.05, b=35.66, text='Agar oriqlayotgan | bölsangiz | *izolyat protein, | vazn olmoqçi | bölsangiz | *konsentrat protein.', split=('Protein', 'Izolyat', 'Konsentrat'), zoom='wide'),
    dict(clip='C639', a=0.99, b=4.70, text='Kunlik *oqsilni | töldirib, | *muskullarni | tezroq östiriş | uçun.', info='protein', zoom='close'),
    dict(clip='C642', a=0.81, b=5.68, text='Özingizga kerakli | maʼlumotga ega | bölgan bölsangiz, | *Atlet.uz Xorazm | profiliga | *obuna böling | va videoga | *layk bosişni | yoddan çiqarmang.', role='cta', zoom='med'),
]
INFO = {  # side chips beside the head during the explanation lines: (trigger word regex, label, arrow)
    'geyner': [(r'kaloriya', 'Kaloriya', 'up'), (r'muskullarni', 'Muskul', 'up'), (r'vaznni', 'Vazn', 'up')],
    'karnitin': [(r'yoğ', 'Yoğ foizi', 'down'), (r'yöqotiş', 'Vazn', 'down')],
    'bcaa': [(r'tiklab', 'Tiklaniş', 'bolt'), (r'tayyor', 'Ertangi mashğulot', 'check')],
    'protein': [(r'oqsilni', 'Kunlik oqsil', 'check'), (r'muskullarni', 'Muskul', 'up')],
}

# ---------------- word onsets ----------------
env = {}
def energy(clip):
    if clip not in env:
        y, sr = sf.read(f'{ASR}/{CLIPS[clip]}.wav'); y = ss.sosfiltfilt(ss.butter(4, [120, 3800], 'band', fs=sr, output='sos'), y)
        h = 80; e = np.sqrt(np.convolve(y ** 2, np.ones(320) / 320, 'same')[::h]); env[clip] = (20 * np.log10(e + 1e-9), sr / h)
    return env[clip]
def islands(clip, a, b):
    db, fr = energy(clip); i0, i1 = int(a * fr), int(b * fr); d = db[i0:i1]; th = np.percentile(db, 90) - 22; on = d > th
    out = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            out.append([(i0 + i) / fr, (i0 + j) / fr]); i = j
        else: i += 1
    m = []
    for s, e in out:
        if m and s - m[-1][1] < 0.14: m[-1][1] = e
        else: m.append([s, e])
    return [x for x in m if x[1] - x[0] > 0.06] or [[a, b]]
def syl(w): return max(1, len(re.findall(r'[aeiouöAEIOUÖ]', w)) + (1 if w.upper() == 'BCAA' else 0))
def onsets(clip, a, b, words):
    db, fr = energy(clip); isl = islands(clip, a, b)
    tot_t = sum(e - s for s, e in isl); S = [syl(w) for w in words]; tot_s = sum(S)
    # map cumulative syllable fraction to speech time (islands concatenated)
    def at(frac):
        x = frac * tot_t
        for s, e in isl:
            if x <= e - s + 1e-6: return s + x
            x -= e - s
        return isl[-1][1]
    out = []; acc = 0
    for k, w in enumerate(words):
        t = at(acc / tot_s)
        if k:  # snap to the deepest dip within 90 ms
            i0, i1 = int((t - 0.09) * fr), int((t + 0.09) * fr)
            if i1 > i0: t = (i0 + int(np.argmin(db[i0:i1]))) / fr
            t = max(t, out[-1] + 0.12)
        out.append(round(t, 3)); acc += S[k]
    return out

def alpha(s): return s  # text is already written with ş ç ö ğ

# ---------------- layout ----------------
segs = []; t = 0.0
for i, s in enumerate(SEGS):
    si, so = s['a'] - PRE, s['b'] + POST
    seg = dict(id=f'S{i + 1:02d}', clip=CLIPS[s['clip']], src_in=round(si, 3), src_out=round(so, 3), out_start=round(t, 3), zoom=s['zoom'])
    t += so - si; seg['out_end'] = round(t, 3); segs.append(seg)
T = round(t, 3)

def o(i, src): return round(segs[i]['out_start'] + src - segs[i]['src_in'], 3)

captions = []; items = []; info = []; verd = []
for i, s in enumerate(SEGS):
    chunks = [c.strip() for c in s['text'].split('|')]
    words = []; acc = []
    for c in chunks:
        ws = c.split(); words += [w.lstrip('*') for w in ws]; acc.append(next((w.lstrip('*').strip('.,') for w in ws if w.startswith('*')), None))
    ons = onsets(s['clip'], s['a'], s['b'], words)
    k = 0
    for c, ac in zip(chunks, acc):
        ws = [w.lstrip('*') for w in c.split()]
        cw = [dict(w=w, t=o(i, ons[k + j])) for j, w in enumerate(ws)]; k += len(ws)
        captions.append(dict(seg=segs[i]['id'], words=cw, accent=ac, text=' '.join(ws), role=s.get('role')))
    if 'item' in s: items.append(dict(name=s['item'], t=o(i, ons[0])))
    if 'verdict' in s: verd.append(dict(item=s['verdict'][0], side=s['verdict'][1], label=s['verdict'][0], t=o(i, ons[0])))
    if 'split' in s:
        it, lo, hi = s['split']; flat = [w.strip('.,').lower() for w in words]
        for lab, side in ((lo, 'oz'), (hi, 'sam')):
            j = flat.index(lab.lower()); verd.append(dict(item=it, side=side, label=f'{it} · {lab}', t=o(i, ons[j])))
    if 'info' in s:
        flat = [w.strip('.,').lower() for w in words]
        for n, (rx, lab, ic) in enumerate(INFO[s['info']]):
            j = next(j for j, w in enumerate(flat) if re.search(rx, w))
            info.append(dict(t=o(i, ons[j]), label=lab, icon=ic, side='L' if n % 2 == 0 else 'R', group=s['info'], seg=segs[i]['id']))
for c_, n in zip(captions, captions[1:] + [None]):
    c_['out_start'] = round(c_['words'][0]['t'] - 0.07, 3)
    seg_end = next(s['out_end'] for s in segs if s['id'] == c_['seg'])
    c_['out_end'] = round(min(seg_end if n is None or n['seg'] != c_['seg'] else n['words'][0]['t'], c_['words'][-1]['t'] + 0.9), 3)
# info chips live until the end of their segment
for x in info: x['out_end'] = next(s['out_end'] for s in segs if s['id'] == x['seg'])

# ---------------- music: drop 1 on "Geyner" ----------------
B = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else None
geyner = items[0]['t']; drop1 = 18.217; P = 0.45455
offset = round(drop1 - geyner, 3)
beats_track = [drop1 + k * P for k in range(-60, 200)]
beats = [round(b - offset, 3) for b in beats_track if 0 <= b - offset <= T]
anchor = drop1 - offset
down = [b for b in beats if round((b - anchor) / P) % 4 == 0]
drops = [round(d - offset, 3) for d in (18.217, 43.671, 61.853, 83.672) if 0 <= d - offset <= T]

# summary MG over the first half of the CTA line, then back to the face for "obuna böling"
cta = segs[-1]; cta_caps = [c for c in captions if c['seg'] == cta['id']]
mg_a = cta['out_start']; mg_b = cta_caps[4]['out_end'] + 0.05
cuts = [dict(at=s['out_start'], prev=segs[i - 1]['id'], next=s['id']) for i, s in enumerate(segs) if i]
speech_mask = [[o(i, x['a']), o(i, x['b'])] for i, x in enumerate(SEGS)]
# cut transitions: into an item name = big move (blob / whip alternating), into a verdict = punch-in, into an explanation = streak / whip
big = ['blob', 'whipL', 'blob', 'whipR', 'blob', 'whipL']; nb = 0; ns = 0
for c in cuts:
    s = SEGS[int(c['next'][1:]) - 1]
    if 'item' in s: c['kind'] = big[nb % len(big)]; nb += 1
    elif 'verdict' in s or 'split' in s: c['kind'] = 'punch'
    elif s.get('role') == 'cta': c['kind'] = 'none'   # the summary MG covers this cut
    else: c['kind'] = ['streak', 'whipR', 'streak', 'whipL'][ns % 4]; ns += 1

# ---------------- SFX ----------------
ALIGN = {'hook_boom': 'peak', 'drop_hit': 'peak', 'air_whoosh': 'peak', 'whip_whoosh': 'peak', 'riser': 'end', 'zip_up': 'end'}
sfx = []
def X(t, cat, gain, why): sfx.append(dict(t=round(t, 3), category=cat, gain_db=gain, align=ALIGN.get(cat, 'onset'), why=why))
X(captions[0]['words'][0]['t'], 'hook_boom', -7, 'hook: OZIŞ slams in')
X(captions[1]['words'][-1]['t'], 'glitch_click', -12, 'hook: SAMIRIŞ + VS slam')
X(drops[0], 'riser', -16, 'riser into drop 1 (Geyner)')
for d in drops: X(d, 'drop_hit', -9, 'music drop')
CS = {'blob': ('shimmer_transition', -15), 'whipL': ('whip_whoosh', -12), 'whipR': ('whip_whoosh', -12), 'punch': ('sub_punch', -11), 'streak': ('glitch_click', -16)}
for c in cuts:
    if c['kind'] in CS: X(c['at'], *CS[c['kind']], f"cut {c['kind']} into {c['next']}")
for v in verd: X(v['t'] + 0.05, 'zip_up', -17, f"verdict chip '{v['label']}' flies to {v['side']}"); X(v['t'] + 0.42, 'soft_chime', -15, 'chip lands in tracker')
for x in info: X(x['t'], 'caption_tick', -16, f"info chip {x['label']}")
X(mg_a, 'air_whoosh', -10, 'summary MG in'); X(mg_a + 0.1, 'shimmer_transition', -14, 'summary MG in')
X(mg_b, 'whip_whoosh', -11, 'summary MG out')

edl = dict(output=dict(width=1080, height=1920, fps=30, duration=T), segments=segs, captions=captions, items=items, verdicts=verd, info=info,
           cuts=cuts, sfx=sorted(sfx, key=lambda e: e['t']), mg=dict(a=round(mg_a, 3), b=round(mg_b, 3)), speech_mask=speech_mask,
           music=dict(offset=offset, beats_out=beats, downbeats_out=down, drops_out=drops,
                      pieces=[dict(out_start=0, out_end=T, track_in=offset)], bed_gain_db=-17, duck_db=7, fade_in_s=0.25))
json.dump(edl, open(OUT, 'w'), indent=1, ensure_ascii=False)
print('duration', T, 'offset', offset, 'drops', drops)
for c in captions: print(f"{c['out_start']:6.2f} {c['text']}  [{c['accent']}]")
print('items', items); print('verdicts', verd); print('mg', edl['mg'])
