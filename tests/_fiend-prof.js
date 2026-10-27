// A Super Fiend floor's frame by the dungeon's own pieces (world, ground, standing things, effects, HUD...), each flushed
// and timed, averaged over 90 frames as the pet circles (the game held still, the dice seeded). usage: node tests/_fiend-prof.js floors   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '10,70,100').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  if (process.env.HUD) await page.addInitScript(() => { window.__profHud = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl, +(process.env.CAP || 0)]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
    const r = await page.evaluate(([ev, phase]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = window.__run, g = D.g;
      if (ev) P.DunFiend.KIT.Q.ev = ev;
      const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; } };
      step(5); if (phase > 1) { const m = D.g.boss, cut = ((FD.S.FD && FD.S.FD.cuts) || [1, 0.66, 0.33])[phase - 1]; m.hp = m.maxhp * (cut - 0.04); step(6); }
      const c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
      for (let i = 0; i < 70; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); }
      // the fiend's own pieces inside 'ents' timed apart (flushed on both sides), and taken out of it
      const own = {}, seq = []; let cur = 0; ['drawBoss', 'drawProp', 'drawObj'].forEach(k => { const f = FD[k]; FD[k] = function (...a) { fl(); const t0 = performance.now(); try { return f.apply(this, a); } finally { fl(); const dt = performance.now() - t0; own[k] = (own[k] || 0) + dt; if (k === 'drawBoss') cur += dt; } }; });
      g.prof = {}; g.profHud = !!(window.__profHud); let tot = 0; const N = 90;
      for (let i = 0; i < N; i++) { const a = 1.5 + i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; cur = 0; fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); tot += performance.now() - t0; seq.push(Math.round(cur)); }
      const out = {}; for (const k in g.prof) out[k] = +(g.prof[k] / N).toFixed(2); g.prof = null;
      let inEnts = 0; for (const k in own) { out['fiend.' + k.slice(4).toLowerCase()] = +(own[k] / N).toFixed(2); if (k !== 'drawObj' || true) inEnts += own[k] / N; }
      if (out.ents != null) out['ents-rest'] = +(out.ents - inEnts).toFixed(2);
      return { id: FD.S && P.FIENDS ? '' : '', frame: +(tot / N).toFixed(1), out, seq: seq.slice(0, 36).join(' ') };
    }, [+(process.env.EV || 0), +(process.env.PHASE || 1)]);
    const pieces = Object.entries(r.out).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('  ');
    console.log(`${fl}  frame ${r.frame} ms  |  ${pieces}`); if (process.env.SEQ) console.log(`    fiend by frame: ${r.seq}`);
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
