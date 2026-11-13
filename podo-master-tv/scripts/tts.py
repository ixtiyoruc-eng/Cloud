import json,sys,urllib.request,os
K=os.environ['XI']; voice=sys.argv[1]; model=sys.argv[2]; d=json.load(open('script.json'))
idx=[int(x) for x in sys.argv[3:]] or range(len(d))
for i in idx:
    body=json.dumps({"text":d[i][1],"model_id":model,"language_code":"uz",
       "voice_settings":{"stability":0.65,"similarity_boost":0.8,"style":0.0,"use_speaker_boost":True}}).encode()
    r=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",data=body,headers={"xi-api-key":K,"Content-Type":"application/json"})
    try: open(f"seg{i}.mp3","wb").write(urllib.request.urlopen(r).read()); print("ok",i)
    except urllib.error.HTTPError as e: print(i,e.code,e.read()[:400])
