// (v472 YM) Rift 06's brood on the GPU, checked in play: each given stage started, its brood (and the mini) made to attack round the
// pet for a few seconds (coil sentries linked, spark mites charging and dashing, hull wings bombing, war mechs firing); reports what
// was baked and painted (YUG_BROOD.stats: pictures baked, provisional 2D, the attack layer's passes and quads, shots painted on the
// engine's pass), the GPU passes and copies per frame and the frame time with the crowd on screen (20+ monsters), the sprite memory,
// the mini's look (armed giant evil Cocopet, its poses baked), page errors, and after leaving the stage that every model's GPU
// buffers are let go. MODE=nogl launches the browser without WebGL (the 2D fallback); LOWFX=1 turns on Fewer effects.
// usage: HTML=<build> [MODE=gl|nogl] [LOWFX=1] [CROWD=24] node tests/_ym-check.js [stages 0,3,7]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const MODE = process.env.MODE || 'gl', STAGES = (process.argv[2] || '0,3,7').split(',').map(Number);
  const args = MODE === 'nogl' ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /YUG_BROOD/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(m => { window.__YUB_GL = m === 'gl' ? 1 : 0; if (m === 'gl') window.__NG_GL = 1; }, MODE);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ym.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  const has = await page.evaluate(lf => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 62; P.st.unlockAll = true; if (lf) P.st.lowFx = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora']) P.riftState().seals[id] = 1; P.st.dun.best = 120; return !!window.YUG_BROOD; }, !!process.env.LOWFX);
  ok(has, 'YUG_BROOD loaded');
  for (const S of STAGES) {
    const t0 = Date.now();
    await page.evaluate(S => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('yuggoth', S); }, S);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); const load = Date.now() - t0;
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const r = await page.evaluate(async ([S, CROWD]) => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, AB = window.YUG_BROOD, fr = () => new Promise(r => requestAnimationFrame(r));
      const base = JSON.parse(JSON.stringify(AB.stats)), NG = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
      for (const m of D.mons) if (!m.boss && Math.hypot(m.x - me.x, m.y - me.y) < 12) { m.x += 40; m.y += 40; }
      const KB = ['sparkmite', 'hullwing', 'coilsentry', 'mechhound', 'sparkmite', 'warmech', 'coilsentry', 'hullwing', 'eggling', 'sparkmite', 'mechhound', 'coilsentry'], kinds = []; for (let i = 0; i < CROWD; i++) kinds.push(KB[i % KB.length]);
      kinds.forEach((t, i) => { const a = i / kinds.length * 6.283, rr = 2.6 + (i % 3) * 1.3, q = D.X.freeSpot(me.x + Math.cos(a) * rr, me.y + Math.sin(a) * rr * 0.8, 0.5); if (q) { const m = D.X.spawnMon(t, q.x, q.y, { pack: 950, rift: true }); m.aggro = true; } });
      const mini = D.mons.find(m => m.boss && m.lesser), mi = mini ? { id: mini.bk.id, name: mini.bname, armed: !!mini.calMini, evil: !!mini.evil, r: +mini.r.toFixed(2), hp: Math.round(mini.maxhp), foeK: mini.foeK } : null;
      const ft = []; let lastT = performance.now(), frames = 0, maxZ = 0, maxE = 0, maxCp = 0, maxQ = 0; const t1 = performance.now(), seen = new Set(), cp0 = self.PERF ? PERF.cpAcc : 0, fl0 = NG && NG.stats ? NG.stats.frames : 0;
      while (performance.now() - t1 < 12000) { me.hp = D.ST.hp; await fr(); for (const z of D.zones) seen.add(z.kind + (z.drawn ? '*' : '')); }   // (a warm-up: pictures baked in play within the budget, attacks under way)
      // (then every attack shown at once, whatever the slow software frames let the AI reach: a sentry's beam live, a mite dashing, a
      // hull wing's bomb about to burst, a hound leaping)
      { const sen = D.mons.find(m => m.type === 'coilsentry' && !m.dead), to = sen && D.mons.find(m => !m.dead && m !== sen && !m.boss && !m.still && m.type !== 'coilsentry'); if (sen && to) { sen.link = { to, t: 6, max: 6.5 }; }
        const mite = D.mons.find(m => m.type === 'sparkmite' && !m.dead); if (mite) { mite.dashT = 3; mite.da = Math.atan2(me.y - mite.y, me.x - mite.x); }
        for (const z of D.zones) if (z.kind === 'warn' && z.src && z.src.type === 'hullwing') z.life = Math.min(z.life, 0.05);
        const hw = D.mons.find(m => m.type === 'hullwing' && !m.dead); if (hw) { hw.cd = 0; hw.x = me.x + 2; hw.y = me.y + 1; } }
      for (let i = 0; i < 6; i++) { me.hp = D.ST.hp; await fr(); }
      const t2 = performance.now(), cpB = self.PERF ? PERF.cpAcc : 0, flB = NG && NG.stats ? NG.stats.frames : 0, fx0 = JSON.parse(JSON.stringify(AB.stats.fx)); lastT = t2; while (performance.now() - t2 < 8000 || (frames < 30 && performance.now() - t2 < 120000)) { me.hp = D.ST.hp; await fr(); const tn = performance.now(); ft.push(tn - lastT); lastT = tn; frames++; if (self.PERF) maxCp = Math.max(maxCp, PERF.cpF); if (NG && NG.stats) maxQ = Math.max(maxQ, NG.stats.quads || 0); maxZ = Math.max(maxZ, D.zones.length); maxE = Math.max(maxE, D.eshots.length); for (const z of D.zones) seen.add(z.kind + (z.drawn ? '*' : '')); for (const b of D.eshots) if (b.ymk) seen.add('shot:' + b.ymk); for (const m of D.mons) { if (m.link && m.link.t < m.link.max - 0.8) seen.add('link'); if (m.dashT > 0) seen.add('dash'); } }
      const onScreen = D.mons.filter(m => !m.dead && Math.abs(m.x - me.x) < 6 && Math.abs(m.y - me.y) < 9).length; ft.sort((a, b) => a - b);
      const st = AB.stats;
      return { frames, onScreen, frameMs: { med: +ft[ft.length >> 1].toFixed(1), p90: +ft[Math.floor(ft.length * 0.9)].toFixed(1) }, baked: st.baked - base.baked, prov: st.prov, fx: Object.fromEntries(Object.entries(st.fx).map(([k, v]) => [k, v - base.fx[k]])), fxOn: AB.fxOn(), active: AB.active(), seen: [...seen].sort(), maxZ, maxE, mini: mi, mem: AB.mem(), gl: { flushesPerFrame: NG && NG.stats ? +((NG.stats.frames - flB) / frames).toFixed(2) : null, copiesPerFrame: self.PERF ? +((PERF.cpAcc - cpB) / frames).toFixed(2) : null, maxCopies: maxCp, maxQuads: maxQ, glm: typeof GLM !== 'undefined' ? GLM.stats : null, fxPerFrame: Object.fromEntries(Object.entries(AB.stats.fx).map(([k, v]) => [k, +((v - fx0[k]) / frames).toFixed(2)])) }, foeK: D.F.rift.foeK, gpuBuffers: AB.gpuBuffers, miniBake: self.EVIL_MINI && EVIL_MINI.bakeStats ? EVIL_MINI.bakeStats() : null }; }, [S, +(process.env.CROWD || 24)]);
    console.log('stage ' + S + ' load ' + load + 'ms ' + JSON.stringify(r));
    if (MODE === 'gl') { ok(r.active && (r.baked > 0 || r.mem.n > 0), `stage ${S}: the brood baked on the GPU (${r.baked} in play, ${r.mem.n} held, ${r.mem.MB} MB)`); ok(r.fx.passes > 0 && r.fx.tells + r.fx.shots > 0, `stage ${S}: attacks painted on the GPU (${JSON.stringify(r.fx)})`); }
    else ok(!r.active && r.baked === 0, `stage ${S}: no WebGL, the 2D art (baked ${r.baked})`);
    ok(r.mini ? r.mini.armed && r.mini.evil : true, `stage ${S}: the mini is a giant evil Cocopet: ${JSON.stringify(r.mini)}`);
    ok(r.foeK && r.foeK.mon >= 2.5 && r.foeK.mini >= 1 /* v472 lead: minis kept at 1 on purpose */ && r.foeK.dmg >= 2.5 && r.foeK.boss >= 7, `stage ${S}: foeK ${JSON.stringify(r.foeK)}`);
    await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); }); await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ bufs: window.YUG_BROOD.gpuBuffers, mem: window.YUG_BROOD.mem().n, rel: window.YUG_BROOD.stats.released }));
    ok(after.bufs === 0 && after.mem === 0, `stage ${S}: GPU buffers ${after.bufs} and pictures ${after.mem} after leaving (released ${after.rel})`);
  }
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors.slice(0, 4)));
  console.log(fails ? fails + ' failed' : 'all passed'); await browser.close(); process.exit(fails ? 1 : 0);
})();
