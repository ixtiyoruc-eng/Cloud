import json,sys,numpy as np
E=sys.argv[1]; sys.path.insert(0,E+'/scripts')
from content import ACCENTS,CUT_LOG
st=json.load(open(E+'/stage1.json')); V=json.load(open(E+'/vad_look.json')); F=json.load(open(E+'/face.json')); B=json.load(open(E+'/beats.json'))
segs=st['segs']; ranges={r['id']:r for r in st['ranges']}; T=st['T']; beats=np.array(st['out_beats']); P=B['beat_period_s']
SW,SH=3024,4032; BASE_W=SW*0+round(SH*9/16)  # 2268
def r3(x): return round(float(x),3)
def nb(t,mode='near'):
    if mode=='le': c=beats[beats<=t+1e-6]; return float(c[-1]) if len(c) else t
    if mode=='ge': c=beats[beats>=t-1e-6]; return float(c[0]) if len(c) else t
    return float(beats[np.argmin(abs(beats-t))])
def src2out(c,t):
    for s in segs:
        if s['clip']==c and s['src_in']-1e-3<=t<=s['src_out']+1e-3: return s['out_start']+t-s['src_in']
    return None
# --- MG slots from look-down spans
cover=[]
for s in segs:
    for a,b in V[s['clip']]['lookdown']:
        a2,b2=max(a,s['src_in']),min(b,s['src_out'])
        if b2-a2>0.05: cover.append([s['out_start']+a2-s['src_in'],s['out_start']+b2-s['src_in'],s['range']])
cover.sort(); M=[]
for a,b,r in cover:
    if M and a-M[-1][1]<1.0: M[-1][1]=max(M[-1][1],b); M[-1][2][r]=M[-1][2].get(r,0)+b-a
    else: M.append([a,b,{r:b-a}])
M=[m for m in M if m[1]-m[0]>=0.5]
MGTXT={
 "R09":[("Ozg'in","Vazn olish uchun","ko'p yeyish kerak","Thin silhouette outline + a flat weight graph line; plate icon slides in on 'ko'p yeyish'."),
        ("ko'p",None,None,None),
        ("esa","Ko'p yeyish — qiyin","","Three stacked plate cards, the top one tilts away; soft clock ring ticks once."),
        ("Shu","Yechim: GEYNER","suyuq ovqat","3D shaker bottle rotates in, liquid swirl in cobalt glow; label chip 'GEYNER' lands on 'geyner'.")],
 "R13":[("Kreatin","ATF zaxirasi ↑","","Battery/energy cells filling bottom-up in icy blue, label 'ATF'."),
        ("Bu","Muskul energiyasi","asosiy manba","Stylised muscle fibre with a pulse of light travelling along it."),
        ("Kreatin|oddiy","Go'shtda ham bor","","Glass card with a steak icon; sets up the next to-camera line '5 g = 1,5 kg go'sht'.")],
}
def range_words_out(rid):
    out=[]
    for w in ranges[rid]['words']:
        t=src2out(ranges[rid]['clip'],w['s'])
        if t is None:  # word start fell in a removed gap -> next kept segment
            nxt=[s for s in segs if s['range']==rid and s['src_in']>=w['s']]
            t=nxt[0]['out_start'] if nxt else None
        te=src2out(ranges[rid]['clip'],w['e']) 
        out.append(dict(w,os=t,oe=te if te is not None else (t+0.25 if t is not None else None)))
    return out
mg=[]
for i,(a,b,rs) in enumerate(M):
    a2=nb(a,'le'); a2=a2 if a-a2<=0.3 else a-0.08
    b2=nb(b,'ge'); b2=b2 if b2-b<=0.3 else b+0.08
    a2=max(0,a2); b2=min(T,b2)
    rid=max(rs,key=rs.get); cards=[]
    if rid in MGTXT:
        ws=[w for w in range_words_out(rid) if w['os'] is not None]
        used=0
        for key,title,sub,vis in MGTXT[rid]:
            if title is None: continue
            k0=key.split('|')[0]; k1=key.split('|')[1] if '|' in key else None
            for j in range(used,len(ws)):
                if ws[j]['w'].startswith(k0) and (k1 is None or (j+1<len(ws) and ws[j+1]['w'].startswith(k1))):
                    cards.append(dict(t=r3(nb(ws[j]['os'])),title=title,subtitle=sub,visual=vis,anchor_word=ws[j]['w'])); used=j+1; break
        if cards: cards[0]['t']=r3(a2)
        for j,c in enumerate(cards): c['out_end']=cards[j+1]['t'] if j+1<len(cards) else r3(b2)
    spoken=' '.join(w['w'] for w in range_words_out(rid) if w['os'] is not None and a2-0.1<=w['os']<=b2)
    mg.append(dict(id=f"MG{i+1}",out_start=r3(a2),out_end=r3(b2),reason="speaker reads phone/notes (head/eyes down, face-landmark eyeLookDown + pitch, verified on contact sheets)",
       lookdown_out=[r3(a),r3(b)],ranges=sorted(rs),spoken=spoken,title=cards[0]['title'] if cards else spoken[:28],subtitle=cards[0]['subtitle'] if cards else "",cards=cards,
       enter="glide up 40 px + blur 12->0 + opacity 0->1, 0.35 s, ease cubic-bezier(0.22,1,0.36,1), lands on beat",
       exit="scale 1.0->1.04 + blur 0->10 + fade, 0.25 s, ease cubic-bezier(0.4,0,0.2,1), lands on beat"))
def in_mg(t): return any(m['out_start']-0.02<=t<=m['out_end']+0.02 for m in mg)
# --- crops
def face_stats(c,a,b):
    rows=[r for r in F[c+'.mp4'] if r['face'] and a-0.13<=r['t']<=b+0.13]
    if not rows: rows=[r for r in F[c+'.mp4'] if r['face']]
    return float(np.median([r['cx'] for r in rows])),float(np.median([r['eyes_cy'] for r in rows])),float(np.median([r['y1']-r['y0'] for r in rows])),len(rows)
z_toggle=False; out_segs=[]
for i,s in enumerate(segs):
    cx,ey,fh,n=face_stats(s['clip'],s['src_in'],s['src_out'])
    covered=in_mg(s['out_start']+0.05) and in_mg(s['out_end']-0.05)
    if covered: z=1.3
    else: z=1.456 if z_toggle else 1.3; z_toggle=not z_toggle
    w=2268/z; h=4032/z; x=min(max(cx*SW-w/2,0),SW-w); y=min(max(ey*SH-0.38*h,0),SH-h)
    out_segs.append(dict(id=f"S{i+1:02d}",clip=s['clip'],source_file=f"Video {s['clip'][1]} kadr.mov",range=s['range'],section=s['section'],
        src_in=s['src_in'],src_out=s['src_out'],out_start=s['out_start'],out_end=s['out_end'],
        crop=dict(x=round(x),y=round(y),w=round(w),h=round(h),zoom=z,face_cx_px=round(cx*SW),eyes_y_px=round(ey*SH),eyes_y_in_crop=r3((ey*SH-y)/h),face_samples=n),
        covered_by_mg=covered,beat_snap_ms=s.get('beat_snap_ms'),pre_air_ms=s.get('pre_air_ms'),
        camera="slow push-in +2% across the segment (ease in-out sine)"))
# --- captions
caps=[]; acc_set=set(ACCENTS)
for rid,r in ranges.items():
    ws=[w for w in range_words_out(rid) if w['os'] is not None]
    chunk=[]
    def flush():
        if not chunk: return
        txt=' '.join(w['w'] for w in chunk)
        acc=next((w['w'] for w in chunk if w['w'].strip('.,?!:—…') in acc_set or w['w'].strip('.,?!:—…').isdigit() or w['w'].strip('.,?!:—…') in [a.strip('.,?') for a in acc_set]),None)
        caps.append(dict(out_start=r3(chunk[0]['os']-0.03),text=txt,accent=acc.strip('.,?!:—…') if acc else None,
                         accent_t=r3(next(w['os'] for w in chunk if w['w']==acc)) if acc else None,range=rid,_e=chunk[-1]['oe'])); chunk.clear()
    for w in ws:
        if chunk and len(' '.join(x['w'] for x in chunk+[w]))>18: flush()
        chunk.append(w)
        if w['w'][-1] in '.,?!:—…' or len(chunk)>=3: flush()
    flush()
caps.sort(key=lambda c:c['out_start'])
for i,c in enumerate(caps):
    nxt=caps[i+1]['out_start'] if i+1<len(caps) else T
    c['out_end']=r3(min(nxt,max(c['_e']+0.2,c['out_start']+0.45))); del c['_e']
    c['anim']="per-word: opacity 0->1 + blur 8->0 px + scale 0.96->1.0, 0.18 s, ease-out cubic-bezier(0.16,1,0.3,1); group exit: fade + blur 0->6 px 0.12 s"
    c['over_mg']=in_mg(c['out_start']+0.05)
# --- UI cards + dumbbell
def wt(rid,starts,nth=0):
    ws=[w for w in range_words_out(rid) if w['os'] is not None and w['w'].startswith(starts)]
    return r3(ws[nth]['os']) if len(ws)>nth else None
def rend(rid): return r3(max(s['out_end'] for s in segs if s['range']==rid))
ui=[]
def U(rid,word,label,kind,desc,nth=0,until=None):
    t=wt(rid,word,nth)
    if t is None: print('UI anchor missing',rid,word); return
    ui.append(dict(t=t,snap_beat=r3(nb(t)),out_end=until or rend(rid),kind=kind,label=label,anchor_word=word,range=rid,desc=desc))
U("R01","Kreatin","KREATIN","glass_pill","3 glass pills stack top-right, one per product word")
U("R01","geyner","GEYNER","glass_pill","")
U("R01","protein","PROTEIN","glass_pill","")
U("R02","Birinchi","01 · PROTEIN","section_badge","top-centre badge, soft blue rim glow")
U("R02","Tvorogda","Tvorog","icon_chip","3 icon chips appear on each food word: tvorog / tuxum / go'sht")
U("R02","tuxumda","Tuxum","icon_chip","")
U("R02","go'shtda","Go'sht","icon_chip","")
U("R03","farqi","Hammaga mos ✓","glass_card","one card: o'g'il · qiz · semirish · ozish -> check mark on 'farqi yo'q'")
U("R05","3","3× / hafta","analytics_card","glass analytics card: '3× zal / hafta' then line '2 g oqsil × 1 kg vazn' builds on '2'")
U("R05","2","2 g / kg","analytics_card","")
U("R05","shart","Ovqatdan yetsa — shart emas","glass_card","card dims to 60% on 'shart emas'")
U("R06","protein","Protein kerak ✓","glass_card","")
U("R07","Ikkinchisi","02 · GEYNER","section_badge","")
U("R07","oqsil","Oqsil","donut_card","composition ring: 3 segments land on oqsil / uglevod / yog'")
U("R07","uglevod","Uglevod","donut_card","")
U("R07","yog'","Yog'","donut_card","")
U("R10","kaloriyangizni","Kunlik kaloriya","graph_card","rising line graph; 'profitsit' marker on 'profitsitga'; pills 'Muskul ↑' 'Vazn ↑'")
U("R10","profitsitga","Profitsit +","graph_card","")
U("R10","muskul","Muskul ↑","glass_pill","")
U("R10","yo vazn","Vazn ↑","glass_pill","")
U("R11","Uchinchisi","03 · KREATIN","section_badge","")
U("R11","kuch","Kuch ↑","bar_card","two horizontal bars fill: Kuch / Chidamlilik")
U("R11","chidamlilikni","Chidamlilik ↑","bar_card","")
U("R14","besh","5 g kreatin","equation_card","equation builds: '5 g kreatin' = '1,5 kg go'sht'")
U("R14","kilo","= 1,5 kg go'sht","equation_card","")
U("R15","layk","♥ Layk","glass_pill","")
U("R15","obuna","Obuna · Atletuz Xorazm","glass_pill","brand handle only as spoken; confirm exact @handle with the user")
ui.sort(key=lambda u:u['t'])
ui=[u for u in ui if not in_mg(u['t'])]
dumb=[dict(t=st['out_drops'][0],out_end=rend("R01"),action="enter: float in from depth (z -400 -> 0), slow Y-rotation 12°/s, soft blue rim light; lands on the hook drop"),
      dict(t=wt("R02","Birinchi"),out_end=wt("R02","Tvorogda"),action="re-appear beside '01 · PROTEIN' badge, gentle bob ±8 px 2.7 s period"),
      dict(t=st['out_drops'][1],out_end=wt("R07","oqsil"),action="beside '02 · GEYNER', on drop 2"),
      dict(t=st['out_drops'][2],out_end=wt("R11","kuch"),action="beside '03 · KREATIN', on drop 3"),
      dict(t=st['out_drops'][3],out_end=r3(T),action="final float behind CTA pills, slow push-in, fades with the music")]
# --- SFX
sfx=[]
ALIGN={'hook_boom':'peak','drop_hit':'peak','air_whoosh':'peak','riser':'end','zip_up':'end'}
def X(t,cat,gain,why,lead=0.0): sfx.append(dict(t=r3(t),category=cat,gain_db=gain,align=ALIGN.get(cat,'onset'),why=why))
drops=st['out_drops']
X(drops[0],"hook_boom",-6,"music drop 1 lands on 'Kreatin' (hook)")
for d,nm in zip(drops[1:],["drop 2 -> topic 2 'Ikkinchisi esa, geyner'","drop 3 -> topic 3 'Uchinchisi esa, kreatin'","drop 4 -> CTA"]): X(d,"drop_hit",-9,nm)
X(drops[3],"riser",-18,"riser ends on the CTA drop")
X(drops[1],"zip_up",-16,"short zip ends on topic 2 drop (ref B: zip into section)")
X(drops[2],"zip_up",-16,"short zip ends on topic 3 drop")
for m in mg:
    X(m['out_start'],"air_whoosh",-12,f"{m['id']} full-screen graphic glides in (whoosh peak on the beat it lands)")
    X(m['out_start']+0.12,"soft_chime",-18,f"{m['id']} card lands")
    for c in m['cards'][1:]: X(c['t'],"air_whoosh",-18,f"{m['id']} card change: {c['title']}")
    X(m['out_end'],"shimmer_transition",-16,f"{m['id']} exits back to speaker")
for u in ui:
    if u['kind'] in ('section_badge','analytics_card','graph_card','equation_card','glass_card','donut_card') and not any(abs(u['t']-x['t'])<0.25 for x in sfx):
        X(u['snap_beat'] if abs(u['snap_beat']-u['t'])<0.12 else u['t'],"soft_chime",-20,f"UI card '{u['label']}' glides in")
last=-9
for c in caps:
    if not c['accent'] or c['over_mg']: continue
    t=c['accent_t']
    if t-last<0.8 or any(abs(t-x['t'])<0.35 for x in sfx): continue
    X(t,"caption_tick",-20,f"caption accent '{c['accent']}'"); last=t
sfx.sort(key=lambda x:x['t'])
# camera
cam=[]
for d in drops:
    if not in_mg(d+0.05): cam.append(dict(t=r3(d),type="micro_shake",dur=0.2,amp="1.2% position, 0.4° rotation, decaying",why="phonk drop"))
cow=[c for c in st['out_cow'] if c<=T]; lastp=-9
for c in cow:
    if c-lastp>=2.5 and not in_mg(c) and all(abs(c-d)>0.6 for d in drops): cam.append(dict(t=r3(c),type="pulse",dur=0.18,amp="scale +1.5% then ease back",why="cowbell hit")); lastp=c
cam.sort(key=lambda x:x['t'])
# speech mask on output
mask=[]
for s in segs:
    a=s['out_start']+max(0,s['speech'][0]-s['src_in']); b=s['out_start']+min(s['src_out'],s['speech'][1])-s['src_in']; mask.append([r3(a),r3(b)])
# cut log mapping
pieces=st['pieces']
music=dict(file="Na Reliquia Dos Favela - DJ Biel Divulga.mp3",tempo_bpm=B['tempo_bpm'],beat_period_s=P,offset_s=r3(st['off1']),
  note="track_time = out_time + offset for the first piece; later pieces are bar-free music edits on the beat grid so every topic opens on a drop",
  pieces=pieces,bed_gain_db=-17,duck_db=12,fade_in_s=0.25,fade_out_s=1.4,drops_out=drops,beats_out=[b for b in st['out_beats'] if b<=T+1.4],downbeats_out=[b for b in st['out_down'] if b<=T+1.4],cowbell_out=cow)
cuts=[dict(at=r3(s['out_start']),between=[out_segs[i-1]['id'],s['id']],type=("take/clip change" if out_segs[i-1]['range']!=s['range'] else "jump cut (pause/breath removed)"),
     removed_src=[out_segs[i-1]['src_out'],s['src_in']] if out_segs[i-1]['clip']==s['clip'] else None, beat_snap_ms=out_segs[i-1]['beat_snap_ms']) for i,s in enumerate(out_segs) if i>0]
edl=dict(version=1,generated="2026-11-15",
  output=dict(width=1080,height=1920,fps=30,duration=r3(T),preview="preview.mp4 540x960"),
  sources=dict(clips={f"c{i}":f"Video {i} kadr.mov" for i in range(1,6)},frame="zoom is relative to the full-height 9:16 crop (1.0 = 2268x4032); base 1.30 (face ~18% of frame height, desk mostly trimmed; source still >=1558 px wide so no upscaling at 1080), punch-in 1.456 (= base x 1.12) on alternate jump cuts; eyes placed at 38% of crop height. Stored 4032x3024 HEVC with rotation -90 => displayed 3024x4032 portrait (3:4). All crop numbers are in displayed 3024x4032 pixels. 9:16 full-height crop = 2268x4032.",language="uz (Uzbek, Khorezm dialect; whisper large-v3 auto-detect said 'kk', text is Uzbek)"),
  segments=out_segs,cuts=cuts,mg_slots=mg,captions=caps,ui_cards=ui,dumbbell=dumb,sfx=sfx,camera=cam,music=music,speech_mask=mask,
  poster_t=r3(drops[0]+0.6),
  grade=dict(look="premium soft-glow blue: lift shadows to deep midnight #0A1B3D, cobalt mids, icy highlights, keep skin warm-neutral; soft halation 8-12%; background DoF blur (segment mask) ~6 px at 1080p; avoid neon",shelf_light="harmonise existing blue shelf LEDs, -10% saturation, +bloom"),
  cut_log=[dict(clip=c,src=[a,b],why=w) for c,a,b,w in CUT_LOG],
  sfx_categories="original pack at scratchpad/sfx/pack (manifest.json, 'pick' = chosen variant)")
json.dump(edl,open(E+'/edl.json','w'),ensure_ascii=False,indent=1)
print('T',T,'segs',len(out_segs),'cuts',len(cuts),'mg',[(m['id'],m['out_start'],m['out_end'],m['title'],len(m['cards'])) for m in mg])
print('caps',len(caps),'ui',len(ui),'sfx',len(sfx),'cam',len(cam))
