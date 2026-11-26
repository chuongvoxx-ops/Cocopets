// v463 ST: pictures of the Sepulchre traps, each kind calm / telling / striking, on a real stage of its land (the GPU painter
// forced on unless NOGL=1). Out: shots/v463-ST/<tag>-<kind>-<state>.png (390 x 420 crops round the trap).
// HTML=<test build> [DPR=1|3] [NOGL=1] [TAG=after] [STAGES=0,7,5] [KINDS=pend,clock] node tests/_st-shots.js
const L = require('./_st-lib.js'), fs = require('fs'), path = require('path');
(async () => { const dpr = +(process.env.DPR || 1), tag = process.env.TAG || 'after', nogl = process.env.NOGL === '1';
  const { browser, page, errors } = await L.open({ dpr, gpu: !nogl, nogl });
  const out = path.resolve(__dirname, '..', 'shots', 'v463-ST'); fs.mkdirSync(out, { recursive: true });
  const STAGES = (process.env.STAGES || '0,7,4').split(',').map(Number), only = process.env.KINDS ? process.env.KINDS.split(',') : null;
  const STATES = { idle: null, warn: 0.75, burst: 0.3 };
  const frames = n => page.evaluate(n => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  for (const st of STAGES) { await L.stage(page, st, 7); await frames(40);   // (past the stage's opening banners)
    await page.evaluate(() => { const S = self.SEP_TRAPS, F = window.__XH.self.septraps; if (!F) return; for (const kd of new Set(F.traps.map(t => t.kind))) for (const [n, v] of S.PICS[kd]) S.sprite(n, v, S.base); });
    const kinds = await page.evaluate(() => { const F = window.__XH.self.septraps; if (!F) return []; return [...new Set(F.traps.map(t => t.kind))]; });
    for (const kd of kinds) { if (only && !only.includes(kd)) continue;
      for (const [sn, f] of Object.entries(STATES)) { if ((kd === 'stall' || kd === 'pend') && sn !== 'idle') { if (kd === 'pend' && sn === 'burst') {} else continue; }
        const box = await page.evaluate(([kd, sn, f]) => { const D = window.__pp.arc.game._dbg, XH = window.__XH, X = XH.X, F = XH.self.septraps, me = D.me, g = D.g; D.mons.length = 0; if (g.reserve) g.reserve.length = 0; window.__pp.st.dun.god = true; F.teach = false; F.freeze = true;
          const tp = F.traps.find(q => q.kind === kd && !q.bridge) || F.traps.find(q => q.kind === kd); const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y;
          for (const q of F.traps) { if (q.kind === 'pend') continue; q.st = 'idle'; q.t = 0; q.n = 0; } tp.on = true;
          if (kd === 'pend') { tp.t = sn === 'burst' ? (0.25 - tp.ph / (2 * Math.PI)) * tp.period + tp.period * 2 : (0.0 - tp.ph / (2 * Math.PI)) * tp.period + tp.period * 2; tp.s = tp.K.L * Math.sin(2 * Math.PI * tp.t / tp.period + tp.ph); }
          else if (kd === 'stall') { tp.stuck = 1; }
          else if (sn !== 'idle') { tp.st = sn; tp.t = tp.K[sn] * f; if (kd === 'clock' && sn === 'burst') { tp.ha = tp.a0 + 2 * Math.PI * (f * f * (3 - 2 * f)); tp.pa = tp.ha; } }
          me.x = kd === 'stall' ? cx + 0.3 : cx + (kd === 'column' ? -tp.dir * 1.6 : 2.4); me.y = kd === 'stall' ? cy : cy + 1.6; me.vx = me.vy = 0; me.hp = me.maxhp || me.hp;
          D.cam && (D.cam.x = cx, D.cam.y = cy); return { cx, cy, sx: X.sx(cx), sy: X.sy(cy), W: X.W(), H: X.H() }; }, [kd, sn, f]);
        await frames(14);   // (the camera there, the floor's chunks round it painted)
        const b = await page.evaluate(([cx, cy]) => { const X = window.__XH.X; return { sx: X.sx(cx), sy: X.sy(cy), W: X.W(), H: X.H() }; }, [box.cx, box.cy]);
        const h = 420, y0 = Math.max(0, Math.min(b.H - h, Math.round(b.sy - h * 0.62)));
        await page.screenshot({ path: path.join(out, `${tag}-d${dpr}-${kd}-${sn}.png`), clip: { x: 0, y: y0, width: 390, height: h } }); } } }
  console.log('errors', errors.length, errors.slice(0, 4)); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
