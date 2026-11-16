// Uldroth (worker B5, 20t5-belfry-uldroth.js) test helpers: a page with the GLM flags set, Uldroth's stage started (B1's Belfry stage when it
// has one, else a test-only rift whose one boss stage is made by FIEND_DEFS.beluldroth.stageMake), game-time stepping.
// usage: const L = require('./_bel-b5-lib'); const T = await L.open({ gl: true }); await T.startUld(); await T.wake();
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const SHOT_DIR = path.resolve(__dirname, '../shots');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); if (/Uldroth/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(f => { window.__ULD_GL = f.gl ? 1 : 0; if (!f.gl) { window.__NG_GL = 0; window.__BEL_GL = 0; } else { window.__NG_GL = 1; } if (f.hq) window.__ULD_GLHQ = 1; }, { gl: !!o.gl, hq: !!o.hq });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB5.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 10; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; if (o.god) P.st.dun.god = true; }, o);
  if (o.shots) fs.mkdirSync(SHOT_DIR, { recursive: true });
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async name => { await freeze(true); try { await page.screenshot({ path: path.join(SHOT_DIR, name + '.png'), timeout: 300000 }); } finally { await freeze(false); } };
  const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, FX = D.FD && D.FD.FX, M = FX && FX.mem, me = D.me, P = window.__pp, U = window.__pp.arc.game, UL = P.FIEND_DEFS.beluldroth.ULDROTH;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const S = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function startUld() {
    const info = await page.evaluate(() => { const P = window.__pp; let Rf = P.RIFT_BY_ID.belfry, i = Rf ? Rf.stages.findIndex(s => s.boss === 'beluldroth') : -1, own = false;
      if (i < 0 || !Rf.stages[i].make) { own = true; const D = P.FIEND_DEFS.beluldroth;
        Rf = { id: 'beltest', n: 0, name: 'The Drowned Belfry (test)', lvl: 10, sigil: 'Tide', biome: 'belfry', aff: ['water', 'dark'], gate: null, mons: ['leech'],
          sealing: { fall: 'THE DROWNED HERALD FALLS', sub: 'The sea drains away', sigil: 'THE TIDE SIGIL', name: 'The Drowned Belfry', color: '#61D9D2' },
          stages: [{ kind: 'boss', biome: 'belfry', name: 'one', boss: 'beluldroth', goal: 'x' }, { kind: 'boss', biome: 'belfry', name: 'two', boss: 'beluldroth', goal: 'x' }, { kind: 'boss', biome: 'belfry', name: 'The Bell Platform', boss: 'beluldroth', goal: 'Uldroth', seal: true, make: D.stageMake }] };
        const j = P.RIFTS.findIndex(r => r.id === 'beltest'); if (j >= 0) P.RIFTS.splice(j, 1); P.RIFTS.push(Rf); P.RIFT_BY_ID.beltest = Rf; i = 2; }
      if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(Rf.id, i); return { own, id: Rf.id, i }; });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    await page.waitForTimeout(300);
    return info;
  }
  // wake the boss: the pet stands near until the fight starts and the entrance is over
  const wake = () => ev(`const s = D.M.FC; hold(s.x, s.y + 6); S(60, () => { if (!D.g.boss || D.g.boss.act === 'enter' || D.g.boss.act === 'rise') { if (!(D.g.boss && D.g.boss.act === 'rise')) hold(s.x, s.y + 6); } return D.g.boss && D.g.boss.act === 'fight'; }); await frame(); return D.g.boss ? D.g.boss.act : null;`);
  return { browser, page, errors, shot, ev, startUld, wake, PRE, freeze };
}
module.exports = { open, SHOT_DIR };
