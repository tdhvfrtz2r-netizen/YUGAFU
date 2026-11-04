// 用法：node scripts/stills.js 帧号 [帧号 ...]
// 打包一次、开一个浏览器，渲染多张截图到 shots/f<帧号>.jpg，再拼一张总览 shots/sheet.jpg
const path = require('path');
const {execSync} = require('child_process');
const {bundle} = require('@remotion/bundler');
const {renderStill, selectComposition, openBrowser} = require('@remotion/renderer');
const EXE = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
(async () => {
  execSync('node scripts/glyphs.js');
  const frames = process.argv.slice(2).map(Number);
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
  const browser = await openBrowser('chrome', {browserExecutable: EXE, chromiumOptions: {gl: 'swangle'}});
  const composition = await selectComposition({serveUrl, id: 'Main', puppeteerInstance: browser, browserExecutable: EXE});
  const outs = [];
  for (const frame of frames) {
    const output = path.resolve(`shots/f${frame}.jpg`);
    const t = Date.now();
    await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 88, puppeteerInstance: browser, browserExecutable: EXE});
    console.log(frame, (Date.now() - t) + 'ms');
    outs.push(output);
  }
  await browser.close({silent: true});
  if (outs.length > 1) {
    const cols = outs.length <= 4 ? 2 : 3;
    const inputs = outs.map((o) => `-i ${o}`).join(' ');
    const n = outs.length;
    const rows = Math.ceil(n / cols);
    const pads = cols * rows - n;
    let fc = outs.map((_, i) => `[${i}:v]scale=960:540[v${i}]`).join(';');
    for (let i = 0; i < pads; i++) fc += `;color=black:s=960x540:d=1[p${i}]`;
    const all = [...outs.map((_, i) => `[v${i}]`), ...Array.from({length: pads}, (_, i) => `[p${i}]`)];
    const layout = all.map((_, i) => `${(i % cols) * 960}_${Math.floor(i / cols) * 540}`).join('|');
    fc += `;${all.join('')}xstack=inputs=${all.length}:layout=${layout}[out]`;
    execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${fc}" -map "[out]" -frames:v 1 -q:v 3 shots/sheet.jpg`);
    console.log('sheet: shots/sheet.jpg');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
