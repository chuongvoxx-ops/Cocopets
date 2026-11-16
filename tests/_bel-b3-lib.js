// Kharrox the Bellback (Belfry boss 1, worker B3): shared set-up for the _bel-b3-* tests. Plays the real Belfry stage whose
// boss is 'belkharrox' when the rift has one; otherwise a test-only rift ('belk', level 10, one boss stage on
// FIEND_DEFS.belkharrox.stageMake). god mode OFF (damage is measured; the bot tops the pet up if asked).
// env: HTML (default test-belB3.html), TESTRIFT=1 (always the test rift), SHOTS=1.
process.env.HTML = process.env.HTML || 'test-belB3.html';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function openBel(opts) {
  opts = opts || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: opts.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Kharrox|GLM/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 240000 }); await page.waitForTimeout(300);
  await page.evaluate(([gl, lvl, testRift]) => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = lvl; for (const p of P.partyPets()) { p.dlv = lvl; p.dxp = 0; }
    if (gl) { window.__BELK_GL = 1; window.__NG_GL = 1; } if (testRift) window.__TESTRIFT = 1;
    if (!P.RIFT_BY_ID.belk) { const make = (X, self, H) => P.FIEND_DEFS.belkharrox.stageMake(X, self, H), Rb = P.RIFT_BY_ID.belfry;
      const R = { id: 'belk', n: 0, lvl: 10, name: 'Test Belfry', sigil: 'Tide', biome: 'belfry', aff: ['water', 'dark'], scale: Rb && Rb.scale, ease: Rb && Rb.ease, mons: ['crawler', 'leech', 'reeflantern'], stages: [{ kind: 'boss', biome: 'belfry', name: 'The Baptism Font', boss: 'belkharrox', goal: 'Kharrox the Bellback', seal: false, make }] };
      P.RIFTS.push(R); P.RIFT_BY_ID.belk = R; }
    P.openMap(); P.dun.setMapTab('rift', true); }, [opts.gl !== false, opts.lvl || 10, !!process.env.TESTRIFT]);
  const shot = async name => { await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b3-${name}.png`), timeout: 0 }); };
  const start = async () => { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const Rb = P.RIFT_BY_ID.belfry, real = Rb && !window.__TESTRIFT ? Rb.stages.findIndex(S => S.boss === 'belkharrox') : -1; window.__BELRIFT = real >= 0 ? 'belfry' : 'belk';
      for (let i = P.RIFT_PLAN.length - 1; i >= 0; i--) if (P.RIFT_PLAN[i].id === 'belk') P.RIFT_PLAN.splice(i, 1); P.openMap(); P.dun.setMapTab('rift', true);
      if (real >= 0) { const prog = P.riftState().prog; if (prog) prog.belfry = real; P.startRift('belfry', real); } else { P.RIFT_PLAN.push({ id: 'belk', n: 0, zero: true, name: 'Test Belfry', lvl: 10, region: 'test', sigil: 'Tide', gate: null, icon: 'eye' }); P.startRift('belk', 0); } });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 }); await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.g.boss && D.FD && D.FD.S.started; }, null, { timeout: 300000 }); };
  // run in the page with the usual names in scope: D, b (the boss), FX, M (its memory), me, DEF, U (the game), frame(), clock(secs)
  const PRE = `const D = window.__pp.arc.game._dbg, U = window.__pp.arc.game, b = D.g.boss || D.mons.find(q => q.boss), FX = D.FD && D.FD.FX, M = FX && FX.mem, me = D.me, DEF = window.__pp.FIEND_DEFS.belkharrox;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 8000; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  return { browser, page, errors, shot, start, ev };
}
module.exports = { openBel };
