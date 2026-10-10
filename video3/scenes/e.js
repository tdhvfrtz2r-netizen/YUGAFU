/* 七、收尾：两排工资条同一天被切断 → 差距的本质是还有没有选择 → 底气 → 一个可以带走的问题 → 互动 */
(() => {
const N = 35, X0 = 300, STEP = 44, BW = 38, BH = 80;
const ax = i => X0 + i * STEP;
const Y = { lin: 250, jie: 560 };
const OPTS = ['换一份工作', '休息一段时间', '学一门新技能'];

Kit.add({
  key: 'e',
  keywords: ['一百三十九万', '选择', '底气', '评论区'],
  text: '小林阿杰岁换一份工作休息一段时间学一门新技能底气这笔钱是在给未来的自己留选择还是在提前花掉它你更像同一个起点两种人生系列第期',
  css: `
  .e-blk{position:absolute;width:${BW}px;height:${BH}px;border-radius:7px}
  .e-opt{position:absolute;padding:12px 24px;border-radius:30px;border:2px solid rgba(242,192,99,.7);background:rgba(242,192,99,.1);font:700 28px var(--sans);color:#ffe9b8;white-space:nowrap}
  .e-choice{display:inline-block;padding:22px 64px;border-radius:60px;font:900 52px var(--sans);margin:0 24px;letter-spacing:.1em}
  `,
  html: `
  <section class="scene" id="eScene" data-s="e1-0.6" data-e="end">
    <div id="e-rows" class="abs" style="inset:0"></div>
    <div class="a abs k900 gold" data-in="e1" data-fx="fade" data-out="e3@0.72" style="left:90px;top:${Y.lin + 14}px;font-size:40px;letter-spacing:.2em">小林</div>
    <div class="a abs k900 red" data-in="e1" data-fx="fade" data-out="e3@0.72" style="left:90px;top:${Y.jie + 14}px;font-size:40px;letter-spacing:.2em">阿杰</div>
    <div id="e-cut" class="abs" style="left:${ax(20) - 5}px;top:${Y.lin - 60}px;width:6px;height:${Y.jie - Y.lin + BH + 120}px;background:#ff5a4e;box-shadow:0 0 30px #ff5a4e;opacity:0"></div>
    <div class="a abs k900 red" data-in="e1@0.45" data-fx="fade" data-out="e3@0.72" style="left:${ax(20) - 70}px;top:${Y.lin - 110}px;font-size:34px">45 岁</div>
    <div class="a abs" data-in="e2@0.45" data-fx="pop" data-out="e3@0.72" style="left:${ax(0)}px;top:${Y.lin + BH + 24}px"><span class="k900 gg num" style="font-size:56px">139 万</span><span class="mute" style="font-size:26px;margin-left:14px">不会被裁员的账户</span></div>
    <div class="a abs" data-in="e2@0.6" data-fx="pop" data-out="e3@0.72" style="left:${ax(0)}px;top:${Y.jie + BH + 24}px"><span class="k900 red num" style="font-size:56px">≈ 0</span><span class="mute" style="font-size:26px;margin-left:14px">每月还要付 ¥9,000</span></div>
    <svg id="e-branch" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible"></svg>
    <div id="e-opts"></div>
    <div id="e-chain" class="abs" style="left:${ax(20) + 30}px;top:${Y.jie + 10}px;opacity:0;font-size:30px" ><span class="k900 red">每月 ¥9,000，停不下来</span></div>

    <div class="a ctr serif gg" data-in="e3@0.82" data-fx="slam" data-shake="50" data-out="e4-0.15" style="top:250px;font-size:320px;font-weight:900;line-height:1.2">底气</div>
    <div class="a ctr" data-in="e3.e" data-fx="blur" data-out="e4-0.1" style="top:700px;font-size:44px;color:#efe6d6">一个人还有选择，另一个人没有</div>

    <div class="a ctr" data-in="e4@0.2" data-fx="blur" data-out="e5-0.2" style="top:300px">
      <div class="k700" style="font-size:36px;color:#cfc6b6;margin-bottom:40px">下次花钱之前，问自己一句</div>
      <div class="serif k900" style="font-size:64px;line-height:1.6">这笔钱，是在给未来的自己<span class="gg">留选择</span>，<br>还是在<span class="rg">提前花掉</span>它？</div>
    </div>

    <div class="a ctr k900" data-in="e5-0.1" data-fx="up" style="top:250px;font-size:60px">你更像 ——</div>
    <div class="a ctr" data-in="e5@0.2" data-fx="pop" style="top:380px">
      <span class="e-choice" style="border:4px solid var(--red);color:var(--red)">阿杰</span>
      <span class="e-choice" style="background:linear-gradient(180deg,#ffe08f,#c48a2c);color:#2a1d05">小林</span>
    </div>
    <div class="a ctr k700" data-in="e5@0.6" data-fx="up" style="top:560px;font-size:40px">评论区聊聊 <span class="gold">↓</span></div>
    <div class="a ctr" data-in="e5.e+0.2" data-fx="fade" style="top:680px"><span class="badge" style="font-size:28px;border:1px solid rgba(255,255,255,.25);color:#cfc6b6">「同一个起点，两种人生」 · 第 1 期</span></div>
    <div class="a ctr" data-in="e5.e+0.4" data-fx="fade" style="top:810px;font-size:20px;color:#77736c;line-height:1.7">*人物为虚构案例：每月定投 ¥3,000、假设年化 6% 测算，未计通胀与涨薪；历史数据不代表未来<br>仅为知识科普，不构成任何投资建议，投资有风险</div>
  </section>`,
  setup(ctx) {
    let h = '';
    ['lin', 'jie'].forEach(r => { for (let i = 0; i < N; i++) h += `<div class="e-blk" id="e-${r}-${i}" style="left:${ax(i)}px;top:${Y[r]}px;background:${r === 'lin' ? 'linear-gradient(180deg,#fff1c9,#f2c063 55%,#c48a2c)' : 'linear-gradient(180deg,#ffc2b8,#ff6a5c 55%,#b8322a)'}"></div>`; });
    ctx.$('e-rows').innerHTML = h;
    // 小林：从 45 岁切口长出几条分支（选择）
    const sx = ax(20) + 10, sy = Y.lin + BH / 2;
    let b = '', o = '';
    OPTS.forEach((txt, i) => {
      const ex = sx + 340, ey = sy - 110 + i * 110;
      b += `<path id="e-br${i}" d="M${sx} ${sy} C${sx + 140} ${sy}, ${sx + 160} ${ey}, ${ex} ${ey}" fill="none" stroke="#f2c063" stroke-width="5" stroke-linecap="round" stroke-dasharray="500" stroke-dashoffset="500" style="filter:drop-shadow(0 0 8px rgba(242,192,99,.8))"/>`;
      o += `<div class="e-opt" id="e-op${i}" style="left:${ex + 14}px;top:${ey - 26}px;opacity:0">${txt}</div>`;
    });
    ctx.$('e-branch').innerHTML = b; ctx.$('e-opts').innerHTML = o;
  },
  events(ctx) {
    const { T, P, Core } = ctx;
    ctx.ev(T('e1@0.5'), 'hit', 22); ctx.flash(T('e1@0.5'), .3, .18);
    OPTS.forEach((_, i) => ctx.ev(T('e3@0.2') + i * .25, 'chime', .5));
    ctx.ev(T('e3@0.45'), 'lock');
    const dq = T('e3@0.82');
    ctx.flash(dq, .95, .35); ctx.ring(dq + .15, 960, 470, 1100, '#ffe08f'); ctx.ring(dq + .35, 960, 470, 800, '#ffffff');
    P.burst({ t0: dq + .1, x: 960, y: 470, n: 260, spd: [500, 1900], g: 300, life: [1, 2.4], size: [2, 8], colors: Core.GOLD, seed: 81 });
    ctx.ev(T('e4@0.2'), 'chime', .6);
    P.burst({ t0: T('e5@0.2') + .1, x: 960, y: 420, dx: 300, n: 140, ang: -Math.PI / 2, spread: 2.2, spd: [500, 1300], g: 1100, life: [1.8, 2.8], size: [6, 12], colors: [...Core.GOLD, ...Core.REDS], type: 'confetti', seed: 111, add: false });
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, back, win } = Core;
    if (t < T('e1') - 1) return;
    const rowsA = clamp((t - (T('e1') - .4)) / .5) * (1 - clamp((t - T('e3@0.75')) / .3));
    $('e-rows').style.opacity = rowsA;
    const cutT = T('e1@0.5');
    for (let i = 0; i < N; i++) ['lin', 'jie'].forEach(r => {
      const el = $(`e-${r}-${i}`);
      let op = 1, ty = 0, rot = 0, filt = '';
      if (i < 20) op = .35;
      if (i >= 20 && t > cutT) { const tau = t - cutT - (i - 20) * .02; if (tau > 0) { ty = 800 * tau * tau; rot = (i % 2 ? 1 : -1) * 30 * tau; op = clamp(1 - tau / 1.0); } }
      if (r === 'jie' && i >= 3 && i < 20) filt = 'grayscale(.6) brightness(.45) sepia(1) hue-rotate(-40deg) saturate(3)';
      el.style.opacity = op; el.style.transform = `translateY(${ty}px) rotate(${rot}deg)`; el.style.filter = filt;
    });
    $('e-cut').style.opacity = clamp((t - cutT) / .15) * rowsA;
    $('e-cut').style.transform = `scaleY(${.3 + .7 * back(clamp((t - cutT) / .3))})`;
    OPTS.forEach((_, i) => {
      const k = eo((t - (T('e3@0.2') + i * .25)) / .6);
      $('e-br' + i).setAttribute('stroke-dashoffset', 500 * (1 - k)); $('e-br' + i).style.opacity = rowsA;
      $('e-op' + i).style.opacity = clamp((k - .6) / .4) * rowsA;
    });
    $('e-chain').style.opacity = clamp((t - T('e3@0.45')) / .3) * rowsA;
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const { win } = Core;
    ctx.glow(960, 520, 900, 'rgba(242,175,70,A)', .12 * win(t, T('e1') - .5, ctx.TOTAL + 1));
    Core.drawGodRays(ctx.bgc, 960, 470, t, win(t, T('e3@0.8'), T('e4'), .4));
    return { dust: .3 + .5 * win(t, T('e3@0.8'), ctx.TOTAL + 1) };
  },
});
})();
