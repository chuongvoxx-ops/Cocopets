// v445 SB: the shots of Asmodeus's boss fight (GPU on): the intro, every power's tell and strike, the pinned stinger and its break, the
// crystal and the spines, the web, the molt, the expose, the seal and the starlight, the phases, The Seventh Sin, the fall, the win.
// usage: HTML=<test page> DPR=1 node tests/_sx-shots.js -> shots/v445-SB/sx-d<DPR>-<name>.png ; then python3 tests/_sx-sheet.py sx-d<DPR>
const L = require('./_sx-lib');
const DPR = +(process.env.DPR || 1), DIR = 'v445-SB', tag = `sx-d${DPR}${process.env.LOWFX ? 'L' : ''}`, ONLY = process.env.ONLY || '';
(async () => {
  const T = await L.open({ gl: true, dpr: DPR, lowFx: !!process.env.LOWFX, god: true });
  const t0 = Date.now(), shot = async n => { if (ONLY && !n.startsWith(ONLY)) return; await T.shot(DIR, `${tag}-${n}`); console.log('shot', n, ((Date.now() - t0) / 1000).toFixed(0) + 's'); };
  const E = (b, a) => T.ev(b, a);
  const HOME = `const home = () => { SB.test.abortActs(true); S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.vx = S.B.vy = 0; S.waves.length = 0; S.marks.length = 0; S.idleT = 99; me.hp = D.ST.hp; S.debt = 0; S.seal = null; };`;
  try {
    await T.start();
    await E(`hold(S.m.x + 0.8, S.m.y + 6.2); step(1.6); return 1;`); await shot('01-intro-sigil');
    await E(`step(1.3); return 1;`); await shot('02-intro-cocoon');
    await E(`step(1.2); return 1;`); await shot('03-intro-crown');
    await T.fight(); await E(`SB.test.hold(true); hold(S.m.x + 1.4, S.m.y + 5.2); step(1.2, () => hold(S.m.x + 1.4, S.m.y + 5.2)); return 1;`); await shot('04-fight');
    // Sevenfold Perdition: marks under the pet, the strikes, the pinned stinger
    await E(`${HOME} home(); S.phase = 2; let px = S.m.x + 1.2, py = S.m.y + 4.6; hold(px, py); const A = SB.test.force('perd'); step(A.wind + 0.25, (t) => { px += 0.05; hold(px, py); }); return 1;`); await shot('05-perd-marks');
    await E(`let px = me.x, py = me.y; step(0.75, () => { px -= 0.06; hold(px, py); }); return S.debt;`); await shot('06-perd-strikes');
    await E(`const A = S.acts[0]; step(A.end - A.t + 0.5, () => hold(me.x, me.y)); return !!S.pin;`).then(r => console.log('pinned', r)); await shot('07-pin');
    await E(`const PN = S.pin; if (PN) { hold(PN.x + 0.6, PN.y + 0.9); for (let i = 0; i < 90 && S.pin; i++) { D.hitMon(PN.part.m, 60, { noCrit: true }); step(0.05); } } step(0.15); return { broke: S.stat.broke, expose: !!S.expose };`).then(r => console.log('break', JSON.stringify(r))); await shot('08-stinger-break');
    await E(`step(0.9); return 1;`); await shot('09-exposed');
    // Scarlet Rupture: the crystal and the spines' lee; the shatter; the rings
    await E(`${HOME} S.expose = null; S.m.stunT = 0; S.m.act = 'fight'; home(); S.phase = 2; hold(S.m.x + 1.0, S.m.y + 5.4); const A = SB.test.force('rupt'); step(2.6, () => hold(S.m.x + 1.0, S.m.y + 5.4)); return S.spines.length;`).then(r => console.log('spines', r)); await shot('10-rupt-crystal');
    await E(`const A = S.acts[0]; const sp = S.spines[0]; step(A.shat - A.t + 0.25, () => { if (sp) { const dx = sp.x - S.m.x, dy = sp.y - S.m.y, d = Math.hypot(dx, dy); hold(sp.x + dx / d * 1.3, sp.y + dy / d * 1.3); } }); return 1;`); await shot('11-rupt-rings');
    await E(`step(0.5); return S.stat.ruptCover;`).then(r => console.log('covered', r)); await shot('12-rupt-rings2');
    // the Crimson Labyrinth
    await E(`${HOME} step(2); home(); S.phase = 2; hold(S.m.x + 1.5, S.m.y + 4.8); SB.test.force('lab'); step(2.2, () => hold(me.x, me.y)); return S.web ? S.web.threads.length : 0;`).then(r => console.log('threads', r)); await shot('13-web');
    await E(`step(2.5, () => hold(me.x, me.y)); return 1;`); await shot('14-web-turned');
    // Eclipse Molt: the shells and the real one; the ambush's glint
    await E(`${HOME} step(0.5); home(); S.phase = 3; hold(S.m.x + 0.5, S.m.y + 4.6); SB.test.force('molt'); step(1.6, () => hold(me.x, me.y)); return S.molt ? S.molt.shells.length : -1;`).then(r => console.log('shells', r)); await shot('15-molt-hunt');
    await E(`const M = S.molt; if (M) step(TU.mtHunt[2] - TU.mtTell - M.huntT + 0.45, () => hold(me.x, me.y)); return 1;`); await shot('16-molt-ambush-tell');
    await E(`step(0.5, () => hold(me.x, me.y)); return 1;`); await shot('17-molt-ambush');
    await E(`${HOME} step(1); home(); S.phase = 2; hold(S.m.x + 0.5, S.m.y + 4.6); SB.test.force('molt'); step(1.7, () => hold(me.x, me.y)); const s = S.molt && S.molt.shells[0]; if (s) { hold(s.x + 0.4, s.y + 2.6); D.hitMon(s.part.m, 50, { noCrit: true }); } step(0.25); return !!s;`); await shot('18-molt-shell-cracks');
    // the seal and the starlight
    await E(`${HOME} step(1.5); S.molt && SB.test.abortActs(true); home(); S.phase = 2; hold(S.m.x + 1.2, S.m.y + 4.6); SB.test.addDebt(7); step(1.4, () => hold(me.x, me.y)); return { seal: !!S.seal, pools: S.pools.length };`).then(r => console.log('seal', JSON.stringify(r))); await shot('19-seal-starlight');
    await E(`const p = S.pools.find(q => !q.used); if (p) { hold(p.x, p.y); step(0.6, () => hold(p.x, p.y)); } return S.debt;`).then(r => console.log('debt after pool', r)); await shot('20-purified');
    // the Tail Lash
    await E(`${HOME} home(); hold(S.m.x + 0.6, S.m.y + 2.8); SB.test.force('lash'); step(0.42, () => hold(me.x, me.y)); return 1;`); await shot('21-lash-tell');
    // phase III's seven at once, the eruption
    await E(`${HOME} step(0.5); home(); S.phase = 3; hold(S.m.x + 1.2, S.m.y + 4.6); const A = SB.test.force('perd'); step(A.finT - 0.45, () => hold(me.x, me.y)); return 1;`); await shot('22-perd-seven-mark');
    await E(`step(0.5, () => hold(me.x, me.y)); return 1;`); await shot('23-perd-seven');
    // The Seventh Sin: the seals, a strike's mark, the Testament (sheltered), the fall
    await E(`${HOME} step(3); home(); S.phase = 3; hold(S.m.x + 1.2, S.m.y + 4.6); SB.test.force('sin'); step(2.4, () => hold(me.x, me.y)); return S.sin.refs.length;`).then(r => console.log('refs', r)); await shot('24-sin-seals');
    await E(`const UT = ASMODEUS_MOVES.UT; step(UT.p4 - S.sin.t, () => hold(me.x, me.y)); return 1;`); await shot('25-sin-bloom');
    await E(`const UT = ASMODEUS_MOVES.UT; let a = 0; step(UT.s[2] - S.sin.t - 0.3, () => { a += 0.08; hold(S.m.x + Math.cos(a) * 4.5, S.m.y + 3.5 + Math.sin(a) * 1.2); }); return 1;`); await shot('26-sin-strikes');
    await E(`const UT = ASMODEUS_MOVES.UT, q = S.sin.refs.slice().sort((a, b) => b.y - a.y)[0]; let a = 0; step(UT.s7 - S.sin.t + 0.1, () => { a += 0.08; hold(S.m.x + Math.cos(a) * 4.5, S.m.y + 3.5 + Math.sin(a) * 1.2); }); step(UT.det - S.sin.t - 0.2, () => hold(q.x, q.y)); window.__q = q; return 1;`); await shot('27-sin-before-testament');
    await E(`step(0.35, () => hold(window.__q.x, window.__q.y)); return S.stat.sinSafe;`).then(r => console.log('sheltered', r)); await shot('28-testament');
    await E(`step(1.4); return S.mode;`).then(r => console.log('mode', r)); await shot('29-fall');
    await E(`step(1.2); return 1;`); await shot('30-dissolve');
    await E(`step(1.4); return { won: g.won, mode: SB.test.S && SB.test.S.mode };`).then(r => console.log('end', JSON.stringify(r))); await shot('31-won');
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  await T.browser.close();
})();
