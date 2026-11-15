import numpy as np, json, librosa, scipy.signal as ss, sys
E=sys.argv[1]
out={}
face=json.load(open(E+'/face.json'))
for i in range(1,6):
    y,sr=librosa.load(f'{E}/audio/c{i}.wav',sr=16000)
    sos=ss.butter(4,[120,3800],'band',fs=sr,output='sos'); yb=ss.sosfiltfilt(sos,y)
    hop=160; r=librosa.feature.rms(y=yb,frame_length=480,hop_length=hop)[0]; db=20*np.log10(r+1e-9)
    floor=np.percentile(db,10); peak=np.percentile(db,95); thr=floor+0.35*(peak-floor)
    sp=db>thr
    # close gaps <120ms, drop blips <80ms
    def runs(m):
        res=[];s=None
        for k,v in enumerate(m):
            if v and s is None: s=k
            if not v and s is not None: res.append([s,k]); s=None
        if s is not None: res.append([s,len(m)])
        return res
    R=runs(sp); M=[]
    for a,b in R:
        if M and a-M[-1][1]<12: M[-1][1]=b
        else: M.append([a,b])
    M=[[a*0.01,b*0.01] for a,b in M if b-a>=8]
    sil=[]; prev=0.0
    for a,b in M:
        if a-prev>=0.25: sil.append([round(prev,2),round(a,2)])
        prev=b
    dur=len(y)/sr
    if dur-prev>=0.25: sil.append([round(prev,2),round(dur,2)])
    # look-down spans
    rows=face[f'c{i}.mp4']; t=np.array([r['t'] for r in rows])
    ld=np.array([r.get('lookdown',1.0) if r['face'] else 1.0 for r in rows])
    pt=np.array([r.get('pitch',0.0) if r['face'] else 0.0 for r in rows])
    sc=((ld>=0.62)&(pt<7))|(ld>=0.75)
    down=ss.medfilt(sc.astype(float),5)>0.5
    spans=[]; s=None
    for k,v in enumerate(down):
        if v and s is None: s=k
        if (not v or k==len(down)-1) and s is not None:
            e=k if not v else k+1
            a=t[s]; b=t[e-1]+0.25
            if b-a>=0.75: spans.append([round(float(a),2),round(float(b),2)])
            s=None
    # merge spans with gaps < 0.75 s
    mg=[]
    for a,b in spans:
        if mg and a-mg[-1][1]<0.75: mg[-1][1]=b
        else: mg.append([a,b])
    out[f'c{i}']={"duration":round(dur,3),"speech":[[round(a,2),round(b,2)] for a,b in M],"silences":sil,"lookdown":mg,"vad_thr_db":round(float(thr),1)}
    print(f'c{i}',dur,'speech',sum(b-a for a,b in M).__round__(1),'sil',len(sil),'look',mg)
json.dump(out,open(E+'/vad_look.json','w'),indent=1)
