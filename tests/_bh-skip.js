// What each part of Bahamut costs in its fight, frame by frame as the game draws it: the whole frame timed (flushed
// once a frame) with the colossus whole and with one part of it left out at a time, in turns, so drift falls alike.
// usage: node tests/_bh-skip.js [rounds] [frames]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const rounds = +(process.argv[2] || 3), NF = +(process.argv[3] || 60);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(120, 7); }, +(process.env.CAP || 0));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
  const r = await page.evaluate(([rounds, NF, FEATHER]) => { process = { env: { FEATHER } };
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run;
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
    step(5);
    const c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    let fi = 0; const frame = () => { const a = fi++ * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); M.gap = 99; me.hp = D.ST.hp; };
    for (let i = 0; i < 70; i++) { frame(); c.save(); G.draw(c); c.restore(); }
    const sets = process.env.FEATHER ? { whole: null, wings: { wings: 1 }, fband: { _f: { band: 1 } }, ftip: { _f: { tip: 1 } }, fshaft: { _f: { shaft: 1 } }, fline: { _f: { line: 1 } } }
      : { whole: null, wings: { wings: 1 }, tents: { tents: 1 }, rings: { rings: 1 }, fish: { fish: 1 }, bloom: { bloom: 1 }, sparks: { spark: 1 }, runes: { runes: 1 } };
    const acc = {}; Object.keys(sets).forEach(k => { acc[k] = []; });
    for (let rd = 0; rd < rounds; rd++) for (const [nm, sk] of Object.entries(sets)) {
      M.skipP = sk && !sk._f ? sk : null; self.__SKF = sk && sk._f ? sk._f : null; P.DunFiend.KIT.LAYERS.forEach(L => { L.sig = 'x'; });   // every kept picture painted afresh with this part left out
      for (let i = 0; i < 9; i++) { frame(); c.save(); G.draw(c); c.restore(); }
      let tot = 0; for (let i = 0; i < NF; i++) { frame(); fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); tot += performance.now() - t0; }
      acc[nm].push(tot / NF);
    }
    M.skipP = null;
    const out = {}; for (const k in acc) out[k] = +(acc[k].reduce((a, v) => a + v, 0) / acc[k].length).toFixed(1); return out;
  }, [rounds, NF, process.env.FEATHER || '']);
  const w = r.whole; console.log(`Bahamut, the whole frame: ${w} ms`);
  for (const [k, v] of Object.entries(r)) if (k !== 'whole') console.log(`  without its ${k.padEnd(7)} ${String(v).padStart(5)} ms  (that part: ${(w - v).toFixed(1)} ms a frame)`);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
