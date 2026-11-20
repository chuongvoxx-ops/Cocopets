// v433 DE: a studio sheet of every dunes picture and texture (no stage played): shots/v433-DE/<OUT>.png
// env: HTML (test-de.html), P (px a tile, 72), OUT (studio), ONLY (comma list of picture names), TEX (1: the textures too)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: +(process.env.H || 1500) } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-de.html'));
  await page.waitForFunction(() => window.__pp && window.DUNE_PROPS, null, { timeout: 60000 });
  const res = await page.evaluate(([P, only, tx]) => { const G = window.DUNE_PROPS, out = [];
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = +(window.innerHeight); cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(cv); const c = cv.getContext('2d'); c.fillStyle = '#3A2A30'; c.fillRect(0, 0, 1400, cv.height);
    let x = 10, y = 10, rowH = 0; const put = (s, label, bg) => { if (!s) { out.push(label + ': null'); return; } const w = s.cv.width, h = s.cv.height; if (x + w > 1390) { x = 10; y += rowH + 18; rowH = 0; } if (bg) { c.fillStyle = bg; c.fillRect(x, y, w, h); } c.drawImage(s.cv, x, y); c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText(label, x, y + h + 12); x += w + 12; rowH = Math.max(rowH, h); };
    const BG = { dusk: '#B88A5C', noon: '#C8743A', night: '#2E3E64' };
    const props = [['dunerock', 'dusk'], ['bones', 'dusk'], ['ribarch', 'dusk'], ['jawtooth', 'dusk'], ['menhir', 'dusk'], ['sanddrift', 'dusk'], ['mesarock', 'noon'], ['pinkcrystal', 'noon'], ['crystalout', 'noon'], ['claypillar', 'noon'], ['relic', 'noon'], ['tumbleweed', 'noon'], ['bones', 'noon'], ['nightrock', 'night'], ['gravestone', 'night'], ['bonecairn', 'night'], ['glowshroom', 'night'], ['deadtree', 'night'], ['deadshrub', 'night'], ['skullpile', 'night'], ['bones', 'night']];
    const pieces = [['ribtip', 'dusk', [0, 1]], ['cairn', 'dusk', [0]], ['amber', 'dusk', [0]], ['resonator', 'noon', [0, 1, 2, 3, 4, 5]], ['mound', 'night', [0]], ['grubpop', 'night', [0]], ['mantapop', 'night', [0]]];
    const decs = Object.keys(G.DEC);
    for (const [n, L] of props) { if (only && !only.includes(n)) continue; for (const v of [0, 1]) { const t0 = performance.now(); const s = G.sprite(n, v, P, L); out.push(`${n}/${v}/${L}: ${(performance.now() - t0).toFixed(0)} ms ${s ? s.cv.width + 'x' + s.cv.height : 'null'}`); put(s, n + v + ' ' + L, BG[L]); } }
    for (const [n, L, vs] of pieces) { if (only && !only.includes(n)) continue; for (const v of vs) { const t0 = performance.now(); const s = G.sprite(n, v, P, L); out.push(`${n}/${v}: ${(performance.now() - t0).toFixed(0)} ms`); put(s, n + v, BG[L]); } }
    if (!only) for (const d of decs) for (const v of [0, 1]) { const s = G.sprite(d, v, Math.round(P * 1.25), G.DEC[d][4]); put(s, d + v, BG[G.DEC[d][4]]); }
    if (tx) for (const tn of Object.keys(G.TDEF)) { const t0 = performance.now(); const t = G.tex(tn, P); out.push(`tex ${tn}: ${(performance.now() - t0).toFixed(0)} ms`); put(t ? { cv: t.cv } : null, tn); }
    return out; }, [+(process.env.P || 72), process.env.ONLY ? process.env.ONLY.split(',') : null, !!process.env.TEX]);
  console.log(res.join('\n'));
  const fs = require('fs'); fs.mkdirSync(path.resolve(__dirname, '..', 'shots', 'v433-DE'), { recursive: true });
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', 'v433-DE', (process.env.OUT || 'studio') + '.png') });
  console.log('errors', JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})();
