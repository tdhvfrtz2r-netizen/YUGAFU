# Read the 3d Scanner App USD crate into plain numpy arrays (positions, faces, uvs)
import sys, numpy as np
from pxr import Usd, UsdGeom
src, out = sys.argv[1], sys.argv[2]
st = Usd.Stage.Open(src)
m = UsdGeom.Mesh(st.GetPrimAtPath('/scan/Geom/default'))
P = np.array(m.GetPointsAttr().Get(), dtype=np.float64)
F = np.array(m.GetFaceVertexIndicesAttr().Get(), dtype=np.int64).reshape(-1,3)
pv = UsdGeom.PrimvarsAPI(m).GetPrimvar('st')
uv = np.array(pv.Get(), dtype=np.float64); uvi = np.array(pv.GetIndices(), dtype=np.int64)
print('P', P.shape, 'F', F.shape, F.min(), F.max(), 'uv', uv.shape, 'uvi', uvi.shape, uvi.min(), uvi.max())
print('uv range', uv.min(0), uv.max(0))
FUV = uvi.reshape(-1,3)
# degenerate checks
deg = (F[:,0]==F[:,1])|(F[:,1]==F[:,2])|(F[:,0]==F[:,2])
print('degenerate index faces', deg.sum())
e1=P[F[:,1]]-P[F[:,0]]; e2=P[F[:,2]]-P[F[:,0]]; cr=np.cross(e1,e2); A=0.5*np.linalg.norm(cr,axis=1)
print('zero-area faces', (A<1e-12).sum())
Fs=np.sort(F,1); u,c=np.unique(Fs,axis=0,return_counts=True); print('duplicate faces', (c>1).sum())
print('is uvi == F ?', np.array_equal(uvi.reshape(-1,3), F))
print('unused verts', P.shape[0]-np.unique(F).size)
np.savez(out, P=P, F=F, UV=uv, FUV=FUV)
