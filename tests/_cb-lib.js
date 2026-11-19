// v420 CB: the harness for Abaddon, the Gate of Cancer's boss (20o2-cancer-abaddon-boss.js).
// open({ dpr, gl, real }) -> a page with the hook. Unless real (ENV's gate in 20o, whose door calls CANCER_BOSS.begin), the
// Cancer gate (RIFT_GATES.belfry) is swapped for a test arena of the contract's size (about 22 x 16 walkable, round) and the
// fight is begun by hand. HTML=test-cb.html by default. Game time is stepped synchronously (U.update(dt)), no frames drawn
// except for shots.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Abaddon|CANCER/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(f => { if (f.gl) { window.__AB_GL = 1; window.__NG_GL = 1; } else { window.__AB_GL = 0; window.__NG_GL = 0; } }, { gl: !!o.gl });
  const html = o.html || process.env.HTML || 'test-cb.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 30; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; if (o.god) P.st.dun.god = true; if (o.lowFx) P.st.lowFx = true; P.riftState().seals.belfry = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 120); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, CB = window.CANCER_BOSS, S = CB.test.S, TU = CB.TUNE;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const step = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function start() {
    await M(o => { const P = window.__pp;
      if (!o.real) { const G0 = P.RIFT_GATES.belfry; window.__cbG0 = window.__cbG0 || G0;
        // a test arena of the contract's size: a round floor 24 x 18 with the pet's start at its south
        const W = 28, Hh = 22, rows = []; for (let y = 0; y < Hh; y++) { let r = ''; for (let x = 0; x < W; x++) { const dx = (x + 0.5 - 14) / 12, dy = (y + 0.5 - 10.5) / 9; r += dx * dx + dy * dy < 1 ? '.' : '#'; } rows.push(r); }
        rows[18] = rows[18].slice(0, 14) + 'S' + rows[18].slice(15); rows[10] = rows[10].slice(0, 14) + 'A' + rows[10].slice(15);
        P.RIFT_GATES.belfry = Object.assign({}, window.__cbG0, { layout: rows, legend: { A: {} }, make(X, self, H) { window.__cbGate = { X, self, H }; const bi = P.BIOME_ORDER.indexOf('lunarfloor'); if (bi >= 0 && !o.plain) X.M.BI.fill(bi); return { update() {}, goal: () => 'test arena', hint: () => null }; } }); }
      if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('belfry'); }, o);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000, polling: 500 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 400000, polling: 500 }); await page.waitForTimeout(300); await M(() => { window.__pp.arc.paused = true; });   // (the game stepped by hand; the page only draws)
    if (o.real) { // ENV's gate: the riddles answered through its hooks, the moon gate opened, the pet through it: it seals and begins the fight
      await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; for (let k = 0; k < 3; k++) { if (!m.R.open) m.openBoard(); const i = m.rightIndex(); m.answer(i); await new Promise(r => setTimeout(r, k < 2 ? 900 : 1100)); } });
      const ph = await ev(`const m = D.RIFT.self.mod; step(40, () => m.S.phase === 'open'); hold(16.5, 21.5); step(0.3); hold(16.5, 19.4); step(12, () => { if (m.S.phase !== 'boss') hold(16.5, 19.4); return m.S.phase === 'boss'; }); return m.S.phase;`);
      if (ph !== 'boss') throw new Error('the gate did not reach its boss: ' + ph); }
    if (!o.real) await ev(`const G = window.__cbGate, a = G.X.M.marks.A[0]; step(2.6); hold(a.x, a.y + 6); CB.begin(G.X, G.H, G.self, { cx: a.x, cy: a.y, r: 9, ax0: a.x - 12, ax1: a.x + 12, ay0: a.y - 9, ay1: a.y + 9 }); return true;`);
  }
  // the intro played through (the pet held), then the fight
  const fight = () => ev(`let n = 0; step(8, () => { n++; return CB.test.S && CB.test.S.mode === 'fight'; }); return CB.test.S ? CB.test.S.mode : null;`);
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  // a still: one frame drawn now (the game's own draw), then the screenshot with the loop held
  const shot = async (dir, name) => { fs.mkdirSync(path.resolve(__dirname, '..', 'shots', dir), { recursive: true }); await M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await M(() => { const e = document.getElementById('giftWrap'); if (e) e.hidden = true; }); await freeze(true); try { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png'), timeout: 600000 }); } finally { await freeze(false); } };
  return { browser, page, errors, M, ev, start, fight, shot, freeze, PRE };
}
module.exports = { open };
