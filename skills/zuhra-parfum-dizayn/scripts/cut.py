import sys, subprocess, json
W = sys.argv[1]
KEEP = {'A': [[0.75,75.5],[76.55,78.45],[79.3,84.9],[88.6,90.9],[91.65,97.0]],
        'B': [[0.0,6.75],[7.45,22.9],[26.6,62.9]]}
json.dump(KEEP, open(f'{W}/pipe/keep.json','w'))
for v, segs in KEEP.items():
    fc=[]; ins=[]
    for i,(a,b) in enumerate(segs):
        fc.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]')
        fc.append(f'[1:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b-a-0.02:.3f}:d=0.02[a{i}]')
        ins.append(f'[v{i}][a{i}]')
    fc.append(''.join(ins)+f'concat=n={len(segs)}:v=1:a=1[v][a]')
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'{W}/pipe/{v}_stab.mp4','-i',f'{W}/drive2/{v}.mov','-filter_complex',';'.join(fc),
        '-map','[v]','-map','[a]','-c:v','libx264','-crf','13','-preset','veryfast','-c:a','pcm_s16le',f'{W}/pipe/{v}_cut.mov'],check=True)
    print(v, sum(b-a for a,b in segs))
