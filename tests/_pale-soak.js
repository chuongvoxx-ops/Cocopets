// The floor 100 fight left to run in phases 2 and 3 with the pet wandering (god mode): the attacks it chooses in turn,
// drawn every few frames, and any page error. usage: node tests/_pale-soak.js [seconds per phase]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const secs = +(process.argv[2] || 100);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 99);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  let fails = 0; const ok = (c, msg) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
  for (const lv of [2, 3]) {
    await page.evaluate(() => { window.__pp.dun.startDungeon(100, 7); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 1; });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(([lv, secs]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run;
      for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, m = D.g.boss, me = D.me, C = FX.C;
      for (let i = 0; i < 300; i++) { run(1 / 60); me.hp = D.ST.hp; }
      m.hp = m.maxhp * (lv === 2 ? 0.66 : 0.31); for (let i = 0; i < 240; i++) { run(1 / 60); me.hp = D.ST.hp; }
      const seen = {}; let goal = [C.x, C.y + 5], gt = 0, maxHz = 0, maxTh = 0;
      for (let i = 0; i < secs * 60; i++) {
        // the pet wanders between points round the chamber, as a player might
        gt -= 1 / 60; if (gt <= 0 || Math.hypot(goal[0] - me.x, goal[1] - me.y) < 0.4) { const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 8; goal = [C.x + Math.cos(a) * d, C.y + Math.sin(a) * d]; gt = 1.5 + Math.random() * 2; }
        const dx = goal[0] - me.x, dy = goal[1] - me.y, dd = Math.hypot(dx, dy) || 1; me.vx = dx / dd * 4.3; me.vy = dy / dd * 4.3; me.x += me.vx / 60; me.y += me.vy / 60;
        run(1 / 60); me.hp = D.ST.hp; if (m.hp < m.maxhp * (lv === 2 ? 0.4 : 0.17)) m.hp = m.maxhp * (lv === 2 ? 0.66 : 0.31);
        if (M.job && M.job.name) seen[M.job.name] = (seen[M.job.name] || 0) + 1;
        maxHz = Math.max(maxHz, FD.S.hz.length); maxTh = Math.max(maxTh, M.thoughts.length);
        if (i % 3 === 0) { c.save(); G.draw(c); c.restore(); }
      }
      return { lv: FD.S.lv, seen: Object.keys(seen), maxHz, maxTh, watch: !!M.watch };
    }, [lv, secs]);
    console.log(`  stage ${r.lv}: ${JSON.stringify(r)}`);
    ok(r.lv === lv, `stage ${lv} held`);
    const want = lv === 2 ? ['falseAwakening', 'twinTides', 'recurring', 'stitch', 'racing', 'doubleLash', 'sever'] : ['premonition', 'memory', 'watchers', 'collapse'];
    ok(want.every(n => r.seen.includes(n)), `stage ${lv} turns through ${want.join(', ')} (saw ${r.seen.join(', ')})`);
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
