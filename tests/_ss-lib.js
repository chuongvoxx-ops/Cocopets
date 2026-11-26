// v463 SS: shared helpers for the Sepulchre of Borrowed Hours (Rift 04) background tests.
// open({ dpr, html, lowFx, noGL }) -> page with the debug hook and a quick-started save that can enter every sepulchre stage.
// stage(i) starts sepulchre stage i and waits for play; boss stages also wait for the fiend to start.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function open(o) {
  o = o || {};
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  const html = o.html || process.env.HTML || 'test-ss.html';
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.unlockAll = true; if (o.lowFx) P.st.lowFx = true;
    for (const p of P.partyPets()) { p.dlv = 40; } P.st.dun.best = Math.max(P.st.dun.best || 0, 120); if (o.noGL) { window.__DUN_GL = 0; } if (o.off) window.__SSKY = 0; }, o);
  const M = (f, a) => page.evaluate(f, a);
  const dismiss = () => M(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const stage = async (i, opt) => { opt = opt || {}; await dismiss();
    await M(i => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const RS = P.riftState(); RS.prog.sepulchre = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('sepulchre', i); }, i);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 300000 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 });
    if (opt.boss) await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return D.FD && D.FD.S && D.FD.S.started; }, null, { timeout: 300000 });
    await dismiss(); await page.waitForTimeout(200); };
  const run = (secs, wallK) => M(async ([secs, wk]) => { const D = window.__pp.arc.game._dbg; const g0 = D.g.t, t0 = performance.now(); while (D.g.t - g0 < secs && performance.now() - t0 < secs * 1000 * wk) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, [secs, wallK || 6]);
  const frames = n => M(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  const shot = async (dir, name) => { const fs = require('fs'), d = path.resolve(__dirname, '..', 'shots', dir); fs.mkdirSync(d, { recursive: true }); await page.screenshot({ path: path.join(d, name + '.png'), timeout: 0 }); };
  // the camera moved to a walkable place dx, dy tiles from the start (or to the map's edge: edge 'l','r','t','b')
  const move = (dx, dy) => M(([dx, dy]) => { const D = window.__pp.arc.game._dbg, me = D.me; if (me.__x0 == null) { me.__x0 = me.x; me.__y0 = me.y; } let best = null;
    for (let d = 0; d < 8 && !best; d += 0.5) for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = me.__x0 + dx + d * sx, y = me.__y0 + dy + d * sy; if (D.walkAt(Math.floor(x), Math.floor(y))) { best = [x, y]; break; } }
    if (best) { me.x = best[0]; me.y = best[1]; } if (D.cam) { D.cam.x = me.x; D.cam.y = me.y; } return best; }, [dx, dy]);
  return { browser, page, errors, M, stage, run, frames, shot, dismiss, move };
}
module.exports = { open };
