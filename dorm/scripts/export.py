# Write the restored dorm model to open archival formats: GLB (glTF 2.0), USDZ (iPhone Quick Look / AR), OBJ+MTL.
# Input: parts.npz from extract_parts.py (Blender Z-up). All outputs are Y-up, metres, origin = floor centre.
import sys, os, io, json, struct, shutil, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
parts_npz, scan_tex, shell_tex, out_dir, tex_size = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
variant = sys.argv[6] if len(sys.argv) > 6 else 'full'
os.makedirs(out_dir, exist_ok=True)
D = np.load(parts_npz)
def yup(P): return np.stack([P[:,0], P[:,2], -P[:,1]], 1)
def vnormals(P, F):
    key = np.round(P*1e5).astype(np.int64); _, w = np.unique(key, axis=0, return_inverse=True); w = w.ravel()
    fn = np.cross(P[F[:,1]]-P[F[:,0]], P[F[:,2]]-P[F[:,0]])   # area weighted
    acc = np.zeros((w.max()+1, 3))
    for k in range(3): np.add.at(acc, w[F[:,k]], fn)
    n = acc[w]; return n/(np.linalg.norm(n, axis=1, keepdims=True)+1e-20)
parts = []
for name in ['DormScan', 'RoomShell', 'Openings']:
    P = yup(D[name+'_P']); F = D[name+'_F']; UV = D[name+'_UV']; M = D[name+'_M']; mats = json.loads(str(D[name+'_mats']))
    for mi, m in enumerate(mats):
        sel = F[M == mi]
        if len(sel) == 0: continue
        used = np.unique(sel); remap = np.full(len(P), -1); remap[used] = np.arange(len(used))
        parts.append(dict(name=name if len(mats) == 1 else m['name'], P=P[used], UV=UV[used], F=remap[sel],
                          N=vnormals(P[used], remap[sel]), mat=m))
def lin2srgb(c): c = np.clip(np.asarray(c), 0, 1); return np.where(c <= 0.0031308, c*12.92, 1.055*c**(1/2.4)-0.055)
# textures
scan_img = Image.open(scan_tex).convert('RGB')
if scan_img.width != tex_size: scan_img = scan_img.resize((tex_size, tex_size), Image.LANCZOS)
b = io.BytesIO(); scan_img.save(b, 'JPEG', quality=90 if tex_size > 4096 else 85, subsampling=0, optimize=True); scan_jpg = b.getvalue()
shell_png = open(shell_tex, 'rb').read()
def tex_for(m):
    if m['image'] is None: return None
    return ('scan', scan_jpg, 'image/jpeg') if 'tex_enhanced' in m['image'] else ('shell', shell_png, 'image/png')
room = json.load(open(os.path.join(os.path.dirname(parts_npz), 'room.json')))
info = {'title': 'Dorm room — LiDAR scan, restored', 'source': '3d Scanner App (iPhone LiDAR), USDZ export',
        'units': 'metres', 'up_axis': 'Y', 'origin': 'centre of the floor',
        'room_size_m': {'width': round(room['size_m'][0], 2), 'length': round(room['size_m'][1], 2), 'height': round(room['size_m'][2], 2)}}

# ---------------- GLB ----------------
def write_glb(path, as_json=False, image_uris=None):
    bin_ = bytearray(); views = []; accs = []
    def add_view(data, target=None):
        while len(bin_) % 4: bin_.append(0)
        off = len(bin_); bin_.extend(data); v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views)-1
    def add_acc(arr, comp, typ, target, minmax=False):
        vi = add_view(arr.tobytes(), target)
        a = {'bufferView': vi, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        accs.append(a); return len(accs)-1
    images, textures, materials, meshes, nodes = [], [], [], [], []
    tex_index = {}
    for p in parts:
        m = p['mat']; t = tex_for(m)
        mat = {'name': p['name'], 'pbrMetallicRoughness': {'metallicFactor': 0.0, 'roughnessFactor': 1.0},
               'extensions': {'KHR_materials_unlit': {}}}
        if t:
            if t[0] not in tex_index:
                if as_json: images.append({'uri': image_uris[t[0]], 'name': t[0]})
                else: images.append({'bufferView': add_view(t[1]), 'mimeType': t[2], 'name': t[0]})
                textures.append({'source': len(images)-1, 'sampler': 0 if t[0] == 'scan' else 1}); tex_index[t[0]] = len(textures)-1
            mat['pbrMetallicRoughness']['baseColorTexture'] = {'index': tex_index[t[0]]}
        else:
            mat['pbrMetallicRoughness']['baseColorFactor'] = list(map(float, m['color'])) + [1.0]
        materials.append(mat)
        uv = p['UV'].copy(); uv[:,1] = 1 - uv[:,1]
        prim = {'attributes': {'POSITION': add_acc(p['P'].astype(np.float32), 5126, 'VEC3', 34962, True),
                               'NORMAL': add_acc(p['N'].astype(np.float32), 5126, 'VEC3', 34962),
                               'TEXCOORD_0': add_acc(uv.astype(np.float32), 5126, 'VEC2', 34962)},
                'indices': add_acc(p['F'].astype(np.uint32).ravel(), 5125, 'SCALAR', 34963), 'material': len(materials)-1, 'mode': 4}
        meshes.append({'name': p['name'], 'primitives': [prim]}); nodes.append({'name': p['name'], 'mesh': len(meshes)-1})
    while len(bin_) % 4: bin_.append(0)
    gltf = {'asset': {'version': '2.0', 'generator': 'dorm-scan restoration (numpy)', 'extras': info},
            'extensionsUsed': ['KHR_materials_unlit'], 'scene': 0,
            'scenes': [{'name': 'Dorm', 'nodes': [len(nodes)]}],
            'nodes': nodes + [{'name': 'Dorm', 'children': list(range(len(nodes)))}],
            'meshes': meshes, 'materials': materials, 'textures': textures, 'images': images,
            'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497},
                         {'magFilter': 9729, 'minFilter': 9729, 'wrapS': 33071, 'wrapT': 33071}],
            'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(bin_)}]}
    if as_json:
        import base64
        gltf['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(bytes(bin_)).decode()
        open(path, 'w').write(json.dumps(gltf, ensure_ascii=False, separators=(',', ':')))
        print('glTF-JSON', path, os.path.getsize(path)//1024, 'KB'); return
    js = json.dumps(gltf, ensure_ascii=False, separators=(',', ':')).encode('utf8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)
    print('GLB', path, os.path.getsize(path)//1024, 'KB')

# ---------------- OBJ ----------------
def write_obj(dirpath):
    os.makedirs(dirpath, exist_ok=True)
    open(os.path.join(dirpath, 'dorm_texture.jpg'), 'wb').write(scan_jpg)
    open(os.path.join(dirpath, 'room_shell.png'), 'wb').write(shell_png)
    with open(os.path.join(dirpath, 'dorm.mtl'), 'w') as f:
        for p in parts:
            m = p['mat']; t = tex_for(m); c = lin2srgb(m['color']) if not t else (1, 1, 1)
            f.write(f"newmtl {p['name']}\nKa 0 0 0\nKd {c[0]:.4f} {c[1]:.4f} {c[2]:.4f}\nKs 0 0 0\nillum 1\n")
            if t: f.write(f"map_Kd {'dorm_texture.jpg' if t[0]=='scan' else 'room_shell.png'}\n")
            f.write('\n')
    with open(os.path.join(dirpath, 'dorm.obj'), 'w') as f:
        f.write('# Dorm room - iPhone LiDAR scan (3d Scanner App), cleaned & restored\n# units: metres, Y up, origin = floor centre\nmtllib dorm.mtl\n')
        vo = 0
        for p in parts:
            f.write(f"o {p['name']}\n")
            f.write(''.join(f'v {x:.5f} {y:.5f} {z:.5f}\n' for x, y, z in p['P']))
            f.write(''.join(f'vt {u:.6f} {v:.6f}\n' for u, v in p['UV']))
            f.write(f"usemtl {p['name']}\n")
            Fi = p['F'] + vo + 1
            f.write(''.join(f'f {a}/{a} {b}/{b} {c}/{c}\n' for a, b, c in Fi)); vo += len(p['P'])
    print('OBJ', dirpath)

# ---------------- USDZ ----------------
def write_usdz(path):
    from pxr import Usd, UsdGeom, UsdShade, Sdf, Gf, Vt, UsdUtils
    tmp = os.path.join(out_dir, '_usd_build'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp + '/textures')
    open(tmp + '/textures/dorm_texture.jpg', 'wb').write(scan_jpg); open(tmp + '/textures/room_shell.png', 'wb').write(shell_png)
    st = Usd.Stage.CreateNew(tmp + '/dorm.usdc')
    UsdGeom.SetStageUpAxis(st, UsdGeom.Tokens.y); UsdGeom.SetStageMetersPerUnit(st, 1.0)
    root = UsdGeom.Xform.Define(st, '/Dorm'); st.SetDefaultPrim(root.GetPrim())
    st.GetRootLayer().customLayerData = {'creator': 'dorm-scan restoration', 'info': json.dumps(info, ensure_ascii=False)}
    UsdGeom.Scope.Define(st, '/Dorm/Materials')
    for p in parts:
        nm = p['name'].replace(' ', '_'); m = p['mat']; t = tex_for(m)
        mesh = UsdGeom.Mesh.Define(st, f'/Dorm/{nm}')
        mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(p['P'].astype(np.float32)))
        mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(p['F']), 3, np.int32)))
        mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(p['F'].astype(np.int32).ravel()))
        mesh.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(p['N'].astype(np.float32))); mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none); mesh.CreateDoubleSidedAttr(False)
        mesh.CreateExtentAttr([Gf.Vec3f(*p['P'].min(0).tolist()), Gf.Vec3f(*p['P'].max(0).tolist())])
        stv = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar('st', Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex)
        stv.Set(Vt.Vec2fArray.FromNumpy(p['UV'].astype(np.float32)))
        mat = UsdShade.Material.Define(st, f'/Dorm/Materials/{nm}')
        sh = UsdShade.Shader.Define(st, f'/Dorm/Materials/{nm}/Surface'); sh.CreateIdAttr('UsdPreviewSurface')
        sh.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(1.0); sh.CreateInput('metallic', Sdf.ValueTypeNames.Float).Set(0.0)
        if t:
            rd = UsdShade.Shader.Define(st, f'/Dorm/Materials/{nm}/st'); rd.CreateIdAttr('UsdPrimvarReader_float2')
            rd.CreateInput('varname', Sdf.ValueTypeNames.String).Set('st'); rd.CreateOutput('result', Sdf.ValueTypeNames.Float2)
            tx = UsdShade.Shader.Define(st, f'/Dorm/Materials/{nm}/Texture'); tx.CreateIdAttr('UsdUVTexture')
            tx.CreateInput('file', Sdf.ValueTypeNames.Asset).Set('textures/' + ('dorm_texture.jpg' if t[0] == 'scan' else 'room_shell.png'))
            tx.CreateInput('st', Sdf.ValueTypeNames.Float2).ConnectToSource(rd.ConnectableAPI(), 'result')
            tx.CreateInput('sourceColorSpace', Sdf.ValueTypeNames.Token).Set('sRGB')
            if t[0] == 'shell':
                tx.CreateInput('wrapS', Sdf.ValueTypeNames.Token).Set('clamp'); tx.CreateInput('wrapT', Sdf.ValueTypeNames.Token).Set('clamp')
            tx.CreateOutput('rgb', Sdf.ValueTypeNames.Float3)
            sh.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).ConnectToSource(tx.ConnectableAPI(), 'rgb')
        else:
            sh.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*map(float, m['color'])))
        mat.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), 'surface')
        UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(mat)
    st.GetRootLayer().Save()
    if os.path.exists(path): os.remove(path)
    with Sdf.ZipFileWriter.CreateNew(path) as zw:   # uncompressed, 64-byte aligned (USDZ spec)
        zw.AddFile(tmp + '/dorm.usdc', 'dorm.usdc')
        zw.AddFile(tmp + '/textures/dorm_texture.jpg', 'textures/dorm_texture.jpg')
        zw.AddFile(tmp + '/textures/room_shell.png', 'textures/room_shell.png')
    print('USDZ', path, os.path.getsize(path)//1024, 'KB')
    shutil.rmtree(tmp)

if variant == 'full':
    write_glb(os.path.join(out_dir, 'dorm.glb'))
    write_usdz(os.path.join(out_dir, 'dorm.usdz'))
    write_obj(os.path.join(out_dir, 'dorm_obj'))
elif variant == 'webjson':
    open(os.path.join(out_dir, 'dorm_texture.jpg'), 'wb').write(scan_jpg)
    open(os.path.join(out_dir, 'room_shell.png'), 'wb').write(shell_png)
    write_glb(os.path.join(out_dir, 'dorm.json'), as_json=True, image_uris={'scan': 'dorm_texture.jpg', 'shell': 'room_shell.png'})
else:
    write_glb(os.path.join(out_dir, 'dorm_web.glb'))
