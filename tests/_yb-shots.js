// (v472 YB) The Yuggoth Engine's bosses in their fights at DPR 3 (390 x 844): the GPU models and their light (window.__AUR_GL = 1 on a
// software rasteriser) or the 2D ones (GL=0); each boss woken, its acts forced in turn, a shot at each tell, a blow, a stun, its second
// form; GPU counters (the pass's size, triangles, draw calls, the pose's ms) and the GPU buffers left after the stage is let go.
// -> shots/v472-YB/fight-<gpu|2d>[-low]-<boss>-<n>-<what>.png   usage: HTML=... [GL=0] [LOW=1] [DPR=3] node tests/_yb-shots.js khaal ixvorra nyarzhul
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT ? path.resolve(process.env.OUT) : path.resolve(__dirname, '../shots/v472-YB'); fs.mkdirSync(OUT, { recursive: true });
const gl = process.env.GL !== '0', low = process.env.LOW === '1', dpr = +(process.env.DPR || 3), tag = (gl ? 'gpu' : '2d') + (low ? '-low' : '');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true }); const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Khaal|Ixvorra|Nyarzhul|YUG3|GLM|Nidhogg GFX/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(([gl, low]) => { const P = window.__pp; window.__AUR_GL = gl ? 1 : 0; if (gl) window.__NG_GL = 1; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 62; P.st.dun.best = 130; setInterval(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) g.hidden = true; }, 200); if (low) P.st.lowFx = true;
    try { for (const r of P.RIFTS || []) { P.st.rift = P.st.rift || {}; } } catch (e) { } }, [gl, low]);
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; const t0 = performance.now(); let n = 0; while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); n++; if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } return n; }, secs);
  const frames = n => page.evaluate(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  let k = 0; const shot = async (id, what) => { const f = path.join(OUT, `fight-${tag}-${id}-${String(k++).padStart(2, '0')}-${what}.png`); await page.screenshot({ path: f }); console.log('  shot', path.basename(f)); };
  const stats = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, MD = window.__pp.FIEND_DEFS[D.F.fiend.id].MODEL; const P = window.__pp.PERF; return { info: MD && MD.info ? MD.info() : null, buffers: MD && MD.kit ? MD.kit.stats().buffers : null, act: D.g.boss && D.g.boss.act, ybGL: !!D.FD.FX.mem.ybGL, perf: P && P.stats ? P.stats(3000) : null }; });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['khaal', 'ixvorra', 'nyarzhul'];
  const SEQ = { khaal: [['plate', 'stalk', 1.2], ['slam', 'stalk', 0.6], ['sweep', 'stalk', 0.5], ['spit', 'stalk', 0.7]], ixvorra: [['web', 'bag', 1.0], ['surge', 'bag', 1.0], ['lash', 'bag', 0.6], ['overload', 'bag', 2.0]], nyarzhul: [['pulse', 'beat', 1.6], ['pistons', 'beat', 2.4], ['lash', 'beat', 1.2], ['clamp', 'beat', 1.0], ['overload', 'beat', 1.5]] };
  const SEQ2 = { khaal: [['hop', 'stalk', 1.6], ['devour', 'stalk', 2.0]], ixvorra: [['spokes', 'bag', 2.4], ['web', 'bag', 3.0]], nyarzhul: [['flood', 'beat', 3.0], ['pistons', 'beat', 2.4]] };
  for (const id of ids) { k = 0; const t0 = Date.now();
    const idx = await page.evaluate(id => window.__pp.RIFT_BY_ID.yuggoth.stages.findIndex(s => s.boss === id), id);
    await page.evaluate(idx => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('yuggoth', idx); }, idx);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 }); await run(0.3);
    await page.evaluate(id => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + (id === 'nyarzhul' ? 9 : 5); }, id);
    await run(1.2); await shot(id, 'enter'); await run(4); await shot(id, 'awake');
    const force = (act, idle, secs) => page.evaluate(async ([act, idle, secs, id]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.stunT > 0) b.stunT = 0; if (b.act === act) return { ok: true, act: b.act };
        if (idle === 'bag') { M.bag = [act]; if (b.act === 'hover' || b.act === 'rest') { b.act = 'hover'; b.actT = 99; } }
        else if (idle === 'beat') { M.nextSig = act; if (b.act === 'beat') b.actT = 99; }
        else { M.nextAct = act; if (b.act === idle) b.actT = 99; }
        if (id !== 'nyarzhul' && Math.hypot(D.me.x - b.x, D.me.y - b.y) > 7) { D.me.x = b.x + 2.5; D.me.y = b.y + 3; } }
      return { ok: false, act: b.act }; }, [act, idle, secs, id]);
    for (const [act, idle, wt] of SEQ[id]) { const r = await force(act, idle, 40); console.log(' ', id, act, JSON.stringify(r)); if (r.ok) { await run(wt); await shot(id, act); } }
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await frames(2); await shot(id, 'hit');
    // a stun (the weak point bared)
    await page.evaluate(id => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 5; if (id === 'ixvorra') M.open = 0; }, id); await run(1.4); await shot(id, 'stunned'); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(1.5);
    // its second form
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.hp = b.maxhp * 0.45; }); await run(5); await shot(id, 'phase2');
    for (const [act, idle, wt] of SEQ2[id]) { const r = await force(act, idle, 40); console.log(' ', id, act, JSON.stringify(r)); if (r.ok) { await run(wt); await shot(id, act + '2'); } }
    const s = await stats(); console.log(' ', id, 'stats', JSON.stringify(s), ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  // the GPU buffers left once the rift is left and a new stage made
  await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('yuggoth', 0); }); await run(2);
  const left = await page.evaluate(() => { const MD = window.__pp.FIEND_DEFS.khaal.MODEL; return MD && MD.kit ? MD.kit.stats() : null; }); console.log('after a new stage', JSON.stringify(left && { buffers: left.buffers, pics: left.pics }));
  console.log('errors', errs.length, errs.slice(0, 6)); await b.close();
})();
