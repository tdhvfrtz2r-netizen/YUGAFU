// 阅读时长自检：每拍渲染一帧，收集每行字的出场/退场时间，按字数算够不够读完
// 用法：node scripts/audit.js
const path = require('path');
const {execSync} = require('child_process');
const {bundle} = require('@remotion/bundler');
const {renderStill, selectComposition, openBrowser} = require('@remotion/renderer');
const EXE = process.env.REMOTION_BROWSER ?? path.resolve(__dirname, 'chrome-sw.sh');

const FPS = 60;
const IN_DUR = 30; // theme.motion.inDur
const CPS = 6; // 每秒读 6 个字（无配音、纯文字叙述，偏保守）
const ORIENT = 0.5; // 眼睛找到新出现的字需要的时间（秒）

// 阅读单位：汉字算 1；连续的字母数字（如 2025、21.73%）每 3 个算 1；标点不算
const units = (t) => {
  const s = t.replace(/\*/g, '');
  let u = 0;
  for (const m of s.match(/[A-Za-z0-9.%]+/g) ?? []) u += Math.ceil(m.length / 3);
  u += (s.match(/[一-鿿]/g) ?? []).length;
  return u;
};

(async () => {
  execSync('node scripts/glyphs.js');
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
  const browser = await openBrowser('chrome', {browserExecutable: EXE, chromiumOptions: {gl: 'swangle'}});
  const inputProps = {audit: true};
  const composition = await selectComposition({serveUrl, id: 'Main', puppeteerInstance: browser, browserExecutable: EXE, inputProps});
  const seen = new Map();
  const step = Number(process.argv[2] ?? 144);
  for (let frame = 0; frame < composition.durationInFrames; frame += step) {
    await renderStill({
      composition,
      serveUrl,
      frame,
      imageFormat: 'jpeg',
      jpegQuality: 10,
      inputProps,
      puppeteerInstance: browser,
      browserExecutable: EXE,
      onBrowserLog: (log) => {
        const m = /^AUDIT (.*)$/.exec(log.text);
        if (!m) return;
        const d = JSON.parse(m[1]);
        const key = `${d.base + d.at}|${d.text}`;
        if (!seen.has(key)) seen.set(key, {...d, firstFrame: frame});
      },
    });
  }
  await browser.close({silent: true});

  const bases = [...new Set([...seen.values()].map((d) => d.base))].sort((a, b) => a - b);
  const endOf = (base) => {
    const i = bases.indexOf(base);
    return i + 1 < bases.length ? bases[i + 1] : composition.durationInFrames;
  };
  const rows = [...seen.values()]
    .map((d) => {
      const chars = Array.from(d.text.replace(/\*/g, '')).length;
      const start = d.base + d.at;
      const revealEnd = start + (d.kind === 'key' ? 8 : d.opinion ? 6 : 0) + (chars - 1) * d.stagger + IN_DUR;
      const outAbs = d.out === null ? endOf(d.base) : d.base + d.out;
      return {start, revealEnd, outAbs, u: units(d.text), text: d.text};
    })
    .sort((a, b) => a.start - b.start);
  // 顺序阅读模型：观众按出现顺序一行一行读；一行要等它出现 0.5 秒后、且读完上一行才开始读
  let cursor = 0;
  console.log('start(s)  units  visible  need  margin  seq   text');
  let bad = 0;
  for (const r of rows) {
    const need = (ORIENT + r.u / CPS) * FPS;
    const visible = r.outAbs - r.start;
    const begin = Math.max(r.start + ORIENT * FPS, cursor);
    const finish = begin + (r.u / CPS) * FPS;
    cursor = finish;
    const margin = (visible - need) / FPS;
    const seq = (r.outAbs + 9 - finish) / FPS; // 退场淡出的前半段还能读
    const flag = margin < 0 || seq < 0 ? '  <<< 不够' : '';
    if (flag) bad++;
    console.log(`${(r.start / FPS).toFixed(1).padStart(6)}  ${String(r.u).padStart(5)}  ${(visible / FPS).toFixed(1).padStart(7)}  ${(need / FPS).toFixed(1).padStart(4)}  ${margin.toFixed(1).padStart(6)}  ${seq.toFixed(1).padStart(4)}  ${r.text}${flag}`);
  }
  console.log(`lines: ${rows.length}, flagged: ${bad}, total: ${(composition.durationInFrames / FPS).toFixed(1)} s`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
