// Close-up frames of a summoned Anima following the pet (walk cycle, emotes). usage: node tests/anima-life.js [id] [k]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'taurus', K = +(process.argv[3] || 2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(K => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); }, K);
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  await page.evaluate(({ id, K }) => { const D = window.__pp.arc.game._dbg, AN = D.AN; D.mons.forEach(m => { if (!m.boss) { m.x = D.me.x + 40; m.y = D.me.y + 40; m.still = true; } }); AN.kit.main.id = id; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, list: [], fx: [] }); AN.summon(); }, { id, K });
  await page.waitForTimeout(2800);
  const frames = [];
  // walk the pet with the stick so the Anima trots after it, then stop so it idles and chats
  await page.evaluate(() => { const A = window.__pp.arc; A.game.down(72, A.H - 100, 9); A.game.move(116, A.H - 100, 9); });
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(i < 8 ? 90 : 700);
    if (i === 8) await page.evaluate(() => { const A = window.__pp.arc; A.game.up(116, A.H - 100, 9); });
    const box = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, a = D.AN.S.list[0], A = window.__pp.arc; if (!a) return null; const T = 40 * D.g.zoom; return { x: A.W / 2 + (a.x - D.me.x) * T, y: A.H / 2 + (a.y - D.me.y) * T, mv: +a.mv.toFixed(2), emo: a.emo && a.emo.kind, atk: +a.atk.toFixed(2) }; });
    const f = path.resolve(__dirname, `../shots/life-${i}.png`); await page.screenshot({ path: f, clip: box ? { x: Math.max(0, box.x - 95), y: Math.max(0, box.y - 165), width: 190, height: 200 } : undefined }); frames.push(box);
  }
  console.log(JSON.stringify(frames));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
