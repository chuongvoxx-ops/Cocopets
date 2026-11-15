// Fire Flan studio: the GLM model alone (no fight running), several poses drawn on a basalt-coloured card at a fixed
// scale, saved as shots/calF/studio-*.png. Fast iteration on the look. HTML=test-calF.html node tests/_cal-f-studio.js
// env: POSES=idle,chill (a subset), GL=0 (the 2D picture), T=70 (pixels per tile)
process.env.HTML = process.env.HTML || 'test-calF.html';
const L = require('./_cal-f-lib');
const fs = require('fs'), path = require('path');
const POSES = {
  idle: { wob: 0.4 },
  wobble: { wob: 1.4, wt: 0.37, sx: 1.08, sz: 0.88 },
  swell: { sx: 1.12, sz: 1.16, wob: 0.3 },
  land: { sx: 1.2, sz: 0.74, wob: 1.6 },
  spit: { pods: [{ L: 0, a: 0, el: 0, w: 0.5 }, { L: 0.75, a: 0, el: 1.0, w: 0.3 }], wob: 0.5 },
  breaker: { pods: [{ L: 2.4, a: 0.3, el: 0.85, w: 0.42 }, { L: 0, a: 0, el: 0, w: 0.3 }], core: [0.4, 0.15, 0.2], wob: 0.6 },
  sweep: { pods: [{ L: 2.4, a: -0.9, el: -0.05, w: 0.62 }, { L: 0, a: 0, el: 0, w: 0.3 }], wob: 1.0 },
  chill: { chill: 0.6, wob: 0.15, shiver: 0.4 },
  brittle: { chill: 1, crack: 1, wob: 0.2, shiver: 0.6 },
  lobes: { lobes: 1.4, lobeT: 2.2, phase: 2, wob: 0.6 },
  tall: { tall: 1, phase: 3, heat: 1.35, lobes: 1, lobeT: 4 },
  tallBrittle: { tall: 1, phase: 3, chill: 1, crack: 1, lobes: 1, lobeT: 4 },
  dying: { die: 0.55, wob: 0.8 },
  dead: { die: 1, cool: 0.3, wob: 0 },
  cold: { die: 1, cool: 1, heat: 0.22, wob: 0 },
};
(async () => {
  const T = await L.open({ gl: process.env.GL !== '0', hq: true, dpr: 1 });
  const { page, errors } = T;
  const want = process.env.POSES ? process.env.POSES.split(',') : Object.keys(POSES);
  fs.mkdirSync(L.SHOT_DIR, { recursive: true });
  for (const name of want) {
    const url = await page.evaluate(([name, pose, Tpx]) => {
      const DB = window.__pp.FIEND_DEFS.calflan.__dbg, MODEL = DB.MODEL, W = 520, H = 460, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      // a basalt card: dark stone, a few hex joints, a warm light from below
      c.fillStyle = '#2B2729'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(8,6,8,.6)'; c.lineWidth = 1.5; const hx = Tpx * 0.74, hy = hx * 0.866;
      for (let r = -1; r < H / hy + 1; r++) for (let q = -1; q < W / hx + 1; q++) { const x = q * hx + (r & 1 ? hx / 2 : 0), y = r * hy; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; c.lineTo(x + Math.cos(a) * hx * 0.56, y + Math.sin(a) * hx * 0.56 * 0.72); } c.closePath(); c.stroke(); }
      const P = Object.assign({ hd: 0.6, sx: 1, sz: 1, lift: 0, H: 1.85, Rw: 1.62, wob: 0.4, wt: 1.3, lean: 0, side: 0, pods: [], lobes: 0, lobeT: 0, tall: 0, chill: 0, crack: 0, heat: 1, die: 0, cool: 0, alpha: 1, fx: 0, core: [0.15, -0.1, 0], shiver: 0, phase: 1 }, pose);
      const o = { T: Tpx, sx: x => x * Tpx, sy: y => y * Tpx, t: 3.7, I: MODEL.inst() };
      // let the bubbles rise a while first
      for (let i = 0; i < 40; i++) { o.t += 0.08; o.rigOnly = true; MODEL.draw(document.createElement('canvas').getContext('2d'), W / 2 / Tpx, (H - 70) / Tpx, 0, P.hd, P, o); }
      o.rigOnly = false; MODEL.drawShadow(c, W / 2 / Tpx, (H - 70) / Tpx, P, o); MODEL.draw(c, W / 2 / Tpx, (H - 70) / Tpx, 0, P.hd, P, o);
      c.font = '700 16px sans-serif'; c.fillStyle = '#fff'; c.fillText(name + (MODEL.stats.gl ? ' (GL)' : ' (2D)'), 10, 22); window.__st = MODEL.stats;
      return cv.toDataURL('image/png');
    }, [name, POSES[name], +(process.env.T || 70)]);
    fs.writeFileSync(path.join(L.SHOT_DIR, 'studio-' + name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log('studio', name, JSON.stringify(await page.evaluate(() => window.__st)));
  }
  console.log('errors', errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)).slice(0, 5));
  await T.browser.close();
})().catch(e => { console.error(e); process.exit(1); });
