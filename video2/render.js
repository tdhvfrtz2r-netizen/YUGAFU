// node render.js shots t1 t2 ...   截取指定时间点
// node render.js events            导出音效事件表 events.json
// node render.js frames [fps] [workers]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const url = 'file://' + path.join(__dirname, 'index.html') + '?render';
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
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
    const page = await open(browser); fs.mkdirSync('shots', { recursive: true });
    for (const t of process.argv.slice(3)) {
      const tt = await page.evaluate(r => { const t = isNaN(+r) ? T(r) : +r; seek(t); return t; }, t);
      await page.screenshot({ path: `shots/${t}.jpg`, quality: 80, type: 'jpeg' });
      console.log(t, tt.toFixed(2));
    }
  } else if (mode === 'events') {
    const page = await open(browser);
    fs.writeFileSync('events.json', JSON.stringify(await page.evaluate(() => EVENTS), null, 1));
  } else {
    const fps = +(process.argv[3] || 30), W = +(process.argv[4] || 4);
    const total = await (await open(browser)).evaluate(() => TOTAL);
    const N = Math.ceil(total * fps); const dir = process.env.FRAMES || 'frames';
    fs.mkdirSync(dir, { recursive: true }); let done = 0;
    await Promise.all([...Array(W)].map(async (_, w) => {
      const page = await open(browser);
      for (let f = w; f < N; f += W) {
        await page.evaluate(t => seek(t), f / fps);
        await page.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, quality: 93, type: 'jpeg' });
        if (++done % 500 === 0) console.log(`${done}/${N}`);
      }
    }));
  }
  await browser.close();
})();
