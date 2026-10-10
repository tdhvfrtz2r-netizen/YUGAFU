/* 四、小林的雪球：①每年"存进去的"vs"自己长出来的" ②第 12 年暴跌 ③100 个人里多数人在下跌中离场 ④熬过去，后面越来越陡 */
(() => {
const FV = m => 3000 * ((Math.pow(1.005, m) - 1) / 0.005);            // 元
const GROW = y => FV(12 * y) - FV(12 * (y - 1)) - 36000;               // 第 y 年自己长出来的
// 柱状图
const BX = k => 330 + (k - 1) * 100, BASE = 820, BS = 450 / 60000;
// 余额曲线（示意：第 12.3 年大跌 35%，之后回升，第 20 年 = 假设年化 6% 的终值）
const CX = y => 260 + 70 * y, CY = v => 880 - 680 * v / 1500000;
const V20 = FV(240), C0 = 12.3, C1 = 12.85, DROP = .35;
function bal(y) {
  if (y <= C0) return FV(12 * y);
  const v0 = FV(12 * C0), low = v0 * (1 - DROP);
  if (y <= C1) { const k = (y - C0) / (C1 - C0); return v0 - (v0 - low) * (1 - Math.pow(1 - k, 2)); }
  const k = (y - C1) / (20 - C1); return low + (V20 - low) * (0.35 * k + 0.65 * k * k);
}
const PEOPLE = 100;
let ord = [], gold2 = [], ctxRef;

Kit.add({
  key: 'x',
  keywords: ['三万六', '收益', '第十二年', '大跌', '二十多万', '三个月', '十年', '一百三十九万'],
  text: '每年存进去的自己长出来的第年万利滚利卖出持有不足个月平均收益为负超过年其中盈利本金收益假设年化示意',
  css: `
  .x-p{position:absolute;width:40px;height:52px}
  .x-p svg{width:100%;height:100%;overflow:visible}
  #x-sell{position:absolute;padding:18px 54px;border-radius:16px;background:#ff3b30;color:#fff;font:900 46px var(--sans);letter-spacing:.3em;box-shadow:0 0 40px rgba(255,59,48,.8)}
  `,
  html: `
  <section class="scene" id="xScene" data-s="x1-0.6" data-e="a1-0.45">
    <div class="a ctr k900" data-in="x1" data-fx="up" data-out="x5-0.4" style="top:70px;font-size:52px"><span class="gold">小林</span>：每年存 <span class="num">3.6</span> 万</div>
    <svg id="x-bars" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible"></svg>
    <div class="a abs" data-in="x1@0.6" data-fx="fade" data-out="x4@0.7" style="left:1500px;top:250px;font-size:28px;line-height:2">
      <div><span style="display:inline-block;width:26px;height:26px;background:#6b7385;border-radius:5px;vertical-align:-4px"></span> 当年存进去的</div>
      <div><span style="display:inline-block;width:26px;height:26px;background:#f2c063;border-radius:5px;vertical-align:-4px"></span> 当年自己长出来的</div>
      <div class="mute" style="font-size:22px">假设年化 6%</div></div>
    <div id="x-callout" class="abs" style="left:${BX(3) - 40}px;top:${BASE - 380}px;opacity:0;font-size:30px;text-align:center;width:200px"><div class="k900 gold num" id="x-g3"></div><div class="mute" style="font-size:22px">第 3 年自己长的</div></div>
    <div class="a abs k900" data-in="x3" data-fx="pop" data-out="x4@0.2" style="left:${BX(6)}px;top:330px;font-size:48px"><span class="gg">收益</span> → 再产生 <span class="gg">收益</span></div>
    <div id="x-cross" class="abs" style="left:${BX(13) - 640}px;top:300px;width:600px;text-align:right;opacity:0">
      <div class="k900" style="font-size:40px">第 13 年</div>
      <div class="k700" style="font-size:30px">自己长的 <span class="gold num" id="x-g13"></span> &gt; 存进去的 <span class="num">3.6 万</span></div></div>

    <svg id="x-curve" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <defs><linearGradient id="x-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c063" stop-opacity=".35"/><stop offset="1" stop-color="#f2c063" stop-opacity="0"/></linearGradient>
      <filter id="x-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g id="x-cgrid"></g>
      <path id="x-area" fill="url(#x-cf)"/>
      <path id="x-line" fill="none" stroke="#f2c063" stroke-width="7" stroke-linecap="round" filter="url(#x-glow)"/>
      <path id="x-crash" fill="none" stroke="#ff5a4e" stroke-width="8" stroke-linecap="round" filter="url(#x-glow)"/>
      <g id="x-rocket"></g>
    </svg>
    <div id="x-num" class="abs" style="right:160px;top:70px;text-align:right;opacity:0"><span class="k900 gg num" id="x-val" style="font-size:110px;line-height:1">0</span><span class="k900 gold" style="font-size:48px"> 万</span><div class="tag" id="x-yr" style="margin-top:6px"></div></div>
    <div class="a abs k900 red num" data-in="x5@0.62" data-fx="slam" data-shake="26" data-out="x7-0.3" style="left:${CX(12.85) + 40}px;top:${CY(420000) - 30}px;font-size:84px">-22 万</div>
    <div class="a abs" data-in="x5@0.75" data-fx="fade" data-out="x7-0.3" style="left:${CX(12.85) + 44}px;top:${CY(420000) + 70}px;font-size:28px;color:#ff9c94">几个月，跌掉约 6 年的积蓄</div>
    <div class="a" id="x-sell" data-in="x6@0.3" data-fx="pop" data-out="x7-0.2" style="left:${CX(13) - 120}px;top:${CY(420000) + 150}px">卖出</div>

    <div id="x-crowd" class="abs" style="inset:0;opacity:0"></div>
    <div class="a abs" data-in="x7@0.72" data-fx="up" data-out="x9-0.3" style="left:120px;top:360px;width:420px">
      <div class="k900 red" style="font-size:44px">46%</div><div class="k700" style="font-size:32px;margin-top:6px">持有不到 3 个月就离场</div><div class="k700 red" style="font-size:30px;margin-top:10px">这部分人平均：亏损</div></div>
    <div class="a abs" data-in="x8@0.45" data-fx="up" data-out="x9-0.3" style="left:1390px;top:360px;width:440px">
      <div class="k900 gold" style="font-size:44px">不到 2%</div><div class="k700" style="font-size:32px;margin-top:6px">持有超过 10 年</div><div class="k700 gold" style="font-size:30px;margin-top:10px">其中 98% 赚了钱</div></div>
    <div class="a ctr" data-in="x7" data-fx="fade" data-out="x9-0.3" style="top:150px;font-size:26px;color:#8e8a83">某基金投资者统计 · 4682 万主动权益基金客户 · 数据截至 2021-03</div>

    <div class="a abs k900 gg num" data-in="x10@0.4" data-fx="slam" data-shake="36" style="left:300px;top:200px;font-size:200px;line-height:1;transform-origin:0 50%">139 万</div>
    <div class="a abs k700" data-in="x10.e+0.1" data-fx="up" style="left:310px;top:430px;font-size:40px">本金 <span class="num">72</span> 万 ＋ 自己长出来的 <span class="gold num">67</span> 万</div>
    <div class="a abs" data-in="x10.e+0.1" data-fx="fade" style="left:312px;top:496px;font-size:22px;color:#8e8a83">按假设年化 6% 测算 · 曲线为示意</div>
  </section>`,
  setup(ctx) {
    ctxRef = ctx;
    const { $, Core } = ctx;
    // 柱状图
    let g = `<line x1="${BX(1) - 40}" x2="${BX(13) + 90}" y1="${BASE}" y2="${BASE}" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
      <line id="x-ref" x1="${BX(1) - 40}" x2="${BX(13) + 90}" y1="${BASE - 36000 * BS}" y2="${BASE - 36000 * BS}" stroke="rgba(255,255,255,.35)" stroke-dasharray="10 8" stroke-width="2" opacity="0"/>`;
    for (let k = 1; k <= 13; k++) {
      g += `<g id="x-b${k}" opacity="0"><rect id="x-bg${k}" x="${BX(k)}" width="34" y="${BASE}" height="0" rx="5" fill="#6b7385"/>
        <rect id="x-bo${k}" x="${BX(k) + 38}" width="34" y="${BASE}" height="0" rx="5" fill="#f2c063" style="filter:drop-shadow(0 0 10px rgba(242,192,99,.7))"/>
        <text x="${BX(k) + 36}" y="${BASE + 36}" text-anchor="middle" font-size="22" fill="#8e8a83">${k}</text></g>`;
    }
    g += `<text x="${BX(1) - 40}" y="${BASE + 72}" font-size="22" fill="#6f6b64">第 N 年</text>`;
    $('x-bars').innerHTML = g;
    $('x-g3').textContent = '+¥' + Math.round(GROW(3)).toLocaleString('en-US');
    $('x-g13').textContent = (GROW(13) / 1e4).toFixed(1) + ' 万';
    // 曲线网格
    let c = '';
    for (let v = 0; v <= 1500000; v += 500000) c += `<line x1="260" x2="1660" y1="${CY(v)}" y2="${CY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="230" y="${CY(v) + 9}" font-size="24" fill="#6f6b64" text-anchor="end">${v / 1e4}万</text>`;
    for (let y = 0; y <= 20; y += 5) c += `<text x="${CX(y)}" y="930" font-size="24" fill="#6f6b64" text-anchor="middle">第${y}年</text>`;
    $('x-cgrid').innerHTML = c;
    $('x-rocket').innerHTML = Core.ROCKET;
    // 100 个人
    const r = Core.rng(2021); ord = [...Array(PEOPLE).keys()];
    for (let i = PEOPLE - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
    gold2 = [ord[60], ord[83]];
    let h = '';
    for (let i = 0; i < PEOPLE; i++) {
      const x = 660 + (i % 10) * 62, y = 250 + Math.floor(i / 10) * 66;
      h += `<div class="x-p" id="x-p${i}" style="left:${x}px;top:${y}px"><svg viewBox="0 0 40 52"><circle cx="20" cy="12" r="10" fill="currentColor"/><path d="M2 52 C2 32 10 25 20 25 C30 25 38 32 38 52 Z" fill="currentColor"/></svg></div>`;
    }
    $('x-crowd').innerHTML = h;
  },
  events(ctx) {
    const { T, P, Core } = ctx;
    ctx.ev(T('x1@0.3'), 'pop');
    for (let k = 2; k <= 13; k++) ctx.ev(barT(T, k), 'tick', .6);
    ctx.ev(T('x4@0.8'), 'hit', 14); ctx.flash(T('x4@0.8'), .25, .2);
    P.burst({ t0: T('x4@0.8'), x: BX(13) + 55, y: BASE - GROW(13) * BS, n: 60, spd: [200, 700], life: [.6, 1.2], size: [2, 5], colors: Core.GOLD, seed: 131 });
    ctx.ev(T('x5@0.45'), 'hit', 26); ctx.ev(T('x5@0.5'), 'alarm', 1.8);
    ctx.ev(T('x6') - .2, 'heartbeat'); ctx.ev(T('x6') + .8, 'heartbeat', .8);
    ctx.ev(T('x7@0.4'), 'whoosh');
    ctx.ev(T('x8@0.4'), 'chime');
    ctx.ev(T('x9@0.3'), 'launch');
    ctx.ring(T('x10@0.4') + .2, 560, 300, 800); ctx.flash(T('x10@0.4') + .2, .55, .25);
    P.burst({ t0: T('x10@0.4') + .2, x: 560, y: 300, n: 170, spd: [400, 1500], g: 500, life: [.9, 2], size: [2, 7], colors: Core.GOLD, seed: 141 });
    ctx.rumble(t => { const a = T('x9'), b = T('x10@0.4'); return t > a && t < b ? 5 * (t - a) / (b - a) : 0; });
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, ei, eio, back, win } = Core;
    if (t < T('x1') - 1 || t > T('a1')) return;
    // ① 柱状图
    const barsOut = 1 - clamp((t - (T('x5') - .4)) / .4);
    $('x-bars').style.opacity = barsOut;
    for (let k = 1; k <= 13; k++) {
      const k0 = barT(T, k), p = eo((t - k0) / .45);
      $('x-b' + k).setAttribute('opacity', clamp((t - k0) / .15));
      const hg = 36000 * BS * p, ho = GROW(k) * BS * eo((t - k0 - .25) / .5);
      $('x-bg' + k).setAttribute('y', BASE - hg); $('x-bg' + k).setAttribute('height', hg);
      $('x-bo' + k).setAttribute('y', BASE - ho); $('x-bo' + k).setAttribute('height', ho);
    }
    $('x-ref').setAttribute('opacity', clamp((t - T('x4@0.55')) / .4) * .9);
    const cO = win(t, T('x2@0.55'), T('x3') + .2, .3); $('x-callout').style.opacity = cO;
    const xr = clamp((t - T('x4@0.8')) / .3) * barsOut; $('x-cross').style.opacity = xr;
    $('x-bo13').style.filter = t > T('x4@0.8') ? `drop-shadow(0 0 ${14 + 10 * Math.sin(t * 8)}px rgba(255,220,130,1))` : 'drop-shadow(0 0 10px rgba(242,192,99,.7))';
    // ② ③ ④ 曲线
    const curveIn = clamp((t - (T('x5') - .3)) / .4), crowdIn = win(t, T('x7') - .2, T('x9') - .2, .4);
    const curveOp = curveIn * (1 - .94 * crowdIn);
    $('x-curve').style.opacity = curveOp; $('x-num').style.opacity = curveOp * (1 - clamp((t - T('x10@0.3')) / .3));
    let Y;
    if (t < T('x5@0.45')) Y = C0 * eo((t - (T('x5') - .3)) / 1.0);
    else if (t < T('x9@0.2')) Y = C0 + (C1 - C0) * eo((t - T('x5@0.45')) / .9);
    else Y = C1 + (20 - C1) * eio((t - T('x9@0.2')) / (T('x10@0.4') - T('x9@0.2')));
    const pts = []; for (let y = 0; y <= Y + 1e-6; y += .05) pts.push([CX(y), CY(bal(y))]); pts.push([CX(Y), CY(bal(Y))]);
    const toD = a => a.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const pre = pts.filter(p => p[0] <= CX(C0) + .1), mid = pts.filter(p => p[0] >= CX(C0) - .1 && p[0] <= CX(C1) + .1), post = pts.filter(p => p[0] >= CX(C1) - .1);
    $('x-line').setAttribute('d', toD(pre) + (post.length > 1 ? toD(post) : ''));
    $('x-crash').setAttribute('d', mid.length > 1 ? toD(mid) : '');
    $('x-area').setAttribute('d', pts.length > 1 ? toD(pts) + `L${CX(Y)} ${CY(0)}L${CX(0)} ${CY(0)}Z` : '');
    $('x-val').textContent = Math.round(bal(Y) / 1e4); $('x-yr').textContent = `第 ${Math.min(20, Math.floor(Y + 1e-6))} 年`;
    $('x-val').style.filter = Y > C0 && Y < C1 + .2 && t < T('x9') ? 'hue-rotate(-40deg) saturate(2)' : '';
    const rk = $('x-rocket'), rp = rocketAt(T, t);
    rk.setAttribute('opacity', t > T('x9@0.2') && t < T('x10@0.4') + .3 ? 1 : 0);
    if (rp) rk.setAttribute('transform', `translate(${rp[0]},${rp[1]}) rotate(${rp[2] * 180 / Math.PI})`);
    // 人群
    $('x-crowd').style.opacity = crowdIn;
    for (let i = 0; i < PEOPLE; i++) {
      const el = $('x-p' + i), rank = ord.indexOf(i);
      let col = '#cfc6b6', op = 1, ty = 0;
      const leaveT = T('x7@0.38') + rank / 46 * 1.6;
      if (rank < 46 && t > leaveT - .3) { col = '#ff5a4e'; const k = clamp((t - leaveT) / .7); op = 1 - k; ty = 60 * ei(k); }
      if (rank >= 46 && t > T('x8') + (rank - 46) / 54 * 1.2) { const isG = gold2.includes(i); if (!isG) op = .18; }
      if (gold2.includes(i) && t > T('x8@0.3')) { col = '#f2c063'; el.style.filter = 'drop-shadow(0 0 14px rgba(242,192,99,1))'; el.style.transform = `scale(${1 + .4 * back(clamp((t - T('x8@0.3')) / .5))})`; }
      else { el.style.filter = ''; el.style.transform = `translateY(${ty}px)`; }
      el.style.color = col; el.style.opacity = op;
    }
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const { win } = Core;
    ctx.glow(960, 520, 900, 'rgba(242,175,70,A)', .12 * win(t, T('x1') - .5, T('a1') - .4) + .18 * win(t, T('x9'), T('a1') - .4));
    ctx.glow(960, 540, 1100, 'rgba(255,40,30,A)', .2 * win(t, T('x5@0.45'), T('x7') - .2, .3));
    Core.drawSpeedLines(ctx.bgc, SPEED, t, win(t, T('x9@0.2'), T('x10@0.5'), .3), 2400, 1080);
    return { dust: .3 + .5 * win(t, T('x10@0.4'), T('a1'), .4) };
  },
  fx(t, ctx) {
    const { T } = ctx; const a = T('x9@0.2'), b = T('x10@0.4') + .3;
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
function barT(T, k) { if (k === 1) return T('x1@0.3'); if (k <= 5) return T('x2@0.1') + (k - 2) / 3 * (T('x2@0.6') - T('x2@0.1')); return T('x4@0.2') + (k - 6) / 7 * (T('x4@0.75') - T('x4@0.2')); }
function rocketAt(T, t) {
  const a = T('x9@0.2'), b = T('x10@0.4'); if (t < a) return null;
  const Y = C1 + (20 - C1) * Core.eio(Math.min(1, (t - a) / (b - a)));
  const y2 = Math.min(20, Y + .15), y1 = Math.max(C1, Y - .15);
  return [CX(Y), CY(bal(Y)), Math.atan2(CY(bal(y2)) - CY(bal(y1)), CX(y2) - CX(y1))];
}
})();
