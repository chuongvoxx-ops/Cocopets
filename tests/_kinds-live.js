// A Celestial six-star of a given wing kind and ring, live: frames in the room and on a Tower floor (wings beating, the
// ring turning). usage: node tests/_kinds-live.js kind ring [seed]   env: HTML, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const kind = process.argv[2] || 'butterfly', ring = process.argv[3] || 'light', seed = +(process.argv[4] || 23), out = process.env.OUT || `live-${kind}-${ring}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const el = await page.evaluate(([kind, ring, seed]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = P.summonGenome(6, P.mulberry32(seed)), line = P.evolveLine(g.form, 7, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g);
    const L = Object.assign({}, line[0].x.leg, { w: kind, ring, v: 0.5, n7: 4 }); line.forEach(f => { f.x.leg = L; P.legendStage(f, f.stage || 1); });
    p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; p.rarity = 5; p.dlv = 40; P.st.others = [p]; P.switchPet(0); return P.petElement(p); }, [kind, ring, seed]);
  await page.waitForTimeout(1200);
  const box = await page.evaluate(() => { const e = document.querySelector('#pet') || document.querySelector('.pet'); const r = e.getBoundingClientRect(); return { x: Math.max(0, r.left - 90), y: Math.max(0, r.top - 120), width: Math.min(390, r.width + 180), height: r.height + 200 }; });
  for (let i = 0; i < 3; i++) { await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}-room${i}.png`), clip: box }); await page.waitForTimeout(170); }
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const tb = await page.evaluate(() => { const A = window.__pp.arc, top = document.getElementById('arcCanvas').getBoundingClientRect().top; return { x: 60, y: top + A.H / 2 - 150, width: 270, height: 260 }; });
  for (let i = 0; i < 3; i++) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && Math.hypot(m.x - D.me.x, m.y - D.me.y) < 8) m.x += 10; }); await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}-tower${i}.png`), clip: tb }); await page.waitForTimeout(120); }
  console.log(kind, ring, 'element', el, 'errors', errors);
  await browser.close();
})();
