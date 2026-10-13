# Assemble the final film: title card -> rendered camera move -> slow push-in on the top-down view -> closing card.
# Frames are streamed straight into ffmpeg (H.264 + AAC, 1080p24).
import sys, os, json, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
frames_dir, music, fonts, room_json, out = sys.argv[1:6]
FPS, W, H = 24, 1920, 1080
TITLE, END_HOLD, CARD = 3.0, 2.9, 3.1          # seconds: title card, push-in on top view, closing card
room = json.load(open(room_json)); sx, sy, sz = room['size_m']
PAPER = np.array([236, 231, 222], np.float32); INK = (58, 52, 46); SOFT = (120, 112, 102)
F = lambda n, s: ImageFont.truetype(f'{fonts}/{n}.ttf', s)
render_n = len([f for f in os.listdir(frames_dir) if f.startswith('f') and f.endswith('.png')])
total = TITLE + render_n/FPS + END_HOLD + CARD
def ease(t): t = min(max(t, 0), 1); return t*t*(3-2*t)

def text_layer(lines):
    """lines: [(text, font, colour, y, alpha)] centred; returns RGBA overlay"""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for txt, font, col, y, a in lines:
        if a <= 0: continue
        d.text((W/2, y), txt, font=font, fill=(*col, int(255*a)), anchor='mm')
    return im
f_title = F('SerifSC-Black', 120); f_sub = F('SerifSC-Regular', 40); f_small = F('SansSC-Light', 28)
f_end = F('SerifSC-SemiBold', 92)
paper_img = Image.new('RGB', (W, H), tuple(int(v) for v in PAPER))
def title_card(t):
    a1 = ease((t-0.25)/0.9); a2 = ease((t-0.8)/0.9); a3 = ease((t-1.2)/0.9)
    lay = text_layer([('我的大学宿舍', f_title, INK, H/2-70, a1),
                      ('离校前，用 iPhone 激光雷达留下的最后一次扫描', f_sub, SOFT, H/2+50, a2),
                      (f'{sx:.2f} m × {sy:.2f} m × {sz:.2f} m', f_small, SOFT, H/2+120, a3)])
    im = paper_img.copy(); im.paste(lay, (0, 0), lay); return im
end_big = Image.open(os.path.join(frames_dir, 'end_top.png')).convert('RGB')
def top_hold(t):          # slow push-in on the 4K top-down render, sub-pixel accurate
    z = 1.0 + 0.05*ease(t/(END_HOLD+CARD))
    cw, ch = end_big.width/z, end_big.height/z; x0, y0 = (end_big.width-cw)/2, (end_big.height-ch)/2
    return end_big.transform((W, H), Image.EXTENT, (x0, y0, x0+cw, y0+ch), Image.BICUBIC)
def closing(t):           # t from 0 at start of card
    base = top_hold(END_HOLD + t)
    fade = ease(t/1.0)*0.88
    im = Image.blend(base, paper_img, fade)
    lay = text_layer([('再见，宿舍', f_end, INK, H/2-30, ease((t-0.5)/0.9)),
                      ('谢谢这间屋子，和住在里面的那些年', f_sub, SOFT, H/2+60, ease((t-1.0)/0.9))])
    im.paste(lay, (0, 0), lay); return im

if os.environ.get('PREVIEW'):
    for t in (0.5, 1.8, 2.7): title_card(t).save(f"{os.environ['PREVIEW']}/pv_title_{t}.jpg", quality=88)
    for t in (0.0, 2.0): top_hold(t).save(f"{os.environ['PREVIEW']}/pv_hold_{t}.jpg", quality=88)
    for t in (0.6, 2.4): closing(t).save(f"{os.environ['PREVIEW']}/pv_close_{t}.jpg", quality=88)
    sys.exit(0)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-i', music, '-filter_complex', '[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=%.2f:d=2.5[a]' % (total-2.5),
                       '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                       '-profile:v', 'high', '-level', '4.1', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
                       '-movflags', '+faststart', '-metadata', 'title=我的大学宿舍', '-metadata', 'comment=iPhone LiDAR scan of my dorm room before graduation, restored',
                       out], stdin=subprocess.PIPE)
n_title = int(TITLE*FPS); n_hold = int(END_HOLD*FPS); n_card = int(CARD*FPS)
first = Image.open(os.path.join(frames_dir, 'f0000.png')).convert('RGB')
for i in range(n_title):                       # title card, last 0.6 s crossfades into the first rendered frame
    t = i/FPS; im = title_card(t)
    k = ease((t-(TITLE-0.6))/0.6)
    if k > 0: im = Image.blend(im, first, k)
    ff.stdin.write(im.tobytes())
for i in range(render_n):
    ff.stdin.write(Image.open(os.path.join(frames_dir, f'f{i:04d}.png')).convert('RGB').tobytes())
last = Image.open(os.path.join(frames_dir, f'f{render_n-1:04d}.png')).convert('RGB')
for i in range(n_hold):                        # 0.3 s dissolve from the last 1080p frame into the 4K still, then push in
    im = top_hold(i/FPS); k = ease(i/(0.3*FPS))
    ff.stdin.write((Image.blend(last, im, k) if k < 1 else im).tobytes())
for i in range(n_card): ff.stdin.write(closing(i/FPS).tobytes())
ff.stdin.close(); ff.wait()
print('video', out, round(total, 2), 's', os.path.getsize(out)//1024, 'KB')
