import json,numpy as np,librosa,scipy.signal as ss,sys
E=sys.argv[1]; mp3=sys.argv[2]
raw=json.load(open(E+'/beats_raw.json'))
y,sr=librosa.load(mp3,sr=22050); dur=len(y)/sr
lo=ss.sosfiltfilt(ss.butter(4,100,'low',fs=sr,output='sos'),y)
hop=64; r=librosa.feature.rms(y=lo,frame_length=256,hop_length=hop)[0]; t=np.arange(len(r))*hop/sr
on=np.maximum(0,np.diff(r,prepend=0)); 
pk,_=ss.find_peaks(on,height=on.max()*0.15,distance=int(0.3*sr/hop))
k808=t[pk]
# fit grid: period P, anchor A=first drop; use 808 onsets near integer beats
A0=18.22; P0=0.4547
for it in range(3):
    n=np.round((k808-A0)/P0); res=k808-(A0+n*P0); m=abs(res)<0.06
    P0,A0=np.polyfit(n[m],k808[m],1)
n=np.round((k808-A0)/P0); res=k808-(A0+n*P0); m=abs(res)<0.06
P,A=P0,A0
first=A-np.floor(A/P)*P
beats=np.arange(first,dur,P)
bidx=np.round((beats-A)/P).astype(int)
down=beats[bidx%4==0]
# drops: first 808 after a bass-free stretch
bass_s=[x['bass'] for x in raw['energy_per_second']]
drops=[]
for b0 in beats:
    pre=(k808>b0-3.0)&(k808<b0-0.1); hit=abs(k808-b0)<0.06
    post=all((abs(k808-(b0+j*P))<0.06).any() for j in (1,2,3))
    if hit.any() and post and not pre.any() and b0>1: drops.append(round(float(b0),3))
# breaks (no 808) sections
sections=[]; edges=[0.0]+drops+[round(dur,3)]
lastk=lambda a,b: k808[(k808>=a)&(k808<b)]
sections.append({"name":"intro (no 808, cowbell/melody only)","start":0.0,"end":drops[0]})
for i,d in enumerate(drops):
    nxt=drops[i+1] if i+1<len(drops) else dur
    kk=lastk(d-0.01,nxt); g=np.where(np.diff(kk)>1.5)[0]; kk=kk[:g[0]+1] if len(g) else kk; end808=float(kk[-1]+P) if len(kk) else d
    sections.append({"name":f"drop {i+1} (808 on every beat)","start":d,"end":round(min(end808,nxt),3)})
    if end808<nxt-0.5: sections.append({"name":f"break {i+1} (no 808)","start":round(end808,3),"end":round(nxt,3)})
# cowbell candidates: 700-2000Hz tonal onsets, quantised to 1/8 grid
mid=ss.sosfiltfilt(ss.butter(4,[700,2000],'band',fs=sr,output='sos'),y)
rm=librosa.feature.rms(y=mid,frame_length=512,hop_length=hop)[0]; om=np.maximum(0,np.diff(rm,prepend=0))
pm,pr=ss.find_peaks(om,height=np.percentile(om,99)*0.5,distance=int(0.2*sr/hop))
cow=[]
for p,h in zip(pm,pr['peak_heights']):
    tt=t[p]; q=A+np.round((tt-A)/(P/2))*(P/2)
    if abs(tt-q)<0.05: cow.append({"t":round(float(tt),3),"grid":round(float(q),3),"on_beat":bool(abs(((q-A)/P)-round((q-A)/P))<0.01),"strength":round(float(h/om.max()),3)})
strong=sorted(cow,key=lambda c:-c['strength'])[:60]
out={"source":"Na Reliquia Dos Favela - DJ Biel Divulga.mp3","duration":round(dur,3),
 "method":"808/kick onsets from <100 Hz RMS envelope; linear grid fit (period, anchor) to onsets within 60 ms of integer beats; librosa beat_track gave 129.2 BPM and drifted ~40 ms late in drop 1, so it is replaced by the fitted grid.",
 "tempo_bpm":round(60/P,3),"beat_period_s":round(P,5),"grid_anchor_first_drop":round(A,3),
 "grid_fit_residual_ms_median":round(float(np.median(abs(res[m])))*1000,1),"grid_fit_onsets":int(m.sum()),
 "bass_drops":drops,"sections":sections,
 "beats":[round(float(x),3) for x in beats],"downbeats":[round(float(x),3) for x in down],
 "kick808_onsets":[round(float(x),3) for x in k808],
 "cowbell_candidates":sorted(cow,key=lambda c:c['t']),"cowbell_strongest60":sorted([c['t'] for c in strong]),
 "energy_per_second":raw['energy_per_second'],"librosa_tempo_bpm":raw['tempo_bpm']}
json.dump(out,open(E+'/beats.json','w'),indent=1)
print(60/P,P,A,'resid',out['grid_fit_residual_ms_median'],m.sum(),'drops',drops);print(sections);print(len(cow))
