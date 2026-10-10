// 片名：三个小台座 —— 宽基（森林）/ 定投（日历 + 硬币）/ 时间（雪球）；镜头推进森林那一座
import { THREE, B, BEAT, seg, eo, ei, eio, back, lerp, C, clay, metal, mesh, pedestal, coinGeo, makeTree, snowGeo, RoundedBoxGeometry } from '../lib.js';

const T0 = B(8), T1 = B(10);
const X = [-4.6, 0, 4.6];
const items = [];

export function miniSet(kind) {
  const g = new THREE.Group();
  g.add(pedestal(1.35, .36));
  if (kind === 0) {
    [[0, 0, .62], [-.6, .35, .48], [.62, .25, .5], [-.25, -.55, .42], [.4, -.5, .44]].forEach(([x, z, s], i) => {
      const t = makeTree(['#5d9a4e', '#6aa457', '#4f8a46', '#7aad5b', '#558f55'][i], i + 2); t.scale.setScalar(s); t.position.set(x, .36, z); g.add(t);
    });
  } else if (kind === 1) {
    const cg = coinGeo(), gm = metal('#f0b84c', .26);
    for (let i = 0; i < 4; i++) { const c = mesh(cg, gm); c.scale.set(.5, 1, .5); c.position.set(.45, .46 + i * .2, .25); g.add(c); }
    const cal = mesh(new RoundedBoxGeometry(1.0, 1.05, .22, 4, .07), clay('#fbf7f0')); cal.position.set(-.35, .36 + .53, -.2); cal.rotation.y = .35; g.add(cal);
    const top = mesh(new RoundedBoxGeometry(1.0, .28, .24, 4, .07), clay(C.red)); top.position.set(-.35, .36 + .98, -.2); top.rotation.y = .35; g.add(top);
  } else {
    const s = mesh(snowGeo(3, 4), clay('#f7f9fc', { r: .9 })); s.scale.setScalar(.72); s.position.y = .36 + .72; g.add(s);
    const s2 = mesh(snowGeo(2, 8), clay('#f7f9fc', { r: .9 })); s2.scale.setScalar(.26); s2.position.set(.85, .36 + .26, .5); g.add(s2);
  }
  return g;
}

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    for (let i = 0; i < 3; i++) { const g = miniSet(i); g.position.x = X[i]; root.add(g); items.push(g); ctx.ev(T0 + .1 + i * BEAT, 'pop', 1); }
    ctx.ev(T0, 'hit', 32);
    ctx.cap({ t0: T0 + .05, t1: T1 - .5, html: '定投宽基', cls: 'h0', y: 70 });
    ctx.cap({ t0: T0 + .45, t1: T1 - .5, html: '普通人也能坚持的投资方法 · 三件事讲明白', cls: 'sub', y: 232 });
    const names = [['宽基', '买什么'], ['定投', '怎么买'], ['时间', '为什么能赚']];
    names.forEach(([a, b], i) => ctx.tag({ t0: T0 + .25 + i * BEAT, t1: T1 - .55, at: new THREE.Vector3(X[i], 0, 1.4), cls: 'tag pill', ay: 0, dy: 16,
      html: `${a}<span style="font-weight:500;color:#8a8f96;margin-left:10px;font-size:22px">${b}</span>` }));
    ctx.ev(B(9.45), 'whoosh', 1);
    ctx.cut(T1, .28);
  },
  update(t, ctx) {
    items.forEach((g, i) => {
      const k = back(seg(t, T0 + .05 + i * BEAT, T0 + .55 + i * BEAT), 2.2);
      g.scale.setScalar(Math.max(.001, k)); g.rotation.y = (t - T0) * .25 + i;
    });
    const k = ei(seg(t, B(9.35), T1));
    ctx.look(lerp(0, X[0], k), lerp(4.6, 2.4, k), lerp(16.5, 5.2, k), lerp(0, X[0], k), lerp(.9, 1.0, k), 0, 30);
    ctx.sunAt(0, 0, 9);
  },
};
