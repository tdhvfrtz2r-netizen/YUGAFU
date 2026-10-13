# Shared Blender scene builder for the dorm scan.
import bpy, numpy as np, math
from mathutils import Vector

def build_mesh(npz, tex_path, name='Dorm', drop_degenerate=True, zup=False):
    d = np.load(npz); P, F, UV, FUV = d['P'], d['F'], d['UV'], d['FUV']
    if drop_degenerate:
        e1 = P[F[:,1]]-P[F[:,0]]; e2 = P[F[:,2]]-P[F[:,0]]
        keep = (np.linalg.norm(np.cross(e1,e2),axis=1) > 1e-12) & (F[:,0]!=F[:,1]) & (F[:,1]!=F[:,2]) & (F[:,0]!=F[:,2])
        F, FUV = F[keep], FUV[keep]
    # USD Y-up -> Blender Z-up
    Pb = P if zup else np.stack([P[:,0], -P[:,2], P[:,1]], 1)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(Pb)); me.vertices.foreach_set('co', Pb.astype(np.float32).ravel())
    nl = F.size
    me.loops.add(nl); me.loops.foreach_set('vertex_index', F.astype(np.int32).ravel())
    me.polygons.add(len(F))
    me.polygons.foreach_set('loop_start', (np.arange(len(F))*3).astype(np.int32))
    uvl = me.uv_layers.new(name='UVMap')
    uvl.data.foreach_set('uv', UV[FUV.ravel()].astype(np.float32).ravel())
    me.update(calc_edges=True); me.validate(verbose=False)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons: pass
    me.shade_flat() if hasattr(me,'shade_flat') else None
    return ob

def make_material(tex_path, mode='emission', backface_cull=True, strength=1.0, name='ScanMat'):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(tex_path, check_existing=True)
    tex.interpolation = 'Cubic'
    if mode == 'emission':
        sh = nt.nodes.new('ShaderNodeEmission'); sh.inputs['Strength'].default_value = strength
        nt.links.new(tex.outputs['Color'], sh.inputs['Color'])
    else:
        sh = nt.nodes.new('ShaderNodeBsdfPrincipled'); sh.inputs['Roughness'].default_value = 0.9
        nt.links.new(tex.outputs['Color'], sh.inputs['Base Color'])
    if backface_cull:
        geo = nt.nodes.new('ShaderNodeNewGeometry'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        mix = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(geo.outputs['Backfacing'], mix.inputs['Fac'])
        nt.links.new(sh.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs['Surface'])
    else:
        nt.links.new(sh.outputs[0], out.inputs['Surface'])
    return mat

def setup_render(res=(1600,1200), samples=32, bg=(0.06,0.06,0.07), transparent_bg=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = samples; sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 0 ; sc.cycles.transparent_max_bounces = 16
    sc.cycles.diffuse_bounces = 0; sc.cycles.glossy_bounces = 0
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.film_transparent = transparent_bg
    w = bpy.data.worlds.new('W'); w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (*bg, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    sc.world = w
    sc.render.image_settings.file_format = 'PNG'

def add_camera(name, loc, target, lens=24, ortho=None, clip_start=0.05):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_start = clip_start; cd.clip_end = 100
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    ob = bpy.data.objects.new(name, cd); bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    direction = Vector(target) - Vector(loc)
    ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return ob

def render(cam, path):
    sc = bpy.context.scene; sc.camera = cam; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
