# v2 edit: restore two script lines, drop the duplicate "kunlik 5 gram" take, re-lay the timeline,
# re-snap music/MG/SFX/camera, rebuild captions from words_v2.py. usage: build_v2.py EDIT_DIR
import json, sys, os, copy, numpy as np
E = sys.argv[1]; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from words_v2 import WORDS, ACCENTS, new_alphabet
v1 = json.load(open(E + '/edl.json')); B = json.load(open(E + '/beats.json')); V = json.load(open(E + '/vad_look.json'))
P = B['beat_period_s']; DROPS = B['bass_drops']
S1 = {s['id']: s for s in v1['segments']}
HOOK = 2.995                                   # out time of 'Kreatin' = drop 1 (hook unchanged)
grid = lambda k: HOOK + k * P
def nb(t): return grid(round((t - HOOK) / P))  # nearest out-grid beat

# ---------- 1. segments ----------
segs = []
def add(src_id, **kw):
    s = copy.deepcopy(S1[src_id]); s['v1_id'] = src_id; s.update(kw); segs.append(s)
for i in range(1, 7): add(f'S{i:02d}')
# N1: restored "Kunlik oqsil to'ldirish uchun" (c2 29.43-31.10, to camera). Length chosen so the
# gainer topic (next-but-one segment) starts exactly on an out-grid beat (= drop 2).
n1 = copy.deepcopy(S1['S06']); n1.update(id='N1', v1_id=None, src_in=29.36, src_out=None, beat_snap_ms=None,
    note="restored script line 'kunlik oqsil to'ldirish uchun' (cut for length in v1)")
n1['crop'] = dict(S1['S05']['crop'])          # base zoom 1.30 (S06 is a punch-in, S07 is base) -> use punch-in alternation
n1['crop'] = dict(S1['S06']['crop']); n1['crop']['zoom'] = 1.456
segs.append(n1)
for i in (7, 8, 9): add(f'S{i:02d}')
add('S10', src_in=None, note="extended back to restore 'Bu narsala ovqatda bor' (c4 0.95-2.38)")
for i in range(11, 23): add(f'S{i:02d}')
# S23 (c5 32.16-33.50, first 'kunlik 5 gram' take) removed; S24 holds the cleaner take that flows into 'kreatinni'.
add('S24', src_out=None, note="S23 (duplicate 'kunlik 5 gram', c5 32.16-33.50) removed; this take flows straight into 'kreatinni'")
add('S25')
# The S07/S08 punch-in alternation shifts by one after N1 (N1 is a punch-in, S07 base) -> unchanged pattern.

def lay():
    t = 0.0
    for s in segs:
        s['out_start'] = round(t, 4); t += s['src_out'] - s['src_in']; s['out_end'] = round(t, 4)
    return t
def find(i): return next(s for s in segs if s['id'] == i)
# solve free lengths so topics land on beats
n1['src_out'] = 31.17; find('S10')['src_in'] = 0.92; find('S24')['src_out'] = 37.726; lay()
gs = find('S09')['out_start']; d = nb(gs) - gs; n1['src_out'] = round(31.17 + d, 4); lay()
cs = find('S18')['out_start']; d = nb(cs) - cs
if d < 0: d += P
find('S10')['src_in'] = round(0.92 - d, 4); lay()
ct = find('S25')['out_start']; d = nb(ct) - ct; find('S24')['src_out'] = round(37.726 + d, 4); T = lay()
assert find('S10')['src_in'] > 0.80 and 31.1 < n1['src_out'] < 31.6 and find('S24')['src_out'] > 37.2
for s in segs[:]: s.pop('id', None)
for i, s in enumerate(segs): s['id'] = f'S{i+1:02d}'
for s in segs:
    s['src_in'] = round(s['src_in'], 4); s['src_out'] = round(s['src_out'], 4)
    s['out_start'] = round(s['out_start'], 3); s['out_end'] = round(s['out_end'], 3)
T = round(segs[-1]['out_end'], 3)
by_v1 = {s['v1_id']: s for s in segs if s.get('v1_id')}

def src2out(clip, t, tol=0.03):
    for s in segs:
        if s['clip'] == clip and s['src_in'] - tol <= t <= s['src_out'] + tol:
            return round(s['out_start'] + min(max(t, s['src_in']), s['src_out']) - s['src_in'], 3)
    return None
def v1map(t):
    """v1 out time -> v2 out time via the v1 segment it fell in (None if that footage was removed)."""
    for s in v1['segments']:
        if s['out_start'] - 1e-3 <= t < s['out_end'] + 1e-3:
            n = by_v1.get(s['id'])
            if n is None: return None
            src = s['src_in'] + (t - s['out_start'])
            return round(n['out_start'] + src - n['src_in'], 3)
    return None

def first(v1id): return by_v1[v1id]['out_start']
T_g, T_c, T_cta = first('S09'), first('S18'), first('S25')
for x in (T_g, T_c, T_cta): assert abs(nb(x) - x) < 0.002, x

# ---------- 2. music (same method as v1: one continuous grid, each topic opens on a drop) ----------
SEC = B['sections'] if isinstance(B['sections'], list) else []
def sec_end(drop): return next(x['end'] for x in SEC if abs(x['start'] - drop) < 0.01)
off1 = DROPS[0] - HOOK
D = [sec_end(dd) - dd for dd in DROPS]
TOP = [("hook", HOOK, 0), ("gainer", T_g, 1), ("creatine", T_c, 2), ("cta", T_cta, 3)]
END = T + 1.4
pieces = [dict(out_start=0.0, out_end=HOOK, track_in=round(off1, 3), track_out=DROPS[0], what="intro (cowbell/melody, no 808) under the hook question")]
for j, (name, Tt, k) in enumerate(TOP):
    dk = DROPS[k]
    if j + 1 == len(TOP):
        pieces.append(dict(out_start=Tt, out_end=END, track_in=dk, track_out=dk + END - Tt, what=f"drop {k+1} under {name}")); break
    Tn = TOP[j + 1][1]; nbt = int(round((Tn - Tt) / P)); nxt = DROPS[k + 1]
    Db = int(round(D[k] / P)); brk = int(round((nxt - dk) / P)) - Db; t = Tt
    if nbt >= Db + brk:
        loop = nbt - Db - brk
        pieces.append(dict(out_start=t, out_end=t + Db * P, track_in=dk, track_out=dk + Db * P, what=f"drop {k+1} ({name})")); t += Db * P
        while loop > 0:
            L = min(loop, 16); src = dk + 16 * P
            pieces.append(dict(out_start=t, out_end=t + L * P, track_in=src, track_out=src + L * P, what=f"loop {L} beats of drop {k+1}")); t += L * P; loop -= L
        pieces.append(dict(out_start=t, out_end=Tn, track_in=dk + Db * P, track_out=nxt, what=f"break before drop {k+2}"))
    else:
        lead = min(brk, max(0, nbt - 8)); body = nbt - lead
        pieces.append(dict(out_start=t, out_end=t + body * P, track_in=dk, track_out=dk + body * P, what=f"drop {k+1} ({name})")); t += body * P
        if lead: pieces.append(dict(out_start=t, out_end=Tn, track_in=nxt - lead * P, track_out=nxt, what=f"last {lead} beats of break before drop {k+2}"))
for p in pieces:
    for k in ('out_start', 'out_end', 'track_in', 'track_out'): p[k] = round(p[k], 3)
def track_to_out(tt): return [round(p['out_start'] + tt - p['track_in'], 3) for p in pieces if p['track_in'] <= tt < p['track_out']]
beats_out = sorted(set(x for b in B['beats'] for x in track_to_out(b) if x <= END))
cow_out = sorted(set(x for c in B['cowbell_strongest60'] for x in track_to_out(c)))
drops_out = [round(x[1], 3) for x in TOP]
def nearest(lst, t): a = np.array(lst); return float(a[np.argmin(abs(a - t))])

# ---------- 3. MG slots ----------
mg = copy.deepcopy(v1['mg_slots'])
MGcov = {'MG1': ('S11', 'S15'), 'MG2': ('S20', 'S22')}
for m in mg:
    a, b = MGcov[m['id']]; cs_ = by_v1[a]['out_start']; ce = by_v1[b]['out_end']
    land = nb(cs_) if nb(cs_) <= cs_ + 0.05 else nb(cs_) - P
    m['land'] = round(land, 3); m['out_start'] = round(land - 0.35, 3)
    e = nb(ce);  e = e if e >= ce - 0.02 else e + P
    m['out_end'] = round(e, 3); m['covers'] = [round(cs_, 3), round(ce, 3)]
    m['lookdown_out'] = [x for x in (v1map(m['lookdown_out'][0]), v1map(m['lookdown_out'][1]))]
    for i, c in enumerate(m['cards']):
        c['t'] = m['out_start'] if i == 0 else round(nb(v1map(c['t'])), 3)
    for i, c in enumerate(m['cards']):
        c['out_end'] = m['cards'][i + 1]['t'] if i + 1 < len(m['cards']) else m['out_end']
        c['title'] = new_alphabet(c['title']); c['subtitle'] = new_alphabet(c.get('subtitle', ''))
    m['title'] = m['cards'][0]['title']; m['subtitle'] = m['cards'][0]['subtitle']
for s in segs: s['covered_by_mg'] = s.get('v1_id') in ('S11','S12','S13','S14','S15','S20','S21','S22')

# ---------- 4. captions ----------
words = []
for clip, W in WORDS.items():
    for i, (w, t) in enumerate(W):
        if t is None:            # punctuation token: glue to previous word
            words[-1]['w'] += ' ' + w; continue
        o = src2out(clip, t)
        if o is None: continue
        seg = next(s for s in segs if s['clip'] == clip and s['src_in'] - .03 <= t <= s['src_out'] + .03)
        words.append(dict(w=w, t=max(o, seg['out_start']), seg=seg['id'], seg_end=seg['out_end']))
words.sort(key=lambda x: x['t'])
for i, w in enumerate(words):
    nxt = words[i + 1]['t'] if i + 1 < len(words) else T
    w['e'] = round(min(nxt, w['seg_end'] + 0.25, w['t'] + 0.9), 3)
caps = []; cur = []
def flush():
    if not cur: return
    txt = ' '.join(x['w'] for x in cur)
    acc = next((x for x in cur if x['w'].strip('.,?!:—').lower() in ACCENTS), None)
    caps.append(dict(out_start=round(cur[0]['t'] - 0.03, 3), out_end=cur[-1]['e'], text=new_alphabet(txt),
        words=[dict(w=new_alphabet(x['w']), t=round(x['t'] - 0.03, 3)) for x in cur],
        accent=new_alphabet(acc['w'].strip('.,?!:—')) if acc else None, accent_t=round(acc['t'], 3) if acc else None))
    cur.clear()
for w in words:
    if cur and (len(cur) >= 3 or len(' '.join(x['w'] for x in cur) + w['w']) > 19 or w['t'] - cur[-1]['e'] > 0.25 or w['seg'] != cur[-1]['seg'] and w['t'] - cur[-1]['t'] > 0.6):
        flush()
    cur.append(w)
    if w['w'][-1] in '.?!:,' and len(cur) >= 1 and (w['w'][-1] in '.?!:' or len(cur) >= 2): flush()
flush()
for i, c in enumerate(caps):
    if i + 1 < len(caps): c['out_end'] = round(min(max(c['out_end'], c['words'][-1]['t'] + 0.35), caps[i + 1]['out_start']), 3)
    c['over_mg'] = any(m['out_start'] <= c['out_start'] < m['out_end'] for m in mg)
    c['anim'] = "per-word: opacity 0->1 + blur 8->0 px + scale 0.96->1.0, 0.18 s, ease-out cubic-bezier(0.16,1,0.3,1); group exit: fade + blur 0->6 px 0.12 s"

# ---------- 5. UI cards, dumbbell, camera, SFX ----------
wt = {}
def word_t(clip, src): return src2out(clip, src)
ui = []
for u in v1['ui_cards']:
    u = copy.deepcopy(u); t = v1map(u['t'])
    if u['label'] == '5 g kreatin': t = word_t('c5', 34.18)
    if u['label'] == "Go'sht": u['label'] = 'Tovuq'; u['anchor_word'] = 'tovuqda'; t = word_t('c2', 6.10)
    if u['label'].startswith('Obuna'): u['label'] = 'Obuna · Atlet.uz Xorazm'
    u['t'] = t; u['snap_beat'] = round(nb(t), 3)
    oe = v1map(u['out_end'] - 1e-3); u['out_end'] = round(oe + 1e-3, 3) if oe is not None else None
    u['label'] = new_alphabet(u['label']); ui.append(u)
for u in ui:
    if u['out_end'] is None or u['out_end'] <= u['t']:
        u['out_end'] = by_v1['S24']['out_end']
# extra card for the restored line: no (restraint); restored lines get captions only.
db = []
for x in v1['dumbbell']:
    x = copy.deepcopy(x); x['t'] = round(v1map(x['t']), 3); x['out_end'] = round(v1map(x['out_end'] - 1e-3) + 1e-3, 3); db.append(x)
db[-1]['out_end'] = T
cam = []
for c in v1['camera']:
    c = copy.deepcopy(c); t = v1map(c['t'])
    if t is None: continue
    if c['type'] == 'micro_shake': t = nearest(drops_out, t)
    else:
        cand = [x for x in cow_out if abs(x - t) < 0.35]
        t = min(cand, key=lambda x: abs(x - t)) if cand else nearest(beats_out, t)
    c['t'] = round(t, 3); cam.append(c)
# pulses must not sit under a full-screen MG
cam = [c for c in cam if not any(m['out_start'] - .1 <= c['t'] <= m['out_end'] for m in mg)]
sfx = []
mgchange = {}
for ev in v1['sfx']:
    ev = copy.deepcopy(ev); why = ev['why']; t = v1map(ev['t'])
    if 'drop' in why or ev['category'] in ('hook_boom', 'riser', 'zip_up', 'drop_hit'):
        t = nearest(drops_out, ev['t'] if t is None else t)
    elif why.startswith('MG'):
        mid = why[:3]; m = next(x for x in mg if x['id'] == mid)
        if 'glides in' in why: t = m['land']
        elif 'card lands' in why: t = m['land'] + 0.12
        elif 'exits' in why: t = m['out_end'] - 0.25
        elif 'card change' in why:
            title = why.split('card change: ')[1]; t = next(c['t'] for c in m['cards'] if new_alphabet(title) == c['title'])
    elif "UI card" in why:
        lab = why.split("'")[1]
        u = next((u for u in ui if u['label'] == new_alphabet(lab)), None)
        if lab == "Go'sht": continue
        t = u['t'] if u else t
    elif "caption accent" in why:
        if "'kreatinni'" in why: t = word_t('c5', 34.74)
    if t is None: continue
    ev['t'] = round(t, 3); sfx.append(ev)
# 'Tovuq' chip gets the same caption-tick treatment v1 gave food chips (none) -> nothing added.
sfx.sort(key=lambda e: e['t'])

# ---------- 6. speech mask (for ducking) ----------
mask = []
for s in segs:
    for a, b in V[s['clip']]['speech']:
        a2, b2 = max(a, s['src_in']), min(b, s['src_out'])
        if b2 > a2: mask.append([round(s['out_start'] + a2 - s['src_in'], 3), round(s['out_start'] + b2 - s['src_in'], 3)])

# ---------- 7. hook face tracking flag ----------
for s in segs:
    if s.get('v1_id') in ('S01', 'S02'):
        s['tracking'] = "face-follow: per-frame face centre (MediaPipe) -> Savitzky-Golay (31 f) + One-Euro, max pan 90 px/s (source px), punch-in kept"
    s['camera'] = "slow push-in +2% across the segment (ease in-out sine)"

out = copy.deepcopy(v1)
out.update(version=2, generated="2026-11-15", segments=segs, mg_slots=mg, captions=caps, ui_cards=ui, dumbbell=db, camera=cam, sfx=sfx, speech_mask=mask)
out['output'] = dict(width=1080, height=1920, fps=30, duration=T, preview="preview_540.mp4 540x960")
mu = out['music']; mu.update(pieces=pieces, drops_out=drops_out, beats_out=beats_out, cowbell_out=cow_out, offset_s=round(off1, 3))
out['poster_t'] = v1map(v1['poster_t'])
out['cuts'] = [dict(at=segs[i]['out_end'], between=[segs[i]['id'], segs[i+1]['id']],
                    type='take/clip change' if segs[i]['clip'] != segs[i+1]['clip'] or abs(segs[i+1]['src_in'] - segs[i]['src_out']) > 1 else 'jump cut (pause/breath removed)')
               for i in range(len(segs) - 1)]
out['cut_log'] = [c for c in v1['cut_log']] + [dict(clip='c5', src=[32.16, 33.66], why="v2: duplicate 'kunlik 5 gram' (first take) removed")]
os.makedirs(E + '/v2', exist_ok=True)
json.dump(out, open(E + '/v2/edl.json', 'w'), ensure_ascii=False, indent=1)
print('duration', T, 'segments', len(segs), 'captions', len(caps), 'sfx', len(sfx), 'camera', len(cam))
print('topics', HOOK, T_g, T_c, T_cta, 'drops_out', drops_out)
for s in segs: print(s['id'], s.get('v1_id'), s['clip'], s['src_in'], s['src_out'], s['out_start'], s['out_end'], s['crop']['zoom'], s['covered_by_mg'])
for m in mg: print(m['id'], m['out_start'], m['land'], m['out_end'], m['covers'], [(c['t'], c['title']) for c in m['cards']])
for p in pieces: print(p)
