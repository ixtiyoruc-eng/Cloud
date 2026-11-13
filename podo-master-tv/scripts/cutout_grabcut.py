import cv2, numpy as np
im=cv2.imread('/mnt/user-data/uploads/ce651bd1-image.jpg')
X0,Y0,X1,Y1=250,430,1080,1420
c=im[Y0:Y1,X0:X1].copy(); h,w=c.shape[:2]
hsv=cv2.cvtColor(c,cv2.COLOR_BGR2HSV)
teal=((hsv[...,0]>78)&(hsv[...,0]<100)&(hsv[...,1]>90)&(hsv[...,2]>90)).astype(np.uint8)
teal[120:,:]=0  # only the caption letters at the top
teal=cv2.dilate(teal,np.ones((7,7),np.uint8))
c=cv2.inpaint(c,teal*255,9,cv2.INPAINT_TELEA)
cv2.imwrite('/tmp/c_inp.jpg',c)
m=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
# probable fg rect
m[30:h, 110:w-15]=cv2.GC_PR_FGD
# definite bg: left wall strip above hands, top band
m[:, :90]=cv2.GC_BGD
m[:25,:]=cv2.GC_BGD
m[:640-0, :160]=cv2.GC_BGD
m[:470,700:]=cv2.GC_BGD
m[:,795:]=cv2.GC_BGD
# shoes on wall right of head (orig x760-900,y630-770)
m[200:320, 545:640]=cv2.GC_PR_BGD
# sure fg: face/hijab ellipse and torso
cv2.ellipse(m,(630-X0,690-Y0),(120,170),0,0,360,cv2.GC_FGD,-1)
cv2.rectangle(m,(520-X0,900-Y0),(900-X0,1400-Y0),cv2.GC_FGD,-1)
bg=np.zeros((1,65)); fg=np.zeros((1,65))
cv2.grabCut(c,m,None,bg,fg,8,cv2.GC_INIT_WITH_MASK)
a=np.where((m==cv2.GC_FGD)|(m==cv2.GC_PR_FGD),255,0).astype(np.uint8)
a=cv2.morphologyEx(a,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
a=cv2.morphologyEx(a,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(a)
k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); a=np.where(lab==k,255,0).astype(np.uint8)
# fill holes
inv=255-a; n,lab,st,_=cv2.connectedComponentsWithStats(inv)
for i in range(1,n):
    x,y,ww,hh,ar=st[i]
    if x>0 and y>0 and x+ww<w and y+hh<h: a[lab==i]=255
a=cv2.GaussianBlur(a,(5,5),0)
# bottom fade
fade=np.ones(h); fade[h-160:]=np.linspace(1,0,160)**1.4
a=(a*fade[:,None]).astype(np.uint8)
rgba=cv2.cvtColor(c,cv2.COLOR_BGR2BGRA); rgba[...,3]=a
cv2.imwrite('ixlos_cut.png',rgba)
# preview on turquoise
bgc=np.full_like(c,(192,193,0)); al=a[...,None]/255
cv2.imwrite('/tmp/prev.jpg',(c*al+bgc*(1-al)).astype(np.uint8))
