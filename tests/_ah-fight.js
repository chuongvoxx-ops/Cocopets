// (v470b AH) Ahuul's rebuilt model in its fight at DPR 3 (390 x 844): woken, the Horizon Sweep (the fin lifted, then the stroke: the
// tendrils trailing), the bow, The Sky Descends (overhead) and the ice anchor broken (the throat bared), a blow; the model's cost at
// both detail levels (triangles, draw calls, the picture, ms) and the GL layers copied a frame; the GPU buffers left after a new stage.
// usage: HTML=... [GL=0] [LOW=1] [OUT=shots/v470b-AH] node tests/_ah-fight.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(process.env.OUT || path.resolve(__dirname, '../shots/v470b-AH')); fs.mkdirSync(OUT, { recursive: true });
const gl = process.env.GL !== '0', low = process.env.LOW === '1', tag = (gl ? 'gpu' : '2d') + (low ? '-low' : '');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true }); const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Ahuul|AUR3|GLM|Nidhogg GFX/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(([gl, low]) => { const P = window.__pp; window.__AUR_GL = gl ? 1 : 0; if (gl) window.__NG_GL = 1; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 52; P.st.dun.best = 120; setInterval(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) g.hidden = true; }, 200); if (low) P.st.lowFx = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre']) P.riftState().seals[id] = 1; }, [gl, low]);
  if (gl) { const t0 = Date.now(); await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.ahuul, K = P.DunFiend.KIT, cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), m = { x: 0, y: 0, t: 1, flash: 0 }, FX = { K, mem: { demo: 1 }, m, S: { tele: [], weak: {} }, C: { x: 0, y: 8 }, me: { x: 0, y: 6 }, sx: v => v, sy: v => v };
      try { D.draw(c, FX, m, 32, 40, 2, 1); } catch (e) { } }); console.log('(shaders warmed in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); }
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); let n = 0; while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); n++; if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } return n; }, secs);
  const until = (fn, secs) => page.evaluate(async ([fn, secs]) => { const D = window.__pp.arc.game._dbg, f = new Function('D', 'b', 'M', 'return (' + fn + ')'); const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const b = D.g.boss, M = D.FD.FX.mem; if (f(D, b, M)) return true; } return false; }, [fn, secs]);
  let k = 0; const shot = async what => { const f = path.join(OUT, `fight-${tag}-ahuul-${String(k++).padStart(2, '0')}-${what}.png`); await page.screenshot({ path: f }); console.log('  shot', path.basename(f)); };
  const info = () => page.evaluate(() => { const P = window.__pp, MD = P.FIEND_DEFS.ahuul.MODEL; let cp = null; try { const L = P.PERF && P.PERF.lines ? P.PERF.lines().join(' ') : ''; const m = /GL copies (\d+)\/frame/.exec(L); cp = m ? +m[1] : null; } catch (e) { }
    const bb = P.arc.game._dbg.g.boss; return { info: MD && MD.info ? MD.info() : null, copies: cp, act: bb && bb.act }; });
  const t0 = Date.now(), idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.aurora.stages.findIndex(s => s.boss === 'ahuul'));
  await page.evaluate(idx => { const P = window.__pp; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', idx); }, idx);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 2; D.me.y = b.y + 8; }); await run(1.0); await shot('enter');
  console.log('  awake', await until("b && b.act !== 'enter'", 120)); await run(1.0); await shot('awake'); console.log('  ', JSON.stringify(await info()));
  const sig = async (act, secs) => { await page.evaluate(act => { const D = window.__pp.arc.game._dbg; D.FD.FX.mem.nextSig = act; }, act); return until(`(M.nextSig === '${act}' && b.act === 'glide' && (b.actT = 99), b.act === '${act}')`, secs); };
  console.log('  sweep', await sig('sweep', 60)); await run(0.6); await shot('sweep-lifted');
  console.log('  stroke', await until('M.sw && M.sw.k > 0.3', 30)); await shot('sweep-stroke');
  console.log('  bow', await until("b.act === 'bow'", 20)); await run(0.8); await shot('bow');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await shot('hit');
  console.log('  rise', await sig('rise', 60)); await run(3.2); await shot('over'); console.log('  ', JSON.stringify(await info()));
  await page.evaluate(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; M.qt += 1.5; });   // (the queue's clock on: a software rasteriser's frames are slow)
  console.log('  tether', await until("b.act === 'tether' && M.teth && M.teth.o || ((M.qt += 0.3), false)", 60));
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, o = M.teth.o; o.hp = 0; o.dead = true; o.onKill(o); });
  await run(1.4); await shot('throat-bared'); console.log('  ', JSON.stringify(await info()));
  if (gl) { await page.evaluate(() => { window.__AH_LOD = 1; }); await run(1.5); await shot('throat-bared-lod'); console.log('  lod', JSON.stringify(await info())); await page.evaluate(() => { window.__AH_LOD = undefined; }); }
  console.log('  fight', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', 0); }); await run(2);
  const left = await page.evaluate(() => { const MD = window.__pp.FIEND_DEFS.ahuul.MODEL; return MD && MD.kit ? MD.kit.stats() : null; }); console.log('after a new stage', JSON.stringify(left && { buffers: left.buffers, pics: left.pics }));
  console.log('errors', errs.length, errs.slice(0, 6)); await b.close();
})();
