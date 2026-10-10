/* 第一期 · 合成引擎：把各场景拼到一起，负责背景、粒子、震动、闪白、字幕和播放。通用部分见 ../video2/core.js */
(() => {
const TLd = window.TL, TOTAL = TLd.total;
const { clamp, $, win } = Core;
const T = Core.makeT(TLd);
const W = 1920, H = 1080;
const EVENTS = [];
const ev = (t, kind, amp = 1) => EVENTS.push({ t: +(+t).toFixed(3), kind, amp });

const style = document.createElement('style');
style.textContent = Kit.list.map(s => s.css || '').join('\n');
document.head.appendChild(style);
Kit.list.forEach(s => $('scenes').insertAdjacentHTML('beforeend', s.html || ''));

const bgc = $('bgc').getContext('2d'), fxc = $('fxc').getContext('2d');
const P = Core.particles(fxc);
const SHAKES = [], FLASH = [], RUMBLE = [];
const ctx = {
  T, TL: TLd, TOTAL, Core, $, W, H, bgc, fxc, P, ev, win, clamp,
  shake: (t, amp) => SHAKES.push([t, amp]),
  flash: (t, a = .6, d = .25) => FLASH.push([t, a, d]),
  ring: (t, x, y, R, c = '#ffd36b') => P.RINGS.push([t, x, y, R, c]),
  rumble: f => RUMBLE.push(f),
  glow: (x, y, r, col, a) => Core.glow(bgc, x, y, r, col, a, W, H),
};
Kit.list.forEach(s => s.setup && s.setup(ctx));
Core.setupIcons();
const { scenes, items } = Core.collect(T, ev);
items.filter(i => i.fx === 'slam').forEach(i => SHAKES.push([i.tin + 0.22, i.shake || 10]));
const kw = Kit.list.flatMap(s => s.keywords || []).sort((a, b) => b.length - a.length);
const subtitle = Core.makeSubtitles(TLd, kw.length ? new RegExp('(' + kw.join('|') + ')', 'g') : /$^/g, 17);
const DUST = Core.makeDust(70, W, H);

function setupFX() { P.init(); Kit.list.forEach(s => s.events && s.events(ctx)); }

function seek(t) {
  t = clamp(t, 0, TOTAL);
  Core.showScenes(scenes, items, t);
  Kit.list.forEach(s => s.hook && s.hook(t, ctx));
  bgc.globalCompositeOperation = 'source-over'; bgc.fillStyle = '#07080b'; bgc.fillRect(0, 0, W, H);
  bgc.globalCompositeOperation = 'lighter';
  let dust = .22;
  Kit.list.forEach(s => { if (s.bg) { const r = s.bg(t, ctx); if (r && r.dust != null) dust = Math.max(dust, r.dust); } });
  Core.drawDust(bgc, DUST, t, dust, H);
  bgc.globalCompositeOperation = 'source-over'; bgc.globalAlpha = 1;
  fxc.clearRect(0, 0, W, H);
  P.draw(t);
  Kit.list.forEach(s => s.fx && s.fx(t, ctx));
  fxc.globalAlpha = 1; fxc.globalCompositeOperation = 'source-over';
  const sh = Core.shakeAt(t, SHAKES, RUMBLE.reduce((a, f) => a + (f(t) || 0), 0));
  let filt = ''; Kit.list.forEach(s => { if (s.worldFilter) { const f = s.worldFilter(t, ctx); if (f) filt = f; } });
  $('world').style.transform = `translate(${sh.x}px,${sh.y}px) rotate(${sh.r}deg) scale(${1 + sh.z})`;
  $('world').style.filter = filt;
  $('flash').style.opacity = Core.flashAt(t, FLASH);
  subtitle(t);
}
window.seek = seek; window.TOTAL = TOTAL; window.EVENTS = EVENTS; window.T = T;
Core.boot({ TL: TLd, W, H, seek, setupFX, EVENTS, extraText: Kit.list.map(s => s.text || '').join('') });
})();
