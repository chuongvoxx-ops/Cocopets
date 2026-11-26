// (v463 SM) Rift 04's foe hardness (defRift monHpK / miniHpK / foeDmgK 2.5): the same stage started with the keys taken away and with
// them, and the health of each brood type, of the mini boss (Tock, stage 0; Howl, stage 7) and one blow of each on the pet compared;
// then the stage played again (a retry) and the numbers checked unchanged (laid once, never stacked). Each start draws the same random
// numbers (Math.random seeded), so the floor and its modifier are the same in all three.
// usage: HTML=test-sm463.html node tests/_sm-foek.js [stage 0]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const ST = +(process.argv[2] || 0);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__SB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm463.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 42; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes']) P.riftState().seals[id] = 1; P.st.dun.best = 120; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const KEYS = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.sepulchre; return { monHpK: R.monHpK, miniHpK: R.miniHpK, foeDmgK: R.foeDmgK, bossHpK: R.bossHpK, bossDmgK: R.bossDmgK }; });
  async function measure(off) {
    await page.evaluate(([ST, off, K]) => { const P = window.__pp, R = P.RIFT_BY_ID.sepulchre; if (off) { delete R.monHpK; delete R.miniHpK; delete R.foeDmgK; delete R.bossHpK; delete R.bossDmgK; } else Object.assign(R, K); if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true);
      let sd = 0x9E3779B9; Math.random = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   // (the same random numbers for each start: the same floor, the same modifier)
      P.startRift('sepulchre', ST); }, [ST, off, KEYS]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    return page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, fr = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 6; i++) await fr();
      // fresh foes made now, read before the next frame's stamp and after it (the factor laid on each, within one run: no random floor in between)
      const fresh = {}, made = []; for (const t of ['seceater', 'cornerpup', 'mourndisc']) { const q = D.X.freeSpot(me.x + 3, me.y + 3, 0.5) || { x: me.x + 3, y: me.y + 3 }; const m = D.X.spawnMon(t, q.x, q.y, { pack: 990, rift: true }); m.aggro = false; made.push([t, m, m.maxhp]); }
      const mini0 = D.mons.find(m => m.boss && m.lesser), B = mini0 && mini0.bk; let mini = null, miniHp0 = 0; if (B) { mini = D.lesserBoss(me.x + 4, me.y - 4, 0.5, '', B); mini.aggro = false; miniHp0 = mini.maxhp; }
      await fr(); await fr();
      for (const [t, m, h0] of made) fresh[t] = +(m.maxhp / h0).toFixed(3); if (mini) fresh['mini:' + B.id] = +(mini.maxhp / miniHp0).toFixed(3);
      const hp1 = made.map(([t, m]) => m.maxhp).concat(mini ? [mini.maxhp] : []);
      // one blow of a brood monster, of the mini, and of nothing (a trap's: never scaled), the pet still, its guard down
      const blow = src => { me.inv = 0; me.dodge = null; me.hp = D.ST.hp; D.g.shieldT = 0; D.g.guardHP = 0; const h0 = me.hp; D.hurtPet(20, src); return +(h0 - me.hp).toFixed(3); };
      const bt = blow(null), bm = blow(made[0][1]), bi = mini ? blow(mini) : null;
      for (let i = 0; i < 40; i++) await fr();
      const hp2 = made.map(([t, m]) => m.maxhp).concat(mini ? [mini.maxhp] : []);
      return { fresh, blowX: { monster: +(bm / bt).toFixed(3), mini: bi != null ? +(bi / bt).toFixed(3) : null, trap: bt }, stampedOnce: hp1.every((h, i) => h === hp2[i]), foeK: D.F.rift && D.F.rift.foeK ? D.F.rift.foeK : null }; });
  }
  const off = await measure(true), on = await measure(false), again = await measure(false);
  console.log('keys', JSON.stringify(KEYS));
  console.log('without the keys', JSON.stringify(off)); console.log('with', JSON.stringify(on)); console.log('played again', JSON.stringify(again));
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
