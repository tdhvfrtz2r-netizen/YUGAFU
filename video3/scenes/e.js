/* 七、收尾：回到 45 岁 → 小林有几条路可选，阿杰只能先接住第一份 → 差的是还能不能选 = 底气
 *   → 带走的问题：留一条路，还是又加一把锁 → 系列标识「同一个起点，两种人生」+ 互动 */
(() => {
const L = { back: 'e1', paths: 'e2', core: 'e3', ask: 'e4', cta: 'e5' };
const N = 38, X0 = 300, STEP = 40, BW = 34, BH = 80;
const ax = i => X0 + i * STEP;
const Y = { lin: 250, jie: 600 };
const OPTS = ['先歇一歇', '慢慢挑', '转行'];
const LOCK = '<svg viewBox="0 0 20 22" width="16" height="18"><rect x="2" y="9" width="16" height="12" rx="3" fill="#ff5a4e"/><path d="M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9" fill="none" stroke="#ff5a4e" stroke-width="2.6"/></svg>';

Kit.add({
  key: 'e',
  anchors: L,
  keywords: ['一百三十九万', '还能不能选', '底气', '一条路', '一把锁', '评论区'],
  text: '小林阿杰岁先歇一歇慢慢挑转行第一份能接的工作下个月月供底气不只是万还能不能选这笔钱是给以后的自己留一条路还是又加了一把锁同一个起点两种人生你身边多还是评论区聊聊系列第期',
  css: `
  .e-blk{position:absolute;width:${BW}px;height:${BH}px;border-radius:7px}
  .e-lk{position:absolute;width:${BW}px;height:${BH * .7}px;border-radius:0 0 7px 7px;background:rgba(40,8,6,.78);border:2px solid rgba(255,90,78,.85);display:flex;align-items:center;justify-content:center}
  .e-opt{position:absolute;padding:12px 26px;border-radius:30px;border:2px solid rgba(242,192,99,.75);background:rgba(242,192,99,.12);font:900 30px var(--sans);color:#ffe9b8;white-space:nowrap}
  .e-choice{display:inline-block;padding:22px 60px;border-radius:60px;font:900 50px var(--sans);margin:0 24px;letter-spacing:.08em}
  `,
  html: `
  <section class="scene" id="eScene" data-s="${L.back}-0.6" data-e="end">
    <div id="e-stage" class="abs" style="inset:0">
      <div id="e-rows"></div>
      <div class="abs k900 gold" style="left:90px;top:${Y.lin + 14}px;font-size:40px;letter-spacing:.2em">小林</div>
      <div class="abs k900 red" style="left:90px;top:${Y.jie + 14}px;font-size:40px;letter-spacing:.2em">阿杰</div>
      <div id="e-cut" class="abs" style="left:${ax(20) - 5}px;top:${Y.lin - 60}px;width:6px;height:${Y.jie - Y.lin + BH + 120}px;background:#ff5a4e;box-shadow:0 0 30px #ff5a4e;opacity:0"></div>
      <div class="abs k900 red" id="e-45" style="left:${ax(20) - 50}px;top:${Y.lin - 110}px;font-size:34px;opacity:0">45 岁</div>
      <div class="abs" id="e-lin-acct" style="left:${ax(0)}px;top:${Y.lin + BH + 22}px;opacity:0"><span class="k900 gg num" style="font-size:48px">139 万</span><span class="mute" style="font-size:24px;margin-left:12px">能随时动用的钱</span></div>
      <div class="abs" id="e-jie-acct" style="left:${ax(0)}px;top:${Y.jie + BH + 22}px;opacity:0"><span class="k900 red num" style="font-size:44px">每月 ¥7,000</span><span class="mute" style="font-size:24px;margin-left:12px">照样要付</span></div>
      <svg id="e-branch" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible"></svg>
      <div id="e-opts"></div>
      <div id="e-one" class="e-opt" style="left:${ax(20) + 330}px;top:${Y.jie - 96}px;border-color:rgba(255,90,78,.8);background:rgba(255,90,78,.12);color:#ffc2b8;opacity:0">第一份能接的工作</div>
    </div>
    <div id="e-gap" class="ctr" style="top:300px;opacity:0"><div class="k700" style="font-size:44px;color:#cfc6b6">差的不只是 <span class="gold num">139 万</span></div><div class="k900" style="font-size:72px;margin-top:20px">是还能不能选</div></div>
    <div class="a ctr serif gg" data-in="${L.core}@0.86" data-fx="slam" data-shake="50" data-out="${L.ask}-0.15" style="top:250px;font-size:320px;font-weight:900;line-height:1.2">底气</div>

    <div id="e-ask" class="ctr" style="top:230px;opacity:0">
      <div class="k700" style="font-size:36px;color:#cfc6b6;margin-bottom:36px">下次花一笔大钱之前，问问自己</div>
      <div class="serif k900" style="font-size:62px;line-height:1.6">这笔钱，是给以后的自己<span class="gg">留一条路</span>，<br>还是又<span class="rg">加了一把锁</span>？</div>
    </div>
    <svg id="e-ask-svg" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible;opacity:0">
      <path id="e-road" d="M560 760 C760 760 860 700 1000 640" fill="none" stroke="#f2c063" stroke-width="10" stroke-linecap="round" stroke-dasharray="520" stroke-dashoffset="520" style="filter:drop-shadow(0 0 10px rgba(242,192,99,.8))"/>
      <g id="e-lock" transform="translate(1320 700)" opacity="0"><rect x="-44" y="0" width="88" height="68" rx="12" fill="#ff5a4e"/><path id="e-shackle" d="M-26 0 V-20 A26 26 0 0 1 26 -20 V0" fill="none" stroke="#ff5a4e" stroke-width="12"/><circle cx="0" cy="32" r="10" fill="#2a0c09"/></g>
    </svg>

    <div id="e-cta" class="abs" style="inset:0;opacity:0">
      <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
        <circle cx="960" cy="200" r="12" fill="#fff"/>
        <path id="e-sr" d="M960 200 C900 260 760 300 620 330" fill="none" stroke="#ff5a4e" stroke-width="7" stroke-linecap="round" stroke-dasharray="400" stroke-dashoffset="400"/>
        <path id="e-sg" d="M960 200 C1020 260 1160 300 1300 330" fill="none" stroke="#f2c063" stroke-width="7" stroke-linecap="round" stroke-dasharray="400" stroke-dashoffset="400"/>
      </svg>
      <div class="ctr k900" style="top:350px;font-size:58px;letter-spacing:.1em">同一个起点，两种人生</div>
      <div id="e-q" class="ctr k700" style="top:470px;font-size:40px;opacity:0">你身边，谁更多？</div>
      <div id="e-btn" class="ctr" style="top:560px;opacity:0">
        <span class="e-choice" style="border:4px solid var(--red);color:var(--red)">阿杰多</span>
        <span class="e-choice" style="background:linear-gradient(180deg,#ffe08f,#c48a2c);color:#2a1d05">小林多</span>
      </div>
      <div id="e-cm" class="ctr k700" style="top:720px;font-size:36px;opacity:0">评论区聊聊 <span class="gold">↓</span></div>
      <div id="e-disc" class="ctr" style="top:820px;font-size:20px;color:#77736c;line-height:1.7;opacity:0">*剧情为虚构演绎，AI 合成配音；按到手月薪 1 万、每月定投 3,000、假设平均年化 6% 测算，未计通胀与涨薪<br>历史数据不代表未来 · 仅为知识科普，不构成任何投资建议 · 投资有风险</div>
    </div>
  </section>`,
  setup(ctx) {
    let h = '';
    for (let i = 0; i < N; i++) {
      h += `<div class="e-blk" id="e-lin-${i}" style="left:${ax(i)}px;top:${Y.lin}px;background:linear-gradient(180deg,#fff1c9,#f2c063 55%,#c48a2c)"></div>`;
      h += `<div class="e-blk" id="e-jie-${i}" style="left:${ax(i)}px;top:${Y.jie}px;background:linear-gradient(180deg,#ffc2b8,#ff6a5c 55%,#b8322a)"></div>`;
      if (i >= 5 && i < 31) h += `<div class="e-lk" style="left:${ax(i)}px;top:${Y.jie + BH * .3}px">${LOCK}</div>`;
    }
    ctx.$('e-rows').innerHTML = h;
    const sx = ax(20) + 10, sy = Y.lin + BH / 2;
    let b = '', o = '';
    OPTS.forEach((txt, i) => {
      const ex = sx + 300, ey = sy - 100 + i * 100;
      b += `<path id="e-br${i}" d="M${sx} ${sy} C${sx + 130} ${sy}, ${sx + 150} ${ey}, ${ex} ${ey}" fill="none" stroke="#f2c063" stroke-width="5" stroke-linecap="round" stroke-dasharray="460" stroke-dashoffset="460" style="filter:drop-shadow(0 0 8px rgba(242,192,99,.8))"/>`;
      o += `<div class="e-opt" id="e-op${i}" style="left:${ex + 14}px;top:${ey - 28}px;opacity:0">${txt}</div>`;
    });
    const jy = Y.jie + BH / 2;
    b += `<path id="e-brj" d="M${sx} ${jy} C${sx + 120} ${jy}, ${sx + 160} ${Y.jie - 66}, ${sx + 300} ${Y.jie - 66}" fill="none" stroke="#ff5a4e" stroke-width="4" stroke-linecap="round" stroke-dasharray="340" stroke-dashoffset="340"/>`;
    ctx.$('e-branch').innerHTML = b; ctx.$('e-opts').innerHTML = o;
  },
  events(ctx) {
    const { T, P, Core } = ctx;
    ctx.ev(T(L.back + '@0.4'), 'hit', 20); ctx.flash(T(L.back + '@0.4'), .3, .18);
    OPTS.forEach((_, i) => ctx.ev(T(L.paths + '@0.15') + i * .25, 'chime', .45));
    ctx.ev(T(L.paths + '@0.7'), 'lock', .7);
    ctx.ev(T(L.core + '@0.4'), 'whoosh');
    const dq = T(L.core + '@0.86');
    ctx.flash(dq, .95, .35); ctx.ring(dq + .15, 960, 470, 1100, '#ffe08f'); ctx.ring(dq + .35, 960, 470, 800, '#ffffff');
    P.burst({ t0: dq + .1, x: 960, y: 470, n: 260, spd: [500, 1900], g: 300, life: [1, 2.4], size: [2, 8], colors: Core.GOLD, seed: 81 });
    ctx.ev(T(L.ask + '@0.6'), 'chime', .6); ctx.ev(T(L.ask + '@0.88'), 'lock');
    ctx.ev(T(L.cta + '@0.05'), 'whoosh');
    P.burst({ t0: T(L.cta + '@0.45') + .1, x: 960, y: 600, dx: 300, n: 140, ang: -Math.PI / 2, spread: 2.2, spd: [500, 1300], g: 1100, life: [1.8, 2.8], size: [6, 12], colors: [...Core.GOLD, ...Core.REDS], type: 'confetti', seed: 111, add: false });
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, back, win } = Core;
    if (t < T(L.back) - 1) return;
    const stA = clamp((t - (T(L.back) - .4)) / .5) * (1 - clamp((t - T(L.core + '@0.05')) / .4));
    $('e-stage').style.opacity = stA;
    const cutT = T(L.back + '@0.4');
    for (let i = 0; i < N; i++) ['lin', 'jie'].forEach(r => { const el = $(`e-${r}-${i}`); el.style.opacity = i < 20 ? .35 : (t > cutT ? .25 : 1); });
    $('e-cut').style.opacity = clamp((t - cutT) / .15); $('e-cut').style.transform = `scaleY(${.3 + .7 * back(clamp((t - cutT) / .3))})`;
    $('e-45').style.opacity = clamp((t - cutT) / .3);
    $('e-lin-acct').style.opacity = clamp((t - T(L.paths)) / .4); $('e-jie-acct').style.opacity = clamp((t - T(L.paths + '@0.55')) / .4);
    OPTS.forEach((_, i) => { const k = eo((t - (T(L.paths + '@0.15') + i * .25)) / .6); $('e-br' + i).setAttribute('stroke-dashoffset', 460 * (1 - k)); $('e-op' + i).style.opacity = clamp((k - .6) / .4); });
    const kj = eo((t - T(L.paths + '@0.62')) / .6);
    $('e-brj').setAttribute('stroke-dashoffset', 340 * (1 - kj)); $('e-one').style.opacity = clamp((kj - .6) / .4);
    // 差的是还能不能选
    $('e-gap').style.opacity = win(t, T(L.core + '@0.08'), T(L.core + '@0.8'), .3);
    // 带走的问题
    const ak = win(t, T(L.ask) - .1, T(L.cta) - .3, .4);
    $('e-ask').style.opacity = ak; $('e-ask-svg').style.opacity = ak;
    $('e-road').setAttribute('stroke-dashoffset', 520 * (1 - eo((t - T(L.ask + '@0.58')) / .8)));
    const lk = t - T(L.ask + '@0.88');
    $('e-lock').setAttribute('opacity', clamp((t - T(L.ask + '@0.8')) / .2));
    $('e-shackle').setAttribute('transform', `translate(0 ${lk > 0 ? 0 : -18})`);
    $('e-lock').setAttribute('transform', `translate(1320 700) scale(${lk > 0 ? 1 + .3 * Math.max(0, 1 - lk / .2) : 1})`);
    // 系列标识 + 互动
    const ck = clamp((t - (T(L.cta) - .2)) / .4);
    $('e-cta').style.opacity = ck;
    const sk = eo((t - T(L.cta)) / .9);
    $('e-sr').setAttribute('stroke-dashoffset', 400 * (1 - sk)); $('e-sg').setAttribute('stroke-dashoffset', 400 * (1 - sk));
    $('e-q').style.opacity = clamp((t - T(L.cta + '@0.35')) / .3);
    const bk = clamp((t - T(L.cta + '@0.45')) / .35); $('e-btn').style.opacity = bk; $('e-btn').style.transform = `scale(${.6 + .4 * back(bk)})`;
    $('e-cm').style.opacity = clamp((t - T(L.cta + '@0.8')) / .3);
    $('e-disc').style.opacity = clamp((t - T(L.cta + '.e')) / .5);
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const { win } = Core;
    ctx.glow(960, 520, 900, 'rgba(242,175,70,A)', .12 * win(t, T(L.back) - .5, ctx.TOTAL + 1));
    Core.drawGodRays(ctx.bgc, 960, 470, t, win(t, T(L.core + '@0.84'), T(L.ask), .4));
    return { dust: .3 + .5 * win(t, T(L.core + '@0.84'), ctx.TOTAL + 1) };
  },
});
})();
