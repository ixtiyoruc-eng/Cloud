# Re-transcribe kept/candidate source ranges with whisper.cpp large-v3, forced uz,
# the user's ground-truth script as prompt, word-level (-ml 1 -sow) + DTW token times.
# usage: python3 asr_v2.py EDIT_DIR WHISPER_CLI MODEL OUT_DIR
import json, subprocess, sys, os, soundfile as sf
E, W, M, O = sys.argv[1:5]
os.makedirs(O, exist_ok=True)
SCRIPT = {
 "hook": "Zala borasiz, lekin nimani olishni bilmisizmi? Protein, kreatin, geyner. Qarang, aytib baraman.",
 "p1": "Protein bu oddiy oqsil, tvorog, tovuq, tuxumda, go'shtda bor.",
 "p2": "Kima dog'ri galadi? Hammaga, o'g'il, qiz, orriqlijakmisiz, samirjakmisiz, farqi yo'q.",
 "p3": "Kunlik oqsil to'ldirish uchun.",
 "p4": "Siz haftasi 3 marta zala borasiz, siza har bir kilogizga 2 gramdan oqsil garak. Oqsilni siz ovqatdan olsangiz, siza shart amas.",
 "p5": "Ovqatdan olib bilmasangiz, protein olishingiz garak.",
 "g1": "Geyner bu oqsil, uglevod va ozgina yog'la aralashmasi.",
 "g2": "Bu narsala oddiy ovqatda bor. Bu kima dog'ri galadi?",
 "g3": "Orriq va ves olajak bo'b yurganla, ves olish uchun ko'p yeyish garak, ko'p yeyish esa qiyin, shu vaxtda siza yordama suyuq ovqat, geyner garak bo'ladi.",
 "g4": "Va kunlik kaloriyani to'ldirasiz, profitsitga chiqasiz va muskul va vazningiz o'sadi.",
 "k1": "Kreatin kuch va chidamlilikni oshirish uchun ichiladi.",
 "k2": "Kreatin nimani ish atadi?",
 "k3": "Kreatin ATF zaxirasini ko'paytiradi. Bu muskullarda glavniy energiya manbayi. Kreatin oddiy go'shtda bor. Kunlik 5 gram kreatin bir yarim kilo go'shtda bor.",
 "cta": "O'zingizga keraklisini bilib olgan bo'lsangiz, videoga layk bosing, Atletuz Xorazmga obuna bo'lib qo'ying.",
}
RANGES = [("c1",0.7,8.9,"hook"),("c2",1.4,7.45,"p1"),("c2",12.2,18.9,"p2"),("c2",28.9,31.7,"p3"),
 ("c2",39.5,48.6,"p4"),("c2",55.5,60.3,"p5"),("c3",3.5,8.6,"g1"),("c4",0.5,3.6,"g2"),
 ("c4",23.7,35.1,"g3"),("c4",49.3,55.0,"g4"),("c5",4.9,10.4,"k1"),("c5",16.6,18.5,"k2"),
 ("c5",18.9,38.0,"k3"),("c5",61.1,67.9,"cta")]
res = []
for clip,a,b,key in RANGES:
    x, sr = sf.read(f"{E}/audio/{clip}.wav")
    f = f"{O}/{clip}_{a:05.1f}.wav"; sf.write(f, x[int(a*sr):int(b*sr)], sr)
    subprocess.run([W,"-m",M,"-l","uz","-f",f,"-ojf","-ml","1","-sow","--dtw","large.v3",
                    "--prompt",SCRIPT[key],"-of",f[:-4],"-np"],check=True,capture_output=True)
    d = json.load(open(f[:-4]+".json")); words=[]
    for s in d["transcription"]:
        t = s["text"].strip()
        if not t: continue
        words.append([t, round(a+s["offsets"]["from"]/1000,3), round(a+s["offsets"]["to"]/1000,3)])
    res.append(dict(clip=clip,a=a,b=b,key=key,words=words))
    print(clip,a,key,' '.join(f"{w}[{s:.2f}]" for w,s,e in words),flush=True)
json.dump(res,open(f"{O}/asr_v2.json","w"),ensure_ascii=False,indent=0)
