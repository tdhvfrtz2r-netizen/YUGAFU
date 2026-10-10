// 四、时间 = 滚雪球：20 年沿雪坡滚下来，越滚越大越快；第 13 年钱生的钱超过每年投的钱
// 第 20 年 46 万 → 雪球切开：里面 24 万是本金，外面一圈 22 万是自己长出来的
import { THREE, B, BEAT, seg, eo, ei, eio, sm, back, lerp, clamp, rng, C, clay, mesh, makePine, snowGeo, FV } from '../lib.js';

const T0 = B(60), T1 = B(72);
const KEYS = [[B(61), 0], [B(64), 6], [B(66), 13], [B(68), 20]];
const yearAt = t => {
  if (t <= KEYS[0][0]) return 0; if (t >= KEYS[3][0]) return 20;
  for (let i = 0; i < 3; i++) { const [a, ya] = KEYS[i], [b, yb] = KEYS[i + 1]; if (t <= b) return lerp(ya, yb, (t - a) / (b - a)); }
};
const XY = y => -20 + y * 1.9;                          // 年份 → 坡上位置
const SURF = x => { const xx = Math.min(x, 18); return 8.6 - (xx + 26) * .16 + Math.sin(xx * .25) * .25; };
const RAD = y => .45 + .4 * Math.sqrt(FV(y));
const IMPACT = B(68), SPLIT = B(68.6);
let ball, half, cap1, cap2, flags = [], flakes, els = {};
// 预先积分滚动角
const ROLL = (() => { const a = [0]; for (let i = 1; i <= 400; i++) { const y0 = (i - 1) / 20, y1 = i / 20; a.push(a[i - 1] + (XY(y1) - XY(y0)) / RAD((y0 + y1) / 2)); } return y => a[Math.round(clamp(y, 0, 20) * 20)]; })();

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    // 雪坡
    const sh = new THREE.Shape(); sh.moveTo(-26, 0);
    for (let x = -26; x <= 30; x += .5) sh.lineTo(x, SURF(x));
    sh.lineTo(30, 0); sh.lineTo(-26, 0);
    const slope = mesh(new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 3, curveSegments: 1 }).translate(0, 0, -4), [clay('#e8eef5', { r: .95 }), clay('#f7f9fc', { r: .95 })]);
    root.add(slope);
    const r = rng(17);
    for (let i = 0; i < 22; i++) { const x = -25 + i * 2.5 + r() * 1.2, p = makePine(1.2 + r() * 1.4, ['#3f6f4a', '#4a7d55', '#365f42'][i % 3]); p.position.set(x, SURF(x) + .1, -3.2 - r() * .6); root.add(p); }
    for (let i = 0; i < 8; i++) { const x = -22 + i * 6 + r() * 2, p = makePine(.9 + r() * .6); p.position.set(x, SURF(x) + .1, 3.4 + r() * .3); root.add(p); }
    // 年份旗子
    [5, 10, 13, 15, 20].forEach(y => {
      const g = new THREE.Group(), x = XY(y) + (y === 20 ? 1.5 : 0);
      g.add(mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 8).translate(0, 1.2, 0), clay('#6b5a4a')));
      const fm = clay(y === 13 || y === 20 ? '#eab14b' : '#d4553f'); const f = mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(.9, 2.1, 0)]), fm); f.geometry.computeVertexNormals(); f.material.side = THREE.DoubleSide; g.add(f);
      g.position.set(x, SURF(x), -2.6); root.add(g); flags.push({ g, y });
      const fp = new THREE.Vector3(x, SURF(x) + 2.5, -2.6);
      ctx.tag({ t0: T0 + .5, t1: T1, at: () => Math.abs(ball.position.x - x) < ball.scale.x + 1.4 || (half.visible && Math.abs(half.position.x - x) < half.scale.x + 1.6) ? null : fp, cls: 'tag small', dy: -6, html: `第 ${y} 年`, style: y === 13 ? { color: '#b07a12', fontWeight: 800 } : {} });
    });
    // 雪球 + 切面
    const snowM = clay('#f8fafc', { r: .92 });
    ball = mesh(snowGeo(4, 9), snowM); root.add(ball);
    half = new THREE.Group(); root.add(half);
    const front = mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI), snowM.clone()); front.material.side = THREE.DoubleSide; front.material.transparent = true;
    const back_ = mesh(new THREE.SphereGeometry(1, 64, 32, Math.PI, Math.PI), snowM);
    cap1 = mesh(new THREE.CircleGeometry(Math.sqrt(24 / 46.2), 64), clay('#f3ead9', { r: .9 }), false, false); cap1.position.z = .012;
    cap2 = mesh(new THREE.RingGeometry(Math.sqrt(24 / 46.2), .985, 64), clay('#efb243', { r: .55 }), false, false); cap2.position.z = .01;
    half.add(back_, cap1, cap2, front); half.userData = { front };
    // 雪球滚过的痕迹
    const tp = [], ti = [], NS = 240;
    for (let i = 0; i <= NS; i++) { const yy = i / NS * 20, x = XY(yy), w = RAD(yy) * .72; tp.push(x, SURF(x) + .03, -w, x, SURF(x) + .03, w); if (i) { const a = (i - 1) * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setIndex(ti); tg.computeVertexNormals();
    els.trail = mesh(tg, clay('#dfe6ef', { r: 1, side: THREE.DoubleSide }), false, true); els.NS = NS; root.add(els.trail);
    // 小雪花
    flakes = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 160); root.add(flakes);
    const fr = rng(5); els.fd = Array.from({ length: 160 }, () => [fr() * 40 - 20, fr() * 12, fr() * 10 - 4, fr()]);

    els.ctr = ctx.el('', 'free yr', { left: '0', width: '1920px', textAlign: 'center', top: '176px', fontSize: '30px' });
    ctx.cap({ t0: T0 + .15, t1: B(61.8), html: '第三件事：<b class="g">时间</b>', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(61.9), t1: B(63.9), html: '前几年，几乎看不出差别', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(64), t1: B(65.4), html: '雪球越滚越大，也越滚越快', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(65.5), t1: B(67.7), html: '第 13 年起：钱生的钱，超过你每年投的钱', cls: 'h1', y: 74 });
    ctx.tag({ t0: B(66) + .1, t1: B(67.7), at: () => ball.position.clone().add(new THREE.Vector3(ball.scale.x * .7, ball.scale.x * .9, 0)), cls: 'tag dark', ax: 0, dx: 16, html: '这一年：长了 <b style="color:#f2c063">1.3 万</b> &gt; 投入 1.2 万', style: { fontSize: '26px' } });
    ctx.ev(B(66), 'ding', 1); ctx.ev(B(61), 'roll', 7 * 2.4); ctx.ev(IMPACT, 'hit', 46);
    ctx.tag({ t0: IMPACT + .05, t1: T1 - .2, at: () => new THREE.Vector3(XY(20) + 1.5 - RAD(20) - .4, SURF(XY(20)) + RAD(20) * 1.3, 0), cls: 'tag big num', ax: 1, ay: .5, dy: 0, dx: -20, style: { background: 'rgba(255,255,255,.9)', padding: '10px 30px 4px', borderRadius: '24px', boxShadow: '0 12px 32px rgba(40,60,90,.15)' }, html: '<span style="font-size:30px;color:#5b6470;display:block;text-align:center;font-family:var(--sans);font-weight:700">第 20 年</span><span class="g" style="font-size:110px">46 万</span>', pop: .5 });
    ctx.ev(SPLIT, 'whoosh', 1); ctx.ev(SPLIT + .5, 'chime', 1);
    const R20 = RAD(20);
    ctx.tag({ t0: SPLIT + .7, t1: T1 - .2, at: new THREE.Vector3(XY(20) + 1.5, SURF(XY(20)) + R20 * 1.22, .1), cls: 'tag pill', html: '你投的本金 <b>24 万</b>', ay: .5, dy: 0, style: { fontSize: '30px' } });
    ctx.tag({ t0: SPLIT + 1.1, t1: T1 - .2, at: new THREE.Vector3(XY(20) + 1.5 + R20 * .6, SURF(XY(20)) + R20 * 1.22 - R20 * .56, .1), cls: 'tag pill', ax: 0, dx: 30, html: '<span class="g">自己长出来的 <b>22 万</b></span>', ay: .5, dy: 0, style: { fontSize: '30px' } });
    ctx.cap({ t0: B(69.4), t1: T1 - .3, html: '开头那 <b class="g">22 万</b>，就是这么滚出来的', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(69.4), t1: T1 - .3, html: '按每月 1000 元、年化约 6% 测算 · 仅为示意', cls: 'note', y: 1012 });
    ctx.cut(T1);
  },
  update(t, ctx) {
    ctx.bg('#f4f7fb', '#d7dee8');
    ctx.hemi.color.set('#f4f8ff');
    const y = yearAt(t), R = RAD(y);
    let x = XY(y);
    // 撞到坡底：停下
    const settle = seg(t, IMPACT, IMPACT + .4);
    if (t > IMPACT) x = XY(20) + 1.5 * eo(settle);
    const bx = x, by = SURF(x) + R;
    const splitK = seg(t, SPLIT, SPLIT + .9);
    ball.visible = splitK <= 0;
    ball.position.set(bx, by, 0); ball.scale.setScalar(R);
    ball.rotation.z = -ROLL(y) - (t > IMPACT ? 1.5 * eo(settle) / R : 0);
    half.visible = splitK > 0;
    if (half.visible) {
      half.position.set(bx, by + R * .22 * eo(splitK), 0); half.scale.setScalar(R); half.rotation.y = -.12 * eo(splitK);
      const f = half.userData.front, k = eio(splitK);
      f.position.set(k * 1.6, -k * .2, k * 2.2); f.rotation.y = k * .9; f.material.opacity = 1 - seg(splitK, .45, 1); f.visible = f.material.opacity > .01;
    }
    flags.forEach(({ g, y: fy }) => { const k = seg(y, fy - .2, fy); g.children[1].material.emissive.set(fy === 13 || fy === 20 ? '#ffb21e' : '#000000'); g.children[1].material.emissiveIntensity = k * .5; });
    els.trail.geometry.setDrawRange(0, Math.floor(y / 20 * els.NS) * 6);
    // 雪花
    const m = new THREE.Matrix4();
    els.fd.forEach(([fx, fy, fz, p], i) => { const yy = ((fy - t * (.6 + p * .5)) % 12 + 12) % 12; m.makeTranslation(fx + bx * .6 + Math.sin(t + p * 9) * .4, yy + SURF(bx) - 1, fz); flakes.setMatrixAt(i, m); });
    flakes.instanceMatrix.needsUpdate = true;
    // 顶部计数
    const yi = Math.min(20, Math.floor(y + 1e-6));
    els.ctr.style.display = t > B(61) - .2 && t < IMPACT + .2 ? '' : 'none';
    els.ctr.style.opacity = seg(t, B(61) - .2, B(61) + .2) * (1 - seg(t, IMPACT, IMPACT + .2));
    els.ctr.innerHTML = `第<span class="n">${yi}</span>年 &nbsp;·&nbsp; 账户<span class="n" style="min-width:150px;color:#b07a12">${FV(y).toFixed(1)}</span>万 &nbsp;·&nbsp; 其中本金<span class="n" style="min-width:120px">${(1.2 * y).toFixed(1)}</span>万`;
    els.ctr.querySelectorAll('.n').forEach(n => n.style.fontSize = '48px');
    // 镜头跟着雪球
    const kEnd = sm(seg(t, IMPACT - .6, SPLIT + 1));
    const camX = bx - 1.5 + kEnd * 1.5, d = 15 + R * 2.6 + kEnd * 2;
    ctx.look(camX, by + 2.6 + R * .9, d, bx + kEnd * .3, by + .3 + kEnd * .4, 0, 30);
    ctx.sunAt(bx, 0, 14, [6, 20, 12], 2.4);
  },
};
