import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
import bpy
from present import *
from views import make_views
blend, room_json, outdir = sys.argv[sys.argv.index('--')+1:]
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend); room = json.load(open(room_json))
setup(res=(3840,2560), samples=32); emission_only(); base_and_shadow(room)
v = make_views(); sc = bpy.context.scene; op = bpy.data.objects['Openings']
order = [('01_dollhouse_window','dollhouse_window'),('02_dollhouse_door','dollhouse_door'),('03_dollhouse_corner_a','dollhouse_c3'),
         ('04_dollhouse_corner_b','dollhouse_c4'),('05_section_long','section'),('07_inside_to_window','inside_to_window'),
         ('08_inside_corner','inside_corner'),('09_inside_to_door','inside_to_door')]
for name, k in order:
    out = f'{outdir}/{name}.png'
    if os.path.exists(out): continue
    op.hide_render = (k == 'section'); render(v[k], out); print('DONE', name, flush=True)
op.hide_render = True
sc.render.resolution_x, sc.render.resolution_y = 2400, 4000
render(v['plan'], f'{outdir}/06_floor_plan_raw.png'); print('DONE plan', flush=True)
json.dump(dict(W=2400, H=4000, px_per_m=4000/6.9), open(f'{outdir}/plan_mapping.json','w'))
