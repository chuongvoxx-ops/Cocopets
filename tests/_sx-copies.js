// v445 SB: GL copies a frame (WebGL -> 2D, the PERF line's "GL copies n/frame") and the frame's JS ms in Asmodeus's fight (its own gate,
// GPU on) against Samael's (the Gate of Aries), the same way for both: the fight at rest and in each power, N frames drawn by the game's
// own loop (the game held), the pet 5 tiles south. usage: HTML=<test page> DPR=2 N=8 node tests/_sx-copies.js [asmodeus|samael|both]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const WHO = process.argv[2] || 'both', N = +(process.env.N || 8), DPR = +(process.env.DPR || 2);
async function run(who) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true }); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__AS_GL = 1; window.__SM_GL = 1; window.__NG_GL = 1; });
  const html = process.env.HTML || 'test-sx.html'; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  const gate = who === 'samael' || process.env.GATE === 'aries' ? 'caldera' : (await page.evaluate(() => !!window.SCORPIO_GATE)) ? 'dunes' : 'caldera', hook = who === 'samael' ? 'ARIES_BOSS' : 'SCORPIO_BOSS';
  await page.evaluate(([gate, hook]) => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = 10; P.st.dun.god = true; const RS = P.riftState(); RS.seals.caldera = 1; RS.seals.dunes = 1; P.st.dun.best = 30;
    if (gate === 'caldera' && hook === 'SCORPIO_BOSS') window.__AG_BOSS = window.SCORPIO_BOSS; P.openMap(); P.dun.setMapTab('rift', true); P.startGate(gate); }, [gate, hook]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; });
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, SB = window[arg.hook], S = SB.test.S;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; }; const step = (s, f) => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; if (f) f(); } };` + body))(arg), [body, Object.assign({ hook, gate }, arg || {})]);
  await ev(`const m = D.RIFT.self.mod, st = s => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } }; st(1.5); m.solve(); for (let i = 0; i < 1200 && m.S.phase !== 'open'; i++) st(0.1);
    const G = arg.gate === 'dunes' ? window.SCORPIO_GATE : { DOORX: 16.5, WALLY: 21 }; hold(G.DOORX, G.WALLY + 0.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss'; i++) { hold(G.DOORX, G.WALLY - 1.6); st(0.1); }
    for (let i = 0; i < 300 && !(window[arg.hook].test.S && window[arg.hook].test.S.mode === 'fight'); i++) { hold(G.DOORX, G.WALLY - 3); st(0.1); } window[arg.hook].test.hold(true); return 1;`);
  const frames = async () => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))); const out = [];
    for (let i = 0; i < N; i++) out.push(await page.evaluate(() => new Promise(r => requestAnimationFrame(() => { const p = PERF.stats ? PERF.stats(2000) : null; r({ cp: PERF.cpF, js: p && p.js ? +(p.js).toFixed(1) : null }); }))));
    return { copies: +(out.reduce((a, x) => a + x.cp, 0) / out.length).toFixed(2), each: out.map(x => x.cp).join(' ') }; };
  const scen = who === 'samael' ? [['rest', `step(2.0);`], ['charge', `SB.test.force('charge'); step(0.8);`], ['perd', `SB.test.force('perd'); step(1.2);`], ['over', `SB.test.force('over'); step(2.0);`], ['impact', `const A = SB.test.force('impact'); step(A.t4 + 0.3);`], ['wrath', `S.phase = 3; SB.test.force('wrath'); step(9.0);`]]
    : [['rest', `step(2.0);`], ['perd', `SB.test.force('perd'); step(1.3);`], ['pin', `const A = SB.test.force('perd'); step(A.end + 0.4);`], ['rupt', `S.phase = 2; SB.test.force('rupt'); step(2.5);`], ['web', `S.phase = 2; SB.test.force('lab'); step(2.5);`], ['molt', `S.phase = 3; SB.test.force('molt'); step(1.8);`], ['sin', `S.phase = 3; SB.test.force('sin'); step(8.0);`]];
  const res = {};
  for (const [k, body] of scen) { await ev(`if (S.mode !== 'fight') return 0; SB.test.abortActs(true); S.m.x = S.home.x; S.m.y = S.home.y; hold(S.m.x + 1, S.m.y + 5); ${body} hold(S.m.x + 1, S.m.y + 5); return 1;`); res[k] = await frames(); console.log(who, k.padEnd(7), 'copies', res[k].copies, '(' + res[k].each + ')'); }
  console.log(who, 'errors', JSON.stringify(errors.slice(0, 3))); await browser.close(); return res;
}
(async () => { for (const w of WHO === 'both' ? ['samael', 'asmodeus'] : [WHO]) await run(w); })();
