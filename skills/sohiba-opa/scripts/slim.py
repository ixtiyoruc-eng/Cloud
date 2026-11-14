import sys, os, cv2, numpy as np, mediapipe as mp
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import retouch as R
from mediapipe.tasks import python as P
from mediapipe.tasks.python import vision as V
import os
S=os.environ.get('WORK',os.path.expanduser('~/sohiba'))+'/'
def make_seg():
    return V.ImageSegmenter.create_from_options(V.ImageSegmenterOptions(base_options=P.BaseOptions(model_asset_path=S+'models/selfie_multiclass.tflite'),output_confidence_masks=True,output_category_mask=False))
def person_mask(seg,img):
    h,w=img.shape[:2]
    small=cv2.resize(img,(w//3,h//3),interpolation=cv2.INTER_AREA)
    r=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(small,cv2.COLOR_BGR2RGB)))
    bg=r.confidence_masks[0].numpy_view().astype(np.float32)
    m=1-bg
    return m  # low-res (h/3,w/3)
JAW_L=[172,136,150,149]; JAW_R=[397,365,379,378]; CHIN=[176,148,152,377,400]
def warp(img,pts,k=1.0):
    """liquify: slim jaw/cheeks, lift under-chin. pts: Nx2"""
    h,w=img.shape[:2]
    o=pts[R.OVAL]; fw=o[:,0].max()-o[:,0].min()
    cen=(pts[234]+pts[454])/2*0.5+pts[1]*0.5
    dn=pts[152]-pts[10]; dn/=np.linalg.norm(dn)
    ctrl=[]
    for i in JAW_L+JAW_R+[213,433,58,288]:
        v=cen-pts[i]; v/=np.linalg.norm(v)+1e-6
        ctrl.append((pts[i],v*0.040*fw*k,0.30*fw))
    for i in CHIN:
        v=cen-pts[i]; v/=np.linalg.norm(v)+1e-6
        ctrl.append((pts[i],v*0.022*fw*k,0.26*fw))
    for i,off,mag in [(152,0.20,0.085),(148,0.20,0.08),(377,0.20,0.08),(176,0.19,0.075),(400,0.19,0.075),(150,0.17,0.06),(379,0.17,0.06),(149,0.18,0.065),(378,0.18,0.065),(152,0.40,0.05),(377,0.38,0.045),(148,0.38,0.045)]:
        ctrl.append((pts[i]+dn*off*fw,-dn*mag*fw*k,0.34*fw))
    allc=np.array([c for c,_,_ in ctrl]); rad=0.5*fw
    x0=int(max(0,allc[:,0].min()-rad)); x1=int(min(w,allc[:,0].max()+rad)); y0=int(max(0,allc[:,1].min()-rad)); y1=int(min(h,allc[:,1].max()+rad))
    gx,gy=np.meshgrid(np.arange(x0,x1,dtype=np.float32),np.arange(y0,y1,dtype=np.float32))
    dx=np.zeros_like(gx); dy=np.zeros_like(gy)
    for c,v,r in ctrl:
        d2=((gx-c[0])**2+(gy-c[1])**2)/(r*r)
        f=np.clip(1-d2,0,1)**2
        dx+=v[0]*f; dy+=v[1]*f
    # cap total displacement
    mag=np.sqrt(dx*dx+dy*dy); cap=0.085*fw*k
    s=np.minimum(1,cap/(mag+1e-6)); dx*=s; dy*=s
    out=img.copy()
    out[y0:y1,x0:x1]=cv2.remap(img,gx-dx,gy-dy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    return out
def contour(img,pts,k=1.0):
    """soft jaw shadow (contouring) just under jawline"""
    h,w=img.shape[:2]; o=pts[R.OVAL]; fw=o[:,0].max()-o[:,0].min()
    dn=pts[152]-pts[10]; dn/=np.linalg.norm(dn)
    m=np.zeros((h,w),np.float32)
    line=np.array([pts[i]+dn*0.07*fw for i in [136,150,149,176,148,152,377,400,378,379,365]],np.int32)
    cv2.polylines(m,[line],False,1.0,int(fw*0.09))
    m=cv2.GaussianBlur(m,(0,0),fw*0.05)
    f=img.astype(np.float32)
    f*= (1-0.13*k*m)[...,None]
    return np.clip(f,0,255).astype(np.uint8)
def bg_soft(img,mlow,blur=7,dark=0.80):
    h,w=img.shape[:2]
    m=cv2.resize(mlow,(w,h),interpolation=cv2.INTER_LINEAR)
    m=cv2.GaussianBlur(m,(0,0),6); m=np.clip((m-0.35)/0.4,0,1)[...,None]
    small=cv2.resize(img,(w//4,h//4),interpolation=cv2.INTER_AREA)
    b=cv2.resize(cv2.GaussianBlur(small,(0,0),blur),(w,h),interpolation=cv2.INTER_CUBIC).astype(np.float32)
    # warm-dark tint for background
    b=b*dark*np.array([0.96,0.97,1.03],np.float32)
    return np.clip(img.astype(np.float32)*m+b*(1-m),0,255).astype(np.uint8)
if __name__=='__main__':
    lm=R.make_lm(); seg=make_seg()
    src=cv2.imread(sys.argv[1]); 
    pts=R.detect(lm,src)
    a=R.retouch(src,pts)
    w1=warp(src,pts); pts2=R.detect(lm,w1)
    b=R.retouch(w1,pts2); b=contour(b,pts2)
    b=bg_soft(b,person_mask(seg,w1))
    cv2.imwrite(sys.argv[2],np.hstack([a,b]),[cv2.IMWRITE_JPEG_QUALITY,93])
