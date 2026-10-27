// Pets drawn in the Tower: any part (or the whole picture) that paints a faint wash over its box (a "square")
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const res = await page.evaluate(async (N) => {
    const P = window.__pp; P.quickStart('Bot');
    const out = [];
    const stat = (im, name) => { if (!im) return null; const W = im.naturalWidth || im.width, H = im.naturalHeight || im.height; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, W, H).data; let faint = 0, any = 0, solid = 0; for (let i = 3; i < d.length; i += 4) { const a = d[i]; if (a > 0) any++; if (a > 0 && a < 60) faint++; if (a >= 200) solid++; } const corner = [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]].map(([x, y]) => d[(y * W + x) * 4 + 3]); return { W, H, faint: +(faint / (W * H)).toFixed(3), solid: +(solid / (W * H)).toFixed(3), corner }; };
    for (let i = 0; i < N; i++) {
      const six = i % 2 === 0, sd = 100 + i * 13, sg = six ? 7 : 2 + (i % 6);
      const g = P.summonGenome(six ? 6 : 3 + (i % 3), P.mulberry32(sd)), line = P.evolveLine(g.form, sg, P.mulberry32(sd * 7)), f = line[sg - 1] || line[line.length - 1];
      const R = await P.makeRig(f), S = await P.loadSprites(f);
      const rows = { whole: stat(S.normal.img, 'whole'), back: R.back && stat(R.back.img), front: R.front.normal && stat(R.front.normal.img), hurt: R.front.hurt && stat(R.front.hurt.img), happy: R.front.happy && stat(R.front.happy.img), foot: R.foot && stat(R.foot.img), arm: R.arm && stat(R.arm.img), wing: R.wing && stat(R.wing.img) };
      (R.legW || []).forEach((w, j) => rows['lw' + j] = stat(w.img));
      for (const k in rows) { const r = rows[k]; if (r && (r.corner.some(a => a > 0) || r.faint > 0.25)) out.push([i, six ? 'six' : 'plain', sg, f.pattern && f.pattern.type || (f.body && f.body.pattern) || '', k, JSON.stringify(r)]); }
    }
    return out;
  }, +(process.argv[2] || 40));
  res.forEach(r => console.log(r.join(' ')));
  console.log('suspects', res.length, 'errors', errors.slice(0, 3));
  await browser.close();
})();
