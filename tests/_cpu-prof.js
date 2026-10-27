// Where the page's own time goes in a Super Fiend fight: the browser's sampling profiler run over a stretch of frames drawn
// as the game draws them (flushed once a frame), self time summed by function (native canvas calls under their own
// names). usage: node tests/_cpu-prof.js [floor] [frames] [top]   env: HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 120), NF = +(process.argv[3] || 150), top = +(process.argv[4] || 40);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl0, +(process.env.CAP || 0)]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const P = window.__pp, G = P.arc.game, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, c = document.getElementById('arcCanvas').getContext('2d');
    for (let i = 0; i < 300; i++) { run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; }
    let fi = 0; window.__frame = () => { const a = fi++ * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); if (M) M.gap = 99; me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); c.getImageData(0, 0, 1, 1); };
    for (let i = 0; i < 70; i++) window.__frame(); });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await cdp.send('Profiler.start');
  const wall = await page.evaluate(NF => { const t0 = performance.now(); for (let i = 0; i < NF; i++) window.__frame(); return performance.now() - t0; }, NF);
  const { profile } = await cdp.send('Profiler.stop');
  // self time per node from the samples
  const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map(), dts = profile.timeDeltas; let tot = 0;
  profile.samples.forEach((id, i) => { const d = dts[i] || 0; tot += d; self.set(id, (self.get(id) || 0) + d); });
  const agg = new Map();
  for (const [id, us] of self) { const n = byId.get(id), cf = n.callFrame, key = (cf.functionName || '(anon)') + (cf.url ? ':' + (cf.lineNumber + 1) : ''); agg.set(key, (agg.get(key) || 0) + us); }
  const rows = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
  console.log(`floor ${fl0}: ${NF} frames in ${wall.toFixed(0)} ms (${(wall / NF).toFixed(2)} ms a frame); self time a frame:`);
  for (const [k, us] of rows) console.log(`  ${(us / 1000 / NF).toFixed(3)} ms  ${k}`);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
