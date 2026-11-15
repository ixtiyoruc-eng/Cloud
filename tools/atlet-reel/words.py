import json,sys
E=sys.argv[1]; out={}
for i in range(1,6):
    try: d=json.load(open(f'{E}/audio/c{i}.json'))
    except Exception: continue
    W=[]
    for s in d['transcription']:
        for tk in s['tokens']:
            tx=tk['text']
            if tx.startswith('[_') : continue
            a,b=tk['offsets']['from']/1000,tk['offsets']['to']/1000
            if tx.startswith(' ') or not W: W.append({"w":tx.strip(),"s":a,"e":b,"p":[tk['p']]})
            else: W[-1]["w"]+=tx; W[-1]["e"]=b; W[-1]["p"].append(tk['p'])
    for w in W: w['p']=round(min(w['p']),2)
    out[f'c{i}']=W
    print(f'c{i}:',' '.join(f"{w['w']}[{w['s']:.2f}-{w['e']:.2f}]" for w in W))
json.dump(out,open(E+'/words_raw.json','w'),ensure_ascii=False,indent=0)
