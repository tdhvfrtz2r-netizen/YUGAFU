# Presentation helpers: background, base slab, contact shadow, cameras, render settings.
import bpy, numpy as np, os
from mathutils import Vector
BG = (0.925, 0.905, 0.87)   # warm paper, sRGB
def lin(c): return tuple(v/12.92 if v <= 0.04045 else ((v+0.055)/1.055)**2.4 for v in c)

def emit_mat(name, srgb, alpha_img=None):
    mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*lin(srgb), 1); nt.links.new(em.outputs[0], out.inputs['Surface'])
    return mat, nt, em, out

def setup(res=(1920,1080), samples=24, bg=BG, transparent=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    sc.cycles.use_denoising = False; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 0; sc.cycles.diffuse_bounces = 0; sc.cycles.glossy_bounces = 0
    sc.cycles.transmission_bounces = 0; sc.cycles.volume_bounces = 0; sc.cycles.transparent_max_bounces = 24
    sc.cycles.filter_width = 1.2
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.film_transparent = transparent
    w = bpy.data.worlds.new('Paper'); w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (*lin(bg), 1); sc.world = w
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    sc.render.threads_mode = 'AUTO'

def base_and_shadow(room, bg=BG):
    """Architectural-model base slab under the floor + soft contact shadow on the 'paper'."""
    x0, x1 = room['x']; y0, y1 = room['y']; m = 0.10; t = 0.16
    X0, X1, Y0, Y1 = x0-m, x1+m, y0-m, y1+m
    v = [(X0,Y0,-t),(X1,Y0,-t),(X1,Y1,-t),(X0,Y1,-t),(X0,Y0,-0.025),(X1,Y0,-0.025),(X1,Y1,-0.025),(X0,Y1,-0.025)]
    f = [(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    me = bpy.data.meshes.new('Base'); me.from_pydata(v, [], f); me.update()
    shades = [(0.96,0.955,0.945),(0.83,0.82,0.80),(0.76,0.75,0.73),(0.83,0.82,0.80),(0.76,0.75,0.73)]
    for i, s in enumerate(shades): me.materials.append(emit_mat(f'Base{i}', s)[0])
    me.polygons.foreach_set('material_index', list(range(5)))
    ob = bpy.data.objects.new('Base', me); bpy.context.scene.collection.objects.link(ob)
    # shadow: large ground plane whose colour = paper colour darkened by a blurred rectangle
    from PIL import Image, ImageFilter
    R = 1024; ext = 6.0  # plane half-size (m)
    img = Image.new('L', (R, R), 0); from PIL import ImageDraw
    dr = ImageDraw.Draw(img); s = R/(2*ext)
    dr.rectangle([R/2+(X0-0.05)*s, R/2-(Y1+0.05)*s, R/2+(X1+0.05)*s, R/2-(Y0-0.05)*s], fill=255)
    img = img.filter(ImageFilter.GaussianBlur(R*0.035))
    p = os.path.join(bpy.app.tempdir or '/tmp', 'shadow.png'); img.save(p)
    me = bpy.data.meshes.new('Ground'); me.from_pydata([(-ext,-ext,-t-0.001),(ext,-ext,-t-0.001),(ext,ext,-t-0.001),(-ext,ext,-t-0.001)], [], [(0,1,2,3)])
    uv = me.uv_layers.new(); uv.data.foreach_set('uv', [0,0, 1,0, 1,1, 0,1]); me.update()
    mat, nt, em, out = emit_mat('Ground', bg)
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = bpy.data.images.load(p); ti.image.colorspace_settings.name = 'Non-Color'; ti.extension = 'EXTEND'
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs['A'].default_value = (*lin(bg), 1); mx.inputs['B'].default_value = (*lin(tuple(c*0.62 for c in bg)), 1)
    mp = nt.nodes.new('ShaderNodeMath'); mp.operation = 'MULTIPLY'; mp.inputs[1].default_value = 0.85
    nt.links.new(ti.outputs['Color'], mp.inputs[0]); nt.links.new(mp.outputs[0], mx.inputs['Factor'])
    nt.links.new(mx.outputs['Result'], em.inputs['Color'])
    me.materials.append(mat); g = bpy.data.objects.new('Ground', me); bpy.context.scene.collection.objects.link(g)
    # ground plane must never hide geometry: make it invisible to camera from below
    return ob, g

def camera(name, loc, target, lens=35, ortho=None, shift=(0,0)):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_start = 0.03; cd.clip_end = 200
    cd.sensor_width = 36; cd.shift_x, cd.shift_y = shift
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    ob = bpy.data.objects.new(name, cd); bpy.context.scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = (Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler()
    return ob

def render(cam, path):
    sc = bpy.context.scene; sc.camera = cam; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

def emission_only():
    """Renders show the photographed light 1:1: swap every Principled BSDF for an Emission shader
    fed by the same colour (texture or flat), and stop the world from lighting anything."""
    for mat in bpy.data.materials:
        if not mat.use_nodes: continue
        nt = mat.node_tree
        for n in list(nt.nodes):
            if n.type != 'BSDF_PRINCIPLED': continue
            em = nt.nodes.new('ShaderNodeEmission'); em.location = n.location
            src = n.inputs['Base Color']
            if src.is_linked: nt.links.new(src.links[0].from_socket, em.inputs['Color'])
            else: em.inputs['Color'].default_value = src.default_value
            for l in list(n.outputs[0].links): nt.links.new(em.outputs[0], l.to_socket)
            nt.nodes.remove(n)
    w = bpy.context.scene.world
    if w:
        w.cycles_visibility.diffuse = False; w.cycles_visibility.glossy = False
        w.cycles_visibility.transmission = False; w.cycles_visibility.scatter = False
        try: w.cycles.sample_as_light = False
        except Exception: pass
