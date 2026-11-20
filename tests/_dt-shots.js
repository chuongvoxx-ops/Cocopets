// v433 DT: pictures of the dune traps in the game, on the GPU path (window.__NG_GL = 1): each kind calm, telling and striking
// (close crops round the trap), and a stage overview; then contact sheets (tests/_dt-sheet.py).
// DPR=1|3 STAGES=0,5,8 HTML=test-dt.html node tests/_dt-shots.js   (BEFORE=1: the stage overviews only, for a build without the traps)
const L = require('./_dt-lib.js'), fs = require('fs'), path = require('path');
const DPR = +(process.env.DPR || 1), OUT = path.resolve(__dirname, '..', 'shots', 'v433-DT'), TAG = process.env.TAG || (process.env.BEFORE ? 'before' : 'after');
fs.mkdirSync(OUT, { recursive: true });
(async () => { const { browser, page, errors } = await L.open({ gpu: process.env.GPU !== '0', dpr: DPR, timeout: 900000 });
  // a fixed layout (the floor's seed) so the before and after overviews show the same floor
  const shots = [], note = {};
  const snap = async (name, cap, crop) => { await page.waitForTimeout(+(process.env.WAIT || 2500)); if (typeof crop === 'function') crop = await crop(); const f = path.join(OUT, `${TAG}-d${DPR}-${name}.png`); await page.screenshot({ path: f, clip: crop ? { x: Math.max(0, crop.x), y: Math.max(0, crop.y), width: crop.w, height: crop.h } : undefined }); shots.push(f); note[path.basename(f)] = cap; console.log('shot', path.basename(f)); };
  const settle = async () => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.mons.length = 0; if (D.g.reserve) D.g.reserve.length = 0; D.me.inv = 99; D.g.intro = 0; }); };
  for (const st of (process.env.STAGES || '0,5,8').split(',').map(Number)) {
    await L.stage(page, st, 433000 + st); await settle(); await page.waitForTimeout(6000); await settle();
    const info = await page.evaluate(() => { const XH = window.__XH, F = XH.self.dtraps; return { name: XH.X.F.rift.name, n: F ? F.traps.length : 0, kinds: F ? [...new Set(F.traps.map(t => t.kind))] : [] }; });
    console.log('stage', st, JSON.stringify(info));
    // the overview: zoomed out over the busiest room
    await page.evaluate(() => { const XH = window.__XH, D = window.__pp.arc.game._dbg, F = XH.self.dtraps, me = D.me; D.g.zoomP = 0.62; const x = D.M.start.x, y = D.M.start.y + (D.M.rooms.length > 1 ? 5 : 1); if (F) { F.freeze = true; F.teach = false; } me.x = x; me.y = y; });   // (round the start, the same view before and after)
    await page.waitForTimeout(+(process.env.OVWAIT || 3000)); await snap(`s${st}-overview`, `${info.name}: zoomed out just below the start (${info.n} dune traps on the floor; the sand spouts and the Tower's traps as before)`);
    await page.evaluate(() => { window.__pp.arc.game._dbg.g.zoomP = 1; });
    if (process.env.BEFORE || process.env.OVONLY || !info.n) continue;
    for (const kd of info.kinds) {
      const at = await page.evaluate(kd => { const XH = window.__XH, D = window.__pp.arc.game._dbg, F = XH.self.dtraps, me = D.me;
        const tp = F.traps.find(q => q.kind === kd && !q.bridge) || F.traps.find(q => q.kind === kd); if (!tp) return null; window.__tp = tp;
        const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y;
        me.x = cx + 1.9; me.y = cy + 2.0; me.vx = me.vy = 0; window.__c = { cx, cy }; return { cx, cy }; }, kd);
      if (!at) continue;
      for (const [ph, cap] of [['calm', 'calm'], ['tell', 'its tell building'], ['strike', 'the strike']]) {
        await page.evaluate(ph => { const tp = window.__tp, K = tp.K, Z = tp.kind === 'mirage' || tp.kind === 'quick'; for (const q of window.__XH.self.dtraps.traps) if (q !== tp) { q.st = 'idle'; q.t = 0; q.stuck = 0; }
          if (ph === 'calm') { tp.st = 'idle'; tp.t = 0; tp.stuck = 0; tp.sink = 0; }
          else if (ph === 'tell') { if (Z) { tp.stuck = 0.8; tp.sink = 0.5; } else { tp.st = 'warn'; tp.t = K.warn * 0.78; } }
          else { if (Z) { tp.stuck = 1; tp.sink = 0.95; } else { tp.st = 'burst'; tp.t = { sink: 0.1, tooth: 0.08, res: 0.3, vent: 0.28, shard: 0.12, hands: 0.2, gas: 0.25 }[tp.kind] || 0.1; tp.hm = new Set(); } } }, ph);
        if (ph !== 'calm' && (at && (await page.evaluate(() => window.__tp.kind === 'mirage' || window.__tp.kind === 'quick')))) await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x = window.__tp.x + 0.15; D.me.y = window.__tp.y + 0.1; });
        if (ph === 'calm') await page.waitForTimeout(2000);
        const W = 300, H = 300; await snap(`s${st}-${kd}-${ph}`, `${kd}: ${cap}`, async () => { const box = await page.evaluate(() => { const X = window.__XH.X, c = window.__c, k = X.W() / innerWidth; return { x: X.sx(c.cx) / k, y: X.sy(c.cy) / k }; }); const x0 = Math.max(0, Math.min(390 - W, Math.round(box.x - W / 2))), y0 = Math.max(0, Math.min(844 - H, Math.round(box.y - H * 0.6))); return { x: x0, y: y0, w: W, h: H }; });
      }
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x = window.__c.cx + 1.9; D.me.y = window.__c.cy + 2.0; });
    }
    await page.evaluate(() => { const F = window.__XH.self.dtraps, D = window.__pp.arc.game._dbg, tp = F.traps[0]; for (const q of F.traps) { q.st = 'idle'; q.t = 0; } D.me.x = tp.x + 1.4; D.me.y = tp.y + 1.2; F.freeze = false; });
    await page.waitForTimeout(4000); await snap(`s${st}-live`, 'in play: the traps running round the pet');
  }
  const stats = await page.evaluate(() => { const DT = self.DUNE_TRAPS, NM = self.NIDHOGG_MOVES; return { dt: DT ? DT.stats : null, gpu: NM && NM.FGFX ? NM.FGFX.info() : null }; });
  console.log(JSON.stringify(stats));
  const nf = path.join(OUT, `${TAG}-d${DPR}-notes.json`); fs.writeFileSync(nf, JSON.stringify(Object.assign(JSON.parse(fs.existsSync(nf) ? fs.readFileSync(nf, 'utf8') : '{}'), note), null, 1));
  console.log(`shots ${shots.length} · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
