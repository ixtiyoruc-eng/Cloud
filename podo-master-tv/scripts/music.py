import numpy as np, wave
SR=48000; DUR=97.0; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(3)
def add(sig,t0,pan=0.0,gain=1.0):
    i0=int(t0*SR)%N; n=len(sig); idx=(np.arange(n)+i0)%N
    gl=np.cos((pan+1)*np.pi/4)*gain; gr=np.sin((pan+1)*np.pi/4)*gain
    np.add.at(L,idx,sig*gl); np.add.at(R,idx,sig*gr)
def env(n,a,r):
    e=np.ones(n); na=int(a*SR); nr=int(r*SR)
    e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr)**2; return e
mf=lambda m:440*2**((m-69)/12)
BPM=160*60/97; beat=60/BPM; bar=4*beat
# chords (midi) Am9, Fmaj7, C(add9), G6  -> each 2 bars
CH=[[57,60,64,67,71],[53,57,60,64,69],[48,55,60,64,62+12],[55,59,62,64,67]]
def pad(freqs,d):
    n=int(d*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for f in freqs:
        for det in (-0.12,0,0.12):
            ph=rng.uniform(0,6.28)
            s+=np.sin(2*np.pi*f*2**(det/12)*t+ph)+0.25*np.sin(4*np.pi*f*2**(det/12)*t+ph)
    # gentle lowpass via moving average
    k=np.ones(24)/24; s=np.convolve(s,k,'same')
    return s*env(n,1.5,2.0)/ (len(freqs)*3)
nb=int(DUR/bar)  # 32 bars
for b in range(0,nb,2):
    ch=CH[(b//2)%4]
    add(pad([mf(m) for m in ch],2*bar+2.0),b*bar,0,0.22)
    add(np.sin(2*np.pi*mf(ch[0]-12)*np.arange(int(2*bar*SR))/SR)*env(int(2*bar*SR),.4,1.0),b*bar,0,0.16)
# pluck arpeggio (8ths)
def pluck(f,d=1.2):
    n=int(d*SR); t=np.arange(n)/SR
    s=(np.sin(2*np.pi*f*t)+.4*np.sin(4*np.pi*f*t)+.15*np.sin(6*np.pi*f*t))*np.exp(-t*4.5)
    s[:200]*=np.linspace(0,1,200); return s
pat=[0,2,4,3,1,4,2,3]
for b in range(nb):
    ch=CH[(b//2)%4]
    if b%8 in (0,1) and b<2: continue
    for k in range(8):
        m=ch[pat[k]%len(ch)]+12
        add(pluck(mf(m)),b*bar+k*beat/2,0.35*(1 if k%2 else -1),0.06*(1 if k%4==0 else .7))
# soft kick + shaker from bar 4, breakdown none (calm)
def kick():
    n=int(.35*SR); t=np.arange(n)/SR; f=50+70*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def shaker():
    n=int(.08*SR); s=rng.standard_normal(n); s=np.diff(np.concatenate([[0],s])); return s*np.exp(-np.arange(n)/SR*60)
for b in range(nb):
    for k in range(4):
        add(kick(),b*bar+k*beat,0,0.22 if k in (0,2) else 0.0)
        add(shaker(),b*bar+k*beat+beat/2,0.3,0.035)
music=np.stack([L,R],1)
music/=np.max(np.abs(music))*1.25
# SFX
S_L=np.zeros(N);S_R=np.zeros(N)
def addS(sig,t0,g=1.0,pan=0):
    i0=int(t0*SR)%N; idx=(np.arange(len(sig))+i0)%N
    np.add.at(S_L,idx,sig*g*np.cos((pan+1)*np.pi/4)); np.add.at(S_R,idx,sig*g*np.sin((pan+1)*np.pi/4))
def whoosh(d=0.9):
    n=int(d*SR); t=np.arange(n)/SR; s=rng.standard_normal(n)
    # sweep bandpass approx: lowpass with varying window
    out=np.zeros(n); x=np.linspace(0,1,n); e=np.sin(np.pi*x)**2
    lp=np.convolve(s,np.ones(30)/30,'same'); hp=s-np.convolve(s,np.ones(6)/6,'same')
    out=(lp*(1-x)+hp*x*.4)*e
    return out/np.max(np.abs(out))
def click():
    n=int(.05*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*2400*t)*.6+rng.standard_normal(n)*.3)*np.exp(-t*140)
def chime(f=1318.5):
    n=int(1.2*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.5*t))*np.exp(-t*4)
def tick():
    n=int(.03*SR); t=np.arange(n)/SR; return rng.standard_normal(n)*np.exp(-t*250)
for c in [4.2,12.6,25.7,34.9,52.0,74.0,80.2,90.2]:
    addS(whoosh(),c-0.45,0.18)
for i in range(3): addS(chime(1567.98),27.6+i*.9,0.05)
for i in range(3): addS(whoosh(.5),38.3+i*4.5+1.4,0.08); addS(chime(1318.5),38.3+i*4.5+2.2,0.06)
for i in range(4): addS(click(),83.6+i*.18,0.12)
addS(chime(1046.5),91.6,0.10); addS(chime(1568),91.8,0.07)
sfx=np.stack([S_L,S_R],1)
mix=music*0.55+sfx
mix/=np.max(np.abs(mix))*1.05
pcm=(mix*32767).astype(np.int16)
w=wave.open('mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok')
