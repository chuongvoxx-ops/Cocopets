// Rift 0 core art sheets: the brood in every pose, the props, the shared art (frost wells, crystals, cold fields, glyphs,
// the arena painters). HTML=test-calC.html node tests/_cal-c-sheet.js [brood|props|art|arena]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2);
const on = k => !want.length || want.includes(k);
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, run } = T;
  // the CAL api, through a running stage's everyStage
  await start('caldera', 0); await run(0.5);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; window.__CAL = D.RIFT.self.amb.CAL; });
  const sheet = async (name, W, H, fn, arg) => { await page.evaluate(([W, H, src, arg]) => { const old = document.getElementById('sheet'); if (old) old.remove(); const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; cv.id = 'sheet'; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(2, 2); (0, eval)('(' + src + ')')(c, W, H, window.__pp, window.__CAL, arg); }, [W, H, fn.toString(), arg]);
    await page.setViewportSize({ width: W, height: H }); await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-${name}.png`), clip: { x: 0, y: 0, width: W, height: H } }); console.log('shot', name); };
  const bg = (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3C3536'); g.addColorStop(1, '#2A2425'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  if (on('brood')) {
    const POSES = { cinderslug: ['', 'w1', 'w3', 'spit', 'rest'], basaltcrawler: ['', 'wind', 'ram', 'reel'], emberwisp: ['', 'charge', 'spent'], furnaceimp: ['', 'wind', 'throw', 'hop'], runicsentinel: ['', 'wind', 'bash', 'open'], bomblarva: ['fly', 'g0', 'g1', 'red', 'red2'], ashenknight: ['', 'wind', 's1', 's2', 'rest'], crystalwisp: ['', 'aim', 'beam', 'spent'] };
    const types = Object.keys(POSES);
    for (let half = 0; half < 2; half++) await sheet('brood-' + (half + 1), 760, 4 * 170 + 10, (c, W, H, P, CAL, arg) => { const bgc = c.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#3C3536'); bgc.addColorStop(1, '#2A2425'); c.fillStyle = bgc; c.fillRect(0, 0, W, H);
      arg.types.forEach((t, row) => { arg.poses[t].forEach((md, i) => { const s = P.DunArt.monSprite(t, 46, 0.15 + i * 0.07, P.MON[t].color, md, false), x = 80 + i * 150, y = 90 + row * 170; c.drawImage(s.cv, x - s.half, y - s.half, s.half * 2, s.half * 2); c.fillStyle = '#FFF'; c.font = '700 12px sans-serif'; c.textAlign = 'center'; c.fillText(t + (md ? ' · ' + md : ''), x, y + 76); }); }); },
      { types: types.slice(half * 4, half * 4 + 4), poses: POSES });
  }
  if (on('props')) {
    await sheet('props', 900, 760, (c, W, H, P) => { const bgc = c.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#3C3536'); bgc.addColorStop(1, '#2A2425'); c.fillStyle = bgc; c.fillRect(0, 0, W, H);
      const kinds = [['blackcrystal', 0], ['blackcrystal', 2], ['bigcrystal', 0], ['basaltcol', 0], ['basaltcol', 2], ['frostwell', 0], ['lavafall', 0], ['glassspire', 1], ['ashmound', 0], ['forge', 0], ['vessel', 0], ['chains', 0], ['metalring', 0], ['anvil', 0], ['slabhang', 0]];
      kinds.forEach(([k, v], i) => { const T = 34, s = P.DunWorld.propSprite(k, T, 1, v, 'ashen'), x = 90 + (i % 5) * 180, y = 230 + Math.floor(i / 5) * 250; c.drawImage(s.cv, x - s.ax, y - s.ay); c.fillStyle = '#FFF'; c.font = '700 12px sans-serif'; c.textAlign = 'center'; c.fillText(k + ' ' + v, x, y + 20); }); });
  }
  if (on('art')) {
    await sheet('art', 900, 700, (c, W, H, P, CAL) => { const bgc = c.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#3C3536'); bgc.addColorStop(1, '#2A2425'); c.fillStyle = bgc; c.fillRect(0, 0, W, H); const T = 40;
      const lab = (s, x, y) => { c.fillStyle = '#FFF'; c.font = '700 12px sans-serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
      CAL.frostWellArt(c, 90, 190, T, { k: 0 }); lab('well dormant', 90, 280);
      CAL.frostWellArt(c, 250, 190, T, { k: 1, charge: 0.6, showCharge: true }); lab('well active, charge', 250, 280);
      CAL.frostWellArt(c, 410, 190, T, { k: 0.3, integ: 0.3 }); lab('well cracked', 410, 280);
      CAL.frostWellArt(c, 570, 190, T, { broken: true }); lab('well broken', 570, 280);
      CAL.frostWellArt(c, 740, 190, T, { k: 0.8, awake: 0.8, label: 'TAKE SHELTER' }); lab('well awake', 740, 280);
      CAL.crystalArt(c, 90, 470, 120, { v: 0, k: 0.4, ph: 0.2 }); lab('crystal', 90, 500);
      CAL.crystalArt(c, 250, 470, 120, { v: 1, k: 1.2, ph: 0.6 }); lab('crystal pulse', 250, 500);
      CAL.crystalArt(c, 410, 470, 120, { v: 2, dim: true }); lab('crystal inert', 410, 500);
      CAL.crystalArt(c, 570, 470, 120, { v: 3, broken: true, k: 0.3 }); lab('crystal broken', 570, 500);
      CAL.emblem(c, 700, 380, 60, 0); CAL.emblem(c, 790, 380, 60, 1); lab('emblem', 745, 430);
      ['eye', 'chain', 'crown'].forEach((k, i) => { c.fillStyle = '#1C1A1E'; c.beginPath(); c.arc(680 + i * 70, 480, 28, 0, 6.283); c.fill(); CAL.glyph(c, 680 + i * 70, 480, 40, k, '#FFB347'); lab(k, 680 + i * 70, 525); });
      for (let i = 0; i < 8; i++) CAL.rune(c, 70 + i * 40, 580, 26, i, '#FFB347');
      CAL.springArt(c, 470, 640, T, 0.8); lab('recovery spring', 470, 690);
      CAL.snowflake(c, 640, 620, 70, '#CFEFFF'); });
  }
  if (on('arena')) {
    await sheet('arena', 700, 700, (c, W, H, P, CAL) => { CAL.paintSky(c, W, H, 30, { seed: 3 }); c.save(); c.translate(W / 2, H * 0.62); c.scale(22, 22); CAL.paintPlatform(c, 11, null, { seams: 0.8 }); c.restore(); });
    await sheet('arena-calm', 500, 360, (c, W, H, P, CAL) => { CAL.paintSky(c, W, H, 30, { seed: 3, calm: 1 }); });
  }
  await T.browser.close(); process.exit(0);
})();
