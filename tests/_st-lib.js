// v463 ST: shared helpers for the Rift 04 (Sepulchre) trap tests (tests/_st-*.js)
// open(opts) -> { browser, page, errors }; stage(page, i, seed) starts Rift 04's stage i and waits for play; X/H caught as made
// HTML=<abs path of a test build> (python3 src/build.py --test-only <abs path>)
const path = require('path');
async function open(o) { o = o || {}; const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true }); page.setDefaultTimeout(o.timeout || 400000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  if (o.gpu) await page.addInitScript(() => { window.__NG_GL = 1; window.__GLM_WARM = 0; });
  if (o.nogl) await page.addInitScript(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, a) { if (/webgl/i.test(k)) return null; return g0.call(this, k, a); }; });
  if (o.init) await page.addInitScript(o.init);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-st.html'), { timeout: 400000 }); await page.waitForFunction(() => window.__pp, null, { timeout: 400000 });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; });
  return { browser, page, errors }; }
async function stage(page, i, seed) {
  await page.evaluate(([i, seed]) => { if (seed != null) { const o = Math.random; let x = seed >>> 0; window.__mr = o; Math.random = () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }   // (a seeded Math.random while the floor is rolled: the same layout before and after)
    const P = window.__pp; P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 42; P.st.dun.best = 42; P.st.unlockAll = true;
    const Rf = P.RIFT_BY_ID.sepulchre; Rf.stages.forEach((S, k) => { if (S.__stw) return; if (S.kind === 'fight') { const ex = S.extra; S.extra = function (X, self, H) { window.__XH = { X, H, k, self }; return ex ? ex.call(this, X, self, H) : {}; }; }
      else if (S.kind === 'puzzle') { const mk = S.make; S.make = function (X, self, H) { window.__XH = { X, H, k, self }; return mk.call(this, X, self, H); }; } S.__stw = 1; });
    P.openMap(); P.dun.setMapTab('rift', true); P.startRift('sepulchre', i); }, [i, seed == null ? null : seed]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: +(process.env.READY_MS || 1200000) }); await page.evaluate(() => { if (window.__mr) { Math.random = window.__mr; window.__mr = null; } }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play');
}
function reporter() { const results = []; const ok = (name, pass, info) => { results.push(!!pass); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + JSON.stringify(info) : ''}`); }; return { results, ok }; }
module.exports = { open, stage, reporter };
