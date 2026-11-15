// Bomb King (Rift 0, worker B): shared set-up for the _cal-b-* tests. The Caldera's rift entry may not exist yet, so a
// test-only rift ('calb', level 1, one boss stage on CAL.bossMake.calbomb / FIEND_DEFS.calbomb.make) is registered in
// the page. A level-1 starter (quickStart), god mode OFF (damage is measured, the pet topped up by the bot if asked).
// env: HTML (default test-calB.html), EASE (the test rift's Rf.ease, default 1), SHOTS=1 for screenshots to shots/.
process.env.HTML = process.env.HTML || 'test-calB.html';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function openCal(opts) {
  opts = opts || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: opts.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Bomb King|GLM/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(([ease, gl, testRift]) => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; if (gl) { window.__CALBOMB_GL = 1; } if (testRift) window.__TESTRIFT = 1;
    if (!P.RIFT_BY_ID.calb) { const make = (X, self, H) => P.FIEND_DEFS.calbomb.make(X, self, H);
      const R = { id: 'calb', n: 0, lvl: 1, name: 'Test Caldera', sigil: 'Ember', biome: 'volcano', aff: ['fire', 'earth'], ease: ease === 1 ? undefined : ease, mons: [], stages: [{ kind: 'boss', biome: 'volcano', name: 'The Runebound Throne', boss: 'calbomb', goal: 'The Bomb King', seal: false, make }] };
      P.RIFTS.push(R); P.RIFT_BY_ID.calb = R; }
    P.openMap(); P.dun.setMapTab('rift', true); }, [+(process.env.EASE || 1), opts.gl !== false, !!process.env.TESTRIFT]);
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-b-${name}.png`) }); };
  const start = async () => { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const real = P.RIFT_BY_ID.caldera && !window.__TESTRIFT ? P.RIFT_BY_ID.caldera.stages.findIndex(S => S.boss === 'calbomb') : -1; window.__CALRIFT = real >= 0 ? 'caldera' : 'calb';
      for (let i = P.RIFT_PLAN.length - 1; i >= 0; i--) if (P.RIFT_PLAN[i].id === 'calb') P.RIFT_PLAN.splice(i, 1); P.openMap(); P.dun.setMapTab('rift', true);
      if (real >= 0) P.startRift('caldera', real); else { P.RIFT_PLAN.push({ id: 'calb', n: 0, zero: true, name: 'Test Caldera', lvl: 1, region: 'test', sigil: 'Ember', gate: null, icon: 'eye' }); P.startRift('calb', 0); } });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 }); await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.g.boss && D.FD && D.FD.S.started; }, null, { timeout: 120000 }); };
  // run in the page with the usual names in scope: D, b (the boss), FX, M (its memory), me, frame(), clock(secs)
  const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss || D.mons.find(q => q.boss), FX = D.FD && D.FD.FX, M = FX && FX.mem, me = D.me, DEF = window.__pp.FIEND_DEFS.calbomb;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 6000; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  return { browser, page, errors, shot, start, ev };
}
module.exports = { openCal };
