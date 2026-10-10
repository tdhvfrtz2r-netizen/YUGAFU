// 引擎：一个 three.js 场景 + HTML 字幕层；seek(t) 渲染任意时刻（逐帧截图用）
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { B, seg, eo, back, clamp, lerp, rng } from './lib.js';
import hook from './scenes/hook.js';
import title from './scenes/title.js';
import forest from './scenes/forest.js';
import dca from './scenes/dca.js';
import storm from './scenes/storm.js';
import snow from './scenes/snow.js';
import end from './scenes/end.js';

const SCENES = [hook, title, forest, dca, storm, snow, end];
const W = 1920, H = 1080;
const TOTAL = B(80) + 1.5;

const canvas = document.getElementById('gl');
const Q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q.has('noaa'), alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
const cam = new THREE.PerspectiveCamera(30, W / H, .1, 500);
const hemi = new THREE.HemisphereLight('#fff7ea', '#cdb99c', 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0da', 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(+(Q.get('sm') || 2048), +(Q.get('sm') || 2048)); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.ShadowMaterial({ opacity: .17 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const ui = document.getElementById('ui');
const $bg = document.getElementById('bg'), $fade = document.getElementById('fade'), $rays = document.getElementById('rays');
const $grain = document.getElementById('grain'), $stage = document.getElementById('stage');

// 颗粒质感
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256), r = rng(11);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $grain.style.backgroundImage = `url(${c.toDataURL()})`;
}

// —— 字幕 ——
const ALLTEXT = [];
class Cap {
  constructor(o) {
    this.o = o = Object.assign({ y: 90, align: 'center', cls: 'h1', stagger: .12, dur: .6, out: .45 }, o);
    const el = this.el = document.createElement('div'); el.className = 'cap ' + o.cls;
    el.style.top = o.y + 'px';
    if (o.align === 'center') { el.style.left = '0'; el.style.width = W + 'px'; el.style.textAlign = 'center'; }
    else if (o.align === 'left') { el.style.left = (o.x ?? 120) + 'px'; }
    else { el.style.right = (W - (o.x ?? W - 120)) + 'px'; el.style.textAlign = 'right'; }
    if (o.align === 'center' && o.x != null) { el.style.left = (o.x - W / 2) + 'px'; }
    el.innerHTML = o.html.split('\n').map(l => `<div class="ln"><span>${l}</span></div>`).join('');
    ui.appendChild(el); this.spans = [...el.querySelectorAll('.ln > span')]; ALLTEXT.push(o.html);
  }
  update(t) {
    const o = this.o;
    if (t < o.t0 || t > o.t1 + o.out) { this.el.style.display = 'none'; return; }
    this.el.style.display = '';
    this.spans.forEach((s, i) => {
      const k = eo(seg(t, o.t0 + i * o.stagger, o.t0 + i * o.stagger + o.dur));
      s.style.transform = `translateY(${((1 - k) * 105).toFixed(2)}%)`; s.style.opacity = k.toFixed(3);
    });
    const ko = seg(t, o.t1, o.t1 + o.out);
    this.el.style.opacity = (1 - ko).toFixed(3);
    this.el.style.filter = ko > 0 ? `blur(${(ko * 8).toFixed(1)}px)` : '';
    if (o.fx) o.fx(t, this.el);
  }
}
// —— 贴在 3D 位置上的标签 ——
const _v = new THREE.Vector3();
class Tag {
  constructor(o) {
    this.o = o = Object.assign({ cls: 'tag', ax: .5, ay: 1, dx: 0, dy: -10, out: .35, pop: .4 }, o);
    const el = this.el = document.createElement('div'); el.className = o.cls;
    if (o.html) el.innerHTML = o.html; ui.appendChild(el); if (o.html) ALLTEXT.push(o.html);
    if (o.style) Object.assign(el.style, o.style);
  }
  update(t) {
    const o = this.o;
    if (t < o.t0 || t > o.t1 + o.out) { this.el.style.display = 'none'; return; }
    const at = typeof o.at === 'function' ? o.at(t) : o.at;
    if (!at) { this.el.style.display = 'none'; return; }
    _v.copy(at).project(cam);
    const x = (_v.x + 1) / 2 * W + o.dx, y = (1 - _v.y) / 2 * H + o.dy;
    const ki = seg(t, o.t0, o.t0 + o.pop), ko = seg(t, o.t1, o.t1 + o.out);
    const s = .7 + .3 * back(ki);
    this.el.style.display = '';
    this.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${-o.ax * 100}%, ${-o.ay * 100}%) scale(${s.toFixed(3)})`;
    this.el.style.transformOrigin = `${o.ax * 100}% ${o.ay * 100}%`;
    this.el.style.opacity = (Math.min(1, ki * 2) * (1 - ko)).toFixed(3);
    if (o.text) this.el.innerHTML = o.text(t);
  }
}

const ctx = {
  THREE, scene, cam, renderer, sun, hemi, ui, W, H, EVENTS: [], caps: [], tags: [], cuts: [],
  ev(t, kind, amp = 1) { this.EVENTS.push({ t: +t.toFixed(3), kind, amp }); },
  cap(o) { const c = new Cap(o); this.caps.push(c); return c; },
  tag(o) { const c = new Tag(o); this.tags.push(c); return c; },
  el(html, cls = 'free', style = {}) {
    const e = document.createElement('div'); e.className = cls; e.innerHTML = html; Object.assign(e.style, style);
    ui.appendChild(e); ALLTEXT.push(html); this._owner.els.push(e); e.style.display = 'none'; return e;
  },
  cut(t, d = .32) { this.cuts.push([t, d]); },
  look(px, py, pz, tx, ty, tz, fov) {
    cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz);
    if (fov && cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  },
  sunAt(x, z, size = 14, dir = [9, 18, 11], power = 2.6) {
    sun.target.position.set(x, 0, z); sun.position.set(x + dir[0], dir[1], z + dir[2]); sun.intensity = power;
    const c = sun.shadow.camera;
    if (c.right !== size) { Object.assign(c, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 80 }); c.updateProjectionMatrix(); }
  },
  bg(c1, c2) { $stage.style.setProperty('--c1', c1); $stage.style.setProperty('--c2', c2); },
  rays(k) { $rays.style.opacity = k.toFixed(3); },
};

for (const S of SCENES) {
  S.root = new THREE.Group(); S.els = []; scene.add(S.root); ctx._owner = S;
  S.build(ctx, S.root);
}

let frame = 0;
window.seek = t => {
  ctx.t = t;
  // 每帧默认值，场景可覆盖
  ctx.bg('#f7f2ea', '#e2d8c8'); ctx.rays(0);
  hemi.intensity = 1.0; hemi.color.set('#fff7ea'); sun.color.set('#fff0da'); scene.environmentIntensity = .45;
  ground.material.opacity = .17; ground.position.y = 0;
  for (let i = 0; i < SCENES.length; i++) {
    const S = SCENES[i], on = t >= S.t0 && (t < S.t1 || i === SCENES.length - 1);
    S.root.visible = on;
    for (const e of S.els) if (!on) e.style.display = 'none';
    if (on) S.update(t, ctx);
  }
  for (const c of ctx.caps) c.update(t);
  cam.updateMatrixWorld();
  for (const c of ctx.tags) c.update(t);
  let f = 0; for (const [c, d] of ctx.cuts) f = Math.max(f, 1 - Math.abs(t - c) / d);
  $fade.style.opacity = clamp(f).toFixed(3);
  frame = Math.round(t * 30);
  $grain.style.backgroundPosition = `${(frame * 73) % 256}px ${(frame * 151) % 256}px`;
  renderer.render(scene, cam);
};

window.TOTAL = TOTAL;
window.EVENTS = ctx.EVENTS.sort((a, b) => a.t - b.t);
window.T = x => x;
const text = ALLTEXT.join('').replace(/<[^>]+>/g, '') + '0123456789万元年月份第¥%+-−.,:：，。？！、·→';
window.ready = Promise.all(['500 20px "Noto Sans SC"', '700 20px "Noto Sans SC"', '900 20px "Noto Sans SC"', '700 20px "Noto Serif SC"', '900 20px "Noto Serif SC"', '600 20px Inter', '800 20px Inter']
  .map(f => document.fonts.load(f, text))).then(() => document.fonts.ready).then(() => { window.seek(0); return true; });
if (!location.search.includes('render')) {
  // 预览：直接播放（带配乐）
  const a = new Audio('mix.m4a'); let t0 = null;
  window.ready.then(() => {
    document.body.onclick = () => { a.currentTime = 0; a.play(); t0 = performance.now(); };
    const loop = () => { if (t0 != null) window.seek(a.currentTime); requestAnimationFrame(loop); }; loop();
  });
}
