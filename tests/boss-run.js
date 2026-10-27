// Fights every boss kind for a while with the bot, watching for errors. usage: node tests/boss-run.js [secondsPerBoss] [floor] [ids,...]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const secs = +(process.argv[2] || 22), floor = +(process.argv[3] || 3), only = process.argv[4] ? process.argv[4].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  if (process.env.PASSIVE) await page.evaluate(() => { window.__passive = true; });
  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.st.dlv = 6; });
  const ids = only || await page.evaluate(() => window.__pp.BOSSES.map(b => b.id));
  const results = [];
  for (const id of ids) {
    const e0 = errors.length;
    await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
    await page.evaluate(() => { const P = window.__pp; P.openMap && P.openMap(); P.dun.setMapTab('dungeon', true); });
    await page.evaluate(({ floor }) => window.__pp.dun.startDungeon(floor, 99), { floor });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate((id) => { const D = window.__pp.arc.game._dbg; D.setBoss(id); window.__pp.beginPlay(); D.g.intro = 0.3; }, id);
    await page.waitForTimeout(500);
    // clear the floor instantly so the boss wakes
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.mons.slice().forEach(m => { if (!m.boss || m.brute) D.hitMon(m, 1e9); }); });
    const t0 = Date.now(); let last = null, phases = new Set(), acts = new Set();
    while (Date.now() - t0 < secs * 1000) {
      const r = await page.evaluate(() => {
        const P = window.__pp, A = P.arc, G = A.game; if (!G || A.state !== 'play') return { state: A.state };
        const D = G._dbg, me = D.me, g = D.g, W = A.W, H = A.H, b = g.boss;
        if (b && !b.dead && b.act !== 'sleep') {
          const bd = Math.hypot(b.x - me.x, b.y - me.y);
          const sx = (b.x - me.x) * 40 * g.zoom + W / 2, sy = (b.y - me.y) * 40 * g.zoom + H / 2;
          if (!window.__passive && (!g._botT || g.t - g._botT > 0.25)) { g._botT = g.t; G.down(Math.max(10, Math.min(W - 10, sx)), Math.max(10, Math.min(H - 10, sy)), 77); G.up(Math.max(10, Math.min(W - 10, sx)), Math.max(10, Math.min(H - 10, sy)), 77); }
          const want = bd > 4.5 ? 1 : bd < 2 ? -1 : 0;
          if (want < 0) D.goTo(null, me.x + (me.x - b.x) / (bd || 1) * 2, me.y + (me.y - b.y) / (bd || 1) * 2);
          if (!window.__passive && me.mp > D.KIT.strong.cost && g.cdS <= 0) D.useStrong();
          if (!window.__passive && me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt();
          if (Math.random() < 0.06) D.dodge();
          me.mp = Math.max(me.mp, 40);
        } else if (b && b.act === 'sleep') { D.goTo(null, b.x + 2, b.y + 1); const p = D.X.walkPoint(b.x + 3, b.y + 2, { r: 0.3, mv: 0 }); me.x = p.x; me.y = p.y; }
        return { state: A.state, t: g.t.toFixed(1), boss: b ? { name: b.bname, act: b.act, hp: Math.round(b.hp), max: Math.round(b.maxhp), phase: b.phase, dead: b.dead } : null, won: g.won, hp: Math.round(me.hp), mons: D.mons.length, es: D.eshots.length, zones: D.zones.length };
      });
      last = r;
      if (r.boss) { phases.add(r.boss.phase); acts.add(r.boss.act); }
      if (r.state !== 'play' || r.won) break;
      await page.waitForTimeout(80);
    }
    const line = `${id.padEnd(13)} ${last && last.boss ? `${last.boss.name} hp ${last.boss.hp}/${last.boss.max} p${last.boss.phase} ${last.boss.dead ? 'DEAD' : last.boss.act}` : 'no boss'} won=${last && last.won} acts=[${[...acts].join(',')}] errs=${errors.length - e0}`;
    console.log(line); results.push(line);
    if (errors.length > e0) console.log('   ', errors.slice(e0, e0 + 3));
  }
  console.log('total errors:', errors.length);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
