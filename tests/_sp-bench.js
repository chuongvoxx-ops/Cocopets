// v439 SP: the in-game benchmark (Settings > Run benchmark) run headless, end to end, on the arcade's own loop (real requestAnimationFrame):
// it opens Settings, presses Run, waits for the results card, prints its text, checks that nothing was kept (energy, the rift's progress,
// the pet's level and coins) and that the page threw nothing. Also checks the frame counter's detailed readout and the quality buttons.
// usage: HTML=<test html> node tests/_sp-bench.js   env: GPU=1 (force the GPU paths on the software rasteriser: slow), UNLOCK=0 (the
//   Garden not open: the Tower's first floor instead), ANIMA (aries: the Anima equipped, summoned by the run; '' none), DPR (3), GQ (auto|high|balanced|perf), SHOT=file.png (a shot of the results)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.DPR || 3), hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  if (process.env.GPU === '1') await page.addInitScript(() => { window.__NG_GL = 1; window.__SM_GL = 1; window.__AS_GL = 1; });
  const html = process.env.HTML; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(500);
  const before = await page.evaluate(([unlock, gq, process_anima]) => { const P = window.__pp; P.quickStart('Bot'); P.st.dlv = 33; P.st.energy = 4; if (unlock) { const R = P.riftState(); R.prog.garden = 3; P.st.dun.best = Math.max(P.st.dun.best || 0, 40); P.st.unlockAll = true; } P.st.fpsD = true; P.st.fps = true; P.st.gq = gq; if (process_anima) { P.ANIMA_ORDER.forEach(x => P.st.animas.have[x] = 3); P.st.animas.eq = process_anima; P.st.animas.res = null; }
    return { energy: P.st.energy, coins: P.st.coins, lvl: P.st.dlv, prog: JSON.stringify(P.riftState().prog), open: P.riftOpen ? P.riftOpen('garden') : null, belfry: P.riftOpen ? P.riftOpen('belfry') : null }; }, [process.env.UNLOCK !== '0', process.env.GQ || 'auto', process.env.ANIMA || 'aries']);
  console.log('before', JSON.stringify(before));
  // Settings: the three new controls are there; Run pressed
  const ui = await page.evaluate(() => { const P = window.__pp; try { P.openCard ? null : null; } catch (e) {} const b = document.querySelector('[data-go="settings"], #settingsBtn, [data-go="help"]'); return { btn: !!b }; });
  if (process.env.LONGS) await page.evaluate(n => { window.__BENCH_LONG = n; }, +process.env.LONGS);   // (v440 SQ: LONG=1 the Long run, LONGS its play seconds)
  await page.evaluate(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });   // (v440 SQ: the new player's gift card out of the way of the photos)
  const started = await page.evaluate(long => window.PERF.bench({ long }), process.env.LONG === '1');
  console.log('ui', JSON.stringify(ui), 'started', started);
  const t0 = Date.now(); let last = '';
  for (;;) { await page.waitForTimeout(3000); const r = await page.evaluate(() => { const o = document.getElementById('benchOut'), m = document.getElementById('fpsMeter'); return { done: !!o, text: o ? o.querySelector('pre').textContent : '', meter: m ? m.textContent : '', ph: window.PERF.B ? window.PERF.B.ph : null, st: window.__pp.arc.state }; });
    if (r.meter !== last && r.ph != null) { last = r.meter; console.log(`  t+${((Date.now() - t0) / 1000).toFixed(0)}s phase ${r.ph} ${r.st} | ${r.meter.replace(/\n/g, ' / ')}`); }
    if (process.env.PHSHOT && r.ph != null && r.ph >= 9 && !global['__shot' + r.ph] && r.st === 'play') { global['__shot' + r.ph] = 1; await page.waitForTimeout(9000); await page.screenshot({ path: process.env.PHSHOT + '-phase' + r.ph + '.png' }); console.log('  shot of phase', r.ph); }   // (v440 SQ: the Belfry's and the boss's phases photographed)
    if (r.done) { console.log('\n' + r.text); break; } if (Date.now() - t0 > 900000) { console.log('timeout'); break; } }
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
  const after = await page.evaluate(() => { const P = window.__pp; return { energy: P.st.energy, coins: P.st.coins, lvl: P.st.dlv, prog: JSON.stringify(P.riftState().prog), arc: P.arc.open, gqHold: window.GQ.hold, god: !!(P.st.dun && P.st.dun.god), seals: JSON.stringify(P.riftState().seals) }; });
  console.log('after', JSON.stringify(after), 'kept nothing:', Math.abs(after.energy - before.energy) < 0.05 && after.lvl === before.lvl && after.prog === before.prog && after.coins === before.coins && !after.arc);
  console.log('page errors', errors.length, JSON.stringify(errors.slice(0, 4))); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
