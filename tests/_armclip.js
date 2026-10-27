const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(async (ids) => { const P = window.__pp; P.quickStart('Bot'); const out = [];
    for (const i of ids) { const six = i % 2 === 0, sd = 100 + i * 13, sg = six ? 7 : 2 + (i % 6);
      const g = P.summonGenome(six ? 6 : 3 + (i % 3), P.mulberry32(sd)), line = P.evolveLine(g.form, sg, P.mulberry32(sd * 7)), f = line[sg - 1];
      const R = await P.makeRig(f); P.petSVG(f, { static: true, frame: 'fit', lite: true, rig: true }); const raw = P.petSVG.rig;
      const cv = document.createElement('canvas'); cv.width = 200; cv.height = 200; const c = cv.getContext('2d'); c.fillStyle = '#88a'; c.fillRect(0, 0, 200, 200); c.drawImage(R.arm.img, 10, 10, R.arm.img.naturalWidth * 1.5, R.arm.img.naturalHeight * 1.5);
      out.push({ i, vb: R.arm.vb.map(v => +v.toFixed(1)), pv: raw.armPv, arm: raw.arm.slice(0, 600), png: cv.toDataURL() }); }
    return out; }, [17, 20]);
  const fs = require('fs'); r.forEach(o => { fs.writeFileSync(path.resolve(__dirname, `../shots/armclip-${o.i}.png`), Buffer.from(o.png.split(',')[1], 'base64')); delete o.png; });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
