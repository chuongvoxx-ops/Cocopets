// v435 SB: the shots of Samael's boss fight on the real Gate of Aries (GPU on): the intro, every power's tell and strike, the vent, the
// Cataclysm, the phases, the Wrath, the fall, the win. usage: HTML=test-sb.html DPR=1 node tests/_sb-shots.js -> shots/v435-SB/sb-d<DPR>-<name>.png ;
// then python3 tests/_sb-sheet.py sb-d<DPR>
const L = require('./_sb-lib');
const DPR = +(process.env.DPR || 1), DIR = 'v435-SB', tag = `sb-d${DPR}`, ONLY = process.env.ONLY || '';
(async () => {
  const T = await L.open({ gl: true, dpr: DPR, lowFx: !!process.env.LOWFX, god: true });
  const t0 = Date.now(), shot = async n => { if (ONLY && !n.startsWith(ONLY)) return; await T.shot(DIR, `${tag}-${n}`); console.log('shot', n, ((Date.now() - t0) / 1000).toFixed(0) + 's'); };
  const E = (b, a) => T.ev(b, a);
  const HOME = `const home = () => { SB.test.abortActs(); S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.z = 0; S.B.vx = S.B.vy = 0; S.waves.length = 0; S.idleT = 99; me.hp = D.ST.hp; };`;
  try {
    await T.start();
    // the intro: the sigil and the portal, the assembly round the reactor, the four hooves, the roar and its name
    await E(`hold(S.m.x + 0.8, S.m.y + 6.2); step(1.3); return 1;`); await shot('01-intro-sigil');
    await E(`step(1.4); return 1;`); await shot('02-intro-assembly');
    await E(`step(0.85); return 1;`); await shot('03-intro-roar');
    await T.fight(); await E(`SB.test.hold(true); hold(S.m.x + 1.4, S.m.y + 5.2); step(1.2, () => hold(S.m.x + 1.4, S.m.y + 5.2)); return 1;`); await shot('04-fight');
    // Hellbreak Charge: the lane, the gallop, the end (phase II: its shockwave)
    await E(`${HOME} home(); S.phase = 2; const m = S.m, px = m.x + 1.0, py = m.y + 5.6; hold(px, py); SB.test.force('charge'); step(0.85, () => hold(px, py)); return 1;`); await shot('05-charge-lane');
    await E(`const A = S.acts[0]; step(A.wind - (A.t - A.t0) + 0.3, () => { me.hp = D.ST.hp; }); return 1;`); await shot('06-charge-gallop');
    await E(`const A = S.acts[0]; if (A) step(A.wind + A.ct - (A.t - A.t0) + 0.12, () => { me.hp = D.ST.hp; }); return 1;`); await shot('07-charge-impact');
    await E(`step(1.6, () => { me.hp = D.ST.hp; }); S.phase = 1; return 1;`);
    // Horns of Perdition: the fan's filaments (one path dark), the crescents in flight; phase III's cross: its mark, its blast
    await E(`${HOME} home(); const m = S.m, px = m.x + 0.6, py = m.y + 5.4; hold(px, py); const A = SB.test.force('perd'); step(A.wind - 0.12, () => hold(px, py)); return 1;`); await shot('08-perd-tell');
    await E(`step(0.42, () => { me.hp = D.ST.hp; }); return 1;`); await shot('09-perd-crescents');
    await E(`${HOME} step(2.5, () => { me.hp = D.ST.hp; }); home(); S.phase = 3; const m = S.m, px = m.x + 0.6, py = m.y + 5.4; hold(px, py); const A = SB.test.force('perd'); step(A.last + 0.45 + 0.6, () => { hold(px, py); me.hp = D.ST.hp; }); return 1;`); await shot('10-perd-cross-mark');
    await E(`const k = S.marks[0]; step(k ? k.tell - k.t + 0.12 : 0.4, () => { me.hp = D.ST.hp; }); return 1;`); await shot('11-perd-cross-blast');
    await E(`step(1.2, () => { me.hp = D.ST.hp; }); S.phase = 1; return 1;`);
    // Furnace Overdrive: the corona drawn out (the tell), then burning
    await E(`${HOME} home(); const m = S.m; hold(m.x + 1.6, m.y + 5.4); SB.test.force('over'); step(0.7, () => hold(m.x + 1.6, m.y + 5.4)); return 1;`); await shot('12-over-tell');
    await E(`const m = S.m; step(1.4, () => { hold(m.x + 1.6, m.y + 5.4); me.hp = D.ST.hp; }); return 1;`); await shot('13-over-corona');
    // First Impact: the leap and the glowing spot, the landing, the rings with their gaps and the spires' lee
    await E(`${HOME} S.over = 0; step(0.2); S.vent = null; S.m.stunT = 0; S.ventQ = 0; home(); S.phase = 2; const m = S.m; hold(m.x + 2.2, m.y + 5.2); const A = SB.test.force('impact'); step(A.t2 + 0.35, () => hold(m.x + 2.2, m.y + 5.2)); window.__A = A; return 1;`); await shot('14-impact-hang');
    await E(`const A = window.__A; step(A.t4 - A.t + 0.06, () => { me.hp = D.ST.hp; }); return 1;`); await shot('15-impact-landing');
    await E(`const A = window.__A; hold(A.tx - 0.5, A.ty - 4.2); step(0.45, () => { me.hp = D.ST.hp; }); return 1;`); await shot('16-impact-rings');
    await E(`step(0.5, () => { me.hp = D.ST.hp; }); return 1;`); await shot('17-impact-spires');
    // the vent: the heart bared, the pale arc in front; a blow on the heart
    await E(`${HOME} step(1.5, () => { me.hp = D.ST.hp; }); S.phase = 1; S.vent = null; S.m.stunT = 0; S.ventQ = 0; home(); S.ruin = 70; const m = S.m; hold(m.x + 1.0, m.y + 4.4); step(0.8, () => hold(m.x + 1.0, m.y + 4.4)); SB.test.force('vent'); step(0.9); return 1;`); await shot('18-vent');
    await E(`const m = S.m; for (let i = 0; i < 3; i++) { D.hitMon(m, 300, { noCrit: true }); step(0.1); } return S.ruin;`).then(r => console.log('ruin after heart blows', r)); await shot('19-vent-heart-struck');
    // the Cataclysm State
    await E(`${HOME} step(3); S.vent = null; S.m.stunT = 0; S.ventQ = 0; home(); hold(S.m.x + 1.6, S.m.y + 5.2); S.ruin = 99; SB.test.gain(3); step(1.0, () => { me.hp = D.ST.hp; }); return 1;`); await shot('20-cataclysm');
    await E(`const m = S.m, px = m.x + 1.0, py = m.y + 5.6; hold(px, py); SB.test.force('charge'); step(0.8, () => hold(px, py)); return 1;`); await shot('21-cataclysm-charge-lane');
    await E(`S.cata = 0.01; step(0.5, () => { me.hp = D.ST.hp; }); S.vent = null; S.m.stunT = 0; S.ventQ = 0; S.ruin = 0; return 1;`);
    // the phases: II (a roar's gapped ring, then the Overdrive), III (a roar, then the Cataclysm)
    await E(`${HOME} home(); SB.test.hold(true); const m = S.m; hold(m.x + 0.8, m.y + 5.4); m.hp = m.maxhp * 0.659; D.hitMon(m, 400, { noCrit: true }); step(1.05, () => { me.hp = D.ST.hp; }); return S.phase;`); await shot('22-phase2-roar');
    await E(`step(1.9, () => { me.hp = D.ST.hp; }); S.over = 0.01; step(0.3); S.vent = null; S.m.stunT = 0; S.ventQ = 0; return 1;`);
    await E(`${HOME} home(); const m = S.m; hold(m.x + 0.8, m.y + 5.4); m.hp = m.maxhp * 0.329; D.hitMon(m, 400, { noCrit: true }); step(1.9, () => { me.hp = D.ST.hp; }); return S.phase;`); await shot('23-phase3-cataclysm');
    await E(`S.cata = 0.01; step(0.3); S.vent = null; S.m.stunT = 0; S.ventQ = 0; S.ruin = 0; return 1;`);
    // Wrath of the Fallen: the Awakening (the refuges light), the Ascension, the Fallen Star, the impact (sheltered), after
    await E(`${HOME} home(); const m = S.m; hold(m.x + 1.2, m.y + 4.5); m.hp = m.maxhp * 0.049; D.hitMon(m, 400, { noCrit: true }); step(1.9, () => { me.hp = D.ST.hp; }); window.__q = S.wr ? S.wr.refs.slice().sort((a, b) => b.y - a.y)[0] : null; return !!S.wr;`).then(r => console.log('wrath', r)); await shot('24-wrath-awakening');
    await E(`const q = window.__q; step(SAMAEL_MOVES.UT.p2 + 0.3 - S.wr.t, () => { hold(q.x, q.y); me.hp = D.ST.hp; }); return 1;`); await shot('25-wrath-seal');
    await E(`const q = window.__q; step(SAMAEL_MOVES.UT.launch + 0.5 - S.wr.t, () => { hold(q.x, q.y); me.hp = D.ST.hp; }); return 1;`); await shot('26-wrath-ascension');
    await E(`const q = window.__q; step(SAMAEL_MOVES.UT.dive + 0.6 - S.wr.t, () => { hold(q.x, q.y); me.hp = D.ST.hp; }); return 1;`); await shot('27-wrath-fallen-star');
    await E(`const q = window.__q; step(SAMAEL_MOVES.UT.hit + 0.15 - S.wr.t, () => { hold(q.x, q.y); }); return S.stat.wrathSafe;`).then(r => console.log('sheltered', r)); await shot('28-wrath-impact');
    await E(`const q = window.__q; step(1.2, () => { hold(q.x, q.y); }); return 1;`); await shot('29-wrath-after');
    // the fall
    await E(`step(SAMAEL_MOVES.UT.p5 - S.wr.t + 0.95); return S.mode;`).then(r => console.log('mode', r)); await shot('30-fall-roar');
    await E(`step(1.35); return 1;`); await shot('31-fall-dissolve');
    await E(`step(1.7); return { won: g.won, mode: SB.test.S && SB.test.S.mode };`).then(r => console.log('end', JSON.stringify(r))); await shot('32-won');
    await E(`let n = 0; while (P.arc.state === 'play' && n++ < 600) U.update(1 / 30); return P.arc.state;`); await T.page.waitForTimeout(1500); if (!ONLY) { await T.page.screenshot({ path: require('path').resolve(__dirname, '..', 'shots', DIR, `${tag}-33-anima.png`) }); console.log('shot 33-anima'); }
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  await T.browser.close();
})();
