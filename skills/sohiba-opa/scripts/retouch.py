import sys, os, cv2, numpy as np, mediapipe as mp, subprocess
from mediapipe.tasks import python as P
from mediapipe.tasks.python import vision as V
import os
S=os.environ.get('WORK',os.path.expanduser('~/sohiba'))+'/'
OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
LIPS=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185]
LIPIN=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191]
LEYE=[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
REYE=[362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
LBROW=[70,63,105,66,107,55,65,52,53,46]
RBROW=[300,293,334,296,336,285,295,282,283,276]
LCHEEK=205; RCHEEK=425
def make_lm():
    return V.FaceLandmarker.create_from_options(V.FaceLandmarkerOptions(base_options=P.BaseOptions(model_asset_path=S+'models/face_landmarker.task'),num_faces=1,min_face_detection_confidence=0.3,min_face_presence_confidence=0.3))
def poly(mask,pts,idx,val=255):
    cv2.fillPoly(mask,[cv2.convexHull(pts[idx].astype(np.int32))],val)
def grade(img):
    # global grade: lift, gentle contrast, warm
    f=img.astype(np.float32)/255.
    f=np.power(f,0.88)
    f=f+0.10*f*(1-f)*4*(f-0.35)  # mild s-curve
    f[...,2]*=1.035; f[...,0]*=0.975
    hsv=cv2.cvtColor(np.clip(f,0,1),cv2.COLOR_BGR2HSV); hsv[...,1]*=1.10
    return np.clip(cv2.cvtColor(hsv,cv2.COLOR_HSV2BGR),0,1)
def retouch(img,pts,strength=1.0):
    """img uint8 BGR, pts Nx2 px coords (smoothed)"""
    h,w=img.shape[:2]
    f=grade(img)
    if pts is None: return (f*255+0.5).astype(np.uint8)
    x0,y0=pts[OVAL].min(0); x1,y1=pts[OVAL].max(0)
    fw=x1-x0; pad=int(fw*0.45)
    X0=max(0,int(x0-pad));Y0=max(0,int(y0-pad));X1=min(w,int(x1+pad));Y1=min(h,int(y1+pad*1.6))
    roi=f[Y0:Y1,X0:X1].copy(); p=pts-np.array([X0,Y0])
    rh,rw=roi.shape[:2]
    k=max(3,int(fw*0.035))|1
    # skin colour mask (YCrCb) incl. neck
    ycc=cv2.cvtColor((roi*255).astype(np.uint8),cv2.COLOR_BGR2YCrCb)
    skin=((ycc[...,1]>136)&(ycc[...,1]<178)&(ycc[...,2]>85)&(ycc[...,2]<130)&(ycc[...,0]>70)).astype(np.uint8)*255
    region=np.zeros((rh,rw),np.uint8); poly(region,p,OVAL)
    region=cv2.dilate(region,np.ones((k*3,k*3),np.uint8))
    # extend down for neck
    neck=np.zeros((rh,rw),np.uint8)
    chin=p[152]; cv2.ellipse(neck,(int(chin[0]-fw*0.05),int(chin[1]+fw*0.25)),(int(fw*0.45),int(fw*0.5)),0,0,360,255,-1)
    m=cv2.bitwise_and(skin,cv2.bitwise_or(region,neck))
    ex=np.zeros((rh,rw),np.uint8)
    for idx in (LEYE,REYE,LBROW,RBROW,LIPS): poly(ex,p,idx)
    ex=cv2.dilate(ex,np.ones((k,k),np.uint8))
    m[ex>0]=0
    m=cv2.erode(m,np.ones((3,3),np.uint8))
    mf=cv2.GaussianBlur(m,(0,0),k*0.9).astype(np.float32)/255.
    # frequency separation smoothing
    d=max(5,int(fw*0.05))
    sm=cv2.bilateralFilter(roi,d,0.085,d*1.2)
    sm=cv2.bilateralFilter(sm,d,0.06,d*1.2)
    hi=roi-cv2.GaussianBlur(roi,(0,0),1.2)   # fine pores
    out=sm+hi*0.55
    # even out blotches: low-frequency dodge within skin
    a=(0.62*strength*mf)[...,None]
    res=roi*(1-a)+out*a
    # subtle brighten + warm skin (foundation)
    res=res+ (mf[...,None]*np.array([0.004,0.012,0.022],np.float32))*strength
    # shine reduction: compress highlights on skin
    lum=res.max(2); hl=np.clip((lum-0.78)/0.22,0,1)*mf
    res=res*(1-0.10*hl[...,None])
    # blush
    for c in (LCHEEK,RCHEEK):
        b=np.zeros((rh,rw),np.float32)
        cv2.ellipse(b,(int(p[c][0]),int(p[c][1])),(int(fw*0.17),int(fw*0.11)),-15,0,360,1,-1)
        b=cv2.GaussianBlur(b,(0,0),fw*0.07)*mf
        res=res*(1-0.085*b[...,None])+np.array([0.42,0.40,0.86],np.float32)*0.085*b[...,None]
    # lips: richer rose
    lm_=np.zeros((rh,rw),np.uint8); poly(lm_,p,LIPS); inn=np.zeros((rh,rw),np.uint8); poly(inn,p,LIPIN); 
    cv2.fillPoly(inn,[p[LIPIN].astype(np.int32)],255); lm_=np.zeros((rh,rw),np.uint8); cv2.fillPoly(lm_,[p[LIPS].astype(np.int32)],255)
    lm_[inn>0]=0
    lf=cv2.GaussianBlur(lm_,(0,0),max(1.5,fw*0.012)).astype(np.float32)/255.
    hsv=cv2.cvtColor(np.clip(res,0,1).astype(np.float32),cv2.COLOR_BGR2HSV)
    hsv[...,1]=np.clip(hsv[...,1]*(1+0.15*lf),0,1); hsv[...,2]=hsv[...,2]*(1-0.03*lf)
    res=cv2.cvtColor(hsv,cv2.COLOR_HSV2BGR)
    # eyes: tiny clarity
    em=np.zeros((rh,rw),np.uint8); poly(em,p,LEYE); poly(em,p,REYE)
    ef=cv2.GaussianBlur(em,(0,0),2).astype(np.float32)/255.
    sharp=res+(res-cv2.GaussianBlur(res,(0,0),2))*0.5
    res=res*(1-ef[...,None])+sharp*ef[...,None]
    f[Y0:Y1,X0:X1]=res
    return (np.clip(f,0,1)*255+0.5).astype(np.uint8)
def detect(lm,img):
    r=lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks: return None
    h,w=img.shape[:2]
    return np.array([[q.x*w,q.y*h] for q in r.face_landmarks[0]],np.float32)
if __name__=='__main__':
    if sys.argv[1]=='test':
        lm=make_lm(); img=cv2.imread(sys.argv[2]); pts=detect(lm,img)
        o=retouch(img,pts); cv2.imwrite(sys.argv[3],np.hstack([img,o]),[cv2.IMWRITE_JPEG_QUALITY,95])
        x0,y0=pts[OVAL].min(0).astype(int)-60; x1,y1=pts[OVAL].max(0).astype(int)+60
        cv2.imwrite(sys.argv[3].replace('.jpg','_crop.jpg'),np.hstack([img[y0:y1,x0:x1],o[y0:y1,x0:x1]]),[cv2.IMWRITE_JPEG_QUALITY,95])
