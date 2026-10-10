/* 六、为什么阿杰很常见：剩不下闲钱不全怪他们；花钱的痛感被设计得越来越小（信用卡实验）；免息分期把付钱推到后面那几格工资上 */
(() => {
const L = { why: 's1', pain: 's2', exp: 's3', push: 's4', next: 'e1' };
const STOPS = [['现金', '一张张数出去'], ['刷卡', '签个名'], ['扫码', '按一下'], ['先用后付', '下个月再说']];
const N = 24, X0 = 380, STEP = 48, BW = 40, BH = 90, RY = 560;
const ax = i => X0 + i * STEP;
const LOCK = '<svg viewBox="0 0 20 22" width="20" height="22"><rect x="2" y="9" width="16" height="12" rx="3" fill="#ff5a4e"/><path d="M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9" fill="none" stroke="#ff5a4e" stroke-width="2.6"/></svg>';
const POPS = [['免息', 4, '@0.08'], ['分期 12 期', 9, '@0.2'], ['先用后付', 15, '@0.32']];

Kit.add({
  key: 's',
  anchors: L,
  keywords: ['闲钱', '痛感', '被设计', '两倍', '往后推'],
  text: '现金一张张数出去刷卡签个名扫码按一下先用后付下个月再说花钱的痛感被设计现金组刷卡组平均出价倍小样本拍卖实验免息分期期付钱那一下后面那几格工资剩不下闲钱',
  css: `
  .s-stop{position:absolute;top:560px;width:260px;text-align:center;transform:translateX(-50%)}
  .s-room{position:absolute;top:300px;width:620px;height:520px;border-radius:26px;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.03)}
  .s-pop{position:absolute;padding:14px 28px;border-radius:16px;background:#2a2b30;border:1px solid rgba(255,255,255,.14);font:900 34px var(--sans);box-shadow:0 14px 40px rgba(0,0,0,.6);white-space:nowrap}
  .s-blk{position:absolute;top:${RY}px;width:${BW}px;height:${BH}px;border-radius:7px;background:linear-gradient(180deg,#ffd0c9,#ff7a6c 55%,#c43d33)}
  .s-lk{position:absolute;top:${RY + BH * .3}px;width:${BW}px;height:${BH * .7}px;border-radius:0 0 7px 7px;background:rgba(40,8,6,.78);border:2px solid rgba(255,90,78,.85);display:flex;align-items:center;justify-content:center}
  `,
  html: `
  <section class="scene" id="sScene" data-s="${L.why}-0.6" data-e="${L.next}-0.45">
    <div id="s-intro" class="abs" style="inset:0">
      <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
        <g id="s-wallet" transform="translate(960 380)" opacity="0">
          <rect x="-140" y="-90" width="280" height="180" rx="22" fill="rgba(255,255,255,.04)" stroke="#e9e4da" stroke-width="8"/>
          <path d="M60 -30 H150 V30 H60 Q40 30 40 0 Q40 -30 60 -30 Z" fill="none" stroke="#e9e4da" stroke-width="7"/>
          <circle cx="72" cy="0" r="8" fill="#e9e4da"/>
        </g>
      </svg>
      <div id="s-wallet-l" class="ctr k900" style="top:520px;font-size:46px;opacity:0">每个月，<span class="red">剩不下</span>闲钱</div>
      <div id="s-crowd"></div>
      <div id="s-notall" class="ctr k700" style="top:150px;font-size:44px;opacity:0">这不全怪他们</div>
    </div>

    <div id="s-pain" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:170px;font-size:54px">花钱的<span class="red">痛感</span>，被设计得越来越小</div>
      <div class="abs" style="left:300px;top:470px;width:1320px;height:12px;border-radius:6px;background:linear-gradient(90deg,#ff5a4e,#ff5a4e 20%,#8e8a83 100%)"></div>
      <div id="s-knob" class="abs" style="top:446px;width:60px;height:60px;border-radius:50%;background:#fff;box-shadow:0 0 30px rgba(255,255,255,.6)"></div>
      ${STOPS.map((s, i) => `<div class="s-stop" id="s-st${i}" style="left:${300 + i * 440}px;opacity:0"><div class="k900" style="font-size:42px">${s[0]}</div><div class="mute" style="font-size:26px;margin-top:8px">${s[1]}</div></div>`).join('')}
      <div id="s-painlab" class="abs k900 red" style="top:360px;font-size:34px;transform:translateX(-50%)">痛</div>
    </div>

    <div id="s-auc" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:120px;font-size:48px">拍卖同一场球赛的门票，两组人分开出价</div>
      <div class="ctr mute" style="top:190px;font-size:24px">经典的小样本实验 · Prelec &amp; Simester, 2001 · 麻省理工</div>
      <div class="s-room" style="left:260px"><div class="ctr k900" style="top:30px;font-size:40px">现金组</div><div class="ctr mute" style="top:88px;font-size:24px">只能付现金</div></div>
      <div class="s-room" style="left:1040px;border-color:rgba(242,192,99,.5)"><div class="ctr k900 gold" style="top:30px;font-size:40px">刷卡组</div><div class="ctr mute" style="top:88px;font-size:24px">可以刷信用卡</div></div>
      <div class="abs" style="left:330px;top:740px;width:480px;height:3px;background:rgba(255,255,255,.35)"></div>
      <div class="abs" style="left:1110px;top:740px;width:480px;height:3px;background:rgba(255,255,255,.35)"></div>
      <div id="s-b1" class="abs" style="left:470px;width:200px;height:0;top:740px;border-radius:12px 12px 0 0;background:linear-gradient(0deg,#5d6f8a,#8aa0c2)"></div>
      <div id="s-b2" class="abs" style="left:1250px;width:200px;height:0;top:740px;border-radius:12px 12px 0 0;background:linear-gradient(0deg,#c48a2c,#ffe08f);box-shadow:0 0 30px rgba(242,192,99,.5)"></div>
      <div id="s-v1" class="abs k900 num" style="left:420px;width:300px;text-align:center;font-size:52px;opacity:0">1 倍</div>
      <div id="s-v2" class="abs k900 gg num" style="left:1200px;width:300px;text-align:center;font-size:52px;opacity:0">≈ 2 倍</div>
      <div class="abs mute" style="left:420px;top:760px;width:300px;text-align:center;font-size:24px">平均出价</div>
      <div class="abs mute" style="left:1200px;top:760px;width:300px;text-align:center;font-size:24px">平均出价</div>
    </div>

    <div id="s-push" class="abs" style="inset:0;opacity:0">
      <div class="ctr k900" style="top:130px;font-size:50px">把付钱那一下，往后推</div>
      <div id="s-rows"></div>
      <div class="abs" style="left:${ax(0)}px;top:${RY + BH + 14}px;font-size:24px;color:#8e8a83">现在</div>
      <div class="abs" style="left:${ax(N - 1) - 60}px;top:${RY + BH + 14}px;font-size:24px;color:#8e8a83">以后的工资</div>
      <div id="s-pops"></div>
    </div>
  </section>`,
  setup(ctx) {
    let h = '';
    for (let i = 0; i < 14; i++) { const x = 140 + i * 120, y = 640 + (i % 2) * 60; h += `<div class="person" id="s-pp${i}" data-person="#ff5a4e" style="left:${x}px;top:${y}px;transform:scale(.42);opacity:0"></div>`; }
    ctx.$('s-crowd').innerHTML = h;
    let r = '';
    for (let i = 0; i < N; i++) r += `<div class="s-blk" style="left:${ax(i)}px"></div>`;
    POPS.forEach(([, at], k) => { for (let j = 0; j < 4; j++) r += `<div class="s-lk" id="s-lk${k}-${j}" style="left:${ax(at + j)}px;opacity:0">${LOCK}</div>`; });
    ctx.$('s-rows').innerHTML = r;
    ctx.$('s-pops').innerHTML = POPS.map(([txt, at], k) => `<div class="s-pop" id="s-pop${k}" style="left:${ax(at) - 30}px;top:${300 + (k % 2) * 70}px;opacity:0">${txt}</div>`).join('');
  },
  events(ctx) {
    const { T } = ctx;
    ctx.ev(T(L.why + '@0.1'), 'pop');
    for (let i = 0; i < 14; i += 2) ctx.ev(T(L.why + '@0.5') + i * .06, 'pop', .5);
    ctx.ev(T(L.pain) - .1, 'whoosh');
    STOPS.forEach((_, i) => ctx.ev(T(L.pain + '@0.2') + i * .4, 'tick'));
    ctx.ev(T(L.exp) - .1, 'whoosh'); ctx.ev(T(L.exp + '@0.6'), 'fill', 1); ctx.ev(T(L.exp + '@0.92'), 'hit', 14);
    ctx.ev(T(L.push) - .1, 'whoosh');
    POPS.forEach(([, , at]) => { ctx.ev(T(L.push + at), 'pop'); ctx.ev(T(L.push + at) + .5, 'lock', .7); });
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, eio, win, back } = Core;
    if (t < T(L.why) - 1 || t > T(L.next)) return;
    const ia = win(t, T(L.why) - .3, T(L.pain) - .1, .35); $('s-intro').style.opacity = ia;
    $('s-wallet').setAttribute('opacity', clamp((t - T(L.why)) / .3) * (1 - .6 * clamp((t - T(L.why + '@0.5')) / .4)));
    $('s-wallet').setAttribute('transform', `translate(960 380) rotate(${Math.sin(t * 9) * 4 * clamp((t - T(L.why) - .2) / .3) * (1 - clamp((t - T(L.why) - 1) / .3))})`);
    $('s-wallet-l').style.opacity = clamp((t - T(L.why + '@0.15')) / .3) * (1 - clamp((t - T(L.why + '@0.5')) / .3));
    for (let i = 0; i < 14; i++) { const el = $('s-pp' + i), k = eo((t - T(L.why + '@0.5') - i * .06) / .4); el.style.opacity = k; el.style.transform = `scale(.42) translateY(${(1 - k) * 60}px)`; }
    $('s-notall').style.opacity = clamp((t - T(L.why + '@0.6')) / .3);
    // 痛感刻度
    const pa = win(t, T(L.pain) - .1, T(L.exp) - .1, .3); $('s-pain').style.opacity = pa;
    const kk = clamp((t - T(L.pain + '@0.2')) / 1.6), x = 300 + eio(kk) * 1320;
    $('s-knob').style.left = (x - 30) + 'px';
    $('s-painlab').style.left = x + 'px'; $('s-painlab').style.fontSize = (34 + 70 * (1 - kk) * (1 - kk)) + 'px'; $('s-painlab').style.top = (360 - 60 * (1 - kk)) + 'px'; $('s-painlab').style.opacity = 1 - .7 * kk;
    STOPS.forEach((_, i) => { $('s-st' + i).style.opacity = clamp((t - T(L.pain + '@0.2') - i * .4) / .3); });
    // 两组分开出价
    const au = win(t, T(L.exp) - .1, T(L.push) - .1, .3); $('s-auc').style.opacity = au;
    const h1 = 180 * eo((t - T(L.exp + '@0.55')) / .8), h2 = 360 * eo((t - T(L.exp + '@0.6')) / 1.4);
    $('s-b1').style.height = h1 + 'px'; $('s-b1').style.top = (740 - h1) + 'px';
    $('s-b2').style.height = h2 + 'px'; $('s-b2').style.top = (740 - h2) + 'px';
    $('s-v1').style.top = (740 - h1 - 70) + 'px'; $('s-v2').style.top = (740 - h2 - 70) + 'px';
    $('s-v1').style.opacity = clamp((t - T(L.exp + '@0.62')) / .3); $('s-v2').style.opacity = clamp((t - T(L.exp + '@0.9')) / .3);
    // 推到后面的工资上
    const pu = win(t, T(L.push) - .1, T(L.next) - .3, .3); $('s-push').style.opacity = pu;
    POPS.forEach(([, at, k0], k) => {
      const t0 = T(L.push + k0), pk = clamp((t - t0) / .3);
      $('s-pop' + k).style.opacity = pk; $('s-pop' + k).style.transform = `scale(${.5 + .5 * back(pk)})`;
      for (let j = 0; j < 4; j++) { const lk = $(`s-lk${k}-${j}`), q = t - t0 - .45 - j * .08; lk.style.opacity = q > 0 ? 1 : 0; lk.style.transform = `scale(${q > 0 ? 1 + .6 * Math.max(0, 1 - q / .2) : 1})`; }
    });
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T(L.why) - .5, T(L.next) - .4);
    ctx.glow(960, 520, 900, 'rgba(255,70,55,A)', .08 * w);
  },
});
})();
