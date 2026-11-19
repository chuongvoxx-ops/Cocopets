// (v426 BL) Belial studio: renders the GPU model alone (turnaround, forms, poses) on a plain dusk backdrop.
// usage: HTML=test-bl.html node tests/_bl-studio.js [out.png] [mode] [dpr]
//   mode: turn (front / side / back / 3-4 at the last form, the three forms), poses (walk, charge, crown, carapace, stampede, ultimate),
//   parts (the World Pillar's stages, rocks, gravity rings), low (the low profile)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v426-BL/studio.png', MODE = process.argv[3] || 'turn', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const W = 1500, H = 900;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-bl.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  await page.evaluate(y => { window.__YAW = y; }, process.env.YAW || '0.62');
  const r = await page.evaluate(({ MODE, W, H, DPR }) => {
    window.__BL_GL = 1; window.__BL_GLHQ = 1; window.__NG_GL = 1; const BL = window.BELIAL_GL; if (MODE === 'low') { window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; }
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#14100E'); g.addColorStop(0.55, '#3A2A22'); g.addColorStop(1, '#100C0A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = performance.now(); const ok = BL.ensure(); const tb = performance.now() - t0;
    const lab = (x, y, s) => { c.fillStyle = '#F2D9A0'; c.font = '600 14px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const cells = [], P = (k, o) => BL.idlePose(k, 0.7, o);
    if (MODE === 'turn' || MODE === 'low') {
      [[Math.PI / 2, 'FRONT'], [0, 'SIDE'], [-Math.PI / 2, 'BACK'], [0.62, '3/4']].forEach(([yaw, n], i) => cells.push({ x: 190 + i * 330, y: 440, K: 19, k: 3, P: P(3, { yaw }), n }));
      [1, 2, 3].forEach((k, i) => cells.push({ x: 260 + i * 420, y: 860, K: 22 * [0, 0.8, 0.9, 1][k], k, P: P(k, { yaw: 0.62 }), n: ['', 'BELIAL', 'ASCENDED BELIAL (L4)', 'CELESTIAL BELIAL (L7)'][k] }));
    } else if (MODE === 'one') {
      const yw = +(window.__YAW || 0.62); cells.push({ x: 560, y: 820, K: 52, k: 3, P: P(3, { yaw: yw }), n: 'k3' }); cells.push({ x: 1250, y: 820, K: 30, k: 3, P: P(3, { yaw: yw + Math.PI / 2 }), n: 'k3b' });
    } else if (MODE === 'poses') {
      const L = [
        ['WALK', P(3, { yaw: 0.4, ph: 1.3, mv: 1 })],
        ['THRONEBREAKER (CHARGE)', P(3, { yaw: 0.4, head: 0.9, crouch: 0.6, horn: 1, ringK: 4, ringOut: 0.4, glow: 0.5, jaw: 0.3 })],
        ['CROWN OF BURDENS', P(3, { yaw: 0.4, head: -0.7, horn: 1, ringK: 3, ringOut: 1, jaw: 0.7, core: 1.6 })],
        ['CITADEL CARAPACE', P(3, { yaw: 0.4, cit: 1, bast: 0.8, mono: 1, core: 2, glow: 0.6, crouch: 0.3 })],
        ['GRAVITON STAMPEDE', P(3, { yaw: 0.4, rear: 0.5, core: 2.2, horn: 0.6, tail: 0.6, glow: 0.4 })],
        ['DOMINION (ULTIMATE)', P(3, { yaw: 0.4, rear: 0.9, coreOpen: 1, core: 3, citUp: 1, horn: 1, hornAlign: 1, ringK: 5, ringOut: 1, mono: 0.5, glow: 1 })],
        ['ROAR', P(3, { yaw: 0.4, head: -0.3, jaw: 1, horn: 0.5 })],
        ['DISSOLVE', P(3, { yaw: 0.4, dis: 0.45 })],
        ['ASSEMBLY', P(3, { yaw: 0.4, asm: 0.55 })],
      ];
      L.forEach(([n, Pp], i) => cells.push({ x: 180 + (i % 5) * 285, y: i < 5 ? 400 : 860, K: 17, k: 3, P: Pp, n }));
    }
    const res = [];
    for (const C of cells) { const t1 = performance.now(); const o = BL.draw(c, { X: C.x, Y: C.y, K: C.K, P: C.P, k: C.k }); res.push([C.n, !!o, Math.round(performance.now() - t1)]); lab(C.x, C.y + 24, C.n); if (o) BL.coreLight(c, o, C.P, 1); }
    if (MODE === 'cel') {
      // the cel fallback (no WebGL): front / side / 3-4, three forms
      window.__BL_GL = 0; const AA = window.__pp.AnimaArt, A = { draw: (c, id, k, x, y, sz, t, o) => AA.draw(c, id, k, x, y, sz, t, o) }; [[Math.PI / 2 - 0.001, 'CEL SIDE'], [0.0001, 'CEL FRONT'], [0.95, 'CEL 3/4'], [-0.95, 'CEL 3/4 L']].forEach(([yaw, n], i) => { A.draw(c, 'taurus', 3, 190 + i * 340, 420, 260, 0.7, { yaw }); lab(190 + i * 340, 444, n); });
      [1, 2, 3].forEach((k, i) => { A.draw(c, 'taurus', k, 260 + i * 420, 850, 240 * [0, 0.8, 0.9, 1][k], 0.7, {}); lab(260 + i * 420, 874, 'CEL k' + k); });
    }
    if (MODE === 'parts') {
      const list = []; [0.2, 0.5, 0.8, 1].forEach((h, i) => list.push({ m: 'pillar', X: 200 + i * 260, Y: 600, s: 60, h, t: 1, gl: 0.3 + i * 0.3, g2: i * 0.5 }));
      list.push({ m: 'pillar', X: 1250, Y: 600, s: 60, h: 1, t: 1, drums: [{}, { lift: 40, rot: 0.3 }, { lift: 90, rot: -0.4, tip: 0.3 }, { lift: 140, rot: 0.5, tip: -0.4 }, { lift: 200 }] });
      for (let i = 0; i < 4; i++) list.push({ m: 'rock', X: 200 + i * 120, Y: 800, s: 30, yaw: i, tilt: i * 0.7 });
      list.push({ m: 'gring', X: 900, Y: 800, s: 70, tilt: 0.0 }); list.push({ m: 'mono', X: 1200, Y: 780, s: 50 });
      res.push(['parts', BL.drawParts(c, list, { res: 1 })]);
    }
    return { ok, tb: Math.round(tb), nv: BL.nv, res, stats: BL.STATS, gl: window.GLM && GLM.stats, gpu: BL.gpuCount() };
  }, { MODE, W, H, DPR });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
