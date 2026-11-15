import json,subprocess,sys,os,numpy as np,soundfile as sf,librosa
E=sys.argv[1]; MP3=sys.argv[2]; SFX=sys.argv[3] if len(sys.argv)>3 else None
edl=json.load(open(E+'/edl.json')); T=edl['output']['duration']
R=E+'/render'; os.makedirs(R,exist_ok=True)
def run(c): subprocess.run(c,check=True)
# 1. video segments (proxy is 540x720 == 3024x4032 display scaled by 540/3024)
k=540/3024; lst=[]
for i,s in enumerate(edl['segments']):
    c=s['crop']; x,y,w,h=[round(v*k) for v in (c['x'],c['y'],c['w'],c['h'])]
    w-=w%2; h-=h%2; f=f"{R}/seg{i:03d}.mp4"; d=s['out_end']-s['out_start']
    vf=f"crop={w}:{h}:{x}:{y},scale=540:960:flags=lanczos,setsar=1,fps=30"
    run(['ffmpeg','-v','error','-y','-ss',f"{s['src_in']:.3f}",'-i',f"{E}/proxy/{s['clip']}.mp4",'-t',f"{d:.3f}",'-an','-vf',vf,'-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',f])
    lst.append(f"file '{f}'")
open(R+'/list.txt','w').write('\n'.join(lst))
run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',R+'/list.txt','-c','copy',R+'/video_raw.mp4'])
# 2. ASS: captions + MG titles
def ts(t):
    t=max(0,t); h=int(t//3600); m=int(t%3600//60); s=t%60; return f"{h}:{m:02d}:{s:05.2f}"
ass=["[Script Info]","ScriptType: v4.00+","PlayResX: 540","PlayResY: 960","WrapStyle: 0","",
"[V4+ Styles]","Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
"Style: Cap,Inter Display Medium,40,&H00FFFFFF,&H00FFFFFF,&H00301A0A,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,30,30,250,1",
"Style: MG,Inter Display Medium,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1",
"Style: MGsub,Inter Display Medium,26,&H00FFD9A6,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1",
"","[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
for m in edl['mg_slots']:
    cards=m.get('cards') or [dict(t=m['out_start'],out_end=m['out_end'],title=m['title'],subtitle=m.get('subtitle',''))]
    for cd in cards:
        ass.append(f"Dialogue: 1,{ts(cd['t'])},{ts(cd['out_end'])},MG,,0,0,0,,{{\\pos(270,440)\\fad(150,120)}}{cd['title']}")
        if cd.get('subtitle'): ass.append(f"Dialogue: 1,{ts(cd['t'])},{ts(cd['out_end'])},MGsub,,0,0,0,,{{\\pos(270,515)\\fad(150,120)}}{cd['subtitle']}")
    ass.append(f"Dialogue: 1,{ts(m['out_start'])},{ts(m['out_end'])},MGsub,,0,0,0,,{{\\pos(270,170)\\fad(150,120)}}{m['id']} · full-screen motion graphic")
for c in edl['captions']:
    txt=c['text']
    if c.get('accent'):
        txt=txt.replace(c['accent'],"{\\c&HFFC46B&}"+c['accent']+"{\\c&HFFFFFF&}",1)
    ass.append(f"Dialogue: 2,{ts(c['out_start'])},{ts(c['out_end'])},Cap,,0,0,0,,{{\\fad(90,60)}}{txt}")
open(R+'/subs.ass','w').write('\n'.join(ass))
boxes=','.join(f"drawbox=x=0:y=0:w=iw:h=ih:color=0x0A1B3D@1:t=fill:enable='between(t,{m['out_start']:.3f},{m['out_end']:.3f})'" for m in edl['mg_slots'])
glow=','.join(f"drawbox=x=60:y=380:w=420:h=200:color=0x2F6FD6@0.25:t=fill:enable='between(t,{m['out_start']:.3f},{m['out_end']:.3f})'" for m in edl['mg_slots'])
# simple punch-in pulse on drops is not rendered (noted in EDL only)
vf=(boxes+','+glow+',' if boxes else '')+f"ass={R}/subs.ass"
# 3. audio mix in numpy at 48k
sr=48000; N=int(round(T*sr)); voice=np.zeros(N); fd=int(0.008*sr)
cache={}
for s in edl['segments']:
    cl=s['clip']
    if cl not in cache:
        a,_=sf.read(f"{E}/audio/{cl}_48k.wav"); cache[cl]=a.mean(1) if a.ndim>1 else a
    a=cache[cl][int(s['src_in']*sr):int(s['src_out']*sr)].copy()
    a[:fd]*=np.linspace(0,1,fd); a[-fd:]*=np.linspace(1,0,fd)
    o=int(round(s['out_start']*sr)); n=min(len(a),N-o); voice[o:o+n]+=a[:n]
# normalise voice to ~ -16 LUFS-ish via RMS of speech
sp=np.abs(voice)>1e-4; rms=np.sqrt(np.mean(voice[sp]**2)); voice*=10**(-19/20)/max(rms,1e-6)
mu=edl['music']; m,_=librosa.load(MP3,sr=sr,mono=False); m=m if m.ndim>1 else np.vstack([m,m])
off=int(mu['offset_s']*sr); m=m[:,off:off+N]
if m.shape[1]<N: m=np.pad(m,((0,0),(0,N-m.shape[1])))
env=np.ones(N)*10**(mu['bed_gain_db']/20)
# duck under speech (speech mask on output timeline)
mask=np.zeros(N)
for a0,b0 in edl['speech_mask']: mask[int(a0*sr):int(b0*sr)]=1
# smooth: attack 60ms release 250ms
import scipy.signal as ss
win=ss.windows.hann(int(0.25*sr)); win/=win.sum(); sm=np.clip(np.convolve(mask,win,'same')*1.6,0,1)
env*=10**((-mu['duck_db']*sm)/20)
fi=int(mu['fade_in_s']*sr); fo=int(mu['fade_out_s']*sr)
env[:fi]*=np.linspace(0,1,fi); env[-fo:]*=np.linspace(1,0,fo)
mix=np.vstack([voice,voice])+m*env
# SFX
used=[]
if SFX and os.path.exists(SFX+'/manifest.json'):
    man=json.load(open(SFX+'/manifest.json')); picks={}
    items=man if isinstance(man,list) else man.get('sounds',man.get('items',[]))
    if isinstance(man,dict) and not items:
        for cat,v in man.items():
            if isinstance(v,list):
                for it in v: it.setdefault('category',cat); items.append(it)
    for it in items:
        cat=it.get('category'); 
        if it.get('pick') or cat not in picks: 
            if cat not in picks or it.get('pick'): picks[cat]=it
    for ev in edl['sfx']:
        it=picks.get(ev['category'])
        if not it: continue
        p=it.get('file') or it.get('path')
        p=p if os.path.isabs(p) else SFX+'/'+p
        a,ssr=librosa.load(p,sr=sr,mono=False); a=a if a.ndim>1 else np.vstack([a,a])
        a*=10**(ev.get('gain_db',-12)/20); en=np.abs(a).max(0); al=ev.get('align','onset')
        if al=='peak': k0=int(np.argmax(np.convolve(en,np.ones(240)/240,'same')))
        elif al=='end': k0=a.shape[1]
        else: k0=int(np.argmax(en>en.max()*0.03))
        o=int(round(ev['t']*sr))-k0
        if o<0: a=a[:,-o:]; o=0
        n=min(a.shape[1],N-o); mix[:,o:o+n]+=a[:,:n]; used.append(ev['category'])
pk=np.abs(mix).max(); 
if pk>0.7: mix*=0.7/pk
sf.write(R+'/mix.wav',mix.T,sr)
# 4. encode: target <=12MB
vb=int((11.0*8*1024*1024/T)/1000)-128
run(['ffmpeg','-v','error','-y','-i',R+'/video_raw.mp4','-i',R+'/mix.wav','-vf',vf,'-c:v','libx264','-preset','medium','-b:v',f'{min(vb,1600)}k','-maxrate',f'{min(vb,1600)*1.5:.0f}k','-bufsize','3000k','-pix_fmt','yuv420p','-map','0:v:0','-map','1:a:0','-af','loudnorm=I=-16:TP=-2:LRA=11','-ar','48000','-c:a','aac','-b:a','128k','-movflags','+faststart','-write_tmcd','0','-shortest',E+'/preview.mp4'])
run(['ffmpeg','-v','error','-y','-ss',str(edl['poster_t']),'-i',E+'/preview.mp4','-frames:v','1','-q:v','3',E+'/poster.jpg'])
print('sfx mixed:',len(used),sorted(set(used)))
print(os.path.getsize(E+'/preview.mp4')/1e6,'MB')
