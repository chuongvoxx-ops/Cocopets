// v429 TB: the harness for Belial, the Gate of Taurus's boss (20q2-taurus-belial-boss.js), on the real gate (20q).
// open({ dpr, gl, lvl, god, lowFx }) -> a page with the hook; start() starts the Taurus gate (RIFT_GATES.garden), solves its three
// skies through the stage's own visit(), waits for the great door, walks the pet through it: the door seals and TAURUS_BOSS
// begins. fight() plays the intro through. Game time is stepped synchronously (U.update(dt)); no frames drawn except for shots.
// HTML=test-tb.html by default.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const SOL = [[0, 1, 2, 3, 0, 2, 4, 3, 1], [0, 1, 2, 3, 4, 2, 0, 5, 4], [2, 0, 1, 2, 3, 4, 5, 3, 6, 4]];
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/Failed to load resource/.test(t)) || /Belial boss draw|Belial GL/.test(t)) errors.push('console: ' + t.slice(0, 300)); });
  await page.addInitScript(f => { if (f.gl) { window.__BL_GL = 1; window.__NG_GL = 1; } else { window.__BL_GL = 0; window.__NG_GL = 0; } }, { gl: !!o.gl });
  const html = o.html || process.env.HTML || 'test-tb.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 30; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; if (o.god) P.st.dun.god = true; if (o.lowFx) P.st.lowFx = true; P.riftState().seals.garden = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 120); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, TB = window.TAURUS_BOSS, S = TB.test.S, TU = TB.TUNE;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const step = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function start() {
    await M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('garden'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await page.waitForTimeout(300); await M(() => { window.__pp.arc.paused = true; });   // (the game stepped by hand; the page only draws)
    // the gate's three skies traced through its own visit(), the great door opened, the pet through it: it seals and the fight begins
    const r = await page.evaluate(([PRE, SOL]) => (new Function('SOL', PRE + `const m = D.RIFT.self.mod, st = s => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } }, out = { skies: [] };
      st(1.5); for (let k = 0; k < 3; k++) { for (let i = 0; i < 400 && !(m.R.sky === k && m.R.mode === 'play'); i++) st(0.1); for (const i of SOL[k]) { const s = m.stars[i]; hold(s.x + 0.6, s.y + 0.5); m.visit(i); } out.skies.push(m.R.used.size); }
      out.lit = m.S.lit; for (let i = 0; i < 900 && m.S.phase !== 'open'; i++) st(0.1); out.door = m.S.phase; hold(16.5, 21.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss' && m.S.phase !== 'won'; i++) { hold(16.5, 19.4); st(0.1); }
      out.phase = m.S.phase; out.begun = !!(window.TAURUS_BOSS.test.S); return out;`))(SOL), [PRE, SOL]);
    if (r.phase !== 'boss' || !r.begun) throw new Error('the gate did not reach its boss: ' + JSON.stringify(r));
    return r;
  }
  // the intro played through (the pet held), then the fight
  const fight = () => ev(`step(9, () => { const s = TB.test.S; if (s) hold(s.m.x, s.m.y + 6); return s && s.mode === 'fight'; }); return TB.test.S ? TB.test.S.mode : null;`);
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  // a still: frames drawn now (the game's own draw), then the screenshot with the loop held
  const shot = async (dir, name) => { fs.mkdirSync(path.resolve(__dirname, '..', 'shots', dir), { recursive: true }); await M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await M(() => { const e = document.getElementById('giftWrap'); if (e) e.hidden = true; }); await freeze(true); try { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png'), timeout: 600000 }); } finally { await freeze(false); } };
  return { browser, page, errors, M, ev, start, fight, shot, freeze, PRE };
}
module.exports = { open, SOL };
