// (v444 SL) Samael animation strips: the model alone on a dark crimson backdrop, rows of frames through a stretch of time, the motion
// (planted feet, inertia, the tail's chain) and the pose springs (SAMAEL_MOVES.easePose) stepped at 60 Hz between the drawn frames (the
// in-between frames posed in full with the GPU's draw calls skipped), the body light (snorts, heat) from a moves instance over each frame.
// usage: HTML=test-sl.html node tests/_sl-strips.js [out.png] [set: move|powers] [dpr]
//   move: idle 6 s, walk, gallop, turn, Cataclysm idle; powers: Hellbreak Charge (a boss's long wind-up: two scrapes and a stamp, the
//   brake), Horns of Perdition, Furnace Overdrive, First Impact, the roar
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v444-SL/strips-move.png', SET = process.argv[3] || 'move', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const COLS = 12, CW = 150, RH = 168, ROWS = 5, W = COLS * CW + 110, H = ROWS * RH + 30;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const o = G.prototype.drawElements; G.prototype.drawElements = function () { if (window.__NODRAW) return; return o.apply(this, arguments); }; } });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sl.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(async ({ SET, W, H, DPR, COLS, CW, RH }) => {
    window.__SM_GL = 1; window.__SM_GLHQ = 1; window.__NG_GL = 1; const SG = window.SAMAEL_GL, MV = window.SAMAEL_MOVES; SG.ensure();
    const inst0 = MV.create({ X: {}, me: {}, g: {}, T: () => 40, ST: () => ({}), S: { list: [] }, P: () => 1, near: () => [], living: () => [], hit: () => {} });
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120712'); g.addColorStop(0.55, '#2A0E16'); g.addColorStop(1, '#0C0406'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const lab = (x, y, s, al) => { c.fillStyle = '#F2C9A0'; c.font = '600 12px serif'; c.textAlign = al || 'center'; c.fillText(s, x, y); };
    const TAU = Math.PI * 2, K = 5.6;
    /* a row: f(t) -> { kind, pt, o, base overrides, yaw, ph, mv, gal, gk } at time t; frames drawn at the sample times */
    const row = async (ri, name, dur, samples, f) => {
      const inst = {}, store = {}; let ph = 0; const y = 20 + ri * RH + RH - 22; lab(8, 20 + ri * RH + 14, name, 'left');
      const N = Math.round(dur * 60), at = samples.map(s => Math.round(s * 60));
      for (let i = 0; i <= N; i++) { const t = i / 60, q = f(t), base = SG.idlePose(3, 0.7 + t, q.base || {});
        const tg = q.kind === 'ult' ? MV.ultPose(q.pt, {}) : MV.poseFor(q.kind || 'rest', q.pt || 0, Object.assign({ base, k: 3 }, q.o || {}));
        if (q.over) Object.assign(tg, q.over(tg));
        const pz = MV.easePose(store, tg, 1 / 60); ph += (q.phr || 0) * TAU / 60;
        const P = Object.assign(base, pz, { k: 3, t: 0.7 + t, yaw: q.yaw == null ? 0.45 : q.yaw, ph, mv: q.mv || 0, gal: q.gal || 0, feet: pz.feet, gaitK: q.gk || 1, live: pz.live });
        const j = at.indexOf(i), x = 70 + (j >= 0 ? j : 0) * CW + CW / 2;
        window.__NODRAW = j < 0 ? 1 : 0;
        const o = SG.draw(c, { X: j >= 0 ? x : -9999, Y: y - (q.z || 0) * 9, K, P, k: 3, inst });
        window.__NODRAW = 0;
        if (j >= 0) { if (o) { SG.coreLight(c, o, P, 1); inst0.bodyLight(c, o, P, 1, P.t); } lab(x, y + 16, (samples[j]).toFixed(2) + ' s'); }
        if (i % 120 === 0) await new Promise(r => setTimeout(r, 0));
      }
    };
    const s = (n, d, t0) => Array.from({ length: n }, (_, i) => (t0 || 0) + i * d);
    if (SET === 'move') {
      await row(0, 'IDLE 6 s', 6.0, s(12, 0.5, 0.5), t => ({ kind: 'rest' }));
      await row(1, 'WALK', 2.0, s(12, 0.1, 0.9), t => ({ kind: 'rest', mv: 1, phr: 1.1, yaw: 0 }));
      await row(2, 'GALLOP', 1.4, s(12, 0.034, 0.95), t => ({ kind: 'rest', mv: 1, gal: 1, gk: 1.7, phr: 2.6, yaw: 0, over: () => ({ head: 0.8, hornFwd: 1, crest: -0.75 }) }));
      await row(3, 'TURN', 2.6, s(12, 0.18, 0.6), t => ({ kind: 'rest', mv: 0.45, phr: 0.5, yaw: 0.2 + Math.min(2.6, t * 1.6) }));
      await row(4, 'CATACLYSM IDLE', 3.6, s(12, 0.25, 0.85), t => ({ kind: 'rest', base: {}, over: tg => ({ heat: 0.85 + 0.15 * Math.sin(t * 23), vent: 1, horn: 0.35, core: (tg.core || 0.9) + 1.2, glow: (tg.glow || 0) + 0.35, dorsal: 0.7 }) }));
    } else {
      const w = 1.2, ct = 0.8, tI = w + ct;
      await row(0, 'HELLBREAK CHARGE', 3.0, [0.05, 0.16, 0.3, 0.45, 0.62, 0.8, 0.95, 1.15, 1.6, 2.02, 2.25, 2.7], t => { const go = t > w && t < tI; return { kind: 'charge', pt: t, o: { wind: w, charge: ct, first: true, last: true }, mv: go ? 1 : t > tI ? Math.max(0, 1 - (t - tI) * 4) : 0, gal: go ? 1 : 0, gk: go ? 1.7 : 1, phr: go ? 2.6 : 0, yaw: 0 }; });
      await row(1, 'HORNS OF PERDITION', 4.4, s(12, 0.3, 0.3), t => ({ kind: 'perd', pt: t, o: { wind: 0.9, n: 5, gap: 0.8, k: 3 } }));
      await row(2, 'FURNACE OVERDRIVE', 2.6, s(12, 0.18, 0.2), t => ({ kind: 'over', pt: t, o: { wind: 1.15 } }));
      await row(3, 'FIRST IMPACT', 3.2, [0.3, 0.6, 0.8, 1.0, 1.4, 1.9, 2.15, 2.2, 2.26, 2.35, 2.6, 3.0], t => { const C = { cr: 0.7, rise: 0.55, hang: 0.9, dive: 0.3 }, t4 = 2.45, hz = t < 0.7 ? 0 : t < 1.25 ? 1 - Math.pow(1 - (t - 0.7) / 0.55, 3) : t < 2.15 ? 1 : t < t4 ? 1 - Math.pow((t - 2.15) / 0.3, 2) : 0; return { kind: 'impact', pt: t, o: C, z: 4.2 * hz }; });
      await row(4, 'THE ROAR', 1.7, s(12, 0.13, 0.08), t => ({ kind: 'roar', pt: t }));
    }
    return { ok: true };
  }, { SET, W, H, DPR, COLS, CW, RH });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
