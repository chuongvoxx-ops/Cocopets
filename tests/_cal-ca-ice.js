// v404 CA: the Rimebound Forge's ice props (frost clusters, frost wells, frozen-coolant floor) and the Glass Heart's geodes
// (their red-energy eruptions): in-game shots beside each, and close-up sheets of the props' pictures.
// HTML=test-ca.html OUT=shots/v404-CA/after node tests/_cal-ca-ice.js [rime|heart|sheet]   (GPU=1 forces the GPU painter on)
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path'), fs = require('fs');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2), OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v404-CA/x');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
(async () => {
  const T = await open({ lvl: 8 }); const { page, start, run, errors } = T;
  const list = await page.evaluate(() => window.__pp.RIFT_BY_ID.caldera.stages.map((s, i) => i + ':' + s.kind + ':' + s.biome).join(' | ')); console.log(list);
  const near = async (kinds, n, tag, secs, dy) => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; for (const X of [D.X, D.RIFT && D.RIFT.self && D.RIFT.self.amb && D.RIFT.self.amb.C && D.RIFT.self.amb.C.X]) if (X && !X.zones) X.zones = D.zones; }); /* (a test-only shim: another v404 worker's in-progress 20zz9 reads X.zones) */ const ps = await page.evaluate(kinds => { const D = window.__pp.arc.game._dbg; const me = D.me; return (D.propList || []).filter(p => kinds.includes(p.kind) && !p.broken).map(p => ({ x: p.x, y: p.y, kind: p.kind, d: Math.hypot(p.x - me.x, p.y - me.y) })).sort((a, b) => a.d - b.d); }, kinds);
    console.log(tag, 'props', ps.length, ps.slice(0, 4).map(p => p.kind + '@' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' '));
    for (let i = 0; i < Math.min(n, ps.length); i++) { const p = ps[Math.floor(i * ps.length / n)];
      await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.boss) { m.x = -50; m.y = -50; m.still = true; } const w = D.RIFT.self.amb.C.X.walkPoint(x, y, null); D.me.x = w.x; D.me.y = w.y; D.g.taps = 9; }, [p.x, p.y + (dy || 2.2)]);
      await run(secs || 1.6); await page.screenshot({ path: `${OUT}-${tag}-${i}.png` }); } };
  if (!want.length || want.includes('rime')) { await start("caldera", 3); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; }); await run(3.5); await near(['frostcluster', 'frostwell'], 3, 'rime'); }
  if (!want.length || want.includes('heart')) { await start("caldera", 6); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; }); await run(3.5); await near(['geode'], 2, 'heart', 0.9, 1.8);
    if (process.env.SEQ) for (let k = 0; k < 6; k++) { await run(0.55); await page.screenshot({ path: `${OUT}-heartseq-${k}.png` }); } }
  if (!want.length || want.includes('sheet')) { // the props' own pictures, large, on the land's floor colour
    const url = await page.evaluate(() => { const DW = (typeof DunWorld !== "undefined" && DunWorld) || window.__pp.DunWorld; const cv = document.createElement('canvas'); cv.width = 780; cv.height = 520; const c = cv.getContext('2d'); c.fillStyle = '#3E3E46'; c.fillRect(0, 0, 780, 260); c.fillStyle = '#16121A'; c.fillRect(0, 260, 780, 260);
      const put = (kind, v, x, y, biome) => { const s = DW.propSprite(kind, 64, 1, v, biome); c.drawImage(s.cv, x - s.ax, y - s.ay); };
      put('frostcluster', 0, 110, 230, 'rimeforge'); put('frostcluster', 1, 290, 230, 'rimeforge'); put('frostwell', 0, 480, 230, 'rimeforge'); put('frostwell', 1, 670, 230, 'rimeforge');
      put('geode', 0, 200, 490, 'glassheart'); put('geode', 1, 560, 490, 'glassheart'); return cv.toDataURL(); });
    fs.writeFileSync(`${OUT}-sheet.png`, Buffer.from(url.split(',')[1], 'base64')); }
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
