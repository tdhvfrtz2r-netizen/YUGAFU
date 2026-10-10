/* 一、冷开场：45 岁同一天被裁，一个看账单，一个松了口气 → 差 139 万 → 倒带回 25 岁 */
(() => {
const RW = ['o5', 'w1-0.5'];   // 倒带区间
Kit.add({
  key: 'o',
  keywords: ['裁员', '一百三十九万', '二十年后'],
  text: '45岁25岁REWIND',
  css: `
  .o-half{position:absolute;top:0;height:1080px;width:960px}
  .o-bill{position:absolute;left:470px;width:440px;height:96px;padding:0 24px;border-radius:20px;background:rgba(40,40,46,.85);border:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:16px;font-size:28px;box-shadow:0 14px 34px rgba(0,0,0,.45)}
  .o-bill .ic{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font:900 22px var(--sans)}
  .o-bill .am{margin-left:auto;font-weight:900;color:#ff8a80;font-size:36px}
  .o-bill .mt{color:#9a958d;font-size:22px}
  .o-bank{position:absolute;left:60px;top:400px;width:440px;height:330px;border-radius:30px;background:linear-gradient(160deg,#2a2418,#14120c);border:1px solid rgba(242,192,99,.35);padding:34px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
  #o-osd{position:absolute;left:90px;top:70px;font:900 54px var(--sans);letter-spacing:.12em;color:#fff;text-shadow:3px 0 rgba(255,0,90,.7),-3px 0 rgba(0,240,255,.7)}
  `,
  html: `
  <section class="scene" id="oScene" data-s="0" data-e="w1-0.45">
    <div class="a ctr tag" data-in="0.25" data-out="o4" style="top:72px">45 岁 · 一个普通的周一 · 上午 9:30</div>
    <div id="o-both" class="abs" style="inset:0">
      <div class="o-half" id="o-L" style="left:0">
        <div class="a person" data-in="o1" data-fx="up" data-person="#ff5a4e" style="left:150px;top:500px"></div>
        <div class="a name red" data-in="o1+0.2" style="left:130px;top:892px">阿杰 · 45岁</div>
        <div class="a note glitch" data-in="o1@0.78" data-fx="drop" style="left:470px;top:150px"><div class="ic" style="background:#d4372c">HR</div><div class="tx"><div class="tt"><span>人事通知</span><span>刚刚</span></div><div class="bd">您的岗位已被<em>优化</em></div></div></div>
        <div class="a o-bill" data-in="o2@0.3" data-fx="drop" style="top:290px"><div class="ic" style="background:#3a6fd8">房</div>房贷 <span class="mt">3 天后扣款</span><span class="am">¥5,200</span></div>
        <div class="a o-bill" data-in="o2@0.48" data-fx="drop" style="top:400px"><div class="ic" style="background:#2b9b6b">车</div>车贷 <span class="mt">5 天后扣款</span><span class="am">¥2,300</span></div>
        <div class="a o-bill" data-in="o2@0.66" data-fx="drop" style="top:510px"><div class="ic" style="background:#8a4fd8">分</div>消费分期 <span class="mt">待还</span><span class="am">¥1,500</span></div>
        <div class="a abs" data-in="o2@0.86" data-fx="slam" data-shake="10" style="left:470px;top:630px;width:440px;text-align:center">
          <span style="font-size:24px;color:#ff8a80;letter-spacing:.2em">每月必须付出</span><span class="k900 red num" style="font-size:60px;margin-left:16px">¥9,000</span></div>
      </div>
      <div class="o-half" id="o-R" style="left:960px">
        <div class="a person" data-in="o1+0.15" data-fx="up" data-person="#f2c063" data-smile="o3@0.6" style="left:550px;top:500px"></div>
        <div class="a name gold" data-in="o1+0.35" style="left:530px;top:892px">小林 · 45岁</div>
        <div class="a note glitch" data-in="o1@0.82" data-fx="drop" style="left:60px;top:150px"><div class="ic" style="background:#d4372c">HR</div><div class="tx"><div class="tt"><span>人事通知</span><span>刚刚</span></div><div class="bd">您的岗位已被<em>优化</em></div></div></div>
        <div class="a o-bank" data-in="o3@0.2" data-fx="up">
          <div style="font-size:24px;color:#c9b48a;letter-spacing:.2em">我的账户 · 总资产</div>
          <div class="k900 gg" style="font-size:76px;margin-top:40px;letter-spacing:.08em">¥ ● ● ● ● ●</div>
          <div style="font-size:22px;color:#8e7f62;margin-top:46px">每月定投 · 已坚持 20 年</div>
        </div>
      </div>
      <div class="a abs" data-in="o1" data-fx="fade" style="left:958px;top:80px;width:4px;height:900px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.45),transparent)"></div>
    </div>
    <div class="a ctr k700" data-in="o4" data-fx="up" style="top:250px;font-size:56px;letter-spacing:.1em">同样月薪 <span class="gold num">¥10,000</span></div>
    <div class="a ctr k700" data-in="o4@0.3" data-fx="up" style="top:350px;font-size:56px;letter-spacing:.1em">20 年后，差了</div>
    <div class="a ctr k900 gg num" data-in="o4@0.66" data-fx="slam" data-shake="34" style="top:440px;font-size:230px;line-height:1.1">139 万</div>
    <div class="a ctr k900" data-in="o5" data-fx="up" data-out="o5.e+0.2" style="top:740px;font-size:60px">差距，是怎么来的？</div>
    <div class="ctr" id="o-ageBox" style="top:300px;opacity:0">
      <div class="k900 num" style="font-size:300px;line-height:1"><span id="o-age">45</span><span style="font-size:90px;margin-left:10px">岁</span></div>
      <div class="tag" style="margin-top:20px;font-size:34px;color:#fff">回到 20 年前</div>
    </div>
    <div id="o-osd" style="opacity:0">◀◀ REWIND</div>
  </section>`,
  setup(ctx) { this.gl = [...document.querySelectorAll('#oScene .glitch')].map(el => ({ el, t0: ctx.T(el.dataset.in) })); },
  events(ctx) {
    const { T, P, Core } = ctx, hit = T('o4@0.66') + .2;
    P.burst({ t0: hit, x: 960, y: 560, n: 170, spd: [400, 1500], g: 500, life: [.9, 2], size: [2, 7], colors: Core.GOLD, seed: 11 });
    ctx.ring(hit, 960, 560, 900); ctx.flash(hit, .55, .25);
    ctx.ev(T('o3@0.6'), 'chime');
    ctx.ev(0.2, 'heartbeat'); ctx.ev(1.2, 'heartbeat'); ctx.ev(2.2, 'heartbeat', .8);
    ctx.ev(T(RW[0]), 'rewind', T(RW[1]) - T(RW[0]));
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx;
    if (t > T('w1')) return;
    const { win, clamp, eio, eo, rng } = Core;
    const dimL = win(t, T('o3'), T('o4') + .2, .4) * .7, dimR = win(t, T('o2'), T('o3'), .4) * .7, dimAll = clamp((t - T('o4')) / .5) * .9;
    $('o-L').style.opacity = 1 - Math.max(dimL, dimAll); $('o-R').style.opacity = 1 - Math.max(dimR, dimAll);
    $('o-both').style.filter = dimAll > .01 ? `blur(${dimAll * 10}px)` : '';
    this.gl.forEach(g => { const k = t - g.t0; if (k > 0 && k < .55) { const r = rng(Math.floor(t * 30) + 3)(); g.el.style.transform = `translateX(${(r - .5) * 40}px) skewX(${(r - .5) * 12}deg)`; g.el.style.filter = `drop-shadow(${6 * r}px 0 rgba(255,0,80,.9)) drop-shadow(${-6 * r}px 0 rgba(0,240,255,.9))`; } });
    document.querySelectorAll('#oScene .smile').forEach(s => s.setAttribute('stroke-dashoffset', 80 * (1 - eo((t - T('o3@0.6')) / .6))));
    // 倒带：139 万淡出 → 年龄 45 → 25
    const r0 = T(RW[0]) + .9, r1 = T(RW[1]);
    const rk = win(t, r0, r1 + .3, .2);
    $('o-ageBox').style.opacity = rk; $('o-osd').style.opacity = rk * (Math.floor(t * 3) % 2 ? 1 : .35);
    $('o-age').textContent = Math.round(45 - 20 * eio((t - r0) / (r1 - r0 - .2)));
    document.querySelectorAll('#oScene [data-in^="o4"]').forEach(el => { if (t > r0 - .2) el.style.opacity = Math.max(0, 1 - (t - r0 + .2) / .3); });
  },
  bg(t, ctx) {
    const { T, Core } = ctx, { win } = Core;
    const split = win(t, T('o1') - .5, T('o4') + .3);
    const fL = 1 + win(t, T('o2'), T('o3')) * 1.2 - win(t, T('o3'), T('o4')) * .7, fR = 1 + win(t, T('o3'), T('o4')) * 1.2 - win(t, T('o2'), T('o3')) * .7;
    ctx.glow(420, 620, 820, 'rgba(255,70,55,A)', .16 * split * fL);
    ctx.glow(1500, 620, 820, 'rgba(242,180,80,A)', .16 * split * fR);
    ctx.glow(960, 520, 900, 'rgba(242,175,70,A)', .2 * win(t, T('o4@0.66'), T('o5') + .8));
  },
  fx(t, ctx) {
    const { T, Core } = ctx; const k = Core.win(t, T(RW[0]) + .8, T(RW[1]) + .3, .2);
    Core.drawRewindBands(ctx.fxc, t, k, 1920, 1080);
  },
  worldFilter(t, ctx) {
    const { T, Core } = ctx; const k = Core.win(t, T(RW[0]) + .8, T(RW[1]) + .3, .2);
    return k ? `saturate(${1 - .6 * k}) contrast(${1 + .25 * k}) hue-rotate(${-20 * k}deg)` : '';
  },
});
})();
