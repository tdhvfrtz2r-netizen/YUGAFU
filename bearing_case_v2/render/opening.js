// Opening clip (browser side): frame(t) paints one 1920x1080 frame at time t (s).
// Wide shot == slide 1's right-hand drive (same place, same scale: 144 px/in), so slide 1 -> slide 2 is seamless.
(function () {
  const S = window.SCENE, D = S.DRIVE, C = S.COL, TAU = S.TAU;
  const PPI = 144, SW = 1920, SH = 1080;
  const ox = D.slideX, oy = D.slideY;
  const B = { x: ox + D.B.x, y: oy + D.B.y };
  const Rb = D.Rb;
  const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const hash = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---- timeline (s) ----
  const T_ZOOM_IN = [3.0, 5.0], T_BREAK = 6.0, T_CLUMP = [6.0, 7.8], T_STOP = [6.0, 8.6];
  const T_SURGE = [6.8, 8.3], T_ALARM = 8.6, T_TRIP = 9.3, T_ZOOM_OUT = [10.0, 12.0];
  const W0 = TAU / (D.spin.motor / 1000);
  const omega = (t) => W0 * (1 - sm(T_STOP[0], T_STOP[1], t));
  const angCache = [];
  function motorAngle(t) {                       // integrate omega, cached per 1 ms
    const n = Math.round(t * 1000);
    if (!angCache.length) angCache.push(0);
    for (let k = angCache.length; k <= n; k++) angCache.push(angCache[k - 1] + omega((k - 1) / 1000) / 1000);
    return angCache[n];
  }
  const zoom = (t) => sm(T_ZOOM_IN[0], T_ZOOM_IN[1], t) * (1 - sm(T_ZOOM_OUT[0], T_ZOOM_OUT[1], t));
  function amps(t) {
    let a = 55 + 0.6 * Math.sin(t * 7.3) + 0.4 * Math.sin(t * 13.1);
    a = lerp(a, 104, sm(T_SURGE[0], T_SURGE[1], t));
    const u = Math.min(1, Math.max(0, (t - T_TRIP) / 0.6));
    if (t > T_TRIP) a = a * (1 - u) + (u < 1 ? 0 : 0) - Math.sin(u * Math.PI) * 4 * (1 - u);
    return Math.max(0, a);
  }
  const lampState = (t) => (t < T_ALARM ? 'run' : t < T_TRIP ? (Math.floor((t - T_ALARM) * 6) % 2 ? 'off' : 'trip') : 'trip');

  // ---- balls / cage after the break ----
  const N = 8, rp = 0.66 * Rb, rb = 0.12 * Rb;
  const thetaC = Math.PI * 0.62;               // where the balls pile up (lower left)
  const delta = 2 * Math.asin(rb / rp) * 1.04;
  let slots = null;
  function ballAngles(t) {
    const cage = 0.4 * motorAngle(t) - Math.PI / 2;
    const base = S.evenAngles(cage, N);
    if (t < T_BREAK) return base;
    if (!slots) {
      const cb = S.evenAngles(0.4 * motorAngle(T_BREAK) - Math.PI / 2, N);
      const rel = cb.map((a, i) => ({ i, r: (((a - thetaC - Math.PI) % TAU) + TAU) % TAU }));   // order measured from the point opposite the pile
      rel.sort((p, q) => p.r - q.r);
      slots = []; rel.forEach((p, k) => { slots[p.i] = k; });
    }
    const u = sm(T_CLUMP[0], T_CLUMP[1], t);
    return base.map((a, i) => {
      let tg = thetaC + (slots[i] - (N - 1) / 2) * delta + 0.015 * Math.sin(t * 40 + i);
      while (tg - a > Math.PI) tg -= TAU;
      while (tg - a < -Math.PI) tg += TAU;
      return lerp(a, tg, u);
    });
  }
  const SEG = [[0.3, 1.45, -0.05, 0.03, 0.25], [1.75, 2.95, 0.04, 0.05, -0.2], [3.3, 4.55, 0.06, -0.03, 0.18], [4.9, 5.95, -0.03, -0.06, -0.3]];
  function cageSegs(t) {
    const cb = 0.4 * motorAngle(T_BREAK) - Math.PI / 2, u = sm(T_BREAK, T_BREAK + 1.4, t);
    const j = 0.012 * Math.sin(t * 55) * (1 - sm(8.6, 9.2, t));
    return SEG.map(([a0, a1, dx, dy, rot], k) => ({ a0: a0 + cb + u * 0.25 * (k % 2 ? 1 : -1), a1: a1 + cb + u * 0.25 * (k % 2 ? 1 : -1), dx: (dx * Rb * 2.2) * u + j, dy: (dy * Rb * 2.2) * u - j, rot: rot * u, dr: 0 }));
  }

  // ---- painters ----
  function lamp(c, x, y, r, state, label) {
    const col = state === 'run' ? C.green : state === 'trip' ? C.red : '#5A2A2A';
    if (state !== 'off') { const g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2.6); g.addColorStop(0, col + 'AA'); g.addColorStop(1, col + '00'); c.fillStyle = g; S.circ(c, x, y, r * 2.6); c.fill(); }
    S.circ(c, x, y, r); c.fillStyle = col; c.fill(); c.lineWidth = r * 0.15; c.strokeStyle = '#E8EEF6'; c.stroke();
    if (label) { c.fillStyle = '#E8EEF6'; c.font = `bold ${r * 1.15}px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(label, x + r * 1.6, y); }
  }
  function sparks(c, t, ang) {
    if (t < 6.15 || t > 9.0) return;
    for (let k = 0; k < 60; k++) {
      const birth = 6.15 + k * 0.045, age = (t - birth) / 0.35;
      if (age < 0 || age > 1) continue;
      const a = ang + (hash(k) - 0.5) * 1.6, d = rp + (hash(k + 9) - 0.3) * 0.15 * Rb;
      const px = B.x + d * Math.cos(a), py = B.y + d * Math.sin(a);
      const da = a + (hash(k + 3) - 0.5) * 2.2, len = (0.08 + 0.3 * age) * Rb;
      c.strokeStyle = `rgba(255,${180 + Math.round(60 * hash(k + 5))},90,${(1 - age).toFixed(3)})`; c.lineWidth = 0.012 * Rb;
      c.beginPath(); c.moveTo(px + Math.cos(da) * len * 0.6, py + Math.sin(da) * len * 0.6); c.lineTo(px + Math.cos(da) * len, py + Math.sin(da) * len); c.stroke();
    }
  }
  function caption(c, t, a, b, text) {
    const al = sm(a, a + 0.3, t) * (1 - sm(b - 0.3, b, t));
    if (al <= 0) return;
    c.save(); c.globalAlpha = al;
    c.font = 'bold 40px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif';
    const w = c.measureText(text).width + 64;
    c.fillStyle = 'rgba(11,26,48,0.82)'; c.beginPath(); c.roundRect(72, SH - 150, w, 78, 14); c.fill();
    c.fillStyle = C.orange; c.fillRect(72, SH - 150, 8, 78);
    c.fillStyle = '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, 104, SH - 111);
    c.restore();
  }

  window.frame = function (c, t, logo) {
    const z = zoom(t);
    const scale = PPI * Math.exp(Math.log(3.15) * z);
    const cx = lerp(SW / PPI / 2, B.x, z), cy = lerp(SH / PPI / 2, B.y, z);
    const shake = 0.012 * (sm(T_BREAK, T_BREAK + 0.15, t) - sm(8.6, 9.3, t));
    const sx = shake * (Math.sin(t * 83) + 0.5 * Math.sin(t * 131)), sy = shake * (Math.cos(t * 97) + 0.5 * Math.sin(t * 151));
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = C.navy; c.fillRect(0, 0, SW, SH);
    // logo (screen space, wide shot only), same place as on slide 1
    if (logo && z < 1) { c.globalAlpha = 1 - z; c.drawImage(logo, 0.7 * PPI, 0.55 * PPI, 3.0 * PPI, 3.0 * PPI * 104 / 614); c.globalAlpha = 1; }
    // world
    c.setTransform(scale, 0, 0, scale, SW / 2 - cx * scale, SH / 2 - cy * scale);
    c.translate(sx, sy);
    const m = motorAngle(t);
    S.driveBase(c, D, ox, oy);
    S.pulley(c, ox + D.F.x, oy + D.F.y, D.r2, m * D.r1 / D.r2 - Math.PI / 2, 'spokes');
    S.pulley(c, ox + D.M.x, oy + D.M.y, D.r1, m - Math.PI / 2, 'holes');
    // bearing
    const angs = ballAngles(t);
    S.ballSet(c, B.x, B.y, Rb, angs, t < T_BREAK ? 'intact' : cageSegs(t), true);
    S.innerRing(c, B.x, B.y, Rb, m - Math.PI / 2);
    sparks(c, t, thetaC);
    if (t >= T_BREAK && t < T_BREAK + 0.5) {       // crack flash
      const u = (t - T_BREAK) / 0.5, a = 0.4 * motorAngle(T_BREAK) - Math.PI / 2 + 1.6;
      const fx = B.x + rp * Math.cos(a), fy = B.y + rp * Math.sin(a), g = c.createRadialGradient(fx, fy, 0, fx, fy, 0.35 * Rb);
      g.addColorStop(0, `rgba(255,255,255,${1 - u})`); g.addColorStop(0.4, `rgba(232,119,46,${0.8 * (1 - u)})`); g.addColorStop(1, 'rgba(232,119,46,0)');
      c.fillStyle = g; S.circ(c, fx, fy, 0.35 * Rb); c.fill();
    }
    // in-scene ammeter + lamp
    S.dial(c, ox + D.A.x, oy + D.A.y, D.rA, 'amp');
    S.needle(c, ox + D.A.x, oy + D.A.y, D.rA, S.needleDeg(amps(t)));
    lamp(c, ox + D.L.x, oy + D.L.y, D.rL, lampState(t), null);
    // vignette outside the magnifier while zoomed
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (z > 0) {
      const mx = SW / 2 + (B.x - cx + sx) * scale, my = SH / 2 + (B.y - cy + sy) * scale, mr = D.rMag * scale;
      c.fillStyle = `rgba(11,26,48,${0.78 * z})`; c.beginPath(); c.rect(0, 0, SW, SH); c.moveTo(mx + mr, my); c.arc(mx, my, mr, 0, TAU, true); c.fill('evenodd');
      // HUD: ammeter + lamp, screen space
      c.globalAlpha = z;
      S.dial(c, SW - 190, 200, 130, 'amp'); S.needle(c, SW - 190, 200, 130, S.needleDeg(amps(t)));
      c.fillStyle = '#E8EEF6'; c.font = 'bold 30px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif'; c.textAlign = 'center'; c.fillText('电机电流', SW - 190, 370);
      lamp(c, SW - 300, 460, 22, lampState(t), t < T_ALARM ? '运行' : '过电流动作');
      c.globalAlpha = 1;
    }
    // dim + stop indication at the end
    if (t > T_ZOOM_OUT[1]) { /* hold */ }
    caption(c, t, 0.4, 2.9, '正常运行　2950 r/min　电流约 55 A');
    caption(c, t, 3.4, 5.9, '推近：负荷侧轴承（示意）');
    caption(c, t, 6.0, 8.5, '保持架断裂 → 滚珠扎堆 → 转子卡死');
    caption(c, t, 8.6, 10.6, '电流冲高 → 综保过电流保护动作 → 跳闸');
    caption(c, t, 11.0, 13.6, '电机停转，负压风机停运 → 生产波动');
    c.fillStyle = 'rgba(143,179,224,0.75)'; c.font = '26px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillText('示意动画 · 非实拍', SW - 48, SH - 40);
  };
  window.DURATION = 14.0;
})();
