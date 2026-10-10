/* 五、A 股 3000 点：①质疑 ②上证点位 19 年没回去 ③点位=房价，分红=房租 ④沪深 300 价格 vs 含分红 ⑤一次性 vs 定投 ⑥定投为什么能摊低成本 ⑦标普也有失去的十年 ⑧前提：闲钱、长期 */
(() => {
// 关键点位（真实值，来自交易所历史行情）；中间走势为平滑示意
const SH = [[2005.0, 1260], [2005.45, 998], [2006.5, 1700], [2007.0, 2700], [2007.79, 6124], [2008.82, 1664], [2009.59, 3478], [2010.5, 2400], [2011.3, 3050], [2012.9, 1950], [2013.48, 1849], [2014.5, 2050], [2015.45, 5178], [2016.07, 2638], [2017.5, 3200], [2018.08, 3587], [2019.01, 2440], [2019.3, 3200], [2020.2, 2650], [2021.13, 3731], [2022.32, 2863], [2023.4, 3400], [2024.1, 2635], [2024.77, 3674], [2025.6, 3600], [2026.03, 4100], [2026.75, 3842]];
const HS = [[2004.99, 1000], [2005.45, 810], [2006.5, 1300], [2007.79, 5877], [2008.85, 1607], [2009.6, 3803], [2010.5, 2700], [2011.9, 2300], [2012.9, 2150], [2014.5, 2100], [2015.45, 5380], [2016.07, 2821], [2018.08, 4403], [2019.01, 2935], [2021.13, 5930], [2022.82, 3500], [2024.1, 3150], [2024.77, 4100], [2025.9, 4600], [2026.75, 4358]];
// 定投示意：2007-10 起 10 年的价格路径（指数化，起点 100）
const DCA = [[0, 100], [.6, 62], [1.1, 30], [1.9, 62], [2.6, 58], [3.3, 47], [4.4, 38], [5.6, 41], [6.7, 92], [7.3, 56], [8.2, 60], [9.2, 66], [10, 70]];
// 标普 500 含分红指数（对数刻度，示意形状）
const SP = [[1926, 1], [1929.6, 2.6], [1932.4, .55], [1937, 2.0], [1942, 1.2], [1950, 3.0], [1960, 12], [1968, 25], [1974.8, 20], [1980, 45], [1987.6, 150], [1990, 200], [2000, 1250], [2002.7, 720], [2007.8, 1150], [2009.2, 640], [2010, 1150], [2013, 1500], [2019, 2900], [2020.2, 2600], [2021.9, 4300], [2022.8, 3400], [2025.9, 6200]];

function smooth(anchors, step, seed, noise) {
  const r = Core.rng(seed), out = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i], [x1, y1] = anchors[i + 1];
    for (let x = x0; x < x1; x += step) {
      const k = (x - x0) / (x1 - x0), e = k * k * (3 - 2 * k);
      const n = (r() - .5) * noise * Math.sin(Math.PI * k);
      out.push([x, (y0 + (y1 - y0) * e) * (1 + n)]);
    }
  }
  out.push(anchors[anchors.length - 1]);
  return out;
}
const shS = smooth(SH, 1 / 24, 7, .05), hsS = smooth(HS, 1 / 24, 8, .05), dcaS = smooth(DCA, 1 / 12, 9, .04), spS = smooth(SP, .25, 10, .03);
// 沪深 300 含分红：价格 × 累计分红因子（股息率约 2%/年再投资，示意）
const hsTR = hsS.map(([x, y]) => [x, y * Math.pow(1.02, x - 2005)]);

// 图表坐标
const G = { x0: 240, x1: 1680, y0: 860, y1: 230 };
const gx = (x, a, b) => G.x0 + (G.x1 - G.x0) * (x - a) / (b - a);
const gy = (v, lo, hi) => G.y0 - (G.y0 - G.y1) * (v - lo) / (hi - lo);
function path(series, fx, fy, frac) {
  const n = Math.max(2, Math.round(series.length * Math.min(1, Math.max(0, frac))));
  return series.slice(0, n).map((p, i) => (i ? 'L' : 'M') + fx(p[0]).toFixed(1) + ' ' + fy(p[1]).toFixed(1)).join('');
}
const DANMU = ['A股十几年还在3000点', '定投就是慢性割肉', '6%的收益哪来的？', '这套在中国行不通', '买了就跌，卖了就涨', '韭菜的自我修养', '3000点保卫战又来了', '美股能涨不代表A股能涨'];

Kit.add({
  key: 'a',
  keywords: ['三千点', '分红', '房租', '定投', '份额', '闲钱', '十年是负的'],
  text: DANMU.join('') + '上证指数沪深标普价格指数含分红全收益一次性买入每月定投平均成本平均价格份额房价房租失去的十年年化示意关键点位为真实数据长期能涨每一段闲钱',
  css: `
  .a-dm{position:absolute;white-space:nowrap;font-size:40px;font-weight:700;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.9)}
  .a-lab{position:absolute;font-size:26px;font-weight:700}
  .a-src{position:absolute;right:240px;top:880px;font-size:20px;color:#77736c}
  `,
  html: `
  <section class="scene" id="aScene" data-s="a1-0.6" data-e="s1-0.45">
    <div id="a-dm" class="abs" style="inset:0"></div>
    <div class="a ctr k900" data-in="a1@0.55" data-fx="slam" data-shake="10" data-out="a2-0.2" style="top:430px;font-size:72px">这套，在中国行得通吗？</div>

    <svg id="a-sh" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <g id="a-sh-grid"></g>
      <line id="a-sh-peak" x1="${G.x0}" x2="${G.x1}" stroke="#ff5a4e" stroke-width="3" stroke-dasharray="12 10" opacity="0"/>
      <path id="a-sh-line" fill="none" stroke="#e9e4da" stroke-width="5" stroke-linejoin="round"/>
      <circle id="a-sh-dot" r="10" fill="#fff" opacity="0"/>
    </svg>
    <div class="a abs" data-in="a2@0.22" data-fx="fade" data-out="a3-0.2" style="left:240px;top:90px"><span class="k900" style="font-size:48px">上证指数</span><span class="mute" style="font-size:24px;margin-left:16px">价格指数 · 2005–2026 · 走势为示意，关键点位为真实数据</span></div>
    <div class="a a-lab" data-in="a2@0.32" data-fx="pop" data-out="a3-0.2" id="a-sh-l1" style="color:#ff8a80;font-size:34px">2007 年 10 月：6124</div>
    <div class="a a-lab" data-in="a2@0.58" data-fx="pop" data-out="a3-0.2" id="a-sh-l2" style="font-size:34px">2026 年 9 月：3842</div>
    <div class="a abs k900 red" data-in="a2@0.8" data-fx="slam" data-shake="8" data-out="a3-0.2" style="left:880px;top:200px;font-size:48px">只看点位：19 年没回去</div>

    <svg id="a-house" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <g transform="translate(760 330)">
        <path d="M0 170 L200 20 L400 170" fill="none" stroke="#e9e4da" stroke-width="12" stroke-linejoin="round"/>
        <rect x="45" y="160" width="310" height="230" fill="rgba(255,255,255,.04)" stroke="#e9e4da" stroke-width="10"/>
        <rect x="165" y="270" width="70" height="120" fill="none" stroke="#e9e4da" stroke-width="8"/>
      </g>
    </svg>
    <div id="a-house-lab1" class="abs" style="left:520px;top:400px;opacity:0;text-align:right;width:220px"><div class="k900" style="font-size:44px">房价</div><div class="mute" style="font-size:26px">= 指数点位</div></div>
    <div id="a-house-lab2" class="abs" style="left:1330px;top:560px;opacity:0"><div class="k900 gold" style="font-size:44px">房租</div><div class="mute" style="font-size:26px">= 分红</div></div>

    <svg id="a-hs" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <defs><linearGradient id="a-gap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c063" stop-opacity=".45"/><stop offset="1" stop-color="#f2c063" stop-opacity=".08"/></linearGradient></defs>
      <g id="a-hs-grid"></g>
      <path id="a-hs-gap" fill="url(#a-gap)"/>
      <path id="a-hs-p" fill="none" stroke="#e9e4da" stroke-width="5"/>
      <path id="a-hs-tr" fill="none" stroke="#f2c063" stroke-width="6" style="filter:drop-shadow(0 0 10px rgba(242,192,99,.7))"/>
    </svg>
    <div class="a abs" data-in="a4" data-fx="fade" data-out="a5-0.2" style="left:240px;top:90px"><span class="k900" style="font-size:48px">沪深 300</span><span class="mute" style="font-size:24px;margin-left:16px">2004–2026 · 走势为示意</span></div>
    <div class="a abs" data-in="a4@0.3" data-fx="fade" data-out="a5-0.2" style="left:1300px;top:120px;font-size:28px;line-height:1.9">
      <div><span style="display:inline-block;width:40px;height:5px;background:#e9e4da;vertical-align:8px;margin-right:12px"></span>价格指数（点位）</div>
      <div class="gold"><span style="display:inline-block;width:40px;height:6px;background:#f2c063;vertical-align:8px;margin-right:12px"></span>含分红（全收益）</div></div>
    <div class="a abs" data-in="a4@0.7" data-fx="pop" data-out="a5-0.2" style="left:300px;top:250px;padding:20px 30px;border-radius:20px;background:rgba(242,192,99,.1);border:2px solid rgba(242,192,99,.55)">
      <div style="font-size:26px;color:#e7d6b0">含分红，2004 年以来</div><div class="k900" style="font-size:56px">年化约 <span class="gg">8.4%</span></div><div class="mute" style="font-size:20px">数据截至 2026 年 6 月</div></div>

    <div id="a-vs" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:110px;font-size:46px">从 2007 年最高点开始，买 10 年</div>
      <div class="ctr mute" style="top:180px;font-size:24px">沪深 300 · 2007-10-16 至 2017-10-16</div>
      <div class="abs" style="left:560px;top:560px;width:800px;height:3px;background:rgba(255,255,255,.4)"></div>
      <div id="a-bar1" class="abs" style="left:640px;top:563px;width:220px;height:0;border-radius:0 0 14px 14px;background:linear-gradient(180deg,#b8322a,#ff5a4e)"></div>
      <div id="a-bar2" class="abs" style="left:1060px;width:220px;height:0;border-radius:14px 14px 0 0;background:linear-gradient(0deg,#c48a2c,#ffe08f);box-shadow:0 0 40px rgba(242,192,99,.5)"></div>
      <div id="a-v1" class="abs k900 red num" style="left:600px;width:300px;text-align:center;font-size:64px;opacity:0">-33%</div>
      <div id="a-v2" class="abs k900 gg num" style="left:1020px;width:300px;text-align:center;font-size:64px;opacity:0">+35%</div>
      <div class="abs k700" style="left:600px;top:500px;width:300px;text-align:center;font-size:30px">一次性买入</div>
      <div class="abs k700 gold" style="left:1020px;top:590px;width:300px;text-align:center;font-size:30px">每月定投</div>
    </div>

    <svg id="a-dca" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <path id="a-dca-line" fill="none" stroke="#e9e4da" stroke-width="5"/>
      <g id="a-dca-st"></g>
      <line id="a-avgP" x1="${G.x0}" x2="${G.x1}" stroke="#e9e4da" stroke-width="3" stroke-dasharray="12 8" opacity="0"/>
      <line id="a-avgC" x1="${G.x0}" x2="${G.x1}" stroke="#f2c063" stroke-width="4" stroke-dasharray="12 8" opacity="0"/>
    </svg>
    <div id="a-dca-t" class="ctr k900" style="top:90px;font-size:46px;opacity:0">每月都投 <span class="num">¥1,000</span>：价格低时，买到的份额更多</div>
    <div id="a-avgP-l" class="a-lab" style="left:1560px;opacity:0;color:#e9e4da;font-size:30px">平均价格</div>
    <div id="a-avgC-l" class="a-lab gold" style="left:1560px;opacity:0;font-size:30px">你的平均成本</div>

    <svg id="a-sp" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <rect id="a-sp-band" fill="rgba(255,255,255,.12)" opacity="0"/>
      <g id="a-sp-grid"></g>
      <path id="a-sp-line" fill="none" stroke="#7fb4ff" stroke-width="5" style="filter:drop-shadow(0 0 8px rgba(127,180,255,.6))"/>
    </svg>
    <div class="a abs" data-in="a7" data-fx="fade" data-out="a8-0.2" style="left:240px;top:90px"><span class="k900" style="font-size:48px">美国 · 标普 500</span><span class="mute" style="font-size:24px;margin-left:16px">含分红 · 对数刻度 · 示意</span></div>
    <div class="a abs k900" data-in="a7@0.3" data-fx="pop" data-out="a8-0.2" style="left:300px;top:220px;font-size:44px">长期年化约 <span style="color:#7fb4ff">10%</span></div>
    <div class="a abs" data-in="a7@0.62" data-fx="pop" data-out="a8-0.2" id="a-sp-l" style="top:200px;text-align:center;width:340px"><div class="k900" style="font-size:40px">失去的十年</div><div class="k700 red" style="font-size:30px">2000–2009 年化 -0.95%</div></div>

    <div class="a ctr k900" data-in="a8" data-fx="blur" style="top:330px;font-size:70px">长期能涨 ≠ 每一段都涨</div>
    <div class="a ctr" data-in="a8@0.55" data-fx="pop" style="top:500px"><span class="badge" style="font-size:44px;padding:18px 44px;background:rgba(242,192,99,.12);border:2px solid rgba(242,192,99,.6)">前提：<b class="gold">长期不用的闲钱</b></span></div>
  </section>`,
  setup(ctx) {
    const { $ } = ctx;
    $('a-dm').innerHTML = DANMU.map((d, i) => `<div class="a-dm" id="a-dm${i}" style="top:${120 + (i % 6) * 120}px">${d}</div>`).join('');
    // 上证网格
    const shY = v => gy(v, 0, 7000), shX = x => gx(x, 2005, 2027);
    let g = '';
    for (let v = 0; v <= 6000; v += 2000) g += `<line x1="${G.x0}" x2="${G.x1}" y1="${shY(v)}" y2="${shY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="${G.x0 - 20}" y="${shY(v) + 8}" font-size="22" fill="#6f6b64" text-anchor="end">${v}</text>`;
    for (let y = 2006; y <= 2026; y += 4) g += `<text x="${shX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-sh-grid').innerHTML = g;
    const pk = shY(6124); $('a-sh-peak').setAttribute('y1', pk); $('a-sh-peak').setAttribute('y2', pk);
    $('a-sh-l1').style.left = (shX(2007.79) - 40) + 'px'; $('a-sh-l1').style.top = (pk - 56) + 'px';
    $('a-sh-l2').style.left = (shX(2026.75) - 300) + 'px'; $('a-sh-l2').style.top = (shY(3842) + 60) + 'px';
    // 沪深 300 网格
    const hsY = v => gy(v, 0, 9000), hsX = x => gx(x, 2005, 2027);
    g = '';
    for (let v = 0; v <= 8000; v += 2000) g += `<line x1="${G.x0}" x2="${G.x1}" y1="${hsY(v)}" y2="${hsY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="${G.x0 - 20}" y="${hsY(v) + 8}" font-size="22" fill="#6f6b64" text-anchor="end">${v}</text>`;
    for (let y = 2006; y <= 2026; y += 4) g += `<text x="${hsX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    $('a-hs-grid').innerHTML = g;
    // 标普网格（对数）
    const spY = v => gy(Math.log10(v), -.5, 4), spX = x => gx(x, 1926, 2026);
    g = '';
    for (let y = 1930; y <= 2020; y += 10) g += `<text x="${spX(y)}" y="${G.y0 + 40}" font-size="22" fill="#6f6b64" text-anchor="middle">${y}</text>`;
    g += `<line x1="${G.x0}" x2="${G.x1}" y1="${G.y0}" y2="${G.y0}" stroke="rgba(255,255,255,.25)"/>`;
    $('a-sp-grid').innerHTML = g;
    const b = $('a-sp-band'); b.setAttribute('x', spX(2000)); b.setAttribute('width', spX(2010) - spX(2000)); b.setAttribute('y', G.y1 - 20); b.setAttribute('height', G.y0 - G.y1 + 20);
    $('a-sp-l').style.left = (spX(2005) - 170) + 'px';
    // 定投份额柱
    let st = '';
    for (let m = 0; m <= 120; m += 3) st += `<rect id="a-st${m}" fill="#f2c063" rx="2" opacity="0"/>`;
    $('a-dca-st').innerHTML = st;
    Object.assign(this, { shY, shX, hsY, hsX, spY, spX });
  },
  events(ctx) {
    const { T } = ctx;
    ctx.ev(T('a1') + .2, 'whoosh');
    ctx.ev(T('a2') - .1, 'whoosh');
    ctx.ev(T('a3') - .1, 'whoosh');
    for (let i = 0; i < 6; i++) ctx.ev(T('a3@0.4') + i * .35, 'coins', .5);
    ctx.ev(T('a4') - .1, 'whoosh');
    ctx.ev(T('a5') - .1, 'whoosh');
    ctx.ev(T('a5@0.45'), 'hit', 12); ctx.ev(T('a5@0.85'), 'hit', 16);
    ctx.ev(T('a6') - .1, 'whoosh'); ctx.ev(T('a6@0.2'), 'fill', 1);
    ctx.ev(T('a7') - .1, 'whoosh');
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, win, back } = Core;
    if (t < T('a1') - 1 || t > T('s1')) return;
    const W = 1920;
    // ① 弹幕
    const dmA = win(t, T('a1') - .2, T('a2') - .2, .3);
    $('a-dm').style.opacity = dmA;
    DANMU.forEach((d, i) => { const el = $('a-dm' + i), t0 = T('a1') - .3 + i * .45; el.style.left = (W + 40 - (t - t0) * 520) + 'px'; el.style.opacity = t > t0 ? (i % 3 === 0 ? 1 : .75) : 0; });
    // ② 上证
    const shA = win(t, T('a2') - .2, T('a3') - .1, .35);
    $('a-sh').style.opacity = shA;
    if (shA > 0) {
      const f = eio((t - T('a2@0.18')) / (T('a2@0.62') - T('a2@0.18')));
      $('a-sh-line').setAttribute('d', path(shS, this.shX, this.shY, f));
      const last = shS[Math.max(1, Math.round(shS.length * Math.min(1, f))) - 1];
      $('a-sh-dot').setAttribute('cx', this.shX(last[0])); $('a-sh-dot').setAttribute('cy', this.shY(last[1])); $('a-sh-dot').setAttribute('opacity', f > 0 ? 1 : 0);
      $('a-sh-peak').setAttribute('opacity', clamp((t - T('a2@0.75')) / .4));
    }
    // ③ 房价 / 房租
    const hoA = win(t, T('a3') - .2, T('a4') + .1, .35);
    $('a-house').style.opacity = hoA; $('a-house-lab1').style.opacity = hoA * clamp((t - T('a3@0.1')) / .3); $('a-house-lab2').style.opacity = hoA * clamp((t - T('a3@0.5')) / .3);
    // ④ 沪深 300
    const hsA = win(t, T('a4') - .1, T('a5') - .1, .35);
    $('a-hs').style.opacity = hsA;
    if (hsA > 0) {
      const f1 = eio((t - T('a4@0.05')) / 1.6), f2 = eio((t - T('a4@0.4')) / 1.8);
      $('a-hs-p').setAttribute('d', path(hsS, this.hsX, this.hsY, f1));
      $('a-hs-tr').setAttribute('d', path(hsTR, this.hsX, this.hsY, f2));
      const n = Math.max(2, Math.round(hsTR.length * Math.min(1, f2)));
      if (f2 > 0) {
        const top = hsTR.slice(0, n).map((p, i) => (i ? 'L' : 'M') + this.hsX(p[0]).toFixed(1) + ' ' + this.hsY(p[1]).toFixed(1)).join('');
        const bot = hsS.slice(0, n).reverse().map(p => 'L' + this.hsX(p[0]).toFixed(1) + ' ' + this.hsY(p[1]).toFixed(1)).join('');
        $('a-hs-gap').setAttribute('d', top + bot + 'Z');
      } else $('a-hs-gap').setAttribute('d', '');
    }
    // ⑤ 一次性 vs 定投
    const vsA = win(t, T('a5') - .1, T('a6') - .1, .35);
    $('a-vs').style.opacity = vsA;
    const h1 = 233 * eo((t - T('a5@0.42')) / .6), h2 = 247 * eo((t - T('a5@0.82')) / .6);
    $('a-bar1').style.height = h1 + 'px'; $('a-bar2').style.height = h2 + 'px'; $('a-bar2').style.top = (560 - h2) + 'px';
    $('a-v1').style.top = (563 + h1 + 10) + 'px'; $('a-v1').style.opacity = clamp((t - T('a5@0.45')) / .3);
    $('a-v2').style.top = (560 - h2 - 86) + 'px'; $('a-v2').style.opacity = clamp((t - T('a5@0.85')) / .3);
    // ⑥ 定投机制
    const dA = win(t, T('a6') - .1, T('a7') - .1, .35);
    $('a-dca').style.opacity = dA; $('a-dca-t').style.opacity = dA;
    const kl = clamp((t - T('a6@0.7')) / .5) * dA; $('a-avgP-l').style.opacity = kl; $('a-avgC-l').style.opacity = kl;
    if (dA > 0) {
      const dx = x => gx(x, 0, 10), dy = v => gy(v, 20, 110) - 110;
      const f = eio((t - T('a6')) / 2.2);
      $('a-dca-line').setAttribute('d', path(dcaS, dx, dy, f));
      let inv = 0, sh = 0, sumP = 0, cnt = 0;
      for (let m = 0; m <= 120; m += 3) {
        const p = dcaS[Math.min(dcaS.length - 1, m)][1], show = m / 120 <= f;
        const el = $('a-st' + m), hh = 2200 / p;
        el.setAttribute('x', dx(m / 12) - 8); el.setAttribute('width', 16);
        el.setAttribute('y', G.y0 + 30 - hh); el.setAttribute('height', hh); el.setAttribute('opacity', show ? .9 : 0);
        if (show) { inv += 1; sh += 1 / p; sumP += p; cnt++; }
      }
      const k = clamp((t - T('a6@0.7')) / .5);
      if (cnt) {
        const avgP = sumP / cnt, avgC = inv / sh;
        ['avgP', 'avgC'].forEach((id, i) => { const y = dy(i ? avgC : avgP); const el = $('a-' + id); el.setAttribute('y1', y); el.setAttribute('y2', y); el.setAttribute('opacity', k); const l = $('a-' + id + '-l'); l.style.top = (y + (i ? 10 : -44)) + 'px'; });
      }
    }
    // ⑦ 标普 500
    const sA = win(t, T('a7') - .1, T('a8') - .1, .35);
    $('a-sp').style.opacity = sA;
    if (sA > 0) {
      const f = eio((t - T('a7@0.05')) / 2.4);
      $('a-sp-line').setAttribute('d', path(spS, this.spX, this.spY, f));
      $('a-sp-band').setAttribute('opacity', clamp((t - T('a7@0.6')) / .4));
    }
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T('a1') - .5, T('s1') - .4);
    ctx.glow(960, 520, 950, 'rgba(242,175,70,A)', .09 * w);
    ctx.glow(960, 520, 950, 'rgba(90,140,255,A)', .1 * Core.win(t, T('a7'), T('a8')));
  },
  fx(t, ctx) {
    // 房租金币：从房子里掉出来，堆在右下
    const { T, Core } = ctx; const a = T('a3@0.35'), b = T('a4') + .1;
    if (t < a - .1 || t > b + .3) return;
    const f = ctx.fxc, k = Core.win(t, a - .1, b + .3, .3), r = Core.rng(77);
    for (let i = 0; i < 26; i++) {
      const t0 = a + i * .09, tau = t - t0; if (tau < 0) continue;
      const x0 = 1080 + r() * 40, x1 = 1210 + (i % 6) * 34, y1 = 760 - Math.floor(i / 6) * 16;
      const u = Math.min(1, tau / .5), x = x0 + (x1 - x0) * u, y = 600 + (y1 - 600) * u * u;
      f.globalAlpha = k; f.fillStyle = '#f2c063'; f.beginPath(); f.ellipse(x, y, 16, 7, 0, 0, 7); f.fill();
      f.strokeStyle = '#b8862d'; f.lineWidth = 2; f.stroke();
    }
    f.globalAlpha = 1;
  },
});
})();
