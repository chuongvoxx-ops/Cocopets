// v445 SB: Asmodeus (the Gate of Scorpio's boss, 20s2) measured against Ifrit (20zz8, the Blackfire Caldera's last boss) and Samael (20zza2,
// the Gate of Aries's, v444), the same way for all three (as tests/_sb-tune.js): a level-10 bot pet held still at DIST tiles south of the
// boss (never dodging, never cleansing, never sheltering, never striking a part), a steady stream of raw hits into the boss (RAW every
// 0.25 s, D.hitMon, no crits), the game stepped at DT, to the kill (Samael and Asmodeus: to the end of their fall; the time to their
// finale also given). Reports the time to kill and the damage taken per minute (ordinary blows; the finale's shelter blow apart: over 35%
// of the pet's health in one blow). Both gate bosses on the Aries altar (22 x 16 tiles: Asmodeus through its __AG_BOSS stand-in hook).
// usage: HTML=<test page> node tests/_sx-tune.js [dist] [raw] [fps] [ifrit|samael|asmodeus|all|both]   (both: samael + asmodeus)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const DIST = +(process.argv[2] || 4), RAW = +(process.argv[3] || 60), DT = 1 / (+(process.argv[4] || 30)), WHO = process.argv[5] || 'all';
const RUN = `const raw = arg.raw, dist = arg.dist, dt = arg.dt; const out = { t: 0, hits: 0, ord: 0, shel: 0, nOrd: 0, nShel: 0, max: 0, blows: {}, tW: null };
  const bb = BOSS(); out.hp = bb.maxhp; const big = D.ST.hp * 0.35;
  let acc = 0; while (out.t < 4800 && !bb.dead) { const H0 = g.dmgTaken; U.update(dt); out.t += dt; acc += dt; if (out.tW == null && WR()) out.tW = out.t;
    if (!me.dead) { me.hp = 1e6; const q = CLAMP(bb.x, bb.y + dist); hold(q.x, q.y); }
    while (acc >= 0.25) { acc -= 0.25; if (!bb.dead && bb.act !== "enter" && READY()) { D.hitMon(bb, raw, { noCrit: true, noText: true }); out.hits++; } }
    const d = g.dmgTaken - H0; if (d > 0) { if (d > big) { out.shel += d; out.nShel++; } else { out.ord += d; out.nOrd++; out.max = Math.max(out.max, d); const k = Math.round(d / 2) * 2; out.blows[k] = (out.blows[k] || 0) + 1; } } }
  out.dead = bb.dead; out.ordPerMin = out.ord / out.t * 60; out.meanBlow = out.ord / Math.max(1, out.nOrd); return out;`;
const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g;
  const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };`;
async function page0() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__SM_GL = 0; window.__IFRIT_GL = 0; window.__AS_GL = 0; });
  const html = process.env.HTML || 'test-sx.html'; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = 10; P.st.unlockAll = true; P.riftState().seals.caldera = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 30); });
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const play = async () => { await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000, polling: 500 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; }); };
  return { browser, page, errors, ev, play };
}
async function gateBoss(name, hook, finK) {
  const T = await page0(); try {
    const gate = hook === 'SCORPIO_BOSS' && process.env.GATE !== 'aries' && await T.page.evaluate(() => !!window.SCORPIO_GATE) ? 'dunes' : 'caldera';
    await T.page.evaluate(([h, gate]) => { const P = window.__pp; P.riftState().seals.dunes = 1; if (h === 'SCORPIO_BOSS' && gate === 'caldera') window.__AG_BOSS = window.SCORPIO_BOSS; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate(gate); }, [hook, gate]);
    await T.play();
    const ph = await T.ev(`const m = D.RIFT.self.mod, B = window[arg.hook]; const st = (s) => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } }; const G = arg.gate === 'dunes' ? window.SCORPIO_GATE : { DOORX: 16.5, WALLY: 21 };
      st(1.5); m.solve(); for (let i = 0; i < 1200 && m.S.phase !== 'open'; i++) st(0.1); hold(G.DOORX, G.WALLY + 0.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss'; i++) { hold(G.DOORX, G.WALLY - 1.6); st(0.1); }
      for (let i = 0; i < 300 && !(B.test.S && B.test.S.mode === 'fight'); i++) { hold(G.DOORX, G.WALLY - 3); st(0.1); } return arg.gate + ': ' + m.S.phase + '/' + (B.test.S && B.test.S.mode);`, { hook, gate });
    console.log(name, 'gate:', ph);
    const res = await T.ev(`const SB = window[arg.hook], S = SB.test.S, BOSS = () => S.m, WR = () => !!S[arg.fin], READY = () => S.mode === 'fight', A = SB.test.AR, inC = (x, y) => Math.pow(Math.abs((x - A.cx) / (A.rx - 0.6)), A.n || 2.6) + Math.pow(Math.abs((y - A.cy) / (A.ry - 0.6)), A.n || 2.6) < 1 && !(A.solid && A.solid(x, y)),
      CLAMP = (x, y) => { const b = BOSS(), d = Math.hypot(x - b.x, y - b.y); for (let i = 0; i <= 12; i++) for (const s of i ? [1, -1] : [1]) { const a = Math.PI / 2 + s * i * 0.26, q = { x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d }; if (inC(q.x, q.y)) return q; } return { x: b.x, y: Math.min(y, A.cy + A.ry - 0.6) }; }; ${RUN}`, { raw: RAW, dist: DIST, dt: DT, hook, fin: finK });
    res.stat = await T.ev(`const S = window[arg].test.S; return S ? S.stat : null;`, hook); res.err = T.errors.slice(0, 3); return res; } finally { await T.browser.close(); } }
(async () => {
  const res = {};
  if (WHO === 'ifrit' || WHO === 'all') { const T = await page0(); try {
      await T.page.evaluate(() => { const P = window.__pp, i = P.RIFT_BY_ID.caldera.stages.findIndex(s => s.boss === 'califrit'); if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.riftState().prog.caldera = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', i); });
      await T.play();
      await T.ev(`for (let i = 0; i < 600 && !(D.FD && D.FD.S && D.FD.S.started && g.boss && g.boss.act !== 'enter'); i++) { const b = g.boss || D.M.bossAt; if (b) hold(b.x, b.y + 4.5); U.update(1 / 30); } return 1;`);
      res.ifrit = await T.ev(`const BOSS = () => g.boss, WR = () => false, READY = () => true, CLAMP = (x, y) => ({ x, y }); ${RUN}`, { raw: RAW, dist: DIST, dt: DT }); res.ifrit.err = T.errors.slice(0, 3); } finally { await T.browser.close(); } }
  if (WHO === 'samael' || WHO === 'all' || WHO === 'both') res.sam = await gateBoss('Samael', 'ARIES_BOSS', 'wr');
  if (WHO === 'asmodeus' || WHO === 'all' || WHO === 'both') res.asm = await gateBoss('Asmodeus', 'SCORPIO_BOSS', 'sin');
  const f = o => o && `t ${o.t.toFixed(1)}s${o.tW != null ? ' (finale at ' + o.tW.toFixed(1) + 's)' : ''} dead ${o.dead} hp ${Math.round(o.hp)} | ordinary ${Math.round(o.ord)} (${o.nOrd} blows, mean ${o.meanBlow.toFixed(1)}, max ${o.max.toFixed(1)}) ${Math.round(o.ordPerMin)}/min | shelter ${Math.round(o.shel)} (${o.nShel})`;
  console.log(`DIST ${DIST} RAW ${RAW} dt 1/${Math.round(1 / DT)}`);
  if (res.ifrit) console.log('Ifrit    ', f(res.ifrit)); if (res.sam) console.log('Samael   ', f(res.sam)); if (res.asm) console.log('Asmodeus ', f(res.asm));
  const ratio = (a, b, n) => a && b && console.log(`${n}: time to kill ${(a.t / b.t).toFixed(3)}  ordinary/min ${(a.ordPerMin / b.ordPerMin).toFixed(3)}  mean blow ${(a.meanBlow / b.meanBlow).toFixed(3)}`);
  ratio(res.asm, res.ifrit, 'Asmodeus / Ifrit'); ratio(res.asm, res.sam, 'Asmodeus / Samael'); ratio(res.sam, res.ifrit, 'Samael / Ifrit');
  for (const k of ['ifrit', 'sam', 'asm']) if (res[k]) console.log(k, 'blows', JSON.stringify(res[k].blows), res[k].stat ? '\n' + k + ' stat ' + JSON.stringify(res[k].stat) : '', 'errors', JSON.stringify(res[k].err));
})();
