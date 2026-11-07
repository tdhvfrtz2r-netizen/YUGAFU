// Printable handouts: out/巡检口袋卡.pdf (A4, two identical A5 cards to cut apart) and out/点击说明.pdf (from out/点击说明.md)
// usage: node handouts.js   (run after clickguide.py)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FONT = '"Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif';

// ---------------- pocket card ----------------
const CARD = [
  ['一看', ['油脂外溢、发黑', '散热筋积灰结块', '皮带裂纹、打滑发亮', '地脚松动、底座裂纹']],
  ['二听', ['听音棒贴轴承盖', '均匀“沙沙”声正常', '“咯噔”“嘎吱”、周期性撞击 → 报']],
  ['三测', ['测温枪打轴承盖，每次同一点', '和上次比、和同类比，突然升高 → 报', '冲击脉冲 / 振动按路线测，记入档案表']],
  ['四看趋势', ['单次数值意义有限，连成趋势才有用', '电流只作后期佐证：明显上升已接近卡死']],
  ['皮带', ['张力计（或按压中点）查松紧', '直尺靠两轮端面查对中']],
  ['加脂', ['按台账：哪台、什么脂、多少、多久、谁加', '高速电机少量多次，不加满，加完盯温度']],
  ['盲区设备', ['看不到、够不着 → 不要走过场，报班长', '测点、注油管引到机箱外']],
  ['发现异常', ['先报告、拍照、记录，不等跳闸', '拆下的轴承先拍、先留、贴标签']],
];
const card = `<section class="card">
  <header><div class="t">皮带传动电机 · 巡检口袋卡</div><div class="s">2 极高速 · 皮带传动 · 封闭 / 粉尘环境 重点盯</div></header>
  <div class="grid">${CARD.map(([h, items], i) => `<div class="cell ${i < 4 ? 'a' : 'b'}"><h3>${esc(h)}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
  <footer>本体电气班 · 源自双兴 BL-1655C 轴承保持架破损跳闸案例：跳闸之前就发现它</footer>
</section>`;
const cardHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: ${FONT}; color: #1C2733; }
.card { width: 210mm; height: 148.4mm; overflow: hidden; padding: 8mm 10mm 6mm; display: flex; flex-direction: column; }
.card + .card { border-top: 0.4mm dashed #8FB3E0; }
header { display: flex; align-items: baseline; gap: 5mm; border-bottom: 0.8mm solid #0E2240; padding-bottom: 2mm; }
header .t { font-size: 17pt; font-weight: 700; color: #0E2240; }
header .s { font-size: 9.5pt; color: #E8772E; font-weight: 700; }
.grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr 1fr; gap: 3mm; margin-top: 3.5mm; }
.cell { border-radius: 2mm; padding: 2.5mm 3mm; }
.cell.a { background: #EEF3FA; } .cell.b { background: #FCF1E8; }
.cell h3 { margin: 0 0 1.2mm; font-size: 13pt; color: #1D5FAE; }
.cell.b h3 { color: #E8772E; }
ul { margin: 0; padding-left: 4.5mm; font-size: 10.5pt; line-height: 1.45; }
footer { margin-top: 2.5mm; font-size: 8.5pt; color: #5B6B7C; }
</style></head><body>${card}${card}</body></html>`;

// ---------------- click guide (from the generated markdown) ----------------
const md = fs.readFileSync(path.join(OUT, '点击说明.md'), 'utf-8').split('\n');
const intro = md.find((l) => l.startsWith('共 '));
const rows = md.filter((l) => /^\| \d+ \|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const tail = md.filter((l) => l.startsWith('**') || l.startsWith('视频备份')).map((l) => l.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '$1'));
const guideHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
@page { size: A4 landscape; margin: 10mm 12mm; }
body { font-family: ${FONT}; color: #1C2733; font-size: 9.5pt; }
h1 { font-size: 15pt; color: #0E2240; margin: 0 0 2mm; }
p { margin: 1mm 0; }
table { width: 100%; border-collapse: collapse; margin: 2.5mm 0; }
th { background: #0E2240; color: #fff; text-align: left; padding: 1.6mm 2mm; }
td { padding: 1.3mm 2mm; border-bottom: 1px solid #D5DEE9; vertical-align: top; }
tr:nth-child(even) td { background: #F2F5F9; }
td:nth-child(1), td:nth-child(4) { text-align: center; font-weight: 700; color: #E8772E; width: 9mm; }
td:nth-child(2) { width: 33%; font-weight: 700; }
td:nth-child(3) { width: 15mm; color: #5B6B7C; }
td:nth-child(6) { width: 13mm; color: #5B6B7C; white-space: nowrap; }
</style></head><body><h1>点击说明（每页点几下）</h1><p>${esc(intro)}</p>
<table><tr><th>页</th><th>标题</th><th>换页后</th><th>点击</th><th>每次点击出现什么</th><th>用时</th></tr>
${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</table>
${tail.map((t) => `<p>${t}</p>`).join('')}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [html, file] of [[cardHtml, '巡检口袋卡.pdf'], [guideHtml, '点击说明.pdf']]) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: path.join(OUT, file), printBackground: true, preferCSSPageSize: true });
    console.log('wrote out/' + file);
  }
  await browser.close();
})();
