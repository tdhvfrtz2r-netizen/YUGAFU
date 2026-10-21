// Render the phone-size companion PDFs: 使用说明, 十年考情速览, and one 30-day plan per region.
// Usage: node docs_pdf.js <使用说明.md> <考情速览.md> <plans.json> <pdf_index.json> <bundleDir> <fontsDir>
const fs = require('fs'), path = require('path');
const [guideMd, statsMd, plansJson, indexJson, bundle, fontsDir] = process.argv.slice(2);
const { marked } = require(path.join(fontsDir, 'node_modules/marked'));
const { chromium } = require('playwright');

const SHORT = { '01-政治理论': '政治理论', '02-常识判断': '常识判断', '03-言语理解与表达': '言语理解', '04-数量关系': '数量关系', '05-判断推理': '判断推理', '06-资料分析': '资料分析' };
const MIN_PER_Q = { '01-政治理论': 0.5, '02-常识判断': 0.5, '03-言语理解与表达': 0.875, '04-数量关系': 1.0, '05-判断推理': 0.875, '06-资料分析': 1.25 };
const minutes = (mod, n) => Math.max(5, Math.round(MIN_PER_Q[mod] * n / 5) * 5);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fontCss = w => `file://${fontsDir}/node_modules/@fontsource/noto-sans-sc/${w}.css`;

const CSS = `
@page { size: 125mm 222mm; margin: 9mm 8mm 11mm; }
body { font-family: 'Noto Sans SC', sans-serif; font-size: 10.5pt; line-height: 1.7; color: #1b1b1f; margin: 0; }
h1 { font-size: 18pt; font-weight: 900; margin: 0 0 2mm; line-height: 1.3; }
h1 + p strong { color: #e4572e; }
h2 { font-size: 13pt; font-weight: 900; margin: 6mm 0 2mm; padding-left: 2.5mm; border-left: 3px solid #e4572e; break-after: avoid; }
h3 { font-size: 11pt; font-weight: 900; margin: 4.5mm 0 1.5mm; break-after: avoid; }
p { margin: 1mm 0 2mm; }
ul, ol { padding-left: 5mm; margin: 1mm 0 2mm; } li { margin: 0.6mm 0; }
blockquote { margin: 2mm 0; padding: 2mm 3mm; background: #fdf1ec; border-radius: 1.5mm; color: #5a3a2e; font-size: 9.5pt; }
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 2mm 0 3mm; break-inside: avoid; }
th, td { border-bottom: 1px solid #e6ddcd; padding: 1mm 1.2mm; text-align: left; vertical-align: top; }
th { background: #f3eee6; font-weight: 700; }
code { background: #f3eee6; padding: 0 1mm; border-radius: 1mm; font-size: 9pt; font-family: inherit; }
pre { background: #f3eee6; padding: 2.5mm 3mm; border-radius: 1.5mm; line-height: 1.5; font-size: 8.5pt; white-space: pre-wrap; break-inside: avoid; }
pre code { padding: 0; background: none; }
strong { font-weight: 700; }
.day { break-inside: avoid; margin: 0 0 3.5mm; padding: 2.5mm 3mm; border: 1px solid #e6ddcd; border-radius: 1.8mm; }
.day.rest { background: #f7f4ee; }
.day.mock { border-color: #f1b9a5; background: #fff7f3; }
.dh { font-weight: 900; font-size: 10.5pt; display: flex; justify-content: space-between; gap: 2mm; }
.dh span { font-weight: 500; color: #777; font-size: 9pt; white-space: nowrap; }
.t { display: flex; gap: 2mm; margin-top: 1.6mm; }
.t i { flex: none; width: 3.4mm; height: 3.4mm; border: 1.3px solid #9a917f; border-radius: 0.8mm; margin-top: 1.1mm; }
.t b { font-weight: 700; }
.t .s { display: block; font-size: 8.5pt; color: #777; line-height: 1.5; }
.phase { font-size: 12pt; font-weight: 900; margin: 5mm 0 2.5mm; color: #e4572e; }
`;

const page = (title, body) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(title)}</title>
${[400, 500, 700, 900].map(w => `<link rel="stylesheet" href="${fontCss(w)}">`).join('')}<style>${CSS}</style></head><body>${body}</body></html>`;

function planHtml(plan, idx) {
  const P = t => idx.get(t);
  const task = (title, mod) => {
    const p = P(title), [a, b] = p.ranges[mod], n = b - a + 1;
    return `<div class="t"><i></i><div><b>${esc(p.year + ' ' + p.nick)}</b>　第 ${a}–${b} 题
      <span class="s">${SHORT[mod]} · ${n} 题 · 限时 ${minutes(mod, n)} 分钟 ｜ ${esc(p.path)}</span></div></div>`;
  };
  const check = txt => `<div class="t"><i></i><div>${txt}</div></div>`;
  let h = `<h1>${esc(plan.region)} · 30 天刷题计划</h1>
<blockquote><p><b>怎么用</b>：每天做完当天的任务就算完成。第 1–24 天按模块专项练，从老卷刷到新卷；第 7、14、21 天复盘；最后 6 天用最新的整卷限时模考。每项后面写了打开哪个 PDF、做第几题。</p></blockquote>`;
  if (plan.supplemented) h += `<blockquote><p>${esc(plan.region)}收录的卷不多，计划里用国考卷补齐，国考和省考题型基本一致。</p></blockquote>`;
  h += `<div class="phase">第一阶段 · 专项打基础（第 1–24 天）</div>`;
  for (let d = 1; d <= 24; d++) {
    if ([7, 14, 21].includes(d)) {
      h += `<div class="day rest"><div class="dh">第 ${d} 天 · 复盘日</div>${check('把这周的错题全部重做一遍，还错的标出来')}${check('数一数哪个模块错得最多，明天先刷它')}${check('休息一下，别连续熬')}</div>`;
      continue;
    }
    const tasks = plan.days[String(d)] || [];
    const tot = tasks.reduce((s, [t, m]) => { const [a, b] = P(t).ranges[m]; return s + minutes(m, b - a + 1); }, 0);
    h += `<div class="day"><div class="dh">第 ${d} 天 · ${tasks.map(([, m]) => SHORT[m]).join(' + ')}<span>约 ${tot} 分钟</span></div>
      ${tasks.map(([t, m]) => task(t, m)).join('')}${check('翻到最后一页对答案，错题记下来')}</div>`;
  }
  h += `<div class="phase">第二阶段 · 整卷模考（第 25–30 天）</div>
<blockquote><p>整卷按 政治理论 → 常识 → 言语 → 判断 → 资料 → 数量 的顺序做，数量放最后，没时间就蒙。严格限时，答案写在白纸上，做完再对。</p></blockquote>`;
  const mockDays = [25, 26, 28, 29];
  for (let d = 25; d <= 30; d++) {
    if (d === 27 || d === 30) {
      h += `<div class="day rest"><div class="dh">第 ${d} 天 · 模考复盘</div>${check('把前两套模考的错题全部重新做一遍，查清楚思路')}${check('对比两套的各模块正确率，找出最拖分的模块')}`
        + (d === 30 ? check('把整个错题本从头翻一遍') + check('考前确认：准考证、身份证、2B 铅笔、橡皮、普通手表') : '') + `</div>`;
      continue;
    }
    const title = plan.mocks[mockDays.indexOf(d)];
    if (!title) { h += `<div class="day mock"><div class="dh">第 ${d} 天 · 自选整卷</div>${check(`从「${esc(plan.region)}」文件夹里挑一套没做过的整卷，限时做完`)}</div>`; continue; }
    const p = P(title);
    const est = Object.entries(p.ranges).reduce((s, [m, [a, b]]) => s + minutes(m, b - a + 1), 0);
    const lim = est <= 125 ? 120 : Math.round(est / 5) * 5;
    h += `<div class="day mock"><div class="dh">第 ${d} 天 · 整卷模考<span>限时 ${lim} 分钟</span></div>
      ${check(`<b>${esc(p.year + ' ' + p.nick)}</b>　全卷 ${p.total} 题<span class="s">${esc(p.path)} ｜ 从第 1 题做到最后</span>`)}
      ${check('对答案，算出总正确率和各模块正确率，错题记下来')}</div>`;
  }
  return page(`${plan.region} 30天计划`, h);
}

(async () => {
  const idx = new Map(JSON.parse(fs.readFileSync(indexJson, 'utf8')).map(p => [p.title, p]));
  const plans = JSON.parse(fs.readFileSync(plansJson, 'utf8'));
  let stats = fs.readFileSync(statsMd, 'utf8')
    .replace(/^\[\[[^\]]*\]\]\s*$/m, '')                              // 回首页链接
    .replace(/\[\[[^\]|\\]*\\?\|([^\]]+)\]\]/g, '$1')                   // wikilink → 文字
    .replace('以下数据由工具包对整套题库自动统计', '以下数据由本真题包的 515 套卷自动统计')
    .replace('## 一、题库有多少题', '## 一、一共多少题')
    .replace(/^## 二、/m, '<div style="break-before:page"></div>\n\n## 二、');
  const docs = [
    ['00 先看我：使用说明.pdf', page('使用说明', marked.parse(fs.readFileSync(guideMd, 'utf8')))],
    ['00 十年考情速览.pdf', page('十年考情速览', marked.parse(stats))],
    ...plans.map(p => [`00 30天刷题计划/${p.region} 30天计划.pdf`, planHtml(p, idx)]),
  ];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const pg = await ctx.newPage();
  const tmp = path.join(bundle, '.doc.html');
  for (const [name, html] of docs) {
    fs.writeFileSync(tmp, html);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const out = path.join(bundle, name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await pg.pdf({ path: out, width: '125mm', height: '222mm', printBackground: true, outline: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:7px;color:#aaa;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  }
  fs.rmSync(tmp);
  await browser.close();
  console.log('docs', docs.length);
})();
