# Cover for the Atlet.uz '4 ta sport ozuqa' reel (from the Gym brat cover), in the Atlet cover style (Oswald + Instrument Serif italic + Montserrat pills, blue palette).
# All text sits inside the centre 4:5 area (y 285-1635) so the profile-grid crop keeps it. usage: cover.py FRAME.png OUT.jpg
import sys, os, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, out = sys.argv[1:3]
FD = os.path.expanduser('~/.fonts')
def vf(name, wght, size):
    f = ImageFont.truetype(f'{FD}/{name}', size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f
W, H = 1080, 1920
im = Image.open(src).convert('RGB').resize((W, H))
a = np.asarray(im).astype(np.float32) / 255
y = np.linspace(0, 1, H)[:, None, None]
shade = np.clip((y - 0.42) / 0.30, 0, 1) ** 1.3 * 0.86          # darken the chest area for the type
a = a * (1 - shade) + np.array([5, 12, 31], np.float32) / 255 * shade
a = a * (1 - 0.30 * np.clip((0.12 - y) / 0.12, 0, 1))           # slight top vignette
im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
d = ImageDraw.Draw(im)
BLUE, ICY, WHITE, NAVY = (111, 168, 255), (207, 227, 255), (255, 255, 255), (10, 27, 61)
def ctext(txt, font, yc, fill, glow=None, dx=0):
    w = d.textlength(txt, font=font); x = W / 2 - w / 2 + dx
    if glow:
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).text((x, yc), txt, font=font, fill=glow + (200,), anchor='lm')
        im.paste(g.filter(ImageFilter.GaussianBlur(18)), (0, 0), g.filter(ImageFilter.GaussianBlur(18)))
    d.text((x, yc), txt, font=font, fill=fill, anchor='lm')
    return w
ctext('ATLET.UZ  ·  XORAZM', vf('Montserrat[wght].ttf', 800, 36), 330, ICY)
ctext('Sport ozuqa:', ImageFont.truetype(f'{FD}/InstrumentSerif-Italic.ttf', 84), 992, WHITE)
ctext('QAYSI BIRI', vf('Oswald[wght].ttf', 700, 188), 1106, WHITE, glow=(90, 150, 255))
cy = 1262; d.line([(160, cy), (W - 160, cy)], fill=(111, 168, 255), width=3)
ctext('NIMA UÇUN?', vf('Oswald[wght].ttf', 700, 170), 1365, BLUE, glow=(61, 123, 255))
# pills: the six supplements in two rows
fp = vf('Montserrat[wght].ttf', 800, 34)
rows = [['L-KARNITIN', 'PROTEIN'], ['GEYNER', 'BCAA']]
for k, row in enumerate(rows):
    ws = [d.textlength(t, font=fp) + 56 for t in row]; gap = 18; x = W / 2 - (sum(ws) + gap * (len(ws) - 1)) / 2; yc = 1544 + k * 64
    for t, w in zip(row, ws):
        d.rounded_rectangle([x, yc - 27, x + w, yc + 27], radius=27, fill=NAVY, outline=BLUE, width=3)
        d.text((x + w / 2, yc), t, font=fp, fill=WHITE, anchor='mm'); x += w + gap
im.save(out, quality=93)
print('cover', out)
