// node render.js shots t1 t2 ...        截取指定时间点到 shots/（时间可写成 b12.5 表示第 12.5 小节）
// node render.js events                 导出音效事件表 events.json
// node render.js frames [fps] [workers]  逐帧输出到 $FRAMES（默认 frames/），START/END 限定区间
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const url = 'file://' + path.join(__dirname, 'index.html') + '?render';
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'];
const tv = s => s[0] === 'b' ? +s.slice(1) * 2.4 : +s;
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error' && !/mix\.m4a|ERR_FILE/.test(m.text())) console.error('CONSOLE', m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  await page.evaluate(() => window.ready);
  return page;
}
(async () => {
  const browser = await chromium.launch({ args: ARGS });
  const mode = process.argv[2];
  if (mode === 'shots') {
    const page = await open(browser); const SH = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(SH, { recursive: true });
    for (const s of process.argv.slice(3)) {
      await page.evaluate(t => seek(t), tv(s));
      await page.screenshot({ path: `${SH}/${s}.jpg`, quality: 85, type: 'jpeg' });
    }
  } else if (mode === 'events') {
    const page = await open(browser);
    fs.writeFileSync(path.join(__dirname, 'events.json'), JSON.stringify(await page.evaluate(() => ({ total: TOTAL, events: EVENTS })), null, 1));
  } else {
    const fps = +(process.argv[3] || 30), W = +(process.argv[4] || 2);
    const total = await (await open(browser)).evaluate(() => TOTAL);
    const N = Math.ceil((+process.env.END || total) * fps); const dir = process.env.FRAMES || 'frames';
    const F0 = Math.floor((+process.env.START || 0) * fps);
    fs.mkdirSync(dir, { recursive: true }); let done = 0; const t0 = Date.now();
    await Promise.all([...Array(W)].map(async (_, w) => {
      const page = await open(browser);
      for (let f = F0 + w; f < N; f += W) {
        await page.evaluate(t => seek(t), f / fps);
        await page.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, quality: 93, type: 'jpeg' });
        if (++done % 200 === 0) console.log(`${done}/${N - F0}  ${((Date.now() - t0) / done).toFixed(0)}ms/frame`);
      }
    }));
  }
  await browser.close();
})();
