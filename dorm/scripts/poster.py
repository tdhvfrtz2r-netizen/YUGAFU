# Annotated floor plan + printable A3 memorial poster (300 dpi) from the rendered stills.
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
stills, room_json, fonts, out_dir = sys.argv[1:5]
room = json.load(open(room_json)); mp = json.load(open(f'{stills}/plan_mapping.json'))
W, H = room['size_m'][0], room['size_m'][1]; Hc = room['size_m'][2]
F = lambda name, size: ImageFont.truetype(f'{fonts}/{name}.ttf', size)
INK = (58, 52, 46); SOFT = (120, 112, 102); PAPER = (236, 231, 222); ACCENT = (150, 92, 62)

# ---------- floor plan ----------
plan = Image.open(f'{stills}/06_floor_plan_raw.png').convert('RGB'); d = ImageDraw.Draw(plan)
s = mp['px_per_m']; cx, cy = mp['W']/2, mp['H']/2
P = lambda x, y: (cx + x*s, cy - y*s)
x0, x1 = room['x']; y0, y1 = room['y']; WIN = room['openings']['window']; DOOR = room['openings']['door']
wt = 14  # wall line weight
def seg(a, b): d.line([P(*a), P(*b)], fill=INK, width=wt)
seg((x0, y0), (x0, y1)); seg((x1, y0), (x1, y1))
seg((x0, y1), (WIN['x'][0], y1)); seg((WIN['x'][1], y1), (x1, y1))
seg((x0, y0), (DOOR['x'][0], y0)); seg((DOOR['x'][1], y0), (x1, y0))
for cxw in [x0, x1]:
    for cyw in [y0, y1]:
        px, py = P(cxw, cyw); d.rectangle([px-wt/2, py-wt/2, px+wt/2, py+wt/2], fill=INK)
# window: thin double line; door: swing arc
for off in (-0.03, 0.03): d.line([P(WIN['x'][0], y1+off), P(WIN['x'][1], y1+off)], fill=INK, width=4)
dx0, dx1 = DOOR['x']; r = (dx1-dx0)*s; hx, hy = P(dx0, y0)
d.arc([hx-r, hy-r, hx+r, hy+r], 270, 360, fill=SOFT, width=4); d.line([P(dx0, y0), P(dx0, y0+(dx1-dx0))], fill=SOFT, width=4)
f_dim = F('SansSC-Regular', 54); f_lab = F('SerifSC-SemiBold', 62); f_small = F('SansSC-Light', 44)
def dim_line(a, b, text, offset, vertical):
    (ax, ay), (bx, by) = P(*a), P(*b)
    if vertical: ax += offset; bx += offset
    else: ay += offset; by += offset
    d.line([(ax, ay), (bx, by)], fill=SOFT, width=4)
    for (px, py) in [(ax, ay), (bx, by)]:
        if vertical: d.line([(px-22, py), (px+22, py)], fill=SOFT, width=4)
        else: d.line([(px, py-22), (px, py+22)], fill=SOFT, width=4)
    mx, my = (ax+bx)/2, (ay+by)/2
    if vertical:
        tw = d.textbbox((0, 0), text, font=f_dim); t = Image.new('RGBA', (tw[2]+20, tw[3]+20), (0, 0, 0, 0))
        ImageDraw.Draw(t).text((10, 5), text, font=f_dim, fill=SOFT); t = t.rotate(90, expand=True)
        plan.paste(t, (int(mx - t.width - 14 if offset < 0 else mx + 14), int(my - t.height/2)), t)
    else:
        d.text((mx, my + (-14 if offset < 0 else 14)), text, font=f_dim, fill=SOFT, anchor='md' if offset < 0 else 'ma')
dim_line((x0, y0), (x1, y0), f'{W:.2f} m', 190, False)
dim_line((x0, y0), (x0, y1), f'{H:.2f} m', -150, True)
px, py = P(WIN['x'][1] + 0.12, y1); d.text((px, py - 40), '窗', font=f_lab, fill=INK, anchor='lb')
px, py = P(0, y0); d.text((P(dx1, y0)[0] + 40, py + 60), '门', font=f_lab, fill=INK, anchor='la')
# scale bar 1 m
bx, by = P(x1 - 1.0, y0)[0], P(0, y0)[1] + 330
d.rectangle([bx, by, bx + s*0.5, by + 16], fill=INK); d.rectangle([bx + s*0.5, by, bx + s, by + 16], outline=INK, width=4)
d.text((bx, by + 30), '0', font=f_small, fill=SOFT, anchor='ma'); d.text((bx + s, by + 30), '1 m', font=f_small, fill=SOFT, anchor='ma')
plan.save(f'{out_dir}/06_floor_plan.png')

# ---------- poster (A3 portrait, 300 dpi) ----------
PW, PH = 3508, 4961; M = 230
poster = Image.new('RGB', (PW, PH), PAPER); dp = ImageDraw.Draw(poster)
def autocrop(img, pad=40, bg=None):
    a = np.asarray(img.convert('RGB')).astype(int); bgc = a[5, 5] if bg is None else np.array(bg)
    m = np.abs(a - bgc).sum(2) > 18; ys, xs = np.where(m)
    return img.crop((max(0, xs.min()-pad), max(0, ys.min()-pad), min(img.width, xs.max()+pad), min(img.height, ys.max()+pad)))
def fit(img, w, h):
    r = min(w/img.width, h/img.height); return img.resize((int(img.width*r), int(img.height*r)), Image.LANCZOS)
def shadowed(img, rad=0):
    return img
# title block
dp.text((M, 300), '我的大学宿舍', font=F('SerifSC-Black', 230), fill=INK)
dp.text((M+8, 600), '离校前，用 iPhone 激光雷达留下的最后一次扫描', font=F('SerifSC-Regular', 76), fill=SOFT)
dp.text((M+8, 720), 'THE ROOM WE LIVED IN  ·  LIDAR SCAN BEFORE GRADUATION', font=F('SansSC-Light', 48), fill=SOFT)
dp.line([(M, 850), (PW-M, 850)], fill=(200, 192, 180), width=3)
# hero
hero = autocrop(Image.open(f'{stills}/01_dollhouse_window.png'), 30)
hero = fit(hero, PW - 2*M, 1950); hx = (PW - hero.width)//2; poster.paste(hero, (hx, 920))
# lower band: floor plan (left) + two interior views (right)
top = 920 + hero.height + 90
band_h = PH - top - 520
pl = autocrop(Image.open(f'{out_dir}/06_floor_plan.png'), 20)
pl = fit(pl, 1180, band_h); poster.paste(pl, (M, top + (band_h - pl.height)//2))
rx = M + 1180 + 110; rw = PW - M - rx
ins = [Image.open(f'{stills}/{k}.png').convert('RGB') for k in ('07_inside_to_window', '09_inside_to_door')]
gap = 70; ih = (band_h - gap)//2
for i, im in enumerate(ins):
    im = fit(im, rw, ih)
    # cover-crop to exact box
    r = max(rw/im.width, ih/im.height); im = im.resize((int(im.width*r)+1, int(im.height*r)+1), Image.LANCZOS)
    im = im.crop(((im.width-rw)//2, (im.height-ih)//2, (im.width-rw)//2 + rw, (im.height-ih)//2 + ih))
    poster.paste(im, (rx, top + i*(ih + gap)))
cap = F('SansSC-Light', 42)
dp.text((rx, top + ih + 12), '从门口望向窗', font=cap, fill=SOFT)
dp.text((rx, top + 2*ih + gap + 12), '从窗边望向门', font=cap, fill=SOFT)
# footer facts
fy = PH - 380
dp.line([(M, fy - 40), (PW-M, fy - 40)], fill=(200, 192, 180), width=3)
facts = [(f'{W:.2f} × {H:.2f} m', '开间 × 进深'), (f'{Hc:.2f} m', '层高'), (f'{W*H:.1f} m²', '面积'), ('231,891', '三角面 · 激光雷达点云重建')]
cw = (PW - 2*M) / len(facts)
for i, (big, small) in enumerate(facts):
    x = M + i*cw
    dp.text((x, fy), big, font=F('SerifSC-SemiBold', 92), fill=INK)
    dp.text((x+4, fy + 130), small, font=F('SansSC-Light', 46), fill=SOFT)
poster.save(f'{out_dir}/00_poster_A3.png', dpi=(300, 300))
poster.convert('RGB').save(f'{out_dir}/00_poster_A3.jpg', quality=93, dpi=(300, 300))
print('poster ok', poster.size)
