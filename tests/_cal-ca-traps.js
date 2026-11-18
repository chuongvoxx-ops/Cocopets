// v408 CA: the Blackfire Caldera's fire traps (the vent fields of the trials and dungeons, the Descent's lane vents, the
// Hollows' lava runnels) and the Glass Heart's geodes: in-game shots of each trap held in each phase (idle, glow, erupt,
// cool), beside a geode. HTML=test-ca8.html OUT=shots/v408-CA/after node tests/_cal-ca-traps.js [gal hol des heart] (GPU=1: the GPU painter forced on)
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path'), fs = require('fs');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2), OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v408-CA/x');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
(async () => {
  const T = await open({ lvl: 8 }); const { page, start, run, errors } = T;
  const quiet = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; for (const m of D.mons) if (!m.boss) { m.x = -50; m.y = -50; m.still = true; } });
  const go = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; const X = D.RIFT.self.amb.C.X, w = X.walkPoint(x, y, null); D.me.x = w.x; D.me.y = w.y; D.me.vx = D.me.vy = 0; }, [x, y]);
  const shot = n => page.screenshot({ path: `${OUT}-${n}.png` });
  const begin = async st => { await start('caldera', st); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; }); await run(4); await quiet(); };
  // a CAL.vent (the vent fields) held in a phase: [st, t]
  const calVent = async (tag, list) => { const v = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C, me = D.me; const vs = C.vents.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)); const v = vs[Math.min(1, vs.length - 1)]; if (!v) return null; window.__V = v; return { x: v.x, y: v.y, n: C.vents.length }; });
    console.log(tag, 'vent', JSON.stringify(v)); if (!v) return; await go(v.x + 1.6, v.y + 2.2);
    for (const [ph, frac] of list) { await page.evaluate(([ph, frac]) => { const v = window.__V; v.on = true; v.demo = false; if (ph === 'cool') { v.st = 'idle'; v.n = Math.max(1, v.n); v.t = frac; } else { v.st = ph; v.t = ph === 'idle' ? 0 : frac * (ph === 'warn' ? v.warn : v.erupt); } }, [ph, frac]); await quiet(); await run(0.06); await shot(`${tag}-${ph}${frac ? Math.round(frac * 10) : ''}`); } };
  if (!want.length || want.includes('gal')) { await begin(0); await calVent('gal', [['idle', 0], ['warn', 0.5], ['warn', 0.9], ['erupt', 0.2], ['erupt', 0.6], ['cool', 0.4]]); }
  if (!want.length || want.includes('hol')) { await begin(1);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C, me = D.me; const L = C.lava.find(p => p.kind === 'tiles'); if (!L) return null; const t = L.tiles.slice().sort((a, b) => Math.hypot(a.tx - me.x, a.ty - me.y) - Math.hypot(b.tx - me.x, b.ty - me.y))[0]; return { x: t.tx + 0.5, y: t.ty + 0.5, n: L.tiles.length }; });
    console.log('hol runnel', JSON.stringify(r)); if (r) { await go(r.x + 1.5, r.y + 1.5); await run(0.3); await shot('hol-runnel'); }
    await calVent('hol', [['idle', 0], ['warn', 0.8], ['erupt', 0.3]]); }
  if (!want.length || want.includes('des')) { await begin(7);
    const L = { idle: 1.6, warn: 1.9, erupt: 0.8, cool: 0.9 };
    const v = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const v = mod.vents[0]; window.__V = v; return { x: v.x, y: v.y, n: mod.vents.length }; }); console.log('des vent', JSON.stringify(v));
    await go(v.x + 2.2, v.y + 1.4);
    for (const [ph, t] of [['idle', 0.5], ['warn', L.idle + L.warn * 0.5], ['warn', L.idle + L.warn * 0.92], ['erupt', L.idle + L.warn + L.erupt * 0.15], ['erupt', L.idle + L.warn + L.erupt * 0.6], ['cool', L.idle + L.warn + L.erupt + L.cool * 0.4]]) {
      await page.evaluate(t => { const D = window.__pp.arc.game._dbg, v = window.__V; v.live = true; v.demo = false; v.t = t; D.me.inv = 9; }, t); await quiet(); await run(0.06); await shot(`des-${ph}${Math.round(t * 10)}`); } }
  if (!want.length || want.includes('heart')) { await begin(6);
    const p = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; const ps = (D.propList || []).filter(p => p.kind === 'geode' && !p.broken).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)); return ps[0] ? { x: ps[0].x, y: ps[0].y } : null; });
    if (p) { await go(p.x + 1.2, p.y + 1.8); for (let k = 0; k < 3; k++) { await quiet(); await run(0.9); await shot('heart-' + k); } }
    await calVent('heart', [['warn', 0.8], ['erupt', 0.3]]); }
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
