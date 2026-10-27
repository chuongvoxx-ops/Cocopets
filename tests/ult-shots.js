// Fires every Ult in a dungeon and photographs it mid-effect. usage: node tests/ult-shots.js [floor] [ids...]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const ULTS = [['u_beam', 'frost', 900], ['megabeam', 'gold', 900], ['u_nova', 'prism', 520], ['supernova', 'prism', 1060], ['dragon', 'fire', 1100], ['phoenix', 'fire', 700], ['u_shield', 'bubble', 600], ['meteorstorm', 'fire', 1300], ['u_meteor', 'fire', 1200], ['blizzard', 'frost', 1400], ['timestop', 'cosmic', 700], ['u_warp', 'cosmic', 700], ['starswarm', 'spark', 700], ['blossom', 'leaf', 700], ['clones', 'shadow', 900], ['u_clone', 'leaf', 900]];
(async () => {
  const floor = +(process.argv[2] || 2), only = process.argv[3] ? process.argv[3].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(f => window.__pp.dun.startDungeon(f, 5), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  const list = [];
  for (const [key, el, wait] of ULTS.flatMap(u => [u, [u[0] + '+', u[1], u[2]]])) {
    const base = key.replace('+', ''); if (only && !only.includes(base)) continue;
    // bring three monsters in front of the pet so beams and blasts have something to hit
    await page.evaluate(({ base, el, tier }) => {
      const D = window.__pp.arc.game._dbg, me = D.me;
      D.mons.filter(m => !m.dead && !m.boss).slice(0, 5).forEach((m, i) => { const p = D.X.walkPoint(me.x + 3 + (i % 3), me.y - 1 + i, { r: m.r, mv: 0 }); m.x = p.x; m.y = p.y; m.still = true; m.hp = 1e7; m.maxhp = 1e7; });
      Object.assign(D.KIT.ult, { key: base, el, name: base, mult: 1, cost: 0, cd: 0, tier: tier ? 2 : 0 });
      me.mp = 999; D.g.cdU = 0; me.hp = 9999;
      D.useUlt();
    }, { base, el, tier: key.endsWith('+') });
    await page.waitForTimeout(wait);
    const name = key.replace('+', '_plus');
    await page.screenshot({ path: path.resolve(__dirname, `../shots/ult-${name}.png`) });
    list.push(name);
    await page.waitForTimeout(base === 'phoenix' || base === 'blizzard' || base === 'timestop' || base === 'u_warp' || base === 'u_shield' || base === 'clones' || base === 'u_clone' ? 200 : 2200);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, g = D.g; g.phoenixT = g.shieldT = g.stopT = g.warpT = 0; D.helpers.length = 0; D.parts.length = 0; });
    await page.waitForTimeout(400);
  }
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/ult-list.json'), JSON.stringify(list));
  console.log('shots', list.length, 'errors', errors.length, errors.slice(0, 4));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
