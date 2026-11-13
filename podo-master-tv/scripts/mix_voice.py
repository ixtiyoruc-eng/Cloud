# usage: python3 mix.py <voice_dir_with_script.json+seg*.mp3> <music.wav> <out_dir>
import json,subprocess,sys,os
vd,music,out=sys.argv[1:4]; d=json.load(open(os.path.join(vd,'script.json')))
ins=[];f=[]
for i,(t,_) in enumerate(d):
    ins+=['-i',os.path.join(vd,f'seg{i}.mp3')]; ms=int(t*1000); f.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms}[v{i}]')
n=len(d); f.append(''.join(f'[v{i}]' for i in range(n))+f'amix=inputs={n}:normalize=0,apad,atrim=0:97,loudnorm=I=-16:TP=-1.5[vo]')
vw=os.path.join(out,'voice.wav')
subprocess.run(['ffmpeg','-loglevel','error','-y',*ins,'-filter_complex',';'.join(f),'-map','[vo]','-ac','2','-ar','48000',vw],check=True)
subprocess.run(['ffmpeg','-loglevel','error','-y','-i',music,'-i',vw,'-filter_complex',
 '[0:a]aresample=48000,atrim=0:97,loudnorm=I=-24[m];[1:a]asplit[vk][vm];[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=600[md];[md][vm]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[o]',
 '-map','[o]','-ar','48000',os.path.join(out,'final_audio.wav')],check=True)
