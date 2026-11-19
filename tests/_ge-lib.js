// v423 GE: shared helpers for the Garden of Unborn Stars (Rift 02) environment tests.
// open({ dpr, html, lowFx, gl }) -> page with the debug hook, a quick-started save that can enter every garden stage.
// stage(i) starts garden stage i (0..11) and waits for play; for a boss stage it also waits for the fiend to start.
// Stages: 0 fight 1 March 2 fight 3 Orrubel | 4 fight 5 fight 6 Starfall 7 Ambrel | 8 Gallery 9 fight 10 fight 11 Calyx
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const STAGES = { fight1: 0, march: 1, fight1b: 2, orrubel: 3, fight2: 4, fight2b: 5, starfall: 6, ambrel: 7, gallery: 8, fight3: 9, fight3b: 10, calyx: 11 };
async function open(o) {
  o = o || {};
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  const html = o.html || process.env.HTML || 'test-ge.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.unlockAll = true; if (o.lowFx) P.st.lowFx = true;
    for (const p of P.partyPets()) { p.dlv = 40; } P.st.dun.best = Math.max(P.st.dun.best || 0, 120); if (o.noGL) { window.__DUN_GL = 0; } }, o);
  const M = (f, a) => page.evaluate(f, a);
  // (the starter gift's reward window may sit over the game: hidden for the shots)
  const dismiss = () => M(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const stage = async (i, opt) => { opt = opt || {}; await dismiss();
    await M(i => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const RS = P.riftState(); RS.prog.garden = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('garden', i); }, i);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 });
    if (opt.boss) await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.FD && D.FD.S && D.FD.S.started; }, null, { timeout: 300000 });
    await dismiss(); await page.waitForTimeout(200); };
  // play for secs of game time (bounded by wall time), keeping the pet alive
  const run = (secs, wallK) => M(async ([secs, wk]) => { const D = window.__pp.arc.game._dbg; const g0 = D.g.t, t0 = performance.now(); while (D.g.t - g0 < secs && performance.now() - t0 < secs * 1000 * wk) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, [secs, wallK || 6]);
  const frames = n => M(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  const shot = async (dir, name) => { const fs = require('fs'), d = path.resolve(__dirname, '..', 'shots', dir); fs.mkdirSync(d, { recursive: true }); await page.screenshot({ path: path.join(d, name + '.png'), timeout: 0 }); };
  const mod = () => M(() => { const D = window.__pp.arc.game._dbg; return !!(D.RIFT && D.RIFT.self && D.RIFT.self.mod); });
  return { browser, page, errors, M, stage, run, frames, shot, mod };
}
module.exports = { open, STAGES };
