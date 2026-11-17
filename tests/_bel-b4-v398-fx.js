// Nhalu (B4, v398): before/after pictures of its attack and phase effects, the eel drawn on the GPU (GLM) and the effects
// through FGFX, the same moments in both builds -> shots/bel-b4-v398-<before|after>-<moment>.png, and the sheet
// shots/bel-b4-v398-fx.png (rows: moments; columns: before, after).
// usage: TAG=before HTML=test-belB4-before.html node tests/_bel-b4-v398-fx.js ; TAG=after node tests/_bel-b4-v398-fx.js ;
//        SHEET=1 node tests/_bel-b4-v398-fx.js   (On swiftshader a GLM frame takes minutes: each moment is played up to in
//        the fast path and the GPU switched on for its picture.)
const path = require('path'), fs = require('fs');
const MOMENTS = ['hunt', 'thunder', 'drain', 'beached', 'twin', 'fall'];
const dir = path.resolve(__dirname, '../shots');
if (process.env.SHEET) {
  require('child_process').execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
d, ms = sys.argv[1], sys.argv[2].split(',')
rows = [m for m in ms if all(__import__('os').path.exists('%s/bel-b4-v398-%s-%s.png' % (d, t, m)) for t in ('before', 'after'))]
w = 300; im0 = Image.open('%s/bel-b4-v398-after-%s.png' % (d, rows[0])); h = int(w * im0.height / im0.width)
crop = lambda im: im.crop((0, int(im.height * 0.08), im.width, int(im.height * 0.86)))
h = int(w * (im0.height * 0.78) / im0.width)
S = Image.new('RGB', (w * 2 + 120, 34 + len(rows) * (h + 8)), (12, 16, 24)); D = ImageDraw.Draw(S)
D.text((120 + w * 0.42, 10), 'BEFORE (v397)', fill=(200, 200, 210)); D.text((120 + w + w * 0.42, 10), 'AFTER (v398 B4)', fill=(255, 220, 140))
for i, m in enumerate(rows):
    y = 34 + i * (h + 8); D.text((10, y + h // 2), m, fill=(255, 220, 140))
    for j, t in enumerate(('before', 'after')):
        S.paste(crop(Image.open('%s/bel-b4-v398-%s-%s.png' % (d, t, m)).convert('RGB')).resize((w, h)), (120 + j * w, y))
S.save('%s/bel-b4-v398-fx.png' % d); print(S.size)
`, dir, MOMENTS.join(',')], { stdio: 'inherit' });
  process.exit(0);
}
const { openBel } = require('./_bel-b4-lib');
const TAG = process.env.TAG || 'after';
(async () => {
  const T = await openBel({ gl: false }); const { ev, page, errors } = T;
  await T.start();
  const gpu = on => page.evaluate(on => { window.__NHALU_GL = on ? 1 : 0; window.__NHALU_FX = on ? 1 : 0; window.__NG_GL = on ? 1 : 0; }, on);
  const snap = async (name, body) => { const r = await ev(body); await gpu(true);
    await ev(`const f0 = DEF.MODEL.__dbg.glStats.frames, w0 = performance.now(); while (DEF.MODEL.__dbg.glStats.frames - f0 < 1 && performance.now() - w0 < 1800000) { await frame(); me.hp = D.ST.hp; }`);
    await page.screenshot({ path: path.join(dir, `bel-b4-v398-${TAG}-${name}.png`), timeout: 1800000 }); await gpu(false); console.log(TAG, name, JSON.stringify(r || {}), new Date().toISOString()); };
  const hold = `const holdT = async secs => { const go = clock(secs); while (go()) { await frame(); me.hp = D.ST.hp; } }; const cam = (x, y, z) => { window.__NHALU_CAM = { x, y, k: 1, zoom: z || 0.5 }; };`;
  await ev(`const go = clock(8); while (go() && b.act === 'enter') { await frame(); me.hp = D.ST.hp; }`);
  // (the same moments in both builds, each framed by a held camera on where it happens)
  await snap('hunt', hold + `cam(L.laneX(C, 1), C.y + 2, 0.5); put(L.laneX(C, 1), C.y + 4); DEF.force(FX, 'hunt', { lane: 1 }); await holdT(1.0); put(L.laneX(C, 2) - 1, C.y + 4); await holdT(0.9); return { armed: !!M.lanes[1].armed };`);
  await snap('thunder', hold + `const go = clock(2); while (go() && !(M.lanes[1].fx > 0)) { await frame(); me.hp = D.ST.hp; } await holdT(0.04); return { fx: M.lanes[1].fx };`);
  await snap('drain', hold + `await holdT(1.5); DEF.force(FX, 'drain', { lane: 2 }); const go = clock(16); while (go() && !M.wheels[1].exposed) { await frame(); me.hp = D.ST.hp; put(C.x - 2, C.y + 7); } cam(L.laneX(C, 2) - 1, C.y + 5, 0.55); put(M.wheels[1].x - 2.2, M.wheels[1].y - 1.2); DEF.useWheel(FX, 1); await holdT(0.6); return { beach: !!M.beach };`);
  await snap('beached', hold + `cam(L.laneX(C, 2) - 1, C.y + 2, 0.55); await holdT(1.25); return { beach: !!M.beach, thrash: M.thrash };`);
  await snap('twin', hold + `window.__NHALU_CAM = null; const go0 = clock(9); while (go0() && M.beach) { await frame(); me.hp = D.ST.hp; } put(L.laneX(C, 1), C.y + 6); b.hp = b.maxhp * 0.48; await holdT(1.35); return { p2: M.p2 ? M.p2.t : null };`);
  await snap('fall', hold + `await holdT(2.5); for (const q of M.leeches.slice()) D.hitMon(q.m, 1e9, { flat: true }); b.under = false; D.hitMon(b, 1e12, { flat: true }); await holdT(1.05); return { end: M.end && M.end.t };`);
  console.log('errors', errors.slice(0, 5));
  await T.browser.close();
})().catch(e => { console.log('FAIL', e && e.message); process.exit(1); });
