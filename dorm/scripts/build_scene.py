# Build the restored dorm scene in Blender and save it as a .blend
# usage: python3 build_scene.py -- mesh_clean.npz room.json texture.(png|jpg) out.blend
import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
import bpy, numpy as np
from PIL import Image
from scene import build_mesh
npz, room_json, tex, out_blend = [os.path.abspath(a) for a in sys.argv[sys.argv.index('--')+1:]]
room = json.load(open(room_json))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.unit_settings.system = 'METRIC'

def scan_material(name, tex_path):
    mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (900, 0)
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex_path); t.interpolation = 'Cubic'; t.location = (-400, 0)
    # Principled with the photo as base colour AND emission: exporters (glTF/USD) keep a sane PBR material,
    # while renders show the captured light exactly as photographed.
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.location = (100, 200)
    bsdf.inputs['Roughness'].default_value = 1.0; bsdf.inputs['Specular IOR Level'].default_value = 0.0
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(t.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = 1.0
    geo = nt.nodes.new('ShaderNodeNewGeometry'); geo.location = (100, 450)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.location = (400, -200)
    mix = nt.nodes.new('ShaderNodeMixShader'); mix.location = (650, 0)
    nt.links.new(geo.outputs['Backfacing'], mix.inputs['Fac']); nt.links.new(bsdf.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    mat.use_backface_culling = True
    return mat

def flat_material(name, rgb):
    mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = 1.0; bsdf.inputs['Specular IOR Level'].default_value = 0.0
    bsdf.inputs['Emission Color'].default_value = (*rgb, 1); bsdf.inputs['Emission Strength'].default_value = 1.0
    geo = nt.nodes.new('ShaderNodeNewGeometry'); tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(geo.outputs['Backfacing'], mix.inputs['Fac']); nt.links.new(bsdf.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface']); mat.use_backface_culling = True
    mat.diffuse_color = (*rgb, 1)
    return mat

ob = build_mesh(npz, tex, name='DormScan', drop_degenerate=False, zup=True)
ob.data.materials.append(scan_material('DormScan', tex))

# ---- sample representative colours for the room shell from the texture ----
d = np.load(npz); P, F, UV = d['P'], d['F'], d['UV']
small = Image.open(tex).convert('RGB'); small.thumbnail((2304, 2304)); S = np.asarray(small).astype(np.float32)/255
cr = np.cross(P[F[:,1]]-P[F[:,0]], P[F[:,2]]-P[F[:,0]]); N = cr/(np.linalg.norm(cr,axis=1,keepdims=True)+1e-30); C = P[F].mean(1)
uvc = UV[F].mean(1); px = np.clip((uvc[:,0]*S.shape[1]).astype(int), 0, S.shape[1]-1); py = np.clip(((1-uvc[:,1])*S.shape[0]).astype(int), 0, S.shape[0]-1)
col = S[py, px]
def srgb_to_lin(c): c = np.asarray(c); return np.where(c <= 0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def sample(mask, pct=55):
    c = col[mask]; l = c.mean(1); lo, hi = np.percentile(l, [max(0, pct-20), min(100, pct+20)]); c = c[(l>=lo)&(l<=hi)]
    return tuple(srgb_to_lin(np.median(c, 0)).tolist())
x0, x1 = room['x']; y0, y1 = room['y']; zc = room['z'][1]
tol = 0.04
colors = {
 'floor':   sample((N[:,2] > 0.95) & (np.abs(C[:,2]) < tol)),
 'ceiling': sample((N[:,2] < -0.95) & (np.abs(C[:,2]-zc) < tol)),
 'wall_x0': sample((N[:,0] > 0.95) & (np.abs(C[:,0]-x0) < tol)),
 'wall_x1': sample((N[:,0] < -0.95) & (np.abs(C[:,0]-x1) < tol)),
 'wall_y0': sample((N[:,1] > 0.95) & (np.abs(C[:,1]-y0) < tol) & (np.abs(C[:,0]) > 0.6)),
 'wall_y1': sample((N[:,1] < -0.95) & (np.abs(C[:,1]-y1) < tol) & (C[:,0] > 0.1)),
 'door':    sample((C[:,1] < y0-0.08) & (C[:,2] > 0.2) & (C[:,2] < 1.9), 50),
 'window':  sample(C[:,1] > y1+0.1, 85),
}
lum = lambda c: 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
colors = {k: (v if k in ('window','door') else tuple(lum(v)+(c-lum(v))*0.6 for c in v)) for k, v in colors.items()}  # calmer, less yellow
for k, v in colors.items(): print('shell colour', k, np.round(np.array(v)**(1/2.2), 3))

# ---- room shell: backing surfaces just behind the scanned walls/floor/ceiling (normals inward).
# Each is a 5 cm grid whose vertex colours are a smooth, hole-filled estimate of the scanned surface
# colour around it, so gaps in the scan blend into their surroundings instead of showing background.
from scipy import ndimage
OFF = 0.02; H = 0.05
WIN = dict(x=(-1.05, 0.02), z=(0.82, 2.62)); DOOR = dict(x=(-0.50, 0.53), z=(0.0, 2.04))
col_lin = srgb_to_lin(col)
def plane_grid(axis, sign, coord, urange, vrange, holes=()):
    """axis: plane normal axis; sign: direction of inward normal; coord: plane position of scanned surface."""
    ua, va = [a for a in range(3) if a != axis]
    nu = int(np.ceil((urange[1]-urange[0])/H))+1; nv = int(np.ceil((vrange[1]-vrange[0])/H))+1
    us = np.linspace(*urange, nu); vs = np.linspace(*vrange, nv)
    m = (N[:,axis]*sign > 0.85) & (np.abs(C[:,axis]-coord) < 0.08)
    iu = np.clip(np.round((C[m,ua]-urange[0])/H).astype(int), 0, nu-1); iv = np.clip(np.round((C[m,va]-vrange[0])/H).astype(int), 0, nv-1)
    a = np.maximum(A_face[m], 1e-6)
    Sw = np.zeros((nu, nv)); Sc = np.zeros((nu, nv, 3))
    np.add.at(Sw, (iu, iv), a); np.add.at(Sc, (iu, iv), col_lin[m]*a[:,None])
    out = np.zeros((nu, nv, 3)); done = np.zeros((nu, nv), bool)
    for sig in [1.5, 3, 6, 12, 24, 48, 96]:
        w = ndimage.gaussian_filter(Sw, sig, mode='nearest')
        c = np.stack([ndimage.gaussian_filter(Sc[...,k], sig, mode='nearest') for k in range(3)], -1)
        ok = (w > 0.25*H*H*sig*0.5) & ~done if sig < 96 else ~done
        out[ok] = c[ok]/np.maximum(w[ok], 1e-12)[:,None]; done |= ok
    out *= 0.97
    gi = len(grids); grids.append(out)
    du = (urange[1]-urange[0])/(nu-1); dv = (vrange[1]-vrange[0])/(nv-1)
    inward = [0, 0, 0]; inward[axis] = sign
    if holes:
        (hu0, hu1), (hv0, hv1) = holes[0]; hv0 = max(hv0, vrange[0])
        rects = [(urange[0], hu0, vrange[0], vrange[1]), (hu1, urange[1], vrange[0], vrange[1]),
                 (hu0, hu1, vrange[0], hv0), (hu0, hu1, hv1, vrange[1])]
    else:
        rects = [(urange[0], urange[1], vrange[0], vrange[1])]
    for (a0, a1, b0, b1) in rects:
        if a1-a0 < 1e-4 or b1-b0 < 1e-4: continue
        q = []
        for (u, v) in [(a0, b0), (a1, b0), (a1, b1), (a0, b1)]:
            p = [0, 0, 0]; p[axis] = coord - sign*OFF; p[ua] = u; p[va] = v
            q.append(len(verts)); verts.append(p); vgrid.append((gi, (u-urange[0])/du, (v-vrange[0])/dv))
        pv = [np.array(verts[k]) for k in q]
        if np.cross(pv[1]-pv[0], pv[2]-pv[0]) @ np.array(inward) < 0: q = q[::-1]
        faces.append(q)
A_face = 0.5*np.linalg.norm(cr, axis=1)
verts, faces, vgrid, grids = [], [], [], []
ur_x, ur_y, ur_z = (x0-OFF, x1+OFF), (y0-OFF, y1+OFF), (-OFF, zc+OFF)
plane_grid(2, +1, 0.0, ur_x, ur_y)                       # floor
plane_grid(2, -1, zc, ur_x, ur_y)                        # ceiling
plane_grid(0, +1, x0, ur_y, ur_z)                        # wall x0
plane_grid(0, -1, x1, ur_y, ur_z)                        # wall x1
plane_grid(1, +1, y0, ur_x, ur_z, holes=[(DOOR['x'], (-1, DOOR['z'][1]))])   # door wall
plane_grid(1, -1, y1, ur_x, ur_z, holes=[(WIN['x'], WIN['z'])])              # window wall
# pack the six colour grids into one small texture atlas (u -> image x, v -> image y), 2-texel replicated border
PAD = 2; offs = []; xo = 0; Hh = max(g.shape[1] for g in grids) + 2*PAD
for g in grids: offs.append(xo); xo += g.shape[0] + 2*PAD
Wa = xo; atlas = np.zeros((Hh, Wa, 3))
def lin_to_srgb(c): c = np.clip(c, 0, 1); return np.where(c <= 0.0031308, c*12.92, 1.055*c**(1/2.4)-0.055)
for g, ox in zip(grids, offs):
    gp = np.pad(g, ((PAD, PAD), (PAD, PAD), (0, 0)), mode='edge')       # (nu+2P, nv+2P, 3)
    atlas[:gp.shape[1], ox:ox+gp.shape[0]] = gp.transpose(1, 0, 2)
shell_png = os.path.join(os.path.dirname(out_blend), 'shell_atlas.png')
Image.fromarray((lin_to_srgb(atlas)*255+0.5).astype(np.uint8)).save(shell_png)
me = bpy.data.meshes.new('RoomShell'); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
vuv = np.array([((offs[g]+PAD+i+0.5)/Wa, 1-(PAD+j+0.5)/Hh) for (g, i, j) in vgrid])
loop_v = np.zeros(len(me.loops), np.int64); me.loops.foreach_get('vertex_index', loop_v)
uvl = me.uv_layers.new(name='UVMap'); uvl.data.foreach_set('uv', vuv[loop_v].astype(np.float32).ravel())
mat = scan_material('Shell', shell_png)
mat.node_tree.nodes['Image Texture'].interpolation = 'Linear'
me.materials.append(mat)
shell = bpy.data.objects.new('RoomShell', me); sc.collection.objects.link(shell)
print('shell atlas', atlas.shape)
# what's seen through the openings: a door-coloured panel behind the door recess, daylight behind the window
pv, pf, pm = [], [], []
def panel(p, inward, mi):
    p = [np.array(v, float) for v in p]
    if np.cross(p[1]-p[0], p[2]-p[0]) @ np.array(inward) < 0: p = p[::-1]
    i = len(pv); pv.extend([tuple(v) for v in p]); pf.append((i, i+1, i+2, i+3)); pm.append(mi)
yd = min(P[:,1].min(), y0-0.15) - 0.03
panel([(DOOR['x'][0]-.05,yd,0),(DOOR['x'][1]+.05,yd,0),(DOOR['x'][1]+.05,yd,DOOR['z'][1]+.05),(DOOR['x'][0]-.05,yd,DOOR['z'][1]+.05)], (0,1,0), 0)
yw = P[:,1].max() + 0.05
panel([(WIN['x'][0]-.3,yw,WIN['z'][0]-.3),(WIN['x'][1]+.3,yw,WIN['z'][0]-.3),(WIN['x'][1]+.3,yw,WIN['z'][1]+.02),(WIN['x'][0]-.3,yw,WIN['z'][1]+.02)], (0,-1,0), 1)
me2 = bpy.data.meshes.new('Openings'); me2.from_pydata(pv, [], pf); me2.update()
me2.materials.append(flat_material('Door', colors['door']))
me2.materials.append(flat_material('Daylight', tuple(min(1.0, v*1.15) for v in colors['window'])))
me2.polygons.foreach_set('material_index', pm)
op = bpy.data.objects.new('Openings', me2); sc.collection.objects.link(op)
print('shell verts', len(verts), 'faces', len(faces))
room['openings'] = dict(window=WIN, door=DOOR)
json.dump(room, open(room_json, 'w'), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=out_blend, relative_remap=True)
print('saved', out_blend)
