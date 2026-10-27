// Combo, fever and the stage-clear celebration in the mini-games, plus a look at the lit room.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(400);
  const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, { recursive: true });
  const fail = m => { console.log('FAIL', m); errors.push('assert: ' + m); };
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Juju'); P.st.unlockAll = true; P.st.energy = 100; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'jc-room.png') });

  const start = async (w) => {
    await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.openMap(); P.dun.setMapTab('galaxy', true); });
    await page.evaluate(w => window.__pp.startStage(w, 1), w);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForTimeout(600);
  };
  // Gem Drop scores nothing by itself: pause it so hits are deterministic; a chain raises the multiplier, ten starts fever
  await start(4);
  const pause = on => page.evaluate(on => { const A = window.__pp.arc; if (A.paused !== on) window.__pp.togglePause(on); }, on);
  await pause(true);
  let r = await page.evaluate(() => { const A = window.__pp.arc, api = A.api; const pts = []; for (let i = 0; i < 9; i++) pts.push(api.hit(195, 400, 10)); return { pts, combo: A.combo, mult: A.mult, fever: A.fever }; });
  console.log('chain', JSON.stringify(r));
  if (r.combo !== 9 || r.mult !== 2 || r.pts[2] !== 10 || r.pts[3] !== 15 || r.pts[7] !== 20 || r.fever > 0) fail('multiplier ladder ' + JSON.stringify(r));
  await pause(false); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'jc-combo.png') });
  await pause(true);
  r = await page.evaluate(() => { const A = window.__pp.arc, api = A.api; const p = api.hit(195, 400, 10); return { p, combo: A.combo, fever: A.fever, fevers: A.fevers, mult: api.mult }; });
  console.log('fever', JSON.stringify(r));
  if (!(r.fever > 0) || r.fevers !== 1 || r.mult !== 4 || r.p !== 40) fail('fever did not start at 10: ' + JSON.stringify(r));
  await pause(false); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, 'jc-fever.png') });
  await pause(true);
  r = await page.evaluate(() => { const A = window.__pp.arc, api = A.api; const p = api.hit(195, 400, 100); api.miss(); return { p, combo: A.combo, mult: A.mult, fever: A.fever > 0 }; });
  if (r.p !== 400 || r.combo !== 0 || r.mult !== 1 || !r.fever) fail('fever points / miss ' + JSON.stringify(r));
  // the chain also times out on its own (Gem Drop keeps combos for 10 s; let the fever end first)
  await pause(false); await page.waitForTimeout(6500);
  await page.evaluate(() => { const api = window.__pp.arc.api; for (let i = 0; i < 5; i++) api.hit(195, 400, 10); });
  await page.waitForTimeout(10600);
  r = await page.evaluate(() => ({ combo: window.__pp.arc.combo, comboBest: window.__pp.arc.comboBest, state: window.__pp.arc.state }));
  if (r.state === 'play' && (r.combo !== 0 || r.comboBest < 10)) fail('combo timeout ' + JSON.stringify(r));
  if (r.state !== 'play') { console.log('note: Gem Drop ended during the wait', r.state); await start(4); await page.evaluate(() => { const api = window.__pp.arc.api; for (let i = 0; i < 11; i++) api.hit(195, 400, 10); }); }
  // a perfect clear: stars, confetti and the best-combo line
  await page.evaluate(() => window.__pp.arc.api.win(3, 4321));
  await page.waitForTimeout(1200);
  r = await page.evaluate(() => ({ state: window.__pp.arc.state, panel: document.querySelector('#arcPanel').innerText.replace(/\s+/g, ' '), fx: window.__pp.arc.fx.length }));
  console.log('end', JSON.stringify(r).slice(0, 300));
  if (!/Best combo/.test(r.panel)) fail('end panel lacks the combo line');
  await page.screenshot({ path: path.join(out, 'jc-clear.png') });

  // real play: Puff Flight with an autopilot for a few seconds should build a combo through the gates
  await start(1);
  const t0 = Date.now(); let best = 0;
  while (Date.now() - t0 < 14000) {
    const s = await page.evaluate(() => { const A = window.__pp.arc; if (A.state !== 'play') return { state: A.state }; const g = A.game._dbg; return g ? { y: g.y, gy: g.nextGateY, vy: g.vy, state: A.state, combo: A.combo } : { state: A.state, combo: A.combo, nodbg: 1 }; });
    if (s.state !== 'play') break;
    if (s.nodbg) { await page.touchscreen.tap(195, 400); await page.waitForTimeout(420); }
    else { if (s.y > s.gy - 6 || s.vy > 120) await page.touchscreen.tap(195, 400); await page.waitForTimeout(60); }
    best = Math.max(best, s.combo || 0);
  }
  console.log('flappy best combo', best);
  await page.screenshot({ path: path.join(out, 'jc-flappy.png') });

  console.log('errors:', errors.length, errors.slice(0, 8));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
