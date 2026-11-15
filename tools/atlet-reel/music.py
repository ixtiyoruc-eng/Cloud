import librosa, numpy as np, json, sys, scipy.signal as ss
p=sys.argv[1]; out=sys.argv[2]
y,sr=librosa.load(p,sr=22050,mono=True)
dur=len(y)/sr
tempo,beats=librosa.beat.beat_track(y=y,sr=sr,units='time',tightness=200)
tempo=float(np.atleast_1d(tempo)[0])
# low band kicks/bass
sos=ss.butter(4,120,'low',fs=sr,output='sos'); lo=ss.sosfiltfilt(sos,y)
sos2=ss.butter(4,[600,1400],'band',fs=sr,output='sos'); mid=ss.sosfiltfilt(sos2,y)
hop=256
def env(x): return librosa.feature.rms(y=x,frame_length=1024,hop_length=hop)[0]
elo=env(lo); emid=env(mid); efull=env(y)
t=librosa.frames_to_time(np.arange(len(elo)),sr=sr,hop_length=hop)
on_lo=librosa.onset.onset_strength(y=lo,sr=sr,hop_length=hop)
lo_peaks=librosa.util.peak_pick(on_lo,pre_max=8,post_max=8,pre_avg=20,post_avg=20,delta=np.percentile(on_lo,90)*0.5,wait=20)
kicks=t[lo_peaks]
# check grid offset: median distance of kicks to nearest beat
b=np.array(beats)
d=[k-b[np.argmin(abs(b-k))] for k in kicks]
off=float(np.median(d)) if d else 0
# cowbell: tonal mid band onsets (phonk cowbell ~ 540-1000Hz harmonics)
S=np.abs(librosa.stft(y,n_fft=2048,hop_length=hop)); f=librosa.fft_frequencies(sr=sr,n_fft=2048)
band=(f>500)&(f<1500); on_mid=np.maximum(0,np.diff(np.log1p(S[band].sum(0)),prepend=0))
mid_peaks=librosa.util.peak_pick(on_mid,pre_max=6,post_max=6,pre_avg=15,post_avg=15,delta=np.percentile(on_mid,95)*0.6,wait=10)
cow=t[mid_peaks]
# energy per second, sections
sec=[]; 
for s in range(int(np.ceil(dur))):
    m=(t>=s)&(t<s+1); sec.append({"t":s,"rms":round(float(efull[m].mean()),4),"bass":round(float(elo[m].mean()),4)})
bass=np.array([x['bass'] for x in sec]); 
# drops: points where 2s-mean bass jumps from low to high
sm=np.convolve(bass,np.ones(2)/2,'same')
drops=[]
for s in range(2,len(sm)-2):
    pre=bass[max(0,s-3):s].mean(); post=bass[s:s+3].mean()
    if post>2.0*pre and post>np.percentile(bass,50): drops.append(s)
# refine drop to nearest kick
dropt=[]
for s in drops:
    c=kicks[(kicks>=s-0.6)&(kicks<=s+1.0)]
    dropt.append(float(c[0]) if len(c) else float(s))
dropt=sorted(set(round(x,3) for x in dropt))
# downbeats: assume 4/4, pick phase maximizing low-band at beat positions
bl=np.interp(b,t,elo); ph=int(np.argmax([bl[i::4].mean() for i in range(4)]))
down=b[ph::4]
json.dump({"file":p,"duration":round(dur,3),"tempo_bpm":round(tempo,2),"beat_period":round(60/tempo,4),
 "grid_offset_vs_kicks_ms":round(off*1000,1),"beats":[round(float(x),3) for x in b],"downbeats":[round(float(x),3) for x in down],
 "kicks_lowband":[round(float(x),3) for x in kicks],"cowbell_candidates":[round(float(x),3) for x in cow],
 "bass_drops":dropt,"energy_per_second":sec},open(out,'w'),indent=1)
print(tempo,len(b),off,dropt); print([ (x['t'],x['rms'],x['bass']) for x in sec])
print('cow',len(cow),[round(x,2) for x in cow[:40]])
print('kicks',len(kicks),[round(x,2) for x in kicks[:40]])
