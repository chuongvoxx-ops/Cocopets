// (v470 AM) Rift 05's brood on the GPU, checked in play: each given stage started, its brood (and the mini) made to attack round the
// pet for a few seconds; reports what was baked and painted (AUR_BROOD.stats: pictures baked, provisional 2D, the attack layer's passes
// and quads, shots painted on the engine's pass), the GPU passes and copies (FGFX/GLM counters) per frame in the busiest moment, the
// sprite memory, the mini's look (armed giant evil Cocopet), page errors, and after leaving the stage that every model's GPU buffers are
// let go. MODE=nogl launches the browser without WebGL (the 2D fallback); LOWFX=1 turns on Fewer effects.
// usage: HTML=<build> [MODE=gl|nogl] [LOWFX=1] node tests/_am-check.js [stages 0,3,7]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const MODE = process.env.MODE || 'gl', STAGES = (process.argv[2] || '0,3,7').split(',').map(Number);
  const args = MODE === 'nogl' ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /AUR_BROOD/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(m => { window.__AUB_GL = m === 'gl' ? 1 : 0; window.__AUB_NOBUDGET = 1; if (m === 'gl') window.__NG_GL = 1; }, MODE);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-am.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  const has = await page.evaluate(lf => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 52; P.st.unlockAll = true; if (lf) P.st.lowFx = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre']) P.riftState().seals[id] = 1; P.st.dun.best = 120; return !!window.AUR_BROOD; }, !!process.env.LOWFX);
  ok(has, 'AUR_BROOD loaded');
  for (const S of STAGES) {
    const t0 = Date.now();
    await page.evaluate(S => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', S); }, S);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); const load = Date.now() - t0;
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const r = await page.evaluate(async S => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, AB = window.AUR_BROOD, fr = () => new Promise(r => requestAnimationFrame(r));
      const base = JSON.parse(JSON.stringify(AB.stats)), NG = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX;
      for (const m of D.mons) if (!m.boss && Math.hypot(m.x - me.x, m.y - me.y) < 12) { m.x += 40; m.y += 40; }
      const kinds = S === 7 ? ['yeti', 'icegolem', 'rimescuttler', 'veilray', 'frostlantern', 'yeti'] : ['rimescuttler', 'veilray', 'frostlantern', 'rimescuttler', 'veilray', 'rimescuttler'];
      kinds.forEach((t, i) => { const a = i / kinds.length * 6.283, q = D.X.freeSpot(me.x + Math.cos(a) * 3.2, me.y + Math.sin(a) * 3.2, 0.5); if (q) { const m = D.X.spawnMon(t, q.x, q.y, { pack: 950, rift: true }); m.aggro = true; } });
      const mini = D.mons.find(m => m.boss && m.lesser), mi = mini ? { id: mini.bk.id, name: mini.bname, armed: !!mini.calMini, evil: !!mini.evil, r: +mini.r.toFixed(2), hp: Math.round(mini.maxhp), foeK: mini.foeK } : null;
      let frames = 0, maxZ = 0, maxE = 0, maxCp = 0, maxQ = 0; const t1 = performance.now(), seen = new Set(), cp0 = self.PERF ? PERF.cpAcc : 0, fl0 = NG && NG.stats ? NG.stats.frames : 0;
      while (performance.now() - t1 < 6000) { me.hp = D.ST.hp; await fr(); frames++; if (self.PERF) maxCp = Math.max(maxCp, PERF.cpF); if (NG && NG.stats) maxQ = Math.max(maxQ, NG.stats.quads || 0); maxZ = Math.max(maxZ, D.zones.length); maxE = Math.max(maxE, D.eshots.length); for (const z of D.zones) seen.add(z.kind + (z.drawn ? '*' : '')); for (const b of D.eshots) if (b.amk) seen.add('shot:' + b.amk); }
      const st = AB.stats;
      return { frames, baked: st.baked - base.baked, prov: st.prov, fx: Object.fromEntries(Object.entries(st.fx).map(([k, v]) => [k, v - base.fx[k]])), fxOn: AB.fxOn(), active: AB.active(), seen: [...seen].sort(), maxZ, maxE, mini: mi, mem: AB.mem(), gl: { flushesPerFrame: NG && NG.stats ? +((NG.stats.frames - fl0) / frames).toFixed(2) : null, copiesPerFrame: self.PERF ? +((PERF.cpAcc - cp0) / frames).toFixed(2) : null, maxCopies: maxCp, maxQuads: maxQ, glm: typeof GLM !== 'undefined' ? GLM.stats : null }, foeK: D.F.rift.foeK, gpuBuffers: AB.gpuBuffers }; }, S);
    console.log('stage ' + S + ' load ' + load + 'ms ' + JSON.stringify(r));
    if (MODE === 'gl') { ok(r.active && (r.baked > 0 || r.mem.n > 0), `stage ${S}: the brood baked on the GPU (${r.baked} in play, ${r.mem.n} held, ${r.mem.MB} MB)`); ok(r.fx.passes > 0 && r.fx.tells + r.fx.shots > 0, `stage ${S}: attacks painted on the GPU (${JSON.stringify(r.fx)})`); }
    else ok(!r.active && r.baked === 0, `stage ${S}: no WebGL, the 2D art (baked ${r.baked})`);
    ok(r.mini ? r.mini.armed && r.mini.evil : true, `stage ${S}: the mini is a giant evil Cocopet: ${JSON.stringify(r.mini)}`);
    ok(r.foeK && r.foeK.mon === 2.5 && r.foeK.mini === 2.5 && r.foeK.dmg === 2.5 && r.foeK.boss === 7, `stage ${S}: foeK ${JSON.stringify(r.foeK)}`);
    await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); }); await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ bufs: window.AUR_BROOD.gpuBuffers, mem: window.AUR_BROOD.mem().n, rel: window.AUR_BROOD.stats.released }));
    ok(after.bufs === 0 && after.mem === 0, `stage ${S}: GPU buffers ${after.bufs} and pictures ${after.mem} after leaving (released ${after.rel})`);
  }
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors.slice(0, 4)));
  console.log(fails ? fails + ' failed' : 'all passed'); await browser.close(); process.exit(fails ? 1 : 0);
})();
