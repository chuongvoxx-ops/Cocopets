// v468 GB: the harness for the Gemini Gate's boss (20s3b-gemini-boss.js, GEMINI_BOSS) on its own gate (20s3, GP's).
// open({ dpr, gl, lvl, god, lowFx }) -> a page with the hook; start() opens the Gemini gate, solves its puzzle (the stage module's
// solve()), walks the pet through the opened gate until the door seals and GEMINI_BOSS begins; fight() plays the intro through.
// Game time is stepped synchronously (U.update(dt)); no frames drawn except for shots. HTML=<test page> (default test-gb.html).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/Failed to load resource/.test(t)) || /Gemini boss|RAZIEL GL|shader|compile/i.test(t)) errors.push('console: ' + t.slice(0, 400)); });
  await page.addInitScript(f => { if (f.gl) { window.__RZ_GL = 1; window.__NG_GL = 1; } else { window.__RZ_GL = 0; window.__NG_GL = 0; } }, { gl: !!o.gl });
  const html = o.html || process.env.HTML || 'test-gb.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 40; if (o.god) P.st.dun.god = true; if (o.lowFx) P.st.lowFx = true; const RS = P.riftState(); for (const k of ['caldera', 'belfry', 'garden', 'dunes', 'sepulchre']) RS.seals[k] = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 60); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, GB = window.GEMINI_BOSS, T = GB.test, S = T.S, TU = GB.TUNE;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const step = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function start(opt) { opt = opt || {};
    await M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('sepulchre'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await page.waitForTimeout(300); await M(() => { window.__pp.arc.paused = true; });
    const r = await page.evaluate(PRE0 => (new Function(PRE0 + `const m = D.RIFT.self.mod, st = s => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } }, out = {};
      st(1.0); if (m.S.phase !== 'open' && m.solve) m.solve(); for (let i = 0; i < 900 && m.S.phase !== 'open'; i++) st(0.1); out.door = m.S.phase;
      const G = window.GEMINI_GATE, BA = G.BA; for (let i = 0; i < 400 && m.S.phase !== 'boss' && m.S.phase !== 'won'; i++) { hold(BA.x, Math.max(BA.y + 6, 26.0 - i * 0.05)); st(0.1); }
      out.phase = m.S.phase; out.begun = !!(window.GEMINI_BOSS.test.S); return out;`))(), PRE);
    if (!opt.noBoss && (r.phase !== 'boss' || !r.begun)) throw new Error('the gate did not reach its boss: ' + JSON.stringify(r));
    return r;
  }
  const fight = () => ev(`step(9, () => { const s = T.S; if (s) hold(s.m.x, s.m.y + 6); return s && s.mode === 'fight'; }); return T.S ? T.S.mode : null;`);
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async (dir, name) => { fs.mkdirSync(path.resolve(__dirname, '..', 'shots', dir), { recursive: true }); await M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await M(() => { const e = document.getElementById('giftWrap'); if (e) e.hidden = true; }); await freeze(true); try { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png'), timeout: 600000 }); } finally { await freeze(false); } };
  return { browser, page, errors, M, ev, start, fight, shot, freeze, PRE };
}
module.exports = { open };
