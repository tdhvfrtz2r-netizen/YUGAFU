/* 月薪一万的两个人 · 横版场景：剧情动画、图表、树，以及音效事件登记。通用部分见 core.js */
(() => {
const TLd = window.TL, LN = TLd.lines, TOTAL = TLd.total;
const { clamp, lerp, eo, ei, eio, back, $, fmt, rng, win, ICON, GOLD, REDS } = Core;
const T = Core.makeT(TLd);

/* ---------------- icons ---------------- */
Core.setupIcons();
$('r1vault').innerHTML = ICON.vault.replace('<svg ', '<svg width="90" height="90" ');

/* ---------------- events (also exported for sound design) ---------------- */
const EVENTS = [];
const ev = (t, kind, amp = 1) => EVENTS.push({ t: +(+t).toFixed(3), kind, amp });

/* ---------------- scenes & animated elements ---------------- */
const { scenes, items } = Core.collect(T, ev);

/* ---------------- subtitles ---------------- */
const KEY = /(一百三十九万|一百三十九|八十七万|四十九万|二十一万|六十七万|三千八|三千块|二十年|底气|复利|火箭|指数基金|两成|一万杯咖啡|先存后花|裁员|一万块)/g;
const subtitle = Core.makeSubtitles(TLd, KEY, 17);

/* ---------------- camera shake / flash ---------------- */
const SHAKES = items.filter(i => i.fx === 'slam').map(i => [i.tin + 0.22, i.shake || 10]);
const FLASH = [];
function addShake(t, a) { SHAKES.push([t, a]); }
function shake(t) {
  // 火箭前的持续低频震动
  let extra = 0;
  const r0 = T('k1'), r1 = T('k3');
  if (t > r0 && t < r1) extra += 5 * Math.pow((t - r0) / (r1 - r0), 2);
  if (t > r1 && t < T('k4@0.7')) extra += 4;
  return Core.shakeAt(t, SHAKES, extra);
}
const flash = t => Core.flashAt(t, FLASH);

/* ---------------- particles ---------------- */
const bgc = $('bgc').getContext('2d'), fxc = $('fxc').getContext('2d');
const P = Core.particles(fxc), { burst, stream, RINGS } = P, drawParticles = P.draw;

/* ---------------- background ---------------- */
const glow = (ctx, x, y, r, col, a) => Core.glow(ctx, x, y, r, col, a, 1920, 1080);
const DUST = Core.makeDust(70, 1920, 1080);
const LINES = Core.makeLines(60, 2400, 1400);
function drawBG(t) {
  const c = bgc; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#07080b'; c.fillRect(0, 0, 1920, 1080);
  c.globalCompositeOperation = 'lighter';
  // 左右分屏的冷暖光
  const split = Math.max(win(t, T('o1') - .5, T('o5') + .3), win(t, T('f1') - .4, T('b1') - .7), win(t, T('c1') - .7, T('c4')), win(t, T('r2') - .3, T('f1')) * .6);
  const focusL = 1 + win(t, T('o2'), T('o3')) * 1.2 - win(t, T('o3'), T('o5')) * .7 + win(t, T('c2') - .3, T('c3') - .3) * 1.0;
  const focusR = 1 + win(t, T('o3'), T('o5')) * 1.2 - win(t, T('o2'), T('o3')) * .7 + win(t, T('c3') - .3, T('c4')) * 1.0;
  glow(c, 420, 620, 820, 'rgba(255,70,55,A)', .16 * split * focusL);
  glow(c, 1500, 620, 820, 'rgba(242,180,80,A)', .16 * split * focusR);
  // 中心金光（图表、底气、结尾）
  const cg = Math.max(win(t, T('b1') - .7, T('c1') - .7) * (.35 + .9 * clamp((t - T('k3')) / 2) - .4 * win(t, T('b1'), T('k1'))), win(t, T('c5') - .1, T('t1') - .8) * 1.2, win(t, T('o5@0.79'), T('r1') - 1.1) * .9, win(t, T('p0') - .5, T('e1') - 1) * .5, win(t, T('e3'), TOTAL + 1) * .7);
  glow(c, 960, 520, 900, 'rgba(242,175,70,A)', .2 * cg);
  // 慢速漂浮的金尘
  const dustA = .25 + .6 * Math.max(win(t, T('c5'), T('t1') - .8), win(t, T('e3'), TOTAL + 1), win(t, T('k5'), T('c1') - .7));
  Core.drawDust(c, DUST, t, dustA, 1080);
  // 火箭速度线
  Core.drawSpeedLines(c, LINES, t, win(t, T('k3') - .05, T('k5') + .2, .3), 2400, 1080);
  // 底气背后的光芒
  Core.drawGodRays(c, 960, 470, t, win(t, T('c5') - .05, T('t1') - .9, .4));
  c.globalCompositeOperation = 'source-over';
}

/* ---------------- chart (小林的账户) ---------------- */
const FV = m => 3000 * ((Math.pow(1.005, m) - 1) / 0.005) / 1e4;
const CX = y => 260 + 1400 * y / 20, CY = v => 900 - 680 * v / 150;
(function grid() {
  let g = '';
  for (let v = 0; v <= 150; v += 50) g += `<line x1="260" x2="1660" y1="${CY(v)}" y2="${CY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="230" y="${CY(v) + 9}" font-size="24" fill="#6f6b64" text-anchor="end">${v}万</text>`;
  for (let y = 0; y <= 20; y += 5) g += `<text x="${CX(y)}" y="950" font-size="24" fill="#6f6b64" text-anchor="middle">第${y}年</text>`;
  $('cgrid').innerHTML = g;
  $('snail').innerHTML = Core.SNAIL;
  $('rocket').innerHTML = Core.ROCKET;
})();
const MARKS = [[5, '第5年 · 21万'], [10, '第10年 · 49万'], [15, '第15年 · 87万'], [20, '第20年 · 139万']];
$('cMarks').innerHTML = MARKS.map(([y, l], i) => `<g id="mk${i}" opacity="0"><circle cx="${CX(y)}" cy="${CY(FV(y * 12))}" r="${y === 20 ? 14 : 10}" fill="#fff2c4"/><text x="${CX(y) + (y <= 10 ? 18 : -26)}" y="${CY(FV(y * 12)) + (y <= 10 ? 52 : y === 20 ? 14 : -26)}" text-anchor="${y <= 10 ? 'start' : 'end'}" font-size="${y === 20 ? 46 : 32}" font-weight="900" fill="${y >= 15 ? '#ffe08f' : '#cfc6b6'}">${l}</text></g>`).join('');
function chartYears(t) {
  const P = [[T('b1') - .3, 0], [T('b2@0.3'), 5], [T('b2@0.85'), 10], [T('k3'), 10], [T('k4@0.12'), 15], [T('k4@0.62'), 20]];
  if (t <= P[0][0]) return 0;
  for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const k = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]); return lerp(P[i - 1][1], P[i][1], i >= 4 ? (i === 4 ? ei(k * .9 + .1) * .95 + k * .05 : eo(k)) : eio(k)); }
  return 20;
}
function hookChart(t) {
  const Y = chartYears(t), n = Math.round(Y * 12);
  let d = '';
  for (let m = 0; m <= n; m++) d += (m ? 'L' : 'M') + CX(m / 12).toFixed(1) + ' ' + CY(FV(m)).toFixed(1);
  $('cLine').setAttribute('d', d);
  $('cArea').setAttribute('d', n ? d + `L${CX(n / 12)} ${CY(0)}L${CX(0)} ${CY(0)}Z` : '');
  const v = FV(n), tx = CX(n / 12), ty = CY(v);
  $('cNum').textContent = v < 10 ? v.toFixed(1) : Math.round(v);
  $('cYear').textContent = `第 ${Math.floor(Y + 1e-6)} 年`;
  MARKS.forEach(([y], i) => { const g = $('mk' + i); const k = clamp((Y - y + .05) / .3); g.setAttribute('opacity', k * (t > T('k5') ? .3 : 1)); });
  const tk3 = T('k3');
  // 蜗牛 → 火箭
  const sn = $('snail'), rk = $('rocket');
  const wob = Math.sin(t * 6) * 3;
  sn.setAttribute('transform', `translate(${tx - 20 + wob},${ty - 34})`); sn.setAttribute('opacity', t < tk3 ? clamp((t - T('b1')) / .4) : 0);
  const slope = Math.atan2(CY(FV(Math.min(240, n + 6))) - CY(FV(Math.max(0, n - 6))), CX(Math.min(240, n + 6) / 12) - CX(Math.max(0, n - 6) / 12));
  const fly = clamp((t - T('k4@0.68')) / 1.1);
  const rx = tx + ei(fly) * 900, ry = ty - ei(fly) * 1300;
  rk.setAttribute('transform', `translate(${rx},${ry}) rotate(${(slope - fly * .5) * 180 / Math.PI})`); rk.setAttribute('opacity', t >= tk3 && fly < 1 ? 1 : 0);
  window.__rocket = [rx, ry, slope];
  // 镜头推近蜗牛，火箭时拉回
  const zin = clamp((t - T('k1')) / (tk3 - T('k1'))), zout = eo((t - tk3) / .5);
  const z = 1 + .22 * eio(zin) * (1 - zout);
  const cw = $('chartWrap'); cw.style.transformOrigin = `${CX(10)}px ${CY(49)}px`; cw.style.transform = `scale(${z})`;
  cw.style.opacity = 1 - .72 * eo((t - T('k5')) / .6); $('cNum').parentElement.style.opacity = 1 - .7 * eo((t - T('k5')) / .6);
  const q = $('qm'); q.style.transform = `rotate(${Math.sin(t * 5) * 14}deg) translateY(${Math.sin(t * 3.3) * 6}px)`;
  // 本金 / 收益
  const kb = eo((t - T('k5') - .2) / 1), kg = eo((t - T('k5@0.45')) / 1.2);
  $('bkP').style.width = (1400 * 72 / 139 * kb) + 'px';
  $('bkG').style.left = (1400 * 72 / 139 * kb) + 'px'; $('bkG').style.width = (1400 * 67 / 139 * kg) + 'px';
}

/* ---------------- tree ---------------- */
const TREE = [];
(function build() {
  const r = rng(42);
  function br(x, y, a, len, dep, t0) {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    TREE.push({ x, y, x2, y2, w: Math.max(2, 16 * Math.pow(.7, dep)), t0, dur: .32, dep, len });
    if (dep < 7) { const n = dep < 2 ? 2 : (r() < .6 ? 2 : 3); for (let i = 0; i < n; i++) br(x2, y2, a + (i - (n - 1) / 2) * (0.45 + r() * .25) + (r() - .5) * .2, len * (0.7 + r() * .12), dep + 1, t0 + .3 + r() * .1); }
    else TREE.push({ leaf: true, x: x2, y: y2, t0: t0 + .3, s: 5 + r() * 9, c: GOLD[Math.floor(r() * 4)] });
  }
  br(960, 930, -Math.PI / 2, 140, 0, 0);
  $('tree').innerHTML = TREE.map((b, i) => b.leaf ? `<circle id="tr${i}" cx="${b.x}" cy="${b.y}" r="${b.s}" fill="${b.c}" opacity="0" style="filter:drop-shadow(0 0 8px ${b.c})"/>` :
    `<line id="tr${i}" x1="${b.x}" y1="${b.y}" x2="${b.x2}" y2="${b.y2}" stroke="#d8c39a" stroke-width="${b.w}" stroke-linecap="round" stroke-dasharray="${b.len}" stroke-dashoffset="${b.len}"/>`).join('');
  TREE.forEach((b, i) => b.el = null);
})();
function hookTree(t) {
  const lt = t - T('e3') - .2;
  TREE.forEach((b, i) => {
    if (!b.el) b.el = $('tr' + i);
    if (b.leaf) { const k = back((lt - b.t0) / .4); b.el.setAttribute('opacity', clamp((lt - b.t0) / .2) * (t > T('e4') ? .55 : 1)); b.el.setAttribute('r', Math.max(0, b.s * k)); }
    else { const k = clamp((lt - b.t0) / b.dur); b.el.setAttribute('stroke-dashoffset', b.len * (1 - k)); b.el.setAttribute('opacity', k > 0 ? 1 : 0); }
  });
}

/* ---------------- per-scene hooks ---------------- */
const glitches = [...document.querySelectorAll('.glitch')].map(el => ({ el, t0: T(el.dataset.in) }));
const cupCtx = $('cupGrid').getContext('2d');
function hooks(t) {
  // 开场：聚焦一侧时压暗另一侧
  const dimL = win(t, T('o3'), T('o5') + .2, .4) * .7, dimR = win(t, T('o2'), T('o3'), .4) * .7, dimAll = clamp((t - T('o5')) / .5) * .88;
  $('openL').style.opacity = 1 - Math.max(dimL, dimAll); $('openR').style.opacity = 1 - Math.max(dimR, dimAll); $('openBoth').style.filter = dimAll > .01 ? `blur(${dimAll * 10}px)` : '';
  glitches.forEach(g => { const k = t - g.t0; if (k > 0 && k < .55) { const r = rng(Math.floor(t * 30) + 3)(); g.el.style.transform = `translateX(${(r - .5) * 40}px) skewX(${(r - .5) * 12}deg)`; g.el.style.filter = `drop-shadow(${6 * r}px 0 rgba(255,0,80,.9)) drop-shadow(${-6 * r}px 0 rgba(0,240,255,.9))`; } });
  document.querySelectorAll('.smile').forEach(s => s.setAttribute('stroke-dashoffset', 80 * (1 - eo((t - T('o4')) / .6))));
  // 倒带
  const rw0 = T('r1') - 1.15, rw1 = T('r1.e') + .1, rwk = win(t, rw0, rw1, .2);
  $('scan').style.opacity = rwk; $('osd').style.opacity = rwk * (Math.floor(t * 3) % 2 ? 1 : .35);
  $('age').textContent = Math.round(45 - 20 * eio((t - rw0 - .2) / (rw1 - rw0 - .3)));
  $('ageBox').style.opacity = 1 - clamp((t - T('r2') + .3) / .4); $('ageSub').style.opacity = clamp((t - rw1 + .3) / .3);
  $('startLine').style.opacity = clamp((t - T('r2')) / .5);
  // 分岔
  $('likes').textContent = Math.round(128 * eo((t - T('f3') - .3) / 1.6));
  $('mL').style.width = 95 * eo((t - T('f6') - .2) / 1) + '%'; $('mR').style.width = 15 * eo((t - T('f6') - .35) / 1) + '%';
  const sp = eio((t - T('f4@0.3')) / .8);
  $('sp30').style.transform = `translate(${sp * 230}px,${sp * 150}px) scale(${1 - .55 * sp})`; $('sp30').style.opacity = 1 - clamp((t - T('f4@0.3') - .7) / .3);
  $('vault').style.transform = `scale(${1 + .12 * Math.exp(-Math.max(0, t - T('f4@0.3') - .8) * 4) * (t > T('f4@0.3') + .8 ? 1 : 0)})`;
  // 图表
  if (t > T('b1') - 1 && t < T('c1')) hookChart(t);
  // 电量
  const bl = t < T('c2@0.1') ? .35 : lerp(.35, .03, eo((t - T('c2@0.1')) / 1.2));
  $('bL').style.width = 384 * bl + 'px'; $('bL').style.opacity = t > T('c2@0.4') ? (Math.floor(t * 4) % 2 ? 1 : .25) : 1;
  $('bR').style.width = 384 * eo((t - T('c3@0.1')) / 1.8) + 'px';
  $('yrs').textContent = Math.round(19 * eo((t - T('c3@0.55')) / 1.2));
  // 三句话
  const ck = eio((t - T('p1') - .9) / .8);
  $('r1chunk').setAttribute('transform', `translate(${ck * 10} ${ck * 95}) scale(${1 - .5 * ck})`); $('r1chunk').setAttribute('opacity', 1 - clamp((t - T('p1') - 1.6) / .3));
  const cups = Math.round(10000 * eio((t - T('p2') - .5) / 3));
  $('cupN').textContent = fmt(cups);
  if (t > T('p2') - 1 && t < T('e1')) {
    cupCtx.clearRect(0, 0, 880, 460);
    for (let i = 0; i < 10000; i++) { const cx = (i % 125) * 7.04, cy = Math.floor(i / 125) * 5.75; cupCtx.fillStyle = i < cups ? '#f2c063' : 'rgba(255,255,255,.07)'; cupCtx.fillRect(cx, cy, 5.2, 4.2); }
  }
  [['r3bad', T('p3') + .3, 1.0], ['r3x', T('p3@0.45'), .5], ['r3good', T('p3@0.62'), 1.0]].forEach(([id, t0, d]) => { const el = $(id); const L = 700; el.setAttribute('stroke-dasharray', L); el.setAttribute('stroke-dashoffset', L * (1 - eo((t - t0) / d))); });
  if (t > T('e3') - .5) hookTree(t);
}

/* ---------------- effects registry ---------------- */
function setupFX() {
  P.init();
  const hit = T('o5@0.79');
  burst({ t0: hit + .2, x: 960, y: 560, n: 170, spd: [400, 1500], g: 500, life: [.9, 2], size: [2, 7], colors: GOLD, seed: 11 });
  RINGS.push([hit + .2, 960, 560, 900, '#ffd36b']); FLASH.push([hit + .2, .55, .25]);
  // 工资雨：两边同时到账
  ev(T('f1') - .2, 'coins');
  burst({ t0: T('f1') - .2, x: 480, y: -60, dx: 820, n: 34, ang: Math.PI / 2, spread: .3, spd: [200, 420], g: 900, life: [2.2, 2.8], size: [18, 28], colors: GOLD, type: 'coin', over: 1.6, seed: 21, drag: .2 });
  burst({ t0: T('f1') - .2, x: 1440, y: -60, dx: 820, n: 34, ang: Math.PI / 2, spread: .3, spd: [200, 420], g: 900, life: [2.2, 2.8], size: [18, 28], colors: GOLD, type: 'coin', over: 1.6, seed: 22, drag: .2 });
  // 阿杰花钱：硬币往外飞
  [[T('f2@0.08'), 330, 340], [T('f2@0.4'), 360, 500]].forEach(([t0, x, y], i) => burst({ t0: t0 + .25, x, y, n: 18, ang: -Math.PI * .75, spread: 1.6, spd: [500, 900], g: 1400, life: [1.2, 1.8], size: [14, 22], colors: REDS, type: 'coinR', seed: 31 + i, drag: .6 }));
  burst({ t0: T('f3') + .3, x: 640, y: 760, dx: 120, n: 26, ang: -Math.PI / 2, spread: .8, spd: [120, 260], g: -60, life: [1.8, 2.6], size: [9, 16], colors: ['#ff6a6a', '#ff8a80', '#ff4d6d'], type: 'heart', over: 1.6, seed: 41, add: false });
  // 小林：3000 流进基金
  stream({ t0: T('f4@0.3') + .2, n: 22, over: 1.8, travel: .9, x0: 1516, y0: 375, cx: 1660, cy: 280, x1: 1735, y1: 500, seed: 51 });
  ev(T('f4@0.3') + .2, 'coins');
  // 火箭
  ev(T('k3'), 'launch'); FLASH.push([T('k3'), .85, .3]); RINGS.push([T('k3'), CX(10), CY(49), 700, '#fff2c4']);
  ev(T('k4@0.12'), 'hit', 16); addShake(T('k4@0.12'), 16);
  ev(T('k4@0.62'), 'hit', 30); addShake(T('k4@0.62'), 30); FLASH.push([T('k4@0.62'), .5, .25]);
  burst({ t0: T('k4@0.62'), x: CX(20), y: CY(139), n: 140, spd: [300, 1200], g: 400, life: [.8, 1.8], size: [2, 7], colors: GOLD, seed: 61 });
  RINGS.push([T('k4@0.62'), CX(20), CY(139), 600, '#ffd36b']);
  burst({ t0: T('k5') + 1, x: 960 + 330, y: 500, dx: 640, dy: 80, n: 60, ang: -Math.PI / 2, spread: 1.2, spd: [40, 160], g: -40, life: [1.2, 2.2], size: [1.5, 4], colors: GOLD, over: 3, seed: 71 });
  // 底气
  const dq = T('c5');
  FLASH.push([dq, .95, .35]); RINGS.push([dq + .15, 960, 470, 1100, '#ffe08f']); RINGS.push([dq + .35, 960, 470, 800, '#ffffff']);
  burst({ t0: dq + .1, x: 960, y: 470, n: 260, spd: [500, 1900], g: 300, life: [1, 2.4], size: [2, 8], colors: GOLD, seed: 81 });
  // 碎掉的车
  ev(T('t3'), 'shatter');
  burst({ t0: T('t3'), x: 1300, y: 550, dx: 500, dy: 380, n: 110, spd: [100, 700], g: 1300, life: [1, 1.8], size: [6, 16], colors: REDS, type: 'shard', seed: 91, add: false });
  // 三张卡
  ['p1', 'p2', 'p3'].forEach((p, i) => { FLASH.push([T(p) + .2, .18, .15]); burst({ t0: T(p) + .22, x: 420 + 540 * i, y: 300, dx: 420, n: 50, ang: -Math.PI / 2, spread: 2.6, spd: [200, 700], g: 900, life: [.6, 1.2], size: [2, 5], colors: GOLD, seed: 101 + i }); });
  ev(T('p2') + .5, 'fill');
  // 结尾
  ev(T('e3') + .2, 'grow');
  burst({ t0: T('e4@0.45') + .1, x: 960, y: 300, dx: 300, n: 140, ang: -Math.PI / 2, spread: 2.2, spd: [500, 1300], g: 1100, life: [1.8, 2.8], size: [6, 12], colors: [...GOLD, ...REDS], type: 'confetti', seed: 111, add: false });
  // 开场通知、倒带等声音事件
  ev(T('r1') - 1.15, 'rewind', T('r1.e') + .1 - (T('r1') - 1.15));
  ev(T('o4') + .05, 'chime'); ev(T('f6@0.3'), 'pop'); ev(T('c4'), 'type', (T('c4.e') - T('c4')) * 0.52);
}

/* ---------------- master seek ---------------- */
const rewindBands = t => Core.drawRewindBands(fxc, t, win(t, T('r1') - 1.15, T('r1.e') + .1, .2), 1920, 1080);
function rocketTrail(t) {
  const a = T('k3'), b = T('k4@0.68') + 1.1; if (t < a || t > b + .6 || !window.__rocket) return;
  // 用历史位置做尾焰：按时间回采样
  fxc.globalCompositeOperation = 'lighter';
  const r = rng(Math.floor(t * 60));
  for (let i = 0; i < 70; i++) {
    const back = i / 70 * .5, tt = t - back; if (tt < a) break;
    const p = rocketPosAt(tt); if (!p) continue;
    const s = (1 - i / 70) * 18 + 2, j = (r() - .5) * 18 * (i / 70 + .2);
    const bx = p[0] - Math.cos(p[2]) * 60 + j, by = p[1] - Math.sin(p[2]) * 60 + j;
    fxc.fillStyle = i < 10 ? 'rgba(255,250,220,.9)' : i < 30 ? `rgba(255,190,90,${.7 - i / 70})` : `rgba(255,110,60,${.5 - i / 140})`;
    fxc.beginPath(); fxc.arc(bx, by, s, 0, 7); fxc.fill();
  }
  fxc.globalCompositeOperation = 'source-over';
}
function rocketPosAt(t) {
  const Y = chartYears(t), n = Math.round(Y * 12), v = FV(n), tx = CX(n / 12), ty = CY(v);
  const slope = Math.atan2(CY(FV(Math.min(240, n + 6))) - CY(FV(Math.max(0, n - 6))), CX(Math.min(240, n + 6) / 12) - CX(Math.max(0, n - 6) / 12));
  const fly = clamp((t - T('k4@0.68')) / 1.1);
  return [tx + ei(fly) * 900, ty - ei(fly) * 1300, slope - fly * .5];
}

function seek(t) {
  t = clamp(t, 0, TOTAL);
  Core.showScenes(scenes, items, t);
  hooks(t);
  drawBG(t);
  fxc.clearRect(0, 0, 1920, 1080);
  rocketTrail(t);
  drawParticles(t);
  rewindBands(t);
  const sh = shake(t);
  const rw = win(t, T('r1') - 1.15, T('r1.e') + .1, .2);
  const jx = rw ? (rng(Math.floor(t * 30))() - .5) * 30 * rw : 0;
  $('world').style.transform = `translate(${sh.x + jx}px,${sh.y}px) rotate(${sh.r}deg) scale(${1 + sh.z})`;
  $('world').style.filter = rw ? `saturate(${1 - .6 * rw}) contrast(${1 + .25 * rw}) hue-rotate(${-20 * rw}deg)` : '';
  $('flash').style.opacity = flash(t);
  subtitle(t);
}

window.seek = seek; window.TOTAL = TOTAL; window.EVENTS = EVENTS; window.T = T;
Core.boot({ TL: TLd, W: 1920, H: 1080, seek, setupFX, EVENTS });
})();
