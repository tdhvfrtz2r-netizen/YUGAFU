// Render the opening clip: node render/video.js [--stills]  -> assets/gen/opening.mp4 + opening_poster.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'gen');
const FPS = 30;
const STILLS = process.argv.includes('--stills');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent('<html><body style="margin:0;background:#000"><canvas id="c" width="1920" height="1080"></canvas></body></html>');
  await page.addScriptTag({ path: path.join(__dirname, 'scene.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'opening.js') });
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo_white.png')).toString('base64');
  await page.evaluate(async (src) => { window.LOGO = new Image(); window.LOGO.src = src; await window.LOGO.decode(); }, logo);
  const grab = (t) => page.evaluate((t) => { const cv = document.getElementById('c'); window.frame(cv.getContext('2d'), t, window.LOGO); return cv.toDataURL('image/png'); }, t);
  const dur = await page.evaluate(() => window.DURATION);
  if (STILLS) {
    fs.mkdirSync(path.join(__dirname, '..', 'build', 'stills'), { recursive: true });
    for (const t of [0, 2, 4, 5.5, 6.2, 7, 8, 9, 9.8, 11, 13.9]) {
      const d = await grab(t);
      fs.writeFileSync(path.join(__dirname, '..', 'build', 'stills', `f_${String(t).replace('.', '_')}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-an',
    '-movflags', '+faststart', path.join(OUT, 'opening.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    const d = await grab(i / FPS);
    const buf = Buffer.from(d.split(',')[1], 'base64');
    if (i === 0) fs.writeFileSync(path.join(OUT, 'opening_poster.png'), buf);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${n}\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done');
})();
