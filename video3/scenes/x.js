/* 四、小林的雪球：①定投指数基金=每月买一篮子公司 ②账户越大长得越多（账户×6%）③第 13 年第一次"长的>投的"
 *   ④偏偏大跌，换你卖不卖 ⑤4682 万人的统计：三组同一指标对比 ⑥闲钱不用卖，跌后回到趋势线 → 139 万 */
(() => {
const L = { buy: 'x1', basket: 'x2', grow: 'x3', cross: 'x4', crash: 'x5', ask: 'x6', stat1: 'x7', stat2: 'x8', hold: 'x9', end: 'x10', next: 'a1' };
const FV = m => 3000 * ((Math.pow(1.005, m) - 1) / 0.005);
const GROW = y => FV(12 * y) - FV(12 * (y - 1)) - 36000;
const BX = k => 300 + (k - 1) * 96, BASE = 830, BS = 420 / 60000;
const CX = y => 260 + 70 * y, CY = v => 880 - 640 * v / 1500000;
const C0 = 13.0, C1 = 13.5, R1 = 15.6, DROP = .35;
function bal(y) {
  if (y <= C0) return FV(12 * y);
  const v0 = FV(12 * C0), low = v0 * (1 - DROP);
  if (y <= C1) { const k = (y - C0) / (C1 - C0); return v0 - (v0 - low) * (1 - Math.pow(1 - k, 2)); }
  if (y <= R1) { const k = (y - C1) / (R1 - C1), e = k * k * (3 - 2 * k); return low + (FV(12 * y) - low) * e; }
  return FV(12 * y);
}
const LOSS = Math.round((FV(12 * C0) * DROP) / 1e4);
let ord = [];

Kit.add({
  key: 'x',
  anchors: L,
  keywords: ['指数基金', '定投', '一大篮子', '第十三年', '大跌', '卖不卖', '三个月', '十年', '闲钱', '一百三十九万'],
  text: '每月定投指数基金一大篮子公司各买一小份年账户今年长自己长的存进去的假设年化示意卖不卖不到个月超过盈利的平均收益数据截至闲钱不用卖平均趋势线已含这次大跌本金长出来的万第',
  css: `
  .x-p{position:absolute;width:36px;height:48px}
  .x-p svg{width:100%;height:100%;overflow:visible}
  .x-btn{display:inline-block;width:280px;padding:24px 0;margin:0 30px;border-radius:20px;font:900 60px var(--sans);letter-spacing:.3em;text-align:center}
  .x-bar{position:absolute;height:22px;border-radius:11px;background:rgba(255,255,255,.08);overflow:hidden;width:300px}
  .x-bar i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:11px}
  `,
  html: `
  <section class="scene" id="xScene" data-s="${L.buy}-0.6" data-e="${L.next}-0.45">
    <!-- ① 定投 = 每月买一篮子公司 -->
    <div id="x-intro" class="abs" style="inset:0">
      <div class="a ctr k900" data-in="${L.buy}" data-fx="up" style="top:110px;font-size:54px"><span class="gold">小林</span>：每月 <span class="num">¥3,000</span>，买指数基金</div>
      <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
        <g id="x-basket" opacity="0" transform="translate(960 640)">
          <path d="M-260 -40 L260 -40 L210 220 L-210 220 Z" fill="rgba(242,192,99,.08)" stroke="#f2c063" stroke-width="6" stroke-linejoin="round"/>
          <path d="M-200 -40 Q0 -230 200 -40" fill="none" stroke="#f2c063" stroke-width="6"/>
          <g id="x-cos"></g>
        </g>
        <g id="x-coin" opacity="0"><circle r="70" fill="url(#x-cg)" stroke="#fff3c4" stroke-width="4"/><text y="14" text-anchor="middle" font-size="40" font-weight="900" fill="#6b4a0d">¥3,000</text></g>
        <defs><radialGradient id="x-cg" cx=".35" cy=".3"><stop offset="0" stop-color="#fff3c4"/><stop offset=".6" stop-color="#f2c063"/><stop offset="1" stop-color="#a8751f"/></radialGradient></defs>
      </svg>
      <div class="a abs k900" data-in="${L.buy}@0.75" data-fx="pop" style="left:1290px;top:520px;font-size:44px">这叫<span class="gold">定投</span></div>
      <div class="a abs" data-in="${L.basket}@0.25" data-fx="pop" style="left:300px;top:520px;width:380px;text-align:right"><div class="k900" style="font-size:44px">指数基金</div><div style="font-size:28px;color:#cfc6b6;margin-top:8px">= 一大篮子公司<br>各买一小份</div></div>
      <div class="a ctr k700" data-in="${L.basket}@0.8" data-fx="up" style="top:900px;font-size:34px"><span class="num">¥3,000 × 12</span> = 一年投 <span class="gold num">3.6 万</span></div>
    </div>

    <!-- ② ③ 每年：投进去的 vs 自己长出来的 -->
    <svg id="x-bars" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0"></svg>
    <div id="x-eq" class="abs" style="left:250px;top:150px;opacity:0;padding:22px 32px;border-radius:22px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12)">
      <div class="tag" style="font-size:22px;letter-spacing:.2em">第 <span id="x-eq-y" class="num">1</span> 年</div>
      <div class="k900" style="font-size:44px;margin-top:6px;white-space:nowrap">账户 <span class="num" id="x-eq-a">3.7</span> 万 × 6% ≈ 今年长 <span class="gold num" id="x-eq-g">0.1</span> 万</div>
    </div>
    <div id="x-leg" class="abs" style="left:1450px;top:160px;font-size:26px;line-height:1.9;opacity:0">
      <div><span style="display:inline-block;width:24px;height:24px;background:#6b7385;border-radius:5px;vertical-align:-4px"></span> 当年投进去的 3.6 万</div>
      <div><span style="display:inline-block;width:24px;height:24px;background:#f2c063;border-radius:5px;vertical-align:-4px"></span> 当年自己长出来的</div>
      <div class="mute" style="font-size:20px">假设年化 6%，按月复利测算</div></div>
    <div id="x-cross" class="abs" style="left:${BX(13) - 620}px;top:300px;width:600px;text-align:right;opacity:0">
      <div class="k900" style="font-size:42px">第 13 年</div>
      <div class="k700" style="font-size:30px">自己长的 <span class="gold num">${(GROW(13) / 1e4).toFixed(1)} 万</span> &gt; 投进去的 <span class="num">3.6 万</span></div></div>

    <!-- ④ ⑥ 账户曲线 -->
    <svg id="x-curve" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <defs><linearGradient id="x-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c063" stop-opacity=".35"/><stop offset="1" stop-color="#f2c063" stop-opacity="0"/></linearGradient>
      <filter id="x-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g id="x-cgrid"></g>
      <path id="x-trend" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-dasharray="10 10" opacity="0"/>
      <path id="x-area" fill="url(#x-cf)"/>
      <path id="x-line" fill="none" stroke="#f2c063" stroke-width="7" stroke-linecap="round" filter="url(#x-glow)"/>
      <path id="x-crash" fill="none" stroke="#ff5a4e" stroke-width="8" stroke-linecap="round" filter="url(#x-glow)"/>
      <g id="x-rocket"></g>
    </svg>
    <div id="x-num" class="abs" style="right:160px;top:80px;text-align:right;opacity:0"><span class="k900 gg num" id="x-val" style="font-size:104px;line-height:1">0</span><span class="k900 gold" style="font-size:46px"> 万</span><div class="tag" id="x-yr" style="margin-top:6px"></div></div>
    <div class="a abs k900 red num" data-in="${L.crash}@0.55" data-fx="slam" data-shake="26" data-out="${L.stat1}-0.3" style="left:${CX(13.5) + 40}px;top:${CY(470000) - 40}px;font-size:84px">-${LOSS} 万</div>
    <div class="a abs" data-in="${L.crash}@0.7" data-fx="fade" data-out="${L.stat1}-0.3" style="left:${CX(13.5) + 44}px;top:${CY(470000) + 60}px;font-size:28px;color:#ff9c94">几个月，跌掉约 35%</div>
    <div class="a ctr" data-in="${L.ask}" data-fx="pop" data-out="${L.stat1}-0.2" style="top:300px"><span class="x-btn" style="background:#ff3b30;color:#fff;box-shadow:0 0 40px rgba(255,59,48,.7)">卖</span><span class="x-btn" style="border:4px solid rgba(255,255,255,.6);color:#fff">不卖</span></div>
    <div id="x-trend-lab" class="abs" style="left:${CX(17.2)}px;top:${CY(FV(12 * 17.2)) + 30}px;font-size:24px;color:#bdb6aa;opacity:0">平均 6% 的趋势线</div>
    <div id="x-calm" class="abs" style="left:300px;top:200px;opacity:0;padding:20px 30px;border-radius:20px;background:rgba(242,192,99,.1);border:2px solid rgba(242,192,99,.55)">
      <div class="k900 gold" style="font-size:40px">闲钱 · 不用卖</div><div style="font-size:26px;color:#e7d6b0;margin-top:6px">没有停不下来的水管，每月照样投</div></div>

    <!-- ⑤ 100 个人 -->
    <div id="x-crowd" class="abs" style="inset:0;opacity:0"></div>
    <div id="x-g1" class="abs" style="left:200px;top:690px;width:420px;opacity:0">
      <div class="k900 red" style="font-size:36px">拿着不到 3 个月 · 46%</div>
      <div style="font-size:24px;color:#cfc6b6;margin:8px 0 12px">平均收益 -1.47%</div>
      <div class="x-bar"><i id="x-b1" style="background:#ff5a4e"></i></div><div class="k700" style="font-size:26px;margin-top:8px">盈利的：<span class="num" id="x-b1n">0</span>%</div></div>
    <div id="x-g2" class="abs" style="left:770px;top:690px;width:380px;text-align:center;opacity:0"><div class="k700" style="font-size:30px;color:#bdb6aa">3 个月～10 年 · 52%</div></div>
    <div id="x-g3" class="abs" style="left:1330px;top:690px;width:420px;opacity:0">
      <div class="k900 gold" style="font-size:36px">拿满 10 年 · 不到 2%</div>
      <div style="font-size:24px;color:#cfc6b6;margin:8px 0 12px">平均收益 +117%</div>
      <div class="x-bar"><i id="x-b3" style="background:#f2c063"></i></div><div class="k700" style="font-size:26px;margin-top:8px">盈利的：<span class="num gold" id="x-b3n">0</span>%</div></div>
    <div id="x-src" class="ctr" style="top:120px;font-size:24px;color:#8e8a83;opacity:0">景顺长城 / 富国 / 交银施罗德 × 中国证券报 · 4682 万主动权益基金客户 · 数据截至 2021-03-31 · 历史统计不代表未来</div>

    <!-- 结果 -->
    <div class="a abs k900 gg num" data-in="${L.end}@0.72" data-fx="slam" data-shake="36" style="left:300px;top:190px;font-size:190px;line-height:1;transform-origin:0 50%">139 万</div>
    <div class="a abs k700" data-in="${L.end}.e" data-fx="up" style="left:310px;top:410px;font-size:36px">本金 <span class="num">72</span> 万 ＋ 自己长出来的 <span class="gold num">67</span> 万</div>
    <div class="a abs" data-in="${L.end}.e" data-fx="fade" style="left:312px;top:470px;font-size:22px;color:#a39e95">假设：20 年平均年化 6%（已含这次大跌）· 曲线为示意</div>
  </section>`,
  setup(ctx) {
    const { $, Core } = ctx;
    // 篮子里的小公司
    const r = Core.rng(300); let co = '';
    for (let i = 0; i < 300; i++) { const x = -190 + (i % 25) * 15.8 + (r() - .5) * 4, y = 200 - Math.floor(i / 25) * 17 + (r() - .5) * 4; co += `<rect id="x-co${i}" x="${x}" y="${y}" width="11" height="11" rx="2" fill="${['#e9dcc0', '#cfc6b6', '#f2c063', '#9fb3d9'][i % 4]}" opacity="0"/>`; }
    $('x-cos').innerHTML = co;
    // 柱状图
    let g = `<line x1="${BX(1) - 40}" x2="${BX(13) + 90}" y1="${BASE}" y2="${BASE}" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
      <line id="x-ref" x1="${BX(1) - 40}" x2="${BX(13) + 90}" y1="${BASE - 36000 * BS}" y2="${BASE - 36000 * BS}" stroke="rgba(255,255,255,.35)" stroke-dasharray="10 8" stroke-width="2" opacity="0"/>`;
    for (let k = 1; k <= 13; k++) g += `<g id="x-b${k}" opacity="0"><rect id="x-bg${k}" x="${BX(k)}" width="34" y="${BASE}" height="0" rx="5" fill="#6b7385"/><rect id="x-bo${k}" x="${BX(k) + 38}" width="34" y="${BASE}" height="0" rx="5" fill="#f2c063" style="filter:drop-shadow(0 0 10px rgba(242,192,99,.7))"/><text x="${BX(k) + 36}" y="${BASE + 36}" text-anchor="middle" font-size="22" fill="#8e8a83">${k}</text></g>`;
    g += `<text x="${BX(1) - 40}" y="${BASE + 72}" font-size="22" fill="#6f6b64">第 N 年</text>`;
    $('x-bars').innerHTML = g;
    // 曲线网格
    let c = '';
    for (let v = 0; v <= 1500000; v += 500000) c += `<line x1="260" x2="1660" y1="${CY(v)}" y2="${CY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="230" y="${CY(v) + 9}" font-size="24" fill="#6f6b64" text-anchor="end">${v / 1e4}万</text>`;
    for (let y = 0; y <= 20; y += 5) c += `<text x="${CX(y)}" y="930" font-size="24" fill="#6f6b64" text-anchor="middle">第${y}年</text>`;
    $('x-cgrid').innerHTML = c;
    let td = ''; for (let y = 0; y <= 20.001; y += .1) td += (y ? 'L' : 'M') + CX(y).toFixed(1) + ' ' + CY(FV(12 * y)).toFixed(1);
    $('x-trend').setAttribute('d', td);
    $('x-rocket').innerHTML = Core.ROCKET;
    // 100 人（打乱顺序决定谁属于哪组）
    const rr = Core.rng(2021); ord = [...Array(100).keys()];
    for (let i = 99; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
    let h = '';
    for (let i = 0; i < 100; i++) h += `<div class="x-p" id="x-p${i}"><svg viewBox="0 0 40 52"><circle cx="20" cy="12" r="10" fill="currentColor"/><path d="M2 52 C2 32 10 25 20 25 C30 25 38 32 38 52 Z" fill="currentColor"/></svg></div>`;
    $('x-crowd').innerHTML = h;
  },
  events(ctx) {
    const { T, P, Core } = ctx;
    ctx.ev(T(L.buy + '@0.3'), 'coins', .7);
    ctx.ev(T(L.basket + '@0.1'), 'fill', 1);
    for (let k = 1; k <= 13; k++) ctx.ev(barT(T, k), 'tick', .5);
    ctx.ev(T(L.cross + '@0.78'), 'hit', 14); ctx.flash(T(L.cross + '@0.78'), .25, .2);
    P.burst({ t0: T(L.cross + '@0.78'), x: BX(13) + 55, y: BASE - GROW(13) * BS, n: 60, spd: [200, 700], life: [.6, 1.2], size: [2, 5], colors: Core.GOLD, seed: 131 });
    ctx.ev(T(L.crash + '@0.4'), 'hit', 26); ctx.ev(T(L.crash + '@0.45'), 'alarm', 1.6);
    ctx.ev(T(L.ask) - .2, 'heartbeat'); ctx.ev(T(L.ask) + .7, 'heartbeat', .8);
    ctx.ev(T(L.stat1 + '@0.35'), 'whoosh');
    ctx.ev(T(L.stat2 + '@0.5'), 'chime', .6);
    ctx.ev(T(L.hold + '@0.1'), 'chime', .5);
    ctx.ev(T(L.hold + '@0.55'), 'launch');
    ctx.ring(T(L.end + '@0.72') + .2, 560, 280, 800); ctx.flash(T(L.end + '@0.72') + .2, .55, .25);
    P.burst({ t0: T(L.end + '@0.72') + .2, x: 560, y: 280, n: 170, spd: [400, 1500], g: 500, life: [.9, 2], size: [2, 7], colors: Core.GOLD, seed: 141 });
    ctx.rumble(t => { const a = T(L.hold + '@0.55'), b = T(L.end + '@0.72'); return t > a && t < b ? 5 * (t - a) / (b - a) : 0; });
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, ei, eio, back, win } = Core;
    if (t < T(L.buy) - 1 || t > T(L.next)) return;
    // ① 篮子
    const p1 = 1 - clamp((t - (T(L.grow) - .4)) / .4);
    $('x-intro').style.opacity = p1;
    const cdrop = clamp((t - T(L.buy + '@0.25')) / .7);
    $('x-coin').setAttribute('opacity', cdrop > 0 && cdrop < 1 ? 1 : 0);
    $('x-coin').setAttribute('transform', `translate(960 ${200 + 440 * ei(cdrop)}) scale(${1 - .6 * cdrop})`);
    $('x-basket').setAttribute('opacity', eo((t - T(L.buy)) / .5));
    for (let i = 0; i < 300; i++) $('x-co' + i).setAttribute('opacity', clamp((t - T(L.basket + '@0.05') - i * .006) / .15));
    // ② ③ 柱状图 + 方程
    const barsOn = clamp((t - (T(L.grow) - .3)) / .4) * (1 - clamp((t - (T(L.crash) - .4)) / .4));
    $('x-bars').style.opacity = barsOn; $('x-eq').style.opacity = barsOn; $('x-leg').style.opacity = barsOn;
    let curY = 0;
    for (let k = 1; k <= 13; k++) {
      const k0 = barT(T, k), p = eo((t - k0) / .45);
      if (t > k0) curY = k;
      $('x-b' + k).setAttribute('opacity', clamp((t - k0) / .15));
      const hg = 36000 * BS * p, ho = GROW(k) * BS * eo((t - k0 - .25) / .5);
      $('x-bg' + k).setAttribute('y', BASE - hg); $('x-bg' + k).setAttribute('height', hg);
      $('x-bo' + k).setAttribute('y', BASE - ho); $('x-bo' + k).setAttribute('height', ho);
    }
    const yy = Math.max(1, curY);
    $('x-eq-y').textContent = yy;
    $('x-eq-a').textContent = (FV(12 * (yy - 1)) / 1e4).toFixed(1);
    $('x-eq-g').textContent = (GROW(yy) / 1e4).toFixed(1);
    $('x-ref').setAttribute('opacity', clamp((t - T(L.cross + '@0.6')) / .4) * .9);
    $('x-cross').style.opacity = clamp((t - T(L.cross + '@0.78')) / .3) * barsOn;
    $('x-bo13').style.filter = t > T(L.cross + '@0.78') ? `drop-shadow(0 0 ${14 + 10 * Math.sin(t * 8)}px rgba(255,220,130,1))` : 'drop-shadow(0 0 10px rgba(242,192,99,.7))';
    // ④ ⑥ 曲线
    const curveIn = clamp((t - (T(L.crash) - .3)) / .4), crowdIn = win(t, T(L.stat1) - .2, T(L.hold) - .2, .4);
    const curveOp = curveIn * (1 - .94 * crowdIn);
    $('x-curve').style.opacity = curveOp; $('x-num').style.opacity = curveOp * (1 - clamp((t - T(L.end + '@0.6')) / .3));
    let Y;
    if (t < T(L.crash + '@0.4')) Y = C0 * eo((t - (T(L.crash) - .3)) / 1.0);
    else if (t < T(L.hold + '@0.55')) Y = C0 + (C1 - C0) * eo((t - T(L.crash + '@0.4')) / .9);
    else Y = C1 + (20 - C1) * eio((t - T(L.hold + '@0.55')) / (T(L.end + '@0.72') - T(L.hold + '@0.55')));
    const pts = []; for (let y = 0; y <= Y + 1e-6; y += .05) pts.push([CX(y), CY(bal(y))]); pts.push([CX(Y), CY(bal(Y))]);
    const toD = a => a.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const pre = pts.filter(p => p[0] <= CX(C0) + .1), mid = pts.filter(p => p[0] >= CX(C0) - .1 && p[0] <= CX(C1) + .1), post = pts.filter(p => p[0] >= CX(C1) - .1);
    $('x-line').setAttribute('d', toD(pre) + (post.length > 1 ? toD(post) : ''));
    $('x-crash').setAttribute('d', mid.length > 1 ? toD(mid) : '');
    $('x-area').setAttribute('d', pts.length > 1 ? toD(pts) + `L${CX(Y)} ${CY(0)}L${CX(0)} ${CY(0)}Z` : '');
    const tr = clamp((t - T(L.hold + '@0.4')) / .5);
    $('x-trend').setAttribute('opacity', tr * .9); $('x-trend-lab').style.opacity = tr * curveOp * (1 - clamp((t - T(L.end + '@0.6')) / .3));
    $('x-val').textContent = Math.round(bal(Y) / 1e4); $('x-yr').textContent = `第 ${Math.min(20, Math.floor(Y + 1e-6))} 年`;
    $('x-val').style.filter = Y > C0 && Y < R1 && t < T(L.hold + '@0.55') ? 'hue-rotate(-40deg) saturate(2)' : '';
    $('x-calm').style.opacity = win(t, T(L.hold) + .1, T(L.end + '@0.6'), .35) * curveOp;
    const rk = $('x-rocket'), rp = rocketAt(T, t);
    rk.setAttribute('opacity', t > T(L.hold + '@0.55') && t < T(L.end + '@0.72') + .3 ? 1 : 0);
    if (rp) rk.setAttribute('transform', `translate(${rp[0]},${rp[1]}) rotate(${rp[2] * 180 / Math.PI})`);
    // ⑤ 三组人
    $('x-crowd').style.opacity = crowdIn;
    $('x-src').style.opacity = crowdIn;
    const g1 = T(L.stat1 + '@0.4'), g3 = T(L.stat2 + '@0.2');
    let c1 = 0, c2 = 0, c3 = 0;
    for (let i = 0; i < 100; i++) {
      const rank = ord.indexOf(i), el = $('x-p' + i);
      const gx = 640 + (i % 10) * 64, gy = 230 + Math.floor(i / 10) * 44;     // 方阵
      let tx = gx, ty = gy, col = '#cfc6b6', op = 1;
      if (rank < 46) { const k = eio((t - g1 - (rank % 10) * .03) / .7); const j = c1++; tx = gx + (200 + (j % 8) * 44 - gx) * k; ty = gy + (330 + Math.floor(j / 8) * 52 - gy) * k; if (t > g1 - .2) col = '#ff5a4e'; op = 1 - .15 * k; }
      else if (rank < 98) { const k = eio((t - g3) / .7); const j = c2++; tx = gx + (780 + (j % 9) * 40 - gx) * k; ty = gy + (330 + Math.floor(j / 9) * 52 - gy) * k; op = 1 - .65 * clamp((t - g3) / .5); }
      else { const k = eio((t - g3) / .7); const j = c3++; tx = gx + (1460 + j * 70 - gx) * k; ty = gy + (520 - gy) * k; if (t > g3) { col = '#f2c063'; el.style.filter = 'drop-shadow(0 0 14px rgba(242,192,99,1))'; } }
      el.style.left = tx + 'px'; el.style.top = ty + 'px'; el.style.color = col; el.style.opacity = op;
      if (rank === 98 || rank === 99) el.style.transform = `scale(${1 + .5 * back(clamp((t - g3 - .3) / .5))})`;
    }
    $('x-g1').style.opacity = clamp((t - g1 - .5) / .4) * crowdIn;
    $('x-g2').style.opacity = clamp((t - g3 - .3) / .4) * crowdIn;
    $('x-g3').style.opacity = clamp((t - g3 - .5) / .4) * crowdIn;
    const b1 = 39.1 * eo((t - g1 - .9) / .9), b3 = 98.4 * eo((t - g3 - 1) / .9);
    $('x-b1').style.width = b1 + '%'; $('x-b1n').textContent = Math.round(b1);
    $('x-b3').style.width = b3 + '%'; $('x-b3n').textContent = Math.round(b3);
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const { win } = Core;
    ctx.glow(960, 520, 900, 'rgba(242,175,70,A)', .12 * win(t, T(L.buy) - .5, T(L.next) - .4) + .18 * win(t, T(L.hold + '@0.5'), T(L.next) - .4));
    ctx.glow(960, 540, 1100, 'rgba(255,40,30,A)', .2 * win(t, T(L.crash + '@0.4'), T(L.stat1) - .2, .3));
    Core.drawSpeedLines(ctx.bgc, SPEED, t, win(t, T(L.hold + '@0.55'), T(L.end + '@0.8'), .3), 2400, 1080);
    return { dust: .3 + .5 * win(t, T(L.end + '@0.72'), T(L.next), .4) };
  },
  fx(t, ctx) {
    const { T } = ctx; const a = T(L.hold + '@0.55'), b = T(L.end + '@0.72') + .3;
    if (t < a || t > b) return;
    const f = ctx.fxc; f.globalCompositeOperation = 'lighter';
    const r = ctx.Core.rng(Math.floor(t * 60));
    for (let i = 0; i < 70; i++) {
      const tt = t - i / 70 * .5; if (tt < a) break;
      const p = rocketAt(T, tt); if (!p) continue;
      const s = (1 - i / 70) * 18 + 2, j = (r() - .5) * 18 * (i / 70 + .2);
      f.fillStyle = i < 10 ? 'rgba(255,250,220,.9)' : i < 30 ? `rgba(255,190,90,${.7 - i / 70})` : `rgba(255,110,60,${.5 - i / 140})`;
      f.beginPath(); f.arc(p[0] - Math.cos(p[2]) * 60 + j, p[1] - Math.sin(p[2]) * 60 + j, s, 0, 7); f.fill();
    }
    f.globalCompositeOperation = 'source-over';
  },
});
const SPEED = Core.makeLines(60, 2400, 1400);
function barT(T, k) { return k <= 9 ? T(L.grow) - .2 + (k - 1) / 8 * (T(L.cross + '@0.35') - T(L.grow) + .2) : T(L.cross + '@0.4') + (k - 10) / 3 * (T(L.cross + '@0.72') - T(L.cross + '@0.4')); }
function rocketAt(T, t) {
  const a = T(L.hold + '@0.55'), b = T(L.end + '@0.72'); if (t < a) return null;
  const Y = C1 + (20 - C1) * Core.eio(Math.min(1, (t - a) / (b - a)));
  const y2 = Math.min(20, Y + .15), y1 = Math.max(C1, Y - .15);
  return [CX(Y), CY(bal(Y)), Math.atan2(CY(bal(y2)) - CY(bal(y1)), CX(y2) - CX(y1))];
}
})();
