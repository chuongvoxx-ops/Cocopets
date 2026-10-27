// A sheet of pets across all seven stages at room scale, to judge sizes and the late-stage features.
// usage: node tests/pet-sheet.js [rows] [seed]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const rows = +(process.argv[2] || 6), seed0 = +(process.argv[3] || 11);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); });
  const html = await page.evaluate(({ rows, seed0 }) => {
    const P = window.__pp; let h = '<div style="background:#F6EFE4;padding:10px;font:12px sans-serif;color:#333">';
    const feats = {};
    for (let r = 0; r < rows; r++) {
      const R = P.mulberry32(seed0 + r * 7919), g = P.makeGenome(R), line = P.evolveLine(g.form, 7, R);
      h += '<div style="display:flex;align-items:flex-end;gap:6px;height:215px;border-bottom:1px solid #ccc">';
      line.forEach(f => {
        const sc = P.STAGES[f.stage].scale * (f.grow || 1), px = Math.round(150 * sc);
        const x = Object.keys(f.x || {}).map(k => k + (f.x[k] && f.x[k].n > 1 ? '×' + f.x[k].n : '')).join(' ');
        Object.keys(f.x || {}).forEach(k => { feats[k + '@' + f.stage] = (feats[k + '@' + f.stage] || 0) + 1; });
        h += `<div style="width:${Math.max(px, 110)}px;text-align:center"><div style="width:${px}px;height:${px}px;margin:0 auto">${P.petSVG(f, { eyes: 'normal', mouth: 'smile' })}</div><div style="font-size:10px;line-height:1.1;word-break:break-word">S${f.stage} ×${sc.toFixed(2)}<br>${x}</div></div>`;
      });
      h += '</div>';
    }
    return h + '</div><pre style="font-size:11px">' + JSON.stringify(feats) + '</pre>';
  }, { rows, seed0 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{--pet-line:#2B2433}svg{width:100%;height:100%;overflow:visible}</style></head><body style="margin:0">${html}</body></html>`);
  await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, 'pets-stages.png'), fullPage: true });
  console.log('saved shots/pets-stages.png; errors:', errors.length, errors.slice(0, 4));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
