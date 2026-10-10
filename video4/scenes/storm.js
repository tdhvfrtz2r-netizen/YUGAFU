// 三、下跌 = 风暴：天黑、下雨、打雷，账户 −30% → 很多人离场 → 定投的人照样买，买到更多 → 雨停天晴
import { THREE, B, BEAT, seg, eo, ei, eio, sm, back, lerp, clamp, rng, win, C, clay, metal, mesh, pedestal, coinGeo, chipGeo, makeIsland, Forest, makePerson, makeCloud, elAnim } from '../lib.js';

const T0 = B(46), T1 = B(60);
const DARK = [B(46), B(47.2)], SUN = [B(56), B(57.4)];
const BOLTS = [B(47.05), B(50.6), B(53.3)];
const LEAVE = B(49.3);
const BUYS = Array.from({ length: 7 }, (_, i) => B(52.2) + i * BEAT * 2);
const PER = [3, 4, 5, 6, 6, 7, 7];
const IZ = -4, PZ = 9.2;
let island, forest, clouds = [], rain, bolts = [], people = [], gold, coin, basket, chips = [], els = {}, chipM;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, .12)), _s = new THREE.Vector3(1, 1, 1);
const NR = 700, rr = rng(31), RD = Array.from({ length: NR }, () => [rr() * 36 - 18, rr() * 30 - 14, rr(), .8 + rr() * .5]);

function boltGeo(seed) {
  const r = rng(seed), pts = []; let x = 0, z = 0;
  for (let i = 0; i <= 9; i++) { pts.push(new THREE.Vector3(x, 10 - i * .95, z)); x += (r() - .5) * 1.4; z += (r() - .5) * .6; }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 60, .09, 6);
}

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    island = makeIsland(11, 1.6); island.position.z = IZ; root.add(island);
    forest = new Forest({ n: 280, radius: 10.1, seed: 3, gap: .76 }); island.add(forest.group);
    const r = rng(8);
    for (let i = 0; i < 6; i++) { const c = makeCloud(i + 3, '#7c8696'); c.userData.home = new THREE.Vector3(-13 + i * 5.2 + (r() - .5) * 2, 9 + r() * 2.2, IZ - 2 + (r() - .5) * 6); c.userData.side = i < 3 ? -1 : 1; c.scale.setScalar(1.3 + r() * .5); root.add(c); clouds.push(c); }
    rain = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .7, .03), new THREE.MeshBasicMaterial({ color: '#cfd8e3', transparent: true, opacity: .55 }), NR); root.add(rain);
    const bm = new THREE.MeshBasicMaterial({ color: '#f4f8ff' });
    BOLTS.forEach((t, i) => { const b = new THREE.Mesh(boltGeo(i + 5), bm); b.position.set([-3, 4, 1][i], 0, IZ + [1, -1, 2][i]); root.add(b); bolts.push(b); ctx.ev(t, 'thunder', i === 0 ? 1.2 : .9); });
    els.flash = ctx.el('', 'free', { inset: '0', background: '#eef3ff' });
    // 平台上的人
    const plat = pedestal(4.4, .4, '#e8dfd0'); plat.position.z = PZ; root.add(plat);
    const cols = ['#8494aa', '#9aa5b6', '#7f8ea3', '#a3aebd', '#8c9bb0', '#96a3b5'];
    let k = 0;
    for (let row = 0; row < 3; row++) for (let j = 0; j < 4; j++) {
      const x = -2.4 + j * 1.6 + (row % 2) * .5, z = PZ - 1.6 + row * 1.25;
      if (row === 2 && j === 1) { gold = makePerson('#e2a43b'); gold.position.set(-.6, .4, z + .2); root.add(gold); continue; }
      const p = makePerson(cols[k % cols.length]); p.position.set(x, .4, z); p.userData.home = p.position.clone(); p.userData.i = k++;
      p.userData.dir = new THREE.Vector3(x, 0, z - PZ).normalize(); root.add(p); people.push(p);
    }
    people.forEach((p, i) => ctx.ev(LEAVE + i * .13, 'step', .5));
    // 篮子和金色筹码
    basket = mesh(new THREE.LatheGeometry([[0, 0], [.85, 0], [1.05, .55], [1.1, .6], [1.0, .6], [.8, .08], [0, .08]].map(([x, y]) => new THREE.Vector2(x, y)), 48), clay('#c79a62'));
    basket.position.set(1.1, .4, PZ + 1.45); root.add(basket);
    chipM = clay('#f0b84c', { r: .45 }); const cg = chipGeo(); const pr = rng(12);
    let n = 0;
    BUYS.forEach((tb, bi) => { for (let j = 0; j < PER[bi]; j++, n++) { const m = mesh(cg, chipM); m.scale.setScalar(.75); m.userData = { t: tb + .25 + j * .06, x: (pr() - .5) * 1.3, z: (pr() - .5) * 1.3, y: .5 + n * .016, ry: pr() * 3 }; root.add(m); chips.push(m); } ctx.ev(tb, 'coin', .8); ctx.ev(tb + .25, 'chips', PER[bi] / 8); });
    coin = mesh(coinGeo(), metal('#f0b84c', .26)); coin.scale.set(.45, 1, .45); root.add(coin);

    ctx.cap({ t0: T0 + .2, t1: B(49.1), html: '最难的，是<b class="r">下跌</b>的时候', cls: 'h1 light', y: 74 });
    ctx.tag({ t0: B(47.2), t1: B(55.8), at: new THREE.Vector3(-12.5, 5.2, IZ), cls: 'tag light', html: '<div style="font:700 26px var(--sans);color:#c9ccd2;text-align:center">账户</div><div style="font:800 96px Inter;color:#ff8a73;line-height:1">−30%</div>' });
    ctx.ev(B(47.2), 'hit', 30);
    ctx.cap({ t0: B(49.2), t1: B(52), html: '很多人，在这里<b class="r">卖掉离场</b>', cls: 'h1 light', y: 74 });
    els.stat = ctx.el(`<div class="card" style="width:560px;background:rgba(24,30,38,.88);color:#f4efe6">
      <div style="font:700 26px var(--sans);color:#c9ccd2;margin-bottom:12px">一份四千多万基民的统计</div>
      <div style="font:700 30px var(--sans);line-height:1.6">拿不到 3 个月的人：平均<span style="color:#ff8a73">是亏的</span></div>
      <div style="font:700 30px var(--sans);line-height:1.6">拿满 10 年的人：<span style="color:#9fd38c">98%</span> 赚了钱</div>
      <div style="font:500 19px var(--sans);color:#8f97a3;margin-top:10px">《公募权益类基金投资者盈利洞察报告》，2021</div></div>`, 'free', { left: '1290px', top: '300px' });
    ctx.tag({ t0: B(52.1), t1: B(55.9), at: () => gold.position.clone().add(new THREE.Vector3(0, 1.6, 0)), cls: 'tag pill', dy: -6, html: '<span class="g">定投的人</span>：照样每月买', style: { fontSize: '26px' } });
    ctx.cap({ t0: B(52.1), t1: B(54), html: '同样的钱，这时能买到<b class="g">更多</b>', cls: 'h1 light', y: 74 });
    ctx.cap({ t0: B(54.1), t1: B(55.9), html: '下跌，对定投来说，是<b class="g">打折</b>', cls: 'h1 light', y: 74 });
    ctx.cap({ t0: B(54.4), t1: B(55.9), html: '前提：这是几年内都用不到的<b class="g">闲钱</b>', cls: 'sub light', y: 184 });
    ctx.ev(SUN[0], 'hit', 38); ctx.ev(SUN[0] + .2, 'grow', 1);
    ctx.cap({ t0: B(56.3), t1: T1 - .3, html: '雨停之后，打折时多买的那些，<b class="g">涨得最多</b>', cls: 'h1', y: 74 });
    ctx.tag({ t0: B(56.6), t1: T1 - .3, at: new THREE.Vector3(-12.5, 5.2, IZ), cls: 'tag', html: '<div style="font:700 26px var(--sans);color:#5b6470;text-align:center">价格</div><div style="font:800 64px Inter;color:#3f7a33;line-height:1.1">涨回来了</div>' });
    ctx.cut(T1);
  },
  update(t, ctx) {
    const kd = sm(seg(t, ...DARK)) * (1 - sm(seg(t, ...SUN)));
    const dark1 = new THREE.Color('#f7f2ea').lerp(new THREE.Color('#5e6878'), kd), dark2 = new THREE.Color('#e2d8c8').lerp(new THREE.Color('#252b34'), kd);
    ctx.bg('#' + dark1.getHexString(), '#' + dark2.getHexString());
    ctx.hemi.intensity = lerp(1.0, .55, kd); ctx.hemi.color.set('#fff7ea').lerp(new THREE.Color('#aab7cc'), kd);
    ctx.sun.color.set('#fff0da').lerp(new THREE.Color('#9fb0c8'), kd);
    ctx.scene.environmentIntensity = lerp(.45, .2, kd);
    const sunK = sm(seg(t, SUN[0], SUN[1]));
    ctx.rays(sunK * (1 - seg(t, T1 - 1.2, T1)) * .9);
    ctx.sunAt(0, 2, 17, [9, 18, 11], lerp(2.6, .7, kd) + sunK * .5);
    // 云
    clouds.forEach((c, i) => {
      const kin = eo(seg(t, T0 - .5 + i * .12, B(47.2) + i * .1)), kout = ei(seg(t, SUN[0] - .2 + i * .05, SUN[1] + i * .05));
      const h = c.userData.home;
      c.position.set(h.x + c.userData.side * (1 - kin) * 26 + c.userData.side * kout * 28, h.y + kout * 3 + Math.sin(t * .6 + i) * .15, h.z);
      c.userData.mat.color.set('#7c8696').lerp(new THREE.Color('#5d6676'), kd);
    });
    // 雨
    const kr = win(t, B(46.4), SUN[0] + .6, 1.2, 1.0);
    rain.visible = kr > .01;
    if (rain.visible) {
      for (let i = 0; i < NR; i++) {
        const [x, z, ph, sp] = RD[i]; const H = 16, y = 14 - ((t * 18 * sp + ph * H) % H);
        _s.set(1, i / NR < kr ? 1 : 0.0001, 1); _m.compose(new THREE.Vector3(x, y, z), _q, _s); rain.setMatrixAt(i, _m);
      }
      rain.instanceMatrix.needsUpdate = true;
    }
    // 闪电
    let fl = 0;
    bolts.forEach((b, i) => { const d = t - BOLTS[i]; const on = (d > 0 && d < .09) || (d > .16 && d < .24); b.visible = on; if (d > 0 && d < .5) fl = Math.max(fl, (on ? .55 : 0) + .25 * Math.exp(-d * 8)); });
    els.flash.style.display = fl > .01 ? '' : 'none'; els.flash.style.opacity = (fl * .6).toFixed(3);
    // 森林摇晃 + 雨后长高
    const grow = 1 + .2 * sm(seg(t, SUN[0], T1));
    forest.items.forEach((o, i) => forest.set(i, grow, kd * .25, 0, Math.sin(t * 3.1 + o.x * .7 + o.z * .4) * .07 * kd));
    forest.commit();
    // 离场的人
    people.forEach((p, i) => {
      const k = seg(t, LEAVE + i * .13, LEAVE + i * .13 + 1.3), h = p.userData.home, d = p.userData.dir;
      p.position.set(h.x + d.x * 6 * ei(k), .4 + Math.abs(Math.sin(k * 12)) * .15 * (k > 0 && k < 1) - 3 * ei(seg(k, .55, 1)), h.z + d.z * 6 * ei(k));
      p.rotation.y = Math.atan2(d.x, d.z) * Math.min(1, k * 4);
      p.visible = k < .99;
      p.userData.body.material.color.set('#8494aa').lerp(new THREE.Color('#c96b5a'), Math.min(1, k * 3));
    });
    gold.position.y = .4 + Math.abs(Math.sin(t * 4)) * .04 * kd;
    // 买入：硬币落到金色小人头上 → 筹码掉进篮子
    let cv = false;
    BUYS.forEach(tb => { const k = seg(t, tb - .35, tb); if (k > 0 && t < tb + .25) { cv = true; coin.position.set(gold.position.x, gold.position.y + 1.6 + 3 * (1 - k * k), gold.position.z); coin.rotation.y = t * 6; const s = t > tb ? .45 * (1 - (t - tb) / .25) : .45; coin.scale.set(Math.max(.01, s), 1, Math.max(.01, s)); } });
    coin.visible = cv;
    chips.forEach(m => { const u = m.userData, k = seg(t, u.t, u.t + .3); m.visible = k > 0; m.position.set(basket.position.x + u.x * .8, basket.position.y + u.y + (1 - eo(k)) * 2.4, basket.position.z + u.z * .8); m.rotation.set(.3 * Math.sin(u.ry), u.ry, .2); });
    chipM.emissive.set('#ffb21e'); chipM.emissiveIntensity = sunK * (.35 + .15 * Math.sin(t * 5));
    elAnim(els.stat, t, B(50.2), B(51.95));
    // 镜头
    const kf = sm(seg(t, B(51.9), B(52.8))) * (1 - sm(seg(t, B(55.8), B(56.6))));
    const orb = Math.sin((t - T0) * .08) * 2;
    ctx.look(orb + kf * 1.5, lerp(11, 6.5, kf), lerp(31, 22, kf), kf * .6, lerp(2.6, 1.5, kf), lerp(1.5, PZ, kf), 30);
  },
};
