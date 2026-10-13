# Pull the final scene objects out of the .blend as triangulated arrays (Blender Z-up frame)
import sys, bpy, numpy as np, bmesh, json
blend, out = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=blend)
parts = {}
for name in ['DormScan', 'RoomShell', 'Openings']:
    ob = bpy.data.objects[name]; bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.triangulate(bm, faces=bm.faces[:])
    uvl = bm.loops.layers.uv.active
    V, UV, T, M = [], [], [], []
    for f in bm.faces:
        tri = []
        for l in f.loops:
            V.append(tuple(l.vert.co)); UV.append(tuple(l[uvl].uv) if uvl else (0, 0)); tri.append(len(V)-1)
        T.append(tri); M.append(f.material_index)
    V, UV, T = np.array(V), np.array(UV), np.array(T)
    # weld identical (position, uv) corners back together
    key = np.round(np.concatenate([V*1e5, UV*1e7], 1)).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    parts[name+'_P'] = V[first]; parts[name+'_UV'] = UV[first]; parts[name+'_F'] = inv.ravel()[T]; parts[name+'_M'] = np.array(M)
    mats = []
    for m in ob.data.materials:
        nt = m.node_tree; img = [n for n in nt.nodes if n.type == 'TEX_IMAGE']; bs = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
        mats.append(dict(name=m.name, image=bpy.path.abspath(img[0].image.filepath) if img else None,
                         color=list(bs.inputs['Base Color'].default_value)[:3]))
    parts[name+'_mats'] = np.array(json.dumps(mats))
    print(name, len(parts[name+'_P']), 'verts', len(T), 'tris', mats)
np.savez(out, **parts)
