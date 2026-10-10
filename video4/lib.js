// 公用：时间、缓动、材质、模型
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };

// —— 时间：100 BPM，一小节 2.4 秒；画面切点都落在小节/拍子上 ——
export const BEAT = 0.6, BAR = 2.4;
export const B = x => x * BAR;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eo = k => 1 - Math.pow(1 - k, 3);
export const ei = k => k * k * k;
export const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const sm = k => k * k * (3 - 2 * k);
export const back = (k, s = 1.70158) => k <= 0 ? 0 : k >= 1 ? 1 : 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export const outBounce = k => {
  const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k;
  if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375;
  return n * (k -= 2.625 / d) * k + .984375;
};
// 一个时间窗内淡入淡出的系数
export const win = (t, a, b, fi = .4, fo = .4) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
export const rng = seed => { let a = (seed * 9301 + 49297) % 233280 || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);

// —— 调色 ——
export const C = {
  ink: '#1d242c', cream: '#efe6d8', creamSide: '#e2d6c3', gold: '#eab14b', silver: '#cfd3d7',
  red: '#d4553f', green: '#5f9150', grass: '#a9c47f', soil: '#c99568', trunk: '#8a6446',
  slate: '#8da3bf', snow: '#f6f8fb', dry: '#a58a68', leaf: ['#3f7a3e', '#4d8a45', '#5b9a4c', '#6aa456', '#46804b', '#78ad5a', '#2f6b3f'],
};

export function clay(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? .82, metalness: o.m ?? 0, flatShading: !!o.flat,
    emissive: o.em || '#000000', emissiveIntensity: o.ei ?? 1,
    transparent: !!o.tr, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide,
  });
}
export const metal = (color, r = .3) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: r, emissive: '#000000' });
export function sh(m, cast = true, recv = true) { m.castShadow = cast; m.receiveShadow = recv; return m; }
export const mesh = (geo, mat, cast = true, recv = true) => sh(new THREE.Mesh(geo, mat), cast, recv);

// —— 几何 ——
// 圆角台座（车削），底面在 y=0
export function pedestalGeo(r = 2, h = .5, bev = .12) {
  const p = [new THREE.Vector2(0, 0), new THREE.Vector2(r - bev, 0)];
  for (let i = 1; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; p.push(new THREE.Vector2(r - bev + Math.cos(a) * bev, bev + Math.sin(a) * bev)); }
  for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI / 2; p.push(new THREE.Vector2(r - bev + Math.cos(a) * bev, h - bev + Math.sin(a) * bev)); }
  p.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(p, 96);
}
// 带边缘的硬币，中心在原点，半径 1，厚 .2
export function coinGeo() {
  const P = [[0, -.075], [.78, -.075], [.8, -.1], [.95, -.1], [1, -.07], [1, .07], [.95, .1], [.8, .1], [.78, .075], [0, .075]];
  return new THREE.LatheGeometry(P.map(([x, y]) => new THREE.Vector2(x, y)), 64);
}
// 筹码（份额），中心在原点，半径 .5，厚 .12
export function chipGeo() {
  const P = [[0, -.06], [.42, -.06], [.46, -.05], [.5, -.03], [.5, .03], [.46, .05], [.42, .06], [0, .06]];
  return new THREE.LatheGeometry(P.map(([x, y]) => new THREE.Vector2(x, y)), 40);
}
export const pedestal = (r, h, color = C.cream) => mesh(pedestalGeo(r, h), clay(color, { r: .9 }));

// —— 树 ——
export function makeTree(color = '#64a050', seed = 3) {
  const g = new THREE.Group(), r = rng(seed);
  const trunk = mesh(new THREE.CylinderGeometry(.09, .15, 1.2, 10).translate(0, .6, 0), clay(C.trunk));
  const mat = clay(color, { flat: true, r: .75 });
  const crowns = [[0, 1.55, 0, .78], [.36, 2.08, .1, .52], [-.32, 1.98, -.14, .48], [.05, 2.4, -.05, .36]].map(([x, y, z, s]) => {
    const m = mesh(new THREE.IcosahedronGeometry(s, 1), mat); m.position.set(x, y, z); m.rotation.set(r() * 3, r() * 3, 0); m.scale.y = 1.1; return m;
  });
  g.add(trunk, ...crowns);
  g.userData = { trunk, crowns, mat, base: new THREE.Color(color) };
  return g;
}
export function makePine(h = 1.6, color = '#3f6f4a') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(.06, .09, .4, 8).translate(0, .2, 0), clay(C.trunk)));
  const m = clay(color, { flat: true });
  for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(.55 - i * .13, .7, 8), m); c.position.y = .55 + i * .38; g.add(c); }
  g.scale.setScalar(h / 1.6);
  return g;
}

// —— 森林：几百棵树用实例化绘制 ——
export class Forest {
  constructor({ n = 300, radius = 10, seed = 1, extra = 0, gap = .82 } = {}) {
    const r = rng(seed); this.items = [];
    let tries = 0;
    while (this.items.length < n + extra && tries < 60000) {
      tries++;
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (this.items.some(o => (o.x - x) ** 2 + (o.z - z) ** 2 < gap * gap)) continue;
      this.items.push({ x, z, s: .75 + r() * .55, yaw: r() * 6.28, col: new THREE.Color(C.leaf[Math.floor(r() * C.leaf.length)]).offsetHSL((r() - .5) * .03, (r() - .5) * .1, (r() - .5) * .06), d });
    }
    const N = this.items.length;
    const trunkG = new THREE.CylinderGeometry(.07, .11, .95, 7).translate(0, .47, 0);
    const aG = new THREE.IcosahedronGeometry(.55, 1).scale(1, 1.15, 1).translate(0, 1.28, 0);
    const bG = new THREE.IcosahedronGeometry(.36, 1).translate(.24, 1.68, .08);
    this.trunk = sh(new THREE.InstancedMesh(trunkG, clay(C.trunk), N));
    this.a = sh(new THREE.InstancedMesh(aG, clay('#ffffff', { flat: true, r: .75 }), N));
    this.b = sh(new THREE.InstancedMesh(bG, clay('#ffffff', { flat: true, r: .75 }), N));
    this.group = new THREE.Group(); this.group.add(this.trunk, this.a, this.b);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._c = new THREE.Color();
    this.dry = new THREE.Color(C.dry); this.goldC = new THREE.Color('#f0b23c');
    this.items.forEach((o, i) => this.set(i, 1, 0));
  }
  // k=生长比例，dry=枯萎程度，gold=金色程度，lean=倾倒角
  set(i, k, dry = 0, gold = 0, lean = 0) {
    const o = this.items[i], s = Math.max(1e-4, o.s * k);
    this._q.setFromEuler(new THREE.Euler(lean, o.yaw, 0));
    this._m.compose(V(o.x, 0, o.z), this._q, V(s, s, s));
    this.trunk.setMatrixAt(i, this._m); this.a.setMatrixAt(i, this._m); this.b.setMatrixAt(i, this._m);
    this._c.copy(o.col).lerp(this.dry, dry).lerp(this.goldC, gold);
    this.a.setColorAt(i, this._c); this.b.setColorAt(i, this._c.offsetHSL(0, 0, .04));
  }
  commit() {
    for (const m of [this.trunk, this.a, this.b]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
}

// 草地岛：顶面草地 + 侧面泥土
export function makeIsland(r = 11, h = 1.2) {
  const g = new THREE.Group();
  const top = mesh(pedestalGeo(r, .45, .2), clay(C.grass, { r: .95 })); top.position.y = -.45;
  const soil = mesh(new THREE.CylinderGeometry(r - .1, r - 1.6, h, 96), clay(C.soil, { r: .95 })); soil.position.y = -.45 - h / 2 + .01;
  g.add(top, soil);
  return g;
}

// —— 小人 ——
export function makePerson(color = '#7d8fa6') {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(.27, .5, 6, 16), clay(color)); body.position.y = .55;
  const head = mesh(new THREE.SphereGeometry(.23, 24, 16), clay('#f1d6bd')); head.position.y = 1.18;
  g.add(body, head); g.userData = { body, head };
  return g;
}

// —— 云 ——
export function makeCloud(seed = 1, color = '#8e99a8') {
  const g = new THREE.Group(), r = rng(seed), m = clay(color, { r: .95 });
  for (let i = 0; i < 7; i++) {
    const s = .9 + r() * .9, c = mesh(new THREE.IcosahedronGeometry(1, 2), m, false, false);
    c.scale.set(s * 1.2, s * .85, s); c.position.set((i - 3) * 1.1 + (r() - .5) * .6, (r() - .2) * .7 + (3 - Math.abs(i - 3)) * .25, (r() - .5) * 1.2);
    g.add(c);
  }
  g.userData.mat = m;
  return g;
}

// —— 地面高亮圈 ——
export function ring(color, r0 = .55, r1 = .78) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .03;
  return m;
}

// 柔和的雪球表面
export function snowGeo(detail = 4, seed = 5) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, r = rng(seed), v = new THREE.Vector3();
  const ph = [r() * 9, r() * 9, r() * 9];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 5 + ph[0]) * Math.sin(v.y * 6 + ph[1]) * Math.sin(v.z * 5.5 + ph[2]);
    v.multiplyScalar(1 + n * .035); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// 月供公式：每月 m 元，月利率 0.5%，n 个月后的金额（万元）
export const FV = years => 20 * (Math.pow(1.005, 12 * years) - 1);

// HTML 元素的淡入淡出（自由摆放的卡片、面板）
export function elAnim(el, t, t0, t1, o = {}) {
  const { dy = 26, fi = .45, fo = .35, sc = false } = o;
  if (t < t0 || t > t1 + fo) { el.style.display = 'none'; return 0; }
  const ki = eo(seg(t, t0, t0 + fi)), ko = seg(t, t1, t1 + fo);
  el.style.display = '';
  el.style.opacity = (ki * (1 - ko)).toFixed(3);
  el.style.transform = sc ? `scale(${(.85 + .15 * back(seg(t, t0, t0 + fi))).toFixed(3)})` : `translateY(${((1 - ki) * dy - ko * 10).toFixed(1)}px)`;
  return ki * (1 - ko);
}

// 沪深300 2007-10-16 起的 10 年走势（起点=100），按月；与华夏基金投教的定投回测对齐：一次性 -33%、定投约 +35%
export const DCA_ANCHORS = [[0, 100], [.6, 63.5], [1.05, 27.7], [1.8, 66.6], [2.3, 56.4], [2.7, 43], [3.05, 61.5], [3.5, 57.4], [4.2, 40], [5.15, 36.9], [5.7, 34.8], [6.9, 43], [7.65, 94.3], [8.3, 49.2], [9.2, 58.4], [10, 66.6]];
// 按月取样（第 m 个月 = m/12 年），返回 121 个点
export function monthly(A) {
  const f = x => { for (let i = 0; i < A.length - 1; i++) { const [x0, y0] = A[i], [x1, y1] = A[i + 1]; if (x <= x1 + 1e-9) { const k = (x - x0) / (x1 - x0), e = k * k * (3 - 2 * k); return y0 + (y1 - y0) * e; } } return A[A.length - 1][1]; };
  return Array.from({ length: 121 }, (_, m) => [m / 12, f(m / 12)]);
}

// 圆角柱子（高度会变，按高度缓存几何体）
const _pg = new Map();
export function pillarGeo(h, w = 1.25) {
  const key = w + ':' + Math.max(.3, h).toFixed(2);
  if (!_pg.has(key)) { const hh = Math.max(.3, h); _pg.set(key, new RoundedBoxGeometry(w, hh, w, 4, .14).translate(0, hh / 2, 0)); }
  return _pg.get(key);
}
