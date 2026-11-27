# Atlet.uz "4 ta sport ozuqa" reel (2026-11-27): edit decision list for the single take IMG_1020.MOV (1080x1920, 23 s).
# Same look as the Gym brat reel (../gym-brat/), but the story is a Q&A: L-karnitin? / protein? / geyner? / BCAA? + CTA.
# The OZIŞ/SAMIRIŞ tracker becomes OZUQA n/4 (left pill) + the current product (right pill); every product name sends a
# chip into the right pill. Word onsets come from whisper (word mode) on the take, checked by ear-free energy islands.
# usage: build_edl.py OUT_JSON
import json, sys

OUT = sys.argv[1]
CLIP = 'IMG_1020'
PRE, POST = 0.07, 0.10
# (speech a, b in source seconds; words with source onsets; '*' = accent word; '|' splits caption chunks)
SEGS = [
    dict(a=0.06, b=0.66, text='*L-karnitin?', on=[0.10], item='L-karnitin', zoom='close'),
    dict(a=1.06, b=4.00, text='Tanadagi | *yoğ foizini | *kamaytiriş | va vaznni | tezroq *yöqotiş | uçun.',
         on=[1.06, 1.20, 1.36, 1.81, 2.52, 2.67, 2.97, 3.30, 3.67], info='karnitin', zoom='wide'),
    dict(a=4.16, b=4.75, text='Va | *protein?', on=[4.16, 4.30], item='Protein', zoom='med'),
    dict(a=5.08, b=7.51, text='Kunlik *oqsilni | töldirib, | *muskullarni | tezroq *östiriş | uçun.',
         on=[5.08, 5.30, 5.60, 5.85, 6.38, 6.75, 7.11], info='protein', zoom='close'),
    dict(a=7.79, b=8.11, text='*Geyner?', on=[7.80], item='Geyner', zoom='med'),
    dict(a=8.82, b=11.82, text='Köproq *kaloriya | hisobiga | *muskullarni | va *vaznni | östiriş uçun.',
         on=[8.82, 9.02, 9.22, 9.48, 10.13, 10.27, 10.73, 11.32], info='geyner', zoom='wide'),
    dict(a=12.07, b=12.38, text='*BCAA?', on=[12.08], item='BCAA', zoom='med'),
    dict(a=12.96, b=17.45, text='Trenirovkadan keyin | *muskullarni | tezroq *tiklab, | ertangi trenirovkaga | tezroq *tayyor | böliş uçun.',
         on=[12.96, 13.40, 13.94, 14.51, 14.87, 15.47, 15.78, 16.35, 16.57, 16.79, 17.05], info='bcaa', zoom='close'),
    dict(a=17.70, b=22.85, text='Özingizga kerakli | maʼlumotga ega | bölgan bölsangiz, | *Atlet.uz Xorazm | profiliga | *obuna böling | va videoga | *layk bosişni | yoddan çiqarmang.',
         on=[17.70, 18.00, 18.39, 18.72, 18.88, 19.15, 19.42, 19.80, 20.18, 20.67, 21.00, 21.42, 21.58, 21.74, 21.92, 22.20, 22.47], role='cta', zoom='med'),
]
INFO = {  # chips beside / under the head during the explanation lines: (word regex, label, icon)
    'karnitin': [(r'yoğ', 'Yoğ foizi', 'down'), (r'yöqotiş', 'Vazn', 'down')],
    'protein': [(r'oqsilni', 'Kunlik oqsil', 'check'), (r'muskullarni', 'Muskul', 'up')],
    'geyner': [(r'kaloriya', 'Kaloriya', 'up'), (r'muskullarni', 'Muskul', 'up'), (r'vaznni', 'Vazn', 'up')],
    'bcaa': [(r'tiklab', 'Tiklaniş', 'bolt'), (r'tayyor', 'Ertangi mashğulot', 'check')],
}
import re

segs = []; t = 0.0
for i, s in enumerate(SEGS):
    si, so = s['a'] - PRE, s['b'] + POST
    seg = dict(id=f'S{i + 1:02d}', clip=CLIP, src_in=round(si, 3), src_out=round(so, 3), out_start=round(t, 3), zoom=s['zoom'])
    t += so - si; seg['out_end'] = round(t, 3); segs.append(seg)
T = round(t, 3)
def o(i, src): return round(segs[i]['out_start'] + src - segs[i]['src_in'], 3)

captions = []; items = []; info = []; verd = []
for i, s in enumerate(SEGS):
    chunks = [c.strip() for c in s['text'].split('|')]
    words = [w.lstrip('*') for c in chunks for w in c.split()]
    assert len(words) == len(s['on']), (i, words, s['on'])
    ons = s['on']; k = 0
    for c in chunks:
        ws = c.split(); ac = next((w.lstrip('*').strip('.,?') for w in ws if w.startswith('*')), None)
        ws = [w.lstrip('*') for w in ws]
        cw = [dict(w=w, t=o(i, ons[k + j])) for j, w in enumerate(ws)]; k += len(ws)
        captions.append(dict(seg=segs[i]['id'], words=cw, accent=ac, text=' '.join(ws), role=s.get('role')))
    if 'item' in s:
        tt = o(i, ons[-1]); items.append(dict(name=s['item'], t=tt))
        verd.append(dict(item=s['item'], side='sam', label=s['item'], t=round(tt + 0.12, 3)))
    if 'info' in s:
        flat = [w.strip('.,?').lower() for w in words]
        for n, (rx, lab, ic) in enumerate(INFO[s['info']]):
            j = next(j for j, w in enumerate(flat) if re.search(rx, w))
            info.append(dict(t=o(i, ons[j]), label=lab, icon=ic, side='L' if n % 2 == 0 else 'R', group=s['info'], seg=segs[i]['id']))
for c_, n in zip(captions, captions[1:] + [None]):
    c_['out_start'] = round(c_['words'][0]['t'] - 0.07, 3)
    seg_end = next(s['out_end'] for s in segs if s['id'] == c_['seg'])
    c_['out_end'] = round(min(seg_end if n is None or n['seg'] != c_['seg'] else n['words'][0]['t'], c_['words'][-1]['t'] + 0.9), 3)
for x in info: x['out_end'] = next(s['out_end'] for s in segs if s['id'] == x['seg'])

# ---------------- music: same phonk track, drop 1 lands on the first word ----------------
drop1 = 18.217; P = 0.45455
offset = round(drop1 - captions[0]['words'][0]['t'], 3)
beats = [round(drop1 + k * P - offset, 3) for k in range(-60, 200) if 0 <= drop1 + k * P - offset <= T]
anchor = drop1 - offset
down = [b for b in beats if round((b - anchor) / P) % 4 == 0]
drops = [round(d - offset, 3) for d in (18.217, 43.671, 61.853, 83.672) if 0 <= d - offset <= T]

# summary MG over the first half of the CTA ("Özingizga kerakli maʼlumotga ega bölgan bölsangiz"), back to the face for "Atlet.uz"
cta = segs[-1]; cta_caps = [c for c in captions if c['seg'] == cta['id']]
mg_a = cta['out_start']; mg_b = cta_caps[2]['out_end'] + 0.05
cuts = [dict(at=s['out_start'], prev=segs[i - 1]['id'], next=s['id']) for i, s in enumerate(segs) if i]
speech_mask = [[o(i, x['a']), o(i, x['b'])] for i, x in enumerate(SEGS)]
big = ['blob', 'whipL', 'whipR']; nb = 0; ns = 0
for c in cuts:
    s = SEGS[int(c['next'][1:]) - 1]
    if 'item' in s: c['kind'] = big[nb % len(big)]; nb += 1
    elif s.get('role') == 'cta': c['kind'] = 'none'
    else: c['kind'] = ['punch', 'streak'][ns % 2]; ns += 1

ALIGN = {'hook_boom': 'peak', 'drop_hit': 'peak', 'air_whoosh': 'peak', 'whip_whoosh': 'peak', 'riser': 'end', 'zip_up': 'end'}
sfx = []
def X(t, cat, gain, why): sfx.append(dict(t=round(t, 3), category=cat, gain_db=gain, align=ALIGN.get(cat, 'onset'), why=why))
X(captions[0]['words'][0]['t'], 'hook_boom', -8, 'hook: L-karnitin slams in')
for d in drops: X(d, 'drop_hit', -10, 'music drop')
CS = {'blob': ('shimmer_transition', -15), 'whipL': ('whip_whoosh', -12), 'whipR': ('whip_whoosh', -12), 'punch': ('sub_punch', -12), 'streak': ('glitch_click', -16)}
for c in cuts:
    if c['kind'] in CS: X(c['at'], *CS[c['kind']], f"cut {c['kind']} into {c['next']}")
for v in verd: X(v['t'] + 0.05, 'zip_up', -18, f"chip '{v['label']}' flies to the pill"); X(v['t'] + 0.42, 'soft_chime', -16, 'chip lands')
for x in info: X(x['t'], 'caption_tick', -17, f"info chip {x['label']}")
X(mg_a, 'air_whoosh', -10, 'summary MG in'); X(mg_b, 'whip_whoosh', -11, 'summary MG out')

edl = dict(output=dict(width=1080, height=1920, fps=30, duration=T), segments=segs, captions=captions, items=items, verdicts=verd, info=info,
           cuts=cuts, sfx=sorted(sfx, key=lambda e: e['t']), mg=dict(a=round(mg_a, 3), b=round(mg_b, 3)), speech_mask=speech_mask,
           music=dict(offset=offset, beats_out=beats, downbeats_out=down, drops_out=drops,
                      pieces=[dict(out_start=0, out_end=T, track_in=offset)]))
json.dump(edl, open(OUT, 'w'), indent=1, ensure_ascii=False)
print('duration', T, 'offset', offset, 'drops', drops, 'mg', edl['mg'])
for c in captions: print(f"{c['out_start']:6.2f} {c['text']}  [{c['accent']}]")
