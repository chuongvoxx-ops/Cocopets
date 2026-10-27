// Bahamut's newer attacks, each forced in its stage (the stage's fourth attack: M.cyc set to 3), the pet standing still:
// what each puts on the field and whether it lands, a photograph of each mid-way, and the fight's bars and blows.
// usage: node tests/_bh-new.js   env: HTML, TAG
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 4242);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  let fails = 0; const ok = (c, msg) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
  const info = await page.evaluate(() => { const F = window.__pp.fiendFor(120); return { bars: F.bars, base: F.baseBars, dmgK: F.dmgK }; });
  ok(info.bars === 41 && info.base === 26 && info.dmgK === 1.25, `floor 120: ${info.bars} bars (its floor gives ${info.base}), blows x${info.dmgK}`);
  const cases = [[1, 'feathers'], [2, 'discus'], [3, 'cage'], [4, 'wingsrings']];
  for (const [lv, name] of cases) {
    // (god mode off, so a blow shows as health lost; the health is filled again every step)
    await page.evaluate(() => { window.__pp.st.dun.god = false; window.__pp.dun.startDungeon(120, 7); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(([lv, name]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run;
      for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, m = D.g.boss, me = D.me, C = FX.C;
      const step = (n, draw) => { for (let i = 0; i < n; i++) { run(1 / 60); me.hp = D.ST.hp; if (draw) { c.save(); G.draw(c); c.restore(); } } };
      M.gap = 99; step(300);
      const out = { maxhp: m.maxhp, barHP: FD.barHP, bars: FD.S.bars, dmg: m.dmg };
      if (lv > 1) { m.hp = m.maxhp * ([1, 0.74, 0.49, 0.24][lv - 1]); M.gap = 99; step(600); }
      out.lv = FD.S.lv;
      // the pet stands a little south of the fish, where most attacks find it; the stage's fourth attack comes next
      me.x = C.x + 1.5; me.y = C.y + 6;
      let hurts = 0; const hit = () => { if (me.hp < D.ST.hp - 1) hurts++; me.hp = D.ST.hp; };
      if (M.job && M.job.stop) M.job.stop(FX, M.job); FD.S.hz.forEach(z => { if (z.bw) z.life = 0; });
      const e0 = D.eshots.length; M.job = null; M.cyc = 3; M.sealCd = M.sancCd = M.recCd = 99; M.gap = 0; M.expose = 0; M.freeze = 0;
      let seen = null, maxE = 0, kinds = {}, mid = false;
      for (let i = 0; i < 60 * 9; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); me.x = C.x + 1.5; me.y = C.y + 6; if (M.job && !seen) seen = M.job.name; maxE = Math.max(maxE, D.eshots.length - e0); FD.S.hz.forEach(z => { kinds[z.kind] = 1; });
        if (seen && M.job && !mid && M.job.t > M.job.end * 0.45) { mid = true; break; } if (seen && !M.job) break; }
      for (let i = 0; i < 20; i++) { c.save(); G.draw(c); c.restore(); run(1 / 60); me.x = C.x + 1.5; me.y = C.y + 6; me.hp = D.ST.hp; }
      out.job = seen; out.shots = maxE; out.kinds = Object.keys(kinds); out.midHurts = hurts;
      return out;
    }, [lv, name]);
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/bhnew-${tag}-${name}.png`) });
    // the rest of the attack, to see it land
    const r2 = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, FX = D.FD.FX, M = FX.mem, me = D.me, C = FX.C, run = window.__run; let hurts = 0; const hit = () => { if (me.hp < D.ST.hp - 1) hurts++; me.hp = D.ST.hp; };
      for (let i = 0; i < 60 * 8 && M.job; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); me.x = C.x + 1.5; me.y = C.y + 6; } for (let i = 0; i < 90; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); } return { hurts }; });
    console.log(`  stage ${r.lv}: ${JSON.stringify(Object.assign(r, { laterHurts: r2.hurts }))}`);
    ok(r.job === name, `stage ${lv} brings ${name} as its fourth attack (${r.job})`);
    ok(r.midHurts + r2.hurts > 0, `${name} lands on a pet that stands still (${r.midHurts + r2.hurts} blows)`);
    if (name === 'feathers' || name === 'discus' || name === 'wingsrings') ok(r.shots > 0, `${name} puts shots in the air (${r.shots})`);
    if (name === 'cage') ok(r.kinds.includes('cagegap'), `the cage marks its gap (${r.kinds.join(',')})`);
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
