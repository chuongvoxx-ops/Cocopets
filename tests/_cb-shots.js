// v420 CB: the shots of Abaddon's boss fight (GPU on): the intro, each power, a phase change, the Ninth Tide, the defeat.
// usage: HTML=test-cb.html DPR=1 node tests/_cb-shots.js [real]   -> shots/v420-CB/cb-d<DPR>-<name>.png ; then python3 tests/_cb-sheet.py
const L = require('./_cb-lib');
const DPR = +(process.env.DPR || 1), REAL = process.argv[2] === 'real', DIR = 'v420-CB', tag = `cb-d${DPR}`;
(async () => {
  const T = await L.open({ gl: true, dpr: DPR, real: REAL, lowFx: !!process.env.LOWFX });
  const t0 = Date.now(), shot = async n => { await T.shot(DIR, `${tag}-${n}`); console.log('shot', n, ((Date.now() - t0) / 1000).toFixed(0) + 's'); };
  const E = (b, a) => T.ev(b, a);
  try {
    await T.start();
    // the intro: the seal and the descent, the unfolding and its name
    await E(`hold(S.m.x + 0.5, S.m.y + 6); step(1.4); return 1;`); await shot('01-intro-seal');
    await E(`step(1.6); return 1;`); await shot('02-intro-bloom');
    await E(`step(0.5); return 1;`); await shot('03-intro-name');
    await T.fight(); await E(`CB.test.hold(true); hold(S.m.x + 1, S.m.y + 5.5); step(1.2, () => hold(S.m.x + 1, S.m.y + 5.5)); return 1;`); await shot('04-fight');
    // Crescent Reavers: the tells, then the blades
    await E(`const m = S.m; CB.test.force('rev'); step(0.85, () => hold(m.x + 1, m.y + 5.5)); return 1;`); await shot('05-reavers-tell');
    await E(`const m = S.m; step(0.6, () => hold(m.x + 1, m.y + 5.5)); me.hp = D.ST.hp; return 1;`); await shot('06-reavers-blades');
    // Gravitational Tide: opening, then lifting and dragging
    await E(`const m = S.m; step(1.5); CB.test.force('tide'); const f = S.fields[0]; hold(f.x + 2.5, f.y + 0.5); step(0.6); return 1;`); await shot('07-tide-open');
    await E(`step(1.2); me.hp = D.ST.hp; return 1;`); await shot('08-tide-lift');
    // Lunar Carapace: up, struck, broken
    await E(`const m = S.m; step(3); hold(m.x - 1.5, m.y + 4); CB.test.force('car'); step(1.3); for (let i = 0; i < 3; i++) { D.hitMon(m, S.pad ? S.pad.pool * 0.2 : 50, { noCrit: true }); step(0.12); } return 1;`); await shot('09-carapace');
    await E(`const m = S.m; D.hitMon(m, S.pad ? S.pad.pool : 100, { noCrit: true }); step(0.25); return 1;`); await shot('10-carapace-broken');
    // Eclipse Requiem: sealed and storing, then the shockwave
    await E(`const m = S.m; step(3.3); hold(m.x + 1, m.y + 4.5); const A = CB.test.force('ecl'); step(0.5); for (let i = 0; i < 8; i++) { D.hitMon(m, 220, { noCrit: true }); step(0.15); } return 1;`); await shot('11-eclipse-seal');
    await E(`const A = S.acts.find(q => q.kind === 'ecl'); step(A.seal - A.t + 0.12); me.hp = D.ST.hp; return 1;`); await shot('12-eclipse-requiem');
    // the claw: its glowing tell
    await E(`const m = S.m; step(1.5); CB.test.hold(false); S.idleT = 99; S.swCd = 0; S.near = 0; step(5, () => { hold(m.x + 1.6, m.y + 1.8); return S.sweeps.length > 0 && S.sweeps[0].t > S.sweeps[0].tell * 0.7; }); CB.test.hold(true); return 1;`); await shot('13-claw-tell');
    await E(`const m = S.m; step(0.35, () => hold(m.x + 1.6, m.y + 1.8)); me.hp = D.ST.hp; return 1;`); await shot('14-claw-sweep');
    // a phase change and its Ninth Tide
    await E(`const m = S.m; S.acts.length = 0; step(1); hold(m.x, m.y + 5); m.hp = m.maxhp * 0.655; D.hitMon(m, 300, { noCrit: true }); step(0.3); me.hp = D.ST.hp; return 1;`); await shot('15-phase2');
    await E(`step(1.6); return 1;`); await shot('16-t9-pockets');
    await E(`step(1.4); return 1;`); await shot('17-t9-sea');
    await E(`const p = S.t9.pockets[0]; hold(p.x, p.y); step(1.6, () => hold(p.x, p.y)); return 1;`); await shot('18-t9-compress');
    await E(`const p = S.t9.pockets[0]; step(TU.t9Strike - S.t9.t + 0.12, () => hold(p.x, p.y)); return 1;`); await shot('19-t9-blast');
    await E(`step(3); me.hp = D.ST.hp; return 1;`);
    // phase III: two powers at once
    await E(`const m = S.m; m.hp = m.maxhp * 0.325; D.hitMon(m, 300, { noCrit: true }); step(8, () => { me.hp = D.ST.hp; }); CB.test.hold(true); hold(m.x + 1, m.y + 5); CB.test.force('tide'); CB.test.start('rev'); step(1.55, () => { me.hp = D.ST.hp; }); return 1;`); await shot('20-phase3-overlap');
    // the defeat
    await E(`const m = S.m; S.acts.length = 0; step(4, () => { me.hp = D.ST.hp; }); hold(m.x + 1, m.y + 5); D.hitMon(m, 1e9, { noCrit: true }); step(1.9); return 1;`); await shot('21-defeat-falls');
    await E(`step(1.6); return 1;`); await shot('22-defeat-bloom');
    await E(`step(2.0); return { won: g.won, mode: CB.test.S && CB.test.S.mode };`).then(r => console.log('end', JSON.stringify(r))); await shot('23-won');
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 600)); }
  await T.browser.close();
})();
