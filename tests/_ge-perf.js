// v423 GE: what the garden's pictures cost to make (the loading screen's jobs) and to keep, at a phone's sharpness (DPR 1: 47 px a
// tile, DPR 3: 94) — the longest single job, the total, and the memory of what is kept. env: HTML (test-ge.html)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ge.html'));
  await page.waitForFunction(() => window.__pp && window.GARDEN_PROPS, null, { timeout: 60000 });
  const res = await page.evaluate(() => { const G = window.GARDEN_PROPS, out = [];
    for (const [T, k] of [[47, 1], [47, 2]]) for (const S of [{ kind: 'fight', name: 'The Egg Orchard' }, { kind: 'puzzle', name: 'The Seedling March' }, { kind: 'puzzle', name: 'The Falling Nursery' }, { kind: 'puzzle', name: 'The Seedshot Gallery' }, { kind: 'boss', name: 'The Cradle Bed' }]) {
      G.release(); const jobs = G.warm({ T, k, S, Tz: () => T }); let tot = 0, mx = 0; for (const j of jobs) { const t0 = performance.now(); j(); const d = performance.now() - t0; tot += d; mx = Math.max(mx, d); }
      // the engine's own props for a dungeon (painted through its prop cache)
      let pt = 0, pm = 0; if (S.kind !== 'puzzle') for (const kk of G.KINDS) for (let v = 0; v < 4; v++) { const t0 = performance.now(); window.__pp.DunWorld.propSprite(kk, T, k, v, 'garden'); const d = performance.now() - t0; pt += d; pm = Math.max(pm, d); }
      let px = 0; const st = G.stats; out.push(`T ${T} k ${k} ${S.name}: ${jobs.length} jobs, longest ${mx.toFixed(0)} ms, total ${tot.toFixed(0)} ms; props ${pt.toFixed(0)} ms (longest ${pm.toFixed(0)}); kept ${st.cached} pictures + ${st.textures} textures (${(st.px * 4 / 1048576).toFixed(1)} MB: ${st.texKeys.join(' ')})`);
      window.__pp.DunWorld.dropProps(); }
    return out; });
  console.log(res.join('\n')); console.log('errors', JSON.stringify(errors.slice(0, 4)));
  await browser.close();
})();
