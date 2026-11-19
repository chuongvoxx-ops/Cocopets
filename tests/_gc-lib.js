// v420 GC: shared helpers for the Gate of Cancer tests (the Oracle Shell and Abaddon's arena)
// open({ dpr }) -> a page with the hook, the Cancer gate (RIFT_GATES.belfry) started; HTML=test-gc.html by default
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) { errors.push('console: ' + m.text().slice(0, 300)); console.log('console error:', m.text().slice(0, 400)); } });
  const html = o.html || process.env.HTML || 'test-gc.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 30; if (o.lowFx) P.st.lowFx = true; P.riftState().seals.belfry = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 120); P.openMap(); P.dun.setMapTab('rift', true); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const start = async () => { await M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('belfry'); }); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await M(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 }); await page.waitForTimeout(400); };
  const run = secs => M(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  const frames = n => M(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  const goTo = (x, y) => M(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);
  const shot = async (dir, name) => { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png') }); };
  return { browser, page, errors, M, start, run, frames, goTo, shot };
}
module.exports = { open };
