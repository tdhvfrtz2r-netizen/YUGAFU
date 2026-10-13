# Clean the raw scan: axis-align to the room's walls, floor at z=0, drop debris & bad faces, fit room planes.
import sys, json, numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
src, out_npz, out_json = sys.argv[1:4]
MIN_COMP_AREA = 0.02  # m^2: disconnected fragments smaller than this are scan debris
d = np.load(src); P, F, UV, FUV = d['P'], d['F'], d['UV'], d['FUV']
P = np.stack([P[:,0], -P[:,2], P[:,1]], 1)  # USD Y-up -> Z-up (Blender / glTF-in-Blender convention)

def face_geom(P, F):
    cr = np.cross(P[F[:,1]]-P[F[:,0]], P[F[:,2]]-P[F[:,0]]); a2 = np.linalg.norm(cr, axis=1)
    return cr/(a2[:,None]+1e-30), 0.5*a2, P[F].mean(1)

# 1. drop degenerate + duplicate faces
N, A, C = face_geom(P, F)
keep = (A > 1e-10) & (F[:,0]!=F[:,1]) & (F[:,1]!=F[:,2]) & (F[:,0]!=F[:,2])
_, first = np.unique(np.sort(F,1), axis=0, return_index=True)
dup = np.ones(len(F), bool); dup[first] = False
keep &= ~dup
print('degenerate/duplicate removed:', (~keep).sum())

# 2. Manhattan frame -> rotate so walls are axis aligned
def refine(axis, N, A, thr=0.97):
    m = np.abs(N@axis) > thr; s = np.sign(N[m]@axis)[:,None]
    v = (N[m]*s*A[m,None]).sum(0); return v/np.linalg.norm(v)
up = refine(np.array([0,0,1.]), N[keep], A[keep])
xa = refine(np.array([1,0,0.]), N[keep], A[keep]); xa -= up*(xa@up); xa /= np.linalg.norm(xa)
ya = np.cross(up, xa)
R = np.stack([xa, ya, up])  # rows: new axes
P = P @ R.T
print('tilt corrected (deg): up', np.degrees(np.arccos(up[2])).round(3), ' yaw', np.degrees(np.arctan2(xa[1], xa[0])).round(3))
N, A, C = face_geom(P, F)

# 3. connected components on position-welded topology
key = np.round(P/1e-5).astype(np.int64); _, weld = np.unique(key, axis=0, return_inverse=True); weld = weld.ravel()
Fw = weld[F[keep]]; n = weld.max()+1
r = np.concatenate([Fw[:,0],Fw[:,1],Fw[:,2]]); c = np.concatenate([Fw[:,1],Fw[:,2],Fw[:,0]])
nc, lab = connected_components(coo_matrix((np.ones(len(r)),(r,c)),shape=(n,n)), directed=False)
fl = np.full(len(F), -1); fl[keep] = lab[Fw[:,0]]
ca = np.bincount(fl[keep], weights=A[keep], minlength=nc)
small = keep & (ca[np.maximum(fl,0)] < MIN_COMP_AREA)
print('floating fragments removed:', len(np.unique(fl[small])), 'components,', small.sum(), 'faces,', round(A[small].sum(),3), 'm2')
keep &= ~small

# 4. fit room planes from axis-aligned faces (peak of area histogram near each extreme)
def plane(axis, sign, lo, hi):
    m = keep & (N[:,axis]*sign > 0.95) & (C[:,axis] > lo) & (C[:,axis] < hi)
    h, e = np.histogram(C[m,axis], bins=int((hi-lo)/0.01), range=(lo,hi), weights=A[m])
    i = np.argmax(h); pk = (e[i]+e[i+1])/2
    mm = m & (np.abs(C[:,axis]-pk) < 0.04)
    v = np.average(C[mm,axis], weights=A[mm]); return float(v), float(A[mm].sum())
zmin, zmax = C[keep,2].min(), C[keep,2].max()
floor = plane(2, +1, zmin, zmin+1.2)
ceil  = plane(2, -1, zmax-0.6, zmax+0.01)
xl = plane(0, +1, C[keep,0].min(), C[keep,0].min()+0.6); xr = plane(0, -1, C[keep,0].max()-0.6, C[keep,0].max()+0.01)
yl = plane(1, +1, C[keep,1].min(), C[keep,1].min()+0.6); yr = plane(1, -1, C[keep,1].max()-1.2, C[keep,1].max()+0.01)
print('floor', floor, 'ceiling', ceil); print('x walls', xl, xr); print('y walls', yl, yr)

# 5. drop junk below the floor, then translate: floor -> z=0, room centred on x/y
below = keep & (P[F].max(1)[:,2] < floor[0]-0.06)
print('below-floor faces removed:', below.sum()); keep &= ~below
T = np.array([-(xl[0]+xr[0])/2, -(yl[0]+yr[0])/2, -floor[0]])
P = P + T
F, FUV = F[keep], FUV[keep]
# compact vertices (vertex index == uv index in this file, keep them in step)
used = np.unique(F); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
assert np.array_equal(F, FUV)
P, UV, F = P[used], UV[used], remap[F]
room = dict(x=[xl[0]+T[0], xr[0]+T[0]], y=[yl[0]+T[1], yr[0]+T[1]], z=[0.0, ceil[0]+T[2]],
            rotation_rows=R.tolist(), translation=T.tolist())
room['size_m'] = [room['x'][1]-room['x'][0], room['y'][1]-room['y'][0], room['z'][1]]
print('room size (m):', np.round(room['size_m'],3), ' verts', len(P), 'faces', len(F))
print('bbox', P.min(0).round(3), P.max(0).round(3))
np.savez(out_npz, P=P, F=F, UV=UV, FUV=F)
json.dump(room, open(out_json,'w'), indent=1)
