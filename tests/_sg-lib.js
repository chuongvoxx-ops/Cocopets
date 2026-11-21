// v445 AG: shared helpers for the Gate of Scorpio tests (the Amber Vigil and the Amber Sanctum)
// open({ dpr, lowFx, html, seal }) -> a page with the hook and a fresh save, the Mouth Beneath the Dunes sealed; HTML=<a test build> (default test-sg.html)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) { errors.push('console: ' + m.text().slice(0, 300)); console.log('console error:', m.text().slice(0, 400)); } });
  const html = o.html || process.env.HTML || 'test-sg.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 30; if (o.lowFx) P.st.lowFx = true; if (o.seal !== false) P.riftState().seals.dunes = 1; P.openMap(); P.dun.setMapTab('rift', true); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const start = async () => { await M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('dunes'); }); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await M(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 }); await page.waitForTimeout(400); };
  const run = secs => M(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  // (game time: a software GPU draws slowly, and the game's clock runs with its frames)
  const runG = secs => M(async secs => { const D = window.__pp.arc.game._dbg; const t0 = D.g.t, r0 = performance.now(); while (D.g.t - t0 < secs && performance.now() - r0 < 120000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  const goTo = (x, y) => M(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);
  // wait (in game frames) until an expression over the gate module m (and a) holds, or secs pass
  const until = (f, a, secs) => M(async ([f, a, secs]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, fn = new Function('m', 'a', 'D', 'return ' + f); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000 && !fn(m, a, D)) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) D.me.hp = D.ST.hp; } return fn(m, a, D); }, [f, a, secs]);
  const shot = async (dir, name) => { const fs = require('fs'), d = path.resolve(__dirname, '..', 'shots', dir); fs.mkdirSync(d, { recursive: true }); await page.screenshot({ path: path.join(d, name + '.png') }); };
  return { browser, page, errors, M, start, run, runG, goTo, until, shot };
}
module.exports = { open };
