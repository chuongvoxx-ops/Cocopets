// v468 GP: the harness for the Gemini Gate's trial, Clash of the Twins (20s3-rift-gate-gemini.js, 20s3a-gemini-guardians.js).
// open({ dpr, gl, lvl, lowFx, w, h, html }) -> a page with the hook and a fresh save, Rift 04 sealed. start() opens the gate from the
// Rift UI and pauses the game's own loop: tests step game time synchronously (U.update(dt), the whole game: timers, hurts, the stage).
// HTML=<test page> (default test-gp.html). ev(body, arg) runs body with PRE's names in the page.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
async function open(o) {
  o = o || {};
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/Failed to load resource/.test(t)) || /RAZIEL GL|shader|compile/i.test(t)) errors.push('console: ' + t.slice(0, 400)); });
  await page.addInitScript(f => { if (f.gl) { window.__RZ_GL = 1; window.__NG_GL = 1; } else { window.__RZ_GL = 0; window.__NG_GL = 0; } if (f.noboss) window.__GB_NOBOSS = 1; }, { gl: !!o.gl, noboss: !!o.noboss });
  const html = o.html || process.env.HTML || 'test-gp.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = o.lvl || 40; if (o.lowFx) P.st.lowFx = true;
    if (o.party) { const mk = sd => { const g = P.summonGenome(6, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), p = P.newPetFields('L' + sd, g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; p.rarity = 5; p.dlv = 40; return p; };
      P.st.others = [mk(11), mk(23), mk(47)]; P.switchPet(0); P.st.party = [P.st.uid || P.st.others[0].uid].concat(P.st.others.slice(0, 2).map(p => p.uid)).filter(Boolean); }
    const RS = P.riftState(); for (const k of ['caldera', 'belfry', 'garden', 'dunes', 'sepulchre']) RS.seals[k] = 1; P.openMap(); P.dun.setMapTab('rift', true); }, o);
  const M = (f, a) => page.evaluate(f, a);
  const PRE = `const P = window.__pp, U = P.arc.game, D = U && U._dbg, me = D && D.me, g = D && D.g, m = D && D.RIFT && D.RIFT.self.mod, GG = window.GEMINI_GATE, R = m && m.R, S = m && m.S;
    const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
    const step = (secs, each, dt) => { dt = dt || 1 / 30; let t = 0; while (t < secs - 1e-6) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };
    const heal = () => { if (me && !me.dead) { me.hp = D.ST.hp; } };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  async function start() {
    await M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('sepulchre'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await page.waitForTimeout(200); await M(() => { window.__pp.arc.paused = true; });
  }
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async (dir, name) => { fs.mkdirSync(path.resolve(__dirname, '..', 'shots', dir), { recursive: true }); await M(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await M(() => { const e = document.getElementById('giftWrap'); if (e) e.hidden = true; }); await freeze(true); try { await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', dir, name + '.png'), timeout: 600000 }); } finally { await freeze(false); } };
  return { browser, page, errors, M, ev, start, shot, freeze, PRE };
}
module.exports = { open };
