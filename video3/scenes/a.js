/* 五、国内股市十几年没回到六千点：①质疑 ②上证点位确实没回去 ③点位=房价，分红=房租 ④沪深 300 价格年化约 7%，含分红更高
 *   ⑤标普也有过失去的十年 ⑥同样从 07 年高点：一次性 -33% vs 定投 +35% ⑦跌时同样的钱买更多份额 ⑧三件事 */
(() => {
const L = { q: 'a1', sh: 'a2', rent: 'a3', hs: 'a4', sp: 'a5', how: 'a6', why: 'a7', three: 'a8', next: 's1' };
// 上证：关键点位为真实收盘/盘中值，中间走势为平滑示意
const SH = [[2005.0, 1260], [2005.45, 998], [2006.5, 1700], [2007.0, 2700], [2007.79, 6124], [2008.82, 1664], [2009.59, 3478], [2010.5, 2400], [2011.3, 3050], [2012.9, 1950], [2013.48, 1849], [2014.5, 2050], [2015.45, 5178], [2016.07, 2638], [2017.5, 3200], [2018.08, 3587], [2019.01, 2440], [2019.3, 3200], [2020.2, 2650], [2021.13, 3731], [2022.32, 2863], [2023.4, 3400], [2024.1, 2635], [2024.77, 3674], [2025.6, 3600], [2026.03, 4100], [2026.5, 4094], [2026.75, 3842]];
const HS = [[2004.99, 1000], [2005.45, 810], [2006.5, 1300], [2007.79, 5877], [2008.85, 1607], [2009.6, 3803], [2010.5, 2700], [2011.9, 2300], [2012.9, 2150], [2014.5, 2100], [2015.45, 5380], [2016.07, 2821], [2018.08, 4403], [2019.01, 2935], [2021.13, 5930], [2022.82, 3500], [2024.1, 3150], [2024.77, 4100], [2025.9, 4600], [2026.5, 4979], [2026.75, 4358]];
// 定投示意：沪深 300 自 2007-10-16（=100）起 10 年的关键点位
const DCA = [[0, 100], [.6, 62], [1.05, 27], [1.8, 65], [2.3, 55], [2.7, 42], [3.05, 60], [3.5, 56], [4.2, 39], [5.15, 36], [5.7, 34], [6.9, 42], [7.65, 92], [8.3, 48], [9.2, 57], [10, 66.6]];
// 标普 500 含分红指数（1926=1，对数刻度示意）
const SP = [[1926, 1], [1929.6, 2.6], [1932.4, .55], [1937, 2.0], [1942, 1.5], [1950, 3.6], [1960, 18], [1968, 40], [1972.9, 48], [1974.8, 30], [1980, 56], [1987.6, 260], [1990, 455], [1994, 900], [1999.9, 2850], [2000.2, 3000], [2002.75, 1650], [2007.8, 3450], [2009.2, 1650], [2009.99, 2590], [2013, 3800], [2018.9, 6800], [2019.99, 9250], [2020.2, 7400], [2021.99, 14100], [2022.8, 10600], [2023.99, 14600], [2024.99, 18200], [2025.9, 21500]];

function smooth(anchors, step, seed, noise) {
  const r = Core.rng(seed), out = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i], [x1, y1] = anchors[i + 1];
    for (let x = x0; x < x1 - 1e-9; x += step) {
      const k = (x - x0) / (x1 - x0), e = k * k * (3 - 2 * k);
      out.push([x, (y0 + (y1 - y0) * e) * (1 + (r() - .5) * noise * Math.sin(Math.PI * k))]);
    }
  }
  out.push(anchors[anchors.length - 1]);
  return out;
}
const shS = smooth(SH, 1 / 24, 7, .04), hsS = smooth(HS, 1 / 24, 8, .04), spS = smooth(SP, .25, 10, .02);
const dcaS = smooth(DCA, 1 / 12, 9, 0);   // 每月一个点
const hsTR = hsS.map(([x, y]) => [x, y * Math.pow(1.022, x - 2005)]);   // 含分红示意：股息约 2% 再投资
// 定投成本
const DCA_AVG = (() => { let sh = 0, n = 0; dcaS.slice(0, 120).forEach(p => { sh += 1 / p[1]; n++; }); return n / sh; })();

const G = { x0: 240, x1: 1680, y0: 860, y1: 230 };
const gx = (x, a, b) => G.x0 + (G.x1 - G.x0) * (x - a) / (b - a);
const gy = (v, lo, hi) => G.y0 - (G.y0 - G.y1) * (v - lo) / (hi - lo);
const path = (s, fx, fy, frac) => { const n = Math.max(2, Math.round(s.length * Math.min(1, Math.max(0, frac)))); return s.slice(0, n).map((p, i) => (i ? 'L' : 'M') + fx(p[0]).toFixed(1) + ' ' + fy(p[1]).toFixed(1)).join(''); };
const DANMU = ['十几年了还没回到6000点', '定投就是慢性割肉', '6%的收益哪来的？', '这套在中国行不通', '买了就跌，卖了就涨', '3000点保卫战又来了', '美股能涨不代表A股能涨', '韭菜的自我修养'];
const shX = x => gx(x, 2005, 2027), shY = v => gy(v, 0, 7000);
const hsX = x => gx(x, 2005, 2027), hsY = v => gy(v, 0, 11000);
const spX = x => gx(x, 1926, 2026), spY = v => gy(Math.log10(v), -.5, 4.5);
const dX = x => 240 + 1260 * x / 10, dY = v => gy(v, 0, 110);

Kit.add({
  key: 'a',
  anchors: L,
  keywords: ['六千点', '分红', '房租', '定投', '份额', '打折', '闲钱', '十年是亏的'],
  text: DANMU.join('') + '上证指数沪深标普价格指数含分红全收益一次性买入的成本十年后的价格定投平均成本份额房价房租再买入失去的十年年化示意关键点位为真实数据盘中最高收盘算没算分红是不是分批买很多年都不用的闲钱打折暴跌那几年',
  css: `
  .a-dm{position:absolute;white-space:nowrap;font-size:40px;font-weight:700;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.9)}
  .a-lab{position:absolute;font-size:28px;font-weight:700;white-space:nowrap}
  .a-chk{display:flex;align-items:center;gap:26px;font:900 52px var(--sans);margin:26px 0}
  .a-chk .bx{width:64px;height:64px;border-radius:14px;border:4px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center}
  `,
  html: `
  <section class="scene" id="aScene" data-s="${L.q}-0.6" data-e="${L.next}-0.45">
    <div id="a-dm" class="abs" style="inset:0"></div>
    <div id="a-q" class="ctr k900" style="top:440px;font-size:72px;opacity:0">这套，在中国行得通吗？</div>

    <!-- ② 上证 -->
    <svg id="a-sh" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <g id="a-sh-grid"></g>
      <line id="a-sh-peak" x1="${G.x0}" x2="${G.x1}" y1="${shY(6124)}" y2="${shY(6124)}" stroke="#ff5a4e" stroke-width="3" stroke-dasharray="12 10" opacity="0"/>
      <path id="a-sh-line" fill="none" stroke="#e9e4da" stroke-width="5" stroke-linejoin="round"/>
      <circle id="a-sh-dot" r="10" fill="#fff" opacity="0"/>
    </svg>
    <div id="a-sh-t" class="abs" style="left:240px;top:110px;opacity:0"><span class="k900" style="font-size:46px">上证指数</span><span class="mute" style="font-size:22px;margin-left:16px">价格指数 · 走势为示意，标注点位为真实数据</span></div>
    <div id="a-sh-l1" class="a-lab" style="left:${shX(2007.79) - 60}px;top:${shY(6124) - 52}px;color:#ff8a80;opacity:0">2007-10 盘中最高 6124</div>
    <div id="a-sh-l2" class="a-lab" style="left:${shX(2026.75) - 330}px;top:${shY(3842) + 56}px;opacity:0">2026-09-30 收盘 3842</div>

    <!-- ③ 房价 / 房租 -->
    <svg id="a-house" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <g transform="translate(700 300)">
        <path d="M0 170 L200 20 L400 170" fill="none" stroke="#e9e4da" stroke-width="12" stroke-linejoin="round"/>
        <rect x="45" y="160" width="310" height="230" fill="rgba(255,255,255,.04)" stroke="#e9e4da" stroke-width="10"/>
        <rect x="165" y="270" width="70" height="120" fill="none" stroke="#e9e4da" stroke-width="8"/>
      </g>
      <path id="a-reinv" d="M1200 720 C1260 560 1180 420 1060 420" fill="none" stroke="#f2c063" stroke-width="5" stroke-dasharray="14 10" opacity="0" marker-end="url(#a-arr)"/>
      <defs><marker id="a-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#f2c063"/></marker></defs>
    </svg>
    <div id="a-price" class="abs" style="left:330px;top:380px;width:350px;text-align:right;opacity:0;white-space:nowrap"><div class="k900" style="font-size:42px">房价</div><div class="k900 num" id="a-price-n" style="font-size:40px;color:#e9e4da">100</div><div class="mute" style="font-size:24px">= 指数点位，会涨也会跌</div></div>
    <div id="a-rent" class="abs" style="left:1290px;top:560px;opacity:0"><div class="k900 gold" style="font-size:46px">房租 = 分红</div><div style="font-size:26px;color:#cfc6b6;margin-top:6px">公司每年分给股东的钱</div></div>
    <div id="a-rein-l" class="abs k700 gold" style="left:1240px;top:400px;font-size:28px;opacity:0">拿去再买入</div>

    <!-- ④ 沪深 300 -->
    <svg id="a-hs" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <defs><linearGradient id="a-gap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c063" stop-opacity=".45"/><stop offset="1" stop-color="#f2c063" stop-opacity=".08"/></linearGradient></defs>
      <g id="a-hs-grid"></g>
      <path id="a-hs-gap" fill="url(#a-gap)"/>
      <path id="a-hs-p" fill="none" stroke="#e9e4da" stroke-width="5"/>
      <path id="a-hs-tr" fill="none" stroke="#f2c063" stroke-width="5" stroke-dasharray="14 8" style="filter:drop-shadow(0 0 8px rgba(242,192,99,.6))"/>
    </svg>
    <div id="a-hs-t" class="abs" style="left:240px;top:110px;opacity:0"><span class="k900" style="font-size:46px">沪深 300</span><span class="mute" style="font-size:22px;margin-left:16px">A 股最大的 300 家公司 · 2004 年底 = 1000 点</span></div>
    <div id="a-hs-b1" class="abs" style="left:700px;top:180px;opacity:0;padding:18px 26px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.25)">
      <div style="font-size:24px;color:#cfc6b6">光看价格：1000 → 4358（2026-09-30）</div><div class="k900" style="font-size:48px">年化约 <span class="num">7.0%</span></div></div>
    <div id="a-hs-b2" class="abs" style="left:1180px;top:180px;opacity:0;padding:18px 26px;border-radius:18px;background:rgba(242,192,99,.1);border:2px solid rgba(242,192,99,.55)">
      <div class="k900 gold" style="font-size:40px">算上分红：更高</div><div class="mute" style="font-size:20px">金色虚线为含分红示意</div></div>

    <!-- ⑤ 标普 -->
    <svg id="a-sp" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <rect id="a-sp-band" x="${spX(2000)}" width="${spX(2010) - spX(2000)}" y="${G.y1 - 20}" height="${G.y0 - G.y1 + 20}" fill="rgba(255,255,255,.12)" opacity="0"/>
      <line x1="${G.x0}" x2="${G.x1}" y1="${G.y0}" y2="${G.y0}" stroke="rgba(255,255,255,.25)"/>
      <g id="a-sp-ax"></g>
      <path id="a-sp-line" fill="none" stroke="#7fb4ff" stroke-width="5" style="filter:drop-shadow(0 0 8px rgba(127,180,255,.6))"/>
      <line id="a-sp-flat" x1="${spX(2000.2)}" x2="${spX(2009.99)}" y1="${spY(2850)}" y2="${spY(2850)}" stroke="#fff" stroke-width="3" stroke-dasharray="10 8" opacity="0"/>
    </svg>
    <div id="a-sp-t" class="abs" style="left:240px;top:110px;opacity:0"><span class="k900" style="font-size:46px">美国 · 标普 500</span><span class="mute" style="font-size:22px;margin-left:16px">含分红 · 对数刻度 · 示意</span></div>
    <div id="a-sp-l1" class="abs k900" style="left:300px;top:230px;font-size:42px;opacity:0">长期年化约 <span style="color:#7fb4ff">10%</span></div>
    <div id="a-sp-l2" class="abs" style="left:${spX(2005) - 170}px;top:190px;width:340px;text-align:center;opacity:0"><div class="k900" style="font-size:40px">失去的十年</div><div class="k700 red" style="font-size:28px">2000–2009 年化 -0.95%</div></div>

    <!-- ⑥ ⑦ 怎么买 -->
    <svg id="a-dca" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <line x1="${G.x0}" x2="${dX(10) + 70}" y1="${dY(0)}" y2="${dY(0)}" stroke="rgba(255,255,255,.25)"/>
      <g id="a-dca-ax"></g>
      <g id="a-dca-st"></g>
      <path id="a-dca-line" fill="none" stroke="#e9e4da" stroke-width="5" stroke-linejoin="round"/>
      <line id="a-lump" x1="${G.x0}" x2="${dX(10) + 70}" y1="${dY(100)}" y2="${dY(100)}" stroke="#ff5a4e" stroke-width="4" stroke-dasharray="14 8" opacity="0"/>
      <line id="a-avg" x1="${G.x0}" x2="${dX(10) + 70}" stroke="#f2c063" stroke-width="5" stroke-dasharray="14 8" opacity="0"/>
      <circle id="a-endpt" cx="${dX(10)}" cy="${dY(66.6)}" r="11" fill="#fff" opacity="0"/>
      <line id="a-gap1" x1="${dX(10) + 30}" x2="${dX(10) + 30}" y1="${dY(100)}" y2="${dY(66.6)}" stroke="#ff5a4e" stroke-width="6" opacity="0"/>
      <line id="a-gap2" x1="${dX(10) + 60}" x2="${dX(10) + 60}" y1="${dY(66.6)}" stroke="#f2c063" stroke-width="6" opacity="0"/>
    </svg>
    <div id="a-dca-t" class="abs" style="left:240px;top:90px;opacity:0"><span class="k900" style="font-size:44px">同样从 2007 年最高点开始，买 10 年</span><div class="mute" style="font-size:22px;margin-top:6px">沪深 300 价格指数（不含分红）· 2007-10-16 至 2017-10-16 · 定投为相对总投入的累计收益</div></div>
    <div id="a-lump-l" class="a-lab" style="left:${G.x0 + 10}px;top:${dY(100) - 44}px;color:#ff8a80;opacity:0">一次性买入的成本</div>
    <div id="a-end-l" class="a-lab" style="left:${dX(10) - 230}px;top:${dY(66.6) - 50}px;opacity:0">十年后的价格</div>
    <div id="a-v1" class="abs k900 red num" style="left:${dX(10) + 110}px;top:${dY(84) - 40}px;font-size:56px;opacity:0">-33%</div>
    <div id="a-avg-l" class="a-lab gold" style="left:${G.x0 + 10}px;opacity:0">定投的平均成本</div>
    <div id="a-v2" class="abs k900 gg num" style="left:${dX(10) + 110}px;font-size:56px;opacity:0">+35%</div>
    <div id="a-cheap" class="abs" style="opacity:0"><span class="badge" style="background:#f2c063;color:#2a1d05;font-size:28px;font-weight:900">打折</span></div>

    <!-- ⑧ 三件事 -->
    <div id="a-three" class="abs" style="left:560px;top:250px;opacity:0">
      <div class="k900" style="font-size:44px;margin-bottom:24px">行不行，看三件事：</div>
      <div class="a-chk" id="a-c1"><span class="bx"><span data-icon="check" style="color:#4fd1a5;width:44px;height:44px"></span></span>算没算分红</div>
      <div class="a-chk" id="a-c2"><span class="bx"><span data-icon="check" style="color:#4fd1a5;width:44px;height:44px"></span></span>是不是分批买</div>
      <div class="a-chk" id="a-c3"><span class="bx"><span data-icon="check" style="color:#4fd1a5;width:44px;height:44px"></span></span>是不是<span class="gold">很多年都不用的闲钱</span></div>
    </div>
  </section>`,
  setup(ctx) {
    const { $ } = ctx;
    $('a-dm').innerHTML = DANMU.map((d, i) => `<div class="a-dm" id="a-dm${i}" style="top:${120 + (i % 6) * 120}px">${d}</div>`).join('');
    let g = '';
    for (let v = 0; v <= 6000; v += 2000) g += `<line x1="${G.x0}" x2="${G.x1}" y1="${shY(v)}" y2="${shY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="${G.x0 - 20}" y="${shY(v) + 8}" font-size="22" fill="#6f6b64" text-anchor="end">${v}</text>`;
    for (let y = 2006; y <= 2026; y += 4) g += `<text x="${shX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-sh-grid').innerHTML = g;
    g = '';
    for (let v = 0; v <= 10000; v += 2500) g += `<line x1="${G.x0}" x2="${G.x1}" y1="${hsY(v)}" y2="${hsY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="${G.x0 - 20}" y="${hsY(v) + 8}" font-size="22" fill="#6f6b64" text-anchor="end">${v}</text>`;
    for (let y = 2006; y <= 2026; y += 4) g += `<text x="${hsX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-hs-grid').innerHTML = g;
    g = ''; for (let y = 1930; y <= 2020; y += 10) g += `<text x="${spX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-sp-ax').innerHTML = g;
    g = ''; for (let y = 2008; y <= 2017; y += 3) g += `<text x="${dX(y - 2007.79)}" y="${dY(0) + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-dca-ax').innerHTML = g;
    // 每年一堆份额：同样 3.6 万，价格越低堆越高
    let st = '';
    for (let yr = 0; yr < 10; yr++) st += `<rect id="a-st${yr}" x="${dX(yr + .5) - 30}" width="60" rx="6" fill="#f2c063" opacity="0"/>`;
    $('a-dca-st').innerHTML = st;
    $('a-avg').setAttribute('y1', dY(DCA_AVG)); $('a-avg').setAttribute('y2', dY(DCA_AVG));
    $('a-gap2').setAttribute('y2', dY(DCA_AVG));
    $('a-avg-l').style.top = (dY(DCA_AVG) + 10) + 'px';
    $('a-v2').style.top = (dY((66.6 + DCA_AVG) / 2) - 30) + 'px';
    const lowY = 5.7; $('a-cheap').style.left = (dX(lowY) - 40) + 'px'; $('a-cheap').style.top = (dY(34) + 20) + 'px';
  },
  events(ctx) {
    const { T } = ctx;
    ctx.ev(T(L.q) + .2, 'whoosh');
    ctx.ev(T(L.q + '@0.75'), 'hit', 10);
    ctx.ev(T(L.rent) - .1, 'whoosh');
    for (let i = 0; i < 5; i++) ctx.ev(T(L.rent + '@0.55') + i * .3, 'coins', .4);
    ctx.ev(T(L.hs) - .1, 'whoosh');
    ctx.ev(T(L.sp) - .1, 'whoosh');
    ctx.ev(T(L.how) - .1, 'whoosh');
    ctx.ev(T(L.how + '@0.45'), 'hit', 12); ctx.ev(T(L.how + '@0.88'), 'hit', 16);
    ctx.ev(T(L.why + '@0.1'), 'fill', 1); ctx.ev(T(L.why + '@0.72'), 'stamp');
    ['@0.25', '@0.48', '@0.72'].forEach(k => ctx.ev(T(L.three + k), 'pop'));
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, win } = Core;
    if (t < T(L.q) - 1 || t > T(L.next)) return;
    const W = 1920;
    // ① 弹幕 + 问题
    $('a-dm').style.opacity = win(t, T(L.q) - .2, T(L.q + '@0.7'), .3);
    DANMU.forEach((d, i) => { const el = $('a-dm' + i), t0 = T(L.q) - .3 + i * .4; el.style.left = (W + 40 - (t - t0) * 560) + 'px'; el.style.opacity = t > t0 ? (i % 3 === 0 ? 1 : .75) : 0; });
    const qk = clamp((t - T(L.q + '@0.72')) / .3);
    $('a-q').style.opacity = qk * (1 - clamp((t - T(L.sh) + .1) / .3));
    $('a-q').style.transform = `scale(${.6 + .4 * Core.back(qk)})`;
    // ② 上证
    const shA = win(t, T(L.sh) - .25, T(L.rent) - .1, .3);
    $('a-sh').style.opacity = shA; $('a-sh-t').style.opacity = shA;
    if (shA > 0) {
      const f = eio((t - T(L.sh) + .2) / 1.6);
      $('a-sh-line').setAttribute('d', path(shS, shX, shY, f));
      const last = shS[Math.max(1, Math.round(shS.length * Math.min(1, f))) - 1];
      $('a-sh-dot').setAttribute('cx', shX(last[0])); $('a-sh-dot').setAttribute('cy', shY(last[1])); $('a-sh-dot').setAttribute('opacity', f > 0 ? 1 : 0);
      const pk = clamp((t - T(L.sh) - .3) / .4);
      $('a-sh-peak').setAttribute('opacity', pk); $('a-sh-l1').style.opacity = pk * shA; $('a-sh-l2').style.opacity = clamp((t - T(L.sh) - 1.3) / .3) * shA;
    } else { $('a-sh-l1').style.opacity = 0; $('a-sh-l2').style.opacity = 0; }
    // ③ 房价 / 房租
    const hoA = win(t, T(L.rent) - .2, T(L.hs) + .1, .3);
    $('a-house').style.opacity = hoA;
    $('a-price').style.opacity = hoA * clamp((t - T(L.rent + '@0.1')) / .3);
    $('a-price-n').textContent = Math.round(100 + 18 * Math.sin((t - T(L.rent)) * 2.6));
    $('a-rent').style.opacity = hoA * clamp((t - T(L.rent + '@0.6')) / .3);
    const rk = clamp((t - T(L.rent + '@0.85')) / .4) * hoA; $('a-reinv').setAttribute('opacity', rk); $('a-rein-l').style.opacity = rk;
    // ④ 沪深 300
    const hsA = win(t, T(L.hs) - .1, T(L.sp) - .1, .3);
    $('a-hs').style.opacity = hsA; $('a-hs-t').style.opacity = hsA;
    if (hsA > 0) {
      const f1 = eio((t - T(L.hs)) / 2.2), f2 = eio((t - T(L.hs + '@0.72')) / 1.6);
      $('a-hs-p').setAttribute('d', path(hsS, hsX, hsY, f1));
      $('a-hs-tr').setAttribute('d', f2 > 0 ? path(hsTR, hsX, hsY, f2) : '');
      const n = Math.max(2, Math.round(hsTR.length * Math.min(1, f2)));
      $('a-hs-gap').setAttribute('d', f2 > 0 ? hsTR.slice(0, n).map((p, i) => (i ? 'L' : 'M') + hsX(p[0]).toFixed(1) + ' ' + hsY(p[1]).toFixed(1)).join('') + hsS.slice(0, n).reverse().map(p => 'L' + hsX(p[0]).toFixed(1) + ' ' + hsY(p[1]).toFixed(1)).join('') + 'Z' : '');
    }
    $('a-hs-b1').style.opacity = hsA * clamp((t - T(L.hs + '@0.5')) / .3);
    $('a-hs-b2').style.opacity = hsA * clamp((t - T(L.hs + '@0.8')) / .3);
    // ⑤ 标普
    const spA = win(t, T(L.sp) - .1, T(L.how) - .1, .3);
    $('a-sp').style.opacity = spA; $('a-sp-t').style.opacity = spA;
    if (spA > 0) $('a-sp-line').setAttribute('d', path(spS, spX, spY, eio((t - T(L.sp)) / 2.2)));
    const bd = clamp((t - T(L.sp + '@0.62')) / .4);
    $('a-sp-band').setAttribute('opacity', bd); $('a-sp-flat').setAttribute('opacity', bd);
    $('a-sp-l1').style.opacity = spA * clamp((t - T(L.sp + '@0.2')) / .3); $('a-sp-l2').style.opacity = spA * bd;
    // ⑥ ⑦ 怎么买
    const dA = win(t, T(L.how) - .1, T(L.three) - .1, .3);
    $('a-dca').style.opacity = dA; $('a-dca-t').style.opacity = dA;
    if (dA > 0) $('a-dca-line').setAttribute('d', path(dcaS, dX, dY, eio((t - T(L.how)) / 1.8)));
    const k1 = clamp((t - T(L.how + '@0.25')) / .4), k2 = clamp((t - T(L.how + '@0.4')) / .3), k3 = clamp((t - T(L.how + '@0.72')) / .6);
    $('a-lump').setAttribute('opacity', k1); $('a-lump-l').style.opacity = k1 * dA;
    $('a-endpt').setAttribute('opacity', k2); $('a-end-l').style.opacity = k2 * dA;
    $('a-gap1').setAttribute('opacity', clamp((t - T(L.how + '@0.45')) / .3)); $('a-v1').style.opacity = clamp((t - T(L.how + '@0.45')) / .3) * dA;
    const avgY = dY(100) + (dY(DCA_AVG) - dY(100)) * eio(k3);
    $('a-avg').setAttribute('y1', avgY); $('a-avg').setAttribute('y2', avgY); $('a-avg').setAttribute('opacity', clamp(k3 * 3));
    $('a-avg-l').style.top = (avgY + 10) + 'px'; $('a-avg-l').style.opacity = clamp(k3 * 3) * dA;
    $('a-gap2').setAttribute('opacity', clamp((t - T(L.how + '@0.86')) / .3)); $('a-v2').style.opacity = clamp((t - T(L.how + '@0.86')) / .3) * dA;
    // ⑦ 份额堆
    for (let yr = 0; yr < 10; yr++) {
      const avgP = dcaS.slice(yr * 12, yr * 12 + 12).reduce((a, p) => a + p[1], 0) / 12, hh = 9000 / avgP;
      const k = eo((t - T(L.why + '@0.08') - yr * .12) / .5), el = $('a-st' + yr);
      el.setAttribute('y', dY(0) - hh * k); el.setAttribute('height', hh * k); el.setAttribute('opacity', .85 * clamp(k * 3));
      el.setAttribute('fill', avgP < 45 && t > T(L.why + '@0.65') ? '#ffe08f' : '#c9a24a');
    }
    $('a-cheap').style.opacity = clamp((t - T(L.why + '@0.72')) / .3) * dA;
    $('a-cheap').style.transform = `scale(${1 + .6 * Math.max(0, 1 - (t - T(L.why + '@0.72')) / .25)})`;
    // ⑧ 三件事
    const th = clamp((t - T(L.three) + .1) / .4);
    $('a-three').style.opacity = th;
    ['a-c1', 'a-c2', 'a-c3'].forEach((id, i) => { const k = clamp((t - T(L.three + ['@0.25', '@0.48', '@0.72'][i])) / .3); const el = $(id); el.style.opacity = .35 + .65 * k; el.querySelector('[data-icon]').style.opacity = k; el.style.transform = `translateX(${(1 - k) * 20}px)`; });
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T(L.q) - .5, T(L.next) - .4);
    ctx.glow(960, 520, 950, 'rgba(242,175,70,A)', .09 * w);
    ctx.glow(960, 520, 950, 'rgba(90,140,255,A)', .1 * Core.win(t, T(L.sp), T(L.how)));
  },
  fx(t, ctx) {
    const { T, Core } = ctx; const a = T(L.rent + '@0.45'), b = T(L.hs) + .1;
    if (t < a - .1 || t > b + .3) return;
    const f = ctx.fxc, k = Core.win(t, a - .1, b + .3, .3), r = Core.rng(77);
    for (let i = 0; i < 24; i++) {
      const t0 = a + i * .08, tau = t - t0; if (tau < 0) continue;
      const x0 = 1020 + r() * 40, x1 = 1170 + (i % 6) * 34, y1 = 800 - Math.floor(i / 6) * 16;
      const u = Math.min(1, tau / .5), x = x0 + (x1 - x0) * u, y = 600 + (y1 - 600) * u * u;
      f.globalAlpha = k; f.fillStyle = '#f2c063'; f.beginPath(); f.ellipse(x, y, 16, 7, 0, 0, 7); f.fill();
      f.strokeStyle = '#b8862d'; f.lineWidth = 2; f.stroke();
    }
    f.globalAlpha = 1;
  },
});
})();
