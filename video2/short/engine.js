/* 月薪一万的两个人 · 60 秒竖版场景（1080×1920）。通用部分见 ../core.js */
(() => {
const TLd = window.TL, TOTAL = TLd.total;
const { clamp, lerp, eo, ei, eio, $, win, GOLD, REDS } = Core;
const T = Core.makeT(TLd);
const W = 1080, H = 1920;

Core.setupIcons();
const EVENTS = [];
const ev = (t, kind, amp = 1) => EVENTS.push({ t: +(+t).toFixed(3), kind, amp });
const { scenes, items } = Core.collect(T, ev);
const subtitle = Core.makeSubtitles(TLd, /(一百三十九万|八十七万|三千块|二十年|底气|火箭|指数基金|裁员|一万块|一个月)/g, 13);

const SHAKES = items.filter(i => i.fx === 'slam').map(i => [i.tin + 0.22, i.shake || 10]);
const FLASH = [];
function shake(t) {
  let extra = 0;
  const r0 = T('k2') - .3, r1 = T('k3');
  if (t > r0 && t < r1) extra += 6 * Math.pow((t - r0) / (r1 - r0), 2);
  if (t > r1 && t < T('k4@0.7')) extra += 4;
  return Core.shakeAt(t, SHAKES, extra);
}

const bgc = $('bgc').getContext('2d'), fxc = $('fxc').getContext('2d');
const P = Core.particles(fxc), { burst, stream, RINGS } = P;
const glow = (x, y, r, col, a) => Core.glow(bgc, x, y, r, col, a, W, H);
const DUST = Core.makeDust(60, W, H), LINES = Core.makeLines(50, 1400, 2300);

/* ---------------- 背景 ---------------- */
function drawBG(t) {
  const c = bgc; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#07080b'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  const split = Math.max(win(t, T('o1') - .4, T('o5') + .3), win(t, T('f2') - .3, T('k2') - .45), win(t, T('c2') - .5, T('c4')));
  const fT = 1 + win(t, T('o2'), T('o3'), .4) * 1.2 - win(t, T('o3'), T('o5'), .4) * .7 + win(t, T('c2') - .4, T('c3') - .3) * 1.0;
  const fB = 1 + win(t, T('o3'), T('o5'), .4) * 1.2 - win(t, T('o2'), T('o3'), .4) * .7 + win(t, T('c3') - .3, T('c4')) * 1.0;
  glow(540, 640, 760, 'rgba(255,70,55,A)', .16 * split * fT);
  glow(540, 1200, 760, 'rgba(242,180,80,A)', .16 * split * fB);
  const cg = Math.max(win(t, T('k2') - .45, T('c2') - .55) * (.35 + .9 * clamp((t - T('k3')) / 2)), win(t, T('c5') - .1, T('e4') - .5) * 1.2, win(t, T('o5@0.62'), T('f2') - 1.3) * .9, win(t, T('e4') - .6, TOTAL + 1) * .7);
  glow(540, 900, 950, 'rgba(242,175,70,A)', .2 * cg);
  Core.drawDust(c, DUST, t, .25 + .6 * Math.max(win(t, T('c5'), TOTAL + 1), win(t, T('k4@0.7'), T('c2') - .5)), H);
  Core.drawSpeedLines(c, LINES, t, win(t, T('k3') - .05, T('k4.e') + .3, .3), 1400, H);
  Core.drawGodRays(c, 540, 900, t, win(t, T('c5') - .05, T('e4') - .5, .4), 1400);
  c.globalCompositeOperation = 'source-over';
}

/* ---------------- 小林的账户曲线 ---------------- */
const FV = m => 3000 * ((Math.pow(1.005, m) - 1) / 0.005) / 1e4;
const CX = y => 120 + 840 * y / 20, CY = v => 1350 - 620 * v / 150;
(function grid() {
  let g = '';
  for (let v = 0; v <= 150; v += 50) g += `<line x1="120" x2="960" y1="${CY(v)}" y2="${CY(v)}" stroke="rgba(255,255,255,${v ? .07 : .25})"/><text x="104" y="${CY(v) + 9}" font-size="24" fill="#6f6b64" text-anchor="end">${v}万</text>`;
  for (let y = 0; y <= 20; y += 5) g += `<text x="${CX(y)}" y="${CY(0) + 44}" font-size="24" fill="#6f6b64" text-anchor="middle">第${y}年</text>`;
  $('cgrid').innerHTML = g;
  $('snail').innerHTML = Core.SNAIL; $('rocket').innerHTML = Core.ROCKET;
})();
const MARKS = [[10, '第10年 · 49万'], [15, '第15年 · 87万'], [20, '第20年 · 139万']];
$('cMarks').innerHTML = MARKS.map(([y, l], i) => `<g id="mk${i}" opacity="0"><circle cx="${CX(y)}" cy="${CY(FV(y * 12))}" r="${y === 20 ? 14 : 10}" fill="#fff2c4"/><text x="${CX(y) + (y === 10 ? 18 : -26)}" y="${CY(FV(y * 12)) + (y === 10 ? 52 : y === 20 ? 60 : -26)}" text-anchor="${y === 10 ? 'start' : 'end'}" font-size="${y === 20 ? 44 : 32}" font-weight="900" fill="${y >= 15 ? '#ffe08f' : '#cfc6b6'}">${l}</text></g>`).join('');
function chartYears(t) {
  const Pt = [[T('k2') - .2, 0], [T('k2@0.9'), 10], [T('k3'), 10], [T('k4@0.12'), 15], [T('k4@0.62'), 20]];
  if (t <= Pt[0][0]) return 0;
  for (let i = 1; i < Pt.length; i++) if (t <= Pt[i][0]) {
    const k = (t - Pt[i - 1][0]) / (Pt[i][0] - Pt[i - 1][0]);
    return lerp(Pt[i - 1][1], Pt[i][1], i === 3 ? ei(k * .9 + .1) * .95 + k * .05 : i === 4 ? eo(k) : eio(k));
  }
  return 20;
}
function rocketPosAt(t) {
  const Y = chartYears(t), n = Math.round(Y * 12), tx = CX(n / 12), ty = CY(FV(n));
  const slope = Math.atan2(CY(FV(Math.min(240, n + 6))) - CY(FV(Math.max(0, n - 6))), CX(Math.min(240, n + 6) / 12) - CX(Math.max(0, n - 6) / 12));
  const fly = clamp((t - T('k4@0.68')) / 1.1);
  return [tx + ei(fly) * 600, ty - ei(fly) * 1400, slope - fly * .6, n, fly];
}
function hookChart(t) {
  const [rx, ry, ang, n, fly] = rocketPosAt(t);
  let d = '';
  for (let m = 0; m <= n; m++) d += (m ? 'L' : 'M') + CX(m / 12).toFixed(1) + ' ' + CY(FV(m)).toFixed(1);
  $('cLine').setAttribute('d', d);
  $('cArea').setAttribute('d', n ? d + `L${CX(n / 12)} ${CY(0)}L${CX(0)} ${CY(0)}Z` : '');
  const v = FV(n), tx = CX(n / 12), ty = CY(v);
  $('cNum').textContent = v < 10 ? v.toFixed(1) : Math.round(v);
  $('cYear').textContent = `第 ${Math.floor(n / 12 + 1e-6)} 年`;
  MARKS.forEach(([y], i) => $('mk' + i).setAttribute('opacity', clamp((n / 12 - y + .05) / .3)));
  const tk3 = T('k3');
  $('snail').setAttribute('transform', `translate(${tx - 20 + Math.sin(t * 6) * 3},${ty - 34})`); $('snail').setAttribute('opacity', t < tk3 ? 1 : 0);
  $('rocket').setAttribute('transform', `translate(${rx},${ry}) rotate(${ang * 180 / Math.PI})`); $('rocket').setAttribute('opacity', t >= tk3 && fly < 1 ? 1 : 0);
  const zin = clamp((t - T('k2@0.6')) / (tk3 - T('k2@0.6'))), zout = eo((t - tk3) / .5);
  const cw = $('chartWrap'); cw.style.transformOrigin = `${CX(10)}px ${CY(49)}px`; cw.style.transform = `scale(${1 + .25 * eio(zin) * (1 - zout)})`;
}
function rocketTrail(t) {
  const a = T('k3'); if (t < a || t > T('k4@0.68') + 1.7) return;
  fxc.globalCompositeOperation = 'lighter';
  const r = Core.rng(Math.floor(t * 60));
  for (let i = 0; i < 70; i++) {
    const tt = t - i / 70 * .5; if (tt < a) break;
    const p = rocketPosAt(tt), s = (1 - i / 70) * 18 + 2, j = (r() - .5) * 18 * (i / 70 + .2);
    const bx = p[0] - Math.cos(p[2]) * 60 + j, by = p[1] - Math.sin(p[2]) * 60 + j;
    fxc.fillStyle = i < 10 ? 'rgba(255,250,220,.9)' : i < 30 ? `rgba(255,190,90,${.7 - i / 70})` : `rgba(255,110,60,${.5 - i / 140})`;
    fxc.beginPath(); fxc.arc(bx, by, s, 0, 7); fxc.fill();
  }
  fxc.globalCompositeOperation = 'source-over';
}

/* ---------------- 各段动画 ---------------- */
const glitches = [...document.querySelectorAll('.glitch')].map(el => ({ el, t0: T(el.dataset.in) }));
const RW0 = T('f2') - 1.35, RW1 = T('f2') - .05;
function hooks(t) {
  const dimT = win(t, T('o3'), T('o5') + .2, .4) * .7, dimB = win(t, T('o2'), T('o3'), .4) * .7, dimAll = clamp((t - T('o5')) / .5) * .9;
  $('openL').style.opacity = 1 - Math.max(dimT, dimAll); $('openR').style.opacity = 1 - Math.max(dimB, dimAll);
  $('openBoth').style.filter = dimAll > .01 ? `blur(${dimAll * 10}px)` : '';
  glitches.forEach(g => { const k = t - g.t0; if (k > 0 && k < .55) { const r = Core.rng(Math.floor(t * 30) + 3)(); g.el.style.transform = `translateX(${(r - .5) * 40}px) skewX(${(r - .5) * 12}deg)`; g.el.style.filter = `drop-shadow(${6 * r}px 0 rgba(255,0,80,.9)) drop-shadow(${-6 * r}px 0 rgba(0,240,255,.9))`; } });
  document.querySelectorAll('.smile').forEach(s => s.setAttribute('stroke-dashoffset', 80 * (1 - eo((t - T('o4')) / .6))));
  const rwk = win(t, RW0, RW1, .15);
  $('scan').style.opacity = rwk; $('osd').style.opacity = rwk * (Math.floor(t * 4) % 2 ? 1 : .35);
  $('age').textContent = Math.round(45 - 20 * eio((t - RW0 - .1) / (RW1 - RW0 - .3)));
  $('banner').style.opacity = win(t, RW0 + .4, T('e4') - .6, .4);
  $('likes').textContent = Math.round(128 * eo((t - T('f2@0.68') - .3) / 1.4));
  const sp = eio((t - T('f4@0.55')) / .8);
  $('sp30').style.transform = `translate(${sp * 300}px,${sp * 40}px) scale(${1 - .55 * sp})`; $('sp30').style.opacity = 1 - clamp((t - T('f4@0.55') - .7) / .3);
  if (t > T('k2') - 1 && t < T('c2')) hookChart(t);
  const bl = t < T('c2@0.3') ? .35 : lerp(.35, .03, eo((t - T('c2@0.3')) / 1.0));
  $('bL').style.width = 384 * bl + 'px'; $('bL').style.opacity = t > T('c2@0.6') ? (Math.floor(t * 4) % 2 ? 1 : .25) : 1;
  $('bR').style.width = 384 * eo((t - T('c3@0.1')) / 1.6) + 'px';
  $('yrs').textContent = Math.round(19 * eo((t - T('c3@0.62')) / 1.0));
}

function setupFX() {
  P.init();
  const hit = T('o5@0.62') + .2;
  burst({ t0: hit, x: 540, y: 930, n: 170, spd: [400, 1500], g: 500, life: [.9, 2], size: [2, 7], colors: GOLD, seed: 11 });
  RINGS.push([hit, 540, 930, 800, '#ffd36b']); FLASH.push([hit, .55, .25]);
  ev(RW0, 'rewind', (RW1 - RW0) / 1);
  ev(T('o4') + .05, 'chime');
  // 工资到账
  ev(T('f2') - .1, 'coins');
  burst({ t0: T('f2') - .1, x: 540, y: -60, dx: 960, n: 40, ang: Math.PI / 2, spread: .3, spd: [250, 450], g: 1000, life: [2.4, 3], size: [20, 30], colors: GOLD, type: 'coin', over: 1.3, seed: 21, drag: .2 });
  [[T('f2@0.18'), 300, 560], [T('f2@0.35'), 330, 700]].forEach(([t0, x, y], i) => burst({ t0: t0 + .25, x, y, n: 16, ang: -Math.PI * .7, spread: 1.6, spd: [500, 900], g: 1400, life: [1.2, 1.8], size: [14, 22], colors: REDS, type: 'coinR', seed: 31 + i, drag: .6 }));
  burst({ t0: T('f2@0.68') + .3, x: 860, y: 830, dx: 120, n: 22, ang: -Math.PI / 2, spread: .8, spd: [120, 260], g: -60, life: [1.6, 2.4], size: [9, 15], colors: ['#ff6a6a', '#ff8a80', '#ff4d6d'], type: 'heart', over: 1.4, seed: 41, add: false });
  stream({ t0: T('f4@0.55') + .2, n: 18, over: 1.4, travel: .8, x0: 587, y0: 1188, cx: 740, cy: 1060, x1: 880, y1: 1205, seed: 51 });
  ev(T('f4@0.55') + .2, 'coins');
  // 火箭
  ev(T('k3'), 'launch'); FLASH.push([T('k3'), .85, .3]); RINGS.push([T('k3'), CX(10), CY(49), 600, '#fff2c4']);
  ev(T('k4@0.12'), 'hit', 16); SHAKES.push([T('k4@0.12'), 16]);
  ev(T('k4@0.62'), 'hit', 30); SHAKES.push([T('k4@0.62'), 30]); FLASH.push([T('k4@0.62'), .5, .25]);
  burst({ t0: T('k4@0.62'), x: CX(20), y: CY(139), n: 140, spd: [300, 1200], g: 400, life: [.8, 1.8], size: [2, 7], colors: GOLD, seed: 61 });
  RINGS.push([T('k4@0.62'), CX(20), CY(139), 500, '#ffd36b']);
  // 底气
  const dq = T('c5');
  FLASH.push([dq, .95, .35]); RINGS.push([dq + .15, 540, 900, 1000, '#ffe08f']); RINGS.push([dq + .35, 540, 900, 700, '#ffffff']);
  burst({ t0: dq + .1, x: 540, y: 900, n: 260, spd: [500, 1900], g: 300, life: [1, 2.4], size: [2, 8], colors: GOLD, seed: 81 });
  ev(T('c4'), 'type', 2.0);
  // 互动
  burst({ t0: T('e4@0.3') + .1, x: 540, y: 900, dx: 300, n: 140, ang: -Math.PI / 2, spread: 2.2, spd: [600, 1500], g: 1100, life: [1.8, 2.8], size: [6, 12], colors: [...GOLD, ...REDS], type: 'confetti', seed: 111, add: false });
}

function seek(t) {
  t = clamp(t, 0, TOTAL);
  Core.showScenes(scenes, items, t);
  hooks(t);
  drawBG(t);
  fxc.clearRect(0, 0, W, H);
  rocketTrail(t);
  P.draw(t);
  const rw = win(t, RW0, RW1, .15);
  Core.drawRewindBands(fxc, t, rw, W, H);
  const sh = shake(t), jx = rw ? (Core.rng(Math.floor(t * 30))() - .5) * 30 * rw : 0;
  $('world').style.transform = `translate(${sh.x + jx}px,${sh.y}px) rotate(${sh.r}deg) scale(${1 + sh.z})`;
  $('world').style.filter = rw ? `saturate(${1 - .6 * rw}) contrast(${1 + .25 * rw}) hue-rotate(${-20 * rw}deg)` : '';
  $('flash').style.opacity = Core.flashAt(t, FLASH);
  subtitle(t);
}
window.seek = seek; window.TOTAL = TOTAL; window.EVENTS = EVENTS; window.T = T;
Core.boot({ TL: TLd, W, H, seek, setupFX, EVENTS });
})();
