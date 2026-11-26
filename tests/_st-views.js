// v463 ST: before / after views of Rift 04's trapped stages at the same spots on the same (seeded) layouts. With the traps
// (SEP_TRAPS present) the spots are found (one per kind) and written to POS; without (a build from before v463) they are read
// from POS. The pet stands at the spot; monsters cleared; one frame after a short settle.
// HTML=<build> POS=<json> TAG=before|after DPR=1|3 STAGES=0,4,7 node tests/_st-views.js -> shots/v463-ST/view-<tag>-d<dpr>-s<stage>-<kind>.png
const L = require('./_st-lib.js'), fs = require('fs'), path = require('path');
(async () => { const dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', posF = process.env.POS;
  const { browser, page, errors } = await L.open({ dpr, gpu: process.env.NOGL !== '1' });
  const out = path.resolve(__dirname, '..', 'shots', 'v463-ST'); fs.mkdirSync(out, { recursive: true });
  let POS = {}; try { POS = JSON.parse(fs.readFileSync(posF, 'utf8')); } catch (e) {}
  const frames = n => page.evaluate(n => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  for (const st of (process.env.STAGES || '0,4,7').split(',').map(Number)) { await L.stage(page, st, 7); await frames(40);
    const spots = await page.evaluate(([st, P]) => { const XH = window.__XH, F = XH.self && XH.self.septraps; if (!F) return P[st] || [];
      const seen = {}, out = []; for (const tp of F.traps) { if (seen[tp.kind] || tp.bridge) continue; seen[tp.kind] = 1; const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y; out.push({ kind: tp.kind, x: cx, y: cy }); } return out; }, [st, POS]);
    POS[st] = spots;
    for (const s of spots) { await page.evaluate(s => { const D = window.__pp.arc.game._dbg, me = D.me; D.mons.length = 0; if (D.g.reserve) D.g.reserve.length = 0; window.__pp.st.dun.god = true; me.x = s.x + 2.2; me.y = s.y + 1.4; me.vx = me.vy = 0;
        const F = window.__XH.self.septraps; if (F) { F.teach = false; const tp = F.traps.find(q => q.kind === s.kind && !q.bridge); if (tp && tp.kind !== 'pend' && tp.kind !== 'stall') { F.freeze = true; tp.on = true; tp.st = 'warn'; tp.t = tp.K.warn * 0.8; } } }, s);
      await frames(14);
      const b = await page.evaluate(s => { const X = window.__XH.X; return { sy: X.sy(s.y), H: X.H() }; }, s); const h = 460, y0 = Math.max(0, Math.min(b.H - h, Math.round(b.sy - h * 0.6)));
      await page.screenshot({ path: path.join(out, `view-${tag}-d${dpr}-s${st}-${s.kind}.png`), clip: { x: 0, y: y0, width: 390, height: h } }); }
    // (PERF=1) a crowded stretch of play: the GPU passes this file adds per frame (its own ground pass; the light in the air laid into
    // the dungeon's shared pass) and the ms its drawing takes
    if (process.env.PERF === '1') { const pf = await page.evaluate(() => new Promise(res => { const S = self.SEP_TRAPS, F = window.__XH.self.septraps; if (!F) return res(null); F.freeze = false; F.teach = false; const s0 = S.stats; let ms = 0, n = 0; const g0 = F.drawGround, X = window.__XH.X; F.drawGround = c => { const t = performance.now(); g0(c); ms += performance.now() - t; };
        const tp = F.traps[0], me = window.__pp.arc.game._dbg.me; me.x = tp.x + 1.5; me.y = tp.y + 1.5; let k = 0; const f = () => { n++; if (++k < 40) requestAnimationFrame(f); else { const s1 = S.stats; F.drawGround = g0; res({ frames: n, ownPassesPerFrame: (s1.gpu - s0.gpu) / n, laidPerFrame: (s1.laid - s0.laid) / n, groundMsPerFrame: ms / n, pics: s1.cached, picMB: +(s1.bytes / 1048576).toFixed(2), paintMsAvg: +(s1.paintMs / Math.max(1, s1.painted)).toFixed(1) }); } }; requestAnimationFrame(f); }));
      console.log('PERF', st, JSON.stringify(pf)); } }
  if (posF && tag === 'after') fs.writeFileSync(posF, JSON.stringify(POS));
  console.log('errors', errors.length, errors.slice(0, 4)); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
