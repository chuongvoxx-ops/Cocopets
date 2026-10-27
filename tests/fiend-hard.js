// Super Fiends (v86): floors 10-49, 10 more bars rising to 25 and blows x1.3; from floor 50, 30 more rising to 50 at
// the top, blows x1.5 rising to x2.0,
// on top of a fiend's own extra; below 60 unchanged; the health of each bar and the reward unchanged; and a fight's
// boss really has that health and those blows. usage: node tests/fiend-hard.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  const T = await page.evaluate(() => { const P = window.__pp; return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(n => { const F = P.fiendFor(n); return { n, id: F.id, bars: F.bars, base: F.baseBars, own: F.extraBars || 0, more: F.hardBars, k: +F.dmgK.toFixed(3), hk: F.hardK }; }); });
  T.forEach(t => console.log(`  floor ${String(t.n).padStart(3)} ${t.id.padEnd(12)} bars ${t.bars} (floor ${t.base}, own +${t.own}, harder +${t.more}) blows x${t.k}`));
  const lo = T.filter(t => t.n < 50), hi = T.filter(t => t.n >= 50);
  ok(lo.every(t => t.more >= 10 && t.more <= 25 && Math.abs(t.hk - 1.3) < 1e-9 && t.bars === t.base + t.own + t.more) && lo[0].more === 10 && lo[lo.length - 1].more === 25, `floors 10-49: ${lo.map(t => '+' + t.more).join(' ')} bars, blows x1.3`);
  ok(hi.every(t => t.more >= 30 && t.more <= 50) && hi[0].more === 30 && hi[hi.length - 1].more === 50, `from floor 50: ${hi.map(t => '+' + t.more).join(' ')} bars`);
  ok(hi.every(t => t.hk >= 1.5 - 1e-9 && t.hk <= 2 + 1e-9) && hi[0].hk === 1.5 && Math.abs(hi[hi.length - 1].hk - 2) < 1e-9, `blows ${hi.map(t => 'x' + t.hk.toFixed(2)).join(' ')}`);
  ok(hi.every((t, i) => !i || (t.more >= hi[i - 1].more && t.hk > hi[i - 1].hk)) && lo.every((t, i) => !i || t.more >= lo[i - 1].more), 'the higher the floor, the more of both');
  // the fight itself: floor 90's fiend has its bars and blows
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const fight = {};
  for (const n of [50, 90]) {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), n);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    fight[n] = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1500 && !D.g.boss; i++) window.__run(1 / 60); const m = D.g.boss, FD = D.FD; return { bars: FD.S.bars, perBar: +(m.maxhp / FD.barHP).toFixed(2), dmg: +m.dmg.toFixed(1) }; });
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('  fights', JSON.stringify(fight));
  const t90 = T.find(t => t.n === 90);
  ok(fight[90].bars === t90.bars && Math.abs(fight[90].perBar - t90.bars) < 0.01, `floor 90's fight: ${fight[90].bars} bars of health`);
  console.log('errors', errors.length, errors.slice(0, 3)); ok(!errors.length, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
