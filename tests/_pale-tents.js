// What the Pale Intellect's nerves cost on floor 100 (phase PHASE), piece by piece: the real brain's eight nerves drawn
// on the game's canvas many times with parts of the toon tube left out, each pass flushed. env: HTML, PIN, CAP, PHASE
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const phase = +(process.env.PHASE || 2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 12345);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(100, 7); }, +(process.env.CAP || 0));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 1200 && !D.g.boss; i++) window.__run(1 / 60); });
  const r = await page.evaluate(phase => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, run = window.__run, Dp = P.FIEND_DEFS.pale, TN = P.FiendToon;
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (phase > 1) { m.hp = m.maxhp * ([1, 0.66, 0.31][phase - 1]); step(6); }
    const c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    c.save(); G.draw(c); c.restore();
    // catch the arguments of each nerve as the game paints it
    const calls = [], tl = TN.tubeLite; TN.tubeLite = function (c2, pts, wf, o) { calls.push([pts.map(p => p.slice()), wf, Object.assign({}, o)]); return tl.apply(this, arguments); };
    c.save(); G.draw(c); c.restore(); TN.tubeLite = tl;
    const N = 40, time = (fn) => { fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) fn(); fl(); return +((performance.now() - t0) / N).toFixed(3); };
    const tr = c.getTransform();
    const run1 = (mod) => () => { c.save(); c.setTransform(tr); for (const [pts, wf, o] of calls) tl(c, pts, wf, Object.assign({}, o, mod)); c.restore(); };
    const res = {
      n: calls.length, pts: calls.map(x => x[0].length), warm: time(run1({})),
      full: time(run1({})), noGlowBand: time(run1({ glowCol: null })), noHi: time(run1({ hi: false })), noLine: time(run1({ line: false })), fillOnly: time(run1({ glowCol: null, hi: false, line: false, force: false })),
    };
    // the same, with fewer points along each nerve (every other one)
    const half = calls.map(([pts, wf, o]) => [pts.filter((p, i) => i % 2 === 0 || i === pts.length - 1), wf, o]);
    res.halfPts = time(() => { c.save(); c.setTransform(tr); for (const [pts, wf, o] of half) tl(c, pts, wf, o); c.restore(); });
    // the pulses along them
    let pul = 0; for (const B of [M.B, M.F]) if (B) for (const Nn of B.tents) pul += Nn.pulses.filter(u => u >= 0 && u <= 1).length; res.pulses = pul;
    // and the arithmetic alone, painting nothing
    const nul = new Proxy({}, { get: (o, k) => (k === 'canvas' ? c.canvas : typeof c[k] === 'function' ? () => ({ addColorStop() {} }) : c[k]), set: () => true });
    res.jsOnly = time(() => { for (const [pts, wf, o] of calls) tl(nul, pts, wf, o); });
    return res;
  }, phase);
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
