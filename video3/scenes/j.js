/* 三、阿杰的水池：进水是到手一万；出水是带锁的房贷车贷分期（7000）+ 能拧小的生活费（3000）；
 *   被裁后补偿金只撑几个月，带锁的照样流；房子拆不下一块去付月供；问题不在花多少，在于有多少钱停不下来 */
(() => {
const L = { tank: 'j1', flow: 'j2', lock: 'j3', cut: 'j4', house: 'j5', point: 'j6', next: 'x1' };
const TX = 600, TY = 300, TW = 480, TH = 480;
const PIPES = [
  { y: 470, label: '房贷', amt: '¥4,200', w: 9, lock: true },
  { y: 560, label: '车贷', amt: '¥1,800', w: 6, lock: true },
  { y: 650, label: '分期', amt: '¥1,000', w: 5, lock: true },
  { y: 750, label: '生活费', amt: '¥3,000', w: 8, lock: false },
];
const PX = TX + TW, LX = 1330;

Kit.add({
  key: 'j',
  anchors: L,
  keywords: ['水池', '带锁', '补偿金', '十几年', '停不下来'],
  text: '阿杰每个月的钱进水到手出水房贷车贷分期生活费合计还能撑个月补偿金房贷还剩年不能拆一块去付月供能关的关不掉的能拧小',
  css: `
  .j-lab{position:absolute;left:${LX + 26}px;font-size:32px;font-weight:700;display:flex;align-items:center;gap:16px;white-space:nowrap}
  .j-lab b{font-weight:900;font-size:38px}
  `,
  html: `
  <section class="scene" id="jScene" data-s="${L.tank}-0.6" data-e="${L.next}-0.45">
    <div class="a abs k900" data-in="${L.tank}" data-fx="up" data-out="${L.house}-0.2" style="left:${LX - 10}px;top:150px;font-size:50px"><span class="red">阿杰</span>每个月的钱</div>
    <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
      <defs>
        <clipPath id="j-clip"><rect x="${TX + 8}" y="${TY}" width="${TW - 16}" height="${TH - 8}" rx="18"/></clipPath>
        <linearGradient id="j-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4ff" stop-opacity=".9"/><stop offset="1" stop-color="#2d5fb8" stop-opacity=".9"/></linearGradient>
        <linearGradient id="j-waterR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a80" stop-opacity=".9"/><stop offset="1" stop-color="#8a2019" stop-opacity=".9"/></linearGradient>
      </defs>
      <g id="j-tank" opacity="0">
        <rect x="${TX}" y="${TY - 20}" width="${TW}" height="${TH + 20}" rx="24" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" stroke-width="6"/>
        <g clip-path="url(#j-clip)"><path id="j-wat" fill="url(#j-water)"/></g>
        <text x="${TX + TW / 2}" y="${TY + TH - 24}" text-anchor="middle" font-size="24" fill="rgba(255,255,255,.55)" id="j-tank-lab">存款</text>
      </g>
      <g id="j-tap" opacity="0">
        <path d="M${TX + 100} 150 L${TX + 100} 205 Q${TX + 100} 225 ${TX + 120} 225 L${TX + 155} 225" fill="none" stroke="#c9ccd6" stroke-width="22" stroke-linecap="round"/>
        <rect x="${TX + 75}" y="130" width="50" height="22" rx="8" fill="#c9ccd6"/>
        <rect id="j-stream" x="${TX + 145}" y="236" width="20" height="0" rx="10" fill="#7fb4ff" opacity=".9"/>
        <g id="j-tapX" opacity="0"><path d="M${TX + 65} 110 L${TX + 185} 230 M${TX + 185} 110 L${TX + 65} 230" stroke="#ff5a4e" stroke-width="12" stroke-linecap="round"/></g>
      </g>
      <g id="j-bucket" opacity="0">
        <path d="M-60 -50 L60 -50 L45 50 L-45 50 Z" fill="#c9a24a" stroke="#ffe08f" stroke-width="4"/>
        <text x="0" y="12" text-anchor="middle" font-size="26" font-weight="900" fill="#2a1d05">补偿金</text>
        <rect id="j-pour" x="50" y="-40" width="16" height="0" rx="8" fill="#7fb4ff"/>
      </g>
      <g id="j-pipes"></g>
      <g id="j-house" opacity="0" transform="translate(150 470)">
        <path d="M0 110 L150 0 L300 110" fill="none" stroke="#e9e4da" stroke-width="10" stroke-linejoin="round"/>
        <rect x="35" y="100" width="230" height="170" fill="rgba(255,255,255,.04)" stroke="#e9e4da" stroke-width="8"/>
        <rect x="120" y="180" width="60" height="90" fill="none" stroke="#e9e4da" stroke-width="6"/>
        <path d="M300 200 L${TX - 150} 200" stroke="#8d93a3" stroke-width="16" stroke-linecap="round"/>
        <g id="j-houseX" transform="translate(${(TX - 150 + 300) / 2 + 0} 200)" opacity="0"><path d="M-22 -22 L22 22 M22 -22 L-22 22" stroke="#ff5a4e" stroke-width="10" stroke-linecap="round"/></g>
      </g>
    </svg>
    <div class="a abs k900" data-in="${L.flow}@0.05" data-fx="pop" style="left:120px;width:${TX + 40 - 120}px;text-align:right;top:150px;font-size:40px">进水：<span class="green">+¥10,000</span><div class="mute k500" style="font-size:26px">每月到手</div></div>
    <div id="j-labs"></div>
    <div class="a abs k900" data-in="${L.flow}@0.62" data-fx="pop" data-out="${L.cut}" style="left:${LX + 26}px;top:385px;font-size:30px;color:#ff9c94">前三项合计 <span class="num" style="font-size:36px">¥7,000</span></div>
    <div class="a abs" data-in="${L.flow}@0.88" data-fx="fade" data-out="${L.cut}" style="left:${TX}px;top:${TY + TH + 24}px;width:${TW}px;text-align:center;font-size:30px;color:#bdb6aa">平时刚好够用</div>
    <div class="a abs k900 red" data-in="${L.lock}@0.45" data-fx="slam" data-shake="10" data-out="${L.cut}" style="left:${LX - 10}px;top:250px;font-size:38px">收入停了，也不会停</div>
    <div id="j-count" class="abs" style="left:${TX}px;top:${TY + TH + 22}px;width:${TW}px;text-align:center;opacity:0"><span class="k700" style="font-size:30px">还能撑</span> <span class="k900 num" id="j-mon" style="font-size:66px">6</span> <span class="k700" style="font-size:30px">个月</span></div>
    <div class="a abs k900" data-in="${L.cut}@0.75" data-fx="pop" data-out="${L.house}@0.2" style="left:${LX - 10}px;top:250px;font-size:36px">房贷，还剩 <span class="red num">15</span> 年</div>
    <div class="a abs k700" data-in="${L.house}@0.55" data-fx="pop" data-out="${L.next}-0.5" style="left:150px;top:790px;width:300px;text-align:center;font-size:30px">房子值钱<br><span class="red">但拆不下一块付月供</span></div>
    <div class="a abs k900" data-in="${L.point}@0.4" data-fx="pop" style="left:${LX - 10}px;top:860px;font-size:30px"><span class="red">关不掉的</span>：¥7,000 &nbsp;·&nbsp; <span class="gold">能拧小的</span>：生活费</div>
  </section>`,
  setup(ctx) {
    let g = '', labs = '';
    PIPES.forEach((p, i) => {
      g += `<g id="j-p${i}" opacity="0"><path d="M${PX - 6} ${p.y} L${LX} ${p.y}" stroke="#8d93a3" stroke-width="${p.w * 2 + 10}" stroke-linecap="round" fill="none"/>
        <path id="j-flow${i}" d="M${PX} ${p.y} L${LX} ${p.y}" stroke="#7fb4ff" stroke-width="${p.w * 2}" stroke-linecap="round" stroke-dasharray="24 18" fill="none"/>
        ${p.lock ? `<g id="j-lock${i}" opacity="0" transform="translate(${(PX + LX) / 2} ${p.y - 50})"><rect x="-22" y="0" width="44" height="34" rx="6" fill="#ff5a4e"/><path d="M-13 0 V-10 A13 13 0 0 1 13 -10 V0" fill="none" stroke="#ff5a4e" stroke-width="6"/><circle cx="0" cy="16" r="5" fill="#2a0c09"/></g>`
          : `<g id="j-valve" opacity="0" transform="translate(${(PX + LX) / 2} ${p.y})"><circle r="26" fill="#2a2b30" stroke="#f2c063" stroke-width="5"/><path id="j-valve-h" d="M-20 0 L20 0" stroke="#f2c063" stroke-width="7" stroke-linecap="round"/></g>`}</g>`;
      labs += `<div class="j-lab" id="j-lab${i}" style="top:${p.y - 24}px;opacity:0"><span>${p.label}</span><b class="num" style="color:${p.lock ? '#ff8a80' : '#e9dcc0'}">${p.amt}</b></div>`;
    });
    ctx.$('j-pipes').innerHTML = g; ctx.$('j-labs').innerHTML = labs;
  },
  events(ctx) {
    const { T } = ctx;
    ctx.ev(T(L.flow + '@0.05'), 'water', 2.4);
    [.3, .4, .5, .72].forEach(k => ctx.ev(T(L.flow + '@' + k), 'pop', .6));
    [0, 1, 2].forEach(i => ctx.ev(T(L.lock + '@0.1') + i * .22, 'lock'));
    ctx.ev(T(L.cut + '@0.25'), 'hit', 14);
    ctx.ev(T(L.cut + '@0.45'), 'water', 1.4);
    ctx.ev(T(L.house + '@0.55'), 'stamp');
    ctx.ev(T(L.point) - .2, 'alarm', 2.0);
  },
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, eo, ei, eio } = Core;
    if (t < T(L.tank) - 1 || t > T(L.next)) return;
    $('j-tank').setAttribute('opacity', eo((t - T(L.tank + '@0.3')) / .6));
    $('j-tap').setAttribute('opacity', eo((t - T(L.flow)) / .4));
    const on0 = T(L.flow + '@0.05'), off = T(L.cut + '@0.25'), pour = T(L.cut + '@0.45'), empty = T(L.point) + .2;
    $('j-stream').setAttribute('height', t > on0 && t < off ? Math.min(TY + TH - 250, (t - on0) * 1400) : 0);
    $('j-tapX').setAttribute('opacity', clamp((t - off) / .15));
    // 补偿金：倒一桶
    const bk = clamp((t - (pour - .4)) / .3) * (1 - clamp((t - (pour + 1.6)) / .3));
    const tilt = -40 * eio((t - pour + .1) / .5);
    $('j-bucket').setAttribute('opacity', bk); $('j-bucket').setAttribute('transform', `translate(${TX + TW - 60} 170) rotate(${tilt})`);
    $('j-pour').setAttribute('height', t > pour + .3 && t < pour + 1.5 ? 120 : 0);
    // 水位
    let Lv;
    const base = .3;
    if (t < on0) Lv = 0;
    else if (t < off) Lv = base * eo((t - on0) / 1.6) + (t > on0 + 1.6 ? .03 * Math.sin((t - on0) * 2.2) : 0);
    else if (t < pour + .3) Lv = base * (1 - .25 * eo((t - off) / .8));
    else if (t < pour + 1.5) Lv = base * .75 + .35 * eo((t - pour - .3) / 1.1);
    else Lv = Math.max(0, (base * .75 + .35) * (1 - eio((t - pour - 1.5) / (empty - pour - 1.5))));
    const top = TY + TH - 8 - Lv * (TH - 20);
    const red = Lv < .05 && t > pour + 1.5;
    let d = `M${TX} ${TY + TH + 10} L${TX} ${top}`;
    for (let x = 0; x <= TW; x += 20) d += ` L${TX + x} ${top + Math.sin(x / 40 + t * 4) * 6 * (Lv > 0 ? 1 : 0)}`;
    d += ` L${TX + TW} ${TY + TH + 10} Z`;
    $('j-wat').setAttribute('d', Lv > .002 ? d : ''); $('j-wat').setAttribute('fill', red ? 'url(#j-waterR)' : 'url(#j-water)');
    // 管道
    PIPES.forEach((p, i) => {
      const k = eo((t - T(L.flow + '@' + [.3, .4, .5, .72][i])) / .4);
      $('j-p' + i).setAttribute('opacity', k); $('j-lab' + i).style.opacity = k;
      const fl = $('j-flow' + i);
      const flowing = Lv > .002 && t > T(L.flow + '@0.5');
      fl.setAttribute('stroke-dashoffset', -t * 160);
      let w = p.w * 2;
      if (!p.lock && t > off) w = Math.max(3, p.w * 2 * (1 - .75 * eo((t - off - .3) / .8)));   // 生活费被拧小
      fl.setAttribute('stroke-width', w);
      fl.setAttribute('opacity', flowing ? 1 : (t > off && p.lock ? .35 + .35 * Math.abs(Math.sin(t * 6)) : 0));
      fl.setAttribute('stroke', red && p.lock ? '#ff5a4e' : '#7fb4ff');
      if (p.lock) { const lt = t - (T(L.lock + '@0.1') + i * .22); const lk = $('j-lock' + i); lk.setAttribute('opacity', clamp(lt / .1)); lk.setAttribute('transform', `translate(${(PX + LX) / 2} ${p.y - 50}) scale(${lt > 0 ? 1 + .8 * Math.max(0, 1 - lt / .25) : 1})`); }
    });
    const vk = clamp((t - T(L.lock + '@0.6')) / .3); $('j-valve').setAttribute('opacity', vk);
    $('j-valve-h').setAttribute('transform', `rotate(${70 * eo((t - off - .3) / .8)})`);
    // 倒计时（月）
    const ck = clamp((t - (pour + .4)) / .3);
    $('j-count').style.opacity = ck;
    $('j-mon').textContent = Math.max(0, Math.round(6 * (1 - clamp((t - pour - 1.5) / (empty - pour - 1.5)))));
    $('j-mon').style.color = t > empty - 1.2 ? '#ff5a4e' : '#fff';
    // 房子
    $('j-house').setAttribute('opacity', eo((t - T(L.house + '@0.1')) / .5));
    $('j-houseX').setAttribute('opacity', clamp((t - T(L.house + '@0.55')) / .15));
  },
  bg(t, ctx) {
    const { T, Core } = ctx; const w = Core.win(t, T(L.tank) - .5, T(L.next) - .4);
    const alarm = Core.win(t, T(L.point) - .3, T(L.next) - .5, .3) * (.6 + .4 * Math.abs(Math.sin(t * 7.8)));
    ctx.glow(840, 560, 800, 'rgba(90,140,255,A)', .08 * w);
    ctx.glow(960, 540, 1100, 'rgba(255,50,40,A)', .2 * alarm);
  },
});
})();
