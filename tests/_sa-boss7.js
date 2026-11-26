// (v463 SA) Threnn and Vaul at seven times their v461 health and blows (the user: "more difficult than current rift 3"; 20s2's bossHpK 7,
// bossDmgK 7 / foeDmgK, shared with Khyros). The same stage started with v461's numbers (none of the v463 keys: no bossHpK, bossDmgK,
// foeDmgK, monHpK, miniHpK) and with v463's, in the same page: a blow of its own on the pet x7, every hit on its body and on its own weak
// point (the core / the eye, as its file registers it) counting 1/7, the bar and the phase cuts unchanged, a phase change and a retry not
// stacking it, the minion it calls not touched by the boss keys (only by the rift's monster keys).
// usage: HTML=test-sa.html node tests/_sa-boss7.js
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); if (!c) fails++; };
const KEYS = ['bossHpK', 'bossDmgK', 'foeDmgK', 'monHpK', 'miniHpK'];
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, start } = T;
  await page.evaluate(() => { const P = window.__pp; P.st.dun.god = false; P.st.unlockAll = true; });
  const probe = async (stage, old) => {
    await page.evaluate(([old, KEYS]) => { const Rf = window.__pp.RIFT_BY_ID.sepulchre; if (!window.__saKeep) { window.__saKeep = {}; for (const k of KEYS) window.__saKeep[k] = Object.getOwnPropertyDescriptor(Rf, k); }
      for (const k of KEYS) { delete Rf[k]; if (!old && window.__saKeep[k]) Object.defineProperty(Rf, k, window.__saKeep[k]); } }, [old, KEYS]);
    await start('sepulchre', stage);
    return page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, t0 = performance.now();
      while (performance.now() - t0 < 60000 && !(D.g.boss && D.g.boss.act !== 'enter')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (D.M.bossAt) { D.me.x = D.M.bossAt.x; D.me.y = D.M.bossAt.y + 4; } }
      const b = D.g.boss, FX = D.FD.FX, FD = D.F.fiend, DEF = P.FIEND_DEFS[FD.id], fk = D.F.rift.foeK || null; P.arc.paused = true;
      // a blow on its body (the 2D hit proxy path: viaProxy as a pet's hit lands)
      b.stunT = 0; b.under = false; const hp0 = b.hp; D.hitMon(b, 10000, { flat: true, viaProxy: true }); const body = hp0 - b.hp; b.hp = b.maxhp;
      // its own weak point as its file registers it while it lies stunned (Threnn's core, Vaul's eye)
      const wk = FD.id === 'threnn' ? 'core' : 'eye'; b.stunT = 1; DEF.stunned(FX, b, 0.001); const w = D.FD.S.weak[wk]; const hp1 = b.hp; if (w && !w.dead) D.hitMon(w, 10000, { flat: true }); const weak = hp1 - b.hp; b.stunT = 0; FX.weak(wk, 0, 0, 0, 0, false); b.hp = b.maxhp;
      // a blow of its own on the pet (god off, guards cleared, a deep pool so it is measured whole)
      const god = P.st.dun.god; D.g.god = false; P.st.dun.god = false; me.inv = 0; me.dodge = null; me.dash = null; D.g.shieldT = 0; D.g.guardHP = 0; me.hp = 1e7; const ph0 = me.hp; const landed = FX.hurt(b.dmg); const onPet = ph0 - me.hp; me.hp = D.ST.hp; P.st.dun.god = god;
      const mn = FX.minion('seceater', b.x + 3, b.y + 3); const minion = mn ? { hp: mn.maxhp, dmg: mn.dmg } : null; if (mn) mn.dead = true;
      const d0 = b.dmg, ph = D.FD.S.phase; b.hp = b.maxhp * 0.45; P.arc.paused = false; for (let k = 0; k < 120; k++) { me.hp = D.ST.hp; P.arc.game.update(1 / 60); } const phase2 = D.FD.S.phase, d1 = b.dmg;
      return { boss: FD.id, maxhp: b.maxhp, bars: FD.bars, dmgK: FD.dmgK, mdmg: d0, foeK: fk, body, weak, onPet, landed, minion, phase: [ph, phase2], dmgAfterPhase: d1 }; }); };
  const idx = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.sepulchre; return ['threnn', 'vaul'].map(b => R.stages.findIndex(s => s.boss === b)); });
  for (const [stage, nm] of [[idx[0], 'Threnn'], [idx[1], 'Vaul']]) {
    const a = await probe(stage, true), b = await probe(stage, false), b2 = await probe(stage, false);
    console.log(`  ${nm} v461 ${JSON.stringify(a)}\n  ${nm} v463 ${JSON.stringify(b)}`);
    const x7 = (x, y) => Math.abs(x / y - 7) < 1e-6;
    ok(b.landed && a.landed && x7(b.onPet, a.onPet), `${nm}: a blow of its own on the pet x7 (${a.onPet.toFixed(1)} -> ${b.onPet.toFixed(1)}; m.dmg ${a.mdmg.toFixed(1)} -> ${b.mdmg.toFixed(1)} x the rift's foe blow ${b.foeK && b.foeK.dmg})`, { a: a.onPet, b: b.onPet });
    ok(x7(a.body, b.body), `${nm}: every hit on its body counts 1/7 (${a.body.toFixed(1)} -> ${b.body.toFixed(1)})`, { a: a.body, b: b.body });
    ok(a.weak > 0 && x7(a.weak, b.weak), `${nm}: every hit on its weak point counts 1/7 (${a.weak.toFixed(1)} -> ${b.weak.toFixed(1)}): effective health x7`, { a: a.weak, b: b.weak });
    ok(b.maxhp === a.maxhp && b.bars === a.bars && b.foeK && b.foeK.boss === 7 && !a.foeK, `${nm}: foeK.boss none -> 7; the bar (${b.bars} bars, ${b.maxhp}) and so the phase cuts unchanged`);
    ok(b.phase[1] === a.phase[1] && b.phase[1] > b.phase[0] && b.dmgAfterPhase === b.mdmg && a.dmgAfterPhase === a.mdmg, `${nm}: at 45% it enters phase ${b.phase[1]} as before; its blow not raised again by the phase`, { a: [a.phase, a.dmgAfterPhase], b: [b.phase, b.dmgAfterPhase] });
    ok(b2.mdmg === b.mdmg && b2.foeK.boss === b.foeK.boss && Math.abs(b2.onPet - b.onPet) < 1e-6, `${nm}: a retry starts it at the same numbers (not stacked)`);
    ok(a.minion && b.minion && Math.abs(b.minion.hp / a.minion.hp - (b.foeK.mon || 1)) < 1e-6 || (a.minion && b.minion && b.minion.hp === a.minion.hp), `${nm}: the minion it calls takes only the rift's monster keys (hp ${a.minion && a.minion.hp} -> ${b.minion && b.minion.hp}, foeK.mon ${b.foeK.mon})`);
  }
  console.log('errors', errors.length, errors.slice(0, 3)); ok(!errors.length, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
