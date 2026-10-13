# Render the camera move frame by frame (resumable). Segments (24 fps):
#  A orbit 360° around the cut-away model · B fly in through the near wall to eye level
#  C slow walk toward the window, gentle pan · D rise through the ceiling to a top-down view
import sys, os, json, math; sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from mathutils import Vector, Quaternion, Matrix
from present import *
args = sys.argv[sys.argv.index('--')+1:]
blend, room_json, outdir = args[:3]
only = args[3] if len(args) > 3 else None          # e.g. "bench" or a frame range "0:100"
FPS = 24
SEG = dict(A=14.0, B=4.5, C=8.5, D=4.5)
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend); room = json.load(open(room_json))
setup(res=(1920,1080), samples=int(os.environ.get('SAMPLES', 10))); emission_only(); base_and_shadow(room)
sc = bpy.context.scene; sc.render.use_persistent_data = True
cd = bpy.data.cameras.new('Cam'); cd.sensor_width = 36; cd.clip_start = 0.03; cd.clip_end = 200
cam = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(cam); sc.camera = cam
openings = bpy.data.objects['Openings']

def ease(t): t = min(max(t, 0), 1); return t*t*(3-2*t)
def ease5(t): t = min(max(t, 0), 1); return t*t*t*(t*(6*t-15)+10)
def look_quat(pos, target, up=(0,0,1)):
    d = Vector(target) - Vector(pos)
    return d.to_track_quat('-Z', 'Y') if abs(Vector(up).z) > 0.5 else _look_up(d, Vector(up))
def _look_up(d, up):
    z = -d.normalized(); x = up.cross(z).normalized(); y = z.cross(x)
    return Matrix((x, y, z)).transposed().to_quaternion()
def fov_lerp(l0, l1, s): return math.exp(math.log(l0)*(1-s) + math.log(l1)*s)
def bez(p0, p1, p2, s): p0, p1, p2 = map(np.array, (p0, p1, p2)); return tuple((1-s)**2*p0 + 2*(1-s)*s*p1 + s*s*p2)

# key poses
C1_POS, C1_TGT = (6.2,-8.0,7.4), (0,0.1,1.0)
ORBIT_LENS = 35
R = math.hypot(C1_POS[0], C1_POS[1]); AZ0 = math.atan2(C1_POS[1], C1_POS[0])
IN_POS, IN_TGT = (0.25,-2.55,1.55), (-0.2,3.0,1.2)
WALK_END = (0.05, 0.35, 1.55)
TOP_POS = (0.0, 0.0, 12.5); TOP_LENS = 40

def pose(t):
    """time (s) -> (position, quaternion, lens)"""
    a, b, c, d = SEG['A'], SEG['B'], SEG['C'], SEG['D']
    if t < a:                                     # A: orbit, starting/ending at the window-end view
        s = ease(t/a); az = AZ0 - 2*math.pi*(1-s)
        h = C1_POS[2] + 0.6*math.sin(math.pi*s)
        p = (R*math.cos(az), R*math.sin(az), h); return p, look_quat(p, C1_TGT), ORBIT_LENS
    t -= a
    if t < b:                                     # B: swoop down through the (culled) door-side wall
        s = ease5(t/b)
        p = bez(C1_POS, (2.2,-7.2,2.4), IN_POS, s)
        tg = tuple(np.array(C1_TGT)*(1-s) + np.array(IN_TGT)*s)
        return p, look_quat(p, tg), fov_lerp(ORBIT_LENS, 14, ease(t/b))
    t -= b
    if t < c:                                     # C: walk toward the window, gentle pan left -> right
        s = ease(t/c); p = tuple(np.array(IN_POS)*(1-s) + np.array(WALK_END)*s)
        yaw0 = math.atan2(IN_TGT[0]-IN_POS[0], IN_TGT[1]-IN_POS[1])
        yaw = yaw0 + math.radians(-14 + 30*s) * math.sin(math.pi*min(1, s*1.15))**0.5 if s > 0 else yaw0
        pitch = math.radians(-3.5 + 2*math.sin(math.pi*s))
        dvec = (math.sin(yaw)*math.cos(pitch), math.cos(yaw)*math.cos(pitch), math.sin(pitch))
        return p, look_quat(p, tuple(np.array(p) + np.array(dvec))), 14 + 2*s
    t -= c                                        # D: rise through the ceiling into a top-down view
    s = ease5(min(t/d, 1))
    p0, q0, l0 = pose(a + b + c - 1e-6)
    q1 = _look_up(Vector((0,0,-1)), Vector((-1,0,0)))     # long axis of the room horizontal on screen
    p = (p0[0]*(1-s) + TOP_POS[0]*s, p0[1]*(1-s) + TOP_POS[1]*s, p0[2] + (TOP_POS[2]-p0[2])*ease(min(t/d,1)**1.3))
    return p, q0.slerp(q1, s), fov_lerp(l0, TOP_LENS, s)

total = sum(SEG.values()); nframes = int(round(total*FPS))
frames = range(nframes)
if only == 'bench': frames = [0, 150, 370, 400, 500, 640, 700, 755]
elif only and ':' in only: a_, b_ = map(int, only.split(':')); frames = range(a_, min(b_, nframes))
import time
for f in frames:
    out = f'{outdir}/f{f:04d}.png'
    if os.path.exists(out) and only != 'bench': continue
    p, q, lens = pose(f / FPS)
    p = tuple(float(v) for v in p); cam.location = p; cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = q; cd.lens = lens
    openings.hide_render = bool(p[2] > 2.9 and p[0]**2 + p[1]**2 < 30)   # daylight panel only matters when looking out the window
    t0 = time.time(); sc.render.filepath = out; bpy.ops.render.render(write_still=True)
    print(f'FRAME {f}/{nframes} {time.time()-t0:.1f}s', flush=True)
# final top-down still for the ending (rendered at 2x for a slow Ken Burns move)
if only is None or only == 'end':
    p, q, lens = pose(total)
    cam.location = p; cam.rotation_quaternion = q; cd.lens = lens; openings.hide_render = True
    sc.render.resolution_x, sc.render.resolution_y = 3840, 2160; sc.cycles.samples = 32
    sc.render.filepath = f'{outdir}/end_top.png'; bpy.ops.render.render(write_still=True); print('END done')
json.dump(dict(fps=FPS, seg=SEG, nframes=nframes), open(f'{outdir}/timeline.json', 'w'))
