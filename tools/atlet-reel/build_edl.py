import json,sys,numpy as np,librosa,scipy.signal as ss
E=sys.argv[1]; sys.path.insert(0,E+'/scripts')
from content import KEEP,ACCENTS,CUT_LOG
W=json.load(open(E+'/words_raw.json')); V=json.load(open(E+'/vad_look.json')); F=json.load(open(E+'/face.json')); B=json.load(open(E+'/beats.json'))
P=B['beat_period_s']; A=B['grid_anchor_first_drop']; DROPS=B['bass_drops']
SRC_W,SRC_H=3024,4032   # display frame (4032x3024 stored, rotation -90)
GAP_MIN=0.12; PRE=0.05; POST=0.07
# --- energy envelopes for word-boundary refinement
env={}
for c in V:
    y,sr=librosa.load(f'{E}/audio/{c}.wav',sr=16000); y=ss.sosfiltfilt(ss.butter(4,[120,3800],'band',fs=sr,output='sos'),y)
    env[c]=librosa.feature.rms(y=y,frame_length=320,hop_length=80)[0]  # 5 ms hop
def refine(c,t,rng=0.12):
    e=env[c]; i0=max(0,int((t-rng)*200)); i1=min(len(e)-1,int((t+rng)*200))
    if i1<=i0: return t
    return round((i0+int(np.argmin(e[i0:i1])))/200,3)
def norm(w): return w.strip(".,?!:—…'\"").strip()
# --- 1. words per kept range
ranges=[]
for k in KEEP:
    raw=[w for w in W[k['clip']] if w[1]>=k['a']-0.02 and w[2]<=k['b']+0.02]
    words=[]
    for (rw,s,e),cl in zip(raw,k['clean']):
        if cl=='': 
            if words: words[-1]['e']=e
            continue
        words.append({"w":cl,"raw":rw,"s":s,"e":e})
    for i,w in enumerate(words):
        w['s']=refine(k['clip'],w['s']) if i>0 else w['s']
    for i in range(len(words)-1): words[i]['e']=min(words[i]['e'],words[i+1]['s'])
    ranges.append(dict(k,words=words))
# --- 2. sub-segments from VAD runs
def runs_in(c,a,b):
    R=[[max(s,a),min(e,b)] for s,e in V[c]['speech'] if e>a and s<b]
    M=[]
    for s,e in R:
        if M and s-M[-1][1]<GAP_MIN: M[-1][1]=e
        else: M.append([s,e])
    M=[r for r in M if r[1]-r[0]>=0.08]
    # second pass: split at quiet dips >=0.22 s inside a run (breaths / hesitations the VAD bridged)
    e=20*np.log10(env[c]+1e-9)
    out=[]
    for s0,e0 in M:
        i0,i1=int(s0*200),min(len(e),int(e0*200)); cur=s0; k=i0
        seg=e[i0:i1]; lo=np.percentile(seg,5); hi=np.percentile(seg,95); q=e<lo+0.3*(hi-lo)
        while k<i1:
            if q[k]:
                j=k
                while j<i1 and q[j]: j+=1
                if (j-k)/200>=0.22 and k>i0 and j<i1: out.append([cur,k/200]); cur=j/200
                k=j
            else: k+=1
        out.append([cur,e0])
    return out
segs=[]
for r in ranges:
    c=r['clip']; a=r['words'][0]['s']; b=r['words'][-1]['e']
    R=runs_in(c,a-0.1,b+0.1)
    if not R: R=[[a,b]]
    R[0][0]=min(R[0][0],a); R[-1][1]=max(R[-1][1],b-0.05)
    for j,(s,e) in enumerate(R):
        prev_e=R[j-1][1] if j>0 else s-1; nxt_s=R[j+1][0] if j+1<len(R) else e+1
        si=max(s-PRE,(prev_e+s)/2); so=min(e+POST,(e+nxt_s)/2)
        segs.append({"range":r['id'],"clip":c,"section":r['section'],"speech":[round(s,3),round(e,3)],"src_in":round(si,3),"src_out":round(so,3),
                     "slack_after":round(((nxt_s if j+1<len(R) else e+0.35)-e)-POST,3)})
# --- 3. timeline + beat snapping
def lay(segs):
    t=0
    for s in segs: s['out_start']=round(t,3); t+=s['src_out']-s['src_in']; s['out_end']=round(t,3)
    return t
T0=lay(segs)
def word_out(rid,pred):
    for r in ranges:
        if r['id']!=rid: continue
        for w in r['words']:
            if pred(w):
                for s in segs:
                    if s['range']==rid and s['src_in']-0.01<=w['s']<=s['src_out']: return s['out_start']+(w['s']-s['src_in'])
    return None
# key moment = onset of 'Kreatin,' in the hook
Tkey=word_out('R01',lambda w:w['w'].startswith('Kreatin'))
off1=DROPS[0]-Tkey        # music track time = out time + off1
grid=lambda t: (t+off1-A)/P
log=[]
first_of={}
for s in segs: first_of.setdefault(s['range'],s)
TOPIC_R={'gainer':'R07','creatine':'R11','cta':'R15'}
def src_silence_before(c,t):
    prev=[e for s0,e in V[c]['speech'] if e<=t+1e-3]
    return t-(max(prev) if prev else 0.0)
for i in range(len(segs)-1):
    lay(segs); s=segs[i]; nx=segs[i+1]; bnd=s['out_end']; n=grid(bnd); d=(np.round(n)-n)*P
    must=nx is first_of[nx['range']] and nx['range'] in TOPIC_R.values()
    lo=-(s['src_out']-(s['speech'][1]+0.03)); hi=min(0.12,max(0,s['slack_after']))
    if lo<=d<=hi and abs(d)<=0.12:
        s['src_out']=round(s['src_out']+d,3); s['beat_snap_ms']=round(d*1000); log.append(round(d*1000)); continue
    if must:
        # topic change: land the boundary on the next beat by adding room tone from the next clip's pre-roll
        d2=d if d>0 else d+P
        avail=src_silence_before(nx['clip'],nx['speech'][0])-PRE-0.02
        if d2<=avail:
            nx['src_in']=round(nx['src_in']-d2,3); nx['pre_air_ms']=round(d2*1000)
            # boundary stays, but next segment's first word moves later by d2: shift boundary = nothing; instead treat the speech onset
            s['beat_snap_ms']=0; log.append(('air',round(d2*1000))); continue
    s['beat_snap_ms']=None; log.append(None)
T=lay(segs)
def first_onset(rid):
    s=first_of[rid]; return s['out_start']+(s['speech'][0]-s['src_in'])
Tp=first_onset('R02'); Tg=first_onset('R07'); Tc=first_onset('R11'); Tcta=first_onset('R15')
# --- 4. music: one continuous beat grid; each topic opens on a drop; drops looped / breaks trimmed in whole beats
def q(t): return A-off1+np.round((t+off1-A)/P)*P     # nearest out-grid beat
SEC=B['sections']
def sec_end(drop):
    for x in SEC:
        if abs(x['start']-drop)<0.01: return x['end']
D=[(sec_end(d)-d) for d in DROPS]; 
topics=[("hook",q(Tkey),0),("gainer",q(Tg),1),("creatine",q(Tc),2),("cta",q(Tcta),3)]
pieces=[{"out_start":0.0,"out_end":round(topics[0][1],3),"track_in":round(off1,3),"track_out":round(topics[0][1]+off1,3),"what":"intro (cowbell/melody, no 808) under the hook question"}]
END=T+1.4
for j,(name,Tt,k) in enumerate(topics):
    Tn=topics[j+1][1] if j+1<len(topics) else END
    dk=DROPS[k]; nb=int(round((Tn-Tt)/P)) if j+1<len(topics) else None
    if nb is None:
        pieces.append({"out_start":round(Tt,3),"out_end":round(END,3),"track_in":round(dk,3),"track_out":round(dk+END-Tt,3),"what":f"drop {k+1} under {name}"}); break
    nxt=DROPS[k+1]; brk=int(round((nxt-dk)/P))-int(round(D[k]/P)); Db=int(round(D[k]/P))
    t=Tt
    if nb>=Db+brk:
        loop=nb-Db-brk
        pieces.append({"out_start":round(t,3),"out_end":round(t+Db*P,3),"track_in":round(dk,3),"track_out":round(dk+Db*P,3),"what":f"drop {k+1} ({name})"}); t+=Db*P
        while loop>0:
            L=min(loop,16); src=dk+16*P
            pieces.append({"out_start":round(t,3),"out_end":round(t+L*P,3),"track_in":round(src,3),"track_out":round(src+L*P,3),"what":f"loop {L} beats of drop {k+1} (extends section)"}); t+=L*P; loop-=L
        pieces.append({"out_start":round(t,3),"out_end":round(Tn,3),"track_in":round(dk+Db*P,3),"track_out":round(nxt,3),"what":f"break before drop {k+2}"})
    else:
        lead=min(brk,max(0,nb-8)); body=nb-lead
        pieces.append({"out_start":round(t,3),"out_end":round(t+body*P,3),"track_in":round(dk,3),"track_out":round(dk+body*P,3),"what":f"drop {k+1} ({name})"}); t+=body*P
        if lead: pieces.append({"out_start":round(t,3),"out_end":round(Tn,3),"track_in":round(nxt-lead*P,3),"track_out":round(nxt,3),"what":f"last {lead} beats of break before drop {k+2}"})
off_list=[p['track_in']-p['out_start'] for p in pieces]
def track_to_out(tt):
    res=[]
    for p in pieces:
        if p['track_in']<=tt<p['track_out']: res.append(round(p['out_start']+tt-p['track_in'],3))
    return res
out_beats=sorted(set(x for b in B['beats'] for x in track_to_out(b) if x<=END))
out_down=sorted(set(x for b in B['downbeats'] for x in track_to_out(b) if x<=END))
out_drops=[round(t[1],3) for t in topics]
out_cow=sorted(set(x for c in B['cowbell_strongest60'] for x in track_to_out(c)))
def nearest_beat(t): 
    b=np.array(out_beats); return float(b[np.argmin(abs(b-t))])
json.dump(dict(segs=segs,ranges=ranges,T=T,T0=T0,Tkey=Tkey,off1=off1,pieces=pieces,Tp=Tp,Tg=Tg,Tc=Tc,Tcta=Tcta,snap=log,
  out_beats=out_beats,out_down=out_down,out_drops=out_drops,out_cow=out_cow,END=END),open(E+'/stage1.json','w'),ensure_ascii=False)
print('raw dur',round(T0,2),'final',round(T,2),'segments',len(segs),'Tkey',round(Tkey,3),'off1',round(off1,3))
print('topics',Tp,Tg,Tc,Tcta,[round(t[1],3) for t in topics]); [print(p) for p in pieces]; print('drops out',out_drops)
print('snap ms',log)
