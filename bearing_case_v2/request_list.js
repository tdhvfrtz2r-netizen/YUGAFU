// 向双兴索要数据清单：一份数据 -> out/向双兴索要数据清单.pdf（A4 一页，发给双兴）+ .md（内部版，多一列“对应我方 PPT 页”）
// usage: node request_list.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ITEMS = [
  ['轴承型号（负荷侧 DE / 非负荷侧 NDE），游隙；有没有油嘴（开式还是 2Z/2RS 密封式）',
    '确认型号；是开式还是密封式（能不能补脂）', '铭牌/台账截图，或旧轴承端面照片', '第 13、15 页'],
  ['这套轴承运行了多久；上次加脂、上次换轴承的时间；规定的加脂周期、加脂量、油脂牌号',
    '判断加脂是否跟得上、是否长期缺油（头号嫌疑）', '加脂台账、检修记录', '第 13 页'],
  ['拆下的旧轴承是否留存；滚道、滚珠、保持架断口、轴颈、轴承室的照片（或实物）',
    '判断失效模式：润滑不良、振动冲击、偏载还是过热', '照片（尽量近景、带比例尺）或实物', '第 12 页'],
  ['故障前的巡检记录（轴承温度、声音）；这台是否在冲击脉冲 / 测振路线上，历史数值',
    '验证“监测盲区”推断；了解轴承实际温度', '巡检记录表、冲击脉冲/测振数据', '第 14 页'],
  ['跳闸前一段时间的电流记录（综保或 DCS 趋势）',
    '看跳闸前电流有没有征兆', '趋势截图或导出数据', '第 14 页'],
  ['皮带张力、两个皮带轮对中的检查结果；电机皮带轮直径',
    '核实嫌疑第 2 名“皮带不对中 / 振动”', '检查记录或现场测量值', '第 13 页'],
  ['停机时长、产量影响',
    '补齐故障报告的“影响量化”', '一句话即可', '第 6、19 页'],
  ['同型号、同工况电机的故障史',
    '判断是这一台的个案，还是这一类设备的共性问题', '近几年的故障记录', '第 13、18 页'],
];

const md = [
  '# 向双兴分公司索要数据清单', '',
  '关于 BL-1655C 负压风机电机 2023-01-03 负荷侧轴承保持架破损跳闸一案，我们在班组学习中做了进一步分析。原报告里缺下面几项数据，分析中只能先用推断或假设代替。',
  '每拿到一项，就能把一处“推断”变成“实证”。有哪项给哪项，没有的也请告知“无记录”——这本身也是有价值的信息。', '',
  '| 序号 | 需要的数据 | 用途（能核实什么） | 形式 | 对应我方 PPT（内部，发送时可删） |', '|---|---|---|---|---|',
  ...ITEMS.map((it, i) => `| ${i + 1} | ${it[0]} | ${it[1]} | ${it[2]} | ${it[3]} |`), '',
  '联系人：于家福（北方华锦 炼化电气部 本体电气班）　　电话：________　　日期：________', '',
];
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', '向双兴索要数据清单.md'), md.join('\n'), 'utf-8');

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>向双兴索要数据清单</title><style>
@page { size: A4; margin: 16mm 14mm; }
body { font-family: "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif; color: #1C2733; font-size: 10.5pt; line-height: 1.55; }
h1 { font-size: 17pt; color: #0E2240; margin: 0 0 4mm; }
p { margin: 0 0 2.5mm; }
table { width: 100%; border-collapse: collapse; margin-top: 4mm; }
th { background: #0E2240; color: #fff; font-weight: 700; text-align: left; padding: 2.2mm 2mm; font-size: 10pt; }
td { border-bottom: 1px solid #D5DEE9; padding: 2.4mm 2mm; vertical-align: top; }
tr:nth-child(even) td { background: #F2F5F9; }
td.n { width: 7mm; text-align: center; font-weight: 700; color: #E8772E; }
td.d { width: 42%; font-weight: 700; }
td.u { width: 34%; }
td.f { width: 20%; color: #5B6B7C; }
td.p { width: 9%; color: #1D5FAE; white-space: nowrap; }
.foot { margin-top: 7mm; color: #5B6B7C; }
.tag { display: inline-block; padding: 0 2mm; border-radius: 2mm; background: #FCEBDD; color: #E8772E; font-weight: 700; }
</style></head><body>
<h1>向双兴分公司索要数据清单</h1>
<p>关于 <b>BL-1655C 负压风机电机</b> 2023 年 1 月 3 日负荷侧轴承保持架破损、过流跳闸一案，我们在班组学习中做了进一步分析。原报告里缺下面几项数据，分析中只能先用<span class="tag">推断</span>或<span class="tag">假设</span>代替。</p>
<p>每拿到一项，就能把一处“推断”变成“实证”。有哪项给哪项；没有的也请告知“无记录”——这本身也是有价值的信息。</p>
<table><tr><th>#</th><th>需要的数据</th><th>用途（能核实什么）</th><th>形式</th></tr>
${ITEMS.map((it, i) => `<tr><td class="n">${i + 1}</td><td class="d">${esc(it[0])}</td><td class="u">${esc(it[1])}</td><td class="f">${esc(it[2])}</td></tr>`).join('\n')}
</table>
<p class="foot">联系人：于家福（北方华锦 炼化电气部 本体电气班）　　电话：____________　　日期：____________</p>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: path.join(__dirname, 'out', '向双兴索要数据清单.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('wrote out/向双兴索要数据清单.md + .pdf');
})();
