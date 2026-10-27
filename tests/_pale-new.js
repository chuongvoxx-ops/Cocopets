// The Pale Intellect's newer attacks, each forced in its stage (M.cyc set to its place in the turn), the pet standing still:
// what each puts on the floor, whether it lands, a photograph of each mid-way, and the fight's bars and blows.
// usage: node tests/_pale-new.js   env: HTML, TAG
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
  const info = await page.evaluate(() => { const F = window.__pp.fiendFor(100), F2 = window.__pp.fiendFor(110); return { id: F.id, bars: F.bars, base: F.baseBars, dmgK: F.dmgK, other: F2.bars, otherBase: F2.baseBars, otherK: F2.dmgK || 1 }; });
  ok(info.id === 'pale' && info.bars === 49 && info.base === 22 && Math.abs(info.dmgK - 1.15 * (1.3 + 0.1 * 40 / 60)) < 1e-9, `floor 100: ${info.bars} bars (its floor gives ${info.base}), blows x${info.dmgK}`);
  ok(info.other === info.otherBase + 18, `floor 110: 18 more (${info.other} bars, x${info.otherK})`);
  // [stage, attack, its place in the stage's turn, with the lie in the room]
  const cases = [[2, 'twinTides', 1, true], [2, 'racing', 4, true], [2, 'racing', 4, false], [3, 'watchers', 2, false]];
  let dmgSeen = null;
  for (const [lv, name, cyc, withLie] of cases) {
    await page.evaluate(() => { window.__pp.st.dun.god = false; window.__pp.dun.startDungeon(100, 7); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate(([lv, name, cyc, withLie]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run;
      for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, m = D.g.boss, me = D.me, C = FX.C;
      const step = (n) => { for (let i = 0; i < n; i++) { run(1 / 60); me.hp = D.ST.hp; M.gap = 99; } };
      step(300);
      const out = { maxhp: m.maxhp, barHP: FD.barHP, bars: FD.S.bars, dmg: m.dmg };
      m.hp = m.maxhp * (lv === 2 ? 0.66 : 0.31); step(420);
      out.lv = FD.S.lv; out.lie = !!(M.F && M.F.a > 0.3);
      if (!withLie && M.F) { M.F.aTo = 0; M.F.a = 0; M.F.gone = 1; step(30); }
      // the pet stands a little south of the centre; the attack comes next
      const px = C.x + 1, py = C.y + 5; me.x = px; me.y = py; me.vx = me.vy = 0;
      let hurts = 0; const hit = () => { if (me.hp < D.ST.hp - 1) hurts++; me.hp = D.ST.hp; };
      if (M.job && M.job.stop) M.job.stop(FX, M.job); M.job = null; M.lieFirst = false; M.sigCd = 99; M.nameCd = 99; M.cyc = cyc; M.gap = 0; M.thoughts = []; M.tides = [];
      let seen = null, lieTides = 0, realTides = 0, lieMarks = 0, realMarks = 0, gazes = 0, locks = 0, mid = false;
      for (let i = 0; i < 60 * 12; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); me.x = px; me.y = py; me.vx = me.vy = 0; if (M.job && !seen) seen = M.job.name;
        lieTides = Math.max(lieTides, M.tides.filter(T2 => !T2.real).length); realTides = Math.max(realTides, M.tides.filter(T2 => T2.real).length);
        M.thoughts.forEach(th => { if (!th._n) { th._n = 1; if (th.real) realMarks++; else lieMarks++; } });
        if (M.watch) { gazes = Math.max(gazes, M.watch.gz.length); M.watch.gz.forEach(g => { if (g.lock && !g._l) { g._l = 1; locks++; } if (!g.lock) g._l = 0; }); }
        if (seen && M.job && !mid && M.job.t > M.job.end * 0.42) { mid = true; break; } if (seen && !M.job) break; }
      for (let i = 0; i < 20; i++) { c.save(); G.draw(c); c.restore(); run(1 / 60); hit(); me.x = px; me.y = py; me.inv = 0; M.thoughts.forEach(th => { if (!th._n) { th._n = 1; if (th.real) realMarks++; else lieMarks++; } }); if (M.watch) M.watch.gz.forEach(g => { if (g.lock && !g._l) { g._l = 1; locks++; } if (!g.lock) g._l = 0; }); }
      Object.assign(out, { job: seen, lieTides, realTides, midHurts: hurts, eyesTo: M.eyesTo });
      window.__cnt = { lieMarks, realMarks, gazes, locks };
      return out;
    }, [lv, name, cyc, withLie]);
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/palenew-${tag}-${name}${withLie ? '' : '-alone'}.png`) });
    // the rest of the attack, to see it land
    const r2 = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, FX = D.FD.FX, M = FX.mem, me = D.me, C = FX.C, run = window.__run, K = window.__cnt; let hurts = 0; const hit = () => { if (me.hp < D.ST.hp - 1) hurts++; me.hp = D.ST.hp; };
      const px = C.x + 1, py = C.y + 5;
      for (let i = 0; i < 60 * 12 && M.job; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); me.x = px; me.y = py; me.vx = me.vy = 0; M.thoughts.forEach(th => { if (!th._n) { th._n = 1; if (th.real) K.realMarks++; else K.lieMarks++; } }); if (M.watch) M.watch.gz.forEach(g => { if (g.lock && !g._l) { g._l = 1; K.locks++; } if (!g.lock) g._l = 0; }); }
      for (let i = 0; i < 90; i++) { me.hp = D.ST.hp; me.inv = 0; run(1 / 60); hit(); M.gap = 99; }
      return Object.assign({ hurts, watchLeft: !!M.watch, jobAfter: M.job && M.job.name }, K); });
    console.log(`  stage ${r.lv}: ${JSON.stringify(Object.assign(r, r2))}`);
    if (dmgSeen == null) { dmgSeen = r.dmg; ok(r.bars === 49 && Math.abs(r.maxhp / r.barHP - 49) < 0.01, `the fight has ${r.bars} bars of ${Math.round(r.barHP)} health each (${(r.maxhp / r.barHP).toFixed(2)} bars in all)`); }
    ok(r.lv === lv, `stage ${lv} reached (${r.lv})`);
    ok(r.job === name, `stage ${lv} brings ${name} (${r.job})`);
    ok(r.midHurts + r2.hurts > 0, `${name}${withLie ? '' : ' (no lie)'} lands on a pet that stands still (${r.midHurts + r2.hurts} blows)`);
    if (name === 'twinTides') { ok(r.realTides === 1 && r.lieTides === 1, `a real tide and the lie's at once (${r.realTides} real, ${r.lieTides} false)`); }
    if (name === 'racing') { if (withLie) ok(r2.realMarks === 4 && r2.lieMarks === 4, `racing: four real marks and four false (${r2.realMarks}/${r2.lieMarks})`); else ok(r2.realMarks === 6 && r2.lieMarks === 0, `racing alone: six real marks (${r2.realMarks}/${r2.lieMarks})`); }
    if (name === 'watchers') { ok(r2.gazes === 3 && r2.locks >= 1, `three gazes, ${r2.locks} fixed on the pet`); ok(r.eyesTo === 1, 'the sky\'s eyes open wide'); ok(!r2.watchLeft, 'the gazes close at the end'); }
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  // the blows themselves: x1.15 over what the fight's level alone gives
  const dm = await page.evaluate(() => { const P = window.__pp, F = P.fiendFor(100); return F.dmgK; });
  ok(Math.abs(dm - 1.5717) < 0.001, `blows x${dm}`);
  console.log('errors', errors.length, errors.slice(0, 3)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
