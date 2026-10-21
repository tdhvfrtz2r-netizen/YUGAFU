// Build one phone-friendly PDF per paper: questions + options, answer key at the end.
// The question bank's 官方解析 sections are dropped.
// Usage: node build_pdfs.js <repo> <outDir> <fontsDir> <index.json> [onlyRegex]
const fs = require('fs'), path = require('path');
const [repo, outDir, fontsDir, indexOut, only] = process.argv.slice(2);
const { marked } = require(path.join(fontsDir, 'node_modules/marked'));
const { chromium } = require('playwright');

const MODS = ['01-政治理论', '02-常识判断', '03-言语理解与表达', '04-数量关系', '05-判断推理', '06-资料分析'];
const MOD_NAME = { '01-政治理论': '政治理论', '02-常识判断': '常识判断', '03-言语理解与表达': '言语理解与表达', '04-数量关系': '数量关系', '05-判断推理': '判断推理', '06-资料分析': '资料分析' };
const MIN_PER_Q = { '01-政治理论': 0.5, '02-常识判断': 0.5, '03-言语理解与表达': 0.875, '04-数量关系': 1.0, '05-判断推理': 0.875, '06-资料分析': 1.25 };
const REGION_ORDER = ['国考', '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '深圳市考', '广州市考', '选调'];
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const IMG_BASE = 'file://' + path.resolve(repo) + '/';

function nick(short) {
  let t = short.replace('国家公务员录用考试', '国考').replace(/网友回忆版|考生回忆版/g, '').replace('笔试题', '笔试');
  t = t.replace('《行测》', '').replace('《行政职业能力测验》', '').replace(/公务员录用考试|公务员考试/g, '');
  t = t.replace(/(试题|题|试卷)(?=（|$)/g, '').replace(/（\s*）/g, '').trim();
  const i = t.indexOf('（'), head = i < 0 ? t : t.slice(0, i), tail = i < 0 ? '' : t.slice(i);
  const h = ['考', '测', '联', '选', '卷'].some(k => head.includes(k)) ? head : head + (/[省市]$/.test(head) ? '考' : '省考');
  return (h + tail).replace(/[\/\\:*?"<>|]/g, '-');
}

function clean(html) {
  return html
    .replace(/<(script|style|iframe|object)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(link|embed|meta|base)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/src="\.\.\/(90-图片\/[^"]+)"/g, (_, p) => `src="${IMG_BASE}${p}"`);
}

function parseFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const fm = {};
  let i = 0;
  if (lines[0] === '---') {
    for (i = 1; lines[i] !== '---'; i++) { const m = lines[i].match(/^(\S+?): "(.*)"$/); if (m) fm[m[1]] = m[2]; }
    i++;
  }
  const blocks = []; let cur = null, mode = 'body';
  for (; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if (/^#{2,3} 材料 \d+/.test(l)) { cur = { kind: 'mat', lines: [] }; blocks.push(cur); mode = 'body'; continue; }
    if ((m = l.match(/^#{2,3} 第 (\d+) 题/))) { cur = { kind: 'q', lines: [], ans: null }; blocks.push(cur); mode = 'body'; continue; }
    if (!cur) continue;
    if ((m = l.match(/^\*\*答案\*\*：(.*)$/)) && cur.kind === 'q') { cur.ans = m[1].trim(); mode = 'after'; continue; }
    if (l.startsWith('**官方解析**')) { mode = 'expl'; continue; }
    if (l.trim() === '---') continue;
    if (mode === 'body') cur.lines.push(l);
  }
  return { fm, blocks };
}

function renderQuestion(q, no) {
  const opts = [], stem = [];
  for (const l of q.lines) {
    const m = l.match(/^- \*\*([A-H])\*\*\.\s?(.*)$/);
    if (m) opts.push([m[1], m[2].replace(/\s*✅/g, '').trim()]);
    else stem.push(l);
  }
  const stemHtml = clean(marked.parse(stem.join('\n').replace(/✅/g, '').trim()));
  let optHtml = '';
  const trivial = opts.length && opts.every(([k, v]) => v === k);   // 选项在图里
  if (opts.length && !trivial) {
    const inl = opts.map(([k, v]) => [k, clean(marked.parseInline(v))]);
    const plainLen = Math.max(...opts.map(([, v]) => v.replace(/<[^>]+>/g, '').length));
    const hasImg = opts.some(([, v]) => /<img/i.test(v));
    const cls = hasImg ? 'opts' : plainLen <= 7 ? 'opts g4' : plainLen <= 16 ? 'opts g2' : 'opts';
    optHtml = `<div class="${cls}">${inl.map(([k, v]) => `<div class="opt"><b>${k}.</b> <span>${v}</span></div>`).join('')}</div>`;
  }
  return `<div class="q"><div class="qn">${no}.</div><div class="qb">${stemHtml}${optHtml}</div></div>`;
}

const minutes = (mod, n) => Math.max(5, Math.round(MIN_PER_Q[mod] * n / 5) * 5);
const fontCss = w => `file://${fontsDir}/node_modules/@fontsource/noto-sans-sc/${w}.css`;

const CSS = `
@page { size: 125mm 222mm; margin: 9mm 8mm 11mm; }
* { box-sizing: border-box; }
body { font-family: 'Noto Sans SC', sans-serif; font-size: 10.5pt; line-height: 1.7; color: #1b1b1f; margin: 0; }
p { margin: 0 0 1.2mm; }
img { max-width: 100%; height: auto; }
img[flag="tex"] { vertical-align: middle; max-width: none; }
.cover { border-bottom: 2px solid #1b1b1f; padding-bottom: 3mm; margin-bottom: 4mm; }
.cover .y { display: inline-block; background: #e4572e; color: #fff; font-weight: 700; font-size: 9pt; padding: 0.3mm 2.5mm; border-radius: 1.5mm; }
.cover h1 { font-size: 17pt; font-weight: 900; margin: 2mm 0 1mm; line-height: 1.3; }
.cover .full { font-size: 9pt; color: #555; }
.cover .meta { font-size: 9pt; color: #555; margin-top: 1.5mm; }
.cover .meta b { color: #1b1b1f; }
h2 { font-size: 12.5pt; font-weight: 900; margin: 6mm 0 2.5mm; padding: 1.2mm 2.5mm; background: #f3eee6; border-left: 3px solid #e4572e; break-after: avoid; }
h2 small { font-weight: 500; font-size: 9pt; color: #666; margin-left: 1.5mm; }
.mat { margin: 3mm 0 2mm; padding: 2.5mm 3mm; border: 1px solid #e3dccf; border-radius: 1.5mm; background: #fcfaf6; }
.mat .mh { font-weight: 700; font-size: 9.5pt; color: #e4572e; margin-bottom: 1mm; }
.q { display: flex; gap: 1.5mm; margin: 0 0 3.2mm; }
.qn { flex: none; font-weight: 700; min-width: 7mm; }
.qb { flex: 1; min-width: 0; }
.opts { margin-top: 1mm; }
.opts.g4 { display: grid; grid-template-columns: repeat(4, 1fr); column-gap: 2mm; }
.opts.g2 { display: grid; grid-template-columns: repeat(2, 1fr); column-gap: 3mm; }
.opt b { font-weight: 700; }
.opt p { display: inline; }
.key { break-before: page; }
.key h2 { margin-top: 0; }
.kgrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.8mm 2mm; font-size: 10pt; margin-bottom: 3mm; }
.kgrid span { white-space: nowrap; }
.kgrid b { color: #e4572e; }
.kpart { font-weight: 700; font-size: 9.5pt; margin: 2.5mm 0 1mm; color: #555; }
.end { margin-top: 5mm; font-size: 8pt; color: #999; }
`;

function buildPaper(p) {
  let no = 0, part = 0;
  const sections = [], key = [];
  for (const mod of MODS) {
    const f = p.mods[mod];
    if (!f) continue;
    const qs = f.blocks.filter(b => b.kind === 'q');
    if (!qs.length) continue;
    const start = no + 1, end = no + qs.length;
    p.ranges[mod] = [start, end];
    let html = '';
    for (let bi = 0; bi < f.blocks.length; bi++) {
      const b = f.blocks[bi];
      if (b.kind === 'mat') {
        let k = 0; for (let j = bi + 1; j < f.blocks.length && f.blocks[j].kind === 'q'; j++) k++;
        const body = clean(marked.parse(b.lines.join('\n').trim()));
        // 只有资料分析的材料和小题是一一对应的；其他模块原数据分不清材料管到哪道题，不写题号范围
        const mh = mod === '06-资料分析' ? `根据以下资料，回答 ${no + 1}–${no + k} 题` : '阅读以下材料，回答后面的相关题目';
        html += `<div class="mat"><div class="mh">${mh}</div>${body}</div>`;
      } else {
        no++;
        html += renderQuestion(b, no);
        key.push([no, b.ans || '—', mod]);
      }
    }
    sections.push(`<h2>第${CN[part]}部分　${MOD_NAME[mod]}<small>第 ${start}–${end} 题 · 约 ${minutes(mod, qs.length)} 分钟</small></h2>${html}`);
    part++;
  }
  const keyHtml = Object.keys(p.ranges).map(mod => {
    const items = key.filter(k => k[2] === mod).map(([n, a]) => `<span>${n}. <b>${a}</b></span>`).join('');
    return `<div class="kpart">${MOD_NAME[mod]}</div><div class="kgrid">${items}</div>`;
  }).join('');
  const est = Object.entries(p.ranges).reduce((s, [m, [a, b]]) => s + minutes(m, b - a + 1), 0);
  const lim = est <= 125 ? 120 : Math.round(est / 5) * 5;
  p.total = no;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${p.year} ${p.nick}</title>
${[400, 700, 900].map(w => `<link rel="stylesheet" href="${fontCss(w)}">`).join('')}
<style>${CSS}</style></head><body>
<div class="cover"><span class="y">${p.region} · ${p.year}</span><h1>${p.year} ${p.nick}</h1>
<div class="full">${p.title}</div>
<div class="meta">共 <b>${no}</b> 题 · 建议限时 <b>${lim}</b> 分钟 · 参考答案在最后一页</div></div>
${sections.join('\n')}
<div class="key"><h2>参考答案</h2>${keyHtml}<div class="end">网友回忆版真题，个别题目可能不完整。</div></div>
</body></html>`;
}

(async () => {
  // gather papers
  const papers = new Map();
  for (const mod of MODS) {
    for (const fn of fs.readdirSync(path.join(repo, mod)).sort()) {
      if (fn === 'README.md' || !fn.endsWith('.md')) continue;
      const { fm, blocks } = parseFile(path.join(repo, mod, fn));
      const title = fm['试卷'];
      if (!papers.has(title)) papers.set(title, { title, region: fm['地区'], year: +fm['年份'], mods: {}, ranges: {} });
      papers.get(title).mods[mod] = { file: fn.slice(0, -3), blocks, count: +fm['题数'] };
    }
  }
  const list = [...papers.values()];
  for (const p of list) {
    p.short = p.title.replace(/^\d{4}年(度)?/, '').trim();
    p.nick = nick(p.short);
    const ri = REGION_ORDER.indexOf(p.region);
    p.dir = `${String((ri < 0 ? 90 : ri) + 1).padStart(2, '0')} ${p.region}`;
  }
  // unique file names per folder
  const seen = new Map();
  for (const p of list.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))) {
    let base = `${p.year} ${p.nick}`, name = base, k = 2;
    while (seen.has(p.dir + '/' + name)) name = `${base}（${k++}）`;
    seen.set(p.dir + '/' + name, 1);
    p.file = name + '.pdf';
  }
  const todo = list.filter(p => !only || new RegExp(only).test(p.title));
  const tmp = path.join(outDir, '.tmp'); fs.mkdirSync(tmp, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  let done = 0, mismatch = [];
  const work = todo.slice();
  async function worker(id) {
    const page = await ctx.newPage();
    while (work.length) {
      const p = work.shift();
      const html = buildPaper(p);
      const expect = Object.values(p.mods).reduce((s, m) => s + m.count, 0);
      if (p.total !== expect) mismatch.push(`${p.title}: ${p.total}/${expect}`);
      if (/✅|官方解析/.test(html)) mismatch.push(`${p.title}: answer marker leaked`);
      const hf = path.join(tmp, `w${id}.html`);
      fs.writeFileSync(hf, html);
      await page.goto('file://' + hf, { waitUntil: 'load', timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      const out = path.join(outDir, p.dir, p.file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await page.pdf({ path: out, width: '125mm', height: '222mm', printBackground: true, outline: true, preferCSSPageSize: true,
        displayHeaderFooter: true, headerTemplate: '<span></span>',
        footerTemplate: '<div style="width:100%;text-align:center;font-size:7px;color:#aaa;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
      if (++done % 25 === 0) console.log(`${done}/${todo.length}`);
    }
  }
  await Promise.all([0, 1, 2, 3].map(worker));
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(indexOut, JSON.stringify(list.map(p => ({ title: p.title, region: p.region, year: p.year, nick: p.nick, path: `${p.dir}/${p.file}`, ranges: p.ranges, total: p.total })), null, 0));
  console.log('done', done, 'mismatch', mismatch.length);
  mismatch.slice(0, 20).forEach(m => console.log('  ', m));
})();
