# Texture atlas repair: rasterise UV charts -> mask; bleed chart colours into the empty
# (black) gutter so seams and mipmaps no longer pick up black; gentle tone + sharpening.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
Image.MAX_IMAGE_PIXELS = None
npz, tex_in, out_dir = sys.argv[1:4]
d = np.load(npz); UV, F = d['UV'], d['F']
im = Image.open(tex_in).convert('RGB'); W, H = im.size
# 1. chart mask from UV triangles (texture rows go top->bottom, UV v goes bottom->top)
mask_im = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(mask_im)
tri = UV[F] * np.array([W, H]); tri[...,1] = H - tri[...,1]
for t in tri: dr.polygon([tuple(p) for p in t], fill=255, outline=255)
mask = np.array(mask_im) > 0
print('chart coverage', round(mask.mean()*100,1), '%')
a = np.array(im)
# texels on the chart rim are often blended with the black gutter: treat near-black rim texels as invalid
rim = mask & ~ndimage.binary_erosion(mask, iterations=2)
dark = a.max(2) < 18
valid = mask & ~(rim & dark)
print('rim texels dropped', int((rim & dark).sum()))
# 2. bleed: every invalid texel takes the colour of the nearest valid texel
idx = ndimage.distance_transform_edt(~valid, return_distances=False, return_indices=True)
filled = a[idx[0], idx[1]]; del idx
# soften the far gutter a little so mip levels average smoothly (inside charts untouched)
blur = np.array(Image.fromarray(filled).filter(ImageFilter.GaussianBlur(3)))
filled = np.where(valid[...,None], filled, blur).astype(np.uint8)
Image.fromarray(filled).save(f'{out_dir}/tex_bleed.png', optimize=False)
# 3. gentle enhancement for clarity: unsharp mask + slight contrast/vibrance (kept mild to stay true to the photos)
f = Image.fromarray(filled).filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
x = np.asarray(f).astype(np.float32)/255.0
lum = x @ np.array([0.2126, 0.7152, 0.0722], np.float32)
lo, hi = np.percentile(lum[valid], [0.5, 99.6]); print('lum percentiles', lo, hi)
y = np.clip((x - lo*0.6) / (hi - lo*0.6) , 0, 1)          # mild level stretch (blacks only partly)
y = y + 0.06*np.sin(np.pi*y)*(y-0.5)*2                       # soft S-curve
l2 = (y @ np.array([0.2126, 0.7152, 0.0722], np.float32))[...,None]
sat = np.abs(y - l2).max(2, keepdims=True)
y = l2 + (y - l2) * (1 + 0.18*(1 - np.clip(sat*3, 0, 1)))  # vibrance: boost muted colours more than vivid ones
y = np.clip(y, 0, 1)
out = (y*255 + 0.5).astype(np.uint8)
Image.fromarray(out).save(f'{out_dir}/tex_enhanced.png')
Image.fromarray(out).save(f'{out_dir}/tex_enhanced_q95.jpg', quality=95, subsampling=0)
np.save(f'{out_dir}/tex_mask.npy', np.packbits(valid))
print('done')
