// Export the question bank (questions + options + answers, no 解析) as data files for the 刷题 web app.
// Usage: node export_app.js <repo> <siteDir> <fontsDir> <plans.json> <考情速览.md>
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [repo, site, fontsDir, plansJson, statsMd] = process.argv.slice(2);
const { marked } = require(path.join(fontsDir, 'node_modules/marked'));
const sanitize = require(path.join(fontsDir, 'node_modules/sanitize-html'));

const MODS = ['01-政治理论', '02-常识判断', '03-言语理解与表达', '04-数量关系', '05-判断推理', '06-资料分析'];
const MN = ['政治理论', '常识判断', '言语理解', '数量关系', '判断推理', '资料分析'];
const MIN_PER_Q = [0.5, 0.5, 0.875, 1.0, 0.875, 1.25];
const REGION_ORDER = ['国考', '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '深圳市考', '广州市考', '选调'];
const SAN = {
  allowedTags: ['p', 'br', 'img', 'b', 'strong', 'i', 'em', 'u', 'sub', 'sup', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'blockquote', 'hr'],
  allowedAttributes: { img: ['src', 'width', 'height'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] },
  allowedSchemes: [], allowProtocolRelative: false,
  exclusiveFilter: f => f.tag === 'img' && !/^img\/[tf]\/[\w.-]+$/.test(f.attribs.src || ''),
};
const imgs = new Set();
function clean(html) {
  html = html.replace(/✅/g, '').replace(/src="\.\.\/90-图片\/(题目图|公式图)\/([^"]+)"/g, (_, d, f) => {
    imgs.add(`${d}/${f}`);
    return `src="img/${d === '题目图' ? 't' : 'f'}/${f}"`;
  });
  return sanitize(html, SAN).trim();
}
const id = s => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
function nick(short) {
  let t = short.replace('国家公务员录用考试', '国考').replace(/网友回忆版|考生回忆版/g, '').replace('笔试题', '笔试');
  t = t.replace('《行测》', '').replace('《行政职业能力测验》', '').replace(/公务员录用考试|公务员考试/g, '');
  t = t.replace(/(试题|题|试卷)(?=（|$)/g, '').replace(/（\s*）/g, '').trim();
  const i = t.indexOf('（'), head = i < 0 ? t : t.slice(0, i), tail = i < 0 ? '' : t.slice(i);
  return (['考', '测', '联', '选', '卷'].some(k => head.includes(k)) ? head : head + (/[省市]$/.test(head) ? '考' : '省考')) + tail;
}

function parseFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const fm = {}; let i = 0;
  if (lines[0] === '---') { for (i = 1; lines[i] !== '---'; i++) { const m = lines[i].match(/^(\S+?): "(.*)"$/); if (m) fm[m[1]] = m[2]; } i++; }
  const blocks = []; let cur = null, mode = 'body';
  for (; i < lines.length; i++) {
    const l = lines[i]; let m;
    if (/^#{2,3} 材料 \d+/.test(l)) { cur = { kind: 'mat', lines: [] }; blocks.push(cur); mode = 'body'; continue; }
    if ((m = l.match(/^#{2,3} 第 (\d+) 题　<sub>qid (\d+) · (.*?)<\/sub>/))) { cur = { kind: 'q', qid: +m[2], type: m[3], lines: [], ans: null }; blocks.push(cur); mode = 'body'; continue; }
    if (!cur) continue;
    if ((m = l.match(/^\*\*答案\*\*：(.*)$/)) && cur.kind === 'q') { cur.ans = m[1].trim(); mode = 'after'; continue; }
    if (l.startsWith('**官方解析**')) { mode = 'expl'; continue; }
    if (l.trim() === '---') continue;
    if (mode === 'body') cur.lines.push(l);
  }
  return { fm, blocks };
}

const papers = new Map();
for (const [mi, mod] of MODS.entries()) {
  for (const fn of fs.readdirSync(path.join(repo, mod)).sort()) {
    if (fn === 'README.md' || !fn.endsWith('.md')) continue;
    const { fm, blocks } = parseFile(path.join(repo, mod, fn));
    const t = fm['试卷'];
    if (!papers.has(t)) papers.set(t, { t, r: fm['地区'], y: +fm['年份'], mods: [] });
    papers.get(t).mods[mi] = blocks;
  }
}

fs.mkdirSync(path.join(site, 'data/p'), { recursive: true });
const index = { regions: [], papers: {} }, byTitle = {};
let qTotal = 0, noOpt = 0, multi = 0, matQs = 0;
for (const p of papers.values()) {
  const pid = id(p.t); byTitle[p.t] = pid;
  const qs = [], mats = [], mods = [];
  for (let mi = 0; mi < 6; mi++) {
    const blocks = p.mods[mi]; if (!blocks) continue;
    const start = qs.length;
    let mat = null, left = 0, prevQid = null;
    for (const b of blocks) {
      if (b.kind === 'mat') { mats.push(clean(marked.parse(b.lines.join('\n')))); mat = mats.length - 1; left = mi === 5 ? 1e9 : 5; prevQid = null; continue; }
      // 资料分析的材料管到下一份材料为止；其他模块原数据没标范围，按"最多5题、题号连续、不是逻辑填空"推断
      if (mat !== null && mi !== 5 && (left <= 0 || b.type === '逻辑填空' || (prevQid !== null && Math.abs(b.qid - prevQid) > 30))) mat = null;
      const opts = [], stem = [];
      for (const l of b.lines) { const m = l.match(/^- \*\*([A-H])\*\*\.\s?(.*)$/); if (m) opts.push([m[1], m[2].replace(/\s*✅/g, '').trim()]); else stem.push(l); }
      const trivial = opts.length && opts.every(([k, v]) => v === k);
      const a = /^[A-H]+$/.test(b.ans || '') ? b.ans : null;
      if (!opts.length) noOpt++;
      if (a && a.length > 1) multi++;
      if (mat !== null) matQs++;
      qs.push({ q: b.qid, m: mi, ty: b.type, s: clean(marked.parse(stem.join('\n'))),
        k: opts.map(o => o[0]).join(''), o: trivial ? null : opts.map(([, v]) => clean(marked.parseInline(v))),
        a, x: mat });
      if (mat !== null) { left--; prevQid = b.qid; }
    }
    if (qs.length > start) mods.push([mi, start, qs.length - start]);
  }
  qTotal += qs.length;
  const est = mods.reduce((s, [mi, , n]) => s + Math.max(5, Math.round(MIN_PER_Q[mi] * n / 5) * 5), 0);
  fs.writeFileSync(path.join(site, 'data/p', pid + '.json'), JSON.stringify({ id: pid, qs, mats }));
  index.papers[pid] = { t: p.t, n: nick(p.t.replace(/^\d{4}年(度)?/, '').trim()), r: p.r, y: p.y, mods, lim: est <= 125 ? 120 : Math.round(est / 5) * 5 };
}
const regions = [...new Set([...REGION_ORDER, ...[...papers.values()].map(p => p.r)])].filter(r => [...papers.values()].some(p => p.r === r));
index.regions = regions.map(r => ({ r, ps: Object.keys(index.papers).filter(k => index.papers[k].r === r).sort((a, b) => index.papers[b].y - index.papers[a].y || index.papers[a].t.localeCompare(index.papers[b].t)) }));
index.mn = MN;
fs.writeFileSync(path.join(site, 'data/index.json'), JSON.stringify(index));

// plans: titles → ids, module dir → module index
const plans = {};
for (const pl of JSON.parse(fs.readFileSync(plansJson, 'utf8'))) {
  const days = {};
  for (const [d, ts] of Object.entries(pl.days)) days[d] = ts.map(([t, m]) => [byTitle[t], MODS.indexOf(m)]);
  plans[pl.region] = { sup: pl.supplemented, days, mocks: pl.mocks.map(t => byTitle[t]) };
}
fs.writeFileSync(path.join(site, 'data/plans.json'), JSON.stringify(plans));

// 考情速览 as a sanitized HTML fragment
const st = fs.readFileSync(statsMd, 'utf8').replace(/^\[\[[^\]]*\]\]\s*$/m, '').replace(/\[\[[^\]|\\]*\\?\|([^\]]+)\]\]/g, '$1')
  .replace('以下数据由工具包对整套题库自动统计', '以下数据由 515 套真题自动统计').replace('## 一、题库有多少题', '## 一、一共多少题').replace(/^# .*$/m, '');
fs.writeFileSync(path.join(site, 'data/stats.html'), sanitize(marked.parse(st), { allowedTags: ['h2', 'h3', 'p', 'ul', 'li', 'strong', 'b', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'br'], allowedAttributes: {} }));

// images
let bytes = 0;
for (const rel of imgs) {
  const [d, f] = rel.split('/');
  const dst = path.join(site, 'img', d === '题目图' ? 't' : 'f', f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(repo, '90-图片', rel), dst);
  bytes += fs.statSync(dst).size;
}
console.log(JSON.stringify({ papers: papers.size, questions: qTotal, noOpt, multi, matQs, images: imgs.size, imgMB: Math.round(bytes / 1e6) }));
