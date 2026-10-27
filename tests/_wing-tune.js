// Tuning the Anima's eight wings: each pair painted alone in its own colour at four moments of the beat, and how many
// pixels any two pairs share (overlap). usage: TUNE='js on PA' node tests/_wing-tune.js [out]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'wing-tune';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  if (process.env.TUNE) await page.evaluate(js => { const PA = window.__pp.FIEND_DEFS.bahamut.mini.PAIRS; (new Function('PA', js))(PA); }, process.env.TUNE);
  const r = await page.evaluate((yaw) => {
    const D = window.__pp.FIEND_DEFS.bahamut.mini, cw = 480, ch = 400, T = 15, times = [0, 0.6, 1.2, 1.8], n = D.PAIRS.seraph.length;
    const cv = document.createElement('canvas'); cv.width = cw * times.length; cv.height = ch * 2; const c = cv.getContext('2d');
    c.fillStyle = '#141A22'; c.fillRect(0, 0, cv.width, cv.height);
    const res = [];
    times.forEach((t, ti) => {
      const X = ti * cw + cw / 2, Y = ch * 0.62;
      // row 1: every pair in its colour, translucent, so overlaps show as mixed colours
      const M = D.make({ k: 3 }); D.pose(M, 2 + t, {}); M.dbgOnly = 'wings'; M.dbgCol = true; M.yaw = yaw;
      D.draw(c, M, X, Y, T, { q: 1 });
      // row 2: the real thing
      const M2 = D.make({ k: 3 }); D.pose(M2, 2 + t, {}); M2.yaw = yaw; D.draw(c, M2, X, Y + ch, T, { q: 1 });
      // overlap: each pair alone in its own mask
      const masks = [];
      for (let p = 0; p < n; p++) {
        const m = document.createElement('canvas'); m.width = cw; m.height = ch; const g = m.getContext('2d');
        const M3 = D.make({ k: 3 }); D.pose(M3, 2 + t, {}); M3.dbgOnly = 'wings'; M3.dbgCol = true; M3.dbgPair = p; M3.yaw = yaw; D.draw(g, M3, cw / 2, Y, T, { q: 1 });
        masks.push(g.getImageData(0, 0, cw, ch).data);
      }
      const ov = {}, area = [];
      for (let p = 0; p < n; p++) { let a = 0; for (let i = 3; i < masks[p].length; i += 4) if (masks[p][i] > 60) a++; area.push(a); }
      for (let p = 0; p < n; p++) for (let q2 = p + 1; q2 < n; q2++) { let o = 0; for (let i = 3; i < masks[p].length; i += 4) if (masks[p][i] > 60 && masks[q2][i] > 60) o++; if (o) ov[p + '-' + q2] = o; }
      res.push({ t, area, ov });
      c.fillStyle = '#FFE37A'; c.font = '700 14px sans-serif'; c.fillText('t +' + t + '  overlap ' + JSON.stringify(ov), ti * cw + 8, 18);
    });
    return { res, url: cv.toDataURL('image/jpeg', 0.9) };
  }, +(process.env.YAW || 0));
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/${out}.jpg`), Buffer.from(r.url.split(',')[1], 'base64'));
  r.res.forEach(x => console.log(JSON.stringify(x)));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
