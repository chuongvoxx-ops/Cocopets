// v429 TB: Belial (the Gate of Taurus's boss, 20q2) measured against Calyx Astrum (20x, the Garden of Unborn Stars' last boss,
// Rift 02), the same way for both (as tests/_cb-tune.js measured Uldroth against Abaddon): a level-30 bot pet held still at DIST
// tiles south of the boss (never dodging, never sheltering), a steady stream of raw hits into the boss (RAW every 0.25 s,
// D.hitMon, no crits), the game stepped at DT, to the kill. Reports the time to kill and the damage taken per minute
// (ordinary blows; the scripted shelter blow, Dominion, apart). (Belial holds a court 22 x 16 tiles: when the spot DIST tiles south of it
// is off the court's floor, the pet is held DIST tiles from it at the nearest bearing round from south that is on the floor, 0.6 tiles
// inside its rim; Calyx's arena, radius 15, needs no such turn.)
// usage: HTML=test-tb.html node tests/_tb-tune.js [dist] [raw] [fps] [calyx|belial|both]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const DIST = +(process.argv[2] || 4), RAW = +(process.argv[3] || 300), DT = 1 / (+(process.argv[4] || 30)), WHO = process.argv[5] || 'both';
const RUN = `const raw = arg.raw, dist = arg.dist, dt = arg.dt; const out = { t: 0, hits: 0, ord: 0, shel: 0, nOrd: 0, nShel: 0, max: 0, blows: {} };
  let acc = 0, lastShel = SHEL(); const bb = BOSS(); out.hp = bb.maxhp;
  while (out.t < 1800 && !bb.dead) { const H0 = g.dmgTaken; U.update(dt); out.t += dt; acc += dt;
    if (!me.dead) { me.hp = 1e6; const q = CLAMP(bb.x, bb.y + dist); hold(q.x, q.y); }
    while (acc >= 0.25) { acc -= 0.25; if (!bb.dead && bb.act !== "enter" && READY()) { D.hitMon(bb, raw, { noCrit: true, noText: true }); out.hits++; } }
    const d = g.dmgTaken - H0, sc = SHEL(); if (d > 0) { if (sc !== lastShel) { out.shel += d; out.nShel++; } else { out.ord += d; out.nOrd++; out.max = Math.max(out.max, d); const k = Math.round(d / 10) * 10; out.blows[k] = (out.blows[k] || 0) + 1; } } lastShel = sc; }
  out.dead = bb.dead; out.ordPerMin = out.ord / out.t * 60; out.meanBlow = out.ord / Math.max(1, out.nOrd); return out;`;
const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g;
  const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };`;
async function page0(o) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BL_GL = 0; window.__GB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-tb.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = 30; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; P.riftState().seals.belfry = 1; P.riftState().seals.garden = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 120); });
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const play = async () => { await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000, polling: 500 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; }); };
  return { browser, page, errors, ev, play };
}
(async () => {
  const res = {};
  if (WHO !== 'belial') { const T = await page0(); try {
      await T.page.evaluate(() => { const P = window.__pp, i = P.RIFT_BY_ID.garden.stages.findIndex(s => s.boss === 'calyx'); if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.riftState().prog.garden = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('garden', i); });
      await T.play();
      await T.ev(`for (let i = 0; i < 400 && !(D.FD && D.FD.S && D.FD.S.started && g.boss && g.boss.act !== 'enter'); i++) { const b = g.boss || D.M.bossAt; if (b) hold(b.x, b.y + 4.5); U.update(1 / 30); } return 1;`);
      res.calyx = await T.ev(`const BOSS = () => g.boss, SHEL = () => 0, READY = () => true, CLAMP = (x, y) => ({ x, y }); ${RUN}`, { raw: RAW, dist: DIST, dt: DT });
      res.calyxErr = T.errors.slice(0, 3); } finally { await T.browser.close(); } }
  if (WHO !== 'calyx') { const T = await page0(); try {
      await T.page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('garden'); });
      await T.play();
      // the gate's puzzle solved through its own API, the door walked through: TAURUS_BOSS begins
      const SOL = [[0, 1, 2, 3, 0, 2, 4, 3, 1], [0, 1, 2, 3, 4, 2, 0, 5, 4], [2, 0, 1, 2, 3, 4, 5, 3, 6, 4]];
      const ph = await T.ev(`const m = D.RIFT.self.mod, SOL = arg; const st = (s) => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } };
        st(1.5); for (let k = 0; k < 3; k++) { for (let i = 0; i < 300 && !(m.R.sky === k && m.R.mode === 'play'); i++) st(0.1); for (const i of SOL[k]) { const s = m.stars[i]; hold(s.x + 0.6, s.y + 0.5); m.visit(i); } }
        for (let i = 0; i < 600 && m.S.phase !== 'open'; i++) st(0.1); hold(16.5, 21.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss'; i++) { hold(16.5, 19.4); st(0.1); }
        for (let i = 0; i < 300 && !(window.TAURUS_BOSS.test.S && window.TAURUS_BOSS.test.S.mode === 'fight'); i++) { hold(16.5, 18); st(0.1); } return m.S.phase + '/' + (window.TAURUS_BOSS.test.S && window.TAURUS_BOSS.test.S.mode);`, SOL);
      console.log('belial gate:', ph);
      res.bel = await T.ev(`const TB = window.TAURUS_BOSS, S = TB.test.S, BOSS = () => S.m, SHEL = () => S.stat.domHit, READY = () => true, A = TB.test.AR, inC = (x, y) => Math.pow(Math.abs((x - A.cx) / (A.rx - 0.6)), 2.6) + Math.pow(Math.abs((y - A.cy) / (A.ry - 0.6)), 2.6) < 1,
    CLAMP = (x, y) => { const b = BOSS(), d = Math.hypot(x - b.x, y - b.y); for (let i = 0; i <= 12; i++) for (const s of i ? [1, -1] : [1]) { const a = Math.PI / 2 + s * i * 0.26, q = { x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d }; if (inC(q.x, q.y)) return q; } return { x: b.x, y: Math.min(y, A.cy + A.ry - 0.6) }; }; ${RUN}`, { raw: RAW, dist: DIST, dt: DT });
      res.belStat = await T.ev(`const S = window.TAURUS_BOSS.test.S; return S ? S.stat : null;`); res.belErr = T.errors.slice(0, 3); } finally { await T.browser.close(); } }
  const f = o => o && `t ${o.t.toFixed(1)}s dead ${o.dead} hp ${Math.round(o.hp)} | ordinary ${Math.round(o.ord)} (${o.nOrd} blows, mean ${Math.round(o.meanBlow)}, max ${Math.round(o.max)}) ${Math.round(o.ordPerMin)}/min | shelter ${Math.round(o.shel)} (${o.nShel})`;
  console.log(`DIST ${DIST} RAW ${RAW} dt 1/${Math.round(1 / DT)}`);
  if (res.calyx) console.log('Calyx  ', f(res.calyx)); if (res.bel) console.log('Belial ', f(res.bel));
  if (res.calyx && res.bel) console.log(`ratio: time to kill ${(res.bel.t / res.calyx.t).toFixed(3)}  ordinary/min ${(res.bel.ordPerMin / res.calyx.ordPerMin).toFixed(3)}  mean blow ${(res.bel.meanBlow / res.calyx.meanBlow).toFixed(3)}`);
  console.log('blows C', JSON.stringify(res.calyx && res.calyx.blows), '\nblows B', JSON.stringify(res.bel && res.bel.blows));
  if (res.belStat) console.log('Belial stat', JSON.stringify(res.belStat)); console.log('errors', JSON.stringify([res.calyxErr, res.belErr]));
})();
