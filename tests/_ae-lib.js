// v470 AE: shared helpers for the Pale Aurora (Rift 05) land / props / pieces / doors tests (from _se-lib).
// open({ dpr, html, lowFx, noGL, off, fast }) -> page with the debug hook and a save that can enter every Aurora stage.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function open(o) {
  o = o || {};
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  if (o.noWebGL) args.push('--disable-webgl', '--disable-3d-apis');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.dpr || 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource|GPU stall|WebGL|GL_/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  const html = o.html || process.env.HTML;
  await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 55; P.st.unlockAll = true; if (o.lowFx) P.st.lowFx = true;
    for (const id of ['belfry', 'garden', 'dunes', 'sepulchre']) P.riftState().seals[id] = 1;
    for (const p of P.partyPets()) { p.dlv = 55; } P.st.dun.best = Math.max(P.st.dun.best || 0, 120); if (o.noGL) { window.__DUN_GL = 0; window.__NG_GL = 0; } if (o.off) window.__AURP = 0; if (o.fast) { window.__PRELOAD_MORE = 0; window.__GLM_WARM = 0; } if (!o.noGL && o.gpu !== false) window.__NG_GL = 1; }, o);
  const M = (f, a) => page.evaluate(f, a);
  const dismiss = () => M(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const stage = async (i) => { await dismiss();
    await M(i => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const RS = P.riftState(); RS.prog.aurora = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('aurora', i); }, i);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 }); await M(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1800000 });
    await dismiss(); await page.waitForTimeout(200); };
  // another rift's stage (the comparison shots: the Garden, the Dunes)
  const stageRift = async (id, i) => { await dismiss(); await M(([id, i]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const RS = P.riftState(); RS.prog[id] = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, i); }, [id, i]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 }); await M(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1800000 }); await dismiss(); await page.waitForTimeout(200); };
  const run = (secs, wallK) => M(async ([secs, wk]) => { const D = window.__pp.arc.game._dbg; const g0 = D.g.t, t0 = performance.now(); while (D.g.t - g0 < secs && performance.now() - t0 < secs * 1000 * wk) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, [secs, wallK || 6]);
  const frames = n => M(async n => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) D.me.hp = D.ST.hp; } }, n);
  const shot = async (dir, name) => { const fs = require('fs'), d = path.resolve(__dirname, '..', 'shots', dir); fs.mkdirSync(d, { recursive: true }); await page.screenshot({ path: path.join(d, name + '.png'), timeout: 0 }); };
  const toProp = kinds => M(kinds => { const D = window.__pp.arc.game._dbg, me = D.me, L = D.propList || []; let best = null, bd = 1e9;
    for (const p of L) { if (p.broken || (kinds && !kinds.includes(p.kind))) continue; const d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } }
    if (!best) return null; for (const [dx, dy] of [[0, 1.6], [1.4, 1.2], [-1.4, 1.2], [0, 2.4], [1.5, 0], [-1.5, 0]]) { if (D.walkAt(Math.floor(best.x + dx), Math.floor(best.y + dy))) { me.x = best.x + dx; me.y = best.y + dy; break; } }
    if (D.cam) { D.cam.x = me.x; D.cam.y = me.y - 1; } return { kind: best.kind, x: best.x, y: best.y }; }, kinds);
  const move = (dx, dy) => M(([dx, dy]) => { const D = window.__pp.arc.game._dbg, me = D.me; if (me.__x0 == null) { me.__x0 = me.x; me.__y0 = me.y; } let best = null;
    for (let d = 0; d < 8 && !best; d += 0.5) for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = me.__x0 + dx + d * sx, y = me.__y0 + dy + d * sy; if (D.walkAt(Math.floor(x), Math.floor(y))) { best = [x, y]; break; } }
    if (best) { me.x = best[0]; me.y = best[1]; } if (D.cam) { D.cam.x = me.x; D.cam.y = me.y; } return best; }, [dx, dy]);
  const freeze = () => M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.boss) m.frozen = 99; });
  return { browser, page, errors, M, stage, stageRift, run, frames, shot, dismiss, move, toProp, freeze };
}
module.exports = { open };
