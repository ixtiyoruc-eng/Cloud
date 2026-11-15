import json,sys
E=sys.argv[1]; sys.path.insert(0,E+'/scripts'); from content import KEEP
e=json.load(open(E+'/edl.json')); b=json.load(open(E+'/beats.json')); st=json.load(open(E+'/stage1.json'))
f=lambda t:f"{t:6.2f}"
L=[]; A=L.append
T=e['output']['duration']
A("# Reel edit plan: sport nutrition (protein / geyner / kreatin)\n")
A(f"- Output: 1080x1920, 30 fps, **{T:.2f} s**; preview `preview.mp4` 540x960 ({e['output']['preview']}).")
A(f"- Language: Uzbek (Khorezm dialect). Whisper large-v3 auto-detect said Kazakh; transcribed with `-l uz` in VAD chunks, then rewritten to literary Uzbek Latin by hand. Captions use the cleaned text.")
A(f"- {len(e['segments'])} segments, {len(e['cuts'])} cuts ({sum(1 for c in e['cuts'] if c['type'].startswith('take'))} take/clip changes, {sum(1 for c in e['cuts'] if c['type'].startswith('jump'))} jump cuts inside a take); {len(e['mg_slots'])} full-screen MG slots; {len(e['captions'])} caption chunks; {len(e['ui_cards'])} UI-card triggers; {len(e['sfx'])} SFX events; {len(e['camera'])} camera hits.")
A(f"- Source frame: {e['sources']['frame']}")
A(f"- Music: {b['tempo_bpm']:.2f} BPM (beat {b['beat_period_s']:.4f} s), grid fitted to the 808 hits (median residual {b['grid_fit_residual_ms_median']} ms); drops in the track at {', '.join(str(x) for x in b['bass_drops'])} s. Music offset {e['music']['offset_s']} s so drop 1 lands on 'Kreatin' (out {e['music']['drops_out'][0]:.3f} s). Three beat-locked music edits so topic 2, topic 3 and the CTA each open on a drop (out {', '.join(f'{x:.3f}' for x in e['music']['drops_out'][1:])} s). Bed {e['music']['bed_gain_db']} dB, ducked {e['music']['duck_db']} dB under speech, preview mixed to -16 LUFS.\n")
A("## Story and kept text (output timeline)\n")
A("| Out (s) | Src | Section | Kept text | Note |\n|---|---|---|---|---|")
for k in KEEP:
    ss=[s for s in e['segments'] if s['range']==k['id']]
    r=[x for x in st['ranges'] if x['id']==k['id']][0]
    A(f"| {ss[0]['out_start']:.2f}-{ss[-1]['out_end']:.2f} | {k['clip']} {ss[0]['src_in']:.2f}-{ss[-1]['src_out']:.2f} | {k['section']} | {' '.join(w['w'] for w in r['words'])} | {k['why']} |")
A("\n## What was cut and why (source times)\n")
for c in e['cut_log']: A(f"- {c['clip']} {c['src'][0]:.2f}-{c['src'][1]:.2f} s: {c['why']}")
A("- Plus every pause/breath ≥0.12 s inside kept takes (VAD gaps) and quiet dips ≥0.22 s (breaths/hesitations), see `cuts` in edl.json.")
A("\n## Segments, crops and punch-ins\n")
A("Crop in displayed 3024x4032 px. Zoom alternates 1.30 / 1.456 (x1.12) between consecutive on-camera cuts; MG-covered segments stay at 1.30. Every segment also gets a slow +2% push-in.\n")
A("| ID | Out | Src | Crop x,y,w,h | Zoom | MG cover | Beat snap |\n|---|---|---|---|---|---|---|")
for s in e['segments']:
    c=s['crop']; A(f"| {s['id']} | {s['out_start']:.2f}-{s['out_end']:.2f} | {s['clip']} {s['src_in']:.2f}-{s['src_out']:.2f} | {c['x']},{c['y']},{c['w']},{c['h']} | {c['zoom']} | {'yes' if s['covered_by_mg'] else ''} | {'' if s['beat_snap_ms'] is None else str(s['beat_snap_ms'])+' ms'} |")
sn=[s['beat_snap_ms'] for s in e['segments'][:-1] if s['beat_snap_ms'] is not None]
A(f"\nBeat snapping: {len(sn)} of {len(e['segments'])-1} boundaries moved onto a beat (shifts {min(sn)}..{max(sn)} ms); the rest sit inside continuous speech where any shift >30 ms would clip a word, so they stay on the speech edge. Topic starts are on the beat (drop) within ≤50 ms (the pre-roll pad before the first word).")
A("\n## Full-screen motion-graphic slots (cover phone/notes reading)\n")
for m in e['mg_slots']:
    A(f"**{m['id']}  {m['out_start']:.2f}-{m['out_end']:.2f} s** (look-down measured {m['lookdown_out'][0]:.2f}-{m['lookdown_out'][1]:.2f}; edges snapped to beats). Voice continues: \"{m['spoken']}\"")
    for c in m['cards']: A(f"- {c['t']:.2f}-{c['out_end']:.2f}: **{c['title']}**{(' / '+c['subtitle']) if c['subtitle'] else ''} - {c['visual']}")
    A(f"- In: {m['enter']}. Out: {m['exit']}.\n")
A("## UI cards and dumbbell\n")
for u in e['ui_cards']: A(f"- {u['t']:.2f}-{u['out_end']:.2f} {u['kind']}: **{u['label']}** (on '{u['anchor_word']}'){' - '+u['desc'] if u['desc'] else ''}")
A("")
for d in e['dumbbell']: A(f"- Dumbbell {d['t']:.2f}-{d['out_end']:.2f}: {d['action']}")
A("\n## SFX (categories from the original pack in scratchpad/sfx/pack, 'pick' variants)\n")
for x in e['sfx']: A(f"- {x['t']:.3f} {x['category']} ({x['gain_db']} dB, align {x['align']}): {x['why']}")
A("\n## Camera hits\n")
for c in e['camera']: A(f"- {c['t']:.3f} {c['type']} ({c['amp']}): {c['why']}")
A("\n## Music map\n")
for p in e['music']['pieces']: A(f"- out {p['out_start']:.3f}-{p['out_end']:.3f} <- track {p['track_in']:.3f}-{p['track_out']:.3f}: {p['what']}")
A("\n## Captions\n")
A("White, Apple-like sans (Inter/SF), one line of 1-4 words, accent word in soft blue (#6BC4FF-ish, preview shows it). Per word: opacity + blur 8→0 + scale 0.96→1, 0.18 s, ease-out (0.16,1,0.3,1). Caption ticks only on accent words, ≥0.8 s apart, never under a full-screen graphic. Full list with times in edl.json `captions`.\n")
A("## Grade\n")
A(f"- {e['grade']['look']}\n- {e['grade']['shelf_light']}")
A("\n## Uncertain\n")
A("- Transcript is reconstructed from a dialect the ASR handles poorly; words most at risk: R01 'qanaqa ... pitaniye', R03 'semirayotganmi / ozayotganmi', R09 'vazn ololmay yurganlarga', R13 'asosiy' (heard as 'qalavni', likely Russian 'главный'), R15 'Atletuz Xorazm' handle. Have the speaker check captions.")
A("- Word timings come from whisper token times refined to energy valleys (about ±100 ms); cut points come from the audio energy, not from the ASR.")
A("- Music edits loop 7 and 9 beats of drops 1 and 2 (not whole bars) to land each topic on a drop; check them by ear. Drop sections in this track are 33 beats long.")
A("- R04 'kunlik oqsilni to'ldirish uchun' and 'Bu narsalar ovqatda bor' were cut for length; restore if the speaker wants them (+3.2 s).")
A("- Preview: proxies upscaled (soft), MG/UI/dumbbell/grade/DoF/camera moves not rendered (MG shown as dark-blue title cards only).")
open(E+'/plan.md','w').write('\n'.join(L)+'\n')
print(len(L))
