// (v474 LM) Rift 07's foe hardness, measured on any build (run it on HEAD and on the new build to compare): in a Library dungeon
// (stage 1) each brood type made fresh, its health and one blow of each on the pet; the stage's mini boss's health; in the first boss
// fight (stage 2) the boss's bar, its dmgK and foeK; and Rift 06's (stage 0 dungeon, stage 2 boss) for comparison. The same random
// numbers for each start. usage: HTML=<build> node tests/_lm-foek.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__SB_GL = 0; window.__YUB_GL = 0; window.__LIB_GL = 0; window.__DUN_GL = 0; window.__NG_GL = 0; });
  const H = process.env.HTML || 'test-lm.html';
  await page.goto('file://' + (path.isAbsolute(H) ? H : path.resolve(__dirname, '..', H)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 72; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth']) P.riftState().seals[id] = 1; P.st.dun.best = 120; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const start = async (rift, st) => { await page.evaluate(([rift, st]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true);
      let sd = 0x9E3779B9; Math.random = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      P.riftState().prog[rift] = st; P.startRift(rift, st); }, [rift, st]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); };
  const dungeon = types => page.evaluate(async types => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, fr = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 6; i++) await fr();
    const made = []; for (const t of types) { const q = D.X.freeSpot(me.x + 3, me.y + 3, 0.5) || me, m = D.X.spawnMon(t, q.x, q.y, { pack: 990, rift: true }); m.aggro = false; made.push([t, m]); } for (let i = 0; i < 4; i++) await fr();
    const hp = {}, blow = {}; for (const [t, m] of made) { hp[t] = Math.round(m.maxhp); me.inv = 0; me.dodge = null; me.hp = D.ST.hp; D.g.shieldT = 0; D.g.guardHP = 0; const h0 = me.hp; D.hurtPet(m.dmg, m); blow[t] = +(h0 - me.hp).toFixed(1); }
    const mini = D.mons.find(x => x.boss && x.lesser); return { hp, blow, mini: mini ? { id: mini.bk.id, name: mini.bname, hp: Math.round(mini.maxhp), dmg: +mini.dmg.toFixed(1) } : null, foeK: D.F.rift.foeK || null, petHp: D.ST.hp }; }, types);
  const bossF = () => page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, fr = () => new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < 10; i++) await fr(); const b = D.g.boss || D.mons.find(m => m.fiend || m.boss);
    return b ? { name: b.bname || b.name, hp: Math.round(b.maxhp), dmg: +(b.dmg || 0).toFixed(1), dmgK: D.F.fiend ? D.F.fiend.dmgK : null, fxDmgK: D.FD && D.FD.FX && D.FD.def && typeof D.FD.def.dmgK === 'function' ? +D.FD.def.dmgK(D.FD.FX, b).toFixed(4) : null, foeK: D.F.rift.foeK || null } : null; });
  const out = {};
  await start('library', 1); out.lib1 = await dungeon(['marginworm', 'inkstalker', 'falsefolio']);
  await start('library', 7); out.lib7 = await dungeon(['seraphling', 'haloguard', 'ophanwheel']);
  await start('library', 2); out.libBoss = await bossF();
  await start('yuggoth', 0); out.yug0 = await dungeon(['sparkmite', 'hullwing', 'coilsentry']);
  await start('yuggoth', 2); out.yugBoss = await bossF();
  for (const k in out) console.log(k, JSON.stringify(out[k]));
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
