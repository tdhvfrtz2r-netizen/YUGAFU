// Shared canvas drawing for (a) transparent PNG parts that spin natively in PowerPoint/WPS and
// (b) every frame of the opening video. All geometry is in INCHES; callers ctx.scale(ppi) first.
// Loaded in the browser (render pages) and required from Node (build.js reads DRIVE / dial helpers).
(function (root) {
  const COL = {
    navy: '#0E2240', ink: '#0B1A30', blue: '#1D5FAE', orange: '#E8772E', red: '#D64541', green: '#2E9E6B',
    grey: '#5B6B7C', light: '#F2F5F9', sky: '#8FB3E0', white: '#FFFFFF', text: '#1C2733',
  };
  const TAU = Math.PI * 2;

  // Belt-drive composition (end view along the shafts), local box 5.6 x 5.6 in.
  // On slide 1 / the video's wide shot the box sits at (slideX, slideY) on a 13.333 x 7.5 in slide.
  const DRIVE = {
    W: 5.6, H: 5.6, slideX: 7.3, slideY: 1.0,
    M: { x: 1.75, y: 3.55 }, Rm: 1.3, r1: 0.55,        // motor end view + motor pulley
    F: { x: 4.2, y: 1.35 }, r2: 0.95, Hh: 1.2,         // fan pulley + fan housing
    B: { x: 4.35, y: 4.45 }, rMag: 1.05, Rb: 0.86,     // magnifier window with the load-side bearing
    A: { x: 0.8, y: 0.85 }, rA: 0.62,                  // ammeter
    L: { x: 1.95, y: 0.6 }, rL: 0.14,                  // protection relay lamp
    spin: { motor: 1200, fan: Math.round(1200 * 0.95 / 0.55), inner: 1200, cage: 3000 }, // ms per revolution
  };
  // Ammeter 0..100 A over a 240 deg arc. Needle rotation measured clockwise from 12 o'clock.
  const AMP_MAX = 100;
  const needleDeg = (amps) => 240 * Math.min(amps, AMP_MAX * 1.03) / AMP_MAX - 120;

  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  const ann = (c, x, y, r1, r0) => { c.beginPath(); c.arc(x, y, r1, 0, TAU, false); c.moveTo(x + r0, y); c.arc(x, y, r0, 0, TAU, true); };
  const rgrad = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, k]) => g.addColorStop(o, k)); return g; };

  // ---------------- bearing ----------------
  const bp = (R) => ({ rp: 0.66 * R, rb: 0.12 * R });
  function outerRing(c, x, y, R) {
    ann(c, x, y, R, 0.8 * R);
    c.fillStyle = rgrad(c, x, y, 0.8 * R, R, [[0, '#D6E4F6'], [0.45, '#A9C4E8'], [1, '#6A91C6']]); c.fill();
    c.lineWidth = 0.022 * R; c.strokeStyle = COL.blue;
    circ(c, x, y, R); c.stroke(); circ(c, x, y, 0.8 * R); c.stroke();
  }
  function innerRing(c, x, y, R, ang) {
    ann(c, x, y, 0.52 * R, 0.36 * R);
    c.fillStyle = rgrad(c, x, y, 0.36 * R, 0.52 * R, [[0, '#6A91C6'], [0.55, '#A9C4E8'], [1, '#D6E4F6']]); c.fill();
    c.lineWidth = 0.022 * R; c.strokeStyle = COL.blue;
    circ(c, x, y, 0.52 * R); c.stroke();
    circ(c, x, y, 0.35 * R); c.fillStyle = rgrad(c, x, y, 0, 0.36 * R, [[0, '#5A6B82'], [1, '#2C394B']]); c.fill(); c.stroke();
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = '#16202D'; c.fillRect(0.25 * R, -0.05 * R, 0.11 * R, 0.1 * R);          // keyway
    circ(c, 0, 0, 0.06 * R); c.fill();                                                    // centre hole
    circ(c, 0.44 * R, 0, 0.035 * R); c.fillStyle = COL.white; c.fill();                    // marker dot on inner ring
    c.restore();
  }
  function ballAt(c, x, y, rb, lit) {
    circ(c, x, y, rb);
    c.fillStyle = lit
      ? (() => { const g = c.createRadialGradient(x - 0.35 * rb, y - 0.4 * rb, 0.05 * rb, x, y, rb); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#C3CCD7'); g.addColorStop(1, '#55626F'); return g; })()
      : rgrad(c, x, y, 0, rb, [[0, '#F4F7FA'], [0.55, '#B9C3CF'], [1, '#5E6B7A']]);
    c.fill();
    c.lineWidth = 0.08 * rb; c.strokeStyle = '#3E4A58'; c.stroke();
  }
  // angles: absolute ball angles (rad). cage: 'intact' | 'none' | array of segments {a0,a1,dx,dy,rot}
  function ballSet(c, x, y, R, angles, cage, lit) {
    const { rp, rb } = bp(R);
    c.strokeStyle = COL.orange; c.lineCap = 'butt';
    if (cage === 'intact') { c.lineWidth = 0.05 * R; circ(c, x, y, rp); c.stroke(); }
    angles.forEach((a) => ballAt(c, x + rp * Math.cos(a), y + rp * Math.sin(a), rb, lit));
    if (cage === 'intact') {
      c.lineWidth = 0.032 * R; c.strokeStyle = COL.orange;
      angles.forEach((a) => { circ(c, x + rp * Math.cos(a), y + rp * Math.sin(a), rb * 1.16); c.stroke(); });
    } else if (Array.isArray(cage)) {
      c.lineWidth = 0.05 * R; c.strokeStyle = COL.orange; c.lineCap = 'round';
      cage.forEach((sg) => {
        const am = (sg.a0 + sg.a1) / 2, mx = x + rp * Math.cos(am), my = y + rp * Math.sin(am);
        c.save(); c.translate(mx + sg.dx, my + sg.dy); c.rotate(sg.rot); c.translate(-mx, -my);
        c.beginPath(); c.arc(x, y, rp + (sg.dr || 0), sg.a0, sg.a1); c.stroke();
        // torn pocket stubs at both ends
        [sg.a0, sg.a1].forEach((ae, k) => {
          const ex = x + rp * Math.cos(ae), ey = y + rp * Math.sin(ae), nx = Math.cos(ae), ny = Math.sin(ae);
          c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + nx * 0.07 * R * (k ? 1 : -1), ey + ny * 0.07 * R * (k ? 1 : -1)); c.stroke();
        });
        c.restore();
      });
      c.lineCap = 'butt';
    }
  }
  const evenAngles = (ang, n = 8) => [...Array(n).keys()].map((k) => ang + k * TAU / n);

  // ---------------- belt drive parts ----------------
  function pulley(c, x, y, r, ang, kind) {
    c.save(); c.translate(x, y); c.rotate(ang);
    ann(c, 0, 0, r, 0.74 * r);
    c.fillStyle = rgrad(c, 0, 0, 0.74 * r, r, [[0, '#5C6D82'], [0.5, '#9AA9BC'], [1, '#5C6D82']]); c.fill();
    c.strokeStyle = '#26323F'; c.lineWidth = 0.022 * r;
    [0.97, 0.88, 0.8].forEach((k) => { circ(c, 0, 0, k * r); c.stroke(); });
    if (kind === 'holes') {
      ann(c, 0, 0, 0.74 * r, 0.26 * r); c.fillStyle = '#8796AA'; c.fill();
      for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + TAU / 8; circ(c, 0.5 * r * Math.cos(a), 0.5 * r * Math.sin(a), 0.14 * r); c.fillStyle = '#16202D'; c.fill(); }
    } else {
      c.strokeStyle = '#8796AA'; c.lineWidth = 0.12 * r; c.lineCap = 'round';
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + TAU / 10; c.beginPath(); c.moveTo(0.22 * r * Math.cos(a), 0.22 * r * Math.sin(a)); c.lineTo(0.76 * r * Math.cos(a), 0.76 * r * Math.sin(a)); c.stroke(); }
      c.lineCap = 'butt';
    }
    circ(c, 0, 0, 0.26 * r); c.fillStyle = '#6E7D91'; c.fill(); c.strokeStyle = '#26323F'; c.lineWidth = 0.02 * r; c.stroke();
    circ(c, 0, 0, 0.1 * r); c.fillStyle = '#16202D'; c.fill();
    c.fillRect(0.08 * r, -0.035 * r, 0.06 * r, 0.07 * r);
    c.fillStyle = COL.orange; c.fillRect(0.75 * r, -0.045 * r, 0.24 * r, 0.09 * r);          // paint mark on rim
    c.restore();
  }
  function motorFrame(c, x, y, R) {
    c.fillStyle = '#2C3E57'; c.fillRect(x - 1.35 * R, y + 1.12 * R, 2.7 * R, 0.09 * R);          // base plate
    c.beginPath(); c.moveTo(x - 0.9 * R, y + 0.5 * R); c.lineTo(x + 0.9 * R, y + 0.5 * R);
    c.lineTo(x + 1.15 * R, y + 1.12 * R); c.lineTo(x - 1.15 * R, y + 1.12 * R); c.closePath(); c.fillStyle = '#163C6A'; c.fill();
    c.fillStyle = '#244E84'; c.fillRect(x + 0.15 * R, y - 1.3 * R, 0.62 * R, 0.45 * R);          // terminal box
    c.strokeStyle = '#163C6A'; c.lineWidth = 0.025 * R; c.strokeRect(x + 0.15 * R, y - 1.3 * R, 0.62 * R, 0.45 * R);
    c.fillStyle = '#24497A';
    for (let k = 0; k < 40; k++) {
      const a = k * TAU / 40; c.save(); c.translate(x, y); c.rotate(a); c.fillRect(0.95 * R, -0.03 * R, 0.16 * R, 0.06 * R); c.restore();
    }
    circ(c, x, y, R); c.fillStyle = rgrad(c, x - 0.3 * R, y - 0.3 * R, 0.1 * R, 1.3 * R, [[0, '#4A83C2'], [1, '#1E4A80']]); c.fill();
    circ(c, x, y, 0.72 * R); c.fillStyle = '#4C7DB6'; c.fill(); c.strokeStyle = '#2A5A92'; c.lineWidth = 0.03 * R; c.stroke();
    circ(c, x, y, 0.5 * R); c.fillStyle = '#5B8AC0'; c.fill(); c.stroke();
    for (let k = 0; k < 4; k++) { const a = TAU / 8 + k * TAU / 4; circ(c, x + 0.61 * R * Math.cos(a), y + 0.61 * R * Math.sin(a), 0.035 * R); c.fillStyle = '#1E4A80'; c.fill(); }
  }
  function fanHousing(c, x, y, H) {
    const a1 = Math.atan2(-0.989, 0.15) + TAU;
    c.beginPath(); c.moveTo(x + 0.15 * H, y - 0.989 * H); c.lineTo(x + 0.15 * H, y - 1.15 * H); c.lineTo(x + H, y - 1.15 * H); c.lineTo(x + H, y);
    c.arc(x, y, H, 0, a1, false); c.closePath();
    c.fillStyle = '#22344D'; c.fill(); c.strokeStyle = '#3E5778'; c.lineWidth = 0.025; c.stroke();
    circ(c, x, y, 0.86 * H); c.fillStyle = '#16263B'; c.fill();
  }
  function arcVia(c, x, y, r, a0, a1, via) {
    // draw arc from a0 to a1 choosing the direction that passes through `via`
    const n = (a) => ((a % TAU) + TAU) % TAU;
    const cwSpan = n(a1 - a0), viaSpan = n(via - a0);
    c.arc(x, y, r, a0, a1, !(viaSpan <= cwSpan));
  }
  function belt(c, P1, r1, P2, r2, w) {
    const dx = P2.x - P1.x, dy = P2.y - P1.y, d = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
    const R1 = r1 + w / 2, R2 = r2 + w / 2, al = Math.acos((R2 - R1) / d);
    const ap = phi + al + Math.PI, am = phi - al + Math.PI;
    c.beginPath();
    c.moveTo(P1.x + R1 * Math.cos(ap), P1.y + R1 * Math.sin(ap));
    c.lineTo(P2.x + R2 * Math.cos(ap), P2.y + R2 * Math.sin(ap));
    arcVia(c, P2.x, P2.y, R2, ap, am, phi);
    c.lineTo(P1.x + R1 * Math.cos(am), P1.y + R1 * Math.sin(am));
    arcVia(c, P1.x, P1.y, R1, am, ap, phi + Math.PI);
    c.closePath();
    c.lineJoin = 'round';
    c.strokeStyle = '#121A24'; c.lineWidth = w; c.stroke();
    c.strokeStyle = '#3A4859'; c.lineWidth = w * 0.3; c.stroke();
  }
  function magnifier(c, D, ox, oy) {
    const M = { x: ox + D.M.x, y: oy + D.M.y }, B = { x: ox + D.B.x, y: oy + D.B.y };
    const ux = (B.x - M.x), uy = (B.y - M.y), L = Math.hypot(ux, uy);
    c.setLineDash([0.07, 0.06]); c.strokeStyle = COL.sky; c.lineWidth = 0.025;
    c.beginPath(); c.moveTo(M.x + ux / L * (D.r1 + 0.12), M.y + uy / L * (D.r1 + 0.12)); c.lineTo(B.x - ux / L * D.rMag, B.y - uy / L * D.rMag); c.stroke();
    c.setLineDash([]);
    circ(c, B.x, B.y, D.rMag); c.fillStyle = COL.ink; c.fill(); c.lineWidth = 0.04; c.stroke();
  }
  // static base of the drive: housing, belt, motor frame, magnifier, bearing outer ring
  function driveBase(c, D, ox = 0, oy = 0) {
    fanHousing(c, ox + D.F.x, oy + D.F.y, D.Hh);
    motorFrame(c, ox + D.M.x, oy + D.M.y, D.Rm);
    belt(c, { x: ox + D.M.x, y: oy + D.M.y }, D.r1, { x: ox + D.F.x, y: oy + D.F.y }, D.r2, 0.1);
    magnifier(c, D, ox, oy);
    outerRing(c, ox + D.B.x, oy + D.B.y, D.Rb);
  }

  // ---------------- gauges ----------------
  function dial(c, x, y, r, kind) {
    circ(c, x, y, r); c.fillStyle = '#1C2733'; c.fill();
    circ(c, x, y, 0.93 * r); c.fillStyle = '#F4F7FB'; c.fill();
    const th = (v) => (-210 + 240 * v) * Math.PI / 180;           // canvas angle (y down) for scale fraction v
    c.lineCap = 'butt';
    if (kind === 'amp') { c.strokeStyle = COL.red; c.lineWidth = 0.1 * r; c.beginPath(); c.arc(x, y, 0.74 * r, th(0.6), th(1)); c.stroke(); }
    else { c.strokeStyle = COL.green; c.lineWidth = 0.1 * r; c.beginPath(); c.arc(x, y, 0.74 * r, th(0.7), th(1)); c.stroke();
      c.strokeStyle = COL.red; c.beginPath(); c.arc(x, y, 0.74 * r, th(0), th(0.12)); c.stroke(); }
    c.strokeStyle = '#1C2733';
    for (let k = 0; k <= 20; k++) {
      const v = k / 20, a = th(v), major = k % 2 === 0, l = major ? 0.16 * r : 0.09 * r;
      c.lineWidth = major ? 0.028 * r : 0.016 * r;
      c.beginPath(); c.moveTo(x + 0.84 * r * Math.cos(a), y + 0.84 * r * Math.sin(a)); c.lineTo(x + (0.84 * r - l) * Math.cos(a), y + (0.84 * r - l) * Math.sin(a)); c.stroke();
    }
    c.fillStyle = '#1C2733'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `bold ${0.15 * r}px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif`;
    const labels = kind === 'amp' ? [[0, '0'], [0.2, '20'], [0.4, '40'], [0.6, '60'], [0.8, '80'], [1, '100']]
      : [[0, '0'], [0.3, '1'], [0.55, '10'], [0.8, '100'], [1, '∞']];
    labels.forEach(([v, t]) => { const a = th(v); c.fillText(t, x + 0.52 * r * Math.cos(a), y + 0.52 * r * Math.sin(a)); });
    c.font = `bold ${0.2 * r}px "Microsoft YaHei","WenQuanYi Zen Hei",sans-serif`;
    c.fillText(kind === 'amp' ? 'A' : 'MΩ', x, y + 0.5 * r);
    if (kind === 'amp') {   // rated-current mark (54.8 A)
      const a = th(54.8 / AMP_MAX); c.fillStyle = COL.orange; c.beginPath();
      c.moveTo(x + 0.86 * r * Math.cos(a), y + 0.86 * r * Math.sin(a));
      c.lineTo(x + 0.93 * r * Math.cos(a + 0.06), y + 0.93 * r * Math.sin(a + 0.06));
      c.lineTo(x + 0.93 * r * Math.cos(a - 0.06), y + 0.93 * r * Math.sin(a - 0.06)); c.closePath(); c.fill();
    }
  }
  // needle drawn pointing to 12 o'clock, rotated `deg` clockwise
  function needle(c, x, y, r, deg) {
    c.save(); c.translate(x, y); c.rotate(deg * Math.PI / 180);
    c.beginPath(); c.moveTo(-0.035 * r, 0.16 * r); c.lineTo(0.035 * r, 0.16 * r); c.lineTo(0.008 * r, -0.8 * r); c.lineTo(-0.008 * r, -0.8 * r); c.closePath();
    c.fillStyle = COL.red; c.fill();
    circ(c, 0, 0, 0.08 * r); c.fillStyle = '#1C2733'; c.fill();
    c.restore();
  }

  const api = { COL, TAU, DRIVE, AMP_MAX, needleDeg, outerRing, innerRing, ballSet, evenAngles, bp, pulley, motorFrame, fanHousing, belt, magnifier, driveBase, dial, needle, circ };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SCENE = api;
})(typeof window !== 'undefined' ? window : globalThis);
