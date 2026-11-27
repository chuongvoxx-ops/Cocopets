// (v472 YM) Rift 06's foe hardness (defRift monHpK / miniHpK / foeDmgK 2.5, bossHpK 7, bossDmgK 2.8: Rift 05's floor): the same stage
// started with the keys taken away (before) and with them (after), each brood type's and the mini's health and one blow of each on the
// pet compared, then played again (laid once, never stacked). Each start draws the same random numbers. (From _am-foek.js.)
// usage: HTML=<build> node tests/_ym-foek.js [stage 0]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const ST = +(process.argv[2] || 0);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__SB_GL = 0; window.__YUB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ym.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 62; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora']) P.riftState().seals[id] = 1; P.st.dun.best = 120; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const KEYS = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.yuggoth; return { monHpK: R.monHpK, miniHpK: R.miniHpK, foeDmgK: R.foeDmgK, bossHpK: R.bossHpK, bossDmgK: R.bossDmgK }; });
  async function measure(off) {
    await page.evaluate(([ST, off, K]) => { const P = window.__pp, R = P.RIFT_BY_ID.yuggoth; if (off) { delete R.monHpK; delete R.miniHpK; delete R.foeDmgK; delete R.bossHpK; delete R.bossDmgK; } else Object.assign(R, K); if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true);
      let sd = 0x9E3779B9; Math.random = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   // (the same random numbers for each start: the same floor, the same modifier)
      P.startRift('yuggoth', ST); }, [ST, off, KEYS]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    return page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, fr = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 6; i++) await fr();
      // fresh foes made now, read before the next frame's stamp and after it (the factor laid on each, within one run: no random floor in between)
      const fresh = {}, made = []; for (const t of ['sparkmite', 'hullwing', 'coilsentry', 'warmech', 'mechhound', 'eggling']) { const q = D.X.freeSpot(me.x + 3, me.y + 3, 0.5) || { x: me.x + 3, y: me.y + 3 }; const m = D.X.spawnMon(t, q.x, q.y, { pack: 990, rift: true }); m.aggro = false; made.push([t, m, m.maxhp]); }
      const mini0 = D.mons.find(m => m.boss && m.lesser), B = mini0 && mini0.bk; let mini = null, miniHp0 = 0; if (B) { mini = D.lesserBoss(me.x + 4, me.y - 4, 0.5, '', B); mini.aggro = false; miniHp0 = mini.maxhp; }
      await fr(); await fr();
      for (const [t, m, h0] of made) fresh[t] = +(m.maxhp / h0).toFixed(3); if (mini) fresh['mini:' + B.id] = +(mini.maxhp / miniHp0).toFixed(3); const abs = {}; for (const [t, m] of made) abs[t] = Math.round(m.maxhp); if (mini) abs['mini:' + B.id] = Math.round(mini.maxhp); const dmgAbs = {};
      const hp1 = made.map(([t, m]) => m.maxhp).concat(mini ? [mini.maxhp] : []);
      // one blow of a brood monster, of the mini, and of nothing (a trap's: never scaled), the pet still, its guard down
      const blow = src => { me.inv = 0; me.dodge = null; me.hp = D.ST.hp; D.g.shieldT = 0; D.g.guardHP = 0; const h0 = me.hp; D.hurtPet(20, src); return +(h0 - me.hp).toFixed(3); };
      const bt = blow(null), bm = blow(made[0][1]), bi = mini ? blow(mini) : null; for (const [t, m] of made) { me.inv = 0; me.dodge = null; me.hp = D.ST.hp; D.g.shieldT = 0; D.g.guardHP = 0; const h0 = me.hp; D.hurtPet(m.dmg, m); dmgAbs[t] = +(h0 - me.hp).toFixed(1); }
      for (let i = 0; i < 40; i++) await fr();
      const hp2 = made.map(([t, m]) => m.maxhp).concat(mini ? [mini.maxhp] : []);
      return { stageMini: mini0 ? Math.round(mini0.maxhp) : null, abs, dmgAbs, fresh, blowX: { monster: +(bm / bt).toFixed(3), mini: bi != null ? +(bi / bt).toFixed(3) : null, trap: bt }, stampedOnce: hp1.every((h, i) => h === hp2[i]), foeK: D.F.rift && D.F.rift.foeK ? D.F.rift.foeK : null }; });
  }
  const off = await measure(true), on = await measure(false), again = await measure(false);
  // (Rift 05 at the same pet level, for comparison: its first dungeon's mini and a brood monster, with its own keys)
  await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', 0); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const r5 = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, fr = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 6; i++) await fr();
    const made = []; for (const t of ['rimescuttler', 'veilray', 'frostlantern', 'yeti', 'icegolem']) { const q = D.X.freeSpot(me.x + 3, me.y + 3, 0.5) || me, m = D.X.spawnMon(t, q.x, q.y, { pack: 990, rift: true }); m.aggro = false; made.push([t, m]); } await fr(); await fr();
    const B = (D.mons.find(x => x.boss && x.lesser) || {}).bk, mini = B ? D.lesserBoss(me.x + 4, me.y - 4, 0.5, '', B) : null; if (mini) mini.aggro = false; await fr(); await fr();
    const abs = {}, dmgAbs = {}; for (const [t, m] of made) { abs[t] = Math.round(m.maxhp); me.inv = 0; me.dodge = null; me.hp = D.ST.hp; D.g.shieldT = 0; D.g.guardHP = 0; const h0 = me.hp; D.hurtPet(m.dmg, m); dmgAbs[t] = +(h0 - me.hp).toFixed(1); }
    const real = D.mons.find(x => x.boss && x.lesser && x !== mini);
    return { abs, dmgAbs, mini: mini ? { id: B.id, hp: Math.round(mini.maxhp), stageMiniHp: real ? Math.round(real.maxhp) : null } : null, foeK: D.F.rift.foeK }; });
  console.log('keys', JSON.stringify(KEYS));
  console.log('without the keys', JSON.stringify(off)); console.log('with', JSON.stringify(on)); console.log('played again', JSON.stringify(again)); console.log('Rift 05 (same pet level)', JSON.stringify(r5));
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
