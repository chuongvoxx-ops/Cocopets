// v463 SE: a studio sheet of every Sepulchre picture and texture (no stage played): shots/v463-SE/<OUT>.png
// env: HTML (test-se.html), P (px a tile, 64), OUT (studio), ONLY (comma list of picture names), TEX (1: the textures too), NOPROPS, DECS (1: the decals)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: +(process.env.H || 1500) } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  const html = process.env.HTML || 'test-se.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp && window.SEP_PROPS, null, { timeout: 90000 });
  const res = await page.evaluate(([P, only, tx, noProps, decs0, garden]) => { const G = window.SEP_PROPS, out = [];
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = +(window.innerHeight); cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(cv); const c = cv.getContext('2d'); c.fillStyle = '#20202A'; c.fillRect(0, 0, 1400, cv.height);
    let x = 10, y = 10, rowH = 0; const put = (s, label, bg) => { if (!s) { out.push(label + ': null'); return; } const w = s.cv.width, h = s.cv.height; if (x + w > 1390) { x = 10; y += rowH + 18; rowH = 0; } if (bg) { c.fillStyle = bg; c.fillRect(x, y, w, h); } c.drawImage(s.cv, x, y); c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText(label, x, y + h + 12); x += w + 12; rowH = Math.max(rowH, h); };
    const BG = { halls: '#262C3B', ages: '#E3DDD0', stairs: '#251E38' };
    const L = k => ({ boxtomb: 'halls', hourglass: 'halls', fallstone: 'halls', sepurn: 'halls', stopclock: 'halls', mourner: 'halls', dialslab: 'halls', voidobelisk: 'stairs', stairstub: 'stairs', cornerglow: 'stairs', glassshard: 'stairs', hourlamp: 'stairs', floatstair: 'stairs' }[k] || 'ages');
    if (garden && window.GARDEN_PROPS) { for (const n of ['eggtree', 'weepwillow', 'thornpine', 'bulbtree', 'giantfern', 'glowcaps', 'starlily', 'thornbush', 'mossrock']) { const s = window.GARDEN_PROPS.sprite(n, 0, P); put(s, 'garden ' + n, '#2A2238'); } x = 10; y += rowH + 22; rowH = 0; }
    if (!noProps) for (const n of G.KINDS) { if (only && !only.includes(n)) continue; for (const v of [0, 1]) { const t0 = performance.now(); const s = G.sprite(n, v, P, L(n)); out.push(`${n}/${v}: ${(performance.now() - t0).toFixed(0)} ms ${s ? s.cv.width + 'x' + s.cv.height : 'null'}`); put(s, n + v, BG[L(n)]); } }
    const pieces = (G.PIECES || []).filter(p => !only || only.includes(p[0]));
    for (const [n, vs, L2] of pieces) for (const v of vs) { const t0 = performance.now(); const s = G.sprite(n, v, P, L2); out.push(`${n}/${v}: ${(performance.now() - t0).toFixed(0)} ms`); put(s, n + v, BG[L2]); }
    if (decs0) for (const d of Object.keys(G.DEC)) for (const v of [0, 1]) { const s = G.sprite(d, v, Math.round(P * 1.25), G.DEC[d][4]); put(s, d + v, BG[G.DEC[d][4]]); }
    if (tx) for (const tn of Object.keys(G.TDEF)) { const t0 = performance.now(); const t = G.tex(tn, P); let mean = ''; if (t) { const d = t.cv.getContext('2d').getImageData(0, 0, t.cv.width, t.cv.height).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } mean = n ? `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})` : ''; } out.push(`tex ${tn}: ${(performance.now() - t0).toFixed(0)} ms ${mean}`); put(t ? { cv: t.cv } : null, tn, '#000'); }
    return out; }, [+(process.env.P || 64), process.env.ONLY ? process.env.ONLY.split(',') : null, !!process.env.TEX, !!process.env.NOPROPS, !!process.env.DECS, !!process.env.GARDEN]);
  console.log(res.join('\n'));
  const fs = require('fs'); fs.mkdirSync(path.resolve(__dirname, '..', 'shots', 'v463-SE'), { recursive: true });
  await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', 'v463-SE', (process.env.OUT || 'studio') + '.png') });
  console.log('errors', JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})();
