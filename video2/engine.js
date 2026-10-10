/* 月薪一万的两个人 —— 逐帧可寻址的动画引擎
 * 所有画面都是时间 t 的纯函数：seek(t) 可以跳到任意一帧，渲染器逐帧截图。
 * 时间点用配音句子 id 引用：'o1' 句首, 'o1.e' 句尾, 'o1@0.5' 句中 50%, 'o1+0.3' / 'o1.e-1' 偏移。 */
(() => {
const TLd = window.TL, LN = TLd.lines, TOTAL = TLd.total;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const ei = x => Math.pow(clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('en-US');

function T(ref) {
  if (ref == null) return null;
  if (typeof ref === 'number') return ref;
  ref = String(ref).trim();
  if (ref === 'end') return TOTAL;
  if (/^-?[\d.]+$/.test(ref)) return +ref;
  const m = ref.match(/^([a-z]\d)(\.e)?(?:@([\d.]+))?([+-][\d.]+)?$/);
  if (!m || !LN[m[1]]) throw new Error('bad ref ' + ref);
  const L = LN[m[1]];
  let t = m[2] ? L.e : L.s;
  if (m[3]) t = L.s + (L.e - L.s) * +m[3];
  if (m[4]) t += +m[4];
  return t;
}
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------------- icons ---------------- */
const ICON = {
  phone: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><rect x="28" y="8" width="44" height="84" rx="9"/><line x1="44" y1="80" x2="56" y2="80"/></svg>',
  car: '<svg viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><path d="M10 66 L18 46 Q24 34 38 34 L78 34 Q90 34 98 46 L110 56 L110 70 L10 70 Z"/><line x1="40" y1="34" x2="36" y2="52"/><line x1="10" y1="52" x2="108" y2="52"/><circle cx="34" cy="72" r="11" fill="#07080b"/><circle cx="88" cy="72" r="11" fill="#07080b"/></svg>',
  coffee: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M18 40 H70 V66 Q70 86 50 86 H38 Q18 86 18 66 Z"/><path d="M70 48 H78 Q88 48 88 58 Q88 68 76 68 H70"/><path d="M34 28 Q30 20 36 12 M50 28 Q46 20 52 12"/></svg>',
  vault: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><rect x="12" y="14" width="76" height="70" rx="8"/><circle cx="50" cy="49" r="18"/><circle cx="50" cy="49" r="4" fill="currentColor"/><line x1="50" y1="31" x2="50" y2="37"/><line x1="50" y1="61" x2="50" y2="67"/><line x1="32" y1="49" x2="38" y2="49"/><line x1="62" y1="49" x2="68" y2="49"/><line x1="22" y1="84" x2="22" y2="92"/><line x1="78" y1="84" x2="78" y2="92"/></svg>',
  check: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21 L17 30 L33 11"/></svg>',
  cross: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M10 10 L30 30 M30 10 L10 30"/></svg>',
  heart: '<svg viewBox="0 0 40 40"><path fill="currentColor" d="M20 35 C6 25 2 18 2 12 C2 6 7 2 12 2 C16 2 19 5 20 8 C21 5 24 2 28 2 C33 2 38 6 38 12 C38 18 34 25 20 35 Z"/></svg>',
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = ICON[el.dataset.icon];
  if (!el.style.width) { el.style.width = '84px'; el.style.height = '84px'; }
  el.style.display = 'inline-block'; el.style.flex = 'none';
  const sv = el.querySelector('svg'); sv.style.width = '100%'; sv.style.height = '100%';
});
document.querySelectorAll('[data-person]').forEach((el, i) => {
  const c = el.dataset.person;
  el.innerHTML = `<svg viewBox="0 0 260 380"><defs><linearGradient id="pg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1c22"/><stop offset="1" stop-color="#0b0c10"/></linearGradient></defs>
    <g style="filter:drop-shadow(0 0 14px ${c}88)"><circle cx="130" cy="92" r="62" fill="url(#pg${i})" stroke="${c}" stroke-width="5"/>
    <path d="M14 380 C14 250 60 186 130 186 C200 186 246 250 246 380 Z" fill="url(#pg${i})" stroke="${c}" stroke-width="5"/></g>
    ${el.dataset.smile ? `<path class="smile" d="M100 104 Q130 132 160 104" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="80"/>` : ''}</svg>`;
});
$('r1vault').innerHTML = ICON.vault.replace('<svg ', '<svg width="90" height="90" ');

/* ---------------- events (also exported for sound design) ---------------- */
const EVENTS = [];
const ev = (t, kind, amp = 1) => EVENTS.push({ t: +(+t).toFixed(3), kind, amp });

/* ---------------- scenes & animated elements ---------------- */
const scenes = [...document.querySelectorAll('.scene')].map(el => ({ el, id: el.id, s: T(el.dataset.s), e: T(el.dataset.e) }));
const items = [...document.querySelectorAll('.a')].map(el => {
  const it = { el, tin: T(el.dataset.in || 0), d: +(el.dataset.d || 0.7), fx: el.dataset.fx || 'up', tout: T(el.dataset.out), base: el.dataset.base || '', shake: +(el.dataset.shake || 0) };
  if (it.fx === 'type') it.text = el.textContent;
  if (it.fx === 'slam') ev(it.tin, 'hit', it.shake || 10);
  if (it.fx === 'drop') ev(it.tin, 'ding');
  if (it.fx === 'pop') ev(it.tin, 'pop');
  if (it.fx === 'left') ev(it.tin, 'cash');
  return it;
});
function animItem(it, t) {
  const lt = t - it.tin; let op = 0, tr = '', fl = '';
  if (lt >= 0) {
    switch (it.fx) {
      case 'slam': {
        const k = clamp(lt / 0.3);
        const sc = k < 1 ? 2.3 - 1.36 * eo(k) : 0.94 + 0.06 * eo((lt - 0.3) / 0.3);
        op = clamp(lt / 0.12); tr = `scale(${sc})`; if (k < 1) fl = `blur(${(1 - k) * 8}px)`; break; }
      case 'pop': { const k = lt / 0.45; op = clamp(lt / 0.15); tr = `scale(${0.4 + 0.6 * back(k)})`; break; }
      case 'drop': { const k = lt / 0.5; op = clamp(lt / 0.18); tr = `translateY(${-70 * (1 - back(k))}px)`; break; }
      case 'left': { const k = eo(lt / it.d); op = k; tr = `translateX(${-160 * (1 - k)}px)`; break; }
      case 'fade': op = eo(lt / it.d); break;
      case 'blur': { const k = eo(lt / (it.d + 0.4)); op = k; fl = `blur(${(1 - k) * 18}px)`; break; }
      case 'type': { op = 1; const n = Math.floor(clamp(lt / it.d) * it.text.length); it.el.textContent = it.text.slice(0, n); break; }
      default: { const k = eo(lt / it.d); op = k; tr = `translateY(${40 * (1 - k)}px)`; }
    }
  }
  if (it.tout != null && t > it.tout) { const q = clamp((t - it.tout) / 0.35); op *= 1 - q; tr += ` translateY(${-24 * q}px)`; }
  it.el.style.opacity = op;
  it.el.style.transform = (tr + ' ' + it.base).trim();
  it.el.style.filter = fl;
}

/* ---------------- subtitles ---------------- */
const KEY = /(一百三十九万|一百三十九|八十七万|四十九万|二十一万|六十七万|三千八|三千块|二十年|底气|复利|火箭|指数基金|两成|一万杯咖啡|先存后花|裁员|一万块)/g;
const SUBS = [];
TLd.order.forEach(id => {
  const L = LN[id]; const parts = L.text.split(/(?<=[，。；：？！、])/).filter(Boolean);
  const chunks = []; let cur = '';
  parts.forEach(p => { if ((cur + p).replace(/[，。；：？！、]/g, '').length > 17 && cur) { chunks.push(cur); cur = p; } else cur += p; });
  if (cur) chunks.push(cur);
  const w = chunks.map(c => c.length + 1.5); const W = w.reduce((a, b) => a + b, 0);
  let s = L.s;
  chunks.forEach((c, i) => { const d = (L.e - L.s) * w[i] / W; SUBS.push({ s, e: s + d, html: c.replace(/[，。；：、]$/, '').replace(/[。！？]$/, '').replace(/[，；：、。！]/g, '　').replace(KEY, '<b>$1</b>') }); s += d; });
});
let lastSub = null;
function subtitle(t) {
  const s = SUBS.find(x => t >= x.s && t < x.e + 0.25);
  const h = s ? s.html : '';
  if (h !== lastSub) { $('sub').innerHTML = h; lastSub = h; }
}

/* ---------------- camera shake / flash ---------------- */
const SHAKES = items.filter(i => i.fx === 'slam').map(i => [i.tin + 0.22, i.shake || 10]);
const FLASH = [];
function addShake(t, a) { SHAKES.push([t, a]); }
function shake(t) {
  let a = 0, z = 0;
  SHAKES.forEach(([t0, amp]) => { if (t >= t0 && t < t0 + 1.2) { const k = Math.exp(-(t - t0) * 7); a += amp * k; z += amp * 0.0012 * Math.exp(-(t - t0) * 5); } });
  // 火箭前的持续低频震动
  const r0 = T('k1'), r1 = T('k3');
  if (t > r0 && t < r1) a += 5 * Math.pow((t - r0) / (r1 - r0), 2);
  if (t > r1 && t < T('k4@0.7')) a += 4;
  const x = a * (Math.sin(t * 91.3) * 0.6 + Math.sin(t * 47.9 + 1.3) * 0.4);
  const y = a * (Math.cos(t * 83.1) * 0.6 + Math.sin(t * 59.7 + 2.1) * 0.4);
  const r = a * 0.012 * Math.sin(t * 37.3);
  return { x, y, r, z };
}
function flash(t) { let o = 0; FLASH.forEach(([t0, a, d]) => { if (t >= t0) o = Math.max(o, a * Math.exp(-(t - t0) / d)); }); return o; }

/* ---------------- particles ---------------- */
const bgc = $('bgc').getContext('2d'), fxc = $('fxc').getContext('2d');
const EM = [], RINGS = [];
const GOLD = ['#ffe08f', '#f2c063', '#ffd36b', '#fff2c4', '#c48a2c'];
const REDS = ['#ff5a4e', '#ff8a80', '#d8443a', '#ffb3a8'];
function coinSprite(r, red) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2 + 4; const g = c.getContext('2d');
  const gr = g.createRadialGradient(r * .7, r * .6, 1, r + 2, r + 2, r);
  gr.addColorStop(0, red ? '#ffd0c9' : '#fff3c4'); gr.addColorStop(.6, red ? '#ff6a5c' : '#f2c063'); gr.addColorStop(1, red ? '#a3291f' : '#a8751f');
  g.fillStyle = gr; g.beginPath(); g.arc(r + 2, r + 2, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(r + 2, r + 2, r * .78, 0, 7); g.stroke();
  g.fillStyle = red ? '#6b130d' : '#6b4a0d'; g.font = `900 ${r * 1.1}px "Noto Sans SC"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¥', r + 2, r + 3);
  return c;
}
let COIN, COIN_R;
function burst(o) {
  const r = rng(o.seed || 1), ps = [];
  for (let i = 0; i < o.n; i++) {
    const a = o.ang != null ? o.ang + (r() - .5) * (o.spread || 1) : r() * Math.PI * 2, s = lerp(o.spd[0], o.spd[1], r());
    ps.push({ x: (o.x || 0) + (o.dx ? (r() - .5) * o.dx : 0), y: (o.y || 0) + (o.dy ? (r() - .5) * o.dy : 0), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: lerp(o.life[0], o.life[1], r()), size: lerp(o.size[0], o.size[1], r()), c: o.colors[Math.floor(r() * o.colors.length)], delay: (o.over || 0) * r(), spin: (r() - .5) * 14, ph: r() * 6 });
  }
  EM.push({ t0: o.t0, g: o.g || 0, drag: o.drag || 1.5, type: o.type || 'spark', ps, add: o.add !== false });
}
function stream(o) {
  const r = rng(o.seed || 7), ps = [];
  for (let i = 0; i < o.n; i++) ps.push({ delay: o.over * i / o.n, off: (r() - .5) * 40, size: lerp(14, 22, r()), spin: r() * 6 });
  EM.push({ t0: o.t0, type: 'stream', ps, o });
}
function drawParticles(t) {
  fxc.save();
  EM.forEach(E => {
    if (t < E.t0 || t > E.t0 + 8) return;
    if (E.type === 'stream') {
      const { o } = E;
      E.ps.forEach(p => {
        const u = (t - E.t0 - p.delay) / o.travel; if (u < 0 || u > 1) return;
        const k = eio(u), x = (1 - k) * (1 - k) * o.x0 + 2 * (1 - k) * k * o.cx + k * k * o.x1, y = (1 - k) * (1 - k) * o.y0 + 2 * (1 - k) * k * o.cy + k * k * o.y1 + p.off * Math.sin(k * Math.PI);
        drawCoin(x, y, p.size * (1 - .4 * k), t * 6 + p.spin, 1 - Math.pow(u, 6), false);
      });
      return;
    }
    E.ps.forEach(p => {
      const tau = t - E.t0 - p.delay; if (tau < 0 || tau > p.life) return;
      const f = (1 - Math.exp(-E.drag * tau)) / E.drag;
      const x = p.x + p.vx * f, y = p.y + p.vy * f + 0.5 * E.g * tau * tau;
      const al = 1 - tau / p.life;
      if (E.type === 'coin' || E.type === 'coinR') { drawCoin(x, y, p.size, p.spin * tau + p.ph, Math.min(1, al * 3), E.type === 'coinR'); return; }
      fxc.globalCompositeOperation = E.add ? 'lighter' : 'source-over';
      fxc.globalAlpha = al;
      fxc.fillStyle = p.c;
      if (E.type === 'heart') {
        const s = p.size, hx = x + Math.sin(tau * 3 + p.ph) * 20;
        fxc.beginPath(); fxc.moveTo(hx, y + s * .9); fxc.bezierCurveTo(hx - s * 1.4, y, hx - s * .8, y - s, hx, y - s * .3); fxc.bezierCurveTo(hx + s * .8, y - s, hx + s * 1.4, y, hx, y + s * .9); fxc.fill();
      } else if (E.type === 'shard' || E.type === 'confetti') {
        fxc.save(); fxc.translate(x, y); fxc.rotate(p.spin * tau + p.ph); fxc.fillRect(-p.size, -p.size * .45, p.size * 2, p.size * .9); fxc.restore();
      } else {
        const sp = Math.hypot(p.vx, p.vy) * Math.exp(-E.drag * tau) * 0.03;
        fxc.beginPath(); fxc.arc(x, y, p.size * (0.4 + 0.6 * al), 0, 7); fxc.fill();
        if (sp > 2) { fxc.strokeStyle = p.c; fxc.lineWidth = p.size * .8; fxc.beginPath(); fxc.moveTo(x, y); fxc.lineTo(x - p.vx * 0.03 * Math.exp(-E.drag * tau), y - p.vy * 0.03 * Math.exp(-E.drag * tau)); fxc.stroke(); }
      }
    });
  });
  fxc.restore();
  fxc.globalAlpha = 1; fxc.globalCompositeOperation = 'source-over';
  RINGS.forEach(([t0, x, y, R, c]) => {
    const k = (t - t0) / 0.9; if (k < 0 || k > 1) return;
    fxc.globalAlpha = (1 - k) * 0.9; fxc.strokeStyle = c; fxc.lineWidth = 14 * (1 - k) + 1;
    fxc.beginPath(); fxc.arc(x, y, R * eo(k), 0, 7); fxc.stroke();
  });
  fxc.globalAlpha = 1;
}
function drawCoin(x, y, r, ang, al, red) {
  const spr = red ? COIN_R : COIN; fxc.save(); fxc.globalAlpha = al; fxc.globalCompositeOperation = 'source-over';
  fxc.translate(x, y); fxc.scale(Math.max(0.12, Math.abs(Math.cos(ang))), 1);
  fxc.drawImage(spr, -r, -r, r * 2, r * 2); fxc.restore();
}

/* ---------------- background ---------------- */
function win(t, a, b, f = 0.6) { return clamp((t - a) / f) * clamp((b - t) / f); }
function glow(ctx, x, y, r, col, a) { if (a <= 0.003) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); }
const DUST = (() => { const r = rng(99); return [...Array(70)].map(() => ({ x: r() * 1920, y: r() * 1200, v: 12 + r() * 30, s: 1 + r() * 2.5, ph: r() * 6 })); })();
const LINES = (() => { const r = rng(5); return [...Array(60)].map(() => ({ x: r() * 2400, y: r() * 1400, v: 1600 + r() * 2200, l: 80 + r() * 260, w: 1 + r() * 2.5 })); })();
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
  DUST.forEach(d => { const y = 1150 - ((d.y + t * d.v) % 1200), x = d.x + Math.sin(t * .4 + d.ph) * 30; c.globalAlpha = dustA * (0.4 + 0.6 * Math.sin(t * 1.3 + d.ph) ** 2); c.fillStyle = '#f2c063'; c.beginPath(); c.arc(x, y, d.s, 0, 7); c.fill(); });
  c.globalAlpha = 1;
  // 火箭速度线
  const sl = win(t, T('k3') - .05, T('k5') + .2, .3);
  if (sl > 0) {
    c.strokeStyle = '#ffe9b0';
    LINES.forEach(l => { const k = ((l.y + t * l.v) % 1500) - 200; const x = ((l.x - t * l.v * .55) % 2400 + 2400) % 2400 - 240; c.globalAlpha = sl * .35; c.lineWidth = l.w; c.beginPath(); c.moveTo(x, k); c.lineTo(x + l.l * .55, k - l.l); c.stroke(); });
    c.globalAlpha = 1;
  }
  // 底气背后的光芒
  const gr = win(t, T('c5') - .05, T('t1') - .9, .4);
  if (gr > 0) {
    c.save(); c.translate(960, 470); c.rotate(t * .08);
    for (let i = 0; i < 18; i++) { c.rotate(Math.PI * 2 / 18); const g = c.createLinearGradient(0, 0, 0, -1100); g.addColorStop(0, `rgba(255,214,120,${.22 * gr})`); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-14, 0); c.lineTo(-90, -1100); c.lineTo(90, -1100); c.lineTo(14, 0); c.fill(); }
    c.restore();
  }
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
  $('snail').innerHTML = `<g transform="scale(1.3)"><path d="M-46 16 Q-50 4 -36 2 L30 2 Q44 2 50 16 Z" fill="#9c958a"/><circle cx="2" cy="-14" r="24" fill="#3b372f" stroke="#c8bfae" stroke-width="5"/><path d="M2 -14 m-12 0 a12 12 0 1 0 12 -12 a7 7 0 1 0 7 7" fill="none" stroke="#c8bfae" stroke-width="4"/><line x1="40" y1="4" x2="50" y2="-20" stroke="#9c958a" stroke-width="4"/><circle cx="50" cy="-22" r="4" fill="#9c958a"/></g>`;
  $('rocket').innerHTML = `<g transform="scale(1.5)"><path d="M-30 -10 L-44 -24 L-20 -12 Z M-30 10 L-44 24 L-20 12 Z" fill="#ff8a5c"/><path d="M-34 -13 L18 -13 Q46 -13 60 0 Q46 13 18 13 L-34 13 Z" fill="#fff6e0" stroke="#f2c063" stroke-width="3"/><circle cx="20" cy="0" r="7" fill="#3a6fd8" stroke="#f2c063" stroke-width="3"/></g>`;
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
  COIN = coinSprite(40, false); COIN_R = coinSprite(40, true);
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
  ev(T('o4') + .05, 'chime'); ev(T('f6@0.3'), 'pop'); ev(T('c4'), 'type', T('c4.e') - T('c4'));
}

/* ---------------- master seek ---------------- */
function rewindBands(t) {
  const rw0 = T('r1') - 1.15, rw1 = T('r1.e') + .1; const k = win(t, rw0, rw1, .2); if (k <= 0) return;
  const r = rng(Math.floor(t * 30) + 77);
  fxc.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const y = r() * 1080, h = 2 + r() * 26; fxc.fillStyle = `rgba(255,255,255,${k * .12 * r()})`; fxc.fillRect(0, y, 1920, h); }
  const ty = ((t * 900) % 1300) - 100; fxc.fillStyle = `rgba(255,255,255,${k * .18})`; fxc.fillRect(0, ty, 1920, 40);
  // 倒带中的后退光线
  for (let i = 0; i < 30; i++) { const y = r() * 1080; fxc.fillStyle = `rgba(242,192,99,${k * .25})`; fxc.fillRect(r() * 1920, y, 200 + r() * 500, 2); }
  fxc.globalCompositeOperation = 'source-over';
}
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
  scenes.forEach(s => {
    const o = Math.min(clamp((t - s.s) / .35 + (s.s <= 0 ? 1 : 0)), clamp((s.e - t) / .35));
    s.el.style.opacity = o; s.el.style.visibility = o > 0 ? 'visible' : 'hidden';
  });
  items.forEach(it => { const sc = it.el.closest('.scene'); if (sc && sc.style.visibility === 'hidden') return; animItem(it, t); });
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
const render = location.search.includes('render');
if (render) document.body.classList.add('render');
const fit = () => { const k = Math.min(innerWidth / 1920, innerHeight / 1080); $('stage').style.transform = `scale(${k})`; };
if (!render) { fit(); addEventListener('resize', fit); }
const ALLTXT = document.body.innerText + TLd.order.map(id => LN[id].text).join('') + '0123456789,.¥万年第岁';
const FACES = ['400 20px "Noto Sans SC"', '500 20px "Noto Sans SC"', '700 20px "Noto Sans SC"', '900 20px "Noto Sans SC"', '700 20px "Noto Serif SC"', '900 20px "Noto Serif SC"'];
window.ready = Promise.all(FACES.map(f => document.fonts.load(f, ALLTXT))).then(() => document.fonts.ready).then(() => new Promise(r => setTimeout(r, 300))).then(() => { setupFX(); EVENTS.sort((a, b) => a.t - b.t); seek(0); return true; });

let playing = false, t0 = 0, off = 0; const audio = new Audio('mix.m4a');
function loop() { if (!playing) return; const t = off + (performance.now() - t0) / 1000; seek(t); if (t < TOTAL) requestAnimationFrame(loop); else playing = false; }
function toggle() {
  if (playing) { playing = false; off += (performance.now() - t0) / 1000; audio.pause(); $('play').style.display = 'flex'; }
  else { if (off >= TOTAL) off = 0; playing = true; t0 = performance.now(); audio.currentTime = off; audio.play().catch(() => {}); $('play').style.display = 'none'; loop(); }
}
if (!render) { $('play').onclick = toggle; addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); toggle(); } }); }
})();
