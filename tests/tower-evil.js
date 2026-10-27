// Tower bosses are Rift-touched Cocopets (floor bosses, guardians, key keepers, roamers); the old bosses fight as brutes in
// the packs at half a mini boss's health and blows; Super Fiend floors are unchanged
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 60 }); const { page, errors, run } = T;
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const floor = async n => { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('dungeon', true); });
    await page.evaluate(n => window.__pp.dun.startDungeon(n, 1234 + n), n); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => window.__pp.beginPlay()); await run(1); };
  const info = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.filter(m => m.type === 'boss'); return { name: D.F.bossName, fiend: !!D.F.fiend, guard: !!D.F.boss, brutes: b.filter(m => m.brute).map(m => ({ k: m.boss, hp: Math.round(m.hp), dmg: +m.dmg.toFixed(1), evil: !!m.evil })), others: b.filter(m => !m.brute).map(m => ({ k: m.boss, name: m.bname, evil: !!m.evil })) }; });
  for (const n of [6, 15, 25, 44, 85]) {
    await floor(n); let r = await info(); ok(r.brutes.length > 0 && r.brutes.every(b => !b.evil), `floor ${n}: brutes in the packs, drawn as themselves`, r.brutes.slice(0, 3));
    ok(r.others.every(b => b.evil), `floor ${n}: its key keepers and roamers are evil Cocopets`, r.others);
    // a mini boss for comparison: what the floor's boss would be at mini rank
    const cmp = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, br = D.mons.find(m => m.brute); if (!br) return null; const mb = D.makeBoss(br.bk, { lesser: true, hpK: 1, name: 'x' }); return { bruteHp: br.maxhp, miniHp: mb.maxhp, bruteDmg: br.dmg, miniDmg: mb.dmg, miniEvil: !!mb.evil }; });
    if (cmp) ok(Math.abs(cmp.bruteHp / cmp.miniHp - 0.5) < 0.02 && Math.abs(cmp.bruteDmg / cmp.miniDmg - 0.5) < 0.02 && cmp.miniEvil, `floor ${n}: a brute is half a mini boss (health and blows); the mini boss is an evil Cocopet`, cmp);
    await page.evaluate(() => window.__pp.arc.game._dbg.wakeBoss()); await run(2); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, gb = D.g.boss; return { name: gb && gb.bname, evil: !!(gb && gb.evil), n: D.mons.filter(m => m.type === 'boss' && !m.brute && !m.lesser && !m.dead).length, all: D.mons.filter(m => m.type === 'boss' && !m.brute && !m.lesser).every(m => !!m.evil), title: D.F.bossName }; });
    ok(r.evil && r.all, `floor ${n}: the floor's boss${r.n > 1 ? 'es' : ''} wake${r.n > 1 ? '' : 's'} as evil Cocopet${r.n > 1 ? 's' : ''}`, r);
  }
  await floor(10); const f = await info(); ok(f.fiend && !f.brutes.length, 'floor 10: the Super Fiend floor is unchanged (no brutes)', { name: f.name });
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); process.exit(bad ? 1 : 0);
})();
