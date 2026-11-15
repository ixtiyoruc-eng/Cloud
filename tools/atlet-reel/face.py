import cv2, numpy as np, json, sys, math
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
model, out = sys.argv[1], sys.argv[2]; vids=sys.argv[3:]
opts=vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=model),running_mode=vision.RunningMode.IMAGE,
  output_face_blendshapes=True,output_facial_transformation_matrixes=True,num_faces=1)
lm=vision.FaceLandmarker.create_from_options(opts)
res={}
for v in vids:
    cap=cv2.VideoCapture(v); fps=cap.get(cv2.CAP_PROP_FPS); i=0; nxt=0.0; rows=[]
    while True:
        ok,fr=cap.read()
        if not ok: break
        t=i/fps; i+=1
        if t+1e-6<nxt: continue
        nxt+=0.25
        h,w=fr.shape[:2]
        r=lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(fr,cv2.COLOR_BGR2RGB)))
        if not r.face_landmarks: rows.append({"t":round(t,3),"face":False}); continue
        L=r.face_landmarks[0]; xs=[p.x for p in L]; ys=[p.y for p in L]
        bs={b.category_name:b.score for b in r.face_blendshapes[0]}
        M=np.array(r.facial_transformation_matrixes[0])[:3,:3]
        pitch=math.degrees(math.atan2(-M[2,1],M[2,2])); yaw=math.degrees(math.asin(max(-1,min(1,M[2,0]))))
        rows.append({"t":round(t,3),"face":True,"cx":round(float(np.mean([L[1].x])),4),"cy":round(float(L[1].y),4),
          "x0":round(min(xs),4),"x1":round(max(xs),4),"y0":round(min(ys),4),"y1":round(max(ys),4),
          "eyes_cy":round((L[33].y+L[263].y)/2,4),"pitch":round(pitch,1),"yaw":round(yaw,1),
          "lookdown":round((bs['eyeLookDownLeft']+bs['eyeLookDownRight'])/2,3),
          "blink":round((bs['eyeBlinkLeft']+bs['eyeBlinkRight'])/2,3),
          "lookside":round(max(bs['eyeLookOutLeft'],bs['eyeLookOutRight'],bs['eyeLookInLeft'],bs['eyeLookInRight']),3)})
    res[v.split('/')[-1]]=rows; print(v,len(rows),flush=True)
json.dump(res,open(out,'w'))
