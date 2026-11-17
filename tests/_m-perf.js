// v398 M: the frame cost of the corrupted Cocopets (EVIL_MINI) among a crowd of brood, reproducible and headless.
// Scenarios (393 x 852): Belfry D2 (stage 3, level 14) with its guardian awake and the live cap's 36 brood round the pet;
// Caldera Glass Heart (stage 6, level 10) the same. Each on the GPU path (PetGL + FGFX, swiftshader forced on) and the 2D
// path (no PetGL, no FGFX). The game's rAF loop is held and frames are stepped by hand (update 1/60 + draw + a 1-pixel read
// so the GPU work is counted), so the numbers compare run to run (swiftshader: read them relatively).
// Reports per scenario and path: median / p90 ms per frame; PetGL renders and their ms; FGFX flushes and their ms; mini
// draws (RiftEvil.draw) ms; brood sprite cache misses per second; and the first-fight hitch (the first 60 frames after the
// stage starts, the guardian waking and the crowd arriving at once: max frame ms and frames over 50 ms).
// usage: HTML=test-perfM.html node tests/_m-perf.js [bel|cal ...]   env: PATHS=gpu,2d  N=120 (measured frames)  TAG=before
process.env.HTML = process.env.HTML || 'test.html';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const SCN = { bel: { rift: 'belfry', stage: 3, lvl: 14, name: 'Belfry D2' }, cal: { rift: 'caldera', stage: 6, lvl: 10, name: 'Caldera Glass Heart' } };
(async () => {
  const which = process.argv.slice(2).length ? process.argv.slice(2) : ['bel', 'cal'], paths = (process.env.PATHS || 'gpu,2d').split(','), N = +(process.env.N || 40), FIRST = +(process.env.FIRST || 30), out = [];
  for (const k of which) for (const pth of paths) { const S = SCN[k];
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, hasTouch: true }); page.setDefaultTimeout(600000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(gpu => { if (gpu) { window.__NG_GL = 1; window.__forcePetGL = 1; window.__CAL_GL = 1; } else { window.__NG_GL = 0; window.__CAL_GL = 0; window.__calMini2D = 1; window.__noPetGL = 1; } }, pth === 'gpu');
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
    await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
    await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = o.lvl; for (const p of P.partyPets()) p.dlv = o.lvl; P.st.dun.best = 120; for (const id of ['caldera', 'belfry']) P.riftState().seals[id] = 1; P.st.dun.seen = P.st.dun.seen || {}; for (const t in P.MON) P.st.dun.seen[t] = 1; P.openMap(); P.dun.setMapTab('rift', true); }, S);
    // counters: PetGL renders, FGFX flushes, mini draws, brood sprite cache misses (each with its time)
    await page.evaluate(() => { const P = window.__pp, C = window.__perfM = { petgl: 0, petglMs: 0, flush: 0, flushMs: 0, mini: 0, miniMs: 0, miss: 0 };
      const wrap = (o, k, ck, mk) => { const f = o && o[k]; if (typeof f !== 'function' || f.__pm) return; const w = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { C[ck]++; C[mk] += performance.now() - t; } }; w.__pm = 1; o[k] = w; };
      wrap(P.PetGL, 'draw', 'petgl', 'petglMs'); C.builds = 0; try { const CA = P.PetGL.cache, s1 = CA.set.bind(CA); CA.set = (k, v) => { C.builds++; return s1(k, v); }; } catch (e) {} const NM = self.NIDHOGG_MOVES; if (NM && NM.FGFX) wrap(NM.FGFX, 'flush', 'flush', 'flushMs'); wrap(P.RiftEvil, 'draw', 'mini', 'miniMs');
      const mc = P.DunArt.monCache, s0 = mc.set.bind(mc); let lastDel = null; const d0 = mc.delete.bind(mc); mc.delete = k => { lastDel = k; return d0(k); };
      mc.set = (k, v) => { if (!mc.has(k) && lastDel !== k) C.miss++; lastDel = null; return s0(k, v); }; });   // (a key put back just after it was taken out is a re-order (v398 M's kept-in-use order), not a miss)
    // the stage, through its loading screen (timed)
    const tl = Date.now();
    await page.evaluate(([id, st]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, st); }, [S.rift, S.stage]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); const loadMs = Date.now() - tl;
    // the loop held from here: every frame is ours
    await page.evaluate(() => { window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; window.__pp.beginPlay(); });
    const r = await page.evaluate(async ([N, FIRST]) => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game, me = D.me, C = window.__perfM, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d');
      const tick = () => new Promise(r => setTimeout(r, 0));   // (the event loop turns between frames: PetGL builds its layers in promises)
      const frame0 = () => { const t = performance.now(); U.update(1 / 60); c.save(); U.draw(c); c.restore(); c.getImageData(0, 0, 1, 1); return performance.now() - t; }, frame = async () => { const v = frame0(); await tick(); return v; };
      // (the stage starts as the player would meet it: the guardian woken, the crowd of the live cap round the pet at once)
      for (let i = 0; i < 4; i++) await frame();
      const g = D.mons.find(m => m.calMini && !m.dead) || D.mons.find(m => m.boss && !m.dead); if (!g) return { err: 'no guardian' };
      const home = (g.calMini && g.calMini.home) || g, X = D.X; let best = null; for (let i = 0; i < 24 && !best; i++) { const a = Math.PI / 2 + (i % 2 ? 1 : -1) * Math.floor((i + 1) / 2) * 0.26, x = home.x + Math.cos(a) * 4.5, y = home.y + Math.sin(a) * 4.5; if (D.walkAt(Math.floor(x), Math.floor(y))) best = { x, y }; } best = best || X.walkPoint(home.x, home.y + 4.5, null);
      me.x = best.x; me.y = best.y;
      const live = D.mons.filter(m => !m.dead && !m.boss && !m.calMini); let k = 0; for (const m of live.slice(0, 36)) { for (let tr = 0; tr < 8; tr++) { const a = (k * 2.39 + tr * 0.7), rr = 2.2 + (k % 6) * 0.75, x = me.x + Math.cos(a) * rr, y = me.y + Math.sin(a) * rr * 0.8; if (D.walkAt(Math.floor(x), Math.floor(y))) { m.x = x; m.y = y; break; } } m.aggro = true; k++; }
      const leaders = live.filter(m => m.calLeader).length;
      Object.keys(C).forEach(q => { C[q] = 0; });
      const first = []; for (let i = 0; i < FIRST; i++) first.push(await frame());
      // (until its GPU layers are in, at most 200 frames: then the steady state)
      let w = 0; while (w++ < 12 && g.calMini && !g.calMini.gl && window.__NG_GL === 1) { await frame(); for (let j = 0; j < 30 && !(g.evil && P.PetGL.box(g.evil.form, true)); j++) await new Promise(r => setTimeout(r, 100)); }
      for (let i = 0; i < 10; i++) await frame();
      // (keep the crowd and the guardian on the pet: nothing dies, the god mode holds the pet)
      const b0 = C.builds; Object.keys(C).forEach(q => { C[q] = 0; }); C.builds = 0; const ts = [];
      for (let i = 0; i < N; i++) { if (i % 30 === 0) for (const m of D.mons) if (!m.dead && !m.boss && Math.hypot(m.x - me.x, m.y - me.y) > 8) { m.x = me.x + (Math.random() - 0.5) * 6; m.y = me.y + (Math.random() - 0.5) * 4; if (!D.walkAt(Math.floor(m.x), Math.floor(m.y))) { m.x = me.x; m.y = me.y + 1; } } ts.push(await frame()); }
      const srt = a => a.slice().sort((x, y) => x - y), q = (a, p) => +srt(a)[Math.min(a.length - 1, Math.floor(a.length * p))].toFixed(1);
      // (where the time goes: the engine's own pieces, flushed)
      D.g.prof = {}; for (let i = 0; i < 10; i++) await frame(); const PR = D.g.prof; D.g.prof = null; const pieces = Object.fromEntries(Object.entries(PR).map(([a, b]) => [a, +(b / 10).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 8));
      const perF = v => +(v / N).toFixed(2);
      return { live: D.mons.filter(m => !m.dead && !m.boss).length, near: D.mons.filter(m => !m.dead && Math.hypot(m.x - me.x, m.y - me.y) < 9).length, leaders, guardAwake: !!g.aggro, gl: !!(g.calMini && g.calMini.gl), fx: !!(g.calMini && g.calMini.gpuFx),
        med: q(ts, 0.5), p90: q(ts, 0.9), firstMax: +Math.max(...first).toFixed(1), firstOver50: first.filter(t => t > 50).length, firstMed: q(first, 0.5),
        petglPerF: perF(C.petgl), petglMs: perF(C.petglMs), flushPerF: perF(C.flush), flushMs: perF(C.flushMs), miniPerF: perF(C.mini), miniMs: perF(C.miniMs), missPerS: +(C.miss / (N / 60)).toFixed(1), builds: C.builds, pieces }; }, [N, FIRST]);
    const row = Object.assign({ scn: S.name, path: pth, loadMs }, r, { errors: errors.length }); out.push(row);
    console.log(JSON.stringify(row)); if (errors.length) console.log('  errors', errors.slice(0, 3));
    await browser.close(); }
  console.log('\nscenario              path  ms/frame med  p90   first max (>50ms)  PetGL/f  ms   FGFX/f  ms   mini ms  miss/s  load ms');
  for (const r of out) console.log(`${r.scn.padEnd(21)} ${r.path.padEnd(4)}  ${String(r.med).padStart(8)} ${String(r.p90).padStart(5)}  ${String(r.firstMax).padStart(8)} (${r.firstOver50})       ${String(r.petglPerF).padStart(5)} ${String(r.petglMs).padStart(5)}  ${String(r.flushPerF).padStart(5)} ${String(r.flushMs).padStart(5)}  ${String(r.miniMs).padStart(6)}  ${String(r.missPerS).padStart(6)}  ${r.loadMs}`);
  if (process.env.TAG) fs.writeFileSync(path.resolve(__dirname, `../shots/m-perf-${process.env.TAG}.json`), JSON.stringify(out, null, 1));
  process.exit(out.some(r => r.errors || r.err) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
