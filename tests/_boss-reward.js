// First-win-only boss crystals and boss food: finishes floor 10 (Super Fiend) twice and floor 5 (finale) once.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 9; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const run = async (n, food) => {
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), n);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({ cr: window.__pp.st.crystals || 0, pantry: Object.assign({}, window.__pp.st.pantry) }));
    await page.evaluate(food => { const P = window.__pp; P.arcFinish(true, 1, 0, '', { kills: 3, xp: 0, coins: 0, grade: 'A', food, parts: { time: 20, hp: 20, combo: 10, dodge: 5 } }); }, food);
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({ cr: window.__pp.st.crystals || 0, best: window.__pp.st.dun.best, lines: [...document.querySelectorAll('.dun-end .rewards li span')].map(s => s.textContent) }));
    await page.evaluate(() => { const b = document.querySelector('[data-arc="map"]'); if (b) b.click(); });
    await page.waitForTimeout(500);
    return { n, gained: after.cr - before.cr, best: after.best, lines: after.lines };
  };
  const a = await run(10, { pumpkin: 2, ambrosia: 1 });
  const b = await run(10, { carrot: 1 });
  const out = { first: a, again: b };
  console.log(JSON.stringify(out, null, 1));
  const ok = a.gained > 100 && b.gained === 0 && a.lines.some(l => /Food:/.test(l)) && b.lines.some(l => /first-win prize/.test(l));
  console.log(ok ? 'rewards OK' : 'rewards FAIL', 'errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
