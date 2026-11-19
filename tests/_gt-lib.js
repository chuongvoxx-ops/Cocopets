// v423 GT: shared helpers for the Garden of Unborn Stars trap tests (tests/_gt-*.js)
// open(opts) -> { browser, page, errors }; stage(page, i) starts Rift 02's stage i and waits for play; X/H caught as made
const path = require('path');
async function open(o) { o = o || {}; const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true }); page.setDefaultTimeout(o.timeout || 400000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  if (o.gpu) await page.addInitScript(() => { window.__NG_GL = 1; window.__GLM_WARM = 0; });
  if (o.init) await page.addInitScript(o.init);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-gt.html'), { timeout: 400000 }); await page.waitForFunction(() => window.__pp, null, { timeout: 400000 });
  return { browser, page, errors }; }
async function stage(page, i, seed) {
  await page.evaluate(([i, seed]) => { const P = window.__pp; if (!window.__gtBoot) { P.quickStart('Bot'); window.__gtBoot = 1; } P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 20; P.st.dun.best = 20;
    const Rf = P.RIFT_BY_ID.garden; Rf.stages.forEach((S, k) => { if (S.kind !== 'fight' || S.__gtw) return; const ex = S.extra; S.extra = function (X, self, H) { window.__XH = { X, H, k }; return ex ? ex.call(this, X, self, H) : {}; }; S.__gtw = 1; });
    if (seed != null) { window.__gtSeed = seed; }
    P.openMap(); P.dun.setMapTab('rift', true); P.startRift('garden', i); }, [i, seed == null ? null : seed]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play');
}
function reporter() { const results = []; const ok = (name, pass, info) => { results.push(!!pass); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + JSON.stringify(info) : ''}`); }; return { results, ok }; }
module.exports = { open, stage, reporter };
