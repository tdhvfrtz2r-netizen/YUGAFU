/* 六、为什么阿杰很常见：花钱的痛感在变小（信用卡实验），付钱的那一刻被推到以后 */
(() => {
const STOPS = [['现金', '一张张数出去'], ['刷卡', '签个名'], ['扫码', '按一下'], ['先用后付', '下个月再说']];
Kit.add({
  key: 's',
  keywords: ['痛感', '两倍', '推到以后', '信用卡'],
  text: '现金一张张数出去刷卡签个名扫码按一下先用后付下个月再说花钱的痛感出价分期免息付钱的那一刻现在以后麻省理工',
  css: `
  .s-stop{position:absolute;top:560px;width:260px;text-align:center;transform:translateX(-50%)}
  .s-pop{position:absolute;padding:14px 30px;border-radius:16px;background:#2a2b30;border:1px solid rgba(255,255,255,.12);font:900 36px var(--sans);box-shadow:0 14px 40px rgba(0,0,0,.6)}
  `,
  html: `
  <section class="scene" id="sScene" data-s="s1-0.6" data-e="e1-0.45">
    <div id="s-crowd" class="abs" style="inset:0"></div>
    <div class="a ctr k900" data-in="s1@0.3" data-fx="up" data-out="s2-0.2" style="top:150px;font-size:58px">为什么，<span class="red">阿杰</span>这样的选择这么常见？</div>

    <div id="s-pain" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:170px;font-size:54px">花钱的<span class="red">痛感</span>，正在变小</div>
      <div class="abs" style="left:300px;top:470px;width:1320px;height:12px;border-radius:6px;background:linear-gradient(90deg,#ff5a4e,#ff5a4e 20%,#8e8a83 100%)"></div>
      <div id="s-knob" class="abs" style="top:446px;width:60px;height:60px;border-radius:50%;background:#fff;box-shadow:0 0 30px rgba(255,255,255,.6)"></div>
      ${STOPS.map((s, i) => `<div class="s-stop" id="s-st${i}" style="left:${300 + i * 440}px;opacity:0"><div class="k900" style="font-size:42px">${s[0]}</div><div class="mute" style="font-size:26px;margin-top:8px">${s[1]}</div></div>`).join('')}
      <div id="s-painlab" class="abs k900 red" style="top:360px;font-size:34px;transform:translateX(-50%)">痛</div>
    </div>

    <div id="s-auc" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:150px;font-size:50px">同一场球赛的门票，你愿意出多少钱？</div>
      <div class="ctr mute" style="top:220px;font-size:24px">麻省理工实验 · Prelec &amp; Simester, 2001</div>
      <div class="abs k900" style="left:300px;top:400px;font-size:40px;width:260px">现金</div>
      <div class="abs k900 gold" style="left:300px;top:580px;font-size:40px;width:260px">信用卡</div>
      <div class="abs" style="left:560px;top:395px;width:1100px;height:70px;border-radius:12px;background:rgba(255,255,255,.05)"></div>
      <div class="abs" style="left:560px;top:575px;width:1100px;height:70px;border-radius:12px;background:rgba(255,255,255,.05)"></div>
      <div id="s-b1" class="abs" style="left:560px;top:395px;height:70px;width:0;border-radius:12px;background:linear-gradient(90deg,#5d6f8a,#8aa0c2)"></div>
      <div id="s-b2" class="abs" style="left:560px;top:575px;height:70px;width:0;border-radius:12px;background:linear-gradient(90deg,#c48a2c,#ffe08f);box-shadow:0 0 30px rgba(242,192,99,.5)"></div>
      <div id="s-v1" class="abs k900 num" style="top:398px;font-size:52px">1 倍</div>
      <div id="s-v2" class="abs k900 gg num" style="top:578px;font-size:52px">≈ 2 倍</div>
    </div>

    <div id="s-time" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:150px;font-size:50px">把"付钱的那一刻"，推到以后</div>
      <div class="abs" style="left:240px;top:620px;width:1440px;height:6px;background:rgba(255,255,255,.35)"></div>
      <div class="abs k700" style="left:200px;top:660px;font-size:30px">现在</div><div class="abs k700 mute" style="left:1620px;top:660px;font-size:30px">以后</div>
      <div id="s-pay" class="abs" style="top:560px;transform:translateX(-50%);text-align:center"><div class="k900 red" style="font-size:34px;white-space:nowrap">付钱的那一刻</div><div style="width:6px;height:60px;background:#ff5a4e;margin:6px auto 0;box-shadow:0 0 20px #ff5a4e"></div></div>
      <div id="s-buy" class="abs" style="left:300px;top:700px;text-align:center;transform:translateX(-50%)"><div style="width:6px;height:40px;background:#f2c063;margin:0 auto"></div><div class="k900 gold" style="font-size:30px">买下的那一刻</div></div>
      <div class="a s-pop" data-in="s4@0.05" data-fx="pop" style="left:430px;top:330px">分期 <span class="red">12 期</span></div>
      <div class="a s-pop" data-in="s4@0.18" data-fx="pop" style="left:820px;top:290px">免息</div>
      <div class="a s-pop" data-in="s4@0.3" data-fx="pop" style="left:1110px;top:350px">先用后付</div>
    </div>
  </section>`,
  setup(ctx) {
    let h = '';
    for (let i = 0; i < 14; i++) { const x = 140 + i * 120, y = 420 + (i % 2) * 70; h += `<div class="person s-pp" id="s-pp${i}" data-person="#ff5a4e" style="left:${x}px;top:${y}px;transform:scale(.45);opacity:0"></div>`; }
    ctx.$('s-crowd').innerHTML = h;
  },
  events(ctx) {
    const { T } = ctx;
    for (let i = 0; i < 14; i += 2) ctx.ev(T('s1@0.2') + i * .07, 'pop', .6);
    ctx.ev(T('s2') - .1, 'whoosh');
    STOPS.forEach((_, i) => ctx.ev(T('s2@0.35') + i * .45, 'tick'));
    ctx.ev(T('s3') - .1, 'whoosh'); ctx.ev(T('s3@0.6'), 'fill', 1); ctx.ev(T('s3@0.9'), 'hit', 14);
    ctx.ev(T('s4') - .1, 'whoosh');
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, win } = Core;
    if (t < T('s1') - 1 || t > T('e1')) return;
    const cr = win(t, T('s1') - .3, T('s2') - .1, .35);
    $('s-crowd').style.opacity = cr;
    for (let i = 0; i < 14; i++) { const el = $('s-pp' + i), k = eo((t - T('s1@0.2') - i * .07) / .4); el.style.opacity = k; el.style.transform = `scale(.45) translateY(${(1 - k) * 60}px)`; }
    // 痛感刻度
    const pa = win(t, T('s2') - .1, T('s3') - .1, .35); $('s-pain').style.opacity = pa;
    const kk = clamp((t - T('s2@0.35')) / 1.6) * 3, x = 300 + eio(kk / 3) * 1320;
    $('s-knob').style.left = (x - 30) + 'px';
    $('s-painlab').style.left = x + 'px'; $('s-painlab').style.fontSize = (34 + 70 * (1 - kk / 3) * (1 - kk / 3)) + 'px'; $('s-painlab').style.top = (360 - 60 * (1 - kk / 3)) + 'px';
    $('s-painlab').style.opacity = 1 - .7 * kk / 3;
    STOPS.forEach((_, i) => { $('s-st' + i).style.opacity = clamp((t - T('s2@0.35') - i * .45) / .3); });
    // 竞价
    const au = win(t, T('s3') - .1, T('s4') - .1, .35); $('s-auc').style.opacity = au;
    const w1 = 440 * eo((t - T('s3@0.5')) / .9), w2 = 820 * eo((t - T('s3@0.55')) / 1.6);
    $('s-b1').style.width = w1 + 'px'; $('s-b2').style.width = w2 + 'px';
    $('s-v1').style.left = (580 + w1) + 'px'; $('s-v2').style.left = (580 + w2) + 'px';
    $('s-v1').style.opacity = clamp((t - T('s3@0.5')) / .3); $('s-v2').style.opacity = clamp((t - T('s3@0.88')) / .3);
    // 时间轴
    const ti = win(t, T('s4') - .1, T('e1') - .3, .35); $('s-time').style.opacity = ti;
    const px = 300 + 1250 * eio(clamp((t - T('s4@0.1')) / (T('s4@0.75') - T('s4@0.1'))));
    $('s-pay').style.left = px + 'px';
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T('s1') - .5, T('e1') - .4);
    ctx.glow(960, 520, 900, 'rgba(255,70,55,A)', .08 * w);
  },
});
})();
