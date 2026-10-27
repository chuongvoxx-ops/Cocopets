// pictures of the floor rules: a keys floor (a key on its plinth, a ward held, shards), four guardians, the chaos cards
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const start = async (n, seed) => { await page.evaluate(([n, seed]) => { const P = window.__pp; if (!P.st) { P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.dun.best = 120; P.st.dlv = 200; } if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, seed); }, [n, seed]); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 }); };
  const shot = (name, ms) => page.waitForTimeout(ms || 300).then(() => page.screenshot({ path: path.resolve(__dirname, `../shots/rules-${name}.png`) }));
  await start(105, 2); await shot('chaos-card', 900);
  await start(25, 2525); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; const k = D.RULES.keys.find(k => k.kind.id === 'shards') || D.RULES.keys[0]; D.me.x = k.x + 1.6; D.me.y = k.y + 0.8; D.me.wx = D.me.x; D.me.wy = D.me.y; for (const m of D.mons) if (!m.dead && Math.hypot(m.x - k.x, m.y - k.y) < 9) m.x += 20; }); await shot('key-idle', 2800);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const k = D.RULES.keys.find(k => k.kind.id === 'shards') || D.RULES.keys[0]; D.me.x = k.x; D.me.y = k.y; }); await page.waitForTimeout(400); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const k = D.RULES.keys.find(k => k.kind.id === 'shards'); if (k) { D.me.x = k.x + 1.2; D.me.y = k.y + 1; } }); await shot('key-shards', 1500);
  const w = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const k = D.RULES.keys.find(k => k.kind.id === 'ward'); if (!k) return false; D.me.x = k.x; D.me.y = k.y; return true; }); if (w) { await page.waitForTimeout(400); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const k = D.RULES.keys.find(k => k.kind.id === 'ward'); D.me.x = k.x + 1.3; D.me.y = k.y + 0.6; }); await shot('key-ward', 2500); }
  await start(45, 4545); await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (let k = 0; k < 4; k++) { for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e12, {}); await new Promise(r => setTimeout(r, 200)); } }); await shot('four-guardians', 7000);
  await browser.close();
})();
