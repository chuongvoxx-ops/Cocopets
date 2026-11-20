// (v430 BP) Belial motion sheets: the GPU model driven the way the fight drives it (BELIAL_MOVES.poseFor / easePose / ultPose,
// BELIAL_GL.springs, the gait's phase advanced from the distance walked), stepped at 60 Hz, one strip a mode.
// usage: HTML=test-bp.html node tests/_bp-sheet.js out.png mode [dpr]
//   mode: walk (12 frames of one steady gait cycle, ground marks so planted feet can be checked), loco (start, walk, turn,
//   stop, settle), idle (12 frames over 13 s), rush | crown | carapace | stamp (each power's key frames), ult (Dominion's phases)
//   Prints JSON: per-frame draw ms, and for walk the feet's slide (world travel of a planted foot over its stance, model units)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v430-BP/walk.png', MODE = process.argv[3] || 'walk', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const W = 1500, H = 900;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-bp.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(({ MODE, W, H, DPR }) => { void 0;
    window.__BL_GL = 1; window.__BL_GLHQ = 1; window.__NG_GL = 1; const G = window.BELIAL_GL, MV = window.BELIAL_MOVES, TAU = Math.PI * 2;
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#14100E'); g.addColorStop(0.55, '#3A2A22'); g.addColorStop(1, '#100C0A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.ensure();
    const lab = (x, y, s) => { c.fillStyle = '#F2D9A0'; c.font = '600 13px sans-serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const ZM = /z$/.test(MODE); if (ZM) MODE = MODE.slice(0, -1); const SE = Math.sin(0.62), K = ZM ? 18 : 13;   // (a mode ending in z: closer, 4 a row, 8 frames)
    // ground marks: a grid in the ground plane (model units), scrolled by the distance travelled (tu along the heading) and turned by yaw
    const marks = (X0, Y0, yaw, tu) => { c.save(); for (let u = -6; u <= 6; u += 1) for (const v of [-2.25, -1, 0, 1, 2.25]) { const uu = u - (tu % 1), x = uu * Math.cos(yaw) - v * Math.sin(yaw), y = uu * Math.sin(yaw) + v * Math.cos(yaw); c.fillStyle = Math.abs(v) > 2 ? 'rgba(255,214,140,.55)' : 'rgba(255,214,140,.22)'; c.fillRect(X0 + x * K - 1.5, Y0 + y * SE * K - 1.5, 3, 3); } c.restore(); };
    // the driver: a fight-like instance (pose eased, springs, the gait's phase from the distance at the moves' speed)
    const inst = { at: 0, ph: 0, mv: 0, yaw: 0.35, vx: 0, vy: 0, lvx: 0, lvy: 0, ax: 0, ay: 0, tu: 0 };
    const STR = G.STRIDE || 2.1;
    function stepI(dt, o) {   // o: speed (model units / s, signed), yawT, kind, kt (the power's time), args
      inst.at += dt; const sp = o.speed || 0;
      inst.mv += (Math.min(1, Math.abs(sp) / 3.4) - inst.mv) * Math.min(1, dt * 4);
      if (o.yawT != null) { const d = Math.atan2(Math.sin(o.yawT - inst.yaw), Math.cos(o.yawT - inst.yaw)), rate = 1.5 * dt; inst.yaw += Math.max(-rate, Math.min(rate, d * Math.min(1, dt * 4) * 6)); }
      const dd = sp * dt; inst.tu += dd; inst.ph += Math.abs(dd) / Math.max(0.05, STR * Math.max(0.3, inst.mv)) * TAU * Math.sign(dd || 1);
      const vx = Math.cos(inst.yaw) * sp, vy = Math.sin(inst.yaw) * sp; inst.ax += ((vx - inst.lvx) / dt - inst.ax) * 0.3; inst.ay += ((vy - inst.lvy) / dt - inst.ay) * 0.3; inst.lvx = vx; inst.lvy = vy;
      G.springs(inst, inst.ax, inst.ay, dt);
      const base = G.idlePose(3, inst.at);
      const tg = o.ult != null ? MV.ultPose(o.ult) : MV.poseFor(o.kind || null, o.kt || 0, Object.assign({ base, k: 3 }, o.args || {}));
      const pz = MV.easePose(inst, tg, dt);
      inst.blP = Object.assign(base, pz, { k: 3, t: inst.at, yaw: inst.yaw + (o.ult != null ? tg.yawOff || 0 : 0), ph: inst.ph, mv: o.ult != null ? 0 : inst.mv, feet: pz.feet, asm: 1, dis: tg.dis || 0, monoDis: tg.monoDis || 0, halo: tg.halo == null ? 1 : tg.halo, live: pz.live });
    }
    const cells = []; let n = 0; const res = { mode: MODE, ms: [], slide: null };
    const NC = ZM ? 4 : 6, cellXY = i => ZM ? [200 + (i % 4) * 370, i < 4 ? 400 : 860] : [140 + (i % 6) * 245, i < 6 ? 400 : 850];
    const shoot = (name) => { const [x, y] = cellXY(n++); marks(x, y, inst.yaw, inst.tu); const t1 = performance.now(); const o = G.draw(c, { X: x, Y: y, K, P: inst.blP, k: 3, inst }); res.ms.push(Math.round(performance.now() - t1)); if (o) G.coreLight(c, o, inst.blP, 1); lab(x, y + 44, name); };
    const run = (sec, o) => { const m = Math.round(sec * 60); for (let i = 0; i < m; i++) stepI(1 / 60, typeof o === 'function' ? o(i / 60) : o); };
    if (MODE === 'walk') {
      run(4, { speed: 3.4, yawT: 0.35 });   // (to a steady walk)
      const ph0 = inst.ph; let prev = ph0;
      for (let f = 0; f < (ZM ? 8 : 12); f++) { const want = ph0 + TAU * f / (ZM ? 8 : 12); while (inst.ph < want - 1e-6) stepI(1 / 120, { speed: 3.4, yawT: 0.35 }); shoot(`walk ${f}/${ZM ? 8 : 12}`); void prev; }
      // the slide: a planted foot's travel in the world over its stance (from the pure gait at mv 1 and 0.5), model units
      const sl = mv => { let worst = 0; for (let i = 0; i < 4; i++) { let w0 = null, last = null; for (let s = 0; s <= 2000; s++) { const ph = s / 1000 * TAU, gg = G.gait(ph, mv)[i], world = gg.dx + ph / TAU * STR * Math.max(0.3, mv); if (!gg.sw && gg.lift < 0.001) { if (w0 == null) w0 = world; last = world; worst = Math.max(worst, Math.abs(last - w0)); } else w0 = null; } } return +worst.toFixed(3); };
      res.slide = { mv1: sl(1), mv05: sl(0.5) };
    } else if (MODE === 'loco') {
      shoot('rest'); run(0.6, { speed: 3.4, yawT: 0.35 }); shoot('start 0.6s'); run(0.6, { speed: 3.4, yawT: 0.35 }); shoot('accel 1.2s'); run(1.4, { speed: 3.4, yawT: 0.35 }); shoot('walk 2.6s');
      run(0.5, { speed: 3.4, yawT: 1.4 }); shoot('turn 0.5s'); run(0.5, { speed: 3.4, yawT: 1.4 }); shoot('turn 1.0s'); run(0.7, { speed: 3.4, yawT: 1.4 }); shoot('turned');
      run(0.35, { speed: 0, yawT: 1.4 }); shoot('stop 0.35s'); run(0.35, { speed: 0 }); shoot('stop 0.7s'); run(0.6, { speed: 0 }); shoot('settle 1.3s');
      run(0.9, { speed: 0, yawT: -0.3 }); shoot('turn in place'); run(1.6, { speed: 0, yawT: -0.3 }); shoot('settled');
    } else if (MODE === 'idle') {
      for (let f = 0; f < 12; f++) { run(f ? 1.1 : 0.5, { speed: 0 }); shoot(`idle ${inst.at.toFixed(1)}s`); }
    } else if (MODE === 'rush') {
      const wind = 0.95, ch = 1.1, args = { wind, charge: ch, k: 3 }; let t = 0; const at = [0.15, 0.4, 0.7, 0.92, 1.3, 1.8, wind + ch - 0.04, wind + ch + 0.1, wind + ch + 0.3, wind + ch + 0.55, wind + ch + 0.9, wind + ch + 1.5];
      for (const T of at) { while (t < T) { const dt = 1 / 60; t += dt; stepI(dt, { kind: 'rush', kt: t, args, speed: t > wind && t < wind + ch ? 11.6 * Math.min(1, (t - wind) / 0.3) : 0 }); } shoot(`rush ${t.toFixed(2)}s`); }
    } else if (MODE === 'crown') {
      const args = { dur: 4.0, k: 3 }; let t = 0; for (const T of [0.15, 0.35, 0.6, 0.9, 1.4, 2.0, 2.45, 2.6, 3.4, 3.95, 4.15, 4.6]) { while (t < T) { const dt = 1 / 60; t += dt; const pl = Math.max(0, 1 - Math.abs(((t - 1.6) % 1 + 1) % 1 - 0) / 0.35) * (t > 1.6 ? 1 : 0); stepI(dt, { kind: 'crown', kt: t, args: Object.assign({ pulse: pl }, args) }); } shoot(`crown ${t.toFixed(2)}s`); }
    } else if (MODE === 'carapace') {
      const args = { dur: 5.0, k: 3 }; let t = 0; for (const T of [0.1, 0.3, 0.55, 0.8, 1.2, 2.0, 3.5, 4.8, 5.02, 5.15, 5.5, 6.0]) { while (t < T) { const dt = 1 / 60; t += dt; stepI(dt, { kind: 'carapace', kt: t, args }); } shoot(`carapace ${t.toFixed(2)}s`); }
    } else if (MODE === 'stamp') {
      const args = { n: 7, gap: 0.55, k: 3, tailT: 0.45 + 3 * 0.55 + 0.275 }; let t = 0; for (const T of [0.15, 0.3, 0.45, 0.6, 0.85, 1.0, 1.55, 2.1, 2.3, 3.75, 3.95, 4.6]) { while (t < T) { const dt = 1 / 60; t += dt; stepI(dt, { kind: 'stamp', kt: t, args }); } shoot(`stamp ${t.toFixed(2)}s`); }
    } else if (MODE === 'ult') {
      const U = MV.UT; let t = 0; for (const T of [0.8, U.p1, 3.0, U.p2, 5.2, U.p3, 7.4, U.slam - 0.1, U.slam + 0.08, U.pulse2 + 0.1, U.p6 + 0.3, U.len - 0.4]) { while (t < T) { const dt = 1 / 60; t += dt; stepI(dt, { ult: t }); } shoot(`ult ${t.toFixed(2)}s`); }
    }
    return res;
  }, { MODE, W, H, DPR });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
