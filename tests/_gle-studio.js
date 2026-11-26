// v451 GE: Golden Eagle's studio sheets: the eagle alone (GLM forced on the software rasteriser): a turnaround, the wingbeat's poses,
// the feather groups up close, the dissolve, and the painted 2D eagle for comparison; the waves' painter kinds on a floor swatch.
// usage: HTML=<test html> node tests/_gle-studio.js   env: OUT (shots/v451-GE), DPR (1), ONLY (a comma list of sheet names)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v451-GE'); fs.mkdirSync(OUT, { recursive: true });
  const DPR = +(process.env.DPR || 1), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Eagle|GLM|shader|FGFX|Nidhogg/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 600)); });
  await page.addInitScript(() => { window.__GE_GL = 1; window.__GE_GLHQ = 1; window.__NG_GL = 1; });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  const sheet = async (name, spec, opt) => {
    if (ONLY && !ONLY.includes(name)) return;
    const r = await page.evaluate(async ([spec, opt]) => {
      const G = window.GOLDEAGLE_GL, cv = document.createElement('canvas'), W = 1200, Hh = 760, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = Hh * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:760px;z-index:99999'; document.body.appendChild(cv);
      const c = cv.getContext('2d'); c.scale(dpr, dpr); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, opt && opt.bg ? opt.bg[0] : '#3A4A44'); gr.addColorStop(1, opt && opt.bg ? opt.bg[1] : '#1A2420'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 1, Hh); for (let y = 0; y < Hh; y += 22) c.fillRect(0, y, W, 1);
      const out = [];
      for (const s of spec) { const wp = typeof s.wing === 'string' ? G.WP[s.wing] : s.wing ? G.wmix(G.WP[s.wing[0]], G.WP[s.wing[1]], s.wing[2]) : G.WP.rest;
        const P = { x: 0, y: 0, z: 0, yaw: s.yaw || 0, pitch: s.pitch || 0, roll: s.roll || 0, sc: s.sc || 1, wing: wp, tail: { fan: s.tf == null ? 0.8 : s.tf, pitch: s.tp || 0 }, head: { pitch: s.hp || 0, yaw: s.hy || 0 }, leg: s.leg == null ? 0.4 : s.leg, jaw: s.jaw || 0, glow: s.glow == null ? 1 : s.glow, glow2: s.glow2 || 0, spill: s.spill || 0, t: s.t || 1.3, k: s.k || 0 };
        const t0 = performance.now(); const r = G.studio(c, s.x, s.y, P, { T: s.T || 60, d2: !!s.d2 }); out.push({ gl: r.gl, ms: Math.round(performance.now() - t0), items: G.STATS.items, W: G.STATS.W, H: G.STATS.H });
        c.fillStyle = '#EEE'; c.font = '14px sans-serif'; c.fillText(s.label || '', s.x - 70, s.y + (s.ly || 150)); }
      if (opt && opt.fx) { // the waves' painter kinds on a floor swatch (FGFX)
        const F = window.NIDHOGG_MOVES.FGFX, Q = F.begin(c, null), T = 46, GY = 0.55;
        c.fillStyle = '#B9AE90'; c.fillRect(0, 380, W, 380); const Q2 = Q; void Q2;
        const crescent = (cx, cy, dir, hw, s, fin, h) => { const dx = Math.cos(dir), dy = Math.sin(dir), nx = -dy, ny = dx, NS = 16, dO = 2 * hw / NS, curv = fin ? 0.15 : 0.2, lean = 0.65 * h;
          for (const layer of [0, 1]) for (let i = 0; i < NS; i++) { const of0 = -hw + i * dO, of1 = of0 + dO, s0 = s - curv * of0 * of0, s1 = s - curv * of1 * of1, X0 = cx + (dx * s0 + nx * of0) * T, Y0 = cy + (dy * s0 + ny * of0) * T * GY, X1 = cx + (dx * s1 + nx * of1) * T, Y1 = cy + (dy * s1 + ny * of1) * T * GY, ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, q0 = of0 / hw, q1 = dO / hw + 4 * ((i === 0 ? 1 : 0) + (i === NS - 1 ? 2 : 0)), col = fin ? '#FF0000' : '#000000';
            if (!layer) { const tl = fin ? 2.1 : 1.5, pad = tl * 0.12 / 0.88, bx = -dx * (tl + pad) / 2 * T, by = -dy * (tl + pad) / 2 * T * GY, X = (X0 + X1) / 2 + dx * pad * T + bx, Y = (Y0 + Y1) / 2 + dy * pad * T * GY + by; Q.quad(371, X, Y, ux, uy, bx, by, col, 1, q0, q1, s); Q.quad(370, X, Y, ux, uy, bx, by, col, 1, q0, q1, s); }
            else { const Hx = dx * lean * T, Hy = (dy * lean * GY - h * 0.835) * T, X = (X0 + X1) / 2 + Hx / 2, Y = (Y0 + Y1) / 2 + Hy / 2; Q.quad(368, X, Y, ux, uy, -Hx / 2, -Hy / 2, col, 1, q0, q1, s); Q.quad(369, X, Y, ux, uy, -Hx / 2, -Hy / 2, col, 1, q0, q1, s); } } };
        crescent(200, 600, -Math.PI / 2, 2.2, 0, false, 0.7); crescent(520, 520, Math.PI / 2, 2.4, 0, false, 0.7); crescent(820, 600, 0, 2.6, 0, false, 0.7); crescent(1060, 640, -Math.PI / 2, 3.4, 0, true, 1.0);
        Q.quad(373, 200, 700, 110, 0, 0, 60, '#FFFFFF', 1, 0.6, 1.7, 1.0); Q.quad(372, 1050, 170, 130, 0, 0, 104, '#FFFFFF', 1, 1, 0.37, 0);
        for (let i = 0; i < 6; i++) Q.rq(374, 640 + i * 40, 430, 18, 8, i * 0.6, '#FFFFFF', 1, i / 6, (i - 3) * 0.2, i > 3 ? 0.5 : 0);
        const rb = (ax, ay, bx, by, m, w, col, a0, a1) => { const ux = (bx - ax) / 2, uy = (by - ay) / 2, l = Math.hypot(ux, uy), px = -uy / l, py = ux / l, Hh2 = Math.abs(m) / 2 + 2.6 * w; Q.quad(375, (ax + bx) / 2 + px * m / 2, (ay + by) / 2 + py * m / 2, ux, uy, px * Hh2, py * Hh2, col, 1, m / Hh2, w / Hh2, Math.floor(a0 * 99) + a1 * 0.99); };
        rb(900, 420, 1150, 470, 40, 4, '#A8FFE0', 0.1, 0.9); rb(900, 470, 1150, 520, -30, 3, '#FFEFC4', 0.9, 0.1);
        F.flush(c); }
      return out; }, [spec, opt]);
    await page.screenshot({ path: path.join(OUT, 'studio-' + name + (DPR > 1 ? '-dpr' + DPR : '') + '.png') }); await page.evaluate(() => { document.querySelectorAll('canvas[style*="99999"]').forEach(e => e.remove()); }); console.log(name, JSON.stringify(r));
  };
  const yawS = Math.PI / 2;   // (facing south: toward the camera)
  await sheet('turn', [
    { x: 230, y: 230, yaw: 0, wing: 'rest', label: 'side (facing east), wings spread', T: 46 }, { x: 800, y: 230, yaw: -Math.PI / 2, wing: 'rest', label: 'from behind (facing north)', T: 46, pitch: 0.2 },
    { x: 230, y: 560, yaw: yawS, wing: 'rest', label: 'toward the camera', T: 46, pitch: 0.25, hp: -0.2 }, { x: 800, y: 560, yaw: -0.6, wing: 'glide', label: 'gliding (3/4)', T: 46, tf: 0.4 } ]);
  await sheet('beat', [
    { x: 200, y: 260, yaw: -Math.PI / 2, wing: 'top', label: 'top of the stroke', T: 36, pitch: 0.5, hp: -0.4 }, { x: 600, y: 260, yaw: -Math.PI / 2, wing: ['top', 'bottom', 0.5], label: 'downstroke', T: 36, pitch: 0.5, hp: -0.4 },
    { x: 1000, y: 260, yaw: -Math.PI / 2, wing: 'bottom', label: 'bottom: the wave leaves', T: 36, pitch: 0.5, hp: -0.4 }, { x: 200, y: 590, yaw: -Math.PI / 2, wing: 'mid', label: 'upstroke (flexed)', T: 36, pitch: 0.5, hp: -0.4 },
    { x: 600, y: 590, yaw: -Math.PI / 2, wing: 'widest', label: 'the widest span: the inhale', T: 36, pitch: 0.5, hp: -0.4, jaw: 0.5, glow: 2, glow2: 0.4 }, { x: 1000, y: 590, yaw: -Math.PI / 2, wing: 'fold', label: 'folded', T: 36, pitch: 0.2, tf: 0.1 } ]);
  await sheet('close', [
    { x: 330, y: 380, yaw: 0.35, wing: 'rest', label: 'head and chest', T: 210, pitch: 0.4, hp: -0.4, ly: 340 }, { x: 900, y: 300, yaw: -Math.PI / 2 - 0.25, wing: 'rest', label: 'the wing\'s feather groups', T: 80, pitch: 0.15, roll: 0.25 } ]);
  await sheet('dissolve', [
    { x: 230, y: 330, yaw: -Math.PI / 2, wing: 'top', label: 'dissolving 0.3', T: 40, pitch: 0.7, spill: 0.3 }, { x: 600, y: 330, yaw: -Math.PI / 2, wing: 'top', label: 'dissolving 0.6', T: 40, pitch: 0.7, spill: 0.6 },
    { x: 980, y: 330, yaw: -Math.PI / 2, wing: 'rest', label: 'painted 2D fallback', T: 40, d2: true, pitch: 0.4 } ]);
  await sheet('fx', [{ x: 300, y: 200, yaw: -Math.PI / 2, wing: 'bottom', label: 'waves: north, south, east; the final; ring; feathers; ribbons', T: 30, pitch: 0.5, ly: 150 }], { fx: true });
  console.log('errors', JSON.stringify(errors.slice(0, 6))); await browser.close();
})();
