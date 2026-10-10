/* 三、阿杰的水池：进水是工资，出水是房贷车贷分期；收入停了，出水不停 */
(() => {
const TX = 520, TY = 300, TW = 560, TH = 500;       // 水池
const PIPES = [
  { y: 560, label: '房贷', amt: '¥5,200', w: 10 },
  { y: 680, label: '车贷', amt: '¥2,300', w: 7 },
  { y: 790, label: '分期', amt: '¥1,500', w: 5 },
];
const PX = TX + TW, LX = 1360;                      // 出水管从池壁到标签
let ctxRef;

Kit.add({
  key: 'j',
  keywords: ['水池', '不会停', '见底', '必须付出去'],
  text: '阿杰每个月的钱工资房贷车贷分期还能撑天收入停了它们不会停每月必须付出',
  css: `
  .j-lab{position:absolute;left:${LX + 30}px;font-size:34px;font-weight:700;display:flex;align-items:center;gap:18px}
  .j-lab b{font-weight:900;color:#ff8a80;font-size:40px}
  .j-lock{position:absolute;width:46px;height:52px;opacity:0}
  `,
  html: `
  <section class="scene" id="jScene" data-s="j1-0.6" data-e="x1-0.45">
    <div class="a ctr k900" data-in="j1" data-fx="up" style="top:80px;font-size:56px"><span class="red">阿杰</span>每个月的钱</div>
    <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
      <defs>
        <clipPath id="j-clip"><rect x="${TX + 8}" y="${TY}" width="${TW - 16}" height="${TH - 8}" rx="18"/></clipPath>
        <linearGradient id="j-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4ff" stop-opacity=".9"/><stop offset="1" stop-color="#2d5fb8" stop-opacity=".9"/></linearGradient>
        <linearGradient id="j-waterR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a80" stop-opacity=".9"/><stop offset="1" stop-color="#8a2019" stop-opacity=".9"/></linearGradient>
      </defs>
      <g id="j-tank" opacity="0">
        <rect x="${TX}" y="${TY - 20}" width="${TW}" height="${TH + 20}" rx="24" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" stroke-width="6"/>
        <g clip-path="url(#j-clip)"><path id="j-wat" fill="url(#j-water)"/><path id="j-wat2" fill="rgba(255,255,255,.12)"/></g>
      </g>
      <g id="j-tap" opacity="0">
        <path d="M${TX + 120} 150 L${TX + 120} 205 Q${TX + 120} 225 ${TX + 140} 225 L${TX + 175} 225" fill="none" stroke="#c9ccd6" stroke-width="22" stroke-linecap="round"/>
        <rect x="${TX + 95}" y="130" width="50" height="22" rx="8" fill="#c9ccd6"/>
        <rect id="j-stream" x="${TX + 165}" y="236" width="20" height="0" rx="10" fill="#7fb4ff" opacity=".9"/>
        <g id="j-tapX" opacity="0"><path d="M${TX + 85} 110 L${TX + 205} 230 M${TX + 205} 110 L${TX + 85} 230" stroke="#ff5a4e" stroke-width="12" stroke-linecap="round"/></g>
      </g>
      <g id="j-pipes"></g>
    </svg>
    <div class="a abs k900" data-in="j2@0.08" data-fx="pop" style="left:${TX + 230}px;top:150px;font-size:44px">进水：<span class="green">+¥10,000</span> <span class="mute k500" style="font-size:28px">工资</span></div>
    <div id="j-labs"></div>
    <div class="a abs k900" data-in="j3@0.4" data-fx="fade" data-out="j5" style="left:${TX}px;top:${TY + TH + 30}px;width:${TW}px;text-align:center;font-size:30px;color:#bdb6aa">每月剩下 ≈ <span class="gold">¥1,000</span>，刚好够用</div>
    <div class="a abs k900 red" data-in="j4@0.5" data-fx="slam" data-shake="12" data-out="j5@0.2" style="left:${LX - 20}px;top:420px;font-size:40px">收入停了，它们不会停</div>
    <div id="j-count" class="abs" style="left:${TX}px;top:${TY + TH + 24}px;width:${TW}px;text-align:center;opacity:0"><span class="k700" style="font-size:32px">还能撑</span> <span class="k900 num" id="j-days" style="font-size:72px">30</span> <span class="k700" style="font-size:32px">天</span></div>
    <div class="a abs k900" data-in="j6@0.3" data-fx="up" style="left:${LX - 20}px;top:420px;font-size:40px">每月<span class="red">必须付出</span>的 <span class="red num">¥9,000</span></div>
  </section>`,
  setup(ctx) {
    ctxRef = ctx;
    let g = '', labs = '';
    PIPES.forEach((p, i) => {
      g += `<g id="j-p${i}" opacity="0"><path d="M${PX - 6} ${p.y} L${LX} ${p.y}" stroke="#8d93a3" stroke-width="${p.w * 2 + 10}" stroke-linecap="round" fill="none"/>
        <path id="j-flow${i}" d="M${PX} ${p.y} L${LX} ${p.y}" stroke="#7fb4ff" stroke-width="${p.w * 2}" stroke-linecap="round" stroke-dasharray="24 18" fill="none"/>
        <g id="j-lock${i}" opacity="0" transform="translate(${(PX + LX) / 2} ${p.y - 52})"><rect x="-22" y="0" width="44" height="34" rx="6" fill="#ff5a4e"/><path d="M-13 0 V-10 A13 13 0 0 1 13 -10 V0" fill="none" stroke="#ff5a4e" stroke-width="6"/><circle cx="0" cy="16" r="5" fill="#2a0c09"/></g></g>`;
      labs += `<div class="j-lab" id="j-lab${i}" style="top:${p.y - 26}px;opacity:0">出水：${p.label} <b class="num">${p.amt}</b></div>`;
    });
    ctx.$('j-pipes').innerHTML = g; ctx.$('j-labs').innerHTML = labs;
  },
  events(ctx) {
    const { T } = ctx;
    ctx.ev(T('j2@0.12'), 'water', 2.2);
    [.45, .62, .8].forEach(k => ctx.ev(T('j2@' + k), 'pop'));
    PIPES.forEach((_, i) => ctx.ev(T('j4@0.25') + i * .25, 'lock'));
    ctx.ev(T('j5@0.25'), 'hit', 14);
    ctx.ev(T('j5@0.3'), 'water', 2.6);
    ctx.ev(T('j5@0.55'), 'alarm', 2.4);
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, ei, win } = Core;
    if (t < T('j1') - 1 || t > T('x1')) return;
    $('j-tank').setAttribute('opacity', eo((t - T('j1@0.3')) / .6));
    $('j-tap').setAttribute('opacity', eo((t - T('j2')) / .4));
    const on0 = T('j2@0.12'), off = T('j5@0.25');
    const tapOn = t > on0 && t < off;
    $('j-stream').setAttribute('height', tapOn ? Math.min(TY + TH - 250, (t - on0) * 1400) : 0);
    $('j-tapX').setAttribute('opacity', clamp((t - off) / .15));
    // 水位
    let L;
    if (t < on0) L = 0;
    else if (t < off) L = .34 * eo((t - on0) / 1.6) + (t > on0 + 1.6 ? .035 * Math.sin((t - on0) * 2.2) : 0);
    else { const L0 = .34 + .035 * Math.sin((off - on0) * 2.2); L = Math.max(0, L0 * (1 - ei((t - off) / 2.8))); }
    const top = TY + TH - 8 - L * (TH - 20);
    const red = clamp((t - off - 1.6) / 1.2);
    let d = `M${TX} ${TY + TH + 10} L${TX} ${top}`;
    for (let x = 0; x <= TW; x += 20) d += ` L${TX + x} ${top + Math.sin(x / 40 + t * 4) * 6 * (L > 0 ? 1 : 0)}`;
    d += ` L${TX + TW} ${TY + TH + 10} Z`;
    $('j-wat').setAttribute('d', L > 0.001 ? d : ''); $('j-wat').setAttribute('fill', red > .5 ? 'url(#j-waterR)' : 'url(#j-water)');
    // 管道
    PIPES.forEach((p, i) => {
      const k = eo((t - T('j2@' + [.45, .62, .8][i])) / .4);
      $('j-p' + i).setAttribute('opacity', k); $('j-lab' + i).style.opacity = k;
      const flowing = L > 0.002 && t > T('j2@0.8');
      const fl = $('j-flow' + i);
      fl.setAttribute('stroke-dashoffset', -t * 160); fl.setAttribute('opacity', flowing ? 1 : (t > off ? .35 + .35 * Math.abs(Math.sin(t * 6)) : 0));
      fl.setAttribute('stroke', t > off + 1.6 ? '#ff5a4e' : '#7fb4ff');
      const lt = t - (T('j4@0.25') + i * .25);
      $('j-lock' + i).setAttribute('opacity', clamp(lt / .1));
      $('j-lock' + i).setAttribute('transform', `translate(${(PX + LX) / 2} ${p.y - 52}) scale(${lt > 0 ? 1 + .8 * Math.max(0, 1 - lt / .25) : 1})`);
    });
    // 倒计时
    const ck = clamp((t - off) / .3) * (1 - clamp((t - T('j6')) / .4));
    $('j-count').style.opacity = ck;
    $('j-days').textContent = Math.round(30 * (1 - clamp((t - off) / 2.8)));
    $('j-days').style.color = t > off + 1.4 ? '#ff5a4e' : '#fff';
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T('j1') - .5, T('x1') - .4);
    const alarm = Core.win(t, T('j5@0.4'), T('j6@0.5'), .3) * (.6 + .4 * Math.abs(Math.sin(t * 7.8)));
    ctx.glow(800, 560, 800, 'rgba(90,140,255,A)', .08 * w);
    ctx.glow(960, 540, 1100, 'rgba(255,50,40,A)', .22 * alarm);
  },
});
})();
