// v430 BW: shared helpers for the Belfry water-drain and door tests: a page (DPR of choice) with the test hook, a Belfry
// stage started, the game run in real time (the drain and the doors are dt-based), and a few probes into the stage
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const FILE = () => process.env.URL || 'file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-bw.html');
async function open(o) { o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  if (!o.noGpu) await page.addInitScript(() => { window.__NG_GL = 1; });   // (the GPU painter on SwiftShader: forced, as on a phone)
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto(FILE());
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = o.lvl || 14; P.st.unlockAll = true; if (o.lowFx) P.st.lowFx = true; P.st.dun.best = Math.max(P.st.dun.best || 0, 10); P.openMap(); P.dun.setMapTab('rift', true); }, o);
  const start = async stage => { await page.evaluate(stage => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('belfry', stage); }, stage);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000 }); await page.waitForTimeout(400); };
  // run the game for secs of real time, the pet kept alive; sample(fn source) is evaluated every frame and its results kept
  const run = (secs, sample) => page.evaluate(async ([secs, sample]) => { const D = window.__pp.arc.game._dbg, f = sample ? new Function('D', 'BEL', 't', sample) : null, out = []; const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (f) { const v = f(D, window.BEL, (performance.now() - t0) / 1000); if (v != null) out.push(v); } } return out; }, [secs, sample || null]);
  // run the game for secs of GAME time (a loaded machine runs it slower than the clock), capped at cap real seconds
  const runG = (secs, sample, cap) => page.evaluate(async ([secs, sample, cap]) => { const D = window.__pp.arc.game._dbg, f = sample ? new Function('D', 'BEL', 't', sample) : null, out = []; const t0 = performance.now(), g0 = D.g.t;
    while (D.g.t - g0 < secs && performance.now() - t0 < cap * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (f) { const v = f(D, window.BEL, D.g.t - g0); if (v != null) out.push(v); } } return out; }, [secs, sample || null, cap || 600]);
  const goTo = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);
  const shot = async file => { await page.screenshot({ path: file }); };
  const pause = on => page.evaluate(on => { const P = window.__pp; P.togglePause(!!on); return !!P.arc.paused; }, on);
  return { browser, page, errors, start, run, runG, goTo, shot, pause };
}
module.exports = { open };
