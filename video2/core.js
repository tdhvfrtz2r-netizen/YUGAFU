/* 共用动画内核：横版 engine.js 与竖版 short/engine.js 都基于它
 * 画面是时间 t 的纯函数，seek(t) 可跳到任意一帧；时间点用配音句子 id 引用：
 * 'o1' 句首, 'o1.e' 句尾, 'o1@0.5' 句中 50%, 'o1+0.3' / 'o1.e-1' 偏移。 */
window.Core = (() => {
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const ei = x => Math.pow(clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('en-US');
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const win = (t, a, b, f = 0.6) => clamp((t - a) / f) * clamp((b - t) / f);

function makeT(TL) {
  const LN = TL.lines;
  return function T(ref) {
    if (ref == null) return null;
    if (typeof ref === 'number') return ref;
    ref = String(ref).trim();
    if (ref === 'end') return TL.total;
    if (/^-?[\d.]+$/.test(ref)) return +ref;
    const m = ref.match(/^([a-z]\d)(\.e)?(?:@([\d.]+))?([+-][\d.]+)?$/);
    if (!m || !LN[m[1]]) throw new Error('bad ref ' + ref);
    const L = LN[m[1]];
    let t = m[2] ? L.e : L.s;
    if (m[3]) t = L.s + (L.e - L.s) * +m[3];
    if (m[4]) t += +m[4];
    return t;
  };
}

/* ---------------- 图标与人物 ---------------- */
const ICON = {
  phone: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><rect x="28" y="8" width="44" height="84" rx="9"/><line x1="44" y1="80" x2="56" y2="80"/></svg>',
  car: '<svg viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><path d="M10 66 L18 46 Q24 34 38 34 L78 34 Q90 34 98 46 L110 56 L110 70 L10 70 Z"/><line x1="40" y1="34" x2="36" y2="52"/><line x1="10" y1="52" x2="108" y2="52"/><circle cx="34" cy="72" r="11" fill="#07080b"/><circle cx="88" cy="72" r="11" fill="#07080b"/></svg>',
  coffee: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M18 40 H70 V66 Q70 86 50 86 H38 Q18 86 18 66 Z"/><path d="M70 48 H78 Q88 48 88 58 Q88 68 76 68 H70"/><path d="M34 28 Q30 20 36 12 M50 28 Q46 20 52 12"/></svg>',
  vault: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><rect x="12" y="14" width="76" height="70" rx="8"/><circle cx="50" cy="49" r="18"/><circle cx="50" cy="49" r="4" fill="currentColor"/><line x1="50" y1="31" x2="50" y2="37"/><line x1="50" y1="61" x2="50" y2="67"/><line x1="32" y1="49" x2="38" y2="49"/><line x1="62" y1="49" x2="68" y2="49"/><line x1="22" y1="84" x2="22" y2="92"/><line x1="78" y1="84" x2="78" y2="92"/></svg>',
  check: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21 L17 30 L33 11"/></svg>',
  cross: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M10 10 L30 30 M30 10 L10 30"/></svg>',
  heart: '<svg viewBox="0 0 40 40"><path fill="currentColor" d="M20 35 C6 25 2 18 2 12 C2 6 7 2 12 2 C16 2 19 5 20 8 C21 5 24 2 28 2 C33 2 38 6 38 12 C38 18 34 25 20 35 Z"/></svg>',
};
const SNAIL = `<g transform="scale(1.3)"><path d="M-46 16 Q-50 4 -36 2 L30 2 Q44 2 50 16 Z" fill="#9c958a"/><circle cx="2" cy="-14" r="24" fill="#3b372f" stroke="#c8bfae" stroke-width="5"/><path d="M2 -14 m-12 0 a12 12 0 1 0 12 -12 a7 7 0 1 0 7 7" fill="none" stroke="#c8bfae" stroke-width="4"/><line x1="40" y1="4" x2="50" y2="-20" stroke="#9c958a" stroke-width="4"/><circle cx="50" cy="-22" r="4" fill="#9c958a"/></g>`;
const ROCKET = `<g transform="scale(1.5)"><path d="M-30 -10 L-44 -24 L-20 -12 Z M-30 10 L-44 24 L-20 12 Z" fill="#ff8a5c"/><path d="M-34 -13 L18 -13 Q46 -13 60 0 Q46 13 18 13 L-34 13 Z" fill="#fff6e0" stroke="#f2c063" stroke-width="3"/><circle cx="20" cy="0" r="7" fill="#3a6fd8" stroke="#f2c063" stroke-width="3"/></g>`;
function setupIcons() {
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
}

/* ---------------- 场景与入场动画 ---------------- */
function collect(T, ev) {
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
  return { scenes, items };
}
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
function showScenes(scenes, items, t) {
  scenes.forEach(s => {
    const o = Math.min(clamp((t - s.s) / .35 + (s.s <= 0 ? 1 : 0)), clamp((s.e - t) / .35));
    s.el.style.opacity = o; s.el.style.visibility = o > 0 ? 'visible' : 'hidden';
  });
  items.forEach(it => { const sc = it.el.closest('.scene'); if (sc && sc.style.visibility === 'hidden') return; animItem(it, t); });
}

/* ---------------- 字幕：按标点切块，时长按字数分配 ---------------- */
function makeSubtitles(TL, KEY, maxLen = 17) {
  const SUBS = [];
  TL.order.forEach(id => {
    const L = TL.lines[id]; const parts = L.text.split(/(?<=[，。；：？！、])/).filter(Boolean);
    const chunks = []; let cur = '';
    parts.forEach(p => { if ((cur + p).replace(/[，。；：？！、]/g, '').length > maxLen && cur) { chunks.push(cur); cur = p; } else cur += p; });
    if (cur) chunks.push(cur);
    const w = chunks.map(c => c.length + 1.5); const W = w.reduce((a, b) => a + b, 0);
    let s = L.s;
    chunks.forEach((c, i) => { const d = (L.e - L.s) * w[i] / W; SUBS.push({ s, e: s + d, html: c.replace(/[，。；：、]$/, '').replace(/[。！？]$/, '').replace(/[，；：、。！]/g, '　').replace(KEY, '<b>$1</b>') }); s += d; });
  });
  let last = null;
  return t => {
    const s = SUBS.find(x => t >= x.s && t < x.e + 0.25);
    const h = s ? s.html : '';
    if (h !== last) { $('sub').innerHTML = h; last = h; }
  };
}

/* ---------------- 镜头震动 / 闪白 ---------------- */
function shakeAt(t, SHAKES, extra = 0) {
  let a = extra, z = 0;
  SHAKES.forEach(([t0, amp]) => { if (t >= t0 && t < t0 + 1.2) { const k = Math.exp(-(t - t0) * 7); a += amp * k; z += amp * 0.0012 * Math.exp(-(t - t0) * 5); } });
  const x = a * (Math.sin(t * 91.3) * 0.6 + Math.sin(t * 47.9 + 1.3) * 0.4);
  const y = a * (Math.cos(t * 83.1) * 0.6 + Math.sin(t * 59.7 + 2.1) * 0.4);
  const r = a * 0.012 * Math.sin(t * 37.3);
  return { x, y, r, z };
}
function flashAt(t, FLASH) { let o = 0; FLASH.forEach(([t0, a, d]) => { if (t >= t0) o = Math.max(o, a * Math.exp(-(t - t0) / d)); }); return o; }

/* ---------------- 粒子（全部由时间解析计算，可任意跳帧） ---------------- */
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
function particles(fxc) {
  const EM = [], RINGS = []; let COIN, COIN_R;
  const init = () => { COIN = coinSprite(40, false); COIN_R = coinSprite(40, true); };
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
  function drawCoin(x, y, r, ang, al, red) {
    const spr = red ? COIN_R : COIN; fxc.save(); fxc.globalAlpha = al; fxc.globalCompositeOperation = 'source-over';
    fxc.translate(x, y); fxc.scale(Math.max(0.12, Math.abs(Math.cos(ang))), 1);
    fxc.drawImage(spr, -r, -r, r * 2, r * 2); fxc.restore();
  }
  function draw(t) {
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
  return { init, burst, stream, draw, RINGS };
}

/* ---------------- 背景元素 ---------------- */
function glow(ctx, x, y, r, col, a, W, H) { if (a <= 0.003) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function makeDust(n, W, H) { const r = rng(99); return [...Array(n)].map(() => ({ x: r() * W, y: r() * (H + 120), v: 12 + r() * 30, s: 1 + r() * 2.5, ph: r() * 6 })); }
function drawDust(c, DUST, t, alpha, H) {
  DUST.forEach(d => { const y = H + 70 - ((d.y + t * d.v) % (H + 120)), x = d.x + Math.sin(t * .4 + d.ph) * 30; c.globalAlpha = alpha * (0.4 + 0.6 * Math.sin(t * 1.3 + d.ph) ** 2); c.fillStyle = '#f2c063'; c.beginPath(); c.arc(x, y, d.s, 0, 7); c.fill(); });
  c.globalAlpha = 1;
}
function makeLines(n, W, H) { const r = rng(5); return [...Array(n)].map(() => ({ x: r() * W, y: r() * H, v: 1600 + r() * 2200, l: 80 + r() * 260, w: 1 + r() * 2.5 })); }
function drawSpeedLines(c, LINES, t, a, W, H) {
  if (a <= 0) return;
  c.strokeStyle = '#ffe9b0';
  LINES.forEach(l => { const k = ((l.y + t * l.v) % (H + 420)) - 200; const x = ((l.x - t * l.v * .55) % W + W) % W - 240; c.globalAlpha = a * .35; c.lineWidth = l.w; c.beginPath(); c.moveTo(x, k); c.lineTo(x + l.l * .55, k - l.l); c.stroke(); });
  c.globalAlpha = 1;
}
function drawGodRays(c, cx, cy, t, a, len = 1100) {
  if (a <= 0) return;
  c.save(); c.translate(cx, cy); c.rotate(t * .08);
  for (let i = 0; i < 18; i++) { c.rotate(Math.PI * 2 / 18); const g = c.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, `rgba(255,214,120,${.22 * a})`); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-14, 0); c.lineTo(-90, -len); c.lineTo(90, -len); c.lineTo(14, 0); c.fill(); }
  c.restore();
}
function drawRewindBands(fxc, t, k, W, H) {
  if (k <= 0) return;
  const r = rng(Math.floor(t * 30) + 77);
  fxc.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const y = r() * H, h = 2 + r() * 26; fxc.fillStyle = `rgba(255,255,255,${k * .12 * r()})`; fxc.fillRect(0, y, W, h); }
  const ty = ((t * 900) % (H + 220)) - 100; fxc.fillStyle = `rgba(255,255,255,${k * .18})`; fxc.fillRect(0, ty, W, 40);
  for (let i = 0; i < 30; i++) { const y = r() * H; fxc.fillStyle = `rgba(242,192,99,${k * .25})`; fxc.fillRect(r() * W, y, 200 + r() * 500, 2); }
  fxc.globalCompositeOperation = 'source-over';
}

/* ---------------- 字体预加载与播放 ---------------- */
function boot({ TL, W, H, seek, setupFX, EVENTS }) {
  const render = location.search.includes('render');
  if (render) document.body.classList.add('render');
  const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); $('stage').style.transform = `scale(${k})`; };
  if (!render) { fit(); addEventListener('resize', fit); }
  const ALLTXT = document.body.innerText + TL.order.map(id => TL.lines[id].text).join('') + '0123456789,.¥万年第岁';
  const FACES = ['400 20px "Noto Sans SC"', '500 20px "Noto Sans SC"', '700 20px "Noto Sans SC"', '900 20px "Noto Sans SC"', '700 20px "Noto Serif SC"', '900 20px "Noto Serif SC"'];
  window.ready = Promise.all(FACES.map(f => document.fonts.load(f, ALLTXT))).then(() => document.fonts.ready).then(() => new Promise(r => setTimeout(r, 300))).then(() => { setupFX(); EVENTS.sort((a, b) => a.t - b.t); seek(0); return true; });
  let playing = false, t0 = 0, off = 0; const audio = new Audio('mix.m4a');
  function loop() { if (!playing) return; const t = off + (performance.now() - t0) / 1000; seek(t); if (t < TL.total) requestAnimationFrame(loop); else playing = false; }
  function toggle() {
    if (playing) { playing = false; off += (performance.now() - t0) / 1000; audio.pause(); $('play').style.display = 'flex'; }
    else { if (off >= TL.total) off = 0; playing = true; t0 = performance.now(); audio.currentTime = off; audio.play().catch(() => {}); $('play').style.display = 'none'; loop(); }
  }
  if (!render) { $('play').onclick = toggle; addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); toggle(); } }); }
}

return { clamp, lerp, eo, ei, eio, back, $, fmt, rng, win, makeT, ICON, SNAIL, ROCKET, setupIcons, collect, animItem, showScenes,
  makeSubtitles, shakeAt, flashAt, GOLD, REDS, particles, glow, makeDust, drawDust, makeLines, drawSpeedLines, drawGodRays, drawRewindBands, boot };
})();
