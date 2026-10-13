# Self-contained Blender master: scan + room shell + presentation setup + named cameras, textures packed.
import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
import bpy
from present import *
from views import make_views
blend, room_json, tex_full, out = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=blend); room = json.load(open(room_json))
img = [i for i in bpy.data.images if 'tex_enhanced' in i.filepath][0]
img.filepath = os.path.abspath(tex_full); img.name = 'dorm_texture'; img.reload()
setup(res=(3840, 2560), samples=32); emission_only(); base_and_shadow(room)
v = make_views(); bpy.context.scene.camera = v['dollhouse_window']
for o in bpy.data.objects: o.select_set(False)
bpy.context.scene.render.use_persistent_data = True
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print('saved', out, os.path.getsize(out)//1024, 'KB')
