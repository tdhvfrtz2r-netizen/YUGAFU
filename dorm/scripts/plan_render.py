import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
import bpy
from present import *
blend, room_json, outdir = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=blend); room = json.load(open(room_json))
W, H, PXM = 3400, 5000, 580.0
setup(res=(W, H), samples=32); emission_only(); base_and_shadow(room)
bpy.data.objects['Openings'].hide_render = True
cam = camera('plan', (0,0,12), (0,0,0), ortho=H/PXM)
render(cam, f'{outdir}/06_floor_plan_raw.png')
json.dump(dict(W=W, H=H, px_per_m=PXM), open(f'{outdir}/plan_mapping.json','w'))
