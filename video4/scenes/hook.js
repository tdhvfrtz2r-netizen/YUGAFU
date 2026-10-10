// 开场：同样每月 1000 元，只存不投 vs 定投宽基，20 年后两摞硬币
// 金币 = 钱自己生出来的钱，越到后面冒得越快
import { THREE, B, seg, eo, ei, sm, lerp, clamp, C, clay, metal, mesh, pedestal, coinGeo, FV } from '../lib.js';

const T0 = 0, T1 = B(8);
const Y0 = B(1.5), YD = B(4);                 // 20 年用 4 小节走完
const year = t => 20 * seg(t, Y0, Y0 + YD);
const tOfYear = y => Y0 + y / 20 * YD;
const XL = -3.8, XR = 3.8, PH = .45, STEP = .2, BASE = PH + .1;
const REVEAL = B(6);

// 收益第 j 万出现的年份
const G = y => FV(y) - 1.2 * y;
function yearOfGain(j) { let a = 0, b = 20; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (G(m) < j) a = m; else b = m; } return b; }

const L = [], R = [];
let geo, silverM, goldM, pedL, pedR, els = {};

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    geo = coinGeo();
    silverM = metal('#d5d9de', .32); goldM = metal('#f0b84c', .26);
    pedL = pedestal(2.0, PH); pedL.position.x = XL; pedR = pedestal(2.0, PH); pedR.position.x = XR;
    root.add(pedL, pedR);
    for (let k = 1; k <= 24; k++) L.push({ t: tOfYear(k / 1.2), gold: false });
    for (let k = 1; k <= 24; k++) R.push({ t: tOfYear(k / 1.2), gold: false });
    for (let j = 1; j <= 22; j++) R.push({ t: tOfYear(yearOfGain(j)), gold: true });
    R.sort((a, b) => a.t - b.t);
    [[L, XL], [R, XR]].forEach(([arr, x]) => arr.forEach((c, i) => {
      c.m = mesh(geo, c.gold ? goldM : silverM); c.m.scale.set(1.12, 1, 1.12); c.x = x; c.y = BASE + i * STEP; c.m.visible = false; root.add(c.m);
      if (x === XR) ctx.ev(c.t, c.gold ? 'goldcoin' : 'coin', c.gold ? .9 : .55);
    }));
    const firstGold = R.find(c => c.gold);

    ctx.cap({ t0: .25, t1: Y0 - .3, html: '每个月，拿出 <b class="g">1000</b> 元', cls: 'h1', y: 110 });
    ctx.cap({ t0: .9, t1: Y0 - .3, html: '两种放法，放 20 年', cls: 'sub', y: 215 });
    els.year = ctx.el('<span>第</span><span class="n">0</span><span>年</span>', 'free yr', { left: '0', width: '1920px', textAlign: 'center', top: '64px' });
    ctx.tag({ t0: B(1), t1: REVEAL - .1, at: new THREE.Vector3(XL, 0, 2.1), html: '只存不投', cls: 'tag pill', ay: 0, dy: 18 });
    ctx.tag({ t0: B(1) + .15, t1: REVEAL - .1, at: new THREE.Vector3(XR, 0, 2.1), html: '每月定投宽基', cls: 'tag pill', ay: 0, dy: 18, style: { color: '#b07a12' } });
    const topOf = (arr, x) => t => { let n = 0; for (const c of arr) if (t >= c.t) n++; return new THREE.Vector3(x, BASE + Math.max(0, n - 1) * STEP + .2, 0); };
    ctx.tag({ t0: Y0, t1: REVEAL - .05, out: .05, at: topOf(L, XL), cls: 'tag num', dy: -16, text: t => `${(1.2 * year(t)).toFixed(1)} 万`, style: { fontSize: '34px' } });
    ctx.tag({ t0: Y0, t1: REVEAL - .05, out: .05, at: topOf(R, XR), cls: 'tag num', dy: -16, text: t => `${FV(year(t)).toFixed(1)} 万`, style: { fontSize: '34px', color: '#b07a12' } });
    ctx.tag({ t0: firstGold.t + .05, t1: firstGold.t + 3.4, at: () => new THREE.Vector3(XR + 1.15, firstGold.y, 0), cls: 'tag pill', ax: 0, ay: .5, dx: 24, dy: 0, html: '<span class="g">金色</span> = 钱自己生出来的钱' });
    // 揭晓
    const nm = s => `<div style="font:700 28px var(--sans);color:#5b6470;letter-spacing:.06em">${s}</div>`;
    ctx.tag({ t0: REVEAL, t1: T1, at: new THREE.Vector3(XL - 1.3, BASE + 24 * STEP - .3, 0), cls: 'tag big num', ax: 1, ay: .5, dx: -10, dy: 0, html: nm('只存不投') + '24 万', pop: .5, style: { textAlign: 'right' } });
    ctx.tag({ t0: REVEAL + .12, t1: T1, at: new THREE.Vector3(XR + 1.3, BASE + 46 * STEP - .3, 0), cls: 'tag big num', ax: 0, ay: .5, dx: 10, dy: 0, html: nm('定投宽基') + '<span class="g" style="font-size:96px">46 万</span>', pop: .5 });
    ctx.tag({ t0: REVEAL + .7, t1: T1, at: new THREE.Vector3(XR + 1.3, BASE + 30 * STEP, 0), cls: 'tag pill num', ax: 0, ay: .5, dx: 16, dy: 0, html: '其中金色 <span class="g">22 万</span>', style: { fontSize: '32px' } });
    ctx.ev(REVEAL, 'hit', 40);
    ctx.cap({ t0: REVEAL + .1, t1: T1 - .1, html: '按每月 1000 元、年化约 6% 测算 · 仅为示意，不代表未来收益', cls: 'note', y: 1012 });
    ctx.cap({ t0: B(6.6), t1: T1 - .2, html: '多出来的 <b class="g">22 万</b>，是哪来的？', cls: 'h1', y: 84 });
    ctx.cut(T1);
    this.ctx = ctx;
  },
  update(t, ctx) {
    // 台座升起
    const kp = eo(seg(t, 0, .7));
    for (const p of [pedL, pedR]) { p.scale.set(1, Math.max(.01, kp), 1); }
    // 硬币下落
    for (const c of [...L, ...R]) {
      const k = seg(t, c.t - .3, c.t);
      if (t < c.t - .3) { c.m.visible = false; continue; }
      c.m.visible = true;
      let y = c.y + 5 * (1 - k * k);
      if (t > c.t) y += Math.sin((t - c.t) * 30) * .05 * Math.exp(-(t - c.t) * 12);
      c.m.position.set(c.x, y, 0);
      const s = lerp(.7, 1.12, eo(k)); c.m.scale.set(s, 1, s);
      c.m.rotation.z = (1 - k) * .4;
    }
    // 揭晓后金币发光
    const glow = seg(t, REVEAL + .3, REVEAL + 1.2) * (.55 + .25 * Math.sin((t - REVEAL) * 4));
    goldM.emissive.set('#ffb21e'); goldM.emissiveIntensity = glow * .35;
    // 年份
    const y = year(t);
    els.year.style.display = t >= Y0 - .2 && t < REVEAL ? '' : 'none';
    els.year.style.opacity = seg(t, Y0 - .2, Y0 + .2);
    els.year.querySelector('.n').textContent = Math.floor(y + 1e-6);
    // 镜头：跟着右边那摞往上走
    const hR = BASE + FV(y) * STEP;
    const back_ = sm(seg(t, REVEAL - .2, B(7)));
    const ly = Math.max(.9, hR * .5) + .6 * back_, dz = 12.5 + Math.max(0, hR - 1.2) * 1.55 + 3.2 * back_;
    const drift = sm(seg(t, REVEAL, T1));
    ctx.look(lerp(0, -.8, drift), 2.0 + hR * .42, dz, 0, ly, 0, 30);
    ctx.sunAt(0, 0, 11, [7, 18, 12]);
  },
};
