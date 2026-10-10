// 逐帧渲染：node render.js [fps] [workers]  或  node render.js shots t1 t2 ...
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const url = 'file://' + path.join(__dirname, 'index.html') + '?render';

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url);
  await page.evaluate(() => window.ready);
  await page.waitForTimeout(500);
  return page;
}

(async () => {
  const browser = await chromium.launch();
  if (process.argv[2] === 'shots') {
    const page = await open(browser);
    fs.mkdirSync('shots', { recursive: true });
    for (const t of process.argv.slice(3)) {
      await page.evaluate(t => seek(+t), t);
      await page.screenshot({ path: `shots/t${t}.jpg`, quality: 80, type: 'jpeg' });
    }
  } else {
    const fps = +(process.argv[2] || 30), W = +(process.argv[3] || 4);
    const total = await (await open(browser)).evaluate(() => TOTAL);
    const N = Math.round(total * fps);
    fs.mkdirSync('frames', { recursive: true });
    let done = 0;
    await Promise.all([...Array(W)].map(async (_, w) => {
      const page = await open(browser);
      for (let f = w; f < N; f += W) {
        await page.evaluate(t => seek(t), f / fps);
        await page.screenshot({ path: `frames/${String(f).padStart(5, '0')}.jpg`, quality: 92, type: 'jpeg' });
        if (++done % 300 === 0) console.log(`${done}/${N}`);
      }
    }));
  }
  await browser.close();
})();
