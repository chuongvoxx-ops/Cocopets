// (v470 AB) The Pale Aurora's bosses in their fights at DPR 3 (390 x 844): the GPU models and their light (window.__AUR_GL = 1 on a software
// rasteriser) or the 2D ones (GL=0); each boss woken, its acts forced in turn, a shot at each tell, a stun, its second form; GPU counters
// (passes, triangles, draw calls, FGFX quads) and the GPU buffers left after the stage is let go. -> shots/v470-AB/fight-<boss>-<n>-<what>.png
// usage: HTML=... [GL=0] [LOW=1] [DPR=3] node tests/_ab-shots.js thul nivora ahuul
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT ? path.resolve(process.env.OUT) : path.resolve(__dirname, '../shots/v470-AB'); fs.mkdirSync(OUT, { recursive: true });
const gl = process.env.GL !== '0', low = process.env.LOW === '1', dpr = +(process.env.DPR || 3), tag = (gl ? 'gpu' : '2d') + (low ? '-low' : '');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true }); const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Thul|Nivora|Ahuul|AUR3|GLM|Nidhogg GFX/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(([gl, low]) => { const P = window.__pp; window.__AUR_GL = gl ? 1 : 0; if (gl) window.__NG_GL = 1; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 52; P.st.dun.best = 120; setInterval(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) g.hidden = true; }, 200); if (low) P.st.lowFx = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre']) P.riftState().seals[id] = 1; }, [gl, low]);
  if (gl) { const t0 = Date.now(); await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.thul, K = P.DunFiend.KIT, cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), m = { x: 0, y: 0, t: 1, flash: 0 }, FX = { K, mem: {}, m, S: { tele: [], weak: {} }, sx: v => v, sy: v => v };
      try { D.draw(c, FX, m, 32, 40, 4, 1); } catch (e) { } try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F && F.usable()) { const Q = F.begin(c, null); Q.quad(540, 32, 32, 10, 0, 0, 10, '#FFFFFF', 1, 0.5, 1, 0); F.flush(c); } } catch (e) { } }); console.log('(shaders warmed in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); }
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; const t0 = performance.now(); let n = 0; while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); n++; if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } return n; }, secs);
  const frames = n => page.evaluate(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  let k = 0; const shot = async (id, what) => { const f = path.join(OUT, `fight-${tag}-${id}-${String(k++).padStart(2, '0')}-${what}.png`); await page.screenshot({ path: f }); const bx = await page.evaluate(() => { try { const B = window.__pp.arc.game._dbg.FD.FX.mem.nvBox; return B ? B.map(v => Math.round(v)) : null; } catch (e) { return null; } }); console.log('  shot', path.basename(f), bx ? 'box ' + (bx[2] - bx[0]) + 'x' + (bx[3] - bx[1]) + ' css px at ' + bx[0] + ',' + bx[1] + ' (T ' + bx[4] + ')' : ''); };
  const stats = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, MD = window.__pp.FIEND_DEFS[D.F.fiend.id].MODEL; const st = MD && MD.kit ? MD.kit.stats() : null; const P = typeof window.__pp.PERF !== 'undefined' ? window.__pp.PERF : null; return { st, act: D.g.boss && D.g.boss.act }; });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['thul', 'nivora', 'ahuul'];
  for (const id of ids) { k = 0; const t0 = Date.now();
    const idx = await page.evaluate(id => window.__pp.RIFT_BY_ID.aurora.stages.findIndex(s => s.boss === id), id);
    await page.evaluate(idx => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', idx); }, idx);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 }); await run(0.3);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 5; });
    await run(1.0); await shot(id, 'enter'); await run(3.5); await shot(id, 'awake');
    const force = (act, field, secs) => page.evaluate(async ([act, field, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.stunT > 0) b.stunT = 0; if (b.act === act) return { ok: true, act: b.act };
        if (field === 'bag') { M.bag = [act]; if (b.act === 'hover' || b.act === 'rest') { b.act = 'hover'; b.actT = 99; } }
        else if (field === 'sig') { M.nextSig = act; if (b.act === 'glide') b.actT = 99; }
        else { M.nextAct = act; if (b.act === field) b.actT = 99; }
        if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 7) { D.me.x = b.x + 2.5; D.me.y = b.y + 3; } }
      return { ok: false, act: b.act }; }, [act, field, secs]);
    const seq = id === 'thul' ? [['collar', 'shuffle', 1.6], ['hail', 'shuffle', 1.2], ['stomp', 'shuffle', 0.4]] : id === 'nivora' ? [['crosswind', 'bag', 2.4], ['shear', 'bag', 1.2], ['pass', 'bag', 0.8], ['gaze', 'bag', 1.0]] : [['sweep', 'sig', 0.9], ['starfall', 'sig', 0.7], ['breath', 'sig', 2.2]];
    for (const [act, f, wt] of seq) { const r = await force(act, f, 40); console.log(' ', id, act, JSON.stringify(r)); if (r.ok) { await run(wt); await shot(id, act); } }
    if (id === 'nivora') {   // (v470d AB) the whole of it in frame: the banner gone, the pet below it (the camera follows the pet)
      for (let i = 0; i < 2; i++) { await run(i ? 1.2 : 3.0); await page.evaluate(i => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + (i ? 2.5 : 0.5); D.me.y = b.y + 5.5; }, i); await run(0.6); await shot(id, 'full' + i); } }
    // a blow, then its second form
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await frames(2); await shot(id, 'hit');
    if (id === 'thul') { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; }); await run(4); await shot(id, 'ram');
      const h = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !(M.hatch && M.hatch.age > 2.0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return !!M.hatch; }); if (h) await shot(id, 'cracks');
      await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !M.hatched) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }); await run(0.4); await shot(id, 'hatch'); await run(2.5); await shot(id, 'wasp');
      for (const [act, wt] of [['lunge', 1.0], ['sweep', 0.7], ['gale', 2.0], ['dive', 1.6]]) { const r = await force(act, 'hover', 40); console.log('  thul', act, JSON.stringify(r)); if (r.ok) { await run(wt); await shot(id, act); } } }
    if (id === 'ahuul') { const r = await force('rise', 'sig', 60); if (r.ok) { await run(3); await shot(id, 'rise'); } }
    const s = await stats(); console.log(' ', id, 'stats', JSON.stringify(s), ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  // the GPU buffers left once the rift is left and a new stage made
  await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', 0); }); await run(2);
  const left = await page.evaluate(() => { const MD = window.__pp.FIEND_DEFS.thul.MODEL; return MD && MD.kit ? MD.kit.stats() : null; }); console.log('after a new stage', JSON.stringify(left && { buffers: left.buffers, pics: left.pics }));
  console.log('errors', errs.length, errs.slice(0, 6)); await b.close();
})();
