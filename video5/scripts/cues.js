// 收集全片的音效标记：每个镜头开头渲染一帧（只为了跑一遍组件），把 <Cue> 打出来的"第几帧响什么"汇总到 audio/cues.json
// 用法：node scripts/cues.js
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const {bundle} = require('@remotion/bundler');
const {renderStill, selectComposition, openBrowser} = require('@remotion/renderer');
const EXE = process.env.REMOTION_BROWSER ?? path.resolve(__dirname, 'chrome-sw.sh');
const FPS = 60;

(async () => {
  execSync('node scripts/glyphs.js');
  // 镜头起点：从 timeline.ts 里读小节数
  const src = fs.readFileSync(path.resolve('src/timeline.ts'), 'utf8');
  const shots = [...src.matchAll(/\{id: '(\w+)', bars: ([\d.]+), layer: (\d+)\}/g)].map((m) => ({id: m[1], bars: Number(m[2]), layer: Number(m[3])}));
  let acc = 0;
  const starts = shots.map((s) => {
    const st = acc;
    acc += Math.round(s.bars * 144);
    return {...s, start: st};
  });
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
  const browser = await openBrowser('chrome', {browserExecutable: EXE, chromiumOptions: {gl: 'swangle'}});
  const inputProps = {cues: true};
  const composition = await selectComposition({serveUrl, id: 'Main', puppeteerInstance: browser, browserExecutable: EXE, inputProps});
  const seen = new Map();
  for (const s of starts) {
    await renderStill({
      composition,
      serveUrl,
      frame: s.start + 1,
      imageFormat: 'jpeg',
      jpegQuality: 10,
      inputProps,
      puppeteerInstance: browser,
      browserExecutable: EXE,
      onBrowserLog: (log) => {
        const m = /^CUE (.*)$/.exec(log.text);
        if (!m) return;
        const d = JSON.parse(m[1]);
        seen.set(`${d.s}|${d.f}|${d.gain}|${d.pan}|${d.dur}`, d);
      },
    });
  }
  await browser.close({silent: true});
  const cues = [...seen.values()].sort((a, b) => a.f - b.f).map((d) => ({s: d.s, t: d.f / FPS, f: d.f, gain: d.gain, pan: d.pan, dur: d.dur}));
  fs.mkdirSync('audio', {recursive: true});
  fs.writeFileSync('audio/cues.json', JSON.stringify({fps: FPS, total: acc, shots: starts, cues}, null, 1));
  const counts = {};
  for (const c of cues) counts[c.s] = (counts[c.s] ?? 0) + 1;
  console.log(`cues: ${cues.length}`, JSON.stringify(counts));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
