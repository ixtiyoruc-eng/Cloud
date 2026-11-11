import numpy as np, wave, sys
import json
CFG=json.load(open(sys.argv[2])); SR=44100; DUR=CFG['dur']; N=int(SR*DUR); rng=np.random.default_rng(4)
BPM=CFG.get('bpm',104); beat=60/BPM; bar=4*beat
def W(path,x):
    x=np.clip(x,-1,1); d=(x*32767).astype(np.int16)
    with wave.open(path,'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
def lp(x,fc):  # FFT lowpass (smooth)
    X=np.fft.rfft(x,axis=0); fr=np.fft.rfftfreq(len(x),1/SR); X*= (1/(1+(fr/fc)**4))[:,None] if x.ndim>1 else 1/(1+(fr/fc)**4); return np.fft.irfft(X,n=len(x),axis=0)
def hp(x,fc):
    X=np.fft.rfft(x); fr=np.fft.rfftfreq(len(x),1/SR); X*=1-1/(1+(fr/fc)**4); return np.fft.irfft(X,n=len(x))
def reverb(x,sec=2.2,mix=0.3):
    L=int(SR*sec); t=np.arange(L)/SR
    out=[]
    for ch in range(2):
        ir=rng.standard_normal(L)*np.exp(-t*3.2/sec); ir=lp(ir,6000); ir/=np.sqrt((ir**2).sum())
        n=len(x)+L; y=np.fft.irfft(np.fft.rfft(x[:,ch],n)*np.fft.rfft(ir,n),n)[:len(x)]
        out.append(y)
    return x*(1-mix)+np.stack(out,1)*mix*1.0
def add(buf,sig,t0,gain=1.0,pan=0.0):
    i=int(t0*SR); 
    if i>=len(buf): return
    s=sig[:len(buf)-i]; l=np.cos((pan+1)*np.pi/4); r=np.sin((pan+1)*np.pi/4)
    buf[i:i+len(s),0]+=s*gain*l*1.414; buf[i:i+len(s),1]+=s*gain*r*1.414
def m2f(m): return 440*2**((m-69)/12)
def env(n,a,d,s,r,hold):
    e=np.zeros(n); A=int(a*SR); D=int(d*SR); H=int(hold*SR); R=int(r*SR)
    seg=np.concatenate([np.linspace(0,1,A,False),np.linspace(1,s,D,False),np.full(max(0,H-A-D),s),np.linspace(s,0,R)])
    e[:min(n,len(seg))]=seg[:n]; return e

drums=np.zeros((N,2)); bass=np.zeros((N,2)); pad=np.zeros((N,2)); pluck=np.zeros((N,2)); sfx=np.zeros((N,2))
# kick
kt=np.arange(int(0.35*SR))/SR; kick=np.sin(2*np.pi*(45*kt+ (110/18)*(1-np.exp(-kt*18))))*np.exp(-kt*7.5); kick+=0.3*np.exp(-kt*120)*rng.standard_normal(len(kt))*0.2
ct=np.arange(int(0.25*SR))/SR; clap=hp(rng.standard_normal(len(ct)),900)*(np.exp(-ct*22)+0.6*np.exp(-np.maximum(ct-0.012,0)*30)*(ct>0.012)); clap=lp(clap[:,None].repeat(2,1),7000)[:,0]
ht=np.arange(int(0.08*SR))/SR; hat=hp(rng.standard_normal(len(ht)),7000)*np.exp(-ht*55)
oh=np.arange(int(0.22*SR))/SR; ohat=hp(rng.standard_normal(len(oh)),6000)*np.exp(-oh*16)
shaker=hp(rng.standard_normal(int(0.06*SR)),5000)*np.hanning(int(0.06*SR))

# arrangement: intro 0-2.1 sparse, groove after; breakdowns around section changes and outro
prog=[(57,[57,60,64,67]),(53,[53,57,60,64]),(48,[48,52,55,59]),(55,[55,59,62,65])]  # Am7 Fmaj7 Cmaj7 G7 (roots midi)
t=0.0; b=0
while t<DUR:
    bi=int(t/bar)
    full = CFG['full'][0]<t<CFG['full'][1]
    outro = t>=CFG['full'][1]
    for k in range(4):
        tb=t+k*beat
        if tb>=DUR: break
        brk = any(abs(tb-b)<0.6 for b in CFG['breaks'])
        if (full or outro) and not brk: add(drums,kick,tb,0.55 if full else 0.4)
        if full and k in(1,3) and not brk: add(drums,clap,tb,0.22,0.05)
        if (full or outro): 
            add(drums,ohat,tb+beat/2,0.10 if full else 0.07,0.3)
            for q in range(4): add(drums,shaker,tb+q*beat/4,0.05*(1.4 if q%2 else 0.8),-0.35)
        if full and not brk: add(drums,hat,tb+beat*0.75,0.06,0.4)
    # chord this bar
    root,ch=prog[bi%4]
    n=int(bar*SR); tt=np.arange(n)/SR
    p=np.zeros(n)
    for m in ch:
        for det in(-0.08,0.08):
            fq=m2f(m+12)*2**(det/12)
            ph=rng.random()
            p+= (2*((tt*fq+ph)%1)-1)*0.5
    p=lp(np.stack([p,p],1),1800 if t>1.9 else 900)[:,0]*env(n,0.4,0.3,0.8,0.6,bar-0.3)
    add(pad,p,t,0.13,(-0.2))
    add(pad,np.roll(p,int(0.013*SR)),t,0.13,0.2)
    # bass: 8th note pumping
    if t>1.9:
        for e in range(8):
            ln=int(beat/2*SR); te=np.arange(ln)/SR; fq=m2f(root-24)
            s=np.sin(2*np.pi*fq*te)+0.25*np.sin(4*np.pi*fq*te)
            s*=np.minimum(1,te*80)*np.exp(-te*5)*(0.55 if e%2==0 else 1.0)
            add(bass,s,t+e*beat/2,0.30)
    # pluck arpeggio 16ths
    arp=[ch[0]+12,ch[2]+12,ch[1]+24,ch[3]+12,ch[2]+24,ch[1]+12,ch[3]+24,ch[2]+12]
    for e in range(8):
        te_=t+e*beat/2
        ln=int(0.45*SR); te=np.arange(ln)/SR; fq=m2f(arp[e])
        s=(np.sin(2*np.pi*fq*te)+0.3*np.sin(2*np.pi*2*fq*te)+0.12*np.sin(2*np.pi*3*fq*te))*np.exp(-te*9)*np.minimum(1,te*400)
        add(pluck,s,te_,0.12,0.45 if e%2 else -0.45)
    t+=bar
# sidechain pump on pad & bass from kick grid
tt=np.arange(N)/SR; ph=(tt%beat)/beat; pump=0.45+0.55*np.minimum(1,ph/0.45)
pad*=pump[:,None]; bass*=(0.6+0.4*np.minimum(1,ph/0.3))[:,None]
mus=drums+bass+reverb(pad+pluck,2.6,0.35)
# filter sweep intro & dips around breaks
# final ending fade
fade=np.ones(N); fade*=np.clip((DUR-tt)/1.6,0,1); fade*=np.clip(tt/0.25,0,1)
mus*=fade[:,None]
# ---- SFX ----
def whoosh(d=0.7,up=True):
    n=int(d*SR); te=np.arange(n)/SR; x=rng.standard_normal(n)
    out=np.zeros(n); seg=2048
    for i in range(0,n,seg):
        c=(i/n); fc=300+ (c if up else 1-c)**2*6000
        out[i:i+seg]=lp(np.stack([x[i:i+seg]]*2,1),fc)[:,0]
    return out*np.sin(np.pi*te/d)**2
def pop(fq=900):
    n=int(0.12*SR); te=np.arange(n)/SR; return np.sin(2*np.pi*(fq*te+ fq*1.2*te*te*10))*np.exp(-te*38)
def ding(fq=1568):
    n=int(1.6*SR); te=np.arange(n)/SR; return sum(a*np.sin(2*np.pi*fq*h*te)*np.exp(-te*(3+h)) for h,a in((1,1),(2.01,.4),(3.0,.2),(4.2,.1)))
def shimmer(d=1.4):
    n=int(d*SR); te=np.arange(n)/SR; out=np.zeros(n)
    for k in range(14):
        fq=m2f(rng.choice([81,84,88,91,93,96])); st=int(k*0.07*SR)
        l=n-st; tk=np.arange(l)/SR; out[st:]+=np.sin(2*np.pi*fq*tk)*np.exp(-tk*5)*0.2
    return out
for i,c in enumerate(CFG['pops']): add(sfx,pop(820+(i%3)*140),c-0.04,0.13,(-0.3 if i%2 else 0.3))
for a in CFG['whoosh']: add(sfx,whoosh(0.8),a-0.55,0.18)
add(sfx,whoosh(0.6),0.0,0.13); add(sfx,shimmer(1.6),0.1,0.3)
add(sfx,shimmer(1.6),CFG['outro'],0.3)
add(sfx,pop(1300),CFG['click'],0.18); add(sfx,ding(),CFG['click']+0.05,0.1)
sfx=reverb(sfx,1.2,0.2)
for nm,v in (("drums",drums),("bass",bass),("pad",pad),("pluck",pluck)): print(nm, 20*np.log10(np.sqrt((v**2).mean())+1e-12))
mus=mus/np.abs(mus).max()*0.9
W(sys.argv[1]+'_music.wav',mus); W(sys.argv[1]+'_sfx.wav',sfx/max(1,np.abs(sfx).max()/0.9))
print('ok')
