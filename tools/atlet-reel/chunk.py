import json,sys,soundfile as sf,os
E=sys.argv[1]; v=json.load(open(E+'/vad_look.json')); os.makedirs(E+'/chunks',exist_ok=True); idx=[]
for c,d in v.items():
    a,sr=sf.read(f'{E}/audio/{c}.wav'); G=[]
    for s,e in d['speech']:
        if G and s-G[-1][1]<0.35 and e-G[-1][0]<12: G[-1][1]=e
        else: G.append([s,e])
    for j,(s,e) in enumerate(G):
        s0=max(0,s-0.15); e0=min(len(a)/sr,e+0.15); f=f'{E}/chunks/{c}_{j:02d}.wav'
        sf.write(f,a[int(s0*sr):int(e0*sr)],sr); idx.append({"clip":c,"file":f,"start":round(s0,3),"end":round(e0,3)})
json.dump(idx,open(E+'/chunks/index.json','w'),indent=0); print(len(idx), max(x['end']-x['start'] for x in idx))
