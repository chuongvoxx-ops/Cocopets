// Rift 0 QA (worker Q): soft-lock probes on the three generated dungeons (stages 0, 3, 6). The pet stands at the start in god
// mode for a while, then walks the floor room by room; every half second each live monster's tile is sampled. Reports monsters
// that sit off the walkable floor (over lava gaps or inside walls) for 5 s or more, where they are, whether they come back, and
// any monster a melee pet could never reach (off the floor at the end). Also: the champion spawned, its room reachable.
// HTML=test-calQ.html node tests/_cal-q-probe.js [0 3 6]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__CAL_GL = 0; window.__DUN_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calQ.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Probe'); P.st.dun.god = true; P.st.energy = 100; P.st.unlockAll = true; });
  const stages = process.argv.slice(2).map(Number); for (const stg of (stages.length ? stages : [0, 3, 6])) {
    await page.evaluate(s => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', s); }, stg);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const r = await page.evaluate(async () => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me, run = G.update; G.update = () => {};
      const off = new Map(), long = [], seen = new Set(); let samples = 0, offSamples = 0;
      const rooms = D.M.rooms.slice().sort((a, b) => Math.hypot(a.x - D.M.start.x, a.y - D.M.start.y) - Math.hypot(b.x - D.M.start.x, b.y - D.M.start.y));
      const champ = D.mons.concat(g.reserve || []).find(m => m.calChamp);
      let ri = 0, tWalk = 0;
      for (let i = 0; i < 60 * 240; i++) {
        // walk the pet through the rooms (god mode: monsters wake and chase, as they would)
        const R = rooms[ri % rooms.length], tx = R.x + R.w / 2, ty = R.y + R.h / 2; if (Math.hypot(me.x - tx, me.y - ty) < 2 || tWalk > 25) { ri++; tWalk = 0; } else { const sv = D.steerTo(tx, ty); if (sv) { me.x += sv[0] * 4 / 60; me.y += sv[1] * 4 / 60; } tWalk += 1 / 60; }
        run(1 / 60);
        if (i % 30 === 0) { for (const m of D.mons) { if (m.dead || m.boss) continue; samples++; const ok = D.walkAt(Math.floor(m.x), Math.floor(m.y)); if (!ok) { offSamples++; const k = off.get(m) || { t0: g.t, type: m.type, fly: !!m.fly }; off.set(m, k); k.t1 = g.t; k.x = +m.x.toFixed(1); k.y = +m.y.toFixed(1); if (k.t1 - k.t0 >= 5 && !seen.has(m)) { seen.add(m); long.push(k); } } else if (off.has(m)) { off.get(m).back = true; off.delete(m); } } }
        if (i % 600 === 0) await new Promise(r => setTimeout(r, 0)); }
      // end: who is off the floor now (stays out of a melee pet's reach)
      const nowOff = D.mons.filter(m => !m.dead && !m.boss && !D.walkAt(Math.floor(m.x), Math.floor(m.y))).map(m => ({ type: m.type, x: +m.x.toFixed(1), y: +m.y.toFixed(1), since: off.get(m) ? +(g.t - off.get(m).t0).toFixed(0) : 0 }));
      G.update = run;
      return { samples, offShare: +(offSamples / Math.max(1, samples)).toFixed(3), longOff: long.length, longTypes: [...new Set(long.map(k => k.type))], longEx: long.slice(0, 6), nowOff: nowOff.slice(0, 10), nowOffN: nowOff.length, alive: D.mons.filter(m => !m.dead).length, champ: champ ? { name: champ.calChamp, onFloor: D.walkAt(Math.floor(champ.x), Math.floor(champ.y)) } : null, rooms: D.M.rooms.length };
    });
    console.log('stage', stg, JSON.stringify(r));
  }
  console.log('errors', errors.slice(0, 4)); await browser.close();
})();
