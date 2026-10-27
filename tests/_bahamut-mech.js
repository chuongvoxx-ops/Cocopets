// Bahamut, the Infinite, stepped fast without drawing: each stage's attacks and its signature played properly, the
// transitions, Final Judgment (a failed cast, then the eight runes broken pair by pair), the golden corridor, the end
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(120, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; for (let i = 0; i < 60 * 6; i++) G.update(1 / 60); });
  // step the world n seconds; the pet wanders, or plays the signature properly; every job, banner and blow is noted
  const run = (secs, opts) => page.evaluate(([secs, opts]) => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C;
    const jobs = {}, banners = [], tags = {}; let m = D.g.boss, hurts = 0, burns = 0, exposedT = 0, maxHz = 0, lastJob = null;
    const ban = FX.H.banner; FX.H.banner = function (a) { banners.push(a); return ban.apply(this, arguments); };
    const hu = FX.hurt; FX.hurt = function (d, o) { if (o && o.dot) burns++; else hurts++; return hu.apply(this, arguments); };
    if (opts.hp != null) m.hp = m.maxhp * opts.hp;
    if (opts.set) Object.assign(M, opts.set);
    const put = (x, y) => { me.x = x; me.y = y; };
    for (let i = 0; i < secs * 60; i++) {
      if (opts.smart === 'seal' && M.seals) {
        // stand on an unbroken seal while the lance hunts; once it locks, step away to the inner circle
        const L = FD.S.hz.find(z => z.style === 'lance' && !z.fired), s = M.seals.find(s2 => !s2.broken);
        if (L && s) { if (!L.locked) put(s.x, s.y); else put(C.x + Math.cos(s.a + 0.6) * 4.2, C.y + Math.sin(s.a + 0.6) * 4.2); }
      } else if (opts.smart === 'sanct' && M.job && M.job.S) {
        // keep to the middle of the leading safe sector, well off the dais
        const S = M.job.S, a = S.safe[1] * Math.PI / 4; put(C.x + Math.cos(a) * 9, C.y + Math.sin(a) * 9);
      } else if (i % 90 === 0) { const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 7; put(C.x + Math.cos(a) * d, C.y + Math.sin(a) * d); }
      G.update(1 / 60); m = D.g.boss; if (!m || m.dead) break;
      if (M.job && M.job !== lastJob) { jobs[M.job.name] = (jobs[M.job.name] || 0) + 1; lastJob = M.job; }
      if (M.expose > 0) exposedT += 1 / 60;
      if (M.trans) tags['trans:' + M.trans.k] = 1;
      if (M.ghost > 0.9) tags.ghost = 1; if (M.ghostFall > 0) tags.ghostFall = 1; if (M.rings[1].heat > 0.5) tags.heat = 1; if (M.rings[0].stall > 0) tags.stall0 = 1; if (M.rings[1].stall > 0) tags.stall1 = 1; if (M.rings[2].stall > 0) tags.stall2 = 1;
      if (M.rings[2].stored >= 3) tags.stored3 = 1; if (M.rings[2].lit === 0) tags.replayedLast = 1; if (M.seals && M.seals.every(s => s.broken)) tags.allSeals = 1;
      maxHz = Math.max(maxHz, FD.S.hz.length);
      me.hp = D.ST.hp;
    }
    FX.H.banner = ban; FX.hurt = hu;
    const roles = {}; M.tents.forEach(T2 => { roles[T2.role] = (roles[T2.role] || 0) + 1; });
    return { phase: FD.S.phase, lv: FD.S.lv, hpPct: +(m.hp / m.maxhp * 100).toFixed(1), jobs, banners: [...new Set(banners)], hurts, burns, exposed: +exposedT.toFixed(1), maxHz, tags: Object.keys(tags), awake: M.rings.map(r => r.awake), roles };
  }, [secs, opts]);
  const out = {};
  out.I = await run(70, {});
  out.Iseal = await run(60, { smart: 'seal', set: { sealCd: 0, gap: 0 } });
  out.II = await run(60, { hp: 0.74 });
  out.IIsanct = await run(45, { smart: 'sanct', set: { sancCd: 0 } });
  out.III = await run(60, { hp: 0.49 });
  out.IIIrec = await run(30, { set: { recCd: 0 } });
  out.IV = await run(50, { hp: 0.24 });
  // Final Judgment, failed: the cast runs out, the white comes, and (god mode) it starts over
  out.fail = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem; let m = D.g.boss; m.hp = m.maxhp * 0.055;
    for (let i = 0; i < 120 && !M.obl; i++) G.update(1 / 60);
    const started = !!M.obl, objs = M.obl ? M.obl.objs.length : 0; M.obl.cast = 0.4;
    let white = 0, failed = false; for (let i = 0; i < 60 * 8; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; if (M.fail) failed = true; white = Math.max(white, M.white); }
    return { started, objs, failed, white: +white.toFixed(2), restarted: !!M.obl && M.obl.pair === 0, alive: !D.g.boss.dead, tentsBack: M.tents.filter(T2 => !T2.gone).length };
  });
  // Final Judgment, won: break the runes two at a time, then strike the jewel down the corridor
  out.win = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, O0 = M.obl, log = []; let m = D.g.boss;
    const hpBefore = m.hp; for (let k = 0; k < 40; k++) D.hitMon(m, FD.S.barHP * 0.05, {});   // armoured while it casts, and it cannot fall
    const armourOK = m.hp > 0 && !m.dead, armourDrop = +((hpBefore - m.hp) / m.maxhp * 100).toFixed(2);
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 400 && !(M.obl && M.obl.objs.length && M.obl.objs.every(o => !o.dead) && M.obl.wait <= 0 && M.obl.pair === p); i++) { G.update(1 / 60); D.me.hp = D.ST.hp; }
      const O = M.obl, cast0 = O.cast; O.objs.forEach(o => { if (!o.dead) D.hitMon(o, o.hp + 10, {}); });
      for (let i = 0; i < 3; i++) G.update(1 / 60);
      log.push({ pair: p, castGain: +(O.cast - cast0).toFixed(1), tentsLeft: M.tents.filter(T2 => !T2.gone).length, blaze: M.rings[3].blaze.join('') });
    }
    for (let i = 0; i < 200 && !(M.obl && M.obl.corr); i++) { G.update(1 / 60); D.me.hp = D.ST.hp; }
    const corr = !!(M.obl && M.obl.corr); for (let i = 0; i < 60; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; }
    const w = FD.S.weak.jewel, aligned = +M.corr.toFixed(2); if (w && !w.dead) D.hitMon(w, 50, {});
    const dead = D.g.boss.dead; let maxDawn = 0, t9 = 0, ended = null; for (let i = 0; i < 60 * 11; i++) { G.update(1 / 60); maxDawn = Math.max(maxDawn, M.dawn); if (M.end) t9 = M.end.t; if (window.__pp.arc.state !== 'play' && ended == null) ended = +(M.end ? M.end.t : -1).toFixed(1); }
    return { armourOK, armourDrop, log, corr, aligned, hadJewel: !!w, dead, endT: +t9.toFixed(1), dawn: +maxDawn.toFixed(2), state: window.__pp.arc.state, finishedAt: ended };
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
