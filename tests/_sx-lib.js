// v445 SB: the harness for Asmodeus, the Gate of Scorpio's boss (20s2-scorpio-asmodeus-boss.js, SCORPIO_BOSS).
// open({ dpr, gl, lvl, god, lowFx }) -> a page with the hook; start() starts the gate and walks the pet through its great door: the door
// seals and SCORPIO_BOSS begins. On the Gate of Scorpio (20s, the dunes gate) when it hands its arena to SCORPIO_BOSS (its stage module's
// solve() and its phase 'boss'); otherwise (GATE=aries, or the Scorpio gate not yet rebuilt) on the Gate of Aries's altar, which takes
// any boss with the same contract (window.__AG_BOSS = SCORPIO_BOSS): the same A, the same calls. fight() plays the intro through.
// Game time is stepped synchronously (U.update(dt)); no frames drawn except for shots. HTML=<test page> (default test-sx.html).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/Failed to load resource/.test(t)) || /Asmodeus boss draw|Asmodeus GL/.test(t)) errors.push('console: ' + t.slice(0, 300)); });
  await page.addInitScript(f => { if (f.gl) { window.__AS_GL = 1; window.__NG_GL = 1; } else { window.__AS_GL = 0; window.__NG_GL = 0; } }, { gl: !!o.gl });
  const html = o.html || process.env.HTML || 'test-sx.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 10; if (o.god) P.st.dun.god = true; if (o.lowFx) P.st.lowFx = true; const RS = P.riftState(); RS.seals.caldera = 1; RS.seals.dunes = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 30); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, SB = window.SCORPIO_BOSS, S = SB.test.S, TU = SB.TUNE;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const step = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  let gate = null;
  async function start() {
    // which gate: the Scorpio gate when its stage hands its arena to SCORPIO_BOSS (its source names it), else the Aries altar as the stand
    const want = process.env.GATE || 'auto';
    gate = await M(want => { const ok = !!(window.SCORPIO_GATE && window.__pp.RIFT_GATES && window.__pp.RIFT_GATES.dunes); return want === 'aries' ? 'caldera' : want === 'scorpio' ? 'dunes' : ok ? 'dunes' : 'caldera'; }, want);
    await M(gate => { const P = window.__pp; if (gate === 'caldera') window.__AG_BOSS = window.SCORPIO_BOSS; else window.__SG_BOSS = window.SCORPIO_BOSS; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate(gate); }, gate);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await page.waitForTimeout(300); await M(() => { window.__pp.arc.paused = true; });
    const r = await page.evaluate(([PRE0, gate]) => (new Function('arg', PRE0 + `const m = D.RIFT.self.mod, st = s => { let t = 0; while (t < s) { U.update(1 / 30); t += 1 / 30; } }, out = { gate: arg };
      st(1.5); if (m.solve) m.solve(); for (let i = 0; i < 1200 && m.S.phase !== 'open'; i++) st(0.1); out.door = m.S.phase;
      if (arg === 'caldera') { hold(16.5, 21.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss' && m.S.phase !== 'won'; i++) { hold(16.5, 19.4); st(0.1); } }
      else { const G = window.SCORPIO_GATE; hold(G.DOORX, G.WALLY + 0.5); st(0.3); for (let i = 0; i < 200 && m.S.phase !== 'boss' && m.S.phase !== 'won'; i++) { hold(G.DOORX, G.WALLY - 1.6); st(0.1); } }
      out.phase = m.S.phase; out.begun = !!(window.SCORPIO_BOSS.test.S); return out;`))(gate), [PRE, gate]);
    if (r.phase !== 'boss' || !r.begun) throw new Error('the gate did not reach its boss: ' + JSON.stringify(r));
    return r;
  }
  // the intro played through (the pet held), then the fight
  const fight = () => ev(`step(9, () => { const s = SB.test.S; if (s) hold(s.m.x, s.m.y + 6); return s && s.mode === 'fight'; }); return SB.test.S ? SB.test.S.mode : null;`);
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async (dir, name) => { fs.mkdirSync(path.resolve(__dirname, '..', 'shots', dir), { recursive: true }); await M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await M(() => { const e = document.getElementById('giftWrap'); if (e) e.hidden = true; }); await freeze(true); try { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png'), timeout: 600000 }); } finally { await freeze(false); } };
  return { browser, page, errors, M, ev, start, fight, shot, freeze, PRE, get gate() { return gate; } };
}
module.exports = { open };
