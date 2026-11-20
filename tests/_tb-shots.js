// v429 TB: the shots of Belial's boss fight on the real Gate of Taurus (GPU on): the intro, each power, the phase changes, Dominion,
// the defeat, the win. usage: HTML=test-tb.html DPR=1 node tests/_tb-shots.js  -> shots/v429-TB/tb-d<DPR>-<name>.png ; then python3 tests/_tb-sheet.py tb-d<DPR>
const L = require('./_tb-lib');
const DPR = +(process.env.DPR || 1), DIR = 'v429-TB', tag = `tb-d${DPR}`;
(async () => {
  const T = await L.open({ gl: true, dpr: DPR, lowFx: !!process.env.LOWFX });
  const t0 = Date.now(), shot = async n => { await T.shot(DIR, `${tag}-${n}`); console.log('shot', n, ((Date.now() - t0) / 1000).toFixed(0) + 's'); };
  const E = (b, a) => T.ev(b, a);
  const HOME = `const home = () => { S.m.x = S.home.x; S.m.y = S.home.y; S.B.x = S.m.x; S.B.y = S.m.y; S.B.vx = S.B.vy = 0; };`;
  try {
    await T.start();
    // the intro: the sigil and the pillars, the assembly, the roar and its name
    await E(`hold(S.m.x + 0.8, S.m.y + 6.2); step(1.3); return 1;`); await shot('01-intro-sigil');
    await E(`step(1.4); return 1;`); await shot('02-intro-assembly');
    await E(`step(0.9); return 1;`); await shot('03-intro-roar');
    await T.fight(); await E(`TB.test.hold(true); hold(S.m.x + 1.2, S.m.y + 5.2); step(1.2, () => hold(S.m.x + 1.2, S.m.y + 5.2)); return 1;`); await shot('04-fight');
    // Thronebreaker Rush: the lane, then the charge
    await E(`${HOME} home(); const m = S.m, px = m.x + 1.0, py = m.y + 5.4; hold(px, py); TB.test.force('rush'); step(0.85, () => hold(px, py)); return 1;`); await shot('05-rush-lane');
    await E(`const A = S.acts[0]; step(A.wind - A.t + 0.32, () => { me.hp = D.ST.hp; }); return 1;`); await shot('06-rush-charge');
    await E(`step(0.5, () => { me.hp = D.ST.hp; }); return 1;`); await shot('07-rush-impact');
    // Crown of Burdens: the field opens round the pet, then the rings come down over it
    await E(`${HOME} step(1.5); home(); const m = S.m; hold(m.x + 2.2, m.y + 4.8); TB.test.force('crown'); step(0.9); return 1;`); await shot('08-crown-open');
    await E(`step(1.4, () => { me.hp = D.ST.hp; }); return 1;`); await shot('09-crown-pull');
    // Citadel Carapace: up, struck and storing; broken; and (another) its retaliation
    await E(`${HOME} step(4, () => { me.hp = D.ST.hp; }); home(); const m = S.m; hold(m.x - 1.4, m.y + 4.4); TB.test.force('car'); step(1.4); for (let i = 0; i < 4; i++) { D.hitMon(m, S.pad ? S.pad.pool * 0.15 : 50, { noCrit: true }); step(0.15, () => hold(m.x - 1.4, m.y + 4.4)); } return 1;`); await shot('10-carapace-storing');
    await E(`const m = S.m; D.hitMon(m, S.pad ? S.pad.pool : 100, { noCrit: true }); step(0.3); return 1;`); await shot('11-carapace-broken');
    await E(`${HOME} step(3.4); home(); const m = S.m; hold(m.x + 1.2, m.y + 5.6); TB.test.force('car'); step(1.4); for (let i = 0; i < 5; i++) { D.hitMon(m, S.pad ? S.pad.pool * 0.12 : 50, { noCrit: true }); step(0.3, () => hold(m.x + 1.2, m.y + 5.6)); } step(TB.TUNE.carDur - 1.5 + 0.9 - 0.75, () => hold(m.x + 1.2, m.y + 5.6)); return 1;`); await shot('12-carapace-release');
    await E(`step(0.22, () => { me.hp = D.ST.hp; }); return 1;`); await shot('13-carapace-wave');
    // Graviton Stampede: its reach, a stomp's ring, the rocks over their rings
    await E(`${HOME} step(2, () => { me.hp = D.ST.hp; }); home(); const m = S.m, px = m.x + 1.4, py = m.y + 5.8; hold(px, py); TB.test.force('stamp'); step(0.62, () => hold(px, py)); return 1;`); await shot('14-stampede-ring');
    await E(`const m = S.m; step(0.75, () => { me.hp = D.ST.hp; }); return 1;`); await shot('15-stampede-rocks');
    // the tail anchor: its glowing tell
    await E(`${HOME} step(3, () => { me.hp = D.ST.hp; }); home(); const m = S.m; TB.test.hold(false); S.idleT = 99; S.swCd = 0; S.near = 0; step(5, () => { hold(m.x + 1.6, m.y + 2.6); return S.sweeps.length > 0 && S.sweeps[0].t > S.sweeps[0].tell * 0.75; }); TB.test.hold(true); return 1;`); await shot('16-tail-tell');
    await E(`const m = S.m; step(0.3, () => { hold(m.x + 1.6, m.y + 2.6); me.hp = D.ST.hp; }); return 1;`); await shot('17-tail-sweep');
    // phase II and its Dominion: the pillars rise, the lee lights, the compression, the slam (sheltered)
    await E(`${HOME} S.acts.length = 0; step(1.2, () => { me.hp = D.ST.hp; }); home(); const m = S.m; hold(m.x + 0.5, m.y + 5.2); m.hp = m.maxhp * 0.655; D.hitMon(m, 300, { noCrit: true }); step(0.3); me.hp = D.ST.hp; return 1;`); await shot('18-phase2');
    await E(`step(2.4); const J = S.dom, p = J.pillars.slice().sort((a, b) => b.lee.y - a.lee.y)[0]; window.__lee = p.lee; return 1;`); await shot('19-dominion-pillars');
    await E(`const q = window.__lee; step(2.0, () => hold(q.x, q.y)); return 1;`); await shot('20-dominion-weight');
    await E(`const q = window.__lee; step(TB.TUNE.domT[4] - S.dom.t - 0.25, () => hold(q.x, q.y)); return 1;`); await shot('21-dominion-compression');
    await E(`const q = window.__lee; step(0.33, () => hold(q.x, q.y)); return 1;`); await shot('22-dominion-slam');
    await E(`const q = window.__lee; step(0.9, () => hold(q.x, q.y)); return 1;`); await shot('23-dominion-pulse');
    await E(`step(3, () => { me.hp = D.ST.hp; }); return 1;`);
    // phase III: two powers at once
    await E(`${HOME} const m = S.m; m.hp = m.maxhp * 0.32; D.hitMon(m, 300, { noCrit: true }); step(10.5, () => { me.hp = D.ST.hp; }); TB.test.hold(true); home(); hold(m.x + 1.6, m.y + 5.2); TB.test.force('stamp'); TB.test.start('crown'); step(1.5, () => { me.hp = D.ST.hp; }); return { phase: S.phase };`).then(r => console.log('phase', JSON.stringify(r))); await shot('24-phase3-overlap');
    // the defeat
    await E(`${HOME} const m = S.m; S.acts.length = 0; step(4, () => { me.hp = D.ST.hp; }); home(); hold(m.x + 1.2, m.y + 5.4); D.hitMon(m, 1e9, { noCrit: true }); step(1.5); return 1;`); await shot('25-defeat-crumble');
    await E(`step(2.1); return 1;`); await shot('26-defeat-dissolve');
    await E(`step(1.6); return 1;`); await shot('27-defeat-dust');
    await E(`step(1.0); return { won: g.won, mode: TB.test.S && TB.test.S.mode };`).then(r => console.log('end', JSON.stringify(r))); await shot('28-won');
    await E(`let n = 0; while (P.arc.state === 'play' && n++ < 600) U.update(1 / 30); return P.arc.state;`); await T.page.waitForTimeout(1500); await T.page.screenshot({ path: require('path').resolve(__dirname, '..', 'shots', DIR, `${tag}-29-anima.png`) }); console.log('shot 29-anima');
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  await T.browser.close();
})();
