// Frame cost of a ridden ult at its heaviest moments (riding with every move going, then the finisher), measured on the
// real game loop: the game's draw and update time per frame (ms), median and 95th percentile, at a phone viewport
// (390 x 844, DPR 3) and a desktop one (1440 x 900, DPR 1). GPU=1 forces the GPU paths (software GL in this browser: the
// numbers compare builds and paths with each other, they are not a phone's).
// usage: HTML=test-xyz.html KEYS=nidhogg,beastmachine,sportscar GPU=0|1 node tests/_perf-veh.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const ULT = { nidhogg: ['fire', '_nidhogg', 'fly'], beastmachine: ['thunder', '_beast', 'ride'], sportscar: ['light', '_sportscar', 'drive'], belladonna: ['wind', '_belladonna', 'fly'], jaws: ['water', '_jaws', 'fly'], fenrir: ['ice', '_fenrir', 'ride'], susanoo: ['dark', '_susanoo', 'air'] };
(async () => {
  const keys = (process.env.KEYS || 'nidhogg,beastmachine,sportscar').split(','), GPU = process.env.GPU === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const VPS = process.env.VPS ? process.env.VPS.split(';').map(v => v.split(',').map(Number)) : [[390, 844, 3], [1440, 900, 1]];
  for (const [vw, vh, dpr] of VPS) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
    if (GPU) await page.addInitScript(() => { for (const f of ['__SUSANO_GL', '__FENRIR_GL', '__BELLA_GL', '__JAWS_GL', '__SM_GL', '__BM_GL', '__JAWS_FX_GL', '__NIDHOGG_GL', '__NG_GL', '__NID_GL', '__BEAST_GL', '__SC_GL', '__CAR_GL', '__X_GL']) window[f] = 1; });
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Perf'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
    for (const key of keys) { const [el, gk, ready] = ULT[key];
      await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(1500);
      const r = await page.evaluate(async ([key, el, gk, ready]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, raf = () => new Promise(res => requestAnimationFrame(res));
        D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + key], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7 })); D.me.mp = 999; D.g.cdU = 0;
        for (const m of D.mons) { m.hp = m.maxhp = 1e9; m.dmg = 0; }
        const d0 = G.draw, u0 = G.update, T = { draw: [], upd: [] }; let rec = false;
        G.draw = function (c) { const t = performance.now(); const r = d0.call(this, c); if (rec) T.draw.push(performance.now() - t); return r; };
        G.update = function (dt) { const t = performance.now(); const r = u0.call(this, dt); if (rec) T.upd.push(performance.now() - t); return r; };
        const keep = () => { D.me.inv = 1; D.me.hp = D.ST.hp; D.me.mp = 999; };
        rec = true; D.useUlt(); let S = null; const t0 = performance.now(); let f30 = null; while (performance.now() - t0 < 20000) { await raf(); keep(); S = D.g[gk]; if (f30 == null && T.draw.length >= 30) f30 = { max: +Math.max(...T.draw).toFixed(1), first: +T.draw.slice(0, 3).map(v => v.toFixed(1)).join('/').split('/')[0] }; if (S && S.phase === ready) break; } rec = false; const summon = { max: +Math.max(0, ...T.draw).toFixed(1), first3: T.draw.slice(0, 3).map(v => +v.toFixed(1)), n: T.draw.length }; T.draw = []; T.upd = [];
        if (!S) { G.draw = d0; G.update = u0; return { err: 'no session' }; }
        for (let i = 0; i < 40; i++) { await raf(); keep(); }   /* (warm) */
        const stat = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? { med: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), n: s.length } : null; };
        rec = true; let k = 0; const t1 = performance.now(); while (performance.now() - t1 < 5000) { await raf(); keep(); if (++k % 20 === 0) D.dodge(); if (k % 45 === 0) D.useStrong(k % 90 ? 'strong' : 'strong2'); }
        rec = false; const ride = { draw: stat(T.draw), upd: stat(T.upd), fps: +(T.draw.length / 5).toFixed(1) }; T.draw = []; T.upd = [];
        S.charge = 1; await raf(); D.useUlt(); rec = true; const t2 = performance.now(); while (performance.now() - t2 < 6000 && !S.released) { await raf(); keep(); }
        rec = false; const fin = { draw: stat(T.draw), upd: stat(T.upd), fps: +(T.draw.length / ((performance.now() - t2) / 1000)).toFixed(1) };
        const MD0 = key === 'beastmachine' ? ((P.ELEM_IMPL.thunder.ult.beastmachine.__dbg || {}).GL || null) : P[{ nidhogg: 'nidhogg', susanoo: 'susano', fenrir: 'fenrir', belladonna: 'belladonna', jaws: 'jaws' }[key]] || null, MD = MD0 && typeof MD0.on === 'function' ? Object.assign({ gl: MD0.on() }, { stats: MD0.stats }) : MD0; G.draw = d0; G.update = u0; return { ride, fin, summon, gl: MD ? !!MD.gl : null, mst: MD && MD.stats ? { meshMs: MD.stats.meshMs, ms: MD.stats.ms, tris: MD.stats.tris, calls: MD.stats.calls } : null }; }, [key, el, gk, ready]);
      console.log(`${vw}x${vh}@${dpr} ${GPU ? 'gpu' : 'default'} ${key.padEnd(13)} ` + (r.err ? r.err : `gl ${r.gl} summon first ${r.summon.first3.join('/')} max ${r.summon.max} ms | ride draw ${r.ride.draw.med}/${r.ride.draw.p95} ms upd ${r.ride.upd.med}/${r.ride.upd.p95} ms (${r.ride.fps} fps) | finisher draw ${r.fin.draw && r.fin.draw.med}/${r.fin.draw && r.fin.draw.p95} ms upd ${r.fin.upd && r.fin.upd.med}/${r.fin.upd && r.fin.upd.p95} ms (${r.fin.fps} fps) | ${JSON.stringify(r.mst)}`));
    }
    await page.close();
  }
  await browser.close();
})();
