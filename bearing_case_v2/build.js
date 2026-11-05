// v2 deck builder (20 slides). Run:  bash make.sh   (or: node build.js build/stage1.pptx && python3 anim.py build/stage1.pptx build/anim.json out/deck.pptx)
// Shapes get objectName; animation steps are recorded in build/anim.json and injected by anim.py (pptxgenjs has no animation API).
// Target player is WPS: no Morph. All motion is in-slide (entrance / exit / spin / blink / motion path) + one embedded MP4.
const pptxgen = require('pptxgenjs');
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const fs = require('fs');
const path = require('path');
const SC = require('./render/scene.js');

const OUT = process.argv[2] || path.join(__dirname, 'build', 'stage1.pptx');
const A = (f) => path.join(__dirname, 'assets', f);
const G = (f) => path.join(__dirname, 'assets', 'gen', f);

const THEME = {
  headFontFace: 'Microsoft YaHei', bodyFontFace: 'Microsoft YaHei',
  colors: {
    dk1: '1C2733', lt1: 'FFFFFF', dk2: '0E2240', lt2: 'F2F5F9',
    accent1: '1D5FAE', accent2: 'E8772E', accent3: 'D64541', accent4: '2E9E6B',
    accent5: '5B6B7C', accent6: '8FB3E0', hlink: '1D5FAE', folHlink: '5B6B7C',
  },
};
const HX = THEME.colors;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = '双兴分公司电机轴承保持架破损停机故障案例（v2）';
pres.author = '于家福 · 本体电气班';
const C = pres.SchemeColor;
const SH = pres.shapes;
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;
const NONE = { type: 'none' };
const CLEAR = { color: 'FFFFFF', transparency: 100 };

// ---------- icons ----------
const iconCache = {};
async function icon(name, bg, fg = 'FFFFFF') {
  const key = name + bg + fg;
  if (iconCache[key]) return iconCache[key];
  const size = 256;
  let s = RDS.renderToStaticMarkup(React.createElement(fa[name], { size: 256 }));
  s = s.replace(/currentColor/g, '#' + fg)
    .replace('<svg', `<svg x="${size * 0.25}" y="${size * 0.25}"`)
    .replace(/ height="\d+"/, ` height="${size * 0.5}"`)
    .replace(/ width="\d+"/, ` width="${size * 0.5}"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    (bg ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#${bg}"/>` : '') + s + '</svg>';
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  iconCache[key] = 'image/png;base64,' + buf.toString('base64');
  return iconCache[key];
}

// ---------- animation bookkeeping ----------
const ANIM = {};
const TRANS = {};
let cur = null, slideNo = 0;
function newSlide(master, section) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  slideNo++;
  cur = { no: slideNo, steps: [], n: 0 };
  ANIM[slideNo] = cur.steps;
  return s;
}
function step(trigger) { const st = { trigger, items: [] }; cur.steps.push(st); return st; }
function nm(p) { cur.n++; return `s${cur.no}_${p}${cur.n}`; }
// a = { st, fx, d, dur, ...extra (deg, repeat, path, ease) } or an array of such
function reg(a, name) {
  if (!a) return;
  (Array.isArray(a) ? a : [a]).forEach((x) => {
    const { st, fx, d, dur, ...extra } = x;
    st.items.push({ name, fx: fx || 'fade', delay: d || 0, dur: dur || 0, ...extra });
  });
}
const cq = (t) => t.replace(/"([^"]*)"/g, '“$1”');
const cqx = (t) => (typeof t === 'string' ? cq(t) : t.map((r) => ({ ...r, text: cq(r.text) })));
function N(s, t) { s.addNotes(cq(t)); }
function T(s, text, o, a) { text = cqx(text); const name = o._name || nm('t'); const oo = { ...o }; delete oo._name; s.addText(text, { ...oo, isTextBox: true, objectName: name }); reg(a, name); return name; }
function S(s, shape, o, a) { const name = o._name || nm('s'); const oo = { ...o }; delete oo._name; s.addShape(shape, { ...oo, objectName: name }); reg(a, name); return name; }
const ALT = {
  'install.jpg': '现场安装照片：皮带传动，电机装在封闭机箱内', 'nameplate.jpg': '电机铭牌 ABB M2QA200L2A，上方散热筋积灰结块',
  'shaft.jpg': '负荷侧轴端，轴承处油脂发黑', 'housing.jpg': '端盖轴承室内部，滚珠挤在一侧', 'housing_sq.jpg': '轴承室内部缩略图：滚珠挤在一侧',
  'cage1.jpg': '断裂变形的保持架', 'cage2.jpg': '保持架残片',
  'drive_base.png': '示意图：电机端视、皮带、风机皮带轮与放大的负荷侧轴承', 'pulley_motor.png': '示意图：电机皮带轮', 'pulley_fan.png': '示意图：风机皮带轮',
  'ballset.png': '示意图：滚珠与保持架', 'inner_ring.png': '示意图：轴承内圈与轴', 'outer_ring.png': '示意图：轴承外圈',
  'dial_amp.png': '示意图：电流表表盘', 'dial_megger.png': '示意图：兆欧表表盘', 'needle.png': '示意图：表针',
};
function I(s, o, a) {
  const name = o._name || nm('i'); const oo = { ...o }; delete oo._name;
  if (!oo.altText) oo.altText = oo.path ? (ALT[path.basename(oo.path)] || '') : '图标';
  s.addImage({ ...oo, objectName: name }); reg(a, name); return name;
}
const shadow = () => ({ type: 'outer', color: HX.dk2, opacity: 0.12, blur: 10, offset: 2, angle: 90 });
const isCJK = (ch) => /[　-鿿＀-￯‘-”]/.test(ch);
function textW(text, pt) { let w = 0; for (const ch of text) w += isCJK(ch) ? pt / 72 : 0.56 * pt / 72; return w; }

function tagPill(s, text) {
  T(s, text, { x: M, y: 0.36, w: textW(text, 11) + 0.36, h: 0.32, fontSize: 11, bold: true, color: C.accent1,
    fill: { color: C.accent1, transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.16, align: 'center', valign: 'middle', margin: 0 });
}
function title(s, text) { s.addText(cq(text), { placeholder: 'title' }); }
// evidence-level badge: fact / inf(推断) / asm(假设) / tbd(待双兴提供)
const BADGE = { fact: ['【事实】', HX.accent4], inf: ['【推断】', HX.accent1], asm: ['【假设】', HX.accent2], tbd: ['【待双兴提供】', HX.accent5] };
function badge(s, kind, x, y, a, size = 10.5) {
  const [t, col] = BADGE[kind];
  const w = textW(t, size) + 0.12;
  T(s, t, { x, y, w, h: size / 72 + 0.12, fontSize: size, bold: true, color: col, fill: { color: col, transparency: 88 },
    shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.06, align: 'center', valign: 'middle', margin: 0 }, a);
  return w;
}
function numDot(s, n, x, y, d, col, a, fs = 12) {
  T(s, String(n), { x, y, w: d, h: d, fontSize: fs, bold: true, color: C.background1, fill: { color: col }, shape: SH.OVAL, align: 'center', valign: 'middle', margin: 0, fontFace: 'Arial' }, a);
}

// ---------- belt-drive composition (PNG parts from render/render_assets.js) ----------
const D = SC.DRIVE;
function drive(s, ox, oy, k, st, opts = {}) {
  const at = (p, r) => ({ x: ox + (p.x - r) * k, y: oy + (p.y - r) * k, w: 2 * r * k, h: 2 * r * k });
  const spinA = (ms, d = 0) => ({ st, fx: 'spin', d, dur: ms, deg: 360, repeat: 'indefinite' });
  I(s, { path: G('drive_base.png'), x: ox, y: oy, w: D.W * k, h: D.H * k }, opts.baseA);
  I(s, { path: G('pulley_fan.png'), ...at(D.F, D.r2) }, spinA(D.spin.fan));
  I(s, { path: G('pulley_motor.png'), ...at(D.M, D.r1) }, spinA(D.spin.motor));
  I(s, { path: G('ballset.png'), ...at(D.B, D.Rb) }, spinA(D.spin.cage));
  I(s, { path: G('inner_ring.png'), ...at(D.B, D.Rb) }, spinA(D.spin.inner));
  I(s, { path: G('dial_amp.png'), ...at(D.A, D.rA) });
  I(s, { path: G('needle.png'), ...at(D.A, D.rA), rotate: SC.needleDeg(55) }, { st, fx: 'wobble', d: 0, dur: 450, deg: 2, repeat: 'indefinite' });
  const L = { x: ox + D.L.x * k, y: oy + D.L.y * k, r: D.rL * k };
  S(s, SH.OVAL, { x: L.x - 2.2 * L.r, y: L.y - 2.2 * L.r, w: 4.4 * L.r, h: 4.4 * L.r, fill: { color: C.accent4, transparency: 75 }, line: NONE });
  S(s, SH.OVAL, { x: L.x - L.r, y: L.y - L.r, w: 2 * L.r, h: 2 * L.r, fill: { color: C.accent4 }, line: { color: 'E8EEF6', width: 1.5 } });
  if (opts.noLabels) return;
  const lab = (t, x, y, w, al = 'center') => T(s, t, { x, y, w, h: 0.3, fontSize: 11, color: C.accent6, align: al, margin: 0, valign: 'middle' }, opts.labelA);
  lab(opts.lampText || '运行', L.x + 2.4 * L.r, L.y - 0.15, 1.3, 'left');
  lab('电流表（约 55 A）', ox + (D.A.x - 0.9) * k, oy + (D.A.y + D.rA) * k + 0.04, 1.8 * k);
  lab('风机皮带轮', ox + (D.F.x + 0.1) * k, oy + (D.F.y + D.Hh) * k + 0.05, 1.5 * k, 'left');
  lab('电机（端视）+ 皮带轮', ox + (D.M.x - 1.2) * k, oy + (D.M.y + D.Rm * 1.24) * k, 2.4 * k);
  lab('负荷侧轴承（放大示意）', ox + (D.B.x - 1.25) * k, oy + (D.B.y + D.rMag) * k + 0.04, 2.5 * k);
}

// ---------- layouts ----------
const FOOT = '双兴分公司电机轴承保持架破损停机故障案例 · 班组学习分享';
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: HX.lt1 },
  objects: [
    { image: { x: W - M - 2.6, y: 0.33, w: 2.6, h: 2.6 * 104 / 614, path: A('logo_color.png'), altText: '北方华锦 logo' } },
    { text: { text: FOOT, options: { x: M, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0, valign: 'middle' } } },
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.78, w: 10.5, h: 0.78, fontSize: 28, bold: true,
      color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HX.accent5, align: 'right', margin: 0 },
});
pres.defineSlideMaster({
  title: 'DARK', background: { color: HX.dk2 },
  objects: [{ image: { x: 0.7, y: 0.55, w: 3.0, h: 3.0 * 104 / 614, path: A('logo_white.png'), altText: '北方华锦 logo' } }],
});
pres.defineSlideMaster({ title: 'VIDEO', background: { color: HX.dk2 }, objects: [] });

(async () => {
  const I_ = {
    cogA: await icon('FaCog', HX.accent2), compA: await icon('FaCompressArrowsAlt', HX.accent2),
    boltR: await icon('FaBolt', HX.accent3), shieldR: await icon('FaShieldAlt', HX.accent3), indR: await icon('FaIndustry', HX.accent3),
    searchB: await icon('FaSearch', HX.accent1), questA: await icon('FaQuestion', HX.accent2), bulbG: await icon('FaLightbulb', HX.accent4),
    warnA: await icon('FaExclamationTriangle', HX.accent2), fileA: await icon('FaFileAlt', HX.accent2),
    checkG: await icon('FaCheck', HX.accent4), plusA: await icon('FaPlus', HX.accent2),
    eyeG: await icon('FaEye', HX.accent5), handG: await icon('FaHandPaper', HX.accent5), earG: await icon('FaAssistiveListeningSystems', HX.accent5), boltG: await icon('FaBolt', HX.accent5),
    commA: await icon('FaComments', HX.accent2), calcB: await icon('FaCalculator', HX.accent1), cameraB: await icon('FaCamera', HX.accent1), walkB: await icon('FaWalking', null, HX.accent1),
    cogsB: await icon('FaCogs', HX.accent1), clipA: await icon('FaClipboardList', HX.accent2), penG: await icon('FaPenNib', HX.accent4),
  };

  // =====================================================================
  // 1 OPENING: the motor is running (dark)
  pres.addSection({ title: '开场' });
  let s = newSlide('DARK', '开场');
  TRANS[1] = 'black';
  let st = step('auto');
  drive(s, D.slideX, D.slideY, 1, st, { labelA: { st, fx: 'fade', d: 1600 } });
  T(s, '设备故障案例 · 班组学习分享', { x: 0.7, y: 2.0, w: 6.4, h: 0.4, fontSize: 16, bold: true, color: C.accent2, margin: 0 }, { st, fx: 'float', d: 300 });
  T(s, '双兴分公司电机轴承保持架\n破损停机故障案例', { x: 0.7, y: 2.5, w: 6.5, h: 1.6, fontSize: 34, bold: true, color: C.background1, margin: 0, lineSpacingMultiple: 1.1, valign: 'top' }, { st, fx: 'float', d: 500 });
  T(s, '从一次过流跳闸，看懂轴承故障的排查、根因与预防', { x: 0.7, y: 4.3, w: 6.5, h: 0.75, fontSize: 17, color: C.accent6, margin: 0, valign: 'top' }, { st, fx: 'float', d: 800 });
  T(s, [
    { text: '案例时间　', options: { color: C.accent6 } }, { text: '2023年1月3日 · 双兴分公司', options: { color: C.background1, breakLine: true } },
    { text: '分 享 人　', options: { color: C.accent6 } }, { text: '于家福 · 炼化电气部 本体电气班', options: { color: C.background1 } },
  ], { x: 0.7, y: 5.55, w: 6.5, h: 0.8, fontSize: 13, margin: 0, lineSpacingMultiple: 1.3, valign: 'top' }, { st, fx: 'fade', d: 1100 });
  N(s, `【开场 · 约1分钟 · 本页不用点击】
· 右边是这台电机的示意：电机皮带轮带着风机转，下面放大的是负荷侧轴承——内圈跟轴转，滚珠和保持架慢一点公转；左上电流表约55A，绿灯运行。
· 今天讲双兴分公司2023年1月3日的一起故障：负压风机电机轴承保持架破损，过流跳闸停机。
· 原报告只写到"坏了什么、怎么修"，今天想多挖三层：怎么查、为什么坏、怎么防。
· 先看它是怎么"停下来"的——翻下一页。
（动画随换页自动播放：皮带轮、轴承一直转，表针轻微摆动）`);

  // =====================================================================
  // 2 THE MOMENT: embedded clip (no logo master; video covers the slide)
  s = newSlide('VIDEO', '开场');
  TRANS[2] = 'fast';
  const poster = 'data:image/png;base64,' + fs.readFileSync(G('opening_poster.png')).toString('base64');
  s.addMedia({ type: 'video', path: G('opening.mp4'), x: 0, y: 0, w: W, h: H, cover: poster, objectName: 's2_video' });
  st = step('auto');
  st.items.push({ name: 's2_video', fx: 'play', delay: 0, dur: 14000 });
  st = step('click');
  let a2 = { st, fx: 'float', d: 0 };
  S(s, SH.ROUNDED_RECTANGLE, { x: 0.6, y: 1.25, w: 6.3, h: 3.75, fill: { color: '0B1A30', transparency: 8 }, line: { color: C.accent3, width: 1.5 }, rectRadius: 0.12 }, a2);
  T(s, '2023年1月3日　14:05', { x: 0.95, y: 1.5, w: 5.6, h: 0.45, fontSize: 20, bold: true, color: C.accent2, margin: 0, fontFace: 'Microsoft YaHei' }, a2);
  T(s, 'BL-1655C 负压风机电机\n过电流跳闸', { x: 0.95, y: 2.05, w: 5.7, h: 1.3, fontSize: 30, bold: true, color: C.background1, margin: 0, lineSpacingMultiple: 1.05, valign: 'top' }, a2);
  T(s, '综保显示过电流保护动作 → 电机停机 → 生产波动', { x: 0.95, y: 3.5, w: 5.7, h: 0.4, fontSize: 15, color: C.accent6, margin: 0 }, a2);
  T(s, '原报告：负荷侧轴承"支持架"（规范名称：保持架）破损', { x: 0.95, y: 4.05, w: 5.7, h: 0.6, fontSize: 13, color: 'C9D6E8', margin: 0, valign: 'top' }, a2);
  N(s, `【故障瞬间 · 约1分钟】
· 视频随换页自动播放，约14秒，无声音。如果没有自动播放，单击一下视频画面。
· 边看边说：正常运行2950转、约55A → 镜头推近负荷侧轴承 → 保持架断裂、滚珠挤成一堆、转子卡死 → 电流冲高 → 综保过流动作，跳闸。
· 强调：这是示意动画，不是现场录像；真实过程中轴承往往已经"病"了很久。
[点击] 出现事件卡：14:05，BL-1655C，过流跳闸，生产波动。
· 过渡：这就是原报告记录的全部经过。下面先用一页把故障链理清。`);

  // =====================================================================
  // 3 OVERVIEW
  pres.addSection({ title: '01 案例回顾' });
  s = newSlide('CONTENT', '01 案例回顾');
  tagPill(s, '导读');
  title(s, '一页看懂：一份浅报告，今天挖深三层');
  st = step('auto');
  const chain = [
    ['保持架破损', '负荷侧轴承', I_.cogA], ['滚珠扎堆卡死', '电机转不动', I_.compA], ['电流急剧上升', '接近堵转', I_.boltR],
    ['综保过流跳闸', '保护正确动作', I_.shieldR], ['生产波动', '负压风机停运', I_.indR],
  ];
  const nw = (CW - 4 * 0.45) / 5;
  chain.forEach((c, i) => {
    const x = M + i * (nw + 0.45), y = 1.9, d = 150 + i * 280, a = { st, fx: 'float', d };
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: nw, h: 1.5, fill: { color: C.background2 }, line: NONE, rectRadius: 0.12 }, a);
    I(s, { data: c[2], x: x + nw / 2 - 0.27, y: y + 0.17, w: 0.54, h: 0.54 }, a);
    T(s, c[0], { x: x + 0.1, y: y + 0.78, w: nw - 0.2, h: 0.36, fontSize: 15, bold: true, color: C.text2, align: 'center', margin: 0 }, a);
    T(s, c[1], { x: x + 0.1, y: y + 1.12, w: nw - 0.2, h: 0.28, fontSize: 12, color: C.accent5, align: 'center', margin: 0 }, a);
    if (i < 4) S(s, SH.CHEVRON, { x: x + nw + 0.13, y: y + 0.6, w: 0.2, h: 0.3, fill: { color: i < 1 ? C.accent2 : C.accent3 }, line: NONE }, { st, fx: 'fade', d: d + 200 });
  });
  st = step('click');
  T(s, '原报告答了"坏了什么、怎么修"；今天多问三个问题', { x: M, y: 3.75, w: 9, h: 0.4, fontSize: 17, bold: true, color: C.text2, margin: 0 }, { st, fx: 'fade', d: 0 });
  const three = [
    ['01', '怎么查', '排查四步法：从"跳闸"一步步缩小到"轴承"', I_.searchB],
    ['02', '为什么坏', '看证据、给嫌疑排个序', I_.questA],
    ['03', '怎么防', '找出"监测盲区"，在跳闸之前发现它', I_.bulbG],
  ];
  const tw = (CW - 2 * 0.3) / 3;
  three.forEach((c, i) => {
    const x = M + i * (tw + 0.3), y = 4.3, a = { st, fx: 'float', d: 150 + i * 220 };
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: tw, h: 2.3, fill: { color: C.background1 }, line: { color: 'E1E7EF', width: 1 }, rectRadius: 0.12, shadow: shadow() }, a);
    T(s, c[0], { x: x + 0.35, y: y + 0.3, w: 1.2, h: 0.6, fontSize: 30, bold: true, color: C.accent2, margin: 0, fontFace: 'Arial' }, a);
    I(s, { data: c[3], x: x + tw - 0.95, y: y + 0.3, w: 0.6, h: 0.6 }, a);
    T(s, c[1], { x: x + 0.35, y: y + 1.0, w: tw - 0.7, h: 0.45, fontSize: 20, bold: true, color: C.text2, margin: 0 }, a);
    T(s, c[2], { x: x + 0.35, y: y + 1.48, w: tw - 0.7, h: 0.65, fontSize: 14, color: C.text1, margin: 0, valign: 'top' }, a);
  });
  N(s, `【一页看懂 · 约1分钟】
· 故障链（自动出现）：保持架破损 → 滚珠扎堆卡死 → 电流急剧上升 → 综保过流跳闸 → 生产波动。
· 综保动作是对的，保护起了作用；问题是没能在跳闸之前发现。
[点击] 三个问题：怎么查——四步法；为什么坏——看证据、排嫌疑；怎么防——监测盲区、跳闸前发现。
· 一句话主线：今天不是只讲一个故障，是讲"一份浅报告，怎么挖深"。`);

  // =====================================================================
  // 4 EQUIPMENT
  s = newSlide('CONTENT', '01 案例回顾');
  tagPill(s, '01  案例回顾');
  title(s, '认识设备：BL-1655C 负压风机电机');
  st = step('auto');
  const ph = 4.35, pw = 3.26;
  I(s, { path: A('install.jpg'), x: M, y: 1.85, w: pw, h: ph }, { st, fx: 'fade', d: 0 });
  I(s, { path: A('nameplate.jpg'), x: M + pw + 0.25, y: 1.85, w: pw, h: ph }, { st, fx: 'fade', d: 250 });
  T(s, '现场：皮带传动，装在封闭机箱内', { x: M, y: 6.28, w: pw, h: 0.3, fontSize: 12, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 400 });
  T(s, '铭牌：ABB M2QA200L2A · EFF2', { x: M + pw + 0.25, y: 6.28, w: pw, h: 0.3, fontSize: 12, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 500 });
  st = step('click');
  const rx = 7.85, rw = W - M - rx, tiw = (rw - 0.25) / 2;
  const tiles = [['30 kW', '额定功率'], ['2950 r/min', '2 极 · 高转速'], ['54.8 A', '额定电流（380 V △）'], ['皮带传动', '拉力作用在负荷侧']];
  tiles.forEach((t, i) => {
    const x = rx + (i % 2) * (tiw + 0.25), y = 1.85 + Math.floor(i / 2) * 1.4, a = { st, fx: 'zoom', d: i * 180 };
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: tiw, h: 1.2, fill: { color: C.background2 }, line: NONE, rectRadius: 0.1 }, a);
    T(s, t[0], { x: x + 0.22, y: y + 0.17, w: tiw - 0.3, h: 0.55, fontSize: 24, bold: true, color: i === 3 ? C.accent2 : C.text2, margin: 0 }, a);
    T(s, t[1], { x: x + 0.22, y: y + 0.76, w: tiw - 0.3, h: 0.3, fontSize: 12, color: C.accent5, margin: 0 }, a);
  });
  st = step('click');
  S(s, SH.OVAL, { x: M + 0.42, y: 3.55, w: 0.8, h: 1.25, fill: CLEAR, line: { color: C.accent2, width: 2.5, dashType: 'dash' } }, { st, fx: 'zoom', d: 0 });
  T(s, '皮带轮', { x: M + 1.25, y: 3.9, w: 0.85, h: 0.32, fontSize: 12, bold: true, color: C.background1, fill: { color: C.accent2 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.16, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'fade', d: 150 });
  const npx = M + pw + 0.25;
  S(s, SH.ROUNDED_RECTANGLE, { x: npx + 1.0, y: 1.92, w: 2.05, h: 1.15, fill: CLEAR, line: { color: C.accent2, width: 2.5, dashType: 'dash' }, rectRadius: 0.1 }, { st, fx: 'zoom', d: 300 });
  T(s, '散热筋积灰结块', { x: npx + 1.15, y: 3.14, w: 1.75, h: 0.32, fontSize: 12, bold: true, color: C.background1, fill: { color: C.accent2 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.16, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'fade', d: 450 });
  st = step('click');
  let a3 = { st, fx: 'float', d: 0 };
  S(s, SH.ROUNDED_RECTANGLE, { x: rx, y: 4.72, w: rw, h: 1.95, fill: { color: C.accent2, transparency: 90 }, line: NONE, rectRadius: 0.1 }, a3);
  I(s, { data: I_.warnA, x: rx + 0.22, y: 4.88, w: 0.42, h: 0.42 }, a3);
  T(s, '工况：轴承"负担偏重"', { x: rx + 0.75, y: 4.88, w: rw - 1.85, h: 0.42, fontSize: 15, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, a3);
  badge(s, 'inf', rx + rw - 1.0, 4.95, a3);
  T(s, [
    { text: '2 极高速：', options: { bold: true, color: C.text2 } }, { text: '近 3000 r/min，对润滑更敏感', options: { breakLine: true } },
    { text: '皮带传动：', options: { bold: true, color: C.text2 } }, { text: '拉力压在负荷侧，本次正是这侧坏', options: { breakLine: true } },
    { text: '封闭机箱：', options: { bold: true, color: C.text2 } }, { text: '粉尘多、散热差，巡检看不全' },
  ], { x: rx + 0.22, y: 5.4, w: rw - 0.4, h: 1.15, fontSize: 13, color: C.text1, margin: 0, valign: 'top', paraSpaceAfter: 3 }, a3);
  N(s, `【认识设备 · 约1分钟】
· 左边现场照片，右边铭牌：ABB M2QA200L2A，EFF2。
[点击] 关键参数：30kW、2极 2950转、额定电流54.8A（380V三角形）、皮带传动。
[点击] 照片里能看出两件事：皮带传动；散热筋上积灰已经结块。
[点击] 工况特点——这是我根据照片和铭牌的推断，原报告没写：高转速 + 皮带拉力 + 封闭粉尘环境，三样叠在一起。
· 互动：我们装置有没有"皮带 + 2极 + 封闭机箱"的电机？先记着，最后讨论。`);

  // =====================================================================
  // 5 TIMELINE + what the report is missing
  s = newSlide('CONTENT', '01 案例回顾');
  tagPill(s, '01  案例回顾');
  title(s, '故障经过：从跳闸到恢复');
  st = step('auto');
  const ev = [
    ['14:05 跳闸', '综保显示"过电流保护动作"，电机停机，生产波动', C.accent3],
    ['立即到场', '双兴电气车间值班人员立即到场', C.accent1],
    ['检查判断', '查综保记录 → 摇测绝缘 → 拆皮带盘车', C.accent1],
    ['解体电机', '发现负荷侧轴承保持架破损', C.accent1],
    ['更换修复', '更换两侧轴承；综保复位，复测绝缘合格', C.accent1],
    ['恢复运行', '重新接线试机，恢复正常运行', C.accent4],
  ];
  const cw6 = (CW - 5 * 0.2) / 6;
  S(s, SH.LINE, { x: M + cw6 / 2, y: 2.75, w: CW - cw6, h: 0, line: { color: C.accent6, width: 2 } }, { st, fx: 'wipeL', d: 0, dur: 1200 });
  ev.forEach((e, i) => {
    const x = M + i * (cw6 + 0.2), cx = x + cw6 / 2, a = { st, fx: 'float', d: 200 + i * 220 };
    T(s, e[0], { x, y: 1.85, w: cw6, h: 0.42, fontSize: 15, bold: true, color: C.text2, align: 'center', margin: 0 }, a);
    T(s, String(i + 1), { x: cx - 0.25, y: 2.5, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: C.background1, fill: { color: e[2] }, shape: SH.OVAL, align: 'center', valign: 'middle', margin: 0, fontFace: 'Arial' }, { st, fx: 'zoom', d: 200 + i * 220 });
    S(s, SH.ROUNDED_RECTANGLE, { x, y: 3.2, w: cw6, h: 1.3, fill: { color: C.background2 }, line: NONE, rectRadius: 0.1 }, a);
    T(s, e[1], { x: x + 0.13, y: 3.32, w: cw6 - 0.26, h: 1.1, fontSize: 13, color: C.text1, margin: 0, valign: 'top', lineSpacingMultiple: 1.1 }, a);
  });
  st = step('click');
  a3 = { st, fx: 'float', d: 0 };
  S(s, SH.ROUNDED_RECTANGLE, { x: M, y: 4.75, w: CW, h: 2.0, fill: { color: C.accent2, transparency: 91 }, line: NONE, rectRadius: 0.1 }, a3);
  I(s, { data: I_.fileA, x: M + 0.25, y: 4.92, w: 0.45, h: 0.45 }, a3);
  T(s, '原报告缺了这些——查根因恰恰要用', { x: M + 0.85, y: 4.92, w: 6, h: 0.45, fontSize: 15, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, a3);
  badge(s, 'tbd', M + 0.85 + textW('原报告缺了这些——查根因恰恰要用', 15) + 0.2, 4.99, a3);
  const miss = ['停机时长', '产量影响', '轴承型号', '这套轴承运行时长', '上次加脂 / 换轴承时间', '加脂周期', '故障前巡检记录',
    '是否在冲击脉冲 / 测振路线上', '皮带张力和对中', '同型号电机故障史', '旧轴承是否留存'];
  let cx0 = M + 0.3, cy0 = 5.55;
  miss.forEach((t, i) => {
    const w = textW(t, 12) + 0.36;
    if (cx0 + w > M + CW - 0.25) { cx0 = M + 0.3; cy0 += 0.52; }
    T(s, t, { x: cx0, y: cy0, w, h: 0.4, fontSize: 12, color: C.text2, fill: { color: C.background1 }, line: { color: C.accent5, width: 0.75, dashType: 'dash' },
      shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.2, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 200 + i * 70 });
    cx0 += w + 0.14;
  });
  N(s, `【故障经过 · 约1分钟】
· 时间线自动出现：14:05跳闸 → 值班人员立即到场 → 检查判断 → 解体 → 更换修复 → 恢复运行。
· 处置值得肯定：到场快、判断准、修复及时。
[点击] 但原报告缺了11项数据：停机时长、产量影响、轴承型号、运行时长、上次加脂、加脂周期、巡检记录、监测路线、皮带张力对中、同型号故障史、旧轴承在不在。
· 今天凡是缺数据的地方，我都标了【待双兴提供】，不编数。
· 以后我们自己写故障报告，这些要补上。`);

  // =====================================================================
  // 6 DIAGNOSIS: four steps, each with a mini animation
  pres.addSection({ title: '02 怎么查' });
  s = newSlide('CONTENT', '02 怎么查');
  tagPill(s, '02  怎么查');
  title(s, '学习点①：四步锁定故障位置');
  const steps4 = [
    ['看保护', '查综保动作记录', '过电流保护动作', '先列出可能：机械卡阻 / 缺相 / 绕组故障', '范围：整套设备', 1.0],
    ['测绝缘', '摇测电机绝缘电阻', '绝缘合格', '排除绕组接地、击穿 → 以机械为主', '范围：机械为主', 0.86],
    ['断负载', '拆下皮带，手动盘车', '电机轴转不动', '排除风机侧卡涩，也排除电源原因', '范围：电机内部', 0.72],
    ['解体查', '拆开电机检查', '负荷侧保持架破损', '找到实物证据', '定位：负荷侧轴承', 0.62],
  ];
  const sw = (CW - 3 * 0.35) / 4, cardY = 1.8, cardH = 3.75;
  steps4.forEach((c, i) => {
    st = step(i === 0 ? 'auto' : 'click');
    const x = M + i * (sw + 0.35), y = cardY, a = { st, fx: 'float', d: 0 };
    if (i > 0) S(s, SH.CHEVRON, { x: x - 0.27, y: y + 1.9, w: 0.2, h: 0.32, fill: { color: C.accent2 }, line: NONE }, { st, fx: 'fade', d: 0 });
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: sw, h: cardH, fill: { color: C.background2 }, line: NONE, rectRadius: 0.12 }, a);
    const vx = x + 0.15, vy = y + 0.15, vw = sw - 0.3, vh = 1.25;
    S(s, SH.ROUNDED_RECTANGLE, { x: vx, y: vy, w: vw, h: vh, fill: { color: C.background1 }, line: NONE, rectRadius: 0.08 }, a);
    if (i === 0) {          // relay panel with a blinking trip lamp
      S(s, SH.ROUNDED_RECTANGLE, { x: vx + 0.3, y: vy + 0.14, w: vw - 0.6, h: vh - 0.28, fill: { color: '1C2733' }, line: NONE, rectRadius: 0.06 }, a);
      T(s, '综合保护器', { x: vx + 0.42, y: vy + 0.2, w: 1.2, h: 0.24, fontSize: 9, color: '8FA3BC', margin: 0 }, a);
      T(s, '过电流保护动作', { x: vx + 0.42, y: vy + 0.48, w: 1.3, h: 0.36, fontSize: 11, bold: true, color: '7CF0A8', fill: { color: '0F2A1E' }, margin: 0, align: 'center', valign: 'middle' }, a);
      S(s, SH.OVAL, { x: vx + vw - 0.72, y: vy + 0.3, w: 0.22, h: 0.22, fill: { color: '3A4656' }, line: NONE }, a);
      T(s, '运行', { x: vx + vw - 0.79, y: vy + 0.55, w: 0.36, h: 0.2, fontSize: 9, color: '8FA3BC', margin: 0, align: 'center' }, a);
      S(s, SH.OVAL, { x: vx + vw - 0.72, y: vy + 0.78, w: 0.22, h: 0.22, fill: { color: C.accent3 }, line: { color: 'FFB3B0', width: 1 } }, [a, { st, fx: 'blink', d: 700, dur: 400, repeat: 6 }]);
    } else if (i === 1) {   // megger needle swings to the safe end
      const ds = 1.1, dx = vx + vw / 2 - ds / 2 - 0.35, dy = vy + 0.08;
      I(s, { path: G('dial_megger.png'), x: dx, y: dy, w: ds, h: ds }, a);
      I(s, { path: G('needle.png'), x: dx, y: dy, w: ds, h: ds, rotate: 240 }, [a, { st, fx: 'spin', d: 600, dur: 1200, deg: 222 }]);
      T(s, '合格', { x: dx + ds + 0.08, y: dy + 0.35, w: 0.8, h: 0.4, fontSize: 15, bold: true, color: C.accent4, margin: 0, valign: 'middle' }, { st, fx: 'zoom', d: 1800 });
    } else if (i === 2) {   // belt comes off, shaft will not turn
      const ps = 0.95, px = vx + 0.3, py = vy + 0.2;
      S(s, SH.ROUNDED_RECTANGLE, { x: px - 0.04, y: py - 0.04, w: vw - 0.35, h: ps + 0.08, rectRadius: (ps + 0.08) / 2, fill: CLEAR, line: { color: '1C2733', width: 4.5 } },
        [a, { st, fx: 'path', d: 500, dur: 700, path: 'M 0 0 L 0.02 -0.09 E' }, { st, fx: 'out', d: 850, dur: 350 }]);
      I(s, { path: G('pulley_motor.png'), x: px, y: py, w: ps, h: ps }, [a, { st, fx: 'wobble', d: 1300, dur: 110, deg: 7, repeat: 5 }]);
      T(s, '盘不动！', { x: px + ps + 0.12, y: py + 0.3, w: 1.0, h: 0.4, fontSize: 15, bold: true, color: C.accent3, margin: 0, valign: 'middle' }, { st, fx: 'zoom', d: 1500 });
    } else {                // end cover slides away and reveals the evidence
      const ps = 1.0, px = vx + vw / 2 - ps / 2, py = vy + 0.12;
      I(s, { path: A('housing_sq.jpg'), x: px, y: py, w: ps, h: ps }, a);
      T(s, '端盖', { x: px - 0.04, y: py - 0.04, w: ps + 0.08, h: ps + 0.08, shape: SH.OVAL, fill: { color: '8796AA' }, line: { color: '5C6D82', width: 2 }, fontSize: 13, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 },
        [a, { st, fx: 'path', d: 600, dur: 900, path: 'M 0 0 L 0.075 0 E' }, { st, fx: 'out', d: 1200, dur: 400 }]);
    }
    const ty = y + 1.52;
    T(s, `第${i + 1}步`, { x: x + 0.2, y: ty + 0.06, w: 0.8, h: 0.3, fontSize: 11, bold: true, color: C.background1, fill: { color: C.accent2 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, align: 'center', valign: 'middle', margin: 0 }, a);
    T(s, c[0], { x: x + 1.1, y: ty, w: sw - 1.25, h: 0.42, fontSize: 20, bold: true, color: C.text2, margin: 0, valign: 'middle' }, a);
    T(s, [
      { text: '做法  ', options: { bold: true, color: C.accent5, fontSize: 12 } }, { text: c[1], options: { breakLine: true } },
      { text: '结果  ', options: { bold: true, color: C.accent5, fontSize: 12 } }, { text: c[2], options: { bold: true, color: i === 3 ? C.accent3 : C.text1 } },
    ], { x: x + 0.2, y: ty + 0.55, w: sw - 0.35, h: 0.7, fontSize: 13, color: C.text1, margin: 0, valign: 'top', paraSpaceAfter: 3 }, a);
    T(s, '→ ' + c[3], { x: x + 0.12, y: ty + 1.3, w: sw - 0.24, h: 0.8, fontSize: 12.5, color: C.text2, fill: { color: C.background1 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.08, margin: [4, 7, 4, 7], valign: 'middle' }, a);
    const bw = sw * c[5];
    T(s, c[4], { x: x + (sw - bw) / 2, y: 5.68, w: bw, h: 0.38, fontSize: 12, bold: true, color: C.background1, fill: { color: i === 3 ? C.accent3 : C.accent1, transparency: i === 3 ? 0 : 25 - i * 12 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.19, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 250 });
  });
  st = step('click');
  T(s, [
    { text: '口诀  ', options: { bold: true, color: C.accent2 } },
    { text: '先查记录、再测电气、后拆机械；先外后内、先简后繁 —— 每一步都缩小一次范围', options: { bold: true, color: C.text2 } },
  ], { x: M, y: 6.2, w: CW, h: 0.55, fontSize: 15.5, fill: { color: C.accent2, transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.1, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 0 });
  N(s, `【学习点① 排查四步法 · 约2.5分钟 · 本页重点】
· 第1步 看保护（自动出现，红灯闪）：综保报过流。先别急着拆，列出可能——机械卡阻？缺相？绕组故障？
[点击] 第2步 测绝缘：兆欧表指针摆到高阻区，合格 → 绕组没接地、没击穿，问题以机械为主。
[点击] 第3步 断负载：皮带拆下，盘车——轴只晃不转。这一步最关键：一下把范围从"整套设备"缩到"电机本身"，风机侧和电源都排除了。
[点击] 第4步 解体：端盖一拿开，滚珠挤在一侧，负荷侧保持架破损——实物证据。
[点击] 口诀：先查记录、再测电气、后拆机械；先外后内、先简后繁。
· 互动：如果第3步盘车是转得动的，下一步查什么？（风机侧：叶轮、风机轴承、卡涩）`);

  // =====================================================================
  // 7 EVIDENCE
  s = newSlide('CONTENT', '02 怎么查');
  tagPill(s, '02  怎么查');
  title(s, '现场证据：拆开后看到了什么');
  st = step('auto');
  const phw = 2.78, phh = 3.3, gap4 = (CW - 4 * phw) / 3;
  const ev4 = [
    ['shaft.jpg', '负荷侧轴端', '端盖拆下后，轴承部位满是发黑的油脂'],
    ['housing.jpg', '轴承室内部', '滚珠挤在一侧、另一侧空着'],
    ['cage1.jpg', '断裂的保持架', '冲压钢保持架断开、严重变形'],
    ['cage2.jpg', '保持架残片', '半圈保持架弯折，兜孔已破坏'],
  ];
  ev4.forEach((e, i) => {
    const x = M + i * (phw + gap4), a = { st, fx: 'float', d: i * 220 };
    I(s, { path: A(e[0]), x, y: 1.85, w: phw, h: phh, sizing: { type: 'cover', w: phw, h: phh } }, a);
    numDot(s, i + 1, x + 0.12, 1.97, 0.42, C.accent2, a, 14);
    T(s, e[1], { x, y: 5.25, w: phw, h: 0.34, fontSize: 14, bold: true, color: C.text2, margin: 0 }, a);
    T(s, e[2], { x, y: 5.6, w: phw, h: 0.5, fontSize: 12, color: C.accent5, margin: 0, valign: 'top' }, a);
  });
  st = step('click');
  const ih = phw / 0.75, off = (ih - phh) / 2;
  S(s, SH.OVAL, { x: M + 0.34 * phw, y: 1.85 - off + 0.26 * ih, w: 0.32 * phw, h: 0.25 * ih, fill: CLEAR, line: { color: C.accent2, width: 2.5, dashType: 'dash' } }, { st, fx: 'zoom', d: 0 });
  const x2 = M + phw + gap4;
  S(s, SH.OVAL, { x: x2 + 0.41 * phw, y: 1.85 - off + 0.33 * ih, w: 0.31 * phw, h: 0.44 * ih, fill: CLEAR, line: { color: C.accent2, width: 2.5, dashType: 'dash' } }, { st, fx: 'zoom', d: 250 });
  st = step('click');
  S(s, SH.ROUNDED_RECTANGLE, { x: M, y: 6.18, w: CW, h: 0.58, fill: { color: C.accent2, transparency: 88 }, line: NONE, rectRadius: 0.1 }, { st, fx: 'float', d: 0 });
  T(s, [
    { text: '油脂发黑 + 滚珠扎堆：', options: { bold: true, color: C.accent2 } },
    { text: '油脂发黑往往意味着长期高温或污染 —— 轴承很可能是"慢慢坏"的，跳闸只是最后一下', options: { bold: true, color: C.text2 } },
  ], { x: M + 0.2, y: 6.18, w: CW - 1.4, h: 0.58, fontSize: 14, align: 'left', valign: 'middle', margin: 0 }, { st, fx: 'float', d: 0 });
  badge(s, 'inf', M + CW - 1.05, 6.33, { st, fx: 'float', d: 0 });
  N(s, `【现场证据 · 约1分钟】
· 四张照片依次讲：①负荷侧轴端 ②轴承室内部 ③④断裂的保持架（冲压钢，两半铆接式）。
[点击] 圈出两处：①油脂发黑；②滚珠挤在一侧、另一侧空着——保持架断了就是这个样子。
[点击] 判断：油脂发黑通常是长期高温或混入杂质/磨损金属 → 轴承是慢慢劣化的。
· 措辞注意：这是看照片的推断【推断】，原报告没有化验油脂。`);

  // =====================================================================
  // 8 KNOWLEDGE: what a cage is (spinning PNG parts)
  s = newSlide('CONTENT', '02 怎么查');
  tagPill(s, '知识点');
  title(s, '保持架是什么：滚珠的"隔离栏"');
  st = step('auto');
  const BX = 3.55, BY = 4.2, BR = 1.9;
  const bsq = { x: BX - BR, y: BY - BR, w: 2 * BR, h: 2 * BR };
  I(s, { path: G('outer_ring.png'), ...bsq }, { st, fx: 'zoom', d: 0, dur: 600 });
  I(s, { path: G('ballset.png'), ...bsq }, [{ st, fx: 'zoom', d: 0, dur: 600 }, { st, fx: 'spin', d: 700, dur: 3000, deg: 360, repeat: 'indefinite' }]);
  I(s, { path: G('inner_ring.png'), ...bsq }, [{ st, fx: 'zoom', d: 0, dur: 600 }, { st, fx: 'spin', d: 700, dur: 1200, deg: 360, repeat: 'indefinite' }]);
  T(s, '转动示意：内圈随轴转，滚珠和保持架约以 0.4 倍轴速公转', { x: 1.2, y: 6.25, w: 4.7, h: 0.4, fontSize: 12, color: C.accent5, align: 'center', margin: 0 }, { st, fx: 'fade', d: 400 });
  T(s, '深沟球轴承的 4 个部件', { x: 7.3, y: 1.9, w: 5.4, h: 0.45, fontSize: 18, bold: true, color: C.text2, margin: 0 }, { st, fx: 'fade', d: 500 });
  const pr = (r, ang) => [BX + r * Math.cos(ang), BY + r * Math.sin(ang)];
  const parts = [
    ['外圈', '装在端盖轴承室里，不转动', pr(0.9 * BR, -0.7)],
    ['内圈', '套在电机轴上，跟着轴一起转', pr(0.44 * BR, -0.35)],
    ['保持架', '把滚珠均匀隔开，带着它们有序滚动。本例是薄钢板冲压件，相对单薄', pr(0.66 * BR, 0.2)],
    ['滚珠', '在内外圈之间滚动，承担转子重量和皮带拉力', pr(0.66 * BR, 0.75)],
  ];
  const rowY = [2.5, 3.3, 4.1, 5.15];
  parts.forEach((p, i) => {
    const y = rowY[i], hgt = i === 2 ? 0.8 : 0.66, mid = y + 0.33, a = { st, fx: 'float', d: 700 + i * 300 };
    if (i === 2) S(s, SH.ROUNDED_RECTANGLE, { x: 7.15, y: y - 0.08, w: W - M - 7.15, h: hgt + 0.12, fill: { color: C.accent2, transparency: 88 }, line: NONE, rectRadius: 0.08 }, a);
    const [tx, ty] = p[2];
    S(s, SH.LINE, { x: tx, y: Math.min(ty, mid), w: 7.15 - tx, h: Math.abs(mid - ty), flipV: mid < ty, line: { color: i === 2 ? C.accent2 : C.accent5, width: 1.25 } }, { st, fx: 'wipeL', d: 700 + i * 300 });
    S(s, SH.OVAL, { x: tx - 0.06, y: ty - 0.06, w: 0.12, h: 0.12, fill: { color: i === 2 ? C.accent2 : C.text2 }, line: { color: 'FFFFFF', width: 1 } }, { st, fx: 'zoom', d: 700 + i * 300 });
    T(s, p[0], { x: 7.3, y, w: 1.05, h: 0.66, fontSize: 16, bold: true, color: i === 2 ? C.accent2 : C.text2, margin: 0, valign: 'top' }, a);
    T(s, p[1], { x: 8.4, y: y + 0.02, w: W - M - 8.55, h: hgt, fontSize: 13, color: C.text1, margin: 0, valign: 'top', lineSpacingMultiple: 1.1 }, a);
  });
  T(s, '注：原报告写作"支持架"，规范名称为"保持架"（cage / retainer）', { x: 7.3, y: 6.25, w: W - M - 7.3, h: 0.32, fontSize: 12, color: C.accent5, margin: 0, italic: true }, { st, fx: 'fade', d: 2000 });
  N(s, `【知识点：保持架 · 约1分钟】
· （自动）轴承转起来：外圈不动；内圈跟轴一起转（看白点）；滚珠和保持架慢一些，大约0.4倍轴速公转。
· 四个部件：外圈装在轴承室、内圈套在轴上、滚珠在中间滚、保持架把滚珠隔开。
· 保持架就是"隔离栏"：每颗滚珠各占各的位置，受力均匀。本例是薄钢板冲压件，相对单薄。
· 统一术语：原报告写"支持架"，规范叫"保持架"。下一页看它断了会怎样。`);

  // =====================================================================
  // 9 THE CAGE BREAKS (native shapes; balls travel along the raceway on motion paths)
  s = newSlide('CONTENT', '02 怎么查');
  tagPill(s, '知识点');
  title(s, '保持架一断：滚珠"扎堆"，电机卡死');
  st = step('auto');
  const g9 = { R: 1.9, t: 0.32, ri: 0.95, rb: 0.6, rp: 1.265, rball: 0.26 };
  const circ9 = (r, o, a) => S(s, SH.OVAL, { x: BX - r, y: BY - r, w: 2 * r, h: 2 * r, ...o }, a);
  const ringF = { color: C.accent6, transparency: 35 }, ringL = { color: C.accent1, width: 1.25 };
  circ9(g9.R, { fill: ringF, line: ringL });
  circ9(g9.R - g9.t, { fill: { color: C.background1 }, line: ringL });
  const cageRing = circ9(g9.rp, { fill: CLEAR, line: { color: C.accent2, width: 4 } });
  circ9(g9.ri, { fill: ringF, line: ringL });
  circ9(g9.rb, { fill: { color: '3B4B60' }, line: ringL });
  T(s, '正常：滚珠被均匀隔开', { x: 1.65, y: 6.25, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: C.accent4, align: 'center', margin: 0, _name: 's9_capOK' });
  st = step('click');
  // break: cage ring vanishes, fragments appear, balls slide along the raceway into a pile (lower left)
  reg({ st, fx: 'out', d: 0, dur: 250 }, cageRing);
  reg({ st, fx: 'out', d: 0, dur: 300 }, 's9_capOK');
  [[215, 252, -0.08, -0.05, 0], [266, 314, 0.05, -0.1, -0.05], [326, 352, 0.11, 0.0, 0]].forEach(([a0, a1, dx, dy, dr]) => {
    const r = g9.rp + dr;
    S(s, SH.ARC, { x: BX - r + dx, y: BY - r + dy, w: 2 * r, h: 2 * r, angleRange: [a0, a1], fill: CLEAR, line: { color: C.accent2, width: 4 } }, { st, fx: 'zoom', d: 100, dur: 350 });
  });
  const thetaC = 112, delta = 2 * Math.asin(g9.rball / g9.rp) * 180 / Math.PI * 1.04;
  const start = [...Array(8).keys()].map((k) => -90 + 45 * k);
  const order = start.map((a, i) => ({ i, r: (((a - thetaC - 180) % 360) + 360) % 360 })).sort((p, q) => p.r - q.r);
  const slot = []; order.forEach((p, k) => { slot[p.i] = k; });
  start.forEach((a0, i) => {
    let a1 = thetaC + (slot[i] - 3.5) * delta;
    while (a1 - a0 > 180) a1 -= 360;
    while (a1 - a0 < -180) a1 += 360;
    const P = (deg) => [BX + g9.rp * Math.cos(deg * Math.PI / 180), BY + g9.rp * Math.sin(deg * Math.PI / 180)];
    const [x0, y0] = P(a0);
    let p = 'M 0 0';
    for (let k = 1; k <= 12; k++) { const [x, y] = P(a0 + (a1 - a0) * k / 12); p += ` L ${((x - x0) / W).toFixed(4)} ${((y - y0) / H).toFixed(4)}`; }
    S(s, SH.OVAL, { x: x0 - g9.rball, y: y0 - g9.rball, w: 2 * g9.rball, h: 2 * g9.rball, fill: { color: C.accent5 }, line: { color: '3E4A58', width: 0.75 } },
      { st, fx: 'path', d: 250, dur: 1300, path: p + ' E' });
  });
  T(s, '断裂后：滚珠挤成一堆', { x: 1.65, y: 6.25, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: C.accent3, align: 'center', margin: 0 }, { st, fx: 'fade', d: 1300 });
  T(s, '卡 死', { x: BX - 0.55, y: BY - 0.27, w: 1.1, h: 0.54, fontSize: 18, bold: true, color: C.background1, fill: { color: C.accent3 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.1, align: 'center', valign: 'middle', margin: 0, rotate: -8 }, { st, fx: 'zoom', d: 1600 });
  T(s, '断裂之后会发生什么', { x: 7.3, y: 1.9, w: 5.4, h: 0.45, fontSize: 18, bold: true, color: C.text2, margin: 0 }, { st, fx: 'fade', d: 0 });
  const brk = ['保持架断裂，滚珠失去"隔离栏"', '滚珠挤成一堆，互相摩擦、卡住', '转动阻力剧增，电机接近堵转', '电流飙升 → 综保过流动作 → 停机'];
  brk.forEach((b, i) => {
    if (i === 2) st = step('click');
    const y = 2.5 + i * 0.86, a = { st, fx: 'float', d: i < 2 ? 1500 + i * 400 : (i - 2) * 400 }, last = i === 3;
    S(s, SH.ROUNDED_RECTANGLE, { x: 7.3, y, w: W - M - 7.3, h: 0.66, fill: last ? { color: C.accent3, transparency: 88 } : { color: C.background2 }, line: NONE, rectRadius: 0.1 }, a);
    numDot(s, i + 1, 7.45, y + 0.14, 0.38, last ? C.accent3 : C.accent2, a, 13);
    T(s, b, { x: 8.0, y, w: W - M - 8.15, h: 0.66, fontSize: 14.5, bold: last, color: last ? C.accent3 : C.text1, margin: 0, valign: 'middle' }, a);
    if (i < 3) S(s, SH.CHEVRON, { x: 7.55, y: y + 0.69, w: 0.28, h: 0.16, rotate: 90, fill: { color: C.accent6 }, line: NONE }, a);
  });
  const ev9 = { st, fx: 'fade', d: 900 };
  S(s, SH.ROUNDED_RECTANGLE, { x: 7.3, y: 5.95, w: W - M - 7.3, h: 0.75, fill: { color: C.accent2, transparency: 88 }, line: NONE, rectRadius: 0.1 }, ev9);
  T(s, [{ text: '过流只是"结果"，保持架断裂只是"直接原因"', options: { bold: true, color: C.text2, breakLine: true } },
    { text: '对照照片②：轴承室里的滚珠正是挤在一侧', options: { color: C.accent5, fontSize: 12 } }],
  { x: 7.5, y: 5.95, w: W - M - 7.7, h: 0.75, fontSize: 14, margin: 0, valign: 'middle' }, ev9);
  N(s, `【保持架一断 · 约1分钟】
· 先看左边：正常时8颗滚珠被保持架均匀隔开。
[点击] 保持架断成几段 → 滚珠沿滚道滑过去挤成一堆 → "卡死"。右边同时出现第1、2步：失去隔离栏、互相摩擦卡住。
[点击] 第3、4步：阻力剧增，接近堵转 → 电流飙升 → 综保过流动作停机。
· 小结：过流只是"结果"，保持架断裂只是"直接原因"。对照照片②，滚珠就是挤在一侧。
· 过渡：那保持架为什么会断？原报告没回答，这就是下面要挖的。`);

  // =====================================================================
  // 10 FIVE WHYS
  pres.addSection({ title: '03 为什么坏' });
  s = newSlide('CONTENT', '03 为什么坏');
  tagPill(s, '03  为什么坏');
  title(s, '追问五个"为什么"：原报告只答到第三个');
  const whys = [
    ['为什么停机？', '综保过电流保护动作 —— 保护是对的'],
    ['为什么过流？', '电机转子被卡住，电流急剧上升'],
    ['为什么卡住？', '负荷侧轴承保持架破损，滚珠扎堆'],
    ['为什么保持架会破损？', '原报告没回答 → 今天深挖：看证据、排嫌疑'],
    ['为什么跳闸前没发现？', '管理原因：这台电机处在"监测盲区" —— 对我们最有借鉴意义'],
  ];
  const nums = ['①', '②', '③', '④', '⑤'];
  st = step('auto');
  whys.forEach((w, i) => {
    if (i === 3 || i === 4) st = step('click');
    const x = M + i * 0.5, y = 1.9 + i * 0.95, ww = 7.9, hot = i >= 3, a = { st, fx: 'float', d: i < 3 ? i * 250 : 0 };
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: ww, h: 0.8, fill: hot ? { color: C.accent2, transparency: 88 } : { color: C.background2 }, line: hot ? { color: C.accent2, width: 1.25, dashType: 'dash' } : NONE, rectRadius: 0.1 }, a);
    T(s, '为什么' + nums[i], { x: x + 0.15, y: y + 0.18, w: 1.15, h: 0.44, fontSize: 12, bold: true, color: C.background1, fill: { color: hot ? C.accent2 : C.text2 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.22, align: 'center', valign: 'middle', margin: 0 }, a);
    T(s, [
      { text: w[0], options: { bold: true, color: C.text2, fontSize: 15, breakLine: true } },
      { text: w[1], options: { color: hot ? C.accent2 : C.text1, bold: hot, fontSize: 13 } },
    ], { x: x + 1.5, y: y + 0.04, w: ww - 1.65, h: 0.72, margin: 0, valign: 'middle' }, a);
  });
  const st0 = cur.steps[0], stLast = cur.steps[2];
  S(s, SH.RIGHT_BRACE, { x: 9.75, y: 1.9, w: 0.28, h: 2.7, fill: CLEAR, line: { color: C.accent5, width: 1.5 } }, { st: st0, fx: 'fade', d: 900 });
  T(s, [{ text: '原报告写到这里', options: { breakLine: true } }, { text: '（直接原因）', options: { fontSize: 12, bold: false } }],
    { x: 10.15, y: 2.85, w: 2.55, h: 0.8, fontSize: 14, bold: true, color: C.accent5, margin: 0, valign: 'middle' }, { st: st0, fx: 'fade', d: 1000 });
  S(s, SH.RIGHT_BRACE, { x: 10.75, y: 4.75, w: 0.28, h: 1.75, fill: CLEAR, line: { color: C.accent2, width: 1.5 } }, { st: stLast, fx: 'fade', d: 300 });
  T(s, [{ text: '今天要追问', options: { breakLine: true } }, { text: '（根本原因）', options: { fontSize: 12, bold: false } }],
    { x: 11.12, y: 5.2, w: 1.6, h: 0.8, fontSize: 14, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, { st: stLast, fx: 'fade', d: 400 });
  N(s, `【五个为什么 · 约1.5分钟】
· 一层层往下问，直到问出能"改"的东西。
· 前三问原报告都答了（自动出现）：停机 ← 过流 ← 卡住 ← 保持架破损。这是"直接原因"。
[点击] 第④问：保持架为什么会破损？原报告没回答——接下来两招：看证据、排嫌疑。
[点击] 第⑤问：为什么跳闸前没发现？这是管理原因，对我们最有借鉴意义，后面专门讲"监测盲区"。`);

  // =====================================================================
  // 11 DEEP DIVE 1: the fracture talks
  s = newSlide('CONTENT', '03 为什么坏');
  tagPill(s, '03  深挖①');
  title(s, '深挖①：断口会说话 —— 拆下来的东西就是证据');
  st = step('auto');
  const tblX = M, c1w = 3.35, c2w = 4.1, rowH = 0.6;
  S(s, SH.RECTANGLE, { x: tblX, y: 1.85, w: c1w + c2w, h: 0.45, fill: { color: C.text2 }, line: NONE }, { st, fx: 'fade', d: 0 });
  T(s, '保持架 / 轴承上看到的', { x: tblX + 0.15, y: 1.85, w: c1w - 0.2, h: 0.45, fontSize: 13, bold: true, color: C.background1, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 0 });
  T(s, '常见指向（失效分析常识，非本案结论）', { x: tblX + c1w + 0.15, y: 1.85, w: c2w - 0.2, h: 0.45, fontSize: 13, bold: true, color: C.background1, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 0 });
  const tbl = [
    ['兜孔磨大、变薄，有磨屑', '润滑不良（缺脂、脂老化）'],
    ['铆钉断、两半分离', '振动、冲击、频繁起停或加减速'],
    ['兜孔横梁疲劳开裂', '不对中、力矩载荷（偏载）'],
    ['钢件发蓝 / 发褐（回火色）', '曾经过热'],
    ['滚道剥落、压痕、搓板纹', '疲劳 / 安装冲击 / 电蚀（变频）'],
  ];
  tbl.forEach((r, i) => {
    const y = 2.3 + i * rowH, a = { st, fx: 'wipeL', d: 400 + i * 350, dur: 500 };
    S(s, SH.RECTANGLE, { x: tblX, y, w: c1w + c2w, h: rowH, fill: { color: i % 2 ? C.background1 : C.background2 }, line: { color: 'E1E7EF', width: 0.75 } }, a);
    T(s, r[0], { x: tblX + 0.15, y, w: c1w - 0.2, h: rowH, fontSize: 13, bold: true, color: C.text2, margin: 0, valign: 'middle' }, a);
    T(s, '→ ' + r[1], { x: tblX + c1w + 0.15, y, w: c2w - 0.2, h: rowH, fontSize: 13, color: C.text1, margin: 0, valign: 'middle' }, a);
  });
  T(s, '用途：知道该拍什么、留什么；单凭这张表不能给本案下结论。', { x: tblX, y: 5.4, w: c1w + c2w, h: 0.35, fontSize: 12, color: C.accent5, italic: true, margin: 0 }, { st, fx: 'fade', d: 2300 });
  const rx11 = 8.4, rw11 = W - M - rx11, tw11 = (rw11 - 0.15) / 2;
  I(s, { path: A('cage1.jpg'), x: rx11, y: 1.85, w: tw11, h: 1.55, sizing: { type: 'cover', w: tw11, h: 1.55 } }, { st, fx: 'fade', d: 200 });
  I(s, { path: A('cage2.jpg'), x: rx11 + tw11 + 0.15, y: 1.85, w: tw11, h: 1.55, sizing: { type: 'cover', w: tw11, h: 1.55 } }, { st, fx: 'fade', d: 300 });
  const boxes11 = [
    ['本案能确认', '保持架撕裂变形；滚珠扎堆；油脂发黑', C.accent4, 'fact'],
    ['本案判断不了', '属于哪种失效模式？照片没拍滚道、滚珠、轴颈，没取油脂样，旧件是否留存不明', C.accent2, null],
    ['教训', '拆下来的东西就是证据：先拍、先留、先贴标签，再扔', C.accent1, null],
  ];
  boxes11.forEach((b, i) => {
    st = step('click');
    const y = 3.6 + i * 1.07, hh = i === 1 ? 1.12 : 0.95, yy = i === 2 ? y + 0.12 : y, a = { st, fx: 'float', d: 0 };
    S(s, SH.ROUNDED_RECTANGLE, { x: rx11, y: yy, w: rw11, h: hh, fill: { color: b[2], transparency: 89 }, line: NONE, rectRadius: 0.08 }, a);
    S(s, SH.RECTANGLE, { x: rx11, y: yy, w: 0.07, h: hh, fill: { color: b[2] }, line: NONE }, a);
    T(s, b[0], { x: rx11 + 0.22, y: yy + 0.08, w: 2.2, h: 0.3, fontSize: 14, bold: true, color: b[2], margin: 0, valign: 'middle' }, a);
    if (b[3]) badge(s, b[3], rx11 + 1.55, yy + 0.1, a);
    T(s, b[1], { x: rx11 + 0.22, y: yy + 0.4, w: rw11 - 0.35, h: hh - 0.46, fontSize: 12.5, color: C.text1, margin: 0, valign: 'top' }, a);
  });
  const shots = ['滚道', '滚珠', '保持架断口', '油脂', '轴颈', '轴承室', '密封'];
  I(s, { data: I_.cameraB, x: tblX, y: 5.95, w: 0.42, h: 0.42 }, { st, fx: 'fade', d: 300 });
  T(s, '下次拆检必拍', { x: tblX + 0.5, y: 5.95, w: 1.6, h: 0.42, fontSize: 14, bold: true, color: C.accent1, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 300 });
  let shx = tblX + 1.95;
  shots.forEach((t, k) => {
    const w = textW(t, 12) + 0.22;
    T(s, t, { x: shx, y: 5.98, w, h: 0.36, fontSize: 12, bold: true, color: C.accent1, fill: { color: C.accent1, transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.18, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 450 + k * 90 });
    shx += w + 0.08;
  });
  T(s, '旧件封存、贴标签（设备位号 + 日期 + DE/NDE），必要时取油脂样', { x: tblX + 0.5, y: 6.42, w: c1w + c2w - 0.5, h: 0.32, fontSize: 12, color: C.text1, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 1100 });
  N(s, `【深挖① 断口会说话 · 约1.5分钟】
· 左表（自动逐行出现）：保持架/轴承上的痕迹，各自常见指向什么。这是失效分析的常识，不是本案结论。
· 举两个例子：兜孔磨大有磨屑 → 多半是润滑不良；钢件发蓝 → 曾经过热。
[点击] 本案能确认的：保持架撕裂变形、滚珠扎堆、油脂发黑——这是事实。
[点击] 判断不了的：到底哪种失效模式？照片没拍滚道、滚珠、轴颈，没取油脂样，旧件在不在也不知道。
[点击] 教训：拆下来的东西就是证据——先拍、先留、先贴标签，再扔。左下是下次拆检必拍的7样：滚道、滚珠、保持架断口、油脂、轴颈、轴承室、密封；旧件封存贴标签。`);

  // =====================================================================
  // 14 RE-RANKING the suspects (chips travel from the flat v1 grid into ranked rows)
  s = newSlide('CONTENT', '03 为什么坏');
  tagPill(s, '03  为什么坏');
  title(s, '嫌疑排序：从"六个方向平铺"到"有轻有重"');
  st = step('auto');
  T(s, '上一版：六个方向平铺', { x: M, y: 1.9, w: 3.6, h: 0.38, fontSize: 14, bold: true, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 0 });
  S(s, SH.ROUNDED_RECTANGLE, { x: M, y: 2.35, w: 3.75, h: 2.35, fill: CLEAR, line: { color: C.accent6, width: 1, dashType: 'dash' }, rectRadius: 0.1 }, { st, fx: 'fade', d: 0 });
  const chipW = 1.6, chipH = 0.45;
  const chipsDef = [
    ['润滑不良', 0, 0], ['皮带过紧/不对中', 1, 0], ['散热差、粉尘大', 0, 1], ['转速高', 1, 1], ['振动冲击', 0, 2], ['寿命与安装', 1, 2],
  ];
  const chipPos = chipsDef.map(([t, c, r]) => ({ t, x: M + 0.2 + c * (chipW + 0.15), y: 2.55 + r * 0.7 }));
  const rankX = 5.0, rankW = W - M - rankX, rowH14 = 1.12, slotX = [rankX + 0.85, rankX + 0.85 + chipW + 0.12];
  const ranks = [
    ['润滑失效 + 温度高', '头号嫌疑：油脂发黑、积灰、封闭机箱；高速 + 高温 + 粉尘，油脂老化快得多', [0, 2], C.accent3, 'inf'],
    ['皮带不对中 / 振动', '坏在负荷侧；查皮带张力、对中、地脚', [1, 4], C.accent2, 'inf'],
    ['2 极高转速', '本身不是"原因"，是"放大器"：让 1、2 的影响更快显现', [3], C.accent1, 'inf'],
    ['轴承寿命 / 安装质量', '缺数据，待核实', [5], C.accent5, 'tbd'],
  ];
  const chipNames = chipPos.map((p) => T(s, p.t, { x: p.x, y: p.y, w: chipW, h: chipH, fontSize: 12.5, bold: true, color: C.text2, fill: { color: C.background2 }, line: { color: C.accent6, width: 1 },
    shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.2, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 200 }));
  ranks.forEach((r, i) => {
    st = step('click');
    const y = 1.9 + i * (rowH14 + 0.1), a = { st, fx: 'fade', d: 0 };
    S(s, SH.ROUNDED_RECTANGLE, { x: rankX, y, w: rankW, h: rowH14, fill: { color: r[3], transparency: 90 }, line: NONE, rectRadius: 0.1 }, a);
    numDot(s, i + 1, rankX + 0.18, y + (rowH14 - 0.5) / 2, 0.5, r[3], a, 18);
    r[2].forEach((ci, k) => {
      const p = chipPos[ci], tx = slotX[k], ty = y + 0.12;
      reg({ st, fx: 'path', d: 150, dur: 1000, path: `M 0 0 L ${((tx - p.x) / W).toFixed(4)} ${((ty - p.y) / H).toFixed(4)} E` }, chipNames[ci]);
    });
    const tx0 = slotX[0] + (r[2].length === 2 ? 2 * chipW + 0.3 : chipW + 0.2);
    T(s, r[0], { x: slotX[0], y: y + 0.62, w: 3.4, h: 0.38, fontSize: 14, bold: true, color: r[3], margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 1000 });
    const bw = badge(s, r[4], tx0, y + 0.13, { st, fx: 'fade', d: 1000 });
    T(s, r[1], { x: slotX[0] + 3.5, y: y + 0.42, w: W - M - (slotX[0] + 3.5) - 0.12, h: 0.66, fontSize: 12, color: C.text1, margin: 0, valign: 'top' }, { st, fx: 'fade', d: 1100 });
  });
  T(s, [
    { text: '落到现场：同类故障先查', options: { bold: true, color: C.accent2, fontSize: 14, breakLine: true } },
    { text: '① 加脂记录、轴承温度', options: { breakLine: true } },
    { text: '② 皮带张力、对中、地脚', options: { breakLine: true } },
    { text: '③ 轴承型号、安装记录' },
  ], { x: M + 0.25, y: 2.55, w: 3.3, h: 1.95, fontSize: 13.5, color: C.text2, margin: 0, valign: 'middle', paraSpaceAfter: 6 }, { st, fx: 'float', d: 1500 });
  T(s, '排序依据：现场照片 + 工况推断。拿到加脂记录、皮带张力、旧轴承后要再修正。', { x: M, y: 4.95, w: 3.75, h: 0.9, fontSize: 12.5, color: C.accent5, italic: true, margin: 0, valign: 'top' }, { st, fx: 'fade', d: 1500 });
  N(s, `【嫌疑排序 · 约1.5分钟】
· 左边是我上一版的讲法：六个方向平铺——听的人不知道先查哪个。
[点击] 第1名：润滑失效 + 温度高。"润滑不良"和"散热差、粉尘大"合并：油脂发黑、积灰、封闭机箱。2极高速、高温、粉尘叠在一起，油脂老化比平常快得多，按常规周期加脂很可能不够。
[点击] 第2名：皮带不对中/振动。坏在负荷侧。正常张紧的皮带拉力不至于压坏轴承，真正要查的是对中、张力、地脚——不对中和抖动才伤轴承。
[点击] 第3名：2极高转速——它不是原因，是"放大器"，让前两条更快出问题。
[点击] 第4名：轴承寿命/安装质量——没数据，待双兴提供。左边同时出现"落到现场"的查找顺序：先查加脂记录和轴承温度，再查皮带，最后查轴承型号和安装。
· 强调：这是推断排序，拿到加脂记录、皮带张力、旧轴承后要再修正。`);

  // =====================================================================
  // 15 DEEP DIVE 3: blind spot
  pres.addSection({ title: '04 怎么防' });
  s = newSlide('CONTENT', '04 怎么防');
  tagPill(s, '04  深挖②');
  title(s, '深挖②：为什么跳闸前没人发现？—— 监测盲区');
  st = step('auto');
  const ex = 0.85, ey = 1.9, ew = 5.2, eh = 2.7;
  S(s, SH.ROUNDED_RECTANGLE, { x: ex, y: ey, w: ew, h: eh, fill: { color: C.background2 }, line: { color: C.accent5, width: 4 }, rectRadius: 0.08 }, { st, fx: 'fade', d: 0 });
  T(s, '封闭机箱（示意）', { x: ex + 0.15, y: ey + 0.1, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 0 });
  S(s, SH.ROUNDED_RECTANGLE, { x: ex + 0.6, y: ey + 0.85, w: 2.1, h: 1.35, fill: { color: C.accent1 }, line: NONE, rectRadius: 0.08 }, { st, fx: 'fade', d: 100 });
  for (let k = 0; k < 6; k++) S(s, SH.LINE, { x: ex + 0.75 + k * 0.33, y: ey + 0.85, w: 0, h: 1.35, line: { color: '174E92', width: 2 } }, { st, fx: 'fade', d: 100 });
  T(s, '电机', { x: ex + 0.6, y: ey + 1.3, w: 2.1, h: 0.4, fontSize: 14, bold: true, color: C.background1, align: 'center', margin: 0 }, { st, fx: 'fade', d: 100 });
  S(s, SH.RECTANGLE, { x: ex + 2.7, y: ey + 1.4, w: 0.35, h: 0.25, fill: { color: '5C6D82' }, line: NONE }, { st, fx: 'fade', d: 100 });
  S(s, SH.OVAL, { x: ex + 3.0, y: ey + 1.0, w: 0.4, h: 1.05, fill: { color: '8796AA' }, line: NONE }, { st, fx: 'fade', d: 100 });
  S(s, SH.LINE, { x: ex + 3.2, y: ey + 0.3, w: 0, h: 0.75, line: { color: '1C2733', width: 4 } }, { st, fx: 'fade', d: 100 });
  T(s, '皮带 → 风机', { x: ex + 3.3, y: ey + 0.35, w: 1.4, h: 0.3, fontSize: 11, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 100 });
  // the hidden fault: load-side bearing, blinking where nobody can see it
  S(s, SH.OVAL, { x: ex + 2.43, y: ey + 1.36, w: 0.34, h: 0.34, fill: { color: C.accent2 }, line: { color: 'FFFFFF', width: 1.5 } }, [{ st, fx: 'zoom', d: 300 }, { st, fx: 'blink', d: 900, dur: 500, repeat: 8 }]);
  T(s, '轴承在"生病"', { x: ex + 1.95, y: ey + 2.25, w: 1.4, h: 0.3, fontSize: 11, bold: true, color: C.accent2, margin: 0, align: 'center' }, { st, fx: 'fade', d: 900 });
  [[0.35, 2.35], [1.2, 2.45], [3.75, 0.95], [4.7, 0.75], [4.0, 1.5], [4.6, 1.85], [0.3, 0.6], [2.5, 0.5]].forEach(([dx, dy], k) =>
    S(s, SH.OVAL, { x: ex + dx, y: ey + dy, w: 0.09 + (k % 3) * 0.03, h: 0.09 + (k % 3) * 0.03, fill: { color: 'A79A86' }, line: NONE }, { st, fx: 'fade', d: 200 }));
  T(s, '粉尘 · 高噪声 · 散热差', { x: ex + 3.15, y: ey + 2.3, w: 1.95, h: 0.3, fontSize: 11, color: C.accent5, margin: 0, align: 'right' }, { st, fx: 'fade', d: 200 });
  // inspection route outside the box; the inspector walks by
  const routeY = ey + eh + 0.42;
  S(s, SH.LINE, { x: ex - 0.15, y: routeY, w: ew + 0.3, h: 0, line: { color: C.accent1, width: 1.5, dashType: 'dash' } }, { st, fx: 'wipeL', d: 300, dur: 800 });
  T(s, '巡检路线', { x: ex + ew - 1.0, y: routeY + 0.04, w: 1.1, h: 0.26, fontSize: 11, color: C.accent1, margin: 0, align: 'right' }, { st, fx: 'fade', d: 300 });
  I(s, { data: I_.walkB, x: ex - 0.25, y: routeY - 0.5, w: 0.5, h: 0.5, altText: '巡检人员' }, [{ st, fx: 'fade', d: 500 }, { st, fx: 'path', d: 700, dur: 3200, path: `M 0 0 L ${(3.4 / W).toFixed(4)} 0 E`, ease: false }]);
  T(s, '"看着都正常。"', { x: ex + 3.65, y: routeY - 0.42, w: 1.6, h: 0.32, fontSize: 12, italic: true, bold: true, color: C.accent5, margin: 0 }, { st, fx: 'zoom', d: 4000 });
  const senses = [[I_.eyeG, '看不见'], [I_.handG, '摸不到'], [I_.earG, '听不清'], [I_.boltG, '电流反应太晚']];
  st = step('click');
  senses.forEach((sn, i) => {
    const x = ex + i * 1.32, y = routeY + 0.38;
    I(s, { data: sn[0], x: x + 0.3, y, w: 0.55, h: 0.55 }, { st, fx: 'zoom', d: i * 450 });
    T(s, sn[1], { x: x - 0.1, y: y + 0.58, w: 1.35, h: 0.3, fontSize: 12, bold: true, color: C.text2, align: 'center', margin: 0, valign: 'top' }, { st, fx: 'fade', d: i * 450 });
    S(s, SH.LINE, { x: x + 0.2, y: y + 0.03, w: 0.75, h: 0.49, line: { color: C.accent3, width: 4 } }, { st, fx: 'wipeL', d: i * 450 + 250, dur: 300 });
  });
  const rx15 = 6.55, rw15 = W - M - rx15;
  S(s, SH.ROUNDED_RECTANGLE, { x: rx15, y: 1.95, w: rw15, h: 1.6, fill: { color: C.accent3, transparency: 90 }, line: NONE, rectRadius: 0.1 }, { st, fx: 'float', d: 1900 });
  T(s, '结论：这是一台"监测盲区设备"', { x: rx15 + 0.2, y: 2.05, w: rw15 - 1.3, h: 0.42, fontSize: 16, bold: true, color: C.accent3, margin: 0, valign: 'middle' }, { st, fx: 'float', d: 1900 });
  badge(s, 'inf', rx15 + rw15 - 1.0, 2.12, { st, fx: 'float', d: 1900 });
  T(s, '封闭机箱 + 负压风机噪声大 → 看不见、摸不到、听不清；很可能不在冲击脉冲/测振路线上；电流又对早期故障不敏感。巡检再认真也发现不了——原报告的"加强巡检"解决不了盲区。',
    { x: rx15 + 0.2, y: 2.5, w: rw15 - 0.35, h: 1.0, fontSize: 12.5, color: C.text1, margin: 0, valign: 'top' }, { st, fx: 'float', d: 1900 });
  st = step('click');
  T(s, '对策：让盲区"可见"', { x: rx15, y: 3.75, w: rw15, h: 0.4, fontSize: 15, bold: true, color: C.text2, margin: 0 }, { st, fx: 'fade', d: 0 });
  ['把盲区设备单列出来，建清单', '测点引到机箱外；注油管加长到机箱外', '纳入冲击脉冲巡检路线', '必要时加装在线温度 / 振动传感器', '这类设备缩短加脂周期（高速、高温、粉尘都要缩短）'].forEach((t, i) => {
    const y = 4.25 + i * 0.5, a = { st, fx: 'float', d: 150 + i * 180 };
    numDot(s, i + 1, rx15, y + 0.04, 0.34, C.accent4, a, 12);
    T(s, t, { x: rx15 + 0.48, y, w: rw15 - 0.5, h: 0.42, fontSize: 13.5, color: C.text1, margin: 0, valign: 'middle' }, a);
  });
  N(s, `【深挖② 监测盲区 · 约1.5分钟 · 回答第⑤个为什么】
· 左边（自动）：电机在封闭机箱里，粉尘大、噪声大、散热差；橙点在闪——负荷侧轴承已经在"生病"。
· 巡检的人沿路线走过去："看着都正常。"——不是他不认真，是根本看不到。
[点击] 一个个划掉：看不见、摸不到、听不清，电流要到快卡死才明显上升——结论【推断】：这是一台"监测盲区设备"，很可能也不在冲击脉冲路线上。
· 重点：巡检再认真也发现不了，所以原报告"加强巡检"解决不了问题。
[点击] 对策：单列清单；测点和注油管引到机箱外；纳入冲击脉冲路线；必要时加在线传感器；缩短加脂周期。
· 互动：我们装置哪几台属于这种情况？（最后讨论时再说）`);

  // =====================================================================
  // 16 REPAIR REVIEW
  s = newSlide('CONTENT', '04 怎么防');
  tagPill(s, '04  怎么防');
  title(s, '维修做法：做对了什么，还可以补什么');
  st = step('auto');
  const lw = 4.75;
  const aL = { st, fx: 'float', d: 0 };
  S(s, SH.ROUNDED_RECTANGLE, { x: M, y: 1.9, w: lw, h: 4.8, fill: { color: C.accent4, transparency: 90 }, line: NONE, rectRadius: 0.12 }, aL);
  I(s, { data: I_.checkG, x: M + 0.3, y: 2.12, w: 0.45, h: 0.45 }, aL);
  T(s, '原方案做对的', { x: M + 0.9, y: 2.12, w: lw - 1.1, h: 0.45, fontSize: 17, bold: true, color: C.accent4, margin: 0, valign: 'middle' }, aL);
  [['两侧轴承一起换', '另一侧在同样工况下也已老化，只换坏的一侧容易短期再坏'],
    ['复测绝缘再送电', '确认绕组没被堵转大电流损伤，再复位综保、送电'],
    ['接线后试机验证', '修完带电跑一跑，确认转向、电流、声音正常']].forEach((g, i) => {
    T(s, [{ text: g[0], options: { bold: true, color: C.text2, fontSize: 15, breakLine: true } }, { text: g[1], options: { fontSize: 13, color: C.text1 } }],
      { x: M + 0.3, y: 2.85 + i * 1.25, w: lw - 0.6, h: 1.05, margin: 0, valign: 'top', paraSpaceAfter: 3, lineSpacingMultiple: 1.1 }, { st, fx: 'float', d: 250 + i * 200 });
  });
  const rx2 = M + lw + 0.3, rw2 = W - M - rx2;
  st = step('click');
  S(s, SH.ROUNDED_RECTANGLE, { x: rx2, y: 1.9, w: rw2, h: 4.8, fill: { color: C.accent2, transparency: 91 }, line: NONE, rectRadius: 0.12 }, { st, fx: 'float', d: 0 });
  I(s, { data: I_.plusA, x: rx2 + 0.3, y: 2.12, w: 0.45, h: 0.45 }, { st, fx: 'float', d: 0 });
  T(s, '建议补充的 6 个动作', { x: rx2 + 0.9, y: 2.12, w: rw2 - 1.1, h: 0.45, fontSize: 17, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, { st, fx: 'float', d: 0 });
  ['检查轴颈、端盖轴承室有无磨损，防止"跑圈"', '清净旧脂，按规定型号和量加新脂；高速电机不能加满', '核对轴承型号和游隙（如 C3），加热安装，不锤击',
    '检查皮带张力和两个皮带轮的对中', '清理散热筋和机箱积灰', '试机后记录电流、温度、冲击脉冲，留作"基准值"'].forEach((t, i) => {
    if (i === 3) st = step('click');
    const y = 2.8 + i * 0.62, a = { st, fx: 'float', d: (i % 3) * 180 };
    numDot(s, i + 1, rx2 + 0.33, y + 0.1, 0.36, C.accent2, a, 12);
    T(s, t, { x: rx2 + 0.88, y, w: rw2 - 1.1, h: 0.56, fontSize: 14, color: C.text1, margin: 0, valign: 'middle' }, a);
  });
  N(s, `【维修做法点评 · 约1分钟】
· 先肯定做对的三点（自动出现）：两侧一起换；复测绝缘再送电；修完试机。
[点击] 建议补充前3条：查轴颈和轴承室，防跑圈；旧脂清净、按量加新脂，2极高速电机尤其不能加满；核对型号游隙、加热安装不锤击。
[点击] 后3条：皮带张力和对中、清理积灰——把嫌疑一并消除；试机后记一组"基准值"，以后冲击脉冲、温度才有比较。`);

  // =====================================================================
  // 17 P-F STAGES with a dot travelling along the curve
  s = newSlide('CONTENT', '04 怎么防');
  tagPill(s, '04  怎么防');
  title(s, '轴承不是突然坏的：劣化的四个阶段');
  st = step('auto');
  const pf = [
    ['阶段一', '早期微损', '看不出、听不到，温度正常', '冲击脉冲、超声', C.accent4],
    ['阶段二', '劣化发展', '振动渐增、油脂变质', '测振、冲击脉冲趋势、看油脂', C.accent4],
    ['阶段三', '明显异常', '异响、轴承发烫', '听音棒、测温枪（电流此时仍不明显）', C.accent2],
    ['阶段四', '功能失效', '卡死、冒烟、跳闸', '保护动作 —— 已经晚了', C.accent3],
  ];
  const pcw = 2.8, pgap = (CW - 4 * pcw) / 3, pcx = (i) => M + pcw / 2 + i * (pcw + pgap);
  const cx0_ = 0.8, cx1_ = 12.5, cyTop = 2.1, cyDrop = 1.75;
  const curveY = (x) => { const u = (x - cx0_) / (cx1_ - cx0_); return cyTop + cyDrop * Math.pow(u, 2.6); };
  const bounds = [cx0_, (pcx(0) + pcx(1)) / 2, (pcx(1) + pcx(2)) / 2, (pcx(2) + pcx(3)) / 2, cx1_];
  for (let i = 0; i < 4; i++) {
    const xa = bounds[i], xb = bounds[i + 1], ya = curveY(xa), yb = curveY(xb);
    const pts = [];
    for (let k = 0; k <= 16; k++) { const x = xa + (xb - xa) * k / 16; pts.push({ x: x - xa, y: curveY(x) - ya }); }
    S(s, SH.CUSTOM_GEOMETRY, { x: xa, y: ya, w: xb - xa, h: Math.max(yb - ya, 0.01), points: pts, fill: CLEAR, line: { color: pf[i][4], width: 4 } }, { st, fx: 'wipeL', d: i * 500, dur: 500 });
  }
  T(s, '设备状态', { x: M, y: 2.3, w: 1.2, h: 0.3, fontSize: 11, color: C.accent5, margin: 0 }, { st, fx: 'fade', d: 0 });
  T(s, '时间 →', { x: W - M - 2.2, y: 3.9, w: 1.0, h: 0.3, fontSize: 11, color: C.accent5, margin: 0, align: 'right' }, { st, fx: 'fade', d: 0 });
  pf.forEach((p, i) => {
    const d = 300 + i * 500, x = M + i * (pcw + pgap), y = 4.15, last = i === 3, cy_ = curveY(pcx(i));
    S(s, SH.OVAL, { x: pcx(i) - 0.13, y: cy_ - 0.13, w: 0.26, h: 0.26, fill: { color: p[4] }, line: { color: 'FFFFFF', width: 2 } }, { st, fx: 'zoom', d });
    const a = { st, fx: 'float', d: d + 100 };
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: pcw, h: 1.85, fill: last ? { color: C.accent3, transparency: 90 } : { color: C.background2 }, line: NONE, rectRadius: 0.12 }, a);
    T(s, p[0], { x: x + 0.2, y: y + 0.18, w: 0.85, h: 0.32, fontSize: 11, bold: true, color: C.background1, fill: { color: p[4] }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.16, align: 'center', valign: 'middle', margin: 0 }, a);
    T(s, p[1], { x: x + 1.15, y: y + 0.15, w: pcw - 1.3, h: 0.38, fontSize: 16, bold: true, color: last ? C.accent3 : C.text2, margin: 0, valign: 'middle' }, a);
    T(s, [
      { text: p[2], options: { fontSize: 13, color: C.text1, breakLine: true } },
      { text: '怎么发现：', options: { bold: true, color: p[4], fontSize: 12 } },
      { text: p[3], options: { fontSize: 12.5, color: last ? C.accent3 : C.text1, bold: last } },
    ], { x: x + 0.2, y: y + 0.62, w: pcw - 0.35, h: 1.15, margin: 0, valign: 'top', paraSpaceAfter: 3 }, a);
  });
  T(s, '示意：P-F 曲线概念（P＝能发现异常的点，F＝功能失效的点），非实测数据', { x: M, y: 6.6, w: CW, h: 0.3, fontSize: 11, color: C.accent5, italic: true, margin: 0 }, { st, fx: 'fade', d: 2400 });
  st = step('click');
  const dotR = 0.16;
  let dp = 'M 0 0';
  for (let k = 1; k <= 40; k++) { const x = cx0_ + (cx1_ - cx0_) * k / 40; dp += ` L ${((x - cx0_) / W).toFixed(4)} ${((curveY(x) - curveY(cx0_)) / H).toFixed(4)}`; }
  S(s, SH.OVAL, { x: cx0_ - dotR, y: curveY(cx0_) - dotR, w: 2 * dotR, h: 2 * dotR, fill: { color: C.text2 }, line: { color: 'FFFFFF', width: 2 } },
    [{ st, fx: 'zoom', d: 0, dur: 300 }, { st, fx: 'path', d: 300, dur: 4200, path: dp + ' E', ease: false }]);
  T(s, '本案例：到这一步才发现', { x: pcx(3) - 3.0, y: 3.55, w: 2.7, h: 0.36, fontSize: 13, bold: true, color: C.background1, fill: { color: C.accent3 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.18, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 4600 });
  st = step('click');
  T(s, '目标：在这里就发现它', { x: (pcx(0) + pcx(1)) / 2 - 1.3, y: 1.62, w: 2.6, h: 0.36, fontSize: 13, bold: true, color: C.background1, fill: { color: C.accent4 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.18, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'zoom', d: 0 });
  T(s, '我们班的"冲击脉冲档案表（HDm/HDc）"就是阶段一、二的工具 —— 关键是连成趋势', { x: M, y: 6.1, w: 7.6, h: 0.42, fontSize: 12.5, bold: true, color: C.accent4, fill: { color: C.accent4, transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.08, align: 'center', valign: 'middle', margin: 0 }, { st, fx: 'float', d: 300 });
  N(s, `【劣化四阶段 · 约1.5分钟】
· （自动画出曲线）轴承从开始损伤到跳闸是一个过程，越往后越快。
· 阶段一、二：人感觉不到，但冲击脉冲、测振能发现；阶段三：听音棒、测温枪能发现，电流仍不明显；阶段四：只能等保护动作。
[点击] 看这个点沿曲线走——时间在走，状态在变差……本案例到阶段四才发现。
[点击] 目标：在阶段一、二就发现。我们班正在做的冲击脉冲档案表（HDm/HDc）就是这个阶段的工具——单次数值意义有限，关键是连成趋势。
· 说明：这是P-F曲线示意，不是这台电机的实测数据。`);

  // =====================================================================
  // 17b ON-SITE CHECK POINTS (dark): numbered hotspots on the running drive
  s = newSlide('DARK', '04 怎么防');
  st = step('auto');
  T(s, '现场怎么查：一台皮带传动电机，盯住这 6 个点', { x: 0.7, y: 1.2, w: 11.9, h: 0.6, fontSize: 26, bold: true, color: C.background1, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 0 });
  const hk = 0.9, hox = 0.75, hoy = 1.95;
  drive(s, hox, hoy, hk, st, { noLabels: true });
  const HS = [
    ['轴承', '听音棒听、测温枪测、冲击脉冲测；每次同一个点，记下来比趋势', [3.55, 3.6]],
    ['加脂', '按台账加；高速电机少量多次、不加满，加完盯一下温度', [0.95, 2.75]],
    ['皮带', '张力计（或按压中点）查松紧；直尺靠两轮端面查对中；看裂纹、打滑发亮', [2.37, 1.92]],
    ['散热筋', '积灰结块就清，封闭机箱里的更要清', [0.3, 3.55]],
    ['地脚', '螺栓紧固、无松动；底座、机架无裂纹', [0.55, 4.85]],
    ['电流', '只作后期佐证：电流明显上升时，轴承已接近卡死', [1.42, 0.38]],
  ];
  const hlx = 6.35, hlw = W - 0.6 - hlx;
  HS.forEach((h, i) => {
    if (i % 2 === 0) st = step('click');
    const [lx_, ly_] = h[2], mx = hox + lx_ * hk, my = hoy + ly_ * hk, d = (i % 2) * 400;
    S(s, SH.OVAL, { x: mx - 0.32, y: my - 0.32, w: 0.64, h: 0.64, fill: { color: C.accent2, transparency: 65 }, line: NONE }, [{ st, fx: 'zoom', d }, { st, fx: 'blink', d: d + 500, dur: 400, repeat: 3 }]);
    numDot(s, i + 1, mx - 0.21, my - 0.21, 0.42, C.accent2, { st, fx: 'zoom', d }, 15);
    const y = 2.05 + i * 0.8, a = { st, fx: 'float', d };
    numDot(s, i + 1, hlx, y + 0.04, 0.4, C.accent2, a, 14);
    T(s, h[0], { x: hlx + 0.55, y, w: 1.2, h: 0.48, fontSize: 17, bold: true, color: C.background1, margin: 0, valign: 'middle' }, a);
    T(s, h[1], { x: hlx + 1.75, y: y - 0.04, w: hlw - 1.75, h: 0.62, fontSize: 13, color: 'D6E2F2', margin: 0, valign: 'middle' }, a);
  });
  T(s, '看不到、够不着的点，按"盲区"处理：测点、注油管引到机箱外', { x: hlx, y: 6.9, w: hlw, h: 0.36, fontSize: 12.5, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 900 });
  N(s, `【现场检查要点 · 约1.5分钟 · 落到每天的巡检】
· 还是开头那台电机，在转。今天讲的东西落到现场，就是盯住6个点。
[点击] ①轴承：听音棒听、测温枪测、冲击脉冲测——关键是每次同一个点，记下来比趋势。②加脂：按台账，高速电机少量多次、别加满，加完盯温度。
[点击] ③皮带：张力计或按压中点查松紧，直尺靠两个皮带轮端面查对中，看裂纹、打滑发亮。④散热筋：积灰结块就清。
[点击] ⑤地脚：螺栓紧固、底座无裂纹。⑥电流：只能作后期佐证，等它明显上升已经晚了。
· 看不到、够不着的点，就按上一节的"盲区"处理。会后发每人一张"巡检口袋卡"。`);

  // =====================================================================
  // 18 SPREAD THE LESSON 2.0
  s = newSlide('CONTENT', '04 怎么防');
  tagPill(s, '04  举一反三 2.0');
  title(s, '举一反三 2.0：把"加强"变成具体动作');
  const layers = [
    ['设备层', '横向排查同类设备', C.accent1, [
      ['筛同类', '技术员 + 各片区', '2 极、皮带、封闭/粉尘/高温，三条占两条即列入', '《重点电机清单》（字段见备注）'],
      ['推到其他转动设备', '各片区电工', '泵、风机、空压机的滚动轴承同理', '补进同一张清单'],
      ['改设计（向上反馈）', '技术员', '2 极配皮带是否合理；机箱通风；张紧用张力计', '改进建议报车间'],
    ]],
    ['管理层', '定周期、找盲区、选指标', C.accent2, [
      ['找盲区', '班长 + 各片区', '近不了身、听不清、摸不到、不在测点路线', '盲区清单 + 对策（见第 13 页）'],
      ['润滑周期按工况修正', '润滑责任人', '按转速、温度、污染修正，不一刀切', '加脂台账：哪台、什么脂、加多少、多久、谁加'],
      ['监测选对指标', '测点责任人', '冲击脉冲/振动＝早，温度/听音＝中，电流＝晚', '每台的基准值、趋势、报警线'],
    ]],
    ['方法层', '以后我们自己怎么做', C.accent4, [
      ['证据保全清单', '拆检负责人', '必拍：滚道、滚珠、保持架断口、油脂、轴颈、轴承室、密封', '旧件封存贴标签，必要时取油脂样'],
      ['故障报告写深', '报告编写人', '至少回答"为什么坏""为什么没提前发现"', '按下一页模板写'],
    ]],
  ];
  const lcw = (CW - 2 * 0.25) / 3;
  layers.forEach((L, li) => {
    st = step(li === 0 ? 'auto' : 'click');
    const x = M + li * (lcw + 0.25), a = { st, fx: 'float', d: 0 };
    S(s, SH.ROUNDED_RECTANGLE, { x, y: 1.85, w: lcw, h: 0.7, fill: { color: L[2] }, line: NONE, rectRadius: 0.08 }, a);
    T(s, [{ text: L[0] + '　', options: { bold: true, fontSize: 17 } }, { text: L[1], options: { fontSize: 13 } }], { x: x + 0.2, y: 1.85, w: lcw - 0.3, h: 0.7, color: C.background1, margin: 0, valign: 'middle' }, a);
    L[3].forEach((it, k) => {
      const y = 2.7 + k * 1.37, ai = { st, fx: 'float', d: 200 + k * 200 }, n = li === 0 ? k + 1 : li === 1 ? k + 4 : k + 7;
      S(s, SH.ROUNDED_RECTANGLE, { x, y, w: lcw, h: 1.27, fill: { color: C.background2 }, line: NONE, rectRadius: 0.08 }, ai);
      numDot(s, n, x + 0.12, y + 0.1, 0.32, L[2], ai, 11);
      T(s, it[0], { x: x + 0.52, y: y + 0.07, w: lcw - 1.9, h: 0.38, fontSize: 13.5, bold: true, color: C.text2, margin: 0, valign: 'middle' }, ai);
      T(s, it[1], { x: x + lcw - 1.5, y: y + 0.11, w: 1.4, h: 0.3, fontSize: 10.5, bold: true, color: L[2], fill: { color: L[2], transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, align: 'center', valign: 'middle', margin: 0 }, ai);
      T(s, [{ text: '查  ', options: { bold: true, color: L[2] } }, { text: it[2], options: { breakLine: true } }, { text: '交  ', options: { bold: true, color: L[2] } }, { text: it[3] }],
        { x: x + 0.15, y: y + 0.47, w: lcw - 0.25, h: 0.78, fontSize: 12, color: C.text1, margin: 0, valign: 'top', paraSpaceAfter: 2 }, ai);
    });
  });
  T(s, '分工为建议，现场定人、定期限；下次班组会对账。', { x: M + 2 * (lcw + 0.25), y: 5.5, w: lcw, h: 1.2, fontSize: 13, bold: true, color: C.accent4,
    fill: CLEAR, line: { color: C.accent4, width: 1.25, dashType: 'dash' }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.08, align: 'center', valign: 'middle', margin: 8 }, { st, fx: 'fade', d: 700 });
  N(s, `【举一反三 2.0 · 约1.5分钟 · 落地】
· 原报告的防范措施是"加强巡检、加强润滑、做好预知性检维修"——方向对，但没法检查。今天把它拆成三层、八件事，每件都写清"谁、查什么、交什么"。
· 设备层（自动出现）：①筛同类——2极（≥2900转）、皮带、封闭/粉尘/高温，占两条就列入。清单字段：位号、功率、转速、传动方式、环境、轴承型号、能否加脂、上次加脂、监测方式、最近一次冲击脉冲值。②泵、风机、空压机同理："高速+高温+污染＝润滑寿命成倍缩短"。③向上反馈：2极配皮带是否合理（直连、改4极、调皮带轮）、机箱通风、张紧用张力计。
[点击] 管理层：④找盲区；⑤润滑周期按工况修正，写进加脂台账；⑥冲击脉冲/振动是早期信号，温度/听音是中期，电流是晚期——每台建基准值、趋势和报警线。
[点击] 方法层：⑦证据保全清单；⑧故障报告写深，模板见下一页。
· 分工是我的建议，可以当场定人、定期限。`);

  // =====================================================================
  // 19 SHALLOW vs DEEP REPORT TEMPLATE
  s = newSlide('CONTENT', '04 怎么防');
  tagPill(s, '04  方法');
  title(s, '故障报告怎么写深：一张模板');
  st = step('auto');
  const lw19 = 3.45;
  S(s, SH.ROUNDED_RECTANGLE, { x: M, y: 1.85, w: lw19, h: 4.9, fill: { color: C.background2 }, line: NONE, rectRadius: 0.1 }, { st, fx: 'fade', d: 0 });
  T(s, '原报告（8 页）', { x: M + 0.25, y: 2.0, w: lw19 - 0.4, h: 0.42, fontSize: 16, bold: true, color: C.accent5, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 0 });
  ['时间、设备、事件', '故障现象（4 条）', '维修办法（3 条）', '防范措施："加强巡检、加强润滑……"'].forEach((t, i) => {
    T(s, t, { x: M + 0.25, y: 2.6 + i * 0.72, w: lw19 - 0.5, h: 0.6, fontSize: 13, color: C.text1, fill: { color: C.background1 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.06, margin: 6, valign: 'middle' }, { st, fx: 'float', d: 200 + i * 150 });
  });
  T(s, '答了"坏了什么、怎么修"；没答"为什么坏""为什么没提前发现"。', { x: M + 0.25, y: 5.55, w: lw19 - 0.45, h: 1.0, fontSize: 12.5, bold: true, color: C.accent2, margin: 0, valign: 'top' }, { st, fx: 'fade', d: 900 });
  const tpl = [
    ['事件', '时间、位号、现象、保护动作', 'has'], ['影响量化', '停机时长、产量损失', 'need'],
    ['时间线', '发现 → 到场 → 判断 → 修复，带时刻', 'part'], ['证据', '滚道/滚珠/断口/油脂/轴颈照片；旧件留存', 'need'],
    ['直接原因', '哪个零件、怎么坏', 'has'], ['根因（技术 + 管理）', '为什么坏 + 为什么没提前发现', 'need'],
    ['测量数据', '温度、振动、冲击脉冲、皮带张力', 'need'], ['整改（责任人 + 期限）', '每条有人、有日期，不写"加强"', 'part'],
    ['横向排查', '同类设备清单', 'need'], ['效果验证', '复测基准值，跟踪趋势', 'need'],
  ];
  const tagS = { has: ['原报告有', C.accent4], part: ['部分有', C.accent1], need: ['需补', C.accent2] };
  const tx19 = M + lw19 + 0.3, tw19 = (W - M - tx19 - 0.15) / 2;
  T(s, '深报告模板（10 项）', { x: tx19, y: 1.85, w: 4, h: 0.4, fontSize: 16, bold: true, color: C.text2, margin: 0, valign: 'middle' }, { st, fx: 'fade', d: 0 });
  tpl.forEach((t, i) => {
    if (i === 0) st = step('click');
    if (i === 6) st = step('click');
    const col = i % 2, row = Math.floor(i / 2), x = tx19 + col * (tw19 + 0.15), y = 2.35 + row * 0.88, a = { st, fx: 'float', d: (i % 6) * 120 };
    const [tg, tc] = tagS[t[2]];
    S(s, SH.ROUNDED_RECTANGLE, { x, y, w: tw19, h: 0.78, fill: { color: C.background1 }, line: { color: t[2] === 'need' ? C.accent2 : 'D5DEE9', width: 1 }, rectRadius: 0.08 }, a);
    numDot(s, i + 1, x + 0.12, y + 0.2, 0.36, tc, a, 12);
    T(s, t[0], { x: x + 0.58, y: y + 0.05, w: tw19 - 1.6, h: 0.36, fontSize: 13.5, bold: true, color: C.text2, margin: 0, valign: 'middle' }, a);
    T(s, tg, { x: x + tw19 - 0.98, y: y + 0.1, w: 0.86, h: 0.27, fontSize: 10.5, bold: true, color: tc, fill: { color: tc, transparency: 88 }, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.13, align: 'center', valign: 'middle', margin: 0 }, a);
    T(s, t[1], { x: x + 0.58, y: y + 0.4, w: tw19 - 0.68, h: 0.34, fontSize: 12, color: C.text1, margin: 0, valign: 'middle' }, a);
  });
  N(s, `【深报告模板 · 约1分钟】
· 左边是原报告的结构：时间设备、现象、维修办法、防范措施——答了"坏了什么、怎么修"。
[点击] 模板前6项：事件、影响量化、时间线、证据、直接原因、根因（技术+管理）。原报告有的标绿，要补的标橙。
[点击] 后4项：测量数据、整改（每条有责任人和期限）、横向排查、效果验证。
· 以后我们自己写，至少回答两个问题：为什么坏？为什么没提前发现？`);

  // =====================================================================
  // 20 CLOSING (dark): three sentences + discussion; the motor is running again
  pres.addSection({ title: '总结' });
  s = newSlide('DARK', '总结');
  st = step('auto');
  T(s, '记住三句话', { x: 0.7, y: 1.3, w: 6.5, h: 0.65, fontSize: 30, bold: true, color: C.background1, margin: 0 }, { st, fx: 'float', d: 0 });
  [['01', '查', '四步缩小范围：看保护 → 测绝缘 → 断负载 → 解体'],
    ['02', '追', '直接原因之后还有根因：润滑、温度、对中、盲区'],
    ['03', '防', '在跳闸前发现：盲区可见、周期按工况、冲击脉冲连成趋势']].forEach((r, i) => {
    const y = 2.15 + i * 0.95, a = { st, fx: 'float', d: 400 + i * 400 };
    T(s, r[0], { x: 0.7, y, w: 0.8, h: 0.75, fontSize: 28, bold: true, color: C.accent2, margin: 0, valign: 'middle', fontFace: 'Arial' }, a);
    T(s, r[1], { x: 1.5, y: y + 0.07, w: 0.6, h: 0.6, fontSize: 21, bold: true, color: C.text2, fill: { color: C.background1 }, shape: SH.OVAL, align: 'center', valign: 'middle', margin: 0 }, a);
    T(s, r[2], { x: 2.3, y, w: 5.2, h: 0.75, fontSize: 15.5, color: C.background1, margin: 0, valign: 'middle', lineSpacingMultiple: 1.05 }, a);
  });
  drive(s, 7.85, 1.15, 0.85, st, { lampText: '恢复运行', labelA: { st, fx: 'fade', d: 0 } });
  T(s, '谢谢大家 · 欢迎交流', { x: 7.85, y: 6.55, w: 4.76, h: 0.4, fontSize: 16, bold: true, color: C.accent6, margin: 0, align: 'center' }, { st, fx: 'fade', d: 1800 });
  st = step('click');
  const dA = { st, fx: 'zoom', d: 0 };
  S(s, SH.ROUNDED_RECTANGLE, { x: 0.7, y: 5.1, w: 6.8, h: 1.85, fill: { color: C.background1, transparency: 92 }, line: { color: C.accent6, width: 1 }, rectRadius: 0.12 }, dA);
  I(s, { data: I_.commA, x: 0.95, y: 5.25, w: 0.45, h: 0.45 }, dA);
  T(s, '讨论一下', { x: 1.55, y: 5.25, w: 3, h: 0.45, fontSize: 16, bold: true, color: C.accent2, margin: 0, valign: 'middle' }, dA);
  T(s, [
    { text: '我们装置哪些电机是"皮带 + 2 极"？', options: { breakLine: true } },
    { text: '哪几台巡检最难到位（盲区）？', options: { breakLine: true } },
    { text: '它们上次加脂是什么时候？有记录吗？' },
  ].map((r) => ({ text: r.text, options: { ...r.options, bullet: { type: 'number' } } })),
  { x: 0.95, y: 5.78, w: 6.4, h: 1.1, fontSize: 14, color: C.background1, margin: 0, valign: 'top', paraSpaceAfter: 2 }, dA);
  N(s, `【总结 · 约1分钟 + 讨论3–5分钟】
· （自动）三句话：查——四步缩小范围；追——直接原因之后还有根因；防——在跳闸前发现。
· 右边电机重新转起来，绿灯"恢复运行"，和开头首尾呼应。
[点击] 三个讨论题：哪些是"皮带+2极"？哪几台最难巡检到位？上次加脂什么时候、有没有记录？
· 可以当场把第17页的清单分工定下来。
· 收尾：谢谢大家。`);

  await pres.writeFile({ fileName: OUT });
  fs.writeFileSync(path.join(path.dirname(OUT), 'anim.json'), JSON.stringify({ _theme: THEME.colors, _transitions: TRANS, ...ANIM }, null, 1));
  console.log('wrote', OUT, 'slides', slideNo);
})().catch((e) => { console.error(e); process.exit(1); });
