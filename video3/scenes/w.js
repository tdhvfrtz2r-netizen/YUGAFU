/* 二、一排工资条：你最大的资产是未来的工资；它会用完，也可能被切断；小林切三成存下，阿杰用分期提前花掉 */
(() => {
const N = 35, X0 = 300, STEP = 44, BW = 38;            // 25–59 岁，每格一年
const ax = i => X0 + i * STEP;                          // 第 i 格左边 x
const ROW_Y = { you: 520, lin: 300, jie: 650 };         // 各行顶部 y
const BH = 96;
let blocks = {}, slices = [], stamps = [], ctxRef;

Kit.add({
  key: 'w',
  keywords: ['最大的资产', '三成', '分期', '提前花掉', '切断'],
  text: '你的身价未来所有工资已预支不会被裁员的资产收入中断岁',
  css: `
  .w-blk{position:absolute;width:${BW}px;height:${BH}px;border-radius:7px;background:linear-gradient(180deg,#fff1c9,#f2c063 55%,#c48a2c);box-shadow:0 0 14px rgba(242,192,99,.35)}
  .w-slice{position:absolute;width:${BW}px;height:${BH * .3}px;border-radius:6px;background:linear-gradient(180deg,#fff6d6,#f7cf74);box-shadow:0 0 16px rgba(242,192,99,.8)}
  .w-stamp{position:absolute;width:${BW + 6}px;height:30px;border:3px solid #ff5a4e;color:#ff5a4e;font:900 15px var(--sans);display:none;display:flex;align-items:center;justify-content:center;border-radius:5px;background:rgba(7,8,11,.75);transform:rotate(-12deg)}
  .w-rowlab{position:absolute;left:90px;font:900 40px var(--sans);letter-spacing:.2em}
  .w-age{position:absolute;font-size:22px;color:#8e8a83;transform:translateX(-50%)}
  .w-rail{position:absolute;left:${X0}px;width:${N * STEP - 6}px;height:40px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);overflow:hidden}
  .w-rail .fi{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:20px}
  `,
  html: `
  <section class="scene" id="wScene" data-s="w1-0.5" data-e="j1-0.45">
    <div class="a ctr k900" data-in="w1" data-fx="up" data-out="w6-0.3" style="top:150px;font-size:58px">25 岁的你，身后是一排工资</div>
    <div id="w-you-lab" class="w-rowlab" style="top:${ROW_Y.you + 22}px;color:#e9dcc0">你</div>
    <div id="w-lin-lab" class="w-rowlab gold" style="top:${ROW_Y.lin + 22}px;opacity:0">小林</div>
    <div id="w-jie-lab" class="w-rowlab red" style="top:${ROW_Y.jie + 22}px;opacity:0">阿杰</div>
    <div id="w-rows"></div>
    <div id="w-ages"></div>
    <div class="a abs" data-in="w2@0.75" data-fx="fade" data-out="w6-0.3" style="left:${X0}px;top:${ROW_Y.you + BH + 50}px;font-size:26px;color:#cfc6b6">每一格 = 一年收入 ≈ <b class="gold">12 万</b></div>
    <svg class="a abs" data-in="w3" data-fx="fade" data-out="w4@0.3" width="1920" height="200" style="left:0;top:${ROW_Y.you - 150}px;overflow:visible">
      <path d="M${X0} 120 Q${X0} 90 ${X0 + 40} 90 L${ax(17) - 20} 90 Q${ax(17) + 20} 90 ${ax(17) + 20} 60 Q${ax(17) + 20} 90 ${ax(17) + 60} 90 L${ax(34) - 2} 90 Q${ax(34) + 36} 90 ${ax(34) + 36} 120" fill="none" stroke="#f2c063" stroke-width="4"/>
    </svg>
    <div class="a ctr" data-in="w3" data-fx="pop" data-out="w4@0.3" style="top:${ROW_Y.you - 140}px"><span class="k900" style="font-size:44px">你的身价 ≈ 未来所有工资 ≈ </span><span class="k900 gg num" style="font-size:64px">420 万</span></div>
    <div id="w-cursor" class="abs" style="top:${ROW_Y.you - 30}px;width:4px;height:${BH + 60}px;background:#fff;box-shadow:0 0 18px #fff;opacity:0"><div id="w-cur-age" class="k900" style="position:absolute;top:-44px;left:-40px;width:84px;text-align:center;font-size:28px">25岁</div></div>
    <div id="w-cut" class="abs" style="left:${ax(20) - 5}px;top:${ROW_Y.you - 70}px;width:6px;height:${BH + 140}px;background:#ff5a4e;box-shadow:0 0 30px #ff5a4e;opacity:0"></div>
    <div class="a abs k900 red" data-in="w5@0.45" data-fx="slam" data-shake="22" data-out="w6-0.3" style="left:${ax(20) + 30}px;top:${ROW_Y.you - 120}px;font-size:56px">45 岁 · 收入中断</div>
    <div class="a abs k700" data-in="w4@0.45" data-fx="fade" data-out="w5@0.4" style="left:${X0}px;top:${ROW_Y.you + BH + 100}px;font-size:30px;color:#bdb6aa">一年一格，慢慢用掉</div>
    <div class="w-rail" id="w-rail-lin" style="top:${ROW_Y.lin + BH + 70}px;opacity:0"><div class="fi" id="w-rail-lin-fi" style="background:linear-gradient(90deg,#c48a2c,#ffe08f);box-shadow:0 0 30px rgba(242,192,99,.7)"></div></div>
    <div class="abs" id="w-rail-lin-lab" style="left:${X0}px;top:${ROW_Y.lin + BH + 122}px;font-size:26px;opacity:0"><span class="gold k900">不会被裁员的账户</span><span class="mute" style="margin-left:14px">每年存入三成</span></div>
    <div class="w-rail" id="w-rail-jie" style="top:${ROW_Y.jie + BH + 70}px;opacity:0"><div class="fi" style="background:#ff5a4e"></div></div>
    <div class="abs" id="w-rail-jie-lab" style="left:${X0}px;top:${ROW_Y.jie + BH + 122}px;font-size:26px;opacity:0"><span class="red k900">存款 ≈ 0</span><span class="mute" style="margin-left:14px">后面的工资，已经被分期提前花掉</span></div>
    <svg id="w-jie-brace" class="abs" width="1920" height="80" style="left:0;top:${ROW_Y.jie - 62}px;overflow:visible;opacity:0"><path d="M${ax(3)} 56 L${ax(3)} 40 L${ax(19) + BW} 40 L${ax(19) + BW} 56" fill="none" stroke="#ff5a4e" stroke-width="4"/></svg>
    <div id="w-jie-pre" class="abs k900 red" style="left:${ax(3)}px;width:${ax(19) + BW - ax(3)}px;top:${ROW_Y.jie - 70}px;text-align:center;font-size:34px;opacity:0">已预支：28–44 岁的工资</div>
    <div class="a abs k900" data-in="w7@0.55" data-fx="pop" style="left:${ax(21)}px;top:${ROW_Y.jie - 74}px;font-size:34px"><span class="red">分期</span> = 提前花掉未来的工资</div>
  </section>`,
  setup(ctx) {
    ctxRef = ctx;
    const rows = ctx.$('w-rows'), ages = ctx.$('w-ages');
    let h = '';
    ['you', 'jie'].forEach(r => { for (let i = 0; i < N; i++) h += `<div class="w-blk" id="w-${r}-${i}" style="left:${ax(i)}px;top:${ROW_Y[r === 'you' ? 'you' : 'jie']}px"></div>`; });
    for (let i = 0; i < 20; i++) h += `<div class="w-slice" id="w-sl-${i}" style="left:${ax(i)}px;top:${ROW_Y.lin}px;opacity:0"></div>`;
    rows.innerHTML = h;
    ages.innerHTML = [0, 10, 20, 30, 34].map(i => `<div class="w-age" data-i="${i}" style="left:${ax(i) + BW / 2}px">${25 + i}岁</div>`).join('');
    for (let i = 0; i < N; i++) blocks['you' + i] = ctx.$('w-you-' + i), blocks['jie' + i] = ctx.$('w-jie-' + i);
    for (let i = 0; i < 20; i++) slices[i] = ctx.$('w-sl-' + i);
  },
  events(ctx) {
    const { T } = ctx;
    for (let i = 0; i < N; i += 5) ctx.ev(T('w2@0.25') + i * .06, 'tick', .7);
    ctx.ev(T('w5@0.4'), 'hit', 24); ctx.flash(T('w5@0.4'), .35, .18);
    ctx.ev(T('w6@0.35'), 'coins');
    [5, 9, 13, 17].forEach(i => ctx.ev(stampT(T, i), 'stamp', .8));
    ctx.ev(T('w6') - .3, 'whoosh'); ctx.ev(T('w7') - .3, 'whoosh');
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, back, win } = Core;
    if (t < T('w1') - 1 || t > T('j1')) return;
    const B = T('w6') - .25;          // 切换到"小林 / 阿杰"两行
    const phaseB = eio((t - B) / .7);
    // —— 第一行：你 → 小林 ——
    const yYou = ROW_Y.you + (ROW_Y.lin - ROW_Y.you) * phaseB;
    $('w-you-lab').style.top = (yYou + 22) + 'px';
    $('w-you-lab').style.opacity = clamp((t - T('w1')) / .5) * (1 - phaseB);
    $('w-lin-lab').style.top = (yYou + 22) + 'px'; $('w-lin-lab').style.opacity = phaseB;
    const cutT = T('w5@0.4');
    const sweepA0 = T('w4@0.35'), sweepA1 = T('w4.e') + .4;
    const sweepB0 = T('w6@0.32'), sweepB1 = T('w6.e') - .2;
    for (let i = 0; i < N; i++) {
      const el = blocks['you' + i];
      const on = eo((t - (T('w2@0.25') + i * .06)) / .35);
      let op = on, ty = 0, rot = 0, col = '';
      if (t < B) {
        const used = clamp((t - (sweepA0 + (sweepA1 - sweepA0) * i / 20)) / .25);
        if (i < 20) op *= 1 - .7 * used;
        if (i >= 20 && t > cutT) { const tau = t - cutT - (i - 20) * .03; if (tau > 0) { ty = 900 * tau * tau; rot = (i % 2 ? 1 : -1) * 40 * tau; op *= clamp(1 - tau / 1.1); } }
        el.style.filter = i >= 20 && t > cutT ? 'grayscale(1) brightness(.6)' : '';
      } else {
        el.style.filter = '';
        op = phaseB;                  // 小林那一行：重新亮起
        if (i < 20) { const k = clamp((t - (sweepB0 + (sweepB1 - sweepB0) * i / 20)) / .3); col = k; }
      }
      el.style.opacity = op;
      el.style.top = yYou + 'px';
      el.style.transform = `translateY(${ty}px) rotate(${rot}deg) scaleY(${typeof col === 'number' ? 1 - .3 * col : 1})`;
      el.style.transformOrigin = '50% 100%';
    }
    // 小林：每格切三成掉进账户
    let filled = 0;
    for (let i = 0; i < 20; i++) {
      const s0 = sweepB0 + (sweepB1 - sweepB0) * i / 20, k = clamp((t - s0) / .45);
      const sl = slices[i];
      if (t < B || k <= 0) { sl.style.opacity = 0; continue; }
      const y0 = ROW_Y.lin, y1 = ROW_Y.lin + BH + 72;
      sl.style.opacity = k < 1 ? 1 : 0;
      sl.style.top = (y0 + (y1 - y0) * eio(k)) + 'px';
      if (k >= 1) filled++;
    }
    const railOn = clamp((t - (B + .3)) / .4);
    $('w-rail-lin').style.opacity = railOn; $('w-rail-lin-lab').style.opacity = railOn;
    $('w-rail-lin-fi').style.width = (filled / 20 * 100) + '%';
    // 指针
    let cx = null, age = 25;
    if (t > sweepA0 - .2 && t < cutT + .3) { const k = clamp((t - sweepA0) / (sweepA1 - sweepA0)); cx = ax(0) + k * (ax(20) - ax(0)); age = 25 + Math.round(k * 20); }
    if (t > sweepB0 - .2 && t < T('w7')) { const k = clamp((t - sweepB0) / (sweepB1 - sweepB0)); cx = ax(0) + k * (ax(20) - ax(0)); age = 25 + Math.round(k * 20); }
    const cur = $('w-cursor');
    cur.style.opacity = cx == null ? 0 : 1;
    if (cx != null) { cur.style.left = (cx - 2) + 'px'; cur.style.top = (yYou - 30) + 'px'; $('w-cur-age').textContent = age + '岁'; }
    // 切断线
    const ck = clamp((t - cutT) / .15) * (1 - clamp((t - B) / .4));
    $('w-cut').style.opacity = ck; $('w-cut').style.transform = `scaleY(${.3 + .7 * back(clamp((t - cutT) / .3))})`;
    // 年龄刻度跟着第一行
    document.querySelectorAll('#w-ages .w-age').forEach(a => { a.style.top = (yYou + BH + 12) + 'px'; a.style.opacity = clamp((t - T('w2@0.5')) / .5) * (t < B ? 1 : .8); });
    // —— 第二行：阿杰 ——
    const jieOn = eo((t - (T('w7') - .3)) / .6);
    $('w-jie-lab').style.opacity = jieOn;
    for (let i = 0; i < N; i++) {
      const el = blocks['jie' + i]; el.style.opacity = jieOn * (t > T('w7') - .3 ? 1 : 0);
      const pre = i >= 3 && i < 20 && t > stampT(T, i);
      el.style.filter = pre ? 'grayscale(.6) brightness(.45) sepia(1) hue-rotate(-40deg) saturate(3)' : 'hue-rotate(-35deg) saturate(1.4)';
      el.style.transform = pre ? `scale(${1 + .25 * Math.max(0, 1 - (t - stampT(T, i)) / .2)})` : '';
    }
    const pk = clamp((t - stampT(T, 19)) / .4);
    $('w-jie-brace').style.opacity = pk; $('w-jie-pre').style.opacity = pk;
    $('w-rail-jie').style.opacity = jieOn; $('w-rail-jie-lab').style.opacity = clamp((t - T('w7@0.7')) / .4);
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T('w1') - .5, T('j1') - .4);
    ctx.glow(1000, 450, 900, 'rgba(242,175,70,A)', .12 * w);
    ctx.glow(1000, 700, 700, 'rgba(255,70,55,A)', .1 * Core.win(t, T('w7') - .3, T('j1') - .4));
  },
});
function stampT(T, i) { return T('w7@0.12') + (i - 3) / 16 * (T('w7@0.85') - T('w7@0.12')); }
})();
