// v423 GT: pictures of the garden traps in the game, on the GPU path (window.__NG_GL = 1): each kind calm, telling and striking
// (close crops round the trap), a bramble on a vine bridge, and a stage overview; then contact sheets (tests/_gt-sheet.py).
// DPR=1|3 HTML=test-gt.html node tests/_gt-shots.js   (BEFORE=1: the stage overview only, for a build without the traps)
const L = require('./_gt-lib.js'), fs = require('fs'), path = require('path');
const DPR = +(process.env.DPR || 1), OUT = path.resolve(__dirname, '..', 'shots', 'v423-GT'), TAG = process.env.TAG || (process.env.BEFORE ? 'before' : 'after');
fs.mkdirSync(OUT, { recursive: true });
(async () => { const { browser, page, errors } = await L.open({ gpu: process.env.GPU !== '0', dpr: DPR, timeout: 900000 });
  // a fixed layout (the floor's seed) so the before and after overviews show the same floor
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); window.__gtBoot = 1; P.st.unlockAll = true; if (!window.__rdw) { const rd = window.riftDef; window.riftDef = function () { const F = rd.apply(this, arguments); if (window.__gtSeed) F.seed = window.__gtSeed; return F; }; window.__rdw = 1; } });
  const shots = [], note = {};
  const snap = async (name, cap, crop) => { await page.waitForTimeout(+(process.env.WAIT || 2500)); if (typeof crop === 'function') crop = await crop(); const f = path.join(OUT, `${TAG}-d${DPR}-${name}.png`); await page.screenshot({ path: f, clip: crop ? { x: Math.max(0, crop.x), y: Math.max(0, crop.y), width: crop.w, height: crop.h } : undefined }); shots.push(f); note[path.basename(f)] = cap; console.log('shot', path.basename(f)); };
  const settle = async () => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.mons.length = 0; if (D.g.reserve) D.g.reserve.length = 0; D.me.inv = 99; D.g.intro = 0; }); };
  for (const st of (process.env.STAGES || '6')   /* v437 GR: (The Thorn Walks: stage 6 of the nine) */.split(',').map(Number)) {
    await page.evaluate(([s, ov]) => { window.__gtSeed = 424242 + s; window.__gtOv = ov; }, [st, process.env.OVX ? { x: +process.env.OVX, y: +process.env.OVY } : null]); await L.stage(page, st); await settle(); await page.waitForTimeout(7000); await settle();
    const info = await page.evaluate(() => { const XH = window.__XH, F = XH.X.rift.self.gtraps; return { name: XH.X.F.rift.name, n: F ? F.traps.length : 0 }; });
    console.log('stage', st, JSON.stringify(info));
    // the overview: zoomed out over the middle of the floor's traps (or its start)
    await page.evaluate(() => { const XH = window.__XH, D = window.__pp.arc.game._dbg, F = XH.X.rift.self.gtraps, me = D.me; D.g.zoomP = 0.62; let x = D.M.start.x, y = D.M.start.y; if (F && F.traps.length) { F.freeze = true; F.teach = false; let best = -1; for (const t of F.traps) { const n = F.traps.filter(q => Math.hypot(q.x - t.x, q.y - t.y) < 6).length; if (n > best) { best = n; x = t.x; y = t.y + 1; } } } else if (window.__gtOv) { x = window.__gtOv.x; y = window.__gtOv.y; } me.x = x; me.y = y; window.__gtOvAt = { x, y }; });
    console.log('overview at', JSON.stringify(await page.evaluate(() => window.__gtOvAt)));
    await page.waitForTimeout(4000); await snap(`s${st}-overview`, `${info.name}: zoomed out over its busiest room (${info.n} garden traps on the floor; the thorn spikes and the Tower's traps as before)`);
    await page.evaluate(() => { window.__pp.arc.game._dbg.g.zoomP = 1; });
    if (process.env.BEFORE || !info.n) continue;
    const kinds = ['pod', 'whip', 'gey', 'sap', 'star', 'trip', 'whipbr'];
    for (const kd of kinds) {
      const at = await page.evaluate(kd => { const XH = window.__XH, D = window.__pp.arc.game._dbg, F = XH.X.rift.self.gtraps, me = D.me, X = XH.X;
        const tp = kd === 'whipbr' ? F.traps.find(q => q.kind === 'whip' && q.bridge) : F.traps.find(q => q.kind === kd && !q.bridge) || F.traps.find(q => q.kind === kd); if (!tp) return null; window.__tp = tp;
        const cx = tp.kind === 'whip' ? (tp.x + tp.ex) / 2 : tp.kind === 'trip' ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.kind === 'whip' ? (tp.y + tp.ey) / 2 : tp.kind === 'trip' ? (tp.y + tp.y1) / 2 : tp.y;
        me.x = cx + 1.7; me.y = cy + 1.9; me.vx = me.vy = 0; window.__c = { cx, cy }; return { cx, cy }; }, kd);
      if (!at) { console.log('no', kd); continue; }
      for (const [ph, cap] of [['calm', 'calm'], ['tell', 'its tell building'], ['strike', 'the strike']]) {
        await page.evaluate(ph => { const tp = window.__tp, K = tp.K; for (const q of window.__XH.X.rift.self.gtraps.traps) if (q !== tp) { q.st = 'idle'; q.t = 0; q.stuck = 0; }
          if (ph === 'calm') { tp.st = 'idle'; tp.t = 0; tp.stuck = 0; }
          else if (ph === 'tell') { if (tp.kind === 'sap') tp.stuck = 0.8; else { tp.st = 'warn'; tp.t = K.warn * 0.78; } }
          else { if (tp.kind === 'sap') tp.stuck = 1; else { tp.st = 'burst'; tp.t = { pod: 0.12, whip: 0.14, gey: 0.28, star: 0.06, trip: 0.16 }[tp.kind] || 0.1; tp.hm = new Set(); } } }, ph);
        if (ph === 'tell' && kd === 'sap') await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x = window.__tp.x + 0.15; D.me.y = window.__tp.y + 0.1; });
        if (ph === 'calm') await page.waitForTimeout(2500);
        const W = 300, H = 300; await snap(`s${st}-${kd}-${ph}`, `${kd === 'whipbr' ? 'whip (vine bridge)' : kd}: ${cap}`, async () => { const box = await page.evaluate(() => { const X = window.__XH.X, c = window.__c; return { x: X.sx(c.cx), y: X.sy(c.cy) }; }); const x0 = Math.max(0, Math.min(390 - W, Math.round(box.x - W / 2))), y0 = Math.max(0, Math.min(844 - H, Math.round(box.y - H * 0.6))); return { x: x0, y: y0, w: W, h: H }; });
        if (kd === 'sap' && ph === 'strike') await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x = window.__tp.x + 1.7; D.me.y = window.__tp.y + 1.9; });
      } }
    // a gameplay frame: the pet among them, the traps live
    await page.evaluate(() => { const F = window.__XH.X.rift.self.gtraps, D = window.__pp.arc.game._dbg, tp = F.traps.find(q => q.kind === 'gey' && !q.bridge) || F.traps[0]; for (const q of F.traps) { q.st = 'idle'; q.t = 0; } D.me.x = tp.x + 1.4; D.me.y = tp.y + 1.2; F.freeze = false; });
    await page.waitForTimeout(5000); await snap(`s${st}-live`, 'in play: the traps running round the pet');
  }
  const stats = await page.evaluate(() => { const GT = self.GARDEN_TRAPS, NM = self.NIDHOGG_MOVES; return { gt: GT ? GT.stats : null, gpu: NM && NM.FGFX ? NM.FGFX.info() : null }; });
  console.log(JSON.stringify(stats));
  const nf = path.join(OUT, `${TAG}-d${DPR}-notes.json`); fs.writeFileSync(nf, JSON.stringify(note, null, 1));
  console.log(`shots ${shots.length} · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
