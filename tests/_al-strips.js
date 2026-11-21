// (v446 AL) Asmodeus animation strips, as v444's tests/_sl-strips.js: the model alone on a dark crimson backdrop, rows of frames through a
// stretch of time, the motion (planted feet, inertia, the tails' chains) and the pose springs (ASMODEUS_MOVES.easePose) stepped at 60 Hz
// between the drawn frames (the in-between frames posed in full with the GPU's draw calls skipped), the body light from a moves instance.
// usage: HTML=<test html> node tests/_al-strips.js [out.png] [set: move|powers] [dpr]
//   move: idle 6 s, walk, run (the stalk), turn (her head tracking a quarry off to the side), her last 5 s (restless);
//   powers: Sevenfold Perdition, Crimson Labyrinth, Eclipse Molt, Scarlet Rupture, The Seventh Sin's start
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v446-AL/strips-move.png', SET = process.argv[3] || 'move', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const COLS = 12, CW = 150, RH = 178, ROWS = 5, W = COLS * CW + 110, H = ROWS * RH + 30;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const o = G.prototype.drawElements; G.prototype.drawElements = function () { if (window.__NODRAW) return; return o.apply(this, arguments); }; } });
  const html = process.env.HTML || 'test-al.html'; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(async ({ SET, W, H, DPR, COLS, CW, RH }) => {
    window.__AS_GL = 1; window.__AS_GLHQ = 1; window.__NG_GL = 1; const AG = window.ASMODEUS_GL, MV = window.ASMODEUS_MOVES; AG.ensure();
    const inst0 = MV.create({ X: {}, me: {}, g: {}, T: () => 40, ST: () => ({}), S: { list: [] }, P: () => 1, near: () => [], living: () => [], hit: () => {} });
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120712'); g.addColorStop(0.55, '#2A0E16'); g.addColorStop(1, '#0C0406'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const lab = (x, y, s, al) => { c.fillStyle = '#F2C9A0'; c.font = '600 12px serif'; c.textAlign = al || 'center'; c.fillText(s, x, y); };
    const TAU = Math.PI * 2, K = 5.2;
    // the tails' targets for the powers (tail space; in front of her and a little to each side)
    const aims = [3, 1, 5, 2, 4, 0, 6].map((i, n) => ({ i, A: AG.toTail([9 + (n % 3), (n - 3) * 1.6, 0.8]), Af: AG.toTail([10, 0, 0.6]) }));
    /* a row: f(t) -> { kind, pt, o, base overrides, yaw, ph, mv, run, lookA, rest } at time t; frames drawn at the sample times */
    const row = async (ri, name, dur, samples, f) => {
      const inst = {}, store = {}; let ph = 0; const y = 20 + ri * RH + RH - 22; lab(8, 20 + ri * RH + 14, name, 'left');
      const N = Math.round(dur * 60), at = samples.map(s => Math.round(s * 60));
      for (let i = 0; i <= N; i++) { const t = i / 60, q = f(t), base = AG.idlePose(3, 0.7 + t, q.base || {});
        const tg = q.kind === 'ult' ? MV.ultPose(q.pt, { aims, ctr: AG.toTail([10, 0, 0.6]) }) : MV.poseFor(q.kind || 'rest', q.pt || 0, Object.assign({ base, k: 3, aims }, q.o || {}));
        const pz = MV.easePose(store, tg, 1 / 60); ph += (q.phr || 0) * TAU / 60;
        const P = Object.assign(base, pz, { k: 3, t: 0.7 + t, yaw: q.yaw == null ? 0.45 : q.yaw, ph, mv: q.mv || 0, run: q.run || 0, mvA: q.mvA == null ? (q.yaw == null ? 0.45 : q.yaw) : q.mvA, lookA: q.lookA == null ? null : q.lookA, rest: q.rest || 0, strikes: pz.strikes, crouch: (pz.crouch || 0) + 0.45 * (q.run || 0) * (q.mv || 0) });
        if (q.kind === 'ult') { P.yaw += tg.yawOff || 0; P.dis = tg.dis || 0; }
        const j = at.indexOf(i), x = 70 + (j >= 0 ? j : 0) * CW + CW / 2;
        window.__NODRAW = j < 0 ? 1 : 0;
        const o = AG.draw(c, { X: j >= 0 ? x : -9999, Y: y, K, P, k: 3, inst });
        window.__NODRAW = 0;
        if (j >= 0) { if (o) { AG.coreLight(c, o, P, 1); inst0.bodyLight(c, o, P, 1, P.t); } lab(x, y + 16, (samples[j]).toFixed(2) + ' s'); }
        if (i % 120 === 0) await new Promise(r => setTimeout(r, 0));
      }
    };
    const s = (n, d, t0) => Array.from({ length: n }, (_, i) => (t0 || 0) + i * d);
    if (SET === 'move') {
      await row(0, 'IDLE 6 s', 6.0, s(12, 0.5, 0.5), t => ({ kind: 'rest' }));
      await row(1, 'WALK', 2.2, s(12, 0.1, 1.0), t => ({ kind: 'rest', mv: 0.7, phr: 0.75, yaw: 0.2 }));
      await row(2, 'RUN (THE STALK)', 1.6, s(12, 0.05, 1.0), t => ({ kind: 'rest', mv: 1, run: 1, phr: 1.6, yaw: 0.2 }));
      await row(3, 'TURN + TRACKING', 3.2, s(12, 0.22, 0.6), t => ({ kind: 'rest', mv: t < 2.2 ? 0.4 : 0, phr: t < 2.2 ? 0.4 : 0, yaw: 0.2 + Math.min(1.9, t * 1.3), lookA: 2.2 - 1.2 * Math.floor(t / 1.1) % 2 }));
      await row(4, 'LAST 5 s (RESTLESS)', 6.0, s(12, 0.5, 0.5), t => ({ kind: 'rest', rest: Math.min(1, 0.3 + t / 5) }));
    } else {
      await row(0, 'SEVENFOLD PERDITION', 3.6, s(12, 0.27, 0.15), t => ({ kind: 'perd', pt: t, o: { n: 7, k: 3, wind: 0.62, gap: 0.3 } }));
      await row(1, 'CRIMSON LABYRINTH', 2.4, s(12, 0.18, 0.05), t => ({ kind: 'lab', pt: t, o: { aims: aims.slice(0, 4) } }));
      await row(2, 'ECLIPSE MOLT', 2.6, [0.1, 0.25, 0.45, 0.62, 0.72, 0.8, 1.12, 1.22, 1.32, 1.45, 1.8, 2.4], t => ({ kind: 'molt', pt: t }));
      await row(3, 'SCARLET RUPTURE', 3.0, s(12, 0.22, 0.1), t => ({ kind: 'rupt', pt: t }));
      await row(4, 'THE SEVENTH SIN (START)', 4.6, s(12, 0.38, 0.2), t => ({ kind: 'ult', pt: t }));
    }
    return { ok: true };
  }, { SET, W, H, DPR, COLS, CW, RH });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
