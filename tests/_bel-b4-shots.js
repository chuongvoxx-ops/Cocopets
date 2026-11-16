// Nhalu the Lantern Eel (B4): GPU screenshots of the fight (GLM eel, FGFX effects) -> shots/bel-b4-*.png, and a contact
// sheet shots/bel-b4-sheet.png (made with python3/PIL). usage: node tests/_bel-b4-shots.js
// (On swiftshader one GLM frame of the eel takes about two minutes, so each moment is played up to in the fast path and
// the GPU is switched on for the two frames of its picture: window.__NHALU_GL / __NHALU_FX / __NG_GL.)
const { openBel } = require('./_bel-b4-lib');
const { execFileSync } = require('child_process');
const path = require('path');
(async () => {
  const T = await openBel({ gl: false }); const { ev, errors, shot, page } = T;
  // (full-res GLM only where asked: GLHQ=1)
  if (process.env.GLHQ) await page.evaluate(() => { window.__NHALU_GLHQ = 1; });
  await T.start();
  const names = [];
  const gpu = on => page.evaluate(on => { window.__NHALU_GL = on ? 1 : 0; window.__NHALU_FX = on ? 1 : 0; window.__NG_GL = on ? 1 : 0; }, on);
  const snap = async (name, body, arg) => { const r = await ev(body, arg); await gpu(true); await ev(`const f0 = DEF.MODEL.__dbg.glStats.frames, w0 = performance.now(); while (DEF.MODEL.__dbg.glStats.frames - f0 < 1 && performance.now() - w0 < 1800000) { await frame(); me.hp = D.ST.hp; }`); await shot(name); await gpu(false); names.push(name); console.log(name, JSON.stringify(r || {}), new Date().toISOString()); };
  await ev(`const go = clock(8); while (go() && b.act === 'enter') { await frame(); me.hp = D.ST.hp; }`);
  const hold = `const holdT = async secs => { const go = clock(secs); while (go()) { await frame(); me.hp = D.ST.hp; } };`;
  await snap('swim', hold + `put(C.x + 6.5, C.y + 6); await holdT(2.5); return { x: b.x, y: b.y };`);
  await snap('close', hold + `window.__NHALU_CAM = { x: b.x, y: b.y + 1.2, k: 1, zoom: 0.95 }; await holdT(0.6); return {};`);
  await page.evaluate(() => { window.__NHALU_CAM = null; });
  await snap('hunt', hold + `put(L.laneX(C, 0), C.y + 5); DEF.force(FX, 'hunt', { lane: 0 }); await holdT(1.7); return { armed: !!M.lanes[0].armed };`);
  await snap('thunder', hold + `const go = clock(4); while (go() && !(M.lanes[0].fx > 1.0)) { await frame(); me.hp = D.ST.hp; put(L.laneX(C, 1), C.y + 5); } return { fx: M.lanes[0].fx };`);
  await snap('drain', hold + `DEF.force(FX, 'drain', { lane: 2 }); const go = clock(16); while (go() && !M.wheels[1].exposed) { await frame(); me.hp = D.ST.hp; put(C.x - 2, C.y + 7); } put(M.wheels[1].x - 2.5, M.wheels[1].y - 1.5); await holdT(1.0); return { ex: M.wheels[1].exposed };`);
  await snap('beached', hold + `DEF.useWheel(FX, 1); await holdT(2.2); return { beach: !!M.beach };`);
  await page.evaluate(() => { window.__NHALU_CAM = null; });
  await snap('twin', hold + `const go0 = clock(9); while (go0() && M.beach) { await frame(); me.hp = D.ST.hp; } b.hp = b.maxhp * 0.48; await holdT(3.4); put(L.laneX(C, 1), C.y + 4); DEF.force(FX, 'hunt2', { lane: 1 }); await holdT(2.0); return { armed: M.lanes.filter(q => q.armed).length };`);
  await snap('leeches', hold + `await holdT(3); DEF.force(FX, 'drain', { lane: 0 }); const go = clock(16); while (go() && !M.wheels[0].exposed) { await frame(); me.hp = D.ST.hp; put(C.x + 6, C.y + 2); } await holdT(4.5); put(M.wheels[0].x + 3, M.wheels[0].y - 1); await holdT(0.3); return { leeches: M.leeches.length };`);
  await snap('fall', hold + `for (const q of M.leeches.slice()) D.hitMon(q.m, 1e9, { flat: true }); await holdT(0.5); b.under = false; D.hitMon(b, 1e12, { flat: true }); await holdT(1.55); return { end: M.end && M.end.t };`);
  console.log('errors', errors.slice(0, 5));
  await T.browser.close();
  const dir = path.resolve(__dirname, '../shots');
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
names = sys.argv[1].split(',')
ims = [Image.open('${dir}/bel-b4-%s.png' % n).convert('RGB') for n in names]
w, h = 260, int(260 * ims[0].height / ims[0].width)
cols = 4; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 22)), (12, 16, 24))
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(zip(names, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22)); d.text((x + 6, y + 5), n, fill=(255, 220, 140))
sheet.save('${dir}/bel-b4-sheet.png')
`, names.join(',')]);
  console.log('sheet', path.join(dir, 'bel-b4-sheet.png'));
})().catch(e => { console.log('FAIL', e && e.message); process.exit(1); });
