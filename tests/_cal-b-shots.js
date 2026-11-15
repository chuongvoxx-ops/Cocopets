// Bomb King (Rift 0, worker B): every pose and state of the fight, in the game, drawn on the GPU (GLM under swiftshader;
// slow: each GPU frame takes seconds there). The fight runs with the 2D picture between shots, the GPU is turned on
// for each one.   usage: HTML=test-calB.html node tests/_cal-b-shots.js   -> shots/cal-b-game-*.png  (env ONLY=name, FLAT=1 for 2D)
const { openCal } = require('./_cal-b-lib');
const path = require('path');
(async () => {
  const T = await openCal({ gl: false, dpr: 2 }); const { page, errors, start, ev } = T;
  await start();
  const gl = on => page.evaluate(on => { window.__CALBOMB_GL = on ? 1 : 0; window.__pp.FIEND_DEFS.calbomb.MODEL.__dbg.noGL = !on; }, on && !process.env.FLAT);
  // a GPU frame takes seconds under swiftshader: the game is paused and its picture held, one frame is drawn by hand with
  // the GPU on, kept on screen for the screenshot, then the game goes on
  const snap = async name => { if (process.env.ONLY && !process.env.ONLY.split(',').some(k => name.includes(k))) return;
    await page.evaluate(async on => { const P = window.__pp, G = P.arc.game; if (!G.__orig) { G.__orig = G.draw; G.draw = function (c) { if (window.__HOLD) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(window.__HOLD, 0, 0); c.restore(); return; } return G.__orig.call(this, c); }; }
      const cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'); P.arc.paused = true; window.__HOLD = window.__HOLD0 || (window.__HOLD0 = document.createElement('canvas')); window.__HOLD.width = cv.width; window.__HOLD.height = cv.height;
      window.__CALBOMB_GL = on ? 1 : 0; window.__CALBOMB_GLHQ = 1; P.FIEND_DEFS.calbomb.MODEL.__dbg.noGL = !on; const h = window.__HOLD; window.__HOLD = null; c.save(); G.__orig.call(G, c); c.restore(); h.getContext('2d').drawImage(cv, 0, 0); window.__HOLD = h;
      P.FIEND_DEFS.calbomb.MODEL.__dbg.noGL = true; window.__CALBOMB_GL = 0; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, !process.env.FLAT);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-b-${process.env.FLAT ? 'flat' : 'game'}-${name}.png`), timeout: 300000 });
    await page.evaluate(() => { window.__HOLD = null; window.__pp.arc.paused = false; }); console.log('shot', name); };
  const run = (secs, body) => ev(`D.g.taps = 9; const g0 = D.g.t, w0 = performance.now(), go = () => D.g.t - g0 < arg && performance.now() - w0 < arg * 60000; while (go()) { await frame(); me.hp = D.ST.hp; ${body || ''} }`, secs);
  const hold = (dx, dy) => `me.x = b.x + (${dx}); me.y = b.y + (${dy}); me.vx = me.vy = 0;`;
  await run(1.4); await snap('01-enter');
  await ev(`const go = clock(8); while (go() && b.act === 'enter') await frame();`);
  await run(1.5, hold(1.5, 6.5)); await snap('02-hover');
  await ev(`DEF.force(FX, 'volley');`); await run(1.2, hold(1, 6.5)); await snap('03-volley-wind');
  await run(1.0, hold(1, 6.5)); await snap('04-volley-fire');
  await ev(`DEF.force(FX, 'orbit');`); await run(1.4, hold(-2, 7)); await snap('05-orbit-wind');
  await run(2.2, hold(-2, 7)); await snap('06-orbit-ring');
  await ev(`DEF.force(FX, 'vent');`); await run(1.6, hold(0.5, 5.5)); await snap('07-vent');
  // phase 2
  await ev(`b.hp = b.maxhp * 0.66;`); await run(3.2, hold(0, 6.5)); await snap('08-phase2');
  await ev(`DEF.drop(FX); DEF.drop(FX);`); await run(1.6, hold(0, 6.5)); await snap('09-larvae-return');
  await run(2.6, hold(0, 6.5)); await snap('10-larvae-dodge');
  await run(2.5, hold(0, 6.5));
  await ev(`DEF.drop(FX);`); await run(1.5, hold(0, 6.5));
  await ev(`const q = M.bombs.find(x => x.o); if (q) D.hitMon(q.o, 5, {});`); await run(0.3, hold(0, 6.5)); await snap('11-returned-flight');
  await run(0.6, hold(0, 6.5)); await snap('12-shell-cracked');
  await ev(`b.stunT = 0;`); await run(1.5, hold(0, 6.5));
  // phase 3
  await ev(`b.hp = b.maxhp * 0.33;`); await run(3.0, hold(0, 7));
  await ev(`if (!(M.ac && M.ac.k === 'charge')) DEF.force(FX, 'charge');`); await run(3.5, hold(0, 6)); await snap('13-detonation-count');
  await ev(`const s = DEF.SHELTERS.safeSpot(FX.C, 1); me.x = s.x; me.y = s.y;`); await run(1.0, `const s = DEF.SHELTERS.safeSpot(FX.C, 1); me.x = s.x; me.y = s.y;`); await snap('14-detonation-sheltered');
  await ev(`const go = clock(6); while (go() && M.ac && M.ac.k === 'charge') { await frame(); me.hp = D.ST.hp; const s = DEF.SHELTERS.safeSpot(FX.C, 1); me.x = s.x; me.y = s.y; }`); await run(0.4); await snap('15-blast-vent');
  // death
  await ev(`b.stunT = 0; D.hitMon(b, 1e12, { flat: true });`); await run(1.2); await snap('16-death-fuse'); await run(1.8); await snap('17-death-crack'); await run(1.8); await snap('18-death-passage');
  console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no page errors');
  await T.browser.close();
})();
