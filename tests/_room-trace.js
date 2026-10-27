// What the browser spends painting each frame in the room (and, behind the Tower, while a floor is played), with
// six-star Legendaries against ordinary pets: a trace of a few seconds, the paint, raster, style and script work in
// it summed and divided by the frames shown. usage: node tests/_room-trace.js [secs]   env: HTML, CASES (room-leg,room-plain,dun-leg,dun-plain,grid-leg)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const secs = +(process.argv[2] || 4), cases = (process.env.CASES || 'room-plain,room-leg,dun-plain,dun-leg').split(',');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = {};
  for (const cs of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 77);
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
    await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    const leg = /leg/.test(cs);
    await page.evaluate(leg => {
      const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200;
      const mk = (sd, sg, six) => { const g = six ? P.summonGenome(6, P.mulberry32(sd)) : P.summonGenome(4, P.mulberry32(sd)), line = P.evolveLine(g.form, sg, P.mulberry32(sd * 7)), p = P.newPetFields('P' + sd, g); p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; if (six) p.rarity = 5; return p; };
      P.st.others = [mk(11, 7, leg), mk(23, 5, leg), mk(47, 7, leg)];
      P.switchPet(0);
    }, leg);
    await page.waitForTimeout(800);
    if (/grid/.test(cs)) { await page.evaluate(() => { const P = window.__pp; for (let i = 0; i < 9; i++) P.st.others.push(P.st.others[i % 3]); P.openPocket && P.openPocket(); }); await page.waitForTimeout(500); }
    if (/dun/.test(cs)) {
      await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(6, 7); });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
      await page.evaluate(() => window.__pp.beginPlay());
      await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
      await page.waitForTimeout(1500);
    }
    await page.evaluate(() => { window.__fr = 0; const f = () => { window.__fr++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'gpu', 'viz', 'blink'] });
    const f0 = await page.evaluate(() => window.__fr), t0 = Date.now();
    await page.waitForTimeout(secs * 1000);
    const f1 = await page.evaluate(() => window.__fr), el = (Date.now() - t0) / 1000;
    const buf = await browser.stopTracing();
    const T = JSON.parse(buf.toString()), ev = T.traceEvents || T, sum = {};
    for (const e of ev) { if (e.ph !== 'X' || !e.dur) continue; const n = e.name; if (!/^(Paint|PaintImage|RasterTask|Layerize|UpdateLayerTree|Layout|UpdateLayoutTree|FunctionCall|FireAnimationFrame|PrePaint|Commit|ImageDecodeTask|GPUTask|DrawFrame|ProxyMain::BeginMainFrame|ThreadProxy::ScheduledActionDraw|TileManager::FlushAndIssueSignals|RasterBufferProvider::OrderingBarrier|RasterizerTask|cc::RasterTaskImpl|TaskGraphRunner::RunTask|Graphics.Pipeline|ScheduledActionDraw)$/.test(n)) continue; sum[n] = (sum[n] || 0) + e.dur / 1000; }
    if (process.env.STEPS) { const by = {}; for (const e of ev) { if (e.name !== 'Graphics.Pipeline' || e.ph !== 'X' || !e.args) continue; const k = (e.args.step || e.args.chrome_graphics_pipeline && e.args.chrome_graphics_pipeline.step || JSON.stringify(e.args).slice(0, 60)); by[k] = (by[k] || 0) + e.dur / 1000; } console.log('   steps', JSON.stringify(by)); }
    { const th = {}; for (const e of ev) { if (e.ph !== 'X' || !e.dur || e.tdur == null) continue; } }
    if (process.env.PAINTS) { const by = {}; for (const e of ev) { if (e.name !== 'Paint' || !e.args || !e.args.data) continue; const d = e.args.data, key = (d.nodeName || d.nodeId || '') + ' ' + (d.clip ? d.clip.slice(0, 4).map(Math.round).join(',') : ''); by[key] = (by[key] || 0) + 1; } console.log('   paints', JSON.stringify(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12))); }
    const frames = f1 - f0, per = {}; for (const k in sum) per[k] = +(sum[k] / Math.max(1, frames)).toFixed(2);
    out[cs] = { fps: +(frames / el).toFixed(1), per };
    console.log(cs.padEnd(11), 'fps', out[cs].fps, JSON.stringify(per), errors.length ? errors.slice(0, 2) : '');
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
