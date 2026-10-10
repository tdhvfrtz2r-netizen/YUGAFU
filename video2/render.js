// node render.js shots t1 t2 ...   截取指定时间点
// node render.js events            导出音效事件表 events.json
// node render.js frames [fps] [workers]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
// PAGE=short/index.html SIZE=1080x1920 渲染竖版
const PAGE = process.env.PAGE || 'index.html';
const url = 'file://' + path.join(__dirname, PAGE) + '?render';
const [VW, VH] = (process.env.SIZE || '1920x1080').split('x').map(Number);
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.ready);
  return page;
}
(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2];
  if (mode === 'shots') {
    const page = await open(browser); const SH = process.env.SHOTS || 'shots'; fs.mkdirSync(SH, { recursive: true });
    for (const t of process.argv.slice(3)) {
      const tt = await page.evaluate(r => { const t = isNaN(+r) ? T(r) : +r; seek(t); return t; }, t);
      await page.screenshot({ path: `${SH}/${t}.jpg`, quality: 80, type: 'jpeg' });
      console.log(t, tt.toFixed(2));
    }
  } else if (mode === 'events') {
    const page = await open(browser);
    fs.writeFileSync(path.join(path.dirname(PAGE), 'events.json'), JSON.stringify(await page.evaluate(() => EVENTS), null, 1));
  } else {
    const fps = +(process.argv[3] || 30), W = +(process.argv[4] || 4);
    const total = await (await open(browser)).evaluate(() => TOTAL);
    const N = Math.ceil((+process.env.END || total) * fps); const dir = process.env.FRAMES || 'frames';
    fs.mkdirSync(dir, { recursive: true }); let done = 0;
    await Promise.all([...Array(W)].map(async (_, w) => {
      const page = await open(browser);
      const F0 = Math.floor((+process.env.START || 0) * fps);
      for (let f = F0 + w; f < N; f += W) {
        await page.evaluate(t => seek(t), f / fps);
        await page.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, quality: 93, type: 'jpeg' });
        if (++done % 500 === 0) console.log(`${done}/${N}`);
      }
    }));
  }
  await browser.close();
})();
