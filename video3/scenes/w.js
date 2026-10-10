/* 二、一排工资条：你最大的资产是面前的工资；每过一年少一格，还可能被提前切断；
 *   小林趁自己还值钱，每格拿出三成换成与工作无关的资产；阿杰用房贷车贷分期，把后面很多格的七成提前锁住 */
(() => {
// 台词锚点（终稿改 id 时只改这里）
const L = { row: 'w1', sum: 'w2', use: 'w3', cut: 'w4', lin: 'w5', jie: 'w6', next: 'j1' };
const N = 38, X0 = 300, STEP = 40, BW = 34, BH = 96;
const ax = i => X0 + i * STEP;
const ROW_Y = { you: 520, lin: 300, jie: 650 };
const LOCK = '<svg viewBox="0 0 20 22" width="18" height="20"><rect x="2" y="9" width="16" height="12" rx="3" fill="#ff5a4e"/><path d="M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9" fill="none" stroke="#ff5a4e" stroke-width="2.6"/></svg>';
let B = {}, slices = [], locks = [];

Kit.add({
  key: 'w',
  anchors: L,
  keywords: ['最大的资产', '三成', '还值钱', '锁住', '切断'],
  text: '你的身价已经过去未来工资岁万小林阿杰与工作无关的账户会涨也会跌已锁定房贷车贷分期工资断了月供还在每格一年收入简化月薪不计涨薪',
  css: `
  .w-blk{position:absolute;width:${BW}px;height:${BH}px;border-radius:7px;transform-origin:50% 100%}
  .w-blk.you{background:linear-gradient(180deg,#ffffff,#d9d4ca 60%,#a8a397);box-shadow:0 0 12px rgba(255,255,255,.18)}
  .w-blk.lin{background:linear-gradient(180deg,#fff1c9,#f2c063 55%,#c48a2c);box-shadow:0 0 14px rgba(242,192,99,.35)}
  .w-blk.jie{background:linear-gradient(180deg,#ffd0c9,#ff7a6c 55%,#c43d33);box-shadow:0 0 14px rgba(255,90,78,.3)}
  .w-q{position:absolute;width:${BW}px;height:${BH}px;border:2px dashed rgba(255,255,255,.45);border-radius:7px;color:rgba(255,255,255,.6);font:900 26px var(--sans);display:flex;align-items:center;justify-content:center}
  .w-slice{position:absolute;width:${BW}px;height:${BH * .3}px;border-radius:6px;background:linear-gradient(180deg,#fff6d6,#f7cf74);box-shadow:0 0 16px rgba(242,192,99,.8)}
  .w-lock{position:absolute;width:${BW}px;height:${BH * .7}px;border-radius:0 0 7px 7px;background:rgba(40,8,6,.78);border:2px solid rgba(255,90,78,.85);display:flex;align-items:center;justify-content:center}
  .w-rowlab{position:absolute;left:90px;font:900 40px var(--sans);letter-spacing:.2em}
  .w-age{position:absolute;font-size:22px;color:#8e8a83;transform:translateX(-50%)}
  .w-rail{position:absolute;left:${X0}px;width:${N * STEP - 6}px;height:40px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);overflow:hidden}
  .w-rail .fi{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:20px}
  `,
  html: `
  <section class="scene" id="wScene" data-s="${L.row}-0.6" data-e="${L.next}-0.45">
    <div class="a ctr k900" data-in="${L.row}" data-fx="up" data-out="${L.lin}-0.3" style="top:150px;font-size:58px">25 岁的你，面前是一排工资</div>
    <div class="a abs" data-in="${L.row}@0.5" data-fx="fade" data-out="${L.lin}-0.3" style="right:90px;top:900px;font-size:20px;color:#77736c">简化：月薪 1 万 × 12，不计涨薪与年终奖</div>
    <div id="w-you-lab" class="w-rowlab" style="top:${ROW_Y.you + 22}px;color:#e9dcc0">你</div>
    <div id="w-lin-lab" class="w-rowlab gold" style="top:${ROW_Y.lin + 22}px;opacity:0">小林</div>
    <div id="w-jie-lab" class="w-rowlab red" style="top:${ROW_Y.jie + 22}px;opacity:0">阿杰</div>
    <div id="w-rows"></div>
    <div id="w-ages"></div>
    <div class="a abs" data-in="${L.row}@0.7" data-fx="pop" data-out="${L.sum}" style="left:${ax(0) - 30}px;top:${ROW_Y.you - 60}px;font-size:24px;color:#e9dcc0;white-space:nowrap">1 格 = 1 年 ≈ <b class="k900">12 万</b></div>
    <svg id="w-brace" width="1920" height="120" style="position:absolute;left:0;top:${ROW_Y.you - 112}px;overflow:visible;opacity:0"><path id="w-brace-p" fill="none" stroke="#e9dcc0" stroke-width="4"/></svg>
    <div id="w-sum" class="abs" style="top:${ROW_Y.you - 190}px;opacity:0;white-space:nowrap;transform:translateX(-50%)"><span class="k900" style="font-size:40px">未来的工资 ≈ </span><span class="k900 num" id="w-sum-n" style="font-size:66px">456 万</span></div>
    <div id="w-past" class="abs" style="left:${X0 - 6}px;top:${ROW_Y.you + BH + 62}px;font-size:24px;color:#77736c;opacity:0">已经过去</div>
    <div id="w-cursor" class="abs" style="top:${ROW_Y.you - 30}px;width:4px;height:${BH + 60}px;background:#fff;box-shadow:0 0 18px #fff;opacity:0"><div id="w-cur-age" class="k900" style="position:absolute;top:-44px;left:-40px;width:84px;text-align:center;font-size:28px">25岁</div></div>
    <div id="w-cut" class="abs" style="left:${ax(20) - 5}px;top:${ROW_Y.you - 70}px;width:6px;height:${BH + 140}px;background:#ff5a4e;box-shadow:0 0 30px #ff5a4e;opacity:0"></div>
    <div class="a abs" data-in="${L.cut}@0.5" data-fx="slam" data-shake="20" data-out="${L.lin}-0.3" style="left:${ax(20) + 30}px;top:${ROW_Y.you + BH + 70}px"><div class="k900 red" style="font-size:44px">45 岁 · 被切断</div><div style="font-size:28px;color:#cfc6b6;margin-top:6px">后面还能拿回多少，说不准</div></div>
    <div class="w-rail" id="w-rail-lin" style="top:${ROW_Y.lin + BH + 70}px;opacity:0"><div class="fi" id="w-rail-lin-fi" style="background:linear-gradient(90deg,#c48a2c,#ffe08f);box-shadow:0 0 30px rgba(242,192,99,.7)"></div></div>
    <div class="abs" id="w-rail-lin-lab" style="left:${X0}px;top:${ROW_Y.lin + BH + 122}px;font-size:26px;opacity:0"><span class="gold k900">与工作无关的账户</span><span class="mute" style="margin-left:14px">每格拿出三成 · 会涨也会跌</span></div>
    <div id="w-jie-pre" class="abs k900 red" style="left:${ax(5)}px;width:${ax(30) + BW - ax(5)}px;top:${ROW_Y.jie - 58}px;text-align:center;font-size:32px;opacity:0">已锁定：房贷 · 车贷 · 分期，每格约七成</div>
    <div class="abs" id="w-jie-note" style="left:${X0}px;top:${ROW_Y.jie + BH + 30}px;font-size:28px;opacity:0"><span class="red k900">工资断了，月供还在</span></div>
    <div id="w-cut2" class="abs" style="left:${ax(20) - 5}px;top:${ROW_Y.lin - 50}px;width:6px;height:${ROW_Y.jie - ROW_Y.lin + BH + 100}px;background:#ff5a4e;box-shadow:0 0 30px #ff5a4e;opacity:0"></div>
  </section>`,
  setup(ctx) {
    let h = '';
    for (let i = 0; i < N; i++) h += `<div class="w-blk you" id="w-you-${i}" style="left:${ax(i)}px;top:${ROW_Y.you}px;opacity:0"></div><div class="w-q" id="w-q-${i}" style="left:${ax(i)}px;top:${ROW_Y.you}px;opacity:0">?</div>`;
    for (let i = 0; i < N; i++) h += `<div class="w-blk jie" id="w-jie-${i}" style="left:${ax(i)}px;top:${ROW_Y.jie}px;opacity:0"></div>`;
    for (let i = 5; i < 31; i++) h += `<div class="w-lock" id="w-lk-${i}" style="left:${ax(i)}px;top:${ROW_Y.jie + BH * .3}px;opacity:0">${LOCK}</div>`;
    for (let i = 0; i < 20; i++) h += `<div class="w-slice" id="w-sl-${i}" style="left:${ax(i)}px;top:${ROW_Y.lin}px;opacity:0"></div>`;
    ctx.$('w-rows').innerHTML = h;
    ctx.$('w-ages').innerHTML = [0, 10, 20, 30].map(i => `<div class="w-age" style="left:${ax(i) + BW / 2}px">${25 + i}岁</div>`).join('') + `<div class="w-age" style="left:${ax(37) + BW / 2}px">退休</div>`;
    for (let i = 0; i < N; i++) { B['you' + i] = ctx.$('w-you-' + i); B['q' + i] = ctx.$('w-q-' + i); B['jie' + i] = ctx.$('w-jie-' + i); }
    for (let i = 5; i < 31; i++) locks[i] = ctx.$('w-lk-' + i);
    for (let i = 0; i < 20; i++) slices[i] = ctx.$('w-sl-' + i);
  },
  events(ctx) {
    const { T } = ctx;
    for (let i = 0; i < N; i += 5) ctx.ev(T(L.row + '@0.2') + i * .05, 'tick', .7);
    ctx.ev(T(L.cut + '@0.45'), 'hit', 22); ctx.flash(T(L.cut + '@0.45'), .3, .18);
    ctx.ev(T(L.lin + '@0.4'), 'coins');
    for (let i = 5; i < 31; i += 5) ctx.ev(lockT(T, i), 'lock', .6);
    ctx.ev(T(L.lin) - .3, 'whoosh'); ctx.ev(T(L.jie) - .3, 'whoosh');
    ctx.ev(T(L.jie + '.e') + .15, 'hit', 16);
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, back } = Core;
    if (t < T(L.row) - 1 || t > T(L.next)) return;
    const Bt = T(L.lin) - .25, phaseB = eio((t - Bt) / .7);
    const yRow = ROW_Y.you + (ROW_Y.lin - ROW_Y.you) * phaseB;
    const cutT = T(L.cut + '@0.45');
    const sA0 = T(L.use + '@0.2'), sA1 = T(L.use + '.e') + .3;
    const sB0 = T(L.lin + '@0.25'), sB1 = T(L.lin + '.e') - .2;
    let curK = null;
    if (t > sA0 - .2 && t < Bt) curK = 20 * clamp((t - sA0) / (sA1 - sA0));
    if (t > sB0 - .2 && t < T(L.jie)) curK = 20 * clamp((t - sB0) / (sB1 - sB0));
    $('w-you-lab').style.top = (yRow + 22) + 'px'; $('w-you-lab').style.opacity = clamp((t - T(L.row)) / .5) * (1 - phaseB);
    $('w-lin-lab').style.top = (yRow + 22) + 'px'; $('w-lin-lab').style.opacity = phaseB;
    for (let i = 0; i < N; i++) {
      const el = B['you' + i], q = B['q' + i];
      const on = eo((t - (T(L.row + '@0.2') + i * .05)) / .35);
      let op = on, qop = 0, sy = 1;
      if (t < Bt) {
        el.className = 'w-blk you';
        const used = curK != null ? clamp(curK - i) : 0;
        if (i < 20) op *= 1 - .7 * used;
        if (i >= 20 && t > cutT) { const k = clamp((t - cutT - (i - 20) * .02) / .3); op *= 1 - k; qop = k * (.6 + .4 * Math.abs(Math.sin(t * 3 + i))); }
      } else {
        el.className = 'w-blk lin'; op = phaseB;
        if (i < 20) { const k = curK != null ? clamp(curK - i) : (t > sB1 ? 1 : 0); sy = 1 - .3 * k; }
      }
      el.style.opacity = op; el.style.top = yRow + 'px'; el.style.transform = `scaleY(${sy})`;
      q.style.opacity = qop * (1 - phaseB); q.style.top = yRow + 'px';
    }
    const leftI = t < Bt && curK != null ? curK : 0;
    const bx0 = ax(0) + leftI * STEP, bx1 = t > cutT ? ax(20) - 4 : ax(N - 1) + BW;
    const bk = clamp((t - T(L.sum)) / .5) * (1 - clamp((t - (Bt - .4)) / .4));
    $('w-brace').style.opacity = bk; $('w-sum').style.opacity = bk;
    const mx = (bx0 + bx1) / 2;
    $('w-brace-p').setAttribute('d', `M${bx0} 100 Q${bx0} 70 ${bx0 + 30} 70 L${mx - 20} 70 Q${mx} 70 ${mx} 40 Q${mx} 70 ${mx + 20} 70 L${bx1 - 30} 70 Q${bx1} 70 ${bx1} 100`);
    $('w-sum').style.left = mx + 'px';
    $('w-sum-n').textContent = t > cutT ? '?' : Math.round((N - leftI) * 12) + ' 万';
    $('w-sum-n').style.color = t > cutT ? '#ff5a4e' : '';
    $('w-past').style.opacity = clamp((t - sA0) / .5) * (1 - phaseB);
    const cur = $('w-cursor');
    cur.style.opacity = curK == null ? 0 : 1;
    if (curK != null) { cur.style.left = (ax(0) + curK * STEP - 2) + 'px'; cur.style.top = (yRow - 30) + 'px'; $('w-cur-age').textContent = (25 + Math.round(curK)) + '岁'; }
    const ck = clamp((t - cutT) / .15) * (1 - clamp((t - Bt) / .4));
    $('w-cut').style.opacity = ck; $('w-cut').style.transform = `scaleY(${.3 + .7 * back(clamp((t - cutT) / .3))})`;
    document.querySelectorAll('#w-ages .w-age').forEach(a => { a.style.top = (yRow + BH + 12) + 'px'; a.style.opacity = clamp((t - T(L.row + '@0.5')) / .5); });
    let filled = 0;
    for (let i = 0; i < 20; i++) {
      const sl = slices[i];
      if (t < Bt) { sl.style.opacity = 0; continue; }
      const kk = clamp((t - (sB0 + (sB1 - sB0) * i / 20)) / .45);
      sl.style.opacity = kk > 0 && kk < 1 ? 1 : 0; sl.style.top = (ROW_Y.lin + (BH + 72) * eio(kk)) + 'px';
      if (kk >= 1) filled++;
    }
    const railOn = clamp((t - (Bt + .3)) / .4);
    $('w-rail-lin').style.opacity = railOn; $('w-rail-lin-lab').style.opacity = railOn;
    $('w-rail-lin-fi').style.width = (filled / 20 * 100) + '%';
    const jieOn = eo((t - (T(L.jie) - .3)) / .6);
    $('w-jie-lab').style.opacity = jieOn;
    for (let i = 0; i < N; i++) B['jie' + i].style.opacity = jieOn;
    for (let i = 5; i < 31; i++) { const k = t - lockT(T, i); locks[i].style.opacity = k > 0 ? 1 : 0; locks[i].style.transform = `scale(${k > 0 ? 1 + .5 * Math.max(0, 1 - k / .18) : 1})`; }
    $('w-jie-pre').style.opacity = clamp((t - lockT(T, 30)) / .4);
    const c2 = T(L.jie + '.e') + .15;
    $('w-cut2').style.opacity = clamp((t - c2) / .15); $('w-cut2').style.transform = `scaleY(${.3 + .7 * back(clamp((t - c2) / .3))})`;
    $('w-jie-note').style.opacity = clamp((t - c2 - .2) / .3);
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T(L.row) - .5, T(L.next) - .4);
    ctx.glow(1000, 450, 900, 'rgba(242,175,70,A)', .1 * w);
    ctx.glow(1000, 700, 700, 'rgba(255,70,55,A)', .1 * Core.win(t, T(L.jie) - .3, T(L.next) - .4));
  },
});
function lockT(T, i) { return T(L.jie + '@0.15') + (i - 5) / 25 * (T(L.jie + '@0.85') - T(L.jie + '@0.15')); }
})();
