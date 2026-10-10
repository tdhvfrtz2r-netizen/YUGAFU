// 二、定投 = 每月固定花同样的钱
// 9 个月：硬币落下 → 价格柱升起（先跌后涨回原点）→ 每月的钱换成份额筹码（便宜时更多）
// → 价格回到原点，一次性 0%、定投 +25% → 前提：得涨回来 → 真实 A 股：2007 年最高点开始的 10 年
import { THREE, B, BEAT, seg, eo, ei, eio, sm, back, lerp, clamp, C, clay, metal, mesh, coinGeo, chipGeo, pillarGeo, RoundedBoxGeometry, elAnim, DCA_ANCHORS, monthly } from '../lib.js';

const T0 = B(24), T1 = B(46);
const XS = i => -8 + i * 2;
const PRICE = [10, 9, 8, 7, 6, 7, 8, 9, 10], BAD = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const SHARES = PRICE.map(p => Math.round(1000 / p));
const CHIPS = PRICE.map(p => Math.round(100 / p));
const PH = p => p * .34, TILE = .22, CZ = 2.0, CHIP = .125;
const COIN_T = i => B(25) + i * BEAT;
const RISE = i => B(28) + i * .07;
const CONV = []; CONV[0] = B(30); CONV[4] = B(30.75); [1, 2, 3, 5, 6, 7, 8].forEach((m, j) => CONV[m] = B(31.5) + j * BEAT);
const SINK = B(38.55), RECOV = B(39.95);
const RIDGE = B(42), WALK = [B(42.7), B(44.6)];

const MP = monthly(DCA_ANCHORS);
const RX = x => -11 + x * 2.2, RH = v => v / 100 * 5.5;
const YEARS = Array.from({ length: 10 }, (_, y) => { let s = 0; for (let m = 12 * y; m < 12 * y + 12; m++) s += 100 / MP[m][1]; return Math.round(s / 12 * 10); });

let set1, set2, tiles = [], pillars = [], coins = [], chips = [], ridgeMat, grassMat, walker, dashes = [], ystacks = [], els = {};
const price = (i, t) => {
  if (i < 5) return PRICE[i];
  const d = (i - 5) * .1, s = sm(seg(t, SINK + d, SINK + .7 + d)), r = sm(seg(t, RECOV + d, RECOV + .7 + d));
  return lerp(lerp(PRICE[i], BAD[i], s), PRICE[i], r);
};

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    ctx.renderer.localClippingEnabled = true;
    set1 = new THREE.Group(); set2 = new THREE.Group(); root.add(set1, set2);
    const tileG = new RoundedBoxGeometry(1.7, TILE, 1.7, 4, .08).translate(0, TILE / 2, 0), tileM = clay('#f3ebdf', { r: .9 });
    const cg = coinGeo(), gm = metal('#f0b84c', .26), chg = chipGeo();
    els.chipMs = [];
    for (let i = 0; i < 9; i++) {
      const tl = mesh(tileG, tileM); tl.position.x = XS(i); set1.add(tl); tiles.push(tl);
      const pm = clay(C.slate, { r: .6 }); const p = mesh(pillarGeo(1), pm); p.position.set(XS(i), TILE, 0); set1.add(p); pillars.push(p);
      const c = mesh(cg, gm); c.scale.set(.62, 1, .62); set1.add(c); coins.push(c);
      const st = [], chipM = clay('#6ea65a', { r: .55 }); els.chipMs.push(chipM);
      for (let k = 0; k < CHIPS[i]; k++) { const m = mesh(chg, chipM); m.position.set(XS(i), .06 + k * CHIP, CZ); set1.add(m); st.push(m); }
      chips.push(st);
      ctx.ev(COIN_T(i), 'coin', .9); ctx.ev(CONV[i], 'chips', CHIPS[i] / 10);
      ctx.tag({ t0: B(24.3) + i * .05, t1: B(41.9), at: new THREE.Vector3(XS(i), 0, CZ + .7), cls: 'tag small', ay: 0, dy: 10, html: `${i + 1}月` });
      ctx.tag({ t0: COIN_T(i) + .05, t1: RISE(i) + .1, out: .2, at: () => coins[i].position.clone().add(new THREE.Vector3(0, .3, 0)), cls: 'tag num', dy: -6, html: '¥1000', style: { fontSize: '24px', color: '#a8740e' } });
      ctx.tag({ t0: B(28.4) + i * .06, t1: B(41.9), at: () => new THREE.Vector3(XS(i), TILE + pillars[i].userData.h + .35, 0), cls: 'tag pill num', dy: -8, style: { fontSize: '27px', padding: '4px 14px' },
        text: t => { const p = price(i, t); const col = p < PRICE[i] - .2 ? '#c94a35' : '#1d242c'; return `<span style="color:${col}">¥${Math.round(p)}</span>`; } });
      ctx.tag({ t0: CONV[i] + .35, t1: B(37), at: new THREE.Vector3(XS(i), .1 + CHIPS[i] * CHIP + .25, CZ), cls: 'tag num', dy: -4, html: `${SHARES[i]} 份`, style: { fontSize: '25px', color: '#3f7a33' } });
    }
    ctx.ev(B(28), 'rise', 1);

    ctx.cap({ t0: B(24.15), t1: B(27.8), html: '定投：每个月，固定花<b class="g">同样的钱</b>', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(24.6), t1: B(27.8), html: '比如每月 1000 元，连着买 9 个月', cls: 'sub', y: 184 });
    ctx.cap({ t0: B(28.05), t1: B(29.75), html: '但每个月的<b class="s">价格</b>，不一样', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(29.85), t1: B(32.9), html: '贵的时候买得<b class="r">少</b>，便宜的时候买得<b class="gr">多</b>', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(30.2), t1: B(32.9), html: '绿色筹码 = 买到的份额', cls: 'sub', y: 184 });
    ctx.cap({ t0: B(33), t1: B(34.15), html: '9 个月后，价格回到 ¥10 —— <b class="s">原点</b>', cls: 'h1', y: 74 });
    const card = (k, v, d, col) => `<div class="card" style="width:560px"><div class="k">${k}</div><div class="v" style="color:${col}">${v}</div><div class="d">${d}</div></div>`;
    els.c1 = ctx.el(card('一次性买入<span style="font-weight:500;color:#8a8f96;font-size:22px">（第 1 个月全买）</span>', '0%', '900 份 × ¥10 = ¥9,000，不赚不亏', '#1d242c'), 'free', { left: '230px', top: '48px' });
    els.c2 = ctx.el(card('每月定投', '+25%', '1,125 份 × ¥10 = ¥11,247', '#3f7a33'), 'free', { left: '1130px', top: '48px' });
    ctx.ev(B(34.2), 'pop', 1); ctx.ev(B(34.45), 'cash', 1);
    ctx.cap({ t0: B(35.3), t1: B(36.9), html: '价格只是回到原点，定投已经赚了 <b class="g">25%</b>', cls: 'h2', y: 912 });
    ctx.cap({ t0: B(35.3), t1: B(36.9), html: '示意数据，非真实行情', cls: 'note', y: 1010 });
    ctx.tag({ t0: B(35.5), t1: B(36.9), at: new THREE.Vector3(XS(4), TILE + PH(6) + 1.0, 0), cls: 'tag dark', dy: -30, html: '秘密在这：便宜时<b style="color:#f2c063">多买</b>的 ↓', style: { fontSize: '28px' } });
    ctx.ev(B(35.3), 'hit', 18);

    ctx.cap({ t0: B(37.1), t1: B(38.45), html: '但有个前提：价格得<b class="gr">涨回来</b>', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(38.55), t1: B(39.85), html: '单只股票，可能<b class="r">一去不回</b>', cls: 'h1', y: 74 });
    ctx.tag({ t0: SINK + 1.0, t1: RECOV - .1, at: () => new THREE.Vector3(XS(8), TILE + pillars[8].userData.h + 1.1, 0), cls: 'tag dark', dy: -8, html: '这时定投也救不了：<b style="color:#ff8a73">−75%</b>', style: { fontSize: '26px' } });
    ctx.ev(SINK, 'down', 1); ctx.ev(RECOV, 'up', 1);
    ctx.cap({ t0: B(39.95), t1: B(40.9), html: '宽基是整片森林，长期<b class="gr">更有机会</b>涨回来', cls: 'h1', y: 74 });
    ctx.cap({ t0: B(41.0), t1: B(41.85), html: '所以，定投要投<b class="g">宽基</b>', cls: 'h1', y: 74, out: .25 });
    ctx.ev(B(41), 'hit', 24);
    ctx.cut(RIDGE, .3);

    // —— 真实 A 股：山脊 ——
    const shape = new THREE.Shape(); shape.moveTo(RX(0), 0);
    MP.forEach(([x, v]) => shape.lineTo(RX(x), RH(v))); shape.lineTo(RX(10), 0); shape.lineTo(RX(0), 0);
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0); els.plane = plane;
    ridgeMat = [clay('#e5ddd0', { r: .9 }), clay('#a9b8c9', { r: .85 })];
    ridgeMat.forEach(m => { m.clippingPlanes = [plane]; m.clipShadows = true; });
    const rg = mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: true, bevelThickness: .1, bevelSize: .08, bevelSegments: 2, curveSegments: 1 }).translate(0, 0, -1.2), ridgeMat);
    set2.add(rg);
    // 山脊顶上的草皮
    const pos = [], idx = [];
    MP.forEach(([x, v], i) => { pos.push(RX(x), RH(v) + .09, -1.32, RX(x), RH(v) + .09, 1.32); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
    grassMat = clay('#8fb873', { side: THREE.DoubleSide }); grassMat.clippingPlanes = [plane];
    set2.add(mesh(gg, grassMat, false, true));
    walker = mesh(new THREE.SphereGeometry(.3, 24, 16), new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb21e', emissiveIntensity: .9 })); set2.add(walker);
    const dm = clay(C.red, { r: .6 });
    for (let x = RX(0); x < RX(10); x += .6) { const d = mesh(new THREE.BoxGeometry(.36, .07, .07), dm, false, false); d.position.set(x + .18, RH(100), 1.4); set2.add(d); dashes.push(d); }
    const gch = clay('#f0b84c', { r: .45 });
    YEARS.forEach((n, y) => {
      const st = []; for (let k = 0; k < n; k++) { const m = mesh(chg, gch); m.scale.set(1.1, 1, 1.1); m.position.set(RX(y + .5), .06 + k * CHIP, 3.0); set2.add(m); st.push(m); }
      ystacks.push(st); ctx.ev(WALK[0] + (y + 1) / 10 * (WALK[1] - WALK[0]), 'chips', n / 25);
    });
    ctx.cap({ t0: RIDGE + .1, t1: B(44.55), html: '真实的A股：如果你在 <b class="r">2007 年最高点</b>开始买', cls: 'h1', y: 74 });
    ctx.cap({ t0: RIDGE + .5, t1: B(44.55), html: '沪深300 · 2007 年 10 月 → 2017 年 10 月 · 金色筹码 = 每年买到的份额', cls: 'sub', y: 184 });
    ctx.tag({ t0: B(42.6), t1: T1, at: new THREE.Vector3(RX(0) + .3, RH(100) + .1, 1.4), cls: 'tag small', ax: 0, ay: 1, dy: -6, html: '<span class="r">— —</span> 最高点一次性买入的成本', style: { color: '#c94a35' } });
    ctx.tag({ t0: B(43.6), t1: T1, at: new THREE.Vector3(RX(5.5), .1 + YEARS[5] * CHIP + .2, 3.0), cls: 'tag pill', dy: -8, html: '跌得越深，<span class="g">买得越多</span>', style: { fontSize: '26px' } });
    els.c3 = ctx.el(card('一次性买入，10 年后', '−33%', '还没回本', '#c94a35'), 'free', { left: '230px', top: '48px' });
    els.c4 = ctx.el(card('每月定投，10 年后', '+35%', '同一段行情', '#3f7a33'), 'free', { left: '1130px', top: '48px' });
    ctx.ev(B(44.65), 'hit', 26);
    ctx.cap({ t0: RIDGE + .3, t1: T1 - .2, html: '沪深300价格指数，2007.10.16—2017.10.16 · 数据：华夏基金投教 · 历史数据不代表未来', cls: 'note', y: 1012 });
    ctx.cut(T1);
  },
  update(t, ctx) {
    const on1 = t < RIDGE; set1.visible = on1; set2.visible = !on1;
    if (on1) {
      for (let i = 0; i < 9; i++) {
        tiles[i].scale.setScalar(Math.max(.001, back(seg(t, T0 + .2 + i * .05, T0 + .65 + i * .05), 2)));
        const kr = eo(seg(t, RISE(i), RISE(i) + .8)), p = price(i, t), h = PH(p) * kr;
        const pl = pillars[i]; pl.visible = h > .05; pl.userData.h = h;
        if (pl.visible) pl.geometry = pillarGeo(h);
        const bad = clamp((PRICE[i] - p) / 4), good = i >= 5 ? sm(seg(t, RECOV, RECOV + .8)) * (1 - seg(t, B(41.6), B(42))) : 0;
        pl.material.color.set(C.slate).lerp(new THREE.Color('#d9775f'), bad).lerp(new THREE.Color('#86b56f'), good);
        // 硬币
        const c = coins[i], kc = seg(t, COIN_T(i) - .3, COIN_T(i)), kv = seg(t, CONV[i], CONV[i] + .3);
        c.visible = t > COIN_T(i) - .3 && kv < 1;
        const top = TILE + h + .1;
        let y = top + 4.5 * (1 - kc * kc);
        if (t > COIN_T(i)) y += Math.sin((t - COIN_T(i)) * 28) * .05 * Math.exp(-(t - COIN_T(i)) * 10);
        c.position.set(XS(i), y + kv * .6, 0); const s = .62 * (1 - eo(kv)); c.scale.set(Math.max(.001, s), 1, Math.max(.001, s)); c.rotation.y = kv * 6;
        // 筹码
        chips[i].forEach((m, k) => {
          const t0 = CONV[i] + .12 + k * .035, kk = seg(t, t0, t0 + .22);
          m.visible = t > t0; m.position.y = .06 + k * CHIP + (1 - eo(kk)) * .8;
        });
      }
      const glow = seg(t, B(35.3), B(35.8)) * (1 - seg(t, B(36.8), B(37.2)));
      // 谷底几个月的筹码发光
      els.chipMs.forEach((m, i) => { const g = (i >= 3 && i <= 5) ? glow : 0; m.color.set('#6ea65a').lerp(new THREE.Color('#e9ad3c'), g); m.emissive.set('#c47a00'); m.emissiveIntensity = g * .25; });
      elAnim(els.c1, t, B(34.2), B(36.9)); elAnim(els.c2, t, B(34.45), B(36.9));
      // 镜头
      const kUp = sm(seg(t, B(27.6), B(28.8))), kCard = sm(seg(t, B(33.6), B(34.4))) * (1 - sm(seg(t, B(36.8), B(37.6))));
      const kD = sm(seg(t, B(37.4), B(38.4)));
      ctx.look(0, lerp(5.6, 6.8, kUp) + kCard * .6, lerp(19.5, 23.5, kUp) + kCard * 3.5 - kD * 1.2,
        0, lerp(.7, 2.2, kUp) + kCard * 1.4, 0, 30);
      ctx.sunAt(0, 0, 13, [6, 18, 12]);
    } else {
      const k = sm(seg(t, ...WALK));
      const xm = k * 10, mi = Math.min(119, Math.floor(xm * 12)), f = xm * 12 - mi;
      const v = lerp(MP[mi][1], MP[mi + 1][1], f);
      walker.position.set(RX(xm), RH(v) + .38, 0); walker.visible = t > WALK[0] - .3;
      els.plane.constant = RX(Math.max(.02, xm)) + .02;
      dashes.forEach(d => { d.visible = t > B(42.55) + (d.position.x + 11) / 22 * .5; });
      ystacks.forEach((st, y) => {
        const t0 = WALK[0] + (y + 1) / 10 * (WALK[1] - WALK[0]) - .25;
        st.forEach((m, j) => { const kk = seg(t, t0 + j * .012, t0 + j * .012 + .2); m.visible = kk > 0; m.position.y = .06 + j * CHIP + (1 - eo(kk)) * .6; });
      });
      elAnim(els.c3, t, B(44.65), T1 - .2); elAnim(els.c4, t, B(44.85), T1 - .2);
      const kc = sm(seg(t, B(44.3), B(44.9)));
      ctx.look(lerp(-2.5, 1, k), 7.4 + kc * .5, 30.5 + kc * 2, lerp(-2.5, 1, k), 2.9 + kc * .9, 0, 30);
      ctx.sunAt(0, 0, 15, [6, 18, 12]);
    }
  },
};
