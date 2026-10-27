const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Star'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  const r = await page.evaluate(() => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, pool = P.STAR_POOLS[4].strong.glacier, G = P.arc.game;
    window.__hold = G.update; G.update = () => {};
    let i = 0; const pos = [];
    for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = 1e7; m.maxhp = 1e7; if (i < 6) { m.x = me.x + 2.6; m.y = me.y + (i - 2.5) * 0.8; m.freeze = 0; m.stun = 0; m.still = true; pos.push([+(m.x - me.x).toFixed(2), +(m.y - me.y).toFixed(2), D.walkAt(m.x, m.y)]); } else { m.dead = true; } i++; }
    me.mp = 999; D.g.cdS = 0; me.face = 1;
    const ab = { slot: 'strong', own: true, star: 4, key: 'x_glacier', name: pool.name, glyph: pool.glyph, el: 'fire', mult: 1.2, cost: 0, cd: 0, desc: pool.desc, tier: 1 };
    D.setKit('strong', ab); const ok = D.useStrong('strong');
    for (let k = 0; k < 60; k++) window.__hold(1 / 60);
    G.update = window.__hold;
    return { ok, pos, kit: D.KIT && D.KIT.strong && D.KIT.strong.key, hp: D.mons.filter(m => !m.dead).map(m => Math.round(1e7 - m.hp)), parts: D.parts.filter(p => p.kind === 'spike').length, mp: Math.round(me.mp) };
  });
  console.log(JSON.stringify(r)); console.log('errors', errors);
  await browser.close();
})();
