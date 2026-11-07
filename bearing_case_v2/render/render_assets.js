// Render transparent PNG parts with Playwright's Chromium. usage: node render/render_assets.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'gen');
fs.mkdirSync(OUT, { recursive: true });
const PPI = 300;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body style="margin:0"><canvas id="c"></canvas></body></html>');
  await page.addScriptTag({ path: path.join(__dirname, 'scene.js') });
  // job: [file, widthIn, heightIn, js-body using c (ctx scaled to inches) and S (scene)]
  const jobs = [
    ['drive_base', 5.6, 5.6, 'S.driveBase(c, S.DRIVE, 0, 0)'],
    ['pulley_motor', 1.1, 1.1, 'S.pulley(c, 0.55, 0.55, 0.55, -Math.PI/2, "holes")'],
    ['pulley_fan', 1.9, 1.9, 'S.pulley(c, 0.95, 0.95, 0.95, -Math.PI/2, "spokes")'],
    ['ballset', 4, 4, 'S.ballSet(c, 2, 2, 2, S.evenAngles(-Math.PI/2), "intact", false)'],
    ['inner_ring', 4, 4, 'S.innerRing(c, 2, 2, 2, -Math.PI/2)'],
    ['outer_ring', 4, 4, 'S.outerRing(c, 2, 2, 2)'],
    ['dial_amp', 2, 2, 'S.dial(c, 1, 1, 1, "amp")'],
    ['dial_megger', 2, 2, 'S.dial(c, 1, 1, 1, "megger")'],
    ['needle', 2, 2, 'S.needle(c, 1, 1, 1, 0)'],
  ];
  for (const [name, w, h, body] of jobs) {
    const data = await page.evaluate(([w, h, body, ppi]) => {
      const cv = document.getElementById('c'); cv.width = Math.round(w * ppi); cv.height = Math.round(h * ppi);
      const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.save(); c.scale(ppi, ppi);
      const S = window.SCENE; (new Function('c', 'S', body))(c, S); c.restore();
      return cv.toDataURL('image/png');
    }, [w, h, body, PPI]);
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', name);
  }
  await browser.close();
})();
