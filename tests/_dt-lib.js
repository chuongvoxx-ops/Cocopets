// v433 DT: shared helpers for the Rift 03 dune trap tests (tests/_dt-*.js)
// open(opts) -> { browser, page, errors }; stage(page, i) starts Rift 03's stage i and waits for play; X/H caught as made
const path = require('path');
async function open(o) { o = o || {}; const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true }); page.setDefaultTimeout(o.timeout || 400000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  if (o.gpu) await page.addInitScript(() => { window.__NG_GL = 1; window.__GLM_WARM = 0; });
  if (o.init) await page.addInitScript(o.init);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-dt.html'), { timeout: 400000 }); await page.waitForFunction(() => window.__pp, null, { timeout: 400000 });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); window.__dtBoot = 1; P.st.unlockAll = true;
    if (!window.__rdw) { const rd = window.__pp.riftDef; } });
  return { browser, page, errors }; }
async function stage(page, i, seed) {
  await page.evaluate(([i, seed]) => { if (seed != null) { const o = Math.random; let x = seed >>> 0; window.__mr = o; Math.random = () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }   // (a seeded Math.random while the floor is rolled: the same layout before and after)
    const P = window.__pp; P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 30; P.st.dun.best = 30; P.st.unlockAll = true;
    const Rf = P.RIFT_BY_ID.dunes; Rf.stages.forEach((S, k) => { if (S.__dtw) return; if (S.kind === 'fight') { const ex = S.extra; S.extra = function (X, self, H) { window.__XH = { X, H, k, self }; return ex ? ex.call(this, X, self, H) : {}; }; }
      else if (S.kind === 'puzzle') { const mk = S.make; S.make = function (X, self, H) { window.__XH = { X, H, k, self }; return mk.call(this, X, self, H); }; } S.__dtw = 1; });
    P.openMap(); P.dun.setMapTab('rift', true); P.startRift('dunes', i); }, [i, seed == null ? null : seed]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 }); await page.evaluate(() => { if (window.__mr) { Math.random = window.__mr; window.__mr = null; } }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play');
}
function reporter() { const results = []; const ok = (name, pass, info) => { results.push(!!pass); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + JSON.stringify(info) : ''}`); }; return { results, ok }; }
module.exports = { open, stage, reporter };
