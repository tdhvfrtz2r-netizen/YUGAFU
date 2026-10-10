// 一、宽基 = 买整片森林
// 单棵树（一只股票）可能长大也可能倒下 → 拉远成一座 300 棵树的岛 → 枯树被换掉、新树补进来 → 森林整体在长
import { THREE, B, BEAT, seg, eo, ei, eio, sm, back, lerp, rng, C, clay, mesh, pedestal, makeTree, makeIsland, Forest, ring } from '../lib.js';

const T0 = B(10), T1 = B(24);
const GROW = [B(11), B(12.2)], WITHER = [B(12.5), B(13.1)], FALL = [B(12.95), B(13.32)];
const REV = B(13.5);                       // 拉远揭晓
const WAVES = [17.2, 18.4, 19.6, 20.8].map(B);
let hero, heroPed, island, forest, leaves = [], rings = [], plan = [];

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    heroPed = pedestal(1.7, .42); hero = makeTree('#5f9c4f', 9); hero.position.y = .42;
    heroPed.add(hero); root.add(heroPed);
    const lm = clay('#7aa857', { flat: true }); const r = rng(4);
    for (let i = 0; i < 26; i++) {
      const l = mesh(new THREE.TetrahedronGeometry(.13), lm, true, false);
      l.userData = { x: (r() - .5) * 1.8, y: 1.4 + r() * 1.3, z: (r() - .5) * 1.4, d: .6 + r() * .9, s: r() * 6 };
      leaves.push(l); heroPed.add(l);
    }
    island = makeIsland(11, 1.6); root.add(island);
    forest = new Forest({ n: 300, radius: 10.1, seed: 7, extra: 24, gap: .74 }); island.add(forest.group);
    // 枯树 / 新树计划
    const pr = rng(21), used = new Set();
    WAVES.forEach((w, wi) => {
      const dead = [], born = [];
      while (dead.length < 6) { const i = Math.floor(pr() * 300); if (!used.has(i) && forest.items[i].d > 2.5 && forest.items[i].d < 9.5) { used.add(i); dead.push(i); } }
      for (let j = 0; j < 6; j++) born.push(300 + wi * 6 + j);
      plan.push({ w, dead, born });
      ctx.ev(w + .1, 'wither', 1); ctx.ev(w + B(.7), 'sprout', 1);
    });
    for (let i = 0; i < 48; i++) { const rg = ring(i < 24 ? C.red : '#e9a92c', .62, .86); rings.push(rg); island.add(rg); }
    plan.forEach((p, wi) => {
      p.dead.forEach((i, j) => { const rg = rings[wi * 6 + j]; rg.position.x = forest.items[i].x; rg.position.z = forest.items[i].z; rg.userData = { t: p.w, kind: 0 }; });
      p.born.forEach((i, j) => { const rg = rings[24 + wi * 6 + j]; rg.position.x = forest.items[i].x; rg.position.z = forest.items[i].z; rg.userData = { t: p.w + B(.7), kind: 1 }; });
    });

    ctx.cap({ t0: T0 + .15, t1: B(12.4), html: '买一只股票，就像押<b class="gr">一棵树</b>', cls: 'h1', y: 90 });
    ctx.tag({ t0: GROW[0] + .3, t1: B(12.4), at: () => hero.localToWorld(new THREE.Vector3(.9, 2.3, 0)), cls: 'tag pill', ax: 0, ay: .5, dx: 20, dy: 0, html: '<span class="gr">↑</span> 它可能长成大树', style: { fontSize: '34px' } });
    ctx.cap({ t0: B(12.55), t1: REV - .1, html: '也可能，<b class="r">一去不回</b>', cls: 'h1', y: 90 });
    ctx.ev(GROW[0], 'grow', 1); ctx.ev(WITHER[0] + .05, 'crack', 1); ctx.ev(FALL[1], 'thud', 1);
    ctx.ev(REV, 'whoosh', 1.2); ctx.ev(REV + .55, 'pops', 3.6); ctx.ev(B(14), 'hit', 22);

    ctx.cap({ t0: B(14.4), t1: B(16.9), html: '宽基指数：把<b class="gr">一大片树</b>，各买一点', cls: 'h1', y: 70 });
    ctx.cap({ t0: B(14.9), t1: B(16.9), html: '比如沪深300：A股规模最大、交易最活跃的 300 家公司；美国的标普500，是 500 家', cls: 'sub', y: 180 });
    ctx.cap({ t0: B(17.1), t1: B(19.3), html: '有的树枯了，会被<b class="r">换掉</b>', cls: 'h1', y: 70 });
    ctx.cap({ t0: B(19.4), t1: B(20.95), html: '新长起来的，会被<b class="g">补进来</b>', cls: 'h1', y: 70 });
    ctx.cap({ t0: B(17.4), t1: B(20.95), html: '沪深300 每半年调整一次成分股', cls: 'sub', y: 180 });
    ctx.cap({ t0: B(21.1), t1: T1 - .3, html: '你买的，是<b class="g">整片森林</b>的生长', cls: 'h1', y: 70 });
    ctx.cap({ t0: B(21.7), t1: T1 - .3, html: '单棵树可能倒下；整片森林一起倒下，要难得多', cls: 'sub', y: 180 });
    ctx.ev(B(21), 'hit', 16);
    ctx.cut(T1);
  },
  update(t, ctx) {
    // —— 单棵树 ——
    const heroOn = t < REV + 1.2;
    heroPed.visible = heroOn;
    if (heroOn) {
      const g = 1 + .32 * eo(seg(t, ...GROW));
      const w = sm(seg(t, ...WITHER));
      hero.scale.setScalar(g);
      hero.userData.mat.color.copy(hero.userData.base).lerp(new THREE.Color(C.dry), w);
      hero.userData.crowns.forEach((c, i) => c.scale.set(1 - .18 * w, 1.1 * (1 - .22 * w), 1 - .18 * w));
      const f = seg(t, ...FALL);
      hero.rotation.z = -1.42 * ei(f) + (t > FALL[1] ? Math.sin((t - FALL[1]) * 22) * .05 * Math.exp(-(t - FALL[1]) * 9) : 0);
      leaves.forEach(l => {
        const u = l.userData, k = seg(t, WITHER[0] + u.s * .08, WITHER[0] + u.s * .08 + u.d);
        l.visible = k > 0 && k < 1;
        l.position.set(u.x + Math.sin(k * 6 + u.s) * .3, .42 + u.y * g * (1 - k), u.z); l.rotation.set(k * 8 + u.s, k * 5, 0);
      });
      heroPed.position.y = -3 * ei(seg(t, REV, REV + .9));
    }
    // —— 森林岛 ——
    const isOn = t > REV - .2;
    island.visible = isOn;
    if (isOn) {
      island.position.y = -3.2 * (1 - eo(seg(t, REV, REV + .8)));
      const grow = 1 + .28 * sm(seg(t, B(17), T1));
      const deadAt = new Map(), bornAt = new Map();
      plan.forEach(p => { p.dead.forEach(i => deadAt.set(i, p.w)); p.born.forEach(i => bornAt.set(i, p.w + B(.7))); });
      forest.items.forEach((o, i) => {
        let k, dry = 0, gold = 0;
        if (i < 300) {
          k = back(seg(t, REV + .5 + o.d / 10.1 * 1.7, REV + .95 + o.d / 10.1 * 1.7), 2.4);
          if (deadAt.has(i)) { const w = deadAt.get(i); dry = sm(seg(t, w, w + B(.5))); k *= 1 - ei(seg(t, w + B(.45), w + B(.85))); }
        } else {
          const b = bornAt.get(i); k = b ? back(seg(t, b, b + .6), 2.6) : 0;
          gold = b ? 1 - sm(seg(t, b + B(1), b + B(1.8))) : 0;
        }
        forest.set(i, k * grow, dry, gold);
      });
      forest.commit();
      rings.forEach(rg => { const u = rg.userData; rg.material.opacity = .85 * Math.min(seg(t, u.t, u.t + .3), 1 - seg(t, u.t + B(1.1), u.t + B(1.5))); rg.visible = rg.material.opacity > .01; });
    }
    // —— 镜头 ——
    const kA = eio(seg(t, REV, REV + B(1.4)));
    const yaw = -.18 + .36 * seg(t, T0, REV);
    const A = [Math.sin(yaw) * 12.8, 3.1, Math.cos(yaw) * 12.8, 0, 2.15, 0];
    const a = .15 + .55 * seg(t, REV, T1), R = 29 - 2.5 * sm(seg(t, B(20.5), T1));
    const Cc = [Math.sin(a) * R, 15.5, Math.cos(a) * R, 0, 2.2, 0];
    const p = A.map((v, i) => lerp(v, Cc[i], kA));
    ctx.look(...p, 30);
    ctx.sunAt(0, 0, kA > .5 ? 15 : 6, [9, 18, 11]);
  },
};
