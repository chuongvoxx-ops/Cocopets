// Nhalu the Lantern Eel (Belfry boss 2, worker B4): shared set-up for the _bel-b4-* tests. The Belfry's new rift entry
// may not carry the boss yet, so a test-only rift ('beln', one boss stage on FIEND_DEFS.belnhalu.stageMake) is
// registered in the page, at level 13 (the floor Nhalu's stage plays as in a level-10 rift's second section). The pet is a
// level-10 starter (st.dlv = 10), god mode off. env: HTML (default test-belB4.html), REAL=1 to use the real Belfry stage
// when it has one.
process.env.HTML = process.env.HTML || 'test-belB4.html';
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function openBel(opts) {
  opts = opts || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: opts.w || 390, height: opts.h || 844 }, deviceScaleFactor: opts.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Nhalu|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(([gl, lvl, seed]) => { const P = window.__pp; { let sd = seed >>> 0 || 7; const mr = Math.random; Math.random = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; try { P.quickStart('Bot'); } finally { Math.random = mr; } }   /* (the same starter pet every run: PETSEED) */ P.st.dun.god = false; P.st.energy = 100; P.st.dlv = lvl; P.st.lv10Eggs = true;
    if (gl) { window.__NHALU_GL = 1; window.__NG_GL = 1; } else { window.__NHALU_GL = 0; window.__NHALU_FX = 0; }
    if (!P.RIFT_BY_ID.beln) { const make = (X, self, H) => P.FIEND_DEFS.belnhalu.stageMake(X, self, H);
      const R = { id: 'beln', n: 0, lvl: 13, name: 'Test Belfry', sigil: 'Tide', biome: P.RIFT_BY_ID.belfry ? P.RIFT_BY_ID.belfry.biome : 'swamp', aff: ['water', 'dark'], mons: [], stages: [{ kind: 'boss', biome: P.RIFT_BY_ID.belfry ? P.RIFT_BY_ID.belfry.biome : 'swamp', name: 'The Submerged Nave', boss: 'belnhalu', goal: 'Nhalu the Lantern Eel', seal: false, make }] };
      P.RIFTS.push(R); P.RIFT_BY_ID.beln = R; } }, [opts.gl !== false, opts.lvl || 10, +(process.env.PETSEED || 7)]);
  const shot = async name => { await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b4-${name}.png`), timeout: 900000 }); };
  const start = async () => { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100;
      const Rb = P.RIFT_BY_ID.belfry, ri = Rb && window.__BEL_REAL ? Rb.stages.findIndex(S => S.boss === 'belnhalu') : -1; window.__BELRIFT = ri >= 0 ? 'belfry' : 'beln';
      for (let i = P.RIFT_PLAN.length - 1; i >= 0; i--) if (P.RIFT_PLAN[i].id === 'beln') P.RIFT_PLAN.splice(i, 1); P.openMap(); P.dun.setMapTab('rift', true);
      if (ri >= 0) P.startRift('belfry', ri); else { P.RIFT_PLAN.push({ id: 'beln', n: 0, zero: true, name: 'Test Belfry', lvl: 13, region: 'test', sigil: 'Tide', gate: null, icon: 'eye' }); P.startRift('beln', 0); } }).catch(e => { throw e; });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.g.boss && D.FD && D.FD.S.started; }, null, { timeout: 180000 }); };
  // run in the page with the usual names in scope: D, b (the boss), FX, M (its memory), me, DEF, L (the lanes), frame(), clock(secs)
  const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss || D.mons.find(q => q.boss), FX = D.FD && D.FD.FX, M = FX && FX.mem, me = D.me, DEF = window.__pp.FIEND_DEFS.belnhalu, L = DEF.LANES, C = FX && FX.C;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 30000; };
    const put = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; };
    const stillFor = async secs => { const go = clock(secs); while (go()) { await frame(); me.vx = me.vy = 0; D.stick.x = D.stick.y = 0; } };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  return { browser, page, errors, shot, start, ev };
}
module.exports = { openBel };
