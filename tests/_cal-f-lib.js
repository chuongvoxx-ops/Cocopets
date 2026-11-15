// Fire Flan (worker F) test helpers: a page with the GLM flags set, the caldera's Fire Flan stage started (worker C's
// rift if it is built, else a test-only rift with one boss stage made by FIEND_DEFS.calflan.bossMake), game-time waits.
// usage: const L = require('./_cal-f-lib'); const T = await L.open({ shots: true }); await T.startFlan();
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const SHOT_DIR = path.resolve(__dirname, '../shots/calF');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' || /Fire Flan|GLM/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(f => { window.__CALFLAN_GL = f.gl ? 1 : 0; if (f.hq) window.__CALFLAN_GLHQ = 1; }, { gl: o.gl !== false, hq: !!o.hq });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calF.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; if (o.god) P.st.dun.god = true; }, o);
  if (o.shots) fs.mkdirSync(SHOT_DIR, { recursive: true });
  // (a picture: the page's animation loop held while it is taken, so a slow GL frame can't keep the capture waiting)
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async name => { if (!o.shots) return; await freeze(true); try { await page.screenshot({ path: path.join(SHOT_DIR, name + '.png'), timeout: 300000 }); } finally { await freeze(false); } };
  // the game-time helper in the page: G(secs, each) waits that many seconds of game time, calling each(t) every frame
  const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, FX = D.FD && D.FD.FX, M = FX && FX.mem, me = D.me, A = M && M.A, P = window.__pp;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const G = (secs, each) => new Promise(res => { const t0 = D.g.t, w0 = performance.now(); const f = () => { const r = each && each(D.g.t - t0); if (r === true || D.g.t - t0 >= secs || performance.now() - w0 > secs * 6000 + 4000) return res(D.g.t - t0); requestAnimationFrame(f); }; f(); });
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    // S(secs, each): game time run through the game's own update, without drawing (fast); each(t) every 1/20 s step
    const S = (secs, each, dt) => { const U = window.__pp.arc.game; dt = dt || 0.05; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function startFlan() {
    const idx = await page.evaluate(() => { const P = window.__pp;
      let Rf = P.RIFT_BY_ID.caldera, i = Rf ? Rf.stages.findIndex(s => s.boss === 'calflan') : -1;
      if (i < 0) { // a test-only rift: one boss stage
        Rf = { id: 'caldera', n: 0, name: 'The Blackfire Caldera (test)', lvl: 1, sigil: 'Ember', biome: 'volcano', aff: ['fire'], gate: null, mons: [], stages: [{ kind: 'boss', biome: 'volcano', name: 'The Flan Pit', boss: 'calflan', goal: 'Fire Flan', seal: false, make: (X, self, H) => P.FIEND_DEFS.calflan.bossMake(X, self, H) }] };
        P.RIFT_BY_ID.caldera = Rf; if (!P.RIFTS.includes(Rf)) P.RIFTS.push(Rf); i = 0; window.__calTestRift = true; }
      return i; });
    await page.evaluate(i => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.startRift('caldera', i); }, idx);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    await page.waitForTimeout(300);
    return idx;
  }
  // wake the boss: walk the pet toward it until the fight starts and the entrance is over
  const wake = () => ev(`const s = D.M.bossAt; hold(s.x, s.y + 5); S(40, () => { if (!D.g.boss || D.g.boss.act === 'enter') hold(s.x, s.y + 5); return D.g.boss && D.g.boss.act && D.g.boss.act !== 'enter'; }); await frame(); return D.g.boss ? D.g.boss.act : null;`);
  return { browser, page, errors, shot, ev, startFlan, wake, PRE };
}
module.exports = { open, SHOT_DIR };
