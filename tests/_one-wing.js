// one six-star wing drawn big, unturned, at each stage (and as the layout turns it). usage: node tests/_one-wing.js kind
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const kind = process.argv[2] || 'butterfly', out = process.env.OUT || 'onewing';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 580 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(kind => { const P = window.__pp; const L = { w: kind, a: '#E9D8FF', b: '#3B2266', c: '#7AE8FF', v: 0.5 };
    const cells = [1, 3, 5, 7].map(sg => { const Li = Object.assign({}, L, { sg }), lay = P.legLayout(Li, 1); return `<div class="c"><small>stage ${sg} rot ${lay.rot[0]}</small><svg viewBox="-80 -70 100 140"><line x1="-80" y1="0" x2="20" y2="0" stroke="#999"/><g transform="rotate(${lay.rot[0]})">${P.legWing(Li, 1.1, 1.7, 0)}</g></svg></div>`; });
    document.body.innerHTML = `<style>body{margin:0;background:#B8D88E;display:flex;gap:6px;font:12px sans-serif}.c{width:290px;height:560px;position:relative}.c svg{width:100%;height:100%}small{position:absolute;left:4px;top:2px}</style>` + cells.join(''); return 1; }, kind);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}.png`) });
  await browser.close();
})();
